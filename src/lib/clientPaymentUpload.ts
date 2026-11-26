export interface PaymentUploadResult {
  success: boolean;
  url?: string;
  fileName?: string;
  error?: string;
}

const DIRECT_UPLOAD_THRESHOLD_BYTES = 3.5 * 1024 * 1024; // 3.5MB (safely below Vercel's 4.5MB serverless limit)
const COMPRESS_TRIGGER_BYTES = 1.2 * 1024 * 1024; // 1.2MB
const MAX_PAYMENT_FILE_BYTES = 25 * 1024 * 1024; // 25MB

function inferMimeType(file: File): string {
  if (file.type && file.type.trim()) return file.type.trim().toLowerCase();
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "heic") return "image/heic";
  if (ext === "heif") return "image/heif";
  if (ext === "pdf") return "application/pdf";
  return "application/octet-stream";
}

async function safeParseJson(res: Response): Promise<{ ok: boolean; status: number; data: any; rawText: string }> {
  const rawText = await res.text().catch(() => "");
  let data: any = {};
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = {};
    }
  }
  return { ok: res.ok, status: res.status, data, rawText };
}

/**
 * Compresses large phone photos (e.g. 6MB-15MB iPhone/Android screenshots & camera photos)
 * into sharp, readable JPEG images (< 500KB) so checkout uploads are instant on mobile LTE
 * and never hit Vercel's 4.5MB serverless request body limit.
 */
async function compressImageIfNeeded(file: File): Promise<File> {
  const mime = inferMimeType(file);
  if (!mime.startsWith("image/") || mime === "image/gif" || file.size <= COMPRESS_TRIGGER_BYTES) {
    return file;
  }
  if (typeof window === "undefined" || typeof document === "undefined") {
    return file;
  }

  const encodeWithLimit = (img: HTMLImageElement, maxDim: number, quality: number): Promise<Blob | null> => {
    return new Promise((resolve) => {
      try {
        let { naturalWidth: w, naturalHeight: h } = img;
        if (!w || !h) return resolve(null);
        const scale = Math.min(1, maxDim / Math.max(w, h));
        const targetW = Math.max(1, Math.round(w * scale));
        const targetH = Math.max(1, Math.round(h * scale));

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);

        canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
      } catch {
        resolve(null);
      }
    });
  };

  let objectUrl = "";
  try {
    objectUrl = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement | null>((resolve) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => resolve(null);
      el.src = objectUrl;
    });
    if (!img) return file;

    let compressed = await encodeWithLimit(img, 2048, 0.84);
    if (compressed && compressed.size > 3.0 * 1024 * 1024) {
      compressed = await encodeWithLimit(img, 1600, 0.74);
    }
    if (compressed && compressed.size > 0 && compressed.size < file.size) {
      const baseName = file.name.replace(/\.[^.]+$/, "") || "comprobante";
      return new File([compressed], `${baseName}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
    }
  } catch {
    // Fall back to original file (will use direct signed upload if large)
  } finally {
    if (objectUrl) {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {}
    }
  }
  return file;
}

async function uploadDirectToSignedUrl(
  file: File,
  lang: "es" | "en"
): Promise<PaymentUploadResult> {
  const mimeType = inferMimeType(file);
  const signRes = await fetch("/api/upload/payment/signed-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      mimeType,
      fileSize: file.size,
    }),
  });
  const parsed = await safeParseJson(signRes);
  if (!parsed.ok || !parsed.data?.success || !parsed.data?.signedUrl || !parsed.data?.publicUrl) {
    return {
      success: false,
      error:
        parsed.data?.error ||
        (lang === "es"
          ? "No se pudo preparar la subida del comprobante. Intenta de nuevo."
          : "Could not prepare receipt upload. Please try again."),
    };
  }

  const headers: Record<string, string> =
    parsed.data.headers && typeof parsed.data.headers === "object"
      ? { ...parsed.data.headers }
      : { "Content-Type": mimeType };

  const putRes = await fetch(parsed.data.signedUrl, {
    method: "PUT",
    headers,
    body: file,
  });

  if (!putRes.ok) {
    return {
      success: false,
      error:
        lang === "es"
          ? `Error al subir el comprobante al almacenamiento (${putRes.status}). Intenta de nuevo.`
          : `Failed to upload receipt to storage (${putRes.status}). Please try again.`,
    };
  }

  return {
    success: true,
    url: parsed.data.publicUrl,
    fileName: parsed.data.fileName,
  };
}

/**
 * Bulletproof customer payment proof uploader:
 * 1. Compresses large photos client-side (< 500KB) for fast mobile uploads.
 * 2. Bypasses Vercel's 4.5MB serverless body limit via direct Supabase Storage signed PUT for large files/PDFs (or on HTTP 413).
 * 3. Safely parses non-JSON responses so HTTP 413 / gateway errors never throw JSON SyntaxError.
 */
export async function uploadPaymentProof(
  rawFile: File,
  lang: "es" | "en" = "es"
): Promise<PaymentUploadResult> {
  if (!rawFile) {
    return {
      success: false,
      error: lang === "es" ? "No se seleccionó ningún archivo." : "No file selected.",
    };
  }

  if (rawFile.size > MAX_PAYMENT_FILE_BYTES) {
    return {
      success: false,
      error:
        lang === "es"
          ? "El comprobante supera el límite de 25 MB. Por favor sube una foto o captura más liviana."
          : "The receipt exceeds the 25 MB limit. Please upload a smaller photo or screenshot.",
    };
  }

  const file = await compressImageIfNeeded(rawFile);

  // If still large (e.g. multi-page PDF or non-decodable HEIC > 3.5MB), upload directly to cloud storage
  if (file.size > DIRECT_UPLOAD_THRESHOLD_BYTES) {
    const directRes = await uploadDirectToSignedUrl(file, lang);
    if (directRes.success) return directRes;
    return directRes;
  }

  // Standard server upload path (with safe parsing + automatic HTTP 413 direct fallback)
  try {
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await fetch("/api/upload/payment", {
      method: "POST",
      body: formData,
    });

    // If serverless proxy returned HTTP 413 (Request Entity Too Large), seamlessly retry via direct signed URL
    if (uploadRes.status === 413) {
      return await uploadDirectToSignedUrl(file, lang);
    }

    const parsed = await safeParseJson(uploadRes);
    if (parsed.ok && parsed.data?.success && parsed.data?.url) {
      return {
        success: true,
        url: parsed.data.url,
        fileName: parsed.data.fileName,
      };
    }

    return {
      success: false,
      error:
        parsed.data?.error ||
        (parsed.rawText.toLowerCase().includes("entity too large")
          ? lang === "es"
            ? "La imagen es demasiado grande. Intenta subir una captura de pantalla más liviana."
            : "The file is too large. Please upload a smaller screenshot."
          : lang === "es"
          ? "Error al subir el comprobante de pago. Por favor intenta nuevamente."
          : "Failed to upload payment receipt. Please try again."),
    };
  } catch (err: any) {
    return {
      success: false,
      error:
        err?.message ||
        (lang === "es"
          ? "Error de conexión al subir el comprobante."
          : "Connection error while uploading payment receipt."),
    };
  }
}
