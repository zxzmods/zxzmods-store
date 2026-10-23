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
function getGCSClient(): Storage | null {
  if (gcsClient) return gcsClient;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

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

  const bucketName = process.env.GCS_BUCKET_NAME || process.env.FIREBASE_STORAGE_BUCKET;
  const gcs = getGCSClient();

  // If Google Cloud Storage is configured, stream buffer to GCP Bucket
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
    } catch (gcpError) {
      console.error("[STORAGE_GCP_ERROR] Cloud storage upload failed, falling back to local:", gcpError);
    }
  }

  // Local filesystem storage for development fallback
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
