/**
 * comboAvailability.ts
 * Dynamic combo availability engine that calculates bundle stock and lead time
 * based on all listed/included products in the combo.
 */

export type ComboStockStatus =
  | "IN_STOCK"
  | "LOW_STOCK"
  | "PRE_ORDER"
  | "OUT_OF_STOCK"
  | "UNAVAILABLE";

export interface ComponentAvailability {
  originalText: string;
  matchedProductId?: string;
  sku?: string;
  name: string;
  status: ComboStockStatus;
  available: boolean;
  isArchived: boolean;
  hasProduct: boolean;
  leadDaysMin: number;
  leadDaysMax: number;
  priceCRC?: number;
}

export interface ComboAvailabilityResult {
  status: ComboStockStatus;
  available: boolean;
  leadDaysMin: number;
  leadDaysMax: number;
  totalComponents: number;
  linkedProductsCount: number;
  inStockCount: number;
  preOrderCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  components: ComponentAvailability[];
  outOfStockComponents: ComponentAvailability[];
  preOrderComponents: ComponentAvailability[];
  summaryEs: string;
  summaryEn: string;
  detailEs: string;
  detailEn: string;
}

/**
 * Searches a catalog product collection to find a match for a combo item.
 * Supports:
 * - Object with id, sku, or slug
 * - String containing SKU pattern like "Product Name [SKU-123]"
 * - String matching SKU, slug, id, or name directly
 */
export function findProductForComboItem(
  item: any,
  catalogProducts: any[]
): any | null {
  if (!item || !Array.isArray(catalogProducts) || catalogProducts.length === 0) {
    return null;
  }

  // Object reference
  if (typeof item === "object") {
    const directSku = item.sku ? String(item.sku).toLowerCase() : null;
    const directId = item.id ? String(item.id).toLowerCase() : null;
    const directSlug = item.slug ? String(item.slug).toLowerCase() : null;

    const found = catalogProducts.find((p) => {
      const pSku = p.sku ? String(p.sku).toLowerCase() : null;
      const pId = p.id ? String(p.id).toLowerCase() : null;
      const pSlug = p.slug ? String(p.slug).toLowerCase() : null;
      return (
        (directSku && pSku === directSku) ||
        (directId && pId === directId) ||
        (directSlug && pSlug === directSlug)
      );
    });
    if (found) return found;
  }

  // String reference
  if (typeof item === "string") {
    const raw = item.trim();
    if (!raw) return null;

    // Check bracketed SKU: e.g. "Escape Deportivo [BMP-Z10-EXH-01]"
    const skuMatch = raw.match(/\[([A-Za-z0-9\-_]+)\]/);
    const bracketSku = skuMatch ? skuMatch[1].toLowerCase() : null;

    if (bracketSku) {
      const found = catalogProducts.find((p) => {
        const pSku = p.sku ? String(p.sku).toLowerCase() : null;
        const pId = p.id ? String(p.id).toLowerCase() : null;
        const pSlug = p.slug ? String(p.slug).toLowerCase() : null;
        return pSku === bracketSku || pId === bracketSku || pSlug === bracketSku;
      });
      if (found) return found;
    }

    const lower = raw.toLowerCase();
    const foundDirect = catalogProducts.find((p) => {
      const pSku = p.sku ? String(p.sku).toLowerCase() : null;
      const pId = p.id ? String(p.id).toLowerCase() : null;
      const pSlug = p.slug ? String(p.slug).toLowerCase() : null;
      const pNameEs = (p.nameEs || p.p_title) ? String(p.nameEs || p.p_title).toLowerCase() : null;
      const pNameEn = p.nameEn ? String(p.nameEn).toLowerCase() : null;

      return (
        pSku === lower ||
        pId === lower ||
        pSlug === lower ||
        (pNameEs && pNameEs === lower) ||
        (pNameEn && pNameEn === lower)
      );
    });
    if (foundDirect) return foundDirect;
  }

  return null;
}

