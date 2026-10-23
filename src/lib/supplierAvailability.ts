import { prisma } from "@/lib/prisma";

export type SupplierStockStatus =
  | "IN_STOCK"
  | "PRE_ORDER"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "UNAVAILABLE";

export type SupplierPlatform =
  | "SHOPIFY"
  | "SCHEMA_ORG"
  | "GENERIC_HTML"
  | "MANUAL";

export interface SupplierAvailabilityResult {
  success: boolean;
  url: string;
  platform: SupplierPlatform;
  status: SupplierStockStatus;
  available: boolean;
  stockCount: number | null;
  supplierPriceUSD: number | null;
  title?: string;
  messageEs: string;
  messageEn: string;
  leadDaysMin: number;
  leadDaysMax: number;
  checkedAt: string;
  rawDetails?: {
    platformIdentified: string;
    variantsCount?: number;
    inventoryPolicy?: string;
    isPreOrderTagged?: boolean;
    hasAddToCartBtn?: boolean;
  };
}

// User directive: availability on products needs to be updated at a minimum of every 8 hours
export const AVAILABILITY_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

export function isAvailabilityStale(checkedAt: Date | string | null | undefined): boolean {
  if (!checkedAt) return true;
  const time = new Date(checkedAt).getTime();
  if (isNaN(time)) return true;
  return Date.now() - time > AVAILABILITY_MAX_AGE_MS;
}

/**
 * Normalizes URL and removes search parameters like tracking UTM tags
 */
function cleanSupplierUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.trim());
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Universal live scraper & API resolver for US supplier e-commerce websites
 */
