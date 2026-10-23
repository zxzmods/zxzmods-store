import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { processAndStoreImage } from "@/lib/storage";

export async function POST(request: Request) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as "products" | "combos" | "brands" | "videos" | "audios" | "payments") || "products";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No se proporcionó ningún archivo de imagen, video o audio" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await processAndStoreImage(
      buffer,
      file.name,
      file.type,
      folder
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Upload failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      fileName: result.fileName,
      fileSize: result.fileSize,
    });
  } catch (error) {
    console.error("[SYS_UPLOAD_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Server error processing image upload" },
      { status: 500 }
    );
  }
}