/**
 * Resolves the atomic stock status and lead days of a catalog product.
 */
export function resolveProductStockStatus(product: any): {
  status: ComboStockStatus;
  available: boolean;
  leadDaysMin: number;
  leadDaysMax: number;
  isArchived: boolean;
} {
  const isArchived = Boolean(product?.isArchived);
  if (isArchived) {
    return {
      status: "UNAVAILABLE",
      available: false,
      leadDaysMin: 0,
      leadDaysMax: 0,
      isArchived: true,
    };
  }

  const sStatus = String(product?.supplierStockStatus || "").toUpperCase().trim();
  const generalStock = String(product?.stockStatus || "").toUpperCase().trim();

  let status: ComboStockStatus = "IN_STOCK";
  let available = true;

  if (sStatus === "OUT_OF_STOCK" || sStatus === "UNAVAILABLE") {
    status = sStatus === "UNAVAILABLE" ? "UNAVAILABLE" : "OUT_OF_STOCK";
    available = false;
  } else if (sStatus === "PRE_ORDER" || generalStock === "SPECIAL_ORDER") {
    status = "PRE_ORDER";
    available = true;
  } else if (sStatus === "LOW_STOCK") {
    status = "LOW_STOCK";
    available = true;
  } else {
    status = "IN_STOCK";
    available = true;
  }

  const defaultMin = status === "PRE_ORDER" ? 10 : 7;
  const defaultMax = status === "PRE_ORDER" ? 20 : 12;

  const leadDaysMin = Number(product?.supplierLeadDaysMin) > 0 ? Number(product.supplierLeadDaysMin) : defaultMin;
  const leadDaysMax = Number(product?.supplierLeadDaysMax) > 0 ? Number(product.supplierLeadDaysMax) : defaultMax;

  return {
    status,
    available,
    leadDaysMin,
    leadDaysMax,
    isArchived: false,
  };
}

/**
 * Calculates the complete availability result for a combo based on its listed products.
 *
 * Rules:
 * 1. If ANY component is OUT_OF_STOCK, UNAVAILABLE, or isArchived, the combo is OUT_OF_STOCK.
 * 2. If NO component is out of stock, but ANY component is PRE_ORDER, the combo is PRE_ORDER.
 * 3. If NO component is out of stock/pre-order, but ANY is LOW_STOCK, the combo is LOW_STOCK.
 * 4. Otherwise, the combo is IN_STOCK.
 * 5. Lead times are governed by the maximum lead time of the included components.
 */