export async function fetchLiveSupplierAvailability(
  rawUrl: string
): Promise<SupplierAvailabilityResult> {
  const url = cleanSupplierUrl(rawUrl);
  const nowIso = new Date().toISOString();

  if (!url || !url.startsWith("http")) {
    return {
      success: false,
      url,
      platform: "MANUAL",
      status: "UNAVAILABLE",
      available: false,
      stockCount: null,
      supplierPriceUSD: null,
      messageEs: "Enlace de proveedor no especificado o inválido",
      messageEn: "Supplier URL not specified or invalid",
      leadDaysMin: 7,
      leadDaysMax: 12,
      checkedAt: nowIso,
    };
  }

  const commonHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
    "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
    "Cache-Control": "no-cache",
    Cookie: "cart_currency=USD; localization=US; currency=USD",
  };

  // 1. Check for Shopify endpoint (.js / .json)
  const isShopifyPattern = url.includes("/products/");
  if (isShopifyPattern) {
    try {
      const cleanPath = url.replace(/\/$/, "");
      const shopifyJsUrl = `${cleanPath}.js?currency=USD`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const shopifyRes = await fetch(shopifyJsUrl, {
        headers: { ...commonHeaders, Accept: "application/json" },
        signal: controller.signal,
        cache: "no-store",
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (shopifyRes && shopifyRes.ok) {
        const text = await shopifyRes.text();
        if (text.trim().startsWith("{")) {
          const json = JSON.parse(text);

          const title = json.title || "";
          const price = typeof json.price === "number" ? json.price / 100 : null;
          const variants = Array.isArray(json.variants) ? json.variants : [];
          const anyAvailable = variants.some((v: any) => v.available === true) || json.available === true;

          // Detect Pre-Order tags or inventory policies
          const fullTextLower = `${title} ${json.description || ""} ${(json.tags || []).join(" ")}`.toLowerCase();
          const hasPreOrderTag =
            fullTextLower.includes("pre-order") ||
            fullTextLower.includes("preorder") ||
            fullTextLower.includes("preventa") ||
            fullTextLower.includes("backorder");

          const isInventoryManaged = variants.some((v: any) => v.inventory_management);
          const totalStock = variants.reduce((sum: number, v: any) => {
            if (typeof v.inventory_quantity === "number") {
              return sum + Math.max(0, v.inventory_quantity);
            }
            return sum;
          }, 0);

          let status: SupplierStockStatus = "IN_STOCK";
          let msgEs = "Disponible para entrega o importación inmediata";
          let msgEn = "In stock ready for immediate delivery or import";

          if (hasPreOrderTag) {
            status = "PRE_ORDER";
            msgEs = "Disponible en Preventa (Reserva prioritaria)";
            msgEn = "Available for Pre-Order (Priority reservation)";
          } else if (!anyAvailable) {
            status = "OUT_OF_STOCK";
            msgEs = "Agotado temporalmente (Disponible para cotización de reserva)";
            msgEn = "Temporarily out of stock (Available for reservation quote)";
          } else if (isInventoryManaged && totalStock > 0 && totalStock <= 3) {
            status = "LOW_STOCK";
            msgEs = `Últimas ${totalStock} unidades en proveedor`;
            msgEn = `Only ${totalStock} left at supplier`;
          }

          return {
            success: true,
            url,
            platform: "SHOPIFY",
            status,
            available: anyAvailable || status === "PRE_ORDER",
            stockCount: totalStock > 0 ? totalStock : null,
            supplierPriceUSD: price,
            title,
            messageEs: msgEs,
            messageEn: msgEn,
            leadDaysMin: status === "PRE_ORDER" ? 14 : 7,
            leadDaysMax: status === "PRE_ORDER" ? 28 : 12,
            checkedAt: nowIso,
            rawDetails: {
              platformIdentified: "Shopify Product API (.js)",
              variantsCount: variants.length,
              isPreOrderTagged: hasPreOrderTag,
            },
          };
        }
      }
    } catch (shopifyErr) {
      // Fall through to general HTML inspection
    }
  }

  // 2. Generic HTML & Schema.org / JSON-LD inspection
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const htmlRes = await fetch(url, {
      headers: commonHeaders,
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!htmlRes.ok) {
      return {
        success: false,
        url,
        platform: "GENERIC_HTML",
        status: htmlRes.status === 404 ? "UNAVAILABLE" : "OUT_OF_STOCK",
        available: false,
        stockCount: null,
        supplierPriceUSD: null,
        messageEs:
          htmlRes.status === 404
            ? "Producto no encontrado en proveedor (404)"
            : "No se pudo verificar disponibilidad en proveedor",
        messageEn:
          htmlRes.status === 404
            ? "Product not found on supplier site (404)"
            : "Could not verify supplier availability",
        leadDaysMin: 7,
        leadDaysMax: 12,
        checkedAt: nowIso,
      };
    }

    const html = await htmlRes.text();
    const htmlLower = html.toLowerCase();

    // Check Schema.org JSON-LD tags
    const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
    let schemaAvailability: string | null = null;
    let schemaPrice: number | null = null;

    if (jsonLdMatches) {
      for (const block of jsonLdMatches) {
        try {
          const rawJson = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
          const parsed = JSON.parse(rawJson);
          const offers = parsed?.offers || (Array.isArray(parsed?.["@graph"]) ? parsed["@graph"].find((i: any) => i?.offers)?.offers : null);

          if (offers) {
            const avail = typeof offers.availability === "string" ? offers.availability : offers?.[0]?.availability;
            if (avail) schemaAvailability = avail;
            const price = offers.price || offers?.[0]?.price;
            if (price) schemaPrice = Number(price);
            break;
          }
        } catch {}
      }
    }

    // Determine status from Schema or HTML keywords
    let status: SupplierStockStatus = "IN_STOCK";
    let msgEs = "Disponible para entrega o importación inmediata";
    let msgEn = "In stock ready for immediate delivery or import";

    const isPreOrder =
      Boolean(schemaAvailability?.includes("PreOrder")) ||
      htmlLower.includes("pre-order now") ||
      htmlLower.includes("preorder now") ||
      htmlLower.includes("pre-order button") ||
      htmlLower.includes("preorder-now");

    const isOutOfStock =
      Boolean(schemaAvailability?.includes("OutOfStock") || schemaAvailability?.includes("SoldOut") || schemaAvailability?.includes("Discontinued")) ||
      htmlLower.includes("sold out") ||
      htmlLower.includes("out of stock") ||
      htmlLower.includes("temporarily unavailable") ||
      htmlLower.includes("currently unavailable");

    const isBackorder =
      Boolean(schemaAvailability?.includes("BackOrder")) ||
      htmlLower.includes("backordered") ||
      htmlLower.includes("on backorder");

    if (isPreOrder) {
      status = "PRE_ORDER";
      msgEs = "Disponible en Preventa (Reserva prioritaria)";
      msgEn = "Available for Pre-Order (Priority reservation)";
    } else if (isOutOfStock && !isPreOrder) {
      status = "OUT_OF_STOCK";
      msgEs = "Agotado temporalmente (Disponible para cotización de reserva)";
      msgEn = "Temporarily out of stock (Available for reservation quote)";
    } else if (isBackorder) {
      status = "PRE_ORDER";
      msgEs = "Pedido especial / Backorder en fábrica";
      msgEn = "Special order / Factory Backorder";
    }

    return {
      success: true,
      url,
      platform: schemaAvailability ? "SCHEMA_ORG" : "GENERIC_HTML",
      status,
      available: (status as SupplierStockStatus) !== "OUT_OF_STOCK" && (status as SupplierStockStatus) !== "UNAVAILABLE",
      stockCount: null,
      supplierPriceUSD: schemaPrice,
      messageEs: msgEs,
      messageEn: msgEn,
      leadDaysMin: status === "PRE_ORDER" ? 14 : 7,
      leadDaysMax: status === "PRE_ORDER" ? 28 : 12,
      checkedAt: nowIso,
      rawDetails: {
        platformIdentified: schemaAvailability ? "Schema.org / JSON-LD" : "HTML Heuristic",
        isPreOrderTagged: isPreOrder,
        hasAddToCartBtn: htmlLower.includes("add to cart"),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      url,
      platform: "GENERIC_HTML",
      status: "IN_STOCK", // Safe baseline to avoid blocking sales if remote supplier site had brief timeout
      available: true,
      stockCount: null,
      supplierPriceUSD: null,
      messageEs: "Verificación de proveedor en curso (Stock estimado)",
      messageEn: "Supplier verification in progress (Estimated stock)",
      leadDaysMin: 7,
      leadDaysMax: 12,
      checkedAt: nowIso,
    };
  }
}

/**
 * Checks a product in the database.
 * If older than 8 hours (or forceFresh is true), updates SQLite database and returns fresh availability.
 */
export async function syncProductAvailability(
  productIdOrSlug: string,
  forceFresh = false
): Promise<{ success: boolean; product: any; liveResult?: SupplierAvailabilityResult }> {
  try {
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: productIdOrSlug },
          { slug: productIdOrSlug },
          { sku: productIdOrSlug },
        ],
      },
    });

    if (!product) {
      return { success: false, product: null };
    }

    // If no supplier URL configured, return current state
    if (!product.supplierUrl) {
      return {
        success: true,
        product,
      };
    }

    // Check 8-hour freshness rule
    const isStale = isAvailabilityStale(product.supplierStockCheckedAt);

    if (!forceFresh && !isStale) {
      return {
        success: true,
        product,
      };
    }

    // Re-verify live from US supplier
    const live = await fetchLiveSupplierAvailability(product.supplierUrl);

    if (live.success) {
      const updated = await prisma.product.update({
        where: { id: product.id },
        data: {
          supplierStockStatus: live.status,
          supplierStockCount: live.stockCount,
          supplierPlatform: live.platform,
          supplierStockMessageEs: live.messageEs,
          supplierStockMessageEn: live.messageEn,
          supplierStockCheckedAt: new Date(),
          supplierLeadDaysMin: live.leadDaysMin,
          supplierLeadDaysMax: live.leadDaysMax,
          supplierLastPriceUSD: live.supplierPriceUSD || product.supplierLastPriceUSD,
          updatedAt: new Date(),
        },
      });

      try {
        const fs = await import("fs/promises");
        const path = await import("path");
        const productsJsonPath = path.join(process.cwd(), "src", "data", "products.json");
        const rawData = await fs.readFile(productsJsonPath, "utf-8");
        const productsArray = JSON.parse(rawData);
        const idx = productsArray.findIndex(
          (p: any) =>
            p.id?.toLowerCase() === updated.sku.toLowerCase() ||
            p.slug?.toLowerCase() === updated.slug.toLowerCase() ||
            p.id?.toLowerCase() === updated.id.toLowerCase()
        );
        if (idx !== -1) {
          productsArray[idx].supplierStockStatus = updated.supplierStockStatus;
          productsArray[idx].supplierStockCount = updated.supplierStockCount;
          productsArray[idx].supplierPlatform = updated.supplierPlatform;
          productsArray[idx].supplierStockMessageEs = updated.supplierStockMessageEs;
          productsArray[idx].supplierStockMessageEn = updated.supplierStockMessageEn;
          productsArray[idx].supplierLeadDaysMin = updated.supplierLeadDaysMin;
          productsArray[idx].supplierLeadDaysMax = updated.supplierLeadDaysMax;
          productsArray[idx].supplierLastPriceUSD = updated.supplierLastPriceUSD;
          productsArray[idx].supplierStockCheckedAt = updated.supplierStockCheckedAt ? updated.supplierStockCheckedAt.toISOString() : null;
          await fs.writeFile(productsJsonPath, JSON.stringify(productsArray, null, 2), "utf-8");
        }
      } catch (jsonErr) {
        // Silently continue if fs sync fails
      }

      return {
        success: true,
        product: updated,
        liveResult: live,
      };
    }

    return {
      success: true,
      product,
      liveResult: live,
    };
  } catch (err: any) {
    console.error("Error in syncProductAvailability:", err);
    return { success: false, product: null };
  }
}

