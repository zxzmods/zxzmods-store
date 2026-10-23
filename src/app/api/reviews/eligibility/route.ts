import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customerAuth";
import { checkReviewEligibility } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getCustomerSession();
    const { searchParams } = new URL(request.url);

    const productId = searchParams.get("productId");
    const productSlug = searchParams.get("productSlug");
    const comboId = searchParams.get("comboId");
    const comboSlug = searchParams.get("comboSlug");

    const eligibility = await checkReviewEligibility({
      userId: session?.userId || null,
      productId,
      productSlug,
      comboId,
      comboSlug,
    });

    return NextResponse.json({
      success: true,
      authenticated: Boolean(session?.userId),
      ...eligibility,
    });
  } catch (error) {
    console.error("[GET_ELIGIBILITY_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al verificar elegibilidad para reseña" },
      { status: 500 }
    );
  }
}