export function calculateComboAvailability(
  rawItems: any[] | string | null | undefined,
  catalogProducts: any[] = []
): ComboAvailabilityResult {
  let parsedItems: any[] = [];
  if (Array.isArray(rawItems)) {
    parsedItems = rawItems;
  } else if (typeof rawItems === "string" && rawItems.trim()) {
    try {
      const parsed = JSON.parse(rawItems);
      parsedItems = Array.isArray(parsed) ? parsed : [];
    } catch {
      parsedItems = rawItems.split("\n").map((s) => s.trim()).filter(Boolean);
    }
  }

  const components: ComponentAvailability[] = [];

  for (const item of parsedItems) {
    const rawText = typeof item === "string" ? item : (item.name || item.title || item.sku || "Pieza");
    const matched = findProductForComboItem(item, catalogProducts);

    if (matched) {
      const stock = resolveProductStockStatus(matched);
      components.push({
        originalText: rawText,
        matchedProductId: matched.id,
        sku: matched.sku,
        name: matched.nameEs || matched.p_title || matched.title || matched.sku || rawText,
        status: stock.status,
        available: stock.available,
        isArchived: stock.isArchived,
        hasProduct: true,
        leadDaysMin: stock.leadDaysMin,
        leadDaysMax: stock.leadDaysMax,
        priceCRC: matched.priceCRC || matched.price?.T_price,
      });
    } else {
      // Manual workshop item or unlinked custom line
      components.push({
        originalText: rawText,
        name: rawText,
        status: "IN_STOCK",
        available: true,
        isArchived: false,
        hasProduct: false,
        leadDaysMin: 7,
        leadDaysMax: 12,
      });
    }
  }

  const outOfStockComponents = components.filter((c) => !c.available || c.status === "OUT_OF_STOCK" || c.status === "UNAVAILABLE");
  const preOrderComponents = components.filter((c) => c.status === "PRE_ORDER");
  const lowStockComponents = components.filter((c) => c.status === "LOW_STOCK");
  const inStockComponents = components.filter((c) => c.status === "IN_STOCK");

  const totalComponents = components.length;
  const linkedProductsCount = components.filter((c) => c.hasProduct).length;
  const outOfStockCount = outOfStockComponents.length;
  const preOrderCount = preOrderComponents.length;
  const lowStockCount = lowStockComponents.length;
  const inStockCount = inStockComponents.length;

  // Maximum lead days across all components
  const leadDaysMin = components.length > 0
    ? Math.max(...components.map((c) => c.leadDaysMin))
    : 7;
  const leadDaysMax = components.length > 0
    ? Math.max(...components.map((c) => c.leadDaysMax))
    : 12;

  let status: ComboStockStatus = "IN_STOCK";
  let available = true;
  let summaryEs = "";
  let summaryEn = "";
  let detailEs = "";
  let detailEn = "";

  if (outOfStockCount > 0) {
    status = "OUT_OF_STOCK";
    available = false;
    const namesEs = outOfStockComponents.map((c) => c.name).join(", ");
    summaryEs = outOfStockCount === 1
      ? `Agotado en fabricante: ${outOfStockComponents[0].name}`
      : `Agotado en fabricante (${outOfStockCount} piezas no disponibles)`;
    summaryEn = outOfStockCount === 1
      ? `Out of stock at manufacturer: ${outOfStockComponents[0].name}`
      : `Out of stock at manufacturer (${outOfStockCount} parts unavailable)`;
    detailEs = `Este combo no se puede armar de inmediato porque: ${namesEs} no tiene stock disponible en origen.`;
    detailEn = `This bundle cannot be assembled immediately because: ${namesEs} is out of stock at supplier.`;
  } else if (preOrderCount > 0) {
    status = "PRE_ORDER";
    available = true;
    summaryEs = `Disponible bajo Pre-Orden (${leadDaysMin}-${leadDaysMax} días hábiles)`;
    summaryEn = `Available for Pre-Order (${leadDaysMin}-${leadDaysMax} business days)`;
    detailEs = `Incluye ${preOrderCount} componente(s) que requieren importación bajo pedido especial.`;
    detailEn = `Includes ${preOrderCount} component(s) requiring special import on pre-order.`;
  } else if (lowStockCount > 0) {
    status = "LOW_STOCK";
    available = true;
    summaryEs = "Stock Limitado / Pocas Unidades";
    summaryEn = "Low Stock / Limited Units";
    detailEs = `Incluye componentes con disponibilidad limitada en bodega.`;
    detailEn = `Includes components with limited stock remaining.`;
  } else {
    status = "IN_STOCK";
    available = true;
    summaryEs = "En Stock para Entrega o Taller";
    summaryEn = "In Stock for Delivery or Workshop";
    detailEs = `Todos los componentes listados están disponibles para despacho inmediato.`;
    detailEn = `All listed components are ready for immediate dispatch.`;
  }

  return {
    status,
    available,
    leadDaysMin,
    leadDaysMax,
    totalComponents,
    linkedProductsCount,
    inStockCount,
    preOrderCount,
    lowStockCount,
    outOfStockCount,
    components,
    outOfStockComponents,
    preOrderComponents,
    summaryEs,
    summaryEn,
    detailEs,
    detailEn,
  };
}