/**
 * Batch synchronizes all products in the catalog that have a supplierUrl.
 * Enforces the 8-hour freshness policy.
 */
export async function syncAllCatalogAvailability(forceAll = false): Promise<{
  total: number;
  synced: number;
  results: Array<{ slug: string; status: string; updated: boolean }>;
}> {
  try {
    const products = await prisma.product.findMany({
      where: {
        supplierUrl: { not: null },
        isArchived: false,
      },
    });

    const results: Array<{ slug: string; status: string; updated: boolean }> = [];
    let synced = 0;

    for (const prod of products) {
      if (!prod.supplierUrl) continue;
      const isStale = isAvailabilityStale(prod.supplierStockCheckedAt);

      if (forceAll || isStale) {
        const live = await fetchLiveSupplierAvailability(prod.supplierUrl);
        if (live.success) {
          await prisma.product.update({
            where: { id: prod.id },
            data: {
              supplierStockStatus: live.status,
              supplierStockCount: live.stockCount,
              supplierPlatform: live.platform,
              supplierStockMessageEs: live.messageEs,
              supplierStockMessageEn: live.messageEn,
              supplierStockCheckedAt: new Date(),
              supplierLeadDaysMin: live.leadDaysMin,
              supplierLeadDaysMax: live.leadDaysMax,
              supplierLastPriceUSD: live.supplierPriceUSD || prod.supplierLastPriceUSD,
            },
          });
          results.push({ slug: prod.slug, status: live.status, updated: true });
          synced++;
        } else {
          results.push({ slug: prod.slug, status: prod.supplierStockStatus, updated: false });
        }
      } else {
        results.push({ slug: prod.slug, status: prod.supplierStockStatus, updated: false });
      }
    }

    return { total: products.length, synced, results };
  } catch (error) {
    console.error("Error in syncAllCatalogAvailability:", error);
    return { total: 0, synced: 0, results: [] };
  }
}
