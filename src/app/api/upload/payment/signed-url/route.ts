import { NextResponse } from "next/server";
import { generateSignedUploadUrl } from "@/lib/storage";
import { checkRateLimit, createRateLimitResponse, getClientIp } from "@/lib/rateLimit";
import { isValidStorageUrl } from "@/lib/security/inputSanitizer";

export const dynamic = "force-dynamic";

const ALLOWED_PAYMENT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

const MAX_PAYMENT_FILE_SIZE = 25 * 1024 * 1024; // 25MB max for direct customer payment receipts

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit({
    key: `upload_pay_sign_${ip}`,
    maxRequests: 15,
    windowMs: 15 * 60 * 1000,
  });
  if (!rate.success) {
    return createRateLimitResponse(rate.resetMs);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const rawFileName = typeof body?.fileName === "string" ? body.fileName.trim() : "";
    const rawMimeType = typeof body?.mimeType === "string" ? body.mimeType.trim().toLowerCase() : "";
    const fileSize = typeof body?.fileSize === "number" ? body.fileSize : Number(body?.fileSize);

    if (!rawFileName || !rawMimeType || !Number.isFinite(fileSize) || fileSize <= 0) {
      return NextResponse.json(
        { success: false, error: "Parámetros de archivo incompletos." },
        { status: 400 }
      );
    }

    if (fileSize > MAX_PAYMENT_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "El comprobante excede el límite máximo de 25 MB." },
        { status: 400 }
      );
    }

    if (!ALLOWED_PAYMENT_MIME_TYPES.has(rawMimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Formato no permitido. Sube una imagen (JPG, PNG, WEBP, HEIC) o PDF.",
        },
        { status: 400 }
      );
    }

    const result = await generateSignedUploadUrl(rawFileName, rawMimeType, fileSize, "payments");
    if (!result.success || !result.signedUrl || !result.publicUrl) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "No se pudo preparar la subida directa del comprobante.",
        },
        { status: 400 }
      );
    }

    if (!isValidStorageUrl(result.publicUrl)) {
      return NextResponse.json(
        { success: false, error: "Destino de almacenamiento inválido" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signedUrl: result.signedUrl,
      publicUrl: result.publicUrl,
      fileName: result.fileName,
      headers: result.headers || { "Content-Type": rawMimeType },
    });
  } catch (error) {
    console.error("[PAYMENT_SIGNED_URL_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al preparar la subida del comprobante." },
      { status: 500 }
    );
  }
}
