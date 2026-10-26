import { NextResponse } from "next/server";
import { processAndStoreImage } from "@/lib/storage";
import { checkRateLimit, createRateLimitResponse, getClientIp } from "@/lib/rateLimit";
import { isValidStorageUrl } from "@/lib/security/inputSanitizer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  // 1. Rate limiting defense against storage flooding / DoS (max 10 uploads per 15 minutes per IP)
  const ip = getClientIp(request);
  const rate = checkRateLimit({
    key: `upload_pay_${ip}`,
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!rate.success) {
    return createRateLimitResponse(rate.resetMs);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided" },
        { status: 400 }
      );
    }

    // 2. Strict file size enforcement (max 100MB)
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "El archivo excede el tamaño máximo permitido de 100 MB" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Process image with magic byte verification and storage streaming
    const result = await processAndStoreImage(
      buffer,
      file.name,
      file.type,
      "payments"
    );

    if (!result.success || !result.url) {
      return NextResponse.json(
        { success: false, error: result.error || "Upload failed" },
        { status: 400 }
      );
    }

    // 4. Verify returned URL format
    if (!isValidStorageUrl(result.url)) {
      return NextResponse.json(
        { success: false, error: "Destino de almacenamiento inválido" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      fileName: result.fileName,
    });
  } catch (error) {
    console.error("[PAYMENT_UPLOAD_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Server error processing payment image" },
      { status: 500 }
    );
  }
}
