import { NextResponse } from "next/server";
import {
  fetchLiveSupplierAvailability,
  syncAllCatalogAvailability,
} from "@/lib/supplierAvailability";
import { prisma } from "@/lib/prisma";
import { requireStealthSession } from "@/lib/stealthAuth";

export const dynamic = "force-dynamic";

/**
 * Validates external URL against SSRF targets (private IP spaces, link-local, cloud metadata).
 */
function isSafeExternalUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();

    if (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host === "169.254.169.254" || // GCP/AWS metadata endpoint
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("172.16.") ||
      host.startsWith("172.17.") ||
      host.startsWith("172.18.") ||
      host.startsWith("172.19.") ||
      host.startsWith("172.2") ||
      host.startsWith("172.3")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  // STRICT SECURITY: Stealth session required for catalog scraper and batch operations
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const { url, productId, save = false, syncAll = false, forceAll = false } = body;

    // Batch sync trigger (Restricted to MASTER only)
    if (syncAll) {
      if (auth.session.role !== "MASTER") {
        return NextResponse.json(
          { success: false, error: "Only MASTER accounts can trigger full catalog sync" },
          { status: 403 }
        );
      }
      const summary = await syncAllCatalogAvailability(Boolean(forceAll));
      return NextResponse.json({
        success: true,
        message: `Sincronización completada. ${summary.synced} de ${summary.total} productos actualizados.`,
        summary,
      });
    }

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "URL de proveedor requerida" },
        { status: 400 }
      );
    }

    // SSRF validation
    if (!isSafeExternalUrl(url)) {
      return NextResponse.json(
        { success: false, error: "URL no permitida: dirección inválida o privada" },
        { status: 400 }
      );
    }

    // Inspect live availability from US website
    const result = await fetchLiveSupplierAvailability(url);

    // Optionally save to product
    if (save && productId && result.success) {
      const updated = await prisma.product.update({
        where: { id: productId },
        data: {
          supplierUrl: result.url,
          supplierPlatform: result.platform,
          supplierStockStatus: result.status,
          supplierStockCount: result.stockCount,
          supplierStockMessageEs: result.messageEs,
          supplierStockMessageEn: result.messageEn,
          supplierStockCheckedAt: new Date(),
          supplierLeadDaysMin: result.leadDaysMin,
          supplierLeadDaysMax: result.leadDaysMax,
          supplierLastPriceUSD: result.supplierPriceUSD,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Disponibilidad verificada y guardada en el catálogo",
        result,
        product: updated,
      });
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("Error in POST /api/sys/catalog/supplier-check:", error);
    return NextResponse.json(
      { success: false, error: "Error al verificar disponibilidad de proveedor" },
      { status: 500 }
    );
  }
}
