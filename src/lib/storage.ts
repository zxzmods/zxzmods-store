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

const MAX_IMAGE_SIZE = 12 * 1024 * 1024; // 12MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB

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

  // MP4 / QuickTime: ftyp
  if (mimeType === "video/mp4" || mimeType === "video/quicktime") {
    const ftyp = buffer.subarray(4, 8).toString("ascii");
    return ftyp === "ftyp" || buffer.subarray(4, 12).toString("ascii").includes("moov");
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

  // Allow general formats if not explicitly matched
  return true;
}

/**
 * Validates uploaded media buffer and MIME type (Image, Video, Audio).
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

  if (!isImage && !isVideo && !isAudio) {
    return {
      valid: false,
      error: `Formato de archivo no soportado (${file.type}). Se permiten imágenes (JPEG, PNG, WebP), videos (MP4, WebM) y audios (MP3, WAV).`,
    };
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: `La imagen excede el límite de 12MB. Tamaño: ${(file.size / (1024 * 1024)).toFixed(2)}MB.` };
  }
  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return { valid: false, error: `El video excede el límite de 100MB. Tamaño: ${(file.size / (1024 * 1024)).toFixed(2)}MB.` };
  }
  if (isAudio && file.size > MAX_AUDIO_SIZE) {
    return { valid: false, error: `El audio excede el límite de 25MB. Tamaño: ${(file.size / (1024 * 1024)).toFixed(2)}MB.` };
  }

  return {
    valid: true,
    mediaCategory: isImage ? "image" : isVideo ? "video" : "audio",
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
 * Generates a V4 Signed PUT URL for direct browser-to-GCS upload (bypasses Vercel 4.5MB serverless body limit).
 */
export async function generateSignedUploadUrl(
  originalFilename: string,
  mimeType: string,
  fileSize: number,
  folder: "products" | "combos" | "brands" | "payments" | "videos" | "audios" = "products"
): Promise<{
  success: boolean;
  signedUrl?: string;
  publicUrl?: string;
  fileName?: string;
  error?: string;
}> {
  const validation = validateMedia({ type: mimeType, size: fileSize }, folder);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const bucketName = process.env.GCS_BUCKET_NAME || process.env.FIREBASE_STORAGE_BUCKET;
  const gcs = getGCSClient();
  if (!bucketName || !gcs) {
    return {
      success: false,
      error: "Google Cloud Storage no está configurado en el servidor.",
    };
  }

  const randomSuffix = crypto.randomBytes(8).toString("hex");
  const cleanBaseName = originalFilename
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 24);
  const ext =
    path.extname(originalFilename).toLowerCase() ||
    (mimeType.startsWith("video/") ? ".mp4" : ".webp");
  const uniqueFileName = `${folder}_${Date.now()}_${randomSuffix}_${cleanBaseName}${ext}`;
  const destination = `${folder}/${uniqueFileName}`;

  try {
    const bucket = gcs.bucket(bucketName);
    const file = bucket.file(destination);
    const [signedUrl] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: mimeType,
    });

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
    return {
      success: true,
      signedUrl,
      publicUrl,
      fileName: uniqueFileName,
    };
  } catch (err: any) {
    console.error("[GCS_SIGNED_URL_ERROR]:", err);
    return {
      success: false,
      error: err?.message || "No se pudo generar URL firmada de subida.",
    };
  }
}

/**
 * Uploads media either to Google Cloud Storage (Bucket) or local fallback.
 */
export async function processAndStoreImage(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string,
  folder: "products" | "combos" | "brands" | "payments" | "videos" | "audios" = "products"
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
  const ext = path.extname(originalFilename).toLowerCase() || (mimeType.startsWith("video/") ? ".mp4" : ".webp");
  const uniqueFileName = `${folder}_${Date.now()}_${randomSuffix}_${cleanBaseName}${ext}`;

  const bucketName = process.env.GCS_BUCKET_NAME || process.env.FIREBASE_STORAGE_BUCKET || "zxz-mods-media";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 1. If Supabase Storage is configured, upload directly to Supabase Storage Bucket
  if (supabaseUrl && supabaseServiceKey) {
    try {
      const cleanBaseUrl = supabaseUrl.replace(/\/+$/, "");
      const destination = `${folder}/${uniqueFileName}`;
      const uploadEndpoint = `${cleanBaseUrl}/storage/v1/object/${bucketName}/${destination}`;

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
        const errText = await res.text().catch(() => "");
        console.warn("[STORAGE_SUPABASE_WARN] Supabase Storage upload returned non-OK:", res.status, errText);
      }
    } catch (sbError) {
      console.error("[STORAGE_SUPABASE_ERROR] Supabase storage upload failed:", sbError);
    }
  }

  const gcs = getGCSClient();

  // 2. If Google Cloud Storage is configured, stream buffer to GCP Bucket
  if (bucketName && gcs) {
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
      console.error("[STORAGE_GCP_ERROR] Cloud storage upload failed:", gcpError);
      if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
        return {
          success: false,
          error: `Error al subir archivo a Google Cloud Storage: ${gcpError?.message || "Fallo de almacenamiento en la nube"}`,
        };
      }
    }
  } else if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    return {
      success: false,
      error: "Google Cloud Storage (GCS_BUCKET_NAME / credenciales) es requerido en producción.",
    };
  }

  // Local filesystem storage for development fallback only
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
