import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { generateSignedUploadUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { fileName, mimeType, fileSize, folder = "products", supabaseKey } = body || {};

    if (!fileName || !mimeType || typeof fileSize !== "number") {
      return NextResponse.json(
        { success: false, error: "Parámetros de archivo incompletos." },
        { status: 400 }
      );
    }

    const validFolders = ["products", "combos", "brands", "payments", "videos", "audios"] as const;
    const safeFolder = validFolders.includes(folder) ? folder : "products";

    const result = await generateSignedUploadUrl(fileName, mimeType, fileSize, safeFolder, supabaseKey);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, needsKey: result.needsKey },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      signedUrl: result.signedUrl,
      publicUrl: result.publicUrl,
      fileName: result.fileName,
      uploadMethod: result.uploadMethod || "PUT",
      headers: result.headers || {},
    });
  } catch (error: any) {
    console.error("[SIGNED_URL_ENDPOINT_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al generar URL de subida firmada." },
      { status: 500 }
    );
  }
}
