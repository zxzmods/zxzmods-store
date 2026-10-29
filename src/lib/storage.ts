import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { Storage } from "@google-cloud/storage";

export interface UploadImageResult {
  success: boolean;
  url?: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  error?: string;
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/ogg", "video/x-matroska"];
const ALLOWED_AUDIO_TYPES = ["audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp3", "audio/ogg", "audio/aac", "audio/m4a", "audio/x-m4a", "audio/flac"];
const ALLOWED_DOC_TYPES = ["application/pdf"];

const MAX_IMAGE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_DOC_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Validates file magic bytes (file signature) against expected content.
 */
function verifyMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 8) return false;

  // JPEG: FF D8 FF
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mimeType === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  // WebP: RIFF....WEBP
  if (mimeType === "image/webp") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }

  // GIF: GIF87a or GIF89a
  if (mimeType === "image/gif") {
    const header = buffer.subarray(0, 6).toString("ascii");
    return header === "GIF87a" || header === "GIF89a";
  }

  // MP4 / QuickTime: ftyp, moov, mdat, or wide box in container header
  if (mimeType === "video/mp4" || mimeType === "video/quicktime") {
    const headerStr = buffer.subarray(0, Math.min(buffer.length, 64)).toString("ascii");
    return headerStr.includes("ftyp") || headerStr.includes("moov") || headerStr.includes("mdat") || headerStr.includes("wide");
  }

  // WebM / Matroska: 1A 45 DF A3
  if (mimeType === "video/webm" || mimeType === "video/x-matroska") {
    return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
  }

  // MP3: ID3 or FF FB
  if (mimeType === "audio/mpeg" || mimeType === "audio/mp3") {
    const id3 = buffer.subarray(0, 3).toString("ascii");
    return id3 === "ID3" || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
  }

  // WAV: RIFF....WAVE
  if (mimeType === "audio/wav" || mimeType === "audio/x-wav") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WAVE"
    );
  }

  // PDF: %PDF
  if (mimeType === "application/pdf") {
    return buffer.subarray(0, 4).toString("ascii") === "%PDF";
  }

  // Allow general formats if not explicitly matched
  return true;
}

/**
 * Validates uploaded media buffer and MIME type (Image, Video, Audio, PDF).
 */
export function validateMedia(
  file: { type: string; size: number },
  folder?: string
): { valid: boolean; error?: string; mediaCategory?: "image" | "video" | "audio" } {
  // SVGs are completely disallowed in payments and sensitive folders to prevent Stored XSS
  if (file.type === "image/svg+xml" || file.type.includes("svg")) {
    return {
      valid: false,
      error: "Archivos vectoriales SVG no permitidos por razones de seguridad.",
    };
  }

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type) || file.type.startsWith("image/");
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type) || file.type.startsWith("video/");
  const isAudio = ALLOWED_AUDIO_TYPES.includes(file.type) || file.type.startsWith("audio/");
  const isDoc = ALLOWED_DOC_TYPES.includes(file.type) || file.type === "application/pdf";

  if (!isImage && !isVideo && !isAudio && !isDoc) {
    return {
      valid: false,
      error: `Formato de archivo no soportado (${file.type}). Se permiten imágenes (JPEG, PNG, WebP), videos (MP4, WebM), audios (MP3, WAV) y documentos PDF (hasta 100MB).`,
    };
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: `La imagen excede el límite de 100MB. Tamaño: ${(file.size / (1024 * 1024)).toFixed(2)}MB.` };
  }
  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return { valid: false, error: `El video excede el límite de 100MB. Tamaño: ${(file.size / (1024 * 1024)).toFixed(2)}MB.` };
  }
  if (isAudio && file.size > MAX_AUDIO_SIZE) {
    return { valid: false, error: `El audio excede el límite de 100MB. Tamaño: ${(file.size / (1024 * 1024)).toFixed(2)}MB.` };
  }
  if (isDoc && file.size > MAX_DOC_SIZE) {
    return { valid: false, error: `El documento PDF excede el límite de 100MB. Tamaño: ${(file.size / (1024 * 1024)).toFixed(2)}MB.` };
  }

  return {
    valid: true,
    mediaCategory: isImage ? "image" : isVideo ? "video" : isAudio ? "audio" : "image",
  };
}

export function validateImage(file: { type: string; size: number }) {
  return validateMedia(file);
}

