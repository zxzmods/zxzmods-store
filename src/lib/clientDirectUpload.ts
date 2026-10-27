export interface DirectUploadProgress {
  loaded: number;
  total: number;
  percentage: number; // 0 - 100
}

export interface DirectUploadOptions {
  folder?: "videos" | "products" | "combos" | "brands" | "payments" | "audios" | "vehicles";
  onProgress?: (progress: DirectUploadProgress) => void;
  lang?: "es" | "en";
}

export interface DirectUploadResult {
  success: boolean;
  url?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
  needsKey?: boolean;
  uploadedDirect?: boolean;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Uploads media directly to Supabase Storage with real-time percentage progress.
 * Bypasses Vercel's 4.5MB serverless body proxy limit (HTTP 413) by streaming the
 * binary directly from the client's browser to the Supabase Storage Bucket CDN.
 */
export async function uploadMediaDirect(
  file: File,
  options: DirectUploadOptions = {}
): Promise<DirectUploadResult> {
  const { folder = "products", onProgress, lang = "es" } = options;

  if (file.size > MAX_FILE_SIZE) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      success: false,
      error:
        lang === "es"
          ? `El archivo pesa ${sizeMb}MB. El límite máximo admitido es de 100MB.`
          : `The file is ${sizeMb}MB. Maximum allowed size is 100MB.`,
    };
  }

  // 1. Check for locally cached override key if entered by admin in backdoor
  let cachedKey = "";
  try {
    cachedKey = localStorage.getItem("zxz_supabase_service_role_key") || "";
  } catch {}

  // 2. Request a Signed Upload URL from server
  let signedUrlRes: Response;
  try {
    signedUrlRes = await fetch("/api/upload/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        folder,
        supabaseKey: cachedKey || undefined,
      }),
    });
  } catch (netErr: any) {
    return {
      success: false,
      error:
        lang === "es"
          ? `Error de conexión al solicitar enlace de subida: ${netErr?.message || "Servidor inaccesible"}`
          : `Connection error requesting upload URL: ${netErr?.message || "Server unreachable"}`,
    };
  }

  const signData = await signedUrlRes.json().catch(() => ({}));

  // 3. Handle Signed Direct Upload if successfully generated
  if (signedUrlRes.ok && signData?.success && signData?.signedUrl) {
    const { signedUrl, publicUrl, fileName, headers = {} } = signData;

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signedUrl, true);

        // Set custom headers (e.g. Content-Type and x-upsert)
        if (headers && Object.keys(headers).length > 0) {
          Object.entries(headers).forEach(([k, v]) => {
            xhr.setRequestHeader(k, String(v));
          });
        } else {
          xhr.setRequestHeader("Content-Type", file.type);
        }

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable && onProgress) {
            const percentage = Math.min(
              100,
              Math.max(0, Math.round((evt.loaded / evt.total) * 100))
            );
            onProgress({
              loaded: evt.loaded,
              total: evt.total,
              percentage,
            });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            if (onProgress) {
              onProgress({
                loaded: file.size,
                total: file.size,
                percentage: 100,
              });
            }
            resolve();
          } else {
            let detail = "";
            try {
              detail = JSON.parse(xhr.responseText)?.message || xhr.statusText;
            } catch {
              detail = xhr.statusText || `HTTP ${xhr.status}`;
            }
            reject(
              new Error(
                lang === "es"
                  ? `Supabase Storage rechazó la carga (${xhr.status}): ${detail}`
                  : `Supabase Storage rejected upload (${xhr.status}): ${detail}`
              )
            );
          }
        };

        xhr.onerror = () => {
          reject(
            new Error(
              lang === "es"
                ? "Error de conexión directo con Supabase Storage (CORS o bloqueo de red)."
                : "Direct connection error with Supabase Storage (CORS or network blockage)."
            )
          );
        };

        xhr.onabort = () => {
          reject(
            new Error(
              lang === "es"
                ? "La subida fue cancelada por el usuario."
                : "Upload was aborted by user."
            )
          );
        };

        xhr.send(file);
      });

      return {
        success: true,
        url: publicUrl,
        fileName,
        fileSize: file.size,
        uploadedDirect: true,
      };
    } catch (directErr: any) {
      console.error("[DIRECT_UPLOAD_FAILED]:", directErr);
      return {
        success: false,
        error: directErr?.message || "Fallo en la subida directa a Supabase Storage.",
      };
    }
  }

  // 4. If signed URL returned missing credentials or error
  if (signData?.needsKey) {
    return {
      success: false,
      error: signData.error,
      needsKey: true,
    };
  }

  // 5. Fallback for files <= 4MB: Try legacy server-side upload if signed URL was unavailable
  if (file.size <= 4 * 1024 * 1024) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const legacyRes = await fetch("/api/sys/upload", {
        method: "POST",
        body: formData,
      });

      const legacyData = await legacyRes.json().catch(() => ({}));
      if (legacyRes.ok && legacyData?.success && legacyData?.url) {
        if (onProgress) {
          onProgress({ loaded: file.size, total: file.size, percentage: 100 });
        }
        return {
          success: true,
          url: legacyData.url,
          fileName: legacyData.fileName,
          fileSize: file.size,
        };
      }

      return {
        success: false,
        error: legacyData?.error || "Error en subida alternativa de archivo.",
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        error: fallbackErr?.message || "Error al procesar subida alternativa.",
      };
    }
  }

  // File is > 4MB and signed URL failed
  return {
    success: false,
    error:
      signData?.error ||
      (lang === "es"
        ? "No se pudo obtener enlace directo de Supabase Storage para este archivo de gran tamaño."
        : "Could not obtain direct Supabase Storage link for this large file."),
  };
}