// Google Cloud Storage Client Singleton
let gcsClient: Storage | null = null;
export function getGCSClient(): Storage | null {
  if (gcsClient) return gcsClient;
  const projectId =
    process.env.GCS_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail =
    process.env.GCS_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawKey =
    process.env.GCS_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const privateKey = rawKey?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  try {
    gcsClient = new Storage({
      projectId,
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
    });
    return gcsClient;
  } catch (err) {
    console.error("[GCS_INIT_ERROR]:", err);
    return null;
  }
}

/**
 * Generates a Signed Upload PUT URL for direct browser-to-cloud upload.
 * Prioritizes Supabase Storage (bypasses Vercel 4.5MB serverless body limit for videos & high-res media up to 100MB),
 * with graceful fallback to Google Cloud Storage.
 */
export async function generateSignedUploadUrl(
  originalFilename: string,
  mimeType: string,
  fileSize: number,
  folder: "products" | "combos" | "brands" | "payments" | "videos" | "audios" | "vehicles" = "products",
  overrideSupabaseKey?: string
): Promise<{
  success: boolean;
  signedUrl?: string;
  publicUrl?: string;
  fileName?: string;
  uploadMethod?: "PUT" | "POST";
  headers?: Record<string, string>;
  error?: string;
  needsKey?: boolean;
}> {
  const validation = validateMedia({ type: mimeType, size: fileSize }, folder);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const randomSuffix = crypto.randomBytes(8).toString("hex");
  const cleanBaseName = originalFilename
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 32);
  const ext =
    path.extname(originalFilename).toLowerCase() ||
    (mimeType.startsWith("video/") ? ".mp4" : ".webp");
  const uniqueFileName = `${folder}_${Date.now()}_${randomSuffix}_${cleanBaseName}${ext}`;
  const destination = `${folder}/${uniqueFileName}`;

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    `https://${process.env.SUPABASE_PROJECT_REF || "uwfhsolkumynqivaqftz"}.supabase.co`;
  const bucketName =
    process.env.SUPABASE_STORAGE_BUCKET || "zxz-mods-media";
  const supabaseServiceKey =
    overrideSupabaseKey ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 1. Supabase Storage Signed Upload URL (Primary Cloud Engine)
  if (supabaseUrl && supabaseServiceKey) {
    try {
      const cleanBaseUrl = supabaseUrl.replace(/\/+$/, "");
      const signEndpoint = `${cleanBaseUrl}/storage/v1/object/upload/sign/${bucketName}/${destination}`;

      const res = await fetch(signEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ upsert: true }),
      });

      if (res.ok) {
        const signData = await res.json();
        const rawSignedPath = signData.url || "";
        const signedUploadUrl = rawSignedPath.startsWith("http")
          ? rawSignedPath
          : `${cleanBaseUrl}/storage/v1${rawSignedPath.startsWith("/") ? "" : "/"}${rawSignedPath}`;
        const publicUrl = `${cleanBaseUrl}/storage/v1/object/public/${bucketName}/${destination}`;

        return {
          success: true,
          signedUrl: signedUploadUrl,
          publicUrl,
          fileName: uniqueFileName,
          uploadMethod: "PUT",
          headers: {
            "Content-Type": mimeType,
            "x-upsert": "true",
          },
        };
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn("[SUPABASE_STORAGE_SIGN_WARN]:", res.status, errJson);
        return {
          success: false,
          error: `Error al generar URL firmada en Supabase Storage (${bucketName}): ${errJson?.message || errJson?.error || "Error de autorización"}`,
          needsKey: res.status === 401 || res.status === 403,
        };
      }
    } catch (sbErr: any) {
      console.error("[SUPABASE_STORAGE_SIGN_ERROR]:", sbErr);
      return {
        success: false,
        error: `Fallo de conexión con Supabase Storage: ${sbErr?.message || "Error desconocido"}`,
      };
    }
  }

  // 2. Google Cloud Storage Fallback
  const gcsBucketName = process.env.GCS_BUCKET_NAME || process.env.FIREBASE_STORAGE_BUCKET;
  const gcs = getGCSClient();
  if (gcs && gcsBucketName && process.env.GCS_ENABLED === "true") {
    try {
      const bucket = gcs.bucket(gcsBucketName);
      const file = bucket.file(destination);
      const [signedUrl] = await file.getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: mimeType,
      });

      const publicUrl = `https://storage.googleapis.com/${gcsBucketName}/${destination}`;
      return {
        success: true,
        signedUrl,
        publicUrl,
        fileName: uniqueFileName,
        uploadMethod: "PUT",
      };
    } catch (err: any) {
      console.error("[GCS_SIGNED_URL_ERROR]:", err);
      return {
        success: false,
        error: err?.message || "No se pudo generar URL firmada de subida en Google Cloud Storage.",
      };
    }
  }

  // Missing credentials notification
  return {
    success: false,
    error: "SUPABASE_SERVICE_ROLE_KEY no está configurada en las variables de entorno del servidor. Por favor agrégala en Vercel o en el panel de control.",
    needsKey: true,
  };
}

/**
 * Uploads media either to Google Cloud Storage (Bucket) or local fallback.
 */
export async function processAndStoreImage(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string,
  folder: "products" | "combos" | "brands" | "payments" | "videos" | "audios" | "vehicles" = "products"
): Promise<UploadImageResult> {
  const validation = validateMedia({ type: mimeType, size: buffer.length }, folder);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Verify file magic bytes / signature
  const isSignatureValid = verifyMagicBytes(buffer, mimeType);
  if (!isSignatureValid) {
    return {
      success: false,
      error: "La firma digital del archivo no coincide con su tipo declarativo. Archivo potencialmente alterado.",
    };
  }

  // Generate safe sanitized filename with high-entropy random hex
  const randomSuffix = crypto.randomBytes(8).toString("hex");
  const cleanBaseName = originalFilename
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 24);
  const ext =
    path.extname(originalFilename).toLowerCase() ||
    (mimeType === "application/pdf"
      ? ".pdf"
      : mimeType.startsWith("video/")
      ? ".mp4"
      : mimeType.startsWith("audio/")
      ? ".mp3"
      : ".webp");
  const uniqueFileName = `${folder}_${Date.now()}_${randomSuffix}_${cleanBaseName}${ext}`;

  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || process.env.GCS_BUCKET_NAME || process.env.FIREBASE_STORAGE_BUCKET || "zxz-mods-media";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || `https://${process.env.SUPABASE_PROJECT_REF || "uwfhsolkumynqivaqftz"}.supabase.co`;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 1. If Supabase Storage is configured (or inferred from Supabase project ref), upload directly to Supabase Storage Bucket
  if (supabaseUrl && supabaseServiceKey) {
    try {
      const cleanBaseUrl = supabaseUrl.replace(/\/+$/, "");
      const destination = `${folder}/${uniqueFileName}`;
      const uploadEndpoint = `${cleanBaseUrl}/storage/v1/object/${bucketName}/${destination}`;

      // Ensure bucket exists in Supabase Storage automatically (public bucket)
      try {
        await fetch(`${cleanBaseUrl}/storage/v1/bucket`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
            apikey: supabaseServiceKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: bucketName, name: bucketName, public: true }),
        });
      } catch {}

      const res = await fetch(uploadEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
          "Content-Type": mimeType,
          "x-upsert": "true",
        },
        body: new Uint8Array(buffer),
      });

      if (res.ok) {
        const publicUrl = `${cleanBaseUrl}/storage/v1/object/public/${bucketName}/${destination}`;
        return {
          success: true,
          url: publicUrl,
          fileName: uniqueFileName,
          fileSize: buffer.length,
          mimeType,
        };
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn("[STORAGE_SUPABASE_WARN] Supabase Storage upload error:", res.status, errJson);
        if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY && !process.env.GCS_PRIVATE_KEY) {
          return {
            success: false,
            error: `Error al subir a Supabase Storage (${bucketName}): ${errJson?.message || errJson?.error || "Verifica que el bucket exista y tenga permisos públicos"}`,
          };
        }
      }
    } catch (sbError: any) {
      console.error("[STORAGE_SUPABASE_ERROR] Supabase storage upload failed:", sbError);
      if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY && !process.env.GCS_PRIVATE_KEY) {
        return {
          success: false,
          error: `Fallo de conexión con Supabase Storage: ${sbError?.message || "Error desconocido"}`,
        };
      }
    }
  }

  const gcs = getGCSClient();

  // 2. If Google Cloud Storage is configured, stream buffer to GCP Bucket
  if (gcs && process.env.GCS_ENABLED === "true") {
    try {
      const bucket = gcs.bucket(bucketName);
      const destination = `${folder}/${uniqueFileName}`;
      const file = bucket.file(destination);

      await file.save(buffer, {
        metadata: {
          contentType: mimeType,
          cacheControl: "public, max-age=31536000",
        },
        resumable: false,
      });

      // Public URL on Google Cloud Storage CDN
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;

      return {
        success: true,
        url: publicUrl,
        fileName: uniqueFileName,
        fileSize: buffer.length,
        mimeType,
      };
    } catch (gcpError: any) {
      console.warn("[STORAGE_GCP_WARN] Cloud storage upload failed, attempting fallback:", gcpError?.message);
      if (process.env.VERCEL === "1") {
        return {
          success: false,
          error: `Error al subir archivo a Google Cloud Storage: ${gcpError?.message || "Fallo de almacenamiento en la nube"}`,
        };
      }
    }
  }

  // Local filesystem storage fallback (standalone / docker / dev)
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    await fs.mkdir(uploadDir, { recursive: true });

    const targetPath = path.join(uploadDir, uniqueFileName);
    await fs.writeFile(targetPath, buffer);

    const relativePublicUrl = `/uploads/${folder}/${uniqueFileName}`;

    return {
      success: true,
      url: relativePublicUrl,
      filePath: targetPath,
      fileName: uniqueFileName,
      fileSize: buffer.length,
      mimeType,
    };
  } catch (fsError) {
    console.error("[STORAGE_LOCAL_ERROR] Failed to save local upload:", fsError);
    return {
      success: false,
      error: "Failed to persist media.",
    };
  }
}

/**
 * Deletes a stored media file (image, video, audio) from Supabase Storage, Google Cloud Storage,
 * or local /public/uploads when it is replaced or eliminated from the database.
 */
export async function deleteStoredMediaUrl(mediaUrl: string): Promise<boolean> {
  if (!mediaUrl || typeof mediaUrl !== "string") return false;
  const trimmed = mediaUrl.trim();
  if (!trimmed) return false;

  // 1. Supabase Storage URL: https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<folder>/<file>
  const sbMatch = trimmed.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
  if (sbMatch) {
    const bucketName = sbMatch[1];
    const objectPath = sbMatch[2].split("?")[0];
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      `https://${process.env.SUPABASE_PROJECT_REF || "uwfhsolkumynqivaqftz"}.supabase.co`;
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseServiceKey && bucketName && objectPath) {
      try {
        const cleanBaseUrl = supabaseUrl.replace(/\/+$/, "");
        const deleteEndpoint = `${cleanBaseUrl}/storage/v1/object/${bucketName}/${objectPath}`;
        const res = await fetch(deleteEndpoint, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
            apikey: supabaseServiceKey,
          },
        });
        if (res.ok) return true;
      } catch (err) {
        console.warn("[STORAGE_SUPABASE_DELETE_WARN]:", err);
      }
    }
  }

  // 2. Google Cloud Storage URL: https://storage.googleapis.com/<bucket>/<folder>/<file>
  const gcsMatch = trimmed.match(/^https?:\/\/storage\.googleapis\.com\/([^/]+)\/(.+)$/);
  if (gcsMatch) {
    const bucketName = gcsMatch[1];
    const objectPath = gcsMatch[2].split("?")[0];
    const gcs = getGCSClient();
    if (gcs && bucketName && objectPath) {
      try {
        await gcs.bucket(bucketName).file(objectPath).delete({ ignoreNotFound: true });
        return true;
      } catch (err) {
        console.warn("[STORAGE_GCS_DELETE_WARN]:", err);
      }
    }
  }

  // 3. Local /uploads/<folder>/<file>
  if (trimmed.startsWith("/uploads/")) {
    try {
      const cleanRel = trimmed.replace(/^\/+/, "").split("?")[0];
      const fullLocalPath = path.join(process.cwd(), "public", cleanRel);
      const publicUploadsRoot = path.join(process.cwd(), "public", "uploads");
      if (fullLocalPath.startsWith(publicUploadsRoot)) {
        await fs.unlink(fullLocalPath).catch(() => {});
        return true;
      }
    } catch (err) {
      console.warn("[STORAGE_LOCAL_DELETE_WARN]:", err);
    }
  }

  return false;
}

/**
 * Compares previous media URLs with updated media URLs and deletes any removed/replaced files
 * from cloud/local storage.
 */
export async function cleanupRemovedMediaUrls(
  previousUrls: (string | null | undefined)[],
  nextUrls: (string | null | undefined)[]
): Promise<void> {
  const nextSet = new Set(
    nextUrls
      .map((u) => (typeof u === "string" ? u.trim() : ""))
      .filter(Boolean)
  );
  const toDelete = Array.from(
    new Set(
      previousUrls
        .map((u) => (typeof u === "string" ? u.trim() : ""))
        .filter((u) => Boolean(u) && !nextSet.has(u))
    )
  );
  if (toDelete.length === 0) return;
  await Promise.allSettled(toDelete.map((url) => deleteStoredMediaUrl(url)));
}
