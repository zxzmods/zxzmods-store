import { prisma } from "@/lib/prisma";

export type SupplierStockStatus =
  | "IN_STOCK"
  | "PRE_ORDER"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "UNAVAILABLE";

export type SupplierPlatform =
  | "SHOPIFY"
  | "SUPERATV"
  | "RNG_PERFORMANCE"
  | "BIGCOMMERCE"
  | "MAGENTO"
  | "WOOCOMMERCE"
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
  supplierSalePriceUSD?: number | null;
  automaticDiscountTitle?: string | null;
  automaticDiscountAmountUSD?: number | null;
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
    botProtectionMitigated?: boolean;
    sku?: string;
    totalOnHand?: number | null;
    httpStatus?: number;
    fallback?: boolean;
  };
}

// User directive: availability on products needs to be updated at a minimum of every 8 hours
export const AVAILABILITY_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

// In-memory cache of Shopify baseProductUrl -> parsed product payload (15 min TTL)
// Prevents multiple ?variant=... checks on the same Shopify product from making duplicate HTTP requests or triggering 429 rate limits
const shopifyProductPayloadCache = new Map<
  string,
  { prodData: any; fromDotJson: boolean; fromGraphQL?: boolean; timestamp: number }
>();
const SHOPIFY_PAYLOAD_CACHE_TTL_MS = 15 * 60 * 1000;

export const KNOWN_SHOPIFY_STOREFRONT_TOKENS: Record<string, string> = {
  "rpmsxs.com": "ec7ec3c4888c4f395d14463306136340",
  "teammscdealers.com": "4e50d8d113215018d1eeef0dcaffa896",
  "evopowersports.com": "da4a7f4ea1577b031d42556f55fd094c",
  "dealers.evopowersports.com": "da4a7f4ea1577b031d42556f55fd094c",
  "hangar116.com": "846c6984b1873aabe447f011bbad9549",
};

export const SHOPIFY_HOST_STOREFRONT_ORIGINS: Record<string, string> = {
  "dealers.evopowersports.com": "evopowersports.com",
};

export function resolveShopifyHostAndToken(hostname: string): { targetHost: string; token: string | null } {
  const cleanHost = hostname.toLowerCase().replace(/^www\./, "");
  let targetHost = cleanHost;

  if (cleanHost.endsWith("evopowersports.com")) {
    targetHost = "evopowersports.com";
  } else if (cleanHost.endsWith("teammscdealers.com")) {
    targetHost = "teammscdealers.com";
  } else if (cleanHost.endsWith("rpmsxs.com")) {
    targetHost = "rpmsxs.com";
  } else if (cleanHost.endsWith("hangar116.com")) {
    targetHost = "hangar116.com";
  } else if (SHOPIFY_HOST_STOREFRONT_ORIGINS[cleanHost]) {
    targetHost = SHOPIFY_HOST_STOREFRONT_ORIGINS[cleanHost];
  }

  const token =
    KNOWN_SHOPIFY_STOREFRONT_TOKENS[cleanHost] ||
    KNOWN_SHOPIFY_STOREFRONT_TOKENS[targetHost] ||
    null;

  return { targetHost, token };
}

const SHOPIFY_HANDLE_STOPWORDS = new Set([
  "for",
  "with",
  "and",
  "the",
  "of",
  "to",
  "in",
  "on",
  "by",
  "a",
  "an",
  "w",
  "copy",
  "kit",
  "system",
  "systems",
]);

function tokenizeShopifyText(raw: string): string[] {
  return (raw || "")
    .toLowerCase()
    .replace(/['’"`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Scores how closely a candidate Shopify product (handle + title) matches a requested product handle.
 * Used when resolving dealer portal URLs (e.g. dealers.evopowersports.com -> evopowersports.com)
 * whose handles differ slightly in word order or prefixes.
 */
export function scoreShopifyCandidateMatch(
  sourceHandle: string,
  candidate: { handle?: string | null; title?: string | null }
): number {
  const srcClean = (sourceHandle || "").toLowerCase().trim();
  const candHandle = (candidate.handle || "").toLowerCase().trim();
  if (!srcClean || (!candHandle && !candidate.title)) return 0;
  if (candHandle && srcClean === candHandle) return 1.0;

  const srcAllTokens = tokenizeShopifyText(srcClean);
  const candHandleTokens = tokenizeShopifyText(candHandle);
  const candTitleTokens = tokenizeShopifyText(candidate.title || "");

  const srcCore = Array.from(
    new Set(srcAllTokens.filter((t) => !SHOPIFY_HANDLE_STOPWORDS.has(t) && (t.length >= 2 || t === "r")))
  );
  const candHandleCore = Array.from(
    new Set(candHandleTokens.filter((t) => !SHOPIFY_HANDLE_STOPWORDS.has(t) && (t.length >= 2 || t === "r")))
  );
  const candCombinedSet = new Set([
    ...candHandleCore,
    ...candTitleTokens.filter((t) => !SHOPIFY_HANDLE_STOPWORDS.has(t) && (t.length >= 2 || t === "r")),
  ]);

  if (srcCore.length === 0 || candCombinedSet.size === 0) return 0;

  // Distinctive alphanumeric model/part codes (e.g. p47, p48, p43r, mg1, x3, z10, 400, 415)
  const isCodeToken = (t: string) => /[a-z]/.test(t) && /\d/.test(t);
  const srcCodes = srcCore.filter(isCodeToken);
  const candCodes = Array.from(candCombinedSet).filter(isCodeToken);

  let matchedSrc = 0;
  for (const tok of srcCore) {
    if (candCombinedSet.has(tok)) matchedSrc++;
  }

  let matchedCand = 0;
  const srcSet = new Set(srcCore);
  for (const tok of candHandleCore) {
    if (srcSet.has(tok)) matchedCand++;
  }

  const recall = matchedSrc / srcCore.length;
  const precision = candHandleCore.length > 0 ? matchedCand / candHandleCore.length : recall;
  let score = recall * 0.65 + precision * 0.35;

  // Strong boost when distinctive part/model codes (p47, mg1, x3, etc.) match,
  // and strong penalty when a required distinctive code is missing or contradicted (e.g. p47 vs p48)
  if (srcCodes.length > 0) {
    const matchedCodes = srcCodes.filter((c) => candCombinedSet.has(c)).length;
    const codeRatio = matchedCodes / srcCodes.length;
    if (codeRatio === 1) {
      score += 0.15;
    } else if (matchedCodes === 0) {
      score *= 0.35;
    } else {
      score *= 0.65 + 0.35 * codeRatio;
    }
  }

  // Penalize if candidate introduces a conflicting turbo/model code not in source (e.g. p48 when source asks for p47)
  const extraConflictingCodes = candCodes.filter((c) => !srcSet.has(c) && /^p\d+/i.test(c));
  if (extraConflictingCodes.length > 0 && srcCodes.some((c) => /^p\d+/i.test(c))) {
    score *= 0.4;
  }

  // Respect 2-door vs 4-door / MAX distinction when explicitly present
  const srcHasMax = srcSet.has("max");
  const candHasMax = candHandleCore.includes("max");
  if (srcHasMax !== candHasMax && !candTitleTokens.includes("max")) {
    score *= 0.85;
  }

  return Math.min(1, Math.max(0, Number(score.toFixed(4))));
}

function buildShopifySearchQueries(handle: string): string[] {
  const allTokens = tokenizeShopifyText(handle);
  const coreTokens = allTokens.filter(
    (t) => !SHOPIFY_HANDLE_STOPWORDS.has(t) && (t.length >= 2 || t === "r")
  );
  const uniqueCore = Array.from(new Set(coreTokens));

  const codeTokens = uniqueCore.filter((t) => /[a-z]/.test(t) && /\d/.test(t));
  const queries: string[] = [];

  // 1. Focused query prioritizing distinctive part codes (e.g. p47, mg1) + vehicle/part keywords
  if (codeTokens.length > 0) {
    const contextWords = uniqueCore
      .filter((t) => !codeTokens.includes(t) && t !== "can" && t !== "am" && t !== "evp")
      .slice(0, 4);
    const focused = [...codeTokens.slice(0, 2), ...contextWords].join(" ").trim();
    if (focused) queries.push(focused);
  }

  // 2. Broader phrase from handle core tokens (up to 6 distinctive words, excluding "can"/"am" noise)
  const cleanWords = uniqueCore.filter((t) => t !== "can" && t !== "am");
  if (cleanWords.length > 0) {
    queries.push(cleanWords.slice(0, 6).join(" "));
  }

  // 3. Fallback with first 4 raw tokens if everything else was filtered
  if (queries.length === 0 && allTokens.length > 0) {
    queries.push(allTokens.slice(0, 5).join(" "));
  }

  return Array.from(new Set(queries.filter(Boolean)));
}

/**
 * Probes Shopify Storefront GraphQL `cartCreate` for an active automatic discount
 * (e.g. Black Friday / Cyber Monday / Seasonal automatic sale) on a specific variant.
 * Completely read-only/anonymous cart quote; never submits an order.
 */
async function fetchShopifyAutomaticDiscountPrice(
  targetHost: string,
  token: string,
  variantNumericId: number | string
): Promise<{
  salePriceUSD: number;
  discountAmountUSD: number;
  discountTitle: string | null;
} | null> {
  if (!targetHost || !token || !variantNumericId) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(`https://${targetHost}/api/2024-07/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        query: `mutation($id: ID!) {
          cartCreate(input: { lines: [{ merchandiseId: $id, quantity: 1 }] }) {
            cart {
              cost { totalAmount { amount } }
              lines(first: 2) {
                nodes {
                  cost {
                    amountPerQuantity { amount }
                    totalAmount { amount }
                  }
                  discountAllocations {
                    discountedAmount { amount }
                    ... on CartAutomaticDiscountAllocation { title }
                  }
                }
              }
            }
          }
        }`,
        variables: { id: `gid://shopify/ProductVariant/${variantNumericId}` },
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const d = await res.json().catch(() => null);
    const line = d?.data?.cartCreate?.cart?.lines?.nodes?.[0];
    if (!line) return null;

    const baseAmt = parseFloat(line.cost?.amountPerQuantity?.amount || "0");
    const totalAmt = parseFloat(
      line.cost?.totalAmount?.amount || d?.data?.cartCreate?.cart?.cost?.totalAmount?.amount || "0"
    );
    const alloc = Array.isArray(line.discountAllocations) ? line.discountAllocations[0] : null;
    const discAmt = parseFloat(alloc?.discountedAmount?.amount || "0");

    if (baseAmt > 0 && totalAmt > 0 && totalAmt < baseAmt - 0.05) {
      return {
        salePriceUSD: Number(totalAmt.toFixed(2)),
        discountAmountUSD: Number((discAmt > 0 ? discAmt : baseAmt - totalAmt).toFixed(2)),
        discountTitle: alloc?.title ? String(alloc.title).trim() : null,
      };
    }
  } catch {}
  return null;
}

async function fetchShopifyStorefrontGraphQL(
  hostname: string,
  handle: string,
  variantId?: string | null
): Promise<{ prodData: any } | null> {
  const { targetHost, token } = resolveShopifyHostAndToken(hostname);
  if (!token) return null;

  const gqlHeaders = {
    "Content-Type": "application/json",
    "X-Shopify-Storefront-Access-Token": token,
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  };

  const attachAutoDiscount = async (prodData: any, targetVariantId?: number | string | null) => {
    const variants: any[] = Array.isArray(prodData?.variants) ? prodData.variants : [];
    const matched = targetVariantId
      ? variants.find((v) => String(v?.id) === String(targetVariantId))
      : null;
    const primary = matched || variants[0];
    if (primary?.id) {
      const autoDisc = await fetchShopifyAutomaticDiscountPrice(targetHost, token, primary.id);
      if (autoDisc) {
        prodData.automaticSalePriceUSD = autoDisc.salePriceUSD;
        prodData.automaticDiscountAmountUSD = autoDisc.discountAmountUSD;
        prodData.automaticDiscountTitle = autoDisc.discountTitle;
      }
    }
    return { prodData };
  };

  const formatGqlProduct = async (p: any) => {
    const variantsList = (p.variants?.nodes || []).map((vn: any) => ({
      id: parseInt(vn.id.replace("gid://shopify/ProductVariant/", ""), 10),
      title: vn.title,
      available: vn.availableForSale,
      price: parseFloat(vn.price?.amount || "0"),
    }));
    const prodData: any = {
      title: p.title,
      handle: p.handle,
      available: p.availableForSale,
      tags: p.tags || [],
      price: variantsList[0]?.price || null,
      variants: variantsList,
    };
    return attachAutoDiscount(prodData, variantId);
  };

  try {
    // 1. Direct variant lookup (exact hit for retail store URLs with ?variant=...)
    if (variantId) {
      const q = `
        query getVariant($id: ID!) {
          node(id: $id) {
            ... on ProductVariant {
              id
              title
              availableForSale
              price { amount }
              product {
                title
                handle
                availableForSale
                tags
                variants(first: 50) {
                  nodes { id title availableForSale price { amount } }
                }
              }
            }
          }
        }
      `;
      const res = await fetch(`https://${targetHost}/api/2024-07/graphql.json`, {
        method: "POST",
        headers: gqlHeaders,
        body: JSON.stringify({
          query: q,
          variables: { id: `gid://shopify/ProductVariant/${variantId}` },
        }),
        cache: "no-store",
      });
      if (res.ok) {
        const d = await res.json();
        const vNode = d?.data?.node;
        if (vNode) {
          const matchedNumericId = parseInt(
            vNode.id.replace("gid://shopify/ProductVariant/", ""),
            10
          );
          const p = vNode.product;
          const variantsList = (p?.variants?.nodes || []).map((vn: any) => ({
            id: parseInt(vn.id.replace("gid://shopify/ProductVariant/", ""), 10),
            title: vn.title,
            available: vn.availableForSale,
            price: parseFloat(vn.price?.amount || "0"),
          }));
          const prodData: any = {
            title: p?.title || vNode.title,
            handle: p?.handle || handle,
            available: vNode.availableForSale,
            tags: p?.tags || [],
            price: parseFloat(vNode.price?.amount || "0"),
            variants:
              variantsList.length > 0
                ? variantsList
                : [
                    {
                      id: matchedNumericId,
                      title: vNode.title,
                      available: vNode.availableForSale,
                      price: parseFloat(vNode.price?.amount || "0"),
                    },
                  ],
          };
          return await attachAutoDiscount(prodData, matchedNumericId);
        }
      }
    }

    const qHandle = `
      query getProduct($handle: String!) {
        product(handle: $handle) {
          title
          handle
          availableForSale
          tags
          variants(first: 50) {
            nodes { id title availableForSale price { amount } }
          }
        }
      }
    `;

    const fetchProductByHandle = async (h: string): Promise<any | null> => {
      if (!h) return null;
      const resH = await fetch(`https://${targetHost}/api/2024-07/graphql.json`, {
        method: "POST",
        headers: gqlHeaders,
        body: JSON.stringify({ query: qHandle, variables: { handle: h } }),
        cache: "no-store",
      });
      if (resH.ok) {
        const d = await resH.json();
        return d?.data?.product || null;
      }
      return null;
    };

    // 2. Direct handle lookup (plus quick cleanups like stripping -copy or evp- prefix)
    let p: any = await fetchProductByHandle(handle);
    if (!p && handle) {
      const cleanedVariants = Array.from(
        new Set([
          handle.replace(/-copy(-\d+)?$/i, ""),
          handle.replace(/^evp-/i, ""),
          handle.startsWith("evp-") ? handle : `evp-${handle}`,
        ])
      ).filter((h) => h && h !== handle);

      for (const altHandle of cleanedVariants) {
        p = await fetchProductByHandle(altHandle);
        if (p) break;
      }
    }

    if (p) {
      return await formatGqlProduct(p);
    }

    // 3. Smart ranked search fallback (handles dealer portal URLs like dealers.evopowersports.com
    // where word order or handle slugs differ slightly from retail evopowersports.com)
    if (handle) {
      const searchQueries = buildShopifySearchQueries(handle);
      const gqlCandidatesMap = new Map<string, any>();
      const suggestHandlesMap = new Map<string, { handle: string; title: string }>();

      const qSearch = `
        query searchProducts($query: String!) {
          products(first: 15, query: $query) {
            nodes {
              title
              handle
              availableForSale
              tags
              variants(first: 50) {
                nodes { id title availableForSale price { amount } }
              }
            }
          }
        }
      `;

      for (const qTerm of searchQueries) {
        // Query Storefront GraphQL + Predictive Search in parallel
        const [gqlRes, suggestRes] = await Promise.all([
          fetch(`https://${targetHost}/api/2024-07/graphql.json`, {
            method: "POST",
            headers: gqlHeaders,
            body: JSON.stringify({ query: qSearch, variables: { query: qTerm } }),
            cache: "no-store",
          }).catch(() => null),
          fetch(
            `https://${targetHost}/search/suggest.json?q=${encodeURIComponent(qTerm)}&resources[type]=product&resources[limit]=10`,
            {
              headers: {
                Accept: "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
              },
              cache: "no-store",
            }
          ).catch(() => null),
        ]);

        if (gqlRes && gqlRes.ok) {
          const sData = await gqlRes.json().catch(() => null);
          const nodes = sData?.data?.products?.nodes || [];
          for (const n of nodes) {
            if (n?.handle && !gqlCandidatesMap.has(n.handle)) {
              gqlCandidatesMap.set(n.handle, n);
            }
          }
        }

        if (suggestRes && suggestRes.ok) {
          const sugData = await suggestRes.json().catch(() => null);
          const sugProds = sugData?.resources?.results?.products || [];
          for (const sp of sugProds) {
            if (sp?.handle && !suggestHandlesMap.has(sp.handle)) {
              suggestHandlesMap.set(sp.handle, {
                handle: String(sp.handle),
                title: String(sp.title || ""),
              });
            }
          }
        }

        // Early stop if we already found a very high-confidence match (>= 0.85)
        let topScoreSoFar = 0;
        gqlCandidatesMap.forEach((n) => {
          topScoreSoFar = Math.max(topScoreSoFar, scoreShopifyCandidateMatch(handle, n));
        });
        suggestHandlesMap.forEach((s) => {
          topScoreSoFar = Math.max(topScoreSoFar, scoreShopifyCandidateMatch(handle, s));
        });
        if (topScoreSoFar >= 0.85) break;
      }

      // Rank ALL discovered candidates from both GraphQL and Predictive Search
      let bestHandle: string | null = null;
      let bestScore = 0;

      gqlCandidatesMap.forEach((node, h) => {
        const sc = scoreShopifyCandidateMatch(handle, node);
        if (sc > bestScore) {
          bestScore = sc;
          bestHandle = h;
        }
      });

      suggestHandlesMap.forEach((sug, h) => {
        const sc = scoreShopifyCandidateMatch(handle, sug);
        if (sc > bestScore) {
          bestScore = sc;
          bestHandle = h;
        }
      });

      // Only accept candidates that meaningfully match the requested product (never blindly return nodes[0]!)
      if (bestHandle && bestScore >= 0.45) {
        const matchedNode =
          gqlCandidatesMap.get(bestHandle) || (await fetchProductByHandle(bestHandle));
        if (matchedNode) {
          return await formatGqlProduct(matchedNode);
        }
      }
    }
  } catch {}
  return null;
}

export function clearShopifyPayloadCacheForUrl(rawUrl?: string | null) {
  if (!rawUrl) return;
  try {
    const parsed = new URL(cleanSupplierUrl(rawUrl));
    const cleanPathname = parsed.pathname
      .replace(/\/$/, "")
      .replace(/\.(js|json)$/i, "")
      .replace(/\/collections\/[^/]+\/products\//i, "/products/");
    const baseProductUrl = `${parsed.origin}${cleanPathname}`;
    shopifyProductPayloadCache.delete(baseProductUrl);
  } catch {}
}

export function isAvailabilityStale(checkedAt: Date | string | null | undefined): boolean {
  if (!checkedAt) return true;
  const time = new Date(checkedAt).getTime();
  if (isNaN(time)) return true;
  return Date.now() - time > AVAILABILITY_MAX_AGE_MS;
}

/**
 * Normalizes URL and removes tracking UTM tags while preserving functional parameters
 */
export function cleanSupplierUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.trim());
    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "pr_prod_strat",
      "pr_rec_id",
      "pr_rec_pid",
      "pr_ref_pid",
      "pr_seq",
      "_pos",
      "_sid",
      "_ss",
      "ref",
      "source",
    ];
    for (const p of trackingParams) {
      parsed.searchParams.delete(p);
    }
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Derives a clean human-readable product title from a supplier URL slug
 */
export function extractTitleFromUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.trim());
    let path = parsed.pathname.replace(/\/$/, "");
    if (parsed.searchParams.has("olsPage")) {
      const ols = parsed.searchParams.get("olsPage") || "";
      if (ols.includes("/")) path = ols;
    }
    const segments = path.split("/").filter(Boolean);
    const last = segments[segments.length - 1] || "";
    if (!last || last === "products" || last === "ols" || last === "item" || last === "shop") {
      return "";
    }
    return last
      .replace(/[?#].*$/, "")
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ")
      .replace(/\bCan-am\b/gi, "Can-Am")
      .replace(/\bX3\b/gi, "X3")
      .replace(/\bMax\b/gi, "MAX")
      .replace(/\bCfmoto\b/gi, "CFMOTO")
      .replace(/\bBov\b/gi, "BOV")
      .replace(/\bRzr\b/gi, "RZR")
      .replace(/\bU10\b/gi, "U10")
      .replace(/\bZ10\b/gi, "Z10")
      .replace(/\bHdpe\b/gi, "HDPE")
      .replace(/\bRng\b/gi, "RNG")
      .replace(/\bRpm\b/gi, "RPM")
      .replace(/\bKrx\b/gi, "KRX")
      .replace(/\bEcu\b/gi, "ECU")
      .replace(/\bCvt\b/gi, "CVT");
  } catch {
    return "";
  }
}

/**
 * Detects ecommerce platform or vendor by hostname
 */
export function detectSupplierPlatform(urlStr: string): SupplierPlatform {
  try {
    const host = new URL(urlStr).hostname.toLowerCase();
    if (host.includes("superatv.com")) return "SUPERATV";
    if (host.includes("rngperformance.net")) return "RNG_PERFORMANCE";
    if (host.includes("myshopify.com") || urlStr.includes("/products/")) return "SHOPIFY";
    if (host.includes("bigcommerce.com")) return "BIGCOMMERCE";
    if (host.includes("woocommerce") || urlStr.includes("/product/")) return "WOOCOMMERCE";
    return "GENERIC_HTML";
  } catch {
    return "GENERIC_HTML";
  }
}

/**
 * Extracts price from HTML string using Schema.org JSON-LD or meta tags
 */
function parseJsonLdSafely(rawJson: string): any | null {
  try {
    return JSON.parse(rawJson);
  } catch {
    try {
      const sanitized = rawJson.replace(/[\u0000-\u001F]+/g, " ");
      return JSON.parse(sanitized);
    } catch {
      return null;
    }
  }
}

function extractPriceFromHtml(html: string, requestedVariantId?: string | null): number | null {
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatches) {
    for (const block of jsonLdMatches) {
      try {
        const rawJson = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
        const parsed = parseJsonLdSafely(rawJson);
        if (!parsed) continue;
        const offers = parsed?.offers || (Array.isArray(parsed?.["@graph"]) ? parsed["@graph"].find((i: any) => i?.offers)?.offers : null);

        if (offers) {
          const offerList = Array.isArray(offers) ? offers : [offers];
          const matchedOffer =
            (requestedVariantId
              ? offerList.find((o: any) => typeof o?.url === "string" && o.url.includes(`variant=${requestedVariantId}`))
              : null) || offerList[0];

          const rawOfferPrice =
            matchedOffer?.price ??
            matchedOffer?.lowPrice ??
            matchedOffer?.priceSpecification?.price ??
            offers.price ??
            offers.lowPrice ??
            offers?.priceSpecification?.price;
          if (rawOfferPrice !== undefined && rawOfferPrice !== null) {
            const numP = Number(String(rawOfferPrice).replace(/[^0-9.]/g, ""));
            if (!isNaN(numP) && numP > 0) return Number(numP.toFixed(2));
          }
        }
      } catch {}
    }
  }

  const metaPatterns = [
    /<meta[^>]+property=["'](?:product|og):price:amount["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["'](?:product|og):price:amount["']/i,
    /<[^>]+itemprop=["']price["'][^>]+content=["']([^"']+)["']/i,
    /"price"\s*:\s*"?(\d{1,5}(?:\.\d{1,2})?)"?/i,
  ];
  for (const regex of metaPatterns) {
    const match = html.match(regex);
    if (match && match[1]) {
      const parsed = Number(String(match[1]).replace(/[^0-9.]/g, ""));
      if (!isNaN(parsed) && parsed > 0 && parsed < 50000) {
        return Number(parsed.toFixed(2));
      }
    }
  }

  return null;
}

/**
 * Universal live scraper & API resolver for US supplier e-commerce websites.
 * NEVER blocks or rejects product registration on external bot challenges (429/403/500/timeouts).
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
      leadDaysMax: 21,
      checkedAt: nowIso,
    };
  }

  let domain = "";
  try {
    domain = new URL(url).hostname.toLowerCase();
  } catch {
    domain = "";
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

  // 1. Specialized Resolver for RNG Performance (GoDaddy OLS backend)
  if (domain.includes("rngperformance.net")) {
    const fallbackTitle = extractTitleFromUrl(url) || "RNG Performance Product";
    let slug = "";
    const olsMatch = url.match(/\/ols\/products\/([^\/?#]+)/i) || url.match(/[?&]olsPage=(?:products\/)?([^\/?#]+)/i);
    if (olsMatch && olsMatch[1]) {
      slug = olsMatch[1];
    } else {
      const parts = new URL(url).pathname.split("/").filter(Boolean);
      slug = parts[parts.length - 1] || "";
    }

    if (slug) {
      try {
        const storeId = "04194c47-43c0-43db-8482-577627455ca8";
        const godaddyApiUrl = `https://${storeId}.onlinestore.godaddy.com/api/v1/products/${slug}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const apiRes = await fetch(godaddyApiUrl, {
          headers: {
            Accept: "application/json",
            "User-Agent": commonHeaders["User-Agent"],
          },
          signal: controller.signal,
          cache: "no-store",
        }).catch(() => null);

        clearTimeout(timeoutId);

        if (apiRes && apiRes.ok) {
          const text = await apiRes.text();
          if (text.trim().startsWith("{")) {
            const data = JSON.parse(text);
            const title = data.name || fallbackTitle;
            const parsedPrice = Number(data.price);
            const price = Number.isFinite(parsedPrice) && parsedPrice > 0 ? Number(parsedPrice.toFixed(2)) : null;
            const isAvailable = data.available !== false;
            const totalStock = typeof data.total_on_hand === "number" ? data.total_on_hand : null;

            return {
              success: true,
              url,
              platform: "RNG_PERFORMANCE",
              status: isAvailable ? "IN_STOCK" : "OUT_OF_STOCK",
              available: isAvailable,
              stockCount: totalStock,
              supplierPriceUSD: price,
              title,
              messageEs: isAvailable
                ? `Disponible en RNG Performance (${price ? `$${price} USD` : "Stock verificado"})`
                : "Agotado temporalmente en proveedor RNG Performance",
              messageEn: isAvailable
                ? `Available at RNG Performance (${price ? `$${price} USD` : "Stock verified"})`
                : "Temporarily out of stock at RNG Performance",
              leadDaysMin: 7,
              leadDaysMax: 21,
              checkedAt: nowIso,
              rawDetails: {
                platformIdentified: "RNG Performance (GoDaddy OLS API)",
                sku: data.sku,
                totalOnHand: totalStock,
              },
            };
          }
        }
      } catch {
        // Fall through to resilient fallback
      }
    }

    // RNG fallback if API timed out or server had transient 504
    return {
      success: true,
      url,
      platform: "RNG_PERFORMANCE",
      status: "IN_STOCK",
      available: true,
      stockCount: null,
      supplierPriceUSD: null,
      title: fallbackTitle,
      messageEs: "Enlace de RNG Performance registrado correctamente. Stock proyectado: En Stock (7-21 días entrega).",
      messageEn: "RNG Performance link registered successfully. Projected stock: In Stock (7-21 days delivery).",
      leadDaysMin: 7,
      leadDaysMax: 21,
      checkedAt: nowIso,
      rawDetails: {
        platformIdentified: "RNG Performance (Catalog Fallback)",
        fallback: true,
      },
    };
  }

  // 2. Specialized Resolver for SuperATV (Vercel Security Checkpoint mitigation)
  if (domain.includes("superatv.com")) {
    const fallbackTitle = extractTitleFromUrl(url) || "SuperATV Product";
    let satvPrice: number | null = null;
    let satvTitle = fallbackTitle;

    // Try live fetch with realistic browser headers
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const htmlRes = await fetch(url, {
        headers: {
          ...commonHeaders,
          "Sec-Ch-Ua": '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1",
        },
        signal: controller.signal,
        cache: "no-store",
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (htmlRes && htmlRes.ok) {
        const html = await htmlRes.text();
        const priceFound = extractPriceFromHtml(html);
        if (priceFound) satvPrice = priceFound;
        const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
        if (titleMatch && titleMatch[1] && !titleMatch[1].includes("Security Checkpoint")) {
          satvTitle = titleMatch[1].split("|")[0].split("-")[0].trim();
        }
      }
    } catch {
      // Handled by graceful fallback below
    }

    return {
      success: true,
      url,
      platform: "SUPERATV",
      status: "IN_STOCK",
      available: true,
      stockCount: null,
      supplierPriceUSD: satvPrice,
      title: satvTitle,
      messageEs: satvPrice
        ? `Enlace SuperATV verificado: $${satvPrice} USD (En Stock, 7-21 días entrega).`
        : `Enlace SuperATV registrado exitosamente. Stock proyectado: En Stock (7-21 días entrega).`,
      messageEn: satvPrice
        ? `SuperATV link verified: $${satvPrice} USD (In Stock, 7-21 days delivery).`
        : `SuperATV link registered successfully. Projected stock: In Stock (7-21 days delivery).`,
      leadDaysMin: 7,
      leadDaysMax: 21,
      checkedAt: nowIso,
      rawDetails: {
        platformIdentified: "SuperATV Official Catalog",
        botProtectionMitigated: true,
      },
    };
  }

  // 3. Check for Shopify endpoint (.js / .json)
  let requestedVariantId: string | null = null;
  try {
    requestedVariantId = new URL(url).searchParams.get("variant");
  } catch {}

  let hitShopifyRateLimit = false;
  const isShopifyPattern = url.includes("/products/");
  if (isShopifyPattern) {
    try {
      const parsedShopifyUrl = new URL(url);
      const cleanPathname = parsedShopifyUrl.pathname
        .replace(/\/$/, "")
        .replace(/\.(js|json)$/i, "")
        .replace(/\/collections\/[^/]+\/products\//i, "/products/");
      const baseProductUrl = `${parsedShopifyUrl.origin}${cleanPathname}`;

      const parseShopifyPriceValue = (rawVal: any, fromDotJson: boolean): number | null => {
        if (typeof rawVal === "number" && rawVal > 0) {
          return fromDotJson ? Number(rawVal.toFixed(2)) : Number((rawVal / 100).toFixed(2));
        }
        if (typeof rawVal === "string" && rawVal.trim()) {
          const trimmed = rawVal.trim();
          const num = parseFloat(trimmed);
          if (!isNaN(num) && num > 0) {
            if (trimmed.includes(".") || fromDotJson) {
              return Number(num.toFixed(2));
            }
            return Number((num / 100).toFixed(2));
          }
        }
        return null;
      };

      let cachedShopifyPayload = shopifyProductPayloadCache.get(baseProductUrl);
      if (
        cachedShopifyPayload &&
        Date.now() - cachedShopifyPayload.timestamp > SHOPIFY_PAYLOAD_CACHE_TTL_MS
      ) {
        shopifyProductPayloadCache.delete(baseProductUrl);
        cachedShopifyPayload = undefined;
      }

      if (!cachedShopifyPayload) {
        const { token: storefrontToken } = resolveShopifyHostAndToken(parsedShopifyUrl.hostname);
        if (storefrontToken) {
          const productHandle = cleanPathname.split("/").filter(Boolean).pop() || "";
          const gqlPayload = await fetchShopifyStorefrontGraphQL(
            parsedShopifyUrl.hostname,
            productHandle,
            requestedVariantId
          );
          if (gqlPayload) {
            const entry = {
              timestamp: Date.now(),
              prodData: gqlPayload.prodData,
              fromDotJson: true,
              fromGraphQL: true,
            };
            cachedShopifyPayload = entry;
            shopifyProductPayloadCache.set(baseProductUrl, entry);
          }
        }
      }

      if (!cachedShopifyPayload) {
        const { targetHost } = resolveShopifyHostAndToken(parsedShopifyUrl.hostname);
        const altOrigin =
          targetHost && targetHost !== parsedShopifyUrl.hostname.toLowerCase().replace(/^www\./, "")
            ? `https://${targetHost}`
            : null;
        const candidateUrls = [
          { endpointUrl: `${baseProductUrl}.js`, isDotJson: false },
          { endpointUrl: `${baseProductUrl}.json`, isDotJson: true },
          ...(altOrigin
            ? [
                { endpointUrl: `${altOrigin}${cleanPathname}.js`, isDotJson: false },
                { endpointUrl: `${altOrigin}${cleanPathname}.json`, isDotJson: true },
              ]
            : []),
        ];

        for (const cand of candidateUrls) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const shopifyRes = await fetch(cand.endpointUrl, {
            headers: { ...commonHeaders, Accept: "application/json" },
            signal: controller.signal,
            cache: "no-store",
          }).catch(() => null);

          clearTimeout(timeoutId);

          if (shopifyRes && shopifyRes.status === 429) {
            // Stop immediately on 429 so we do not trigger extended Shopify rate limiting
            hitShopifyRateLimit = true;
            break;
          }

          if (shopifyRes && shopifyRes.ok) {
            const text = await shopifyRes.text();
            if (text.trim().startsWith("{")) {
              const rawJson = JSON.parse(text);
              const isWrappedProductJson = Boolean(
                rawJson?.product && typeof rawJson.product === "object"
              );
              const prodData = isWrappedProductJson ? rawJson.product : rawJson;
              const fromDotJson = cand.isDotJson || isWrappedProductJson;
              cachedShopifyPayload = {
                prodData,
                fromDotJson,
                timestamp: Date.now(),
              };
              shopifyProductPayloadCache.set(baseProductUrl, cachedShopifyPayload);
              break;
            }
          }
        }
      }

      if (cachedShopifyPayload) {
        const { prodData, fromDotJson, fromGraphQL } = cachedShopifyPayload;
        const title = prodData.title || extractTitleFromUrl(url);
        const variants = Array.isArray(prodData.variants) ? prodData.variants : [];
        const matchedVariant = requestedVariantId
          ? variants.find((v: any) => String(v?.id) === String(requestedVariantId))
          : null;
        const primaryVariant = matchedVariant || variants[0] || null;

        let price: number | null = null;
        if (matchedVariant) {
          price = parseShopifyPriceValue(matchedVariant.price, fromDotJson);
        }
        if (price === null && prodData.price !== undefined) {
          price = parseShopifyPriceValue(prodData.price, fromDotJson);
        }
        if (price === null && primaryVariant) {
          price = parseShopifyPriceValue(primaryVariant.price, fromDotJson);
        }
        if (price === null && variants.length > 0) {
          for (const v of variants) {
            const vp = parseShopifyPriceValue(v?.price, fromDotJson);
            if (vp !== null) {
              price = vp;
              break;
            }
          }
        }

        let anyAvailable = false;
        if (matchedVariant) {
          // Strict variant availability check when ?variant=... is specified
          if (typeof matchedVariant.available === "boolean") {
            anyAvailable = matchedVariant.available;
          } else if (
            typeof matchedVariant.inventory_quantity === "number" &&
            matchedVariant.inventory_management
          ) {
            anyAvailable =
              matchedVariant.inventory_quantity > 0 ||
              matchedVariant.inventory_policy === "continue";
          } else if (typeof prodData.available === "boolean") {
            anyAvailable = prodData.available;
          } else {
            anyAvailable = true;
          }
        } else if (variants.some((v: any) => typeof v?.available === "boolean")) {
          anyAvailable = variants.some((v: any) => v.available === true);
        } else if (typeof prodData.available === "boolean") {
          anyAvailable = prodData.available;
        } else if (variants.length > 0) {
          anyAvailable = variants.some((v: any) => {
            if (typeof v?.inventory_quantity === "number" && v?.inventory_management) {
              return v.inventory_quantity > 0 || v.inventory_policy === "continue";
            }
            return true;
          });
        }

        // Detect Pre-Order tags or inventory policies
        const tagsArr = Array.isArray(prodData.tags)
          ? prodData.tags
          : typeof prodData.tags === "string"
          ? prodData.tags.split(",")
          : [];
        const fullTextLower = `${title} ${prodData.description || prodData.body_html || ""} ${tagsArr.join(" ")}`.toLowerCase();
        const hasPreOrderTag =
          fullTextLower.includes("pre-order") ||
          fullTextLower.includes("preorder") ||
          fullTextLower.includes("preventa") ||
          fullTextLower.includes("backorder");

        const targetVariantsForStock = matchedVariant ? [matchedVariant] : variants;
        const isInventoryManaged = targetVariantsForStock.some((v: any) => v?.inventory_management);
        const totalStock = targetVariantsForStock.reduce((sum: number, v: any) => {
          if (typeof v?.inventory_quantity === "number") {
            return sum + Math.max(0, v.inventory_quantity);
          }
          return sum;
        }, 0);

        let status: SupplierStockStatus = "IN_STOCK";
        let msgEs = "Disponible para entrega o importación inmediata";
        let msgEn = "In stock ready for immediate delivery or import";

        if (!anyAvailable) {
          status = "OUT_OF_STOCK";
          msgEs = "Agotado temporalmente (Disponible para cotización de reserva)";
          msgEn = "Temporarily out of stock (Available for reservation quote)";
        } else if (hasPreOrderTag) {
          status = "PRE_ORDER";
          msgEs = "Disponible en Preventa (Reserva prioritaria)";
          msgEn = "Available for Pre-Order (Priority reservation)";
        } else if (isInventoryManaged && totalStock > 0 && totalStock <= 3) {
          status = "LOW_STOCK";
          msgEs = `Últimas ${totalStock} unidades en proveedor`;
          msgEn = `Only ${totalStock} left at supplier`;
        }

        if (price !== null || variants.length > 0) {
          const autoSalePrice =
            typeof prodData.automaticSalePriceUSD === "number" &&
            prodData.automaticSalePriceUSD > 0 &&
            (price === null || prodData.automaticSalePriceUSD < price)
              ? Number(prodData.automaticSalePriceUSD.toFixed(2))
              : null;
          const autoDiscountAmt =
            autoSalePrice !== null && typeof prodData.automaticDiscountAmountUSD === "number"
              ? Number(prodData.automaticDiscountAmountUSD.toFixed(2))
              : null;
          const autoDiscountTitle =
            autoSalePrice !== null && prodData.automaticDiscountTitle
              ? String(prodData.automaticDiscountTitle)
              : null;

          return {
            success: true,
            url,
            platform: "SHOPIFY",
            status,
            available: anyAvailable,
            stockCount: totalStock > 0 ? totalStock : null,
            supplierPriceUSD: price,
            supplierSalePriceUSD: autoSalePrice,
            automaticDiscountTitle: autoDiscountTitle,
            automaticDiscountAmountUSD: autoDiscountAmt,
            title,
            messageEs: msgEs,
            messageEn: msgEn,
            leadDaysMin: status === "PRE_ORDER" ? 14 : 7,
            leadDaysMax: status === "PRE_ORDER" ? 28 : 21,
            checkedAt: nowIso,
            rawDetails: {
              platformIdentified: fromGraphQL
                ? "Shopify Storefront API (GraphQL)"
                : fromDotJson
                ? "Shopify Product API (.json)"
                : "Shopify Product API (.js)",
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

  if (hitShopifyRateLimit) {
    const fallbackTitle = extractTitleFromUrl(url) || "Producto de Proveedor";
    return {
      success: true,
      url,
      platform: "SHOPIFY",
      status: "IN_STOCK",
      available: true,
      stockCount: null,
      supplierPriceUSD: null,
      title: fallbackTitle,
      messageEs: "Enlace de proveedor registrado exitosamente [SHOPIFY]. Stock proyectado: En Stock (7-21 días entrega).",
      messageEn: "Supplier link registered successfully [SHOPIFY]. Projected stock: In Stock (7-21 days delivery).",
      leadDaysMin: 7,
      leadDaysMax: 21,
      checkedAt: nowIso,
      rawDetails: {
        platformIdentified: "SHOPIFY",
        httpStatus: 429,
        botProtectionMitigated: true,
      },
    };
  }

  // 4. Generic HTML & Schema.org / JSON-LD inspection
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
      // If remote site returns 404, mark as unavailable
      if (htmlRes.status === 404) {
        return {
          success: false,
          url,
          platform: detectSupplierPlatform(url),
          status: "UNAVAILABLE",
          available: false,
          stockCount: null,
          supplierPriceUSD: null,
          title: extractTitleFromUrl(url),
          messageEs: "Producto no encontrado en proveedor (404)",
          messageEn: "Product not found on supplier site (404)",
          leadDaysMin: 7,
          leadDaysMax: 21,
          checkedAt: nowIso,
        };
      }

      // If remote site returns 429, 403, 500, etc. (bot defense or server error),
      // DO NOT reject product registration or set to OUT_OF_STOCK! Return IN_STOCK with detected platform.
      const fallbackTitle = extractTitleFromUrl(url) || "Producto de Proveedor";
      const detectedPlatform = detectSupplierPlatform(url);

      return {
        success: true,
        url,
        platform: detectedPlatform,
        status: "IN_STOCK",
        available: true,
        stockCount: null,
        supplierPriceUSD: null,
        title: fallbackTitle,
        messageEs: `Enlace de proveedor registrado exitosamente [${detectedPlatform}]. Stock proyectado: En Stock (7-21 días entrega).`,
        messageEn: `Supplier link registered successfully [${detectedPlatform}]. Projected stock: In Stock (7-21 days delivery).`,
        leadDaysMin: 7,
        leadDaysMax: 21,
        checkedAt: nowIso,
        rawDetails: {
          platformIdentified: detectedPlatform,
          httpStatus: htmlRes.status,
          botProtectionMitigated: true,
        },
      };
    }

    const html = await htmlRes.text();
    const htmlWithoutScripts = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ");
    const htmlLower = htmlWithoutScripts.toLowerCase();

    // Check Schema.org JSON-LD tags
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    let schemaAvailability: string | null = null;
    let schemaPrice: number | null = null;
    let schemaTitle: string | null = null;

    if (jsonLdMatches) {
      for (const block of jsonLdMatches) {
        try {
          const rawJson = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
          const parsed = parseJsonLdSafely(rawJson);
          if (!parsed) continue;
          const offers = parsed?.offers || (Array.isArray(parsed?.["@graph"]) ? parsed["@graph"].find((i: any) => i?.offers)?.offers : null);

          if (parsed?.name && typeof parsed.name === "string" && parsed?.["@type"] !== "Organization") {
            schemaTitle = parsed.name.trim();
          }

          if (offers) {
            const offerList = Array.isArray(offers) ? offers : [offers];
            const matchedOffer =
              (requestedVariantId
                ? offerList.find((o: any) => typeof o?.url === "string" && o.url.includes(`variant=${requestedVariantId}`))
                : null) || offerList[0];

            const avail = typeof matchedOffer?.availability === "string" ? matchedOffer.availability : typeof offers.availability === "string" ? offers.availability : null;
            if (avail) schemaAvailability = avail;
            const rawOfferPrice =
              matchedOffer?.price ??
              matchedOffer?.lowPrice ??
              matchedOffer?.priceSpecification?.price ??
              offers.price ??
              offers.lowPrice ??
              offers?.priceSpecification?.price;
            if (rawOfferPrice !== undefined && rawOfferPrice !== null) {
              const numP = Number(String(rawOfferPrice).replace(/[^0-9.]/g, ""));
              if (!isNaN(numP) && numP > 0) schemaPrice = Number(numP.toFixed(2));
            }
            if (schemaPrice) break;
          }
        } catch {}
      }
    }

    // Fallback meta tag / microdata price extraction for generic e-commerce sites
    if (!schemaPrice) {
      schemaPrice = extractPriceFromHtml(html, requestedVariantId);
    }

    // Determine status from Schema or HTML keywords
    let status: SupplierStockStatus = "IN_STOCK";
    let msgEs = "Disponible para entrega o importación inmediata";
    let msgEn = "In stock ready for immediate delivery or import";

    const schemaIsExplicitlyInStock = Boolean(schemaAvailability && /instock/i.test(schemaAvailability));

    const isPreOrder =
      Boolean(schemaAvailability && /preorder/i.test(schemaAvailability)) ||
      htmlLower.includes("pre-order now") ||
      htmlLower.includes("preorder now") ||
      htmlLower.includes("pre-order button") ||
      htmlLower.includes("preorder-now");

    const isOutOfStock =
      !schemaIsExplicitlyInStock &&
      (Boolean(
        schemaAvailability &&
          (/outofstock|soldout|discontinued/i.test(schemaAvailability))
      ) ||
        (!isShopifyPattern && htmlLower.includes("sold out")) ||
        htmlLower.includes("out of stock") ||
        htmlLower.includes("temporarily unavailable") ||
        htmlLower.includes("currently unavailable"));

    const isBackorder =
      Boolean(schemaAvailability && /backorder/i.test(schemaAvailability)) ||
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

    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const htmlTitle = titleMatch ? titleMatch[1].split("|")[0].split("-")[0].trim() : null;
    const finalTitle = schemaTitle || htmlTitle || extractTitleFromUrl(url);

    return {
      success: true,
      url,
      platform: schemaAvailability ? "SCHEMA_ORG" : detectSupplierPlatform(url),
      status,
      available: (status as SupplierStockStatus) !== "OUT_OF_STOCK" && (status as SupplierStockStatus) !== "UNAVAILABLE",
      stockCount: null,
      supplierPriceUSD: schemaPrice,
      title: finalTitle,
      messageEs: msgEs,
      messageEn: msgEn,
      leadDaysMin: status === "PRE_ORDER" ? 14 : 7,
      leadDaysMax: status === "PRE_ORDER" ? 28 : 21,
      checkedAt: nowIso,
      rawDetails: {
        platformIdentified: schemaAvailability ? "Schema.org / JSON-LD" : "HTML Heuristic",
        isPreOrderTagged: isPreOrder,
        hasAddToCartBtn: htmlLower.includes("add to cart"),
      },
    };
  } catch (error: any) {
    const fallbackTitle = extractTitleFromUrl(url) || "Producto de Proveedor";
    const detectedPlatform = detectSupplierPlatform(url);
    return {
      success: true, // Safe baseline: never block product registration or sales
      url,
      platform: detectedPlatform,
      status: "IN_STOCK",
      available: true,
      stockCount: null,
      supplierPriceUSD: null,
      title: fallbackTitle,
      messageEs: `Enlace de proveedor registrado exitosamente [${detectedPlatform}]. Stock proyectado: En Stock (7-21 días entrega).`,
      messageEn: `Supplier link registered successfully [${detectedPlatform}]. Projected stock: In Stock (7-21 days delivery).`,
      leadDaysMin: 7,
      leadDaysMax: 21,
      checkedAt: nowIso,
      rawDetails: {
        platformIdentified: detectedPlatform,
        fallback: true,
      },
    };
  }
}

function getShopifyBaseUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || !rawUrl.includes("/products/")) return null;
  try {
    const parsed = new URL(cleanSupplierUrl(rawUrl));
    const cleanPathname = parsed.pathname
      .replace(/\/$/, "")
      .replace(/\.(js|json)$/i, "")
      .replace(/\/collections\/[^/]+\/products\//i, "/products/");
    return `${parsed.origin}${cleanPathname}`;
  } catch {
    return null;
  }
}

/**
 * Checks a product (and optionally a specific parameter variant supplierUrl) in the database.
 * If older than 8 hours (or forceFresh is true), updates the database (including per-option availability in parametersJson)
 * and returns fresh availability for the requested variant and all sibling variants.
 */
export async function syncProductAvailability(
  productIdOrSlug: string,
  forceFresh = false,
  requestedSupplierUrl?: string | null
): Promise<{
  success: boolean;
  product: any;
  liveResult?: SupplierAvailabilityResult;
  targetAvailability?: any;
  variantAvailabilities?: Record<string, any>;
}> {
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

    // Parse parametersJson to inspect variant option & matrix connection supplierUrls
    let parsedParameters: any[] = [];
    if (product.parametersJson) {
      try {
        const parsed = JSON.parse(product.parametersJson);
        if (Array.isArray(parsed)) parsedParameters = parsed;
      } catch {}
    }

    // Collect all legitimate supplierUrls configured on this product (base + options + connections)
    const allowedCleanUrls = new Set<string>();
    const baseCleanUrl = product.supplierUrl ? cleanSupplierUrl(product.supplierUrl) : null;
    if (baseCleanUrl) allowedCleanUrls.add(baseCleanUrl);

    for (const param of parsedParameters) {
      if (param?.type === "cart_addon" || param?.type === "text_input") continue;
      if (typeof param?.supplierUrl === "string" && param.supplierUrl.trim()) {
        allowedCleanUrls.add(cleanSupplierUrl(param.supplierUrl));
      }
      if (Array.isArray(param?.options)) {
        for (const opt of param.options) {
          if (typeof opt?.supplierUrl === "string" && opt.supplierUrl.trim()) {
            allowedCleanUrls.add(cleanSupplierUrl(opt.supplierUrl));
          }
          if (Array.isArray(opt?.connections)) {
            for (const conn of opt.connections) {
              if (typeof conn?.supplierUrl === "string" && conn.supplierUrl.trim()) {
                allowedCleanUrls.add(cleanSupplierUrl(conn.supplierUrl));
              }
            }
          }
        }
      }
    }

    const reqCleanUrl =
      requestedSupplierUrl && requestedSupplierUrl.trim()
        ? cleanSupplierUrl(requestedSupplierUrl)
        : null;

    // Only allow requestedSupplierUrl if it belongs to this product
    const effectiveTargetUrl =
      reqCleanUrl && allowedCleanUrls.has(reqCleanUrl)
        ? reqCleanUrl
        : baseCleanUrl;

    // Helper to build a normalized availability response object
    const buildAvailabilityObject = (src: {
      status?: string | null;
      stockCount?: number | null;
      platform?: string | null;
      messageEs?: string | null;
      messageEn?: string | null;
      leadDaysMin?: number | null;
      leadDaysMax?: number | null;
      supplierUrl?: string | null;
      supplierPriceUSD?: number | null;
      checkedAt?: Date | string | null;
    }) => {
      const st = src.status || "IN_STOCK";
      return {
        status: st,
        available: st !== "OUT_OF_STOCK" && st !== "UNAVAILABLE",
        stockCount: src.stockCount ?? null,
        platform: src.platform || product.supplierPlatform || "SHOPIFY",
        messageEs:
          src.messageEs ||
          (st === "OUT_OF_STOCK"
            ? "Agotado temporalmente (Disponible para cotización de reserva)"
            : "Disponible para entrega o importación inmediata"),
        messageEn:
          src.messageEn ||
          (st === "OUT_OF_STOCK"
            ? "Temporarily out of stock (Available for reservation quote)"
            : "In stock ready for immediate delivery or import"),
        leadDaysMin: src.leadDaysMin || product.supplierLeadDaysMin || 7,
        leadDaysMax: src.leadDaysMax || product.supplierLeadDaysMax || 21,
        supplierUrl: src.supplierUrl || product.supplierUrl || null,
        supplierPriceUSD: src.supplierPriceUSD ?? product.supplierLastPriceUSD ?? null,
        checkedAt: src.checkedAt
          ? new Date(src.checkedAt).toISOString()
          : new Date().toISOString(),
        isStale: isAvailabilityStale(src.checkedAt),
      };
    };

    // Helper to collect current variantAvailabilities map from parsedParameters
    const collectVariantAvailabilitiesMap = (paramsList: any[], prodRecord: any) => {
      const map: Record<string, any> = {};
      if (prodRecord.supplierUrl) {
        const baseObj = buildAvailabilityObject({
          status: prodRecord.supplierStockStatus,
          stockCount: prodRecord.supplierStockCount,
          platform: prodRecord.supplierPlatform,
          messageEs: prodRecord.supplierStockMessageEs,
          messageEn: prodRecord.supplierStockMessageEn,
          leadDaysMin: prodRecord.supplierLeadDaysMin,
          leadDaysMax: prodRecord.supplierLeadDaysMax,
          supplierUrl: prodRecord.supplierUrl,
          supplierPriceUSD: prodRecord.supplierLastPriceUSD,
          checkedAt: prodRecord.supplierStockCheckedAt,
        });
        map[prodRecord.supplierUrl.trim()] = baseObj;
        map[cleanSupplierUrl(prodRecord.supplierUrl)] = baseObj;
      }

      for (const param of paramsList) {
        if (param?.type === "cart_addon" || param?.type === "text_input") continue;
        if (Array.isArray(param?.options)) {
          for (const opt of param.options) {
            if (typeof opt?.supplierUrl === "string" && opt.supplierUrl.trim() && opt.supplierStockStatus) {
              const obj = buildAvailabilityObject({
                status: opt.supplierStockStatus,
                stockCount: opt.supplierStockCount,
                platform: opt.supplierPlatform,
                messageEs: opt.supplierStockMessageEs,
                messageEn: opt.supplierStockMessageEn,
                leadDaysMin: opt.supplierLeadDaysMin,
                leadDaysMax: opt.supplierLeadDaysMax,
                supplierUrl: opt.supplierUrl.trim(),
                supplierPriceUSD: opt.supplierLastPriceUSD,
                checkedAt: opt.supplierStockCheckedAt,
              });
              map[opt.supplierUrl.trim()] = obj;
              map[cleanSupplierUrl(opt.supplierUrl)] = obj;
            }
            if (Array.isArray(opt?.connections)) {
              for (const conn of opt.connections) {
                if (typeof conn?.supplierUrl === "string" && conn.supplierUrl.trim() && conn.supplierStockStatus) {
                  const obj = buildAvailabilityObject({
                    status: conn.supplierStockStatus,
                    stockCount: conn.supplierStockCount,
                    platform: conn.supplierPlatform,
                    messageEs: conn.supplierStockMessageEs,
                    messageEn: conn.supplierStockMessageEn,
                    leadDaysMin: conn.supplierLeadDaysMin,
                    leadDaysMax: conn.supplierLeadDaysMax,
                    supplierUrl: conn.supplierUrl.trim(),
                    supplierPriceUSD: conn.supplierLastPriceUSD,
                    checkedAt: conn.supplierStockCheckedAt,
                  });
                  map[conn.supplierUrl.trim()] = obj;
                  map[cleanSupplierUrl(conn.supplierUrl)] = obj;
                }
              }
            }
          }
        }
      }
      return map;
    };

    // If no supplier URL configured anywhere, return current state
    if (!effectiveTargetUrl) {
      const fallbackAvail = buildAvailabilityObject({
        status: product.supplierStockStatus,
        stockCount: product.supplierStockCount,
        platform: product.supplierPlatform || "MANUAL",
        messageEs: product.supplierStockMessageEs,
        messageEn: product.supplierStockMessageEn,
        leadDaysMin: product.supplierLeadDaysMin,
        leadDaysMax: product.supplierLeadDaysMax,
        supplierUrl: product.supplierUrl,
        supplierPriceUSD: product.supplierLastPriceUSD,
        checkedAt: product.supplierStockCheckedAt,
      });
      return {
        success: true,
        product,
        targetAvailability: fallbackAvail,
        variantAvailabilities: {},
      };
    }

    // Find matching option or connection for effectiveTargetUrl, and check if any sibling options lack cached status
    let matchedTargetNode: any = null;
    let hasUncheckedSiblingVariants = false;
    const targetShopifyBase = getShopifyBaseUrl(effectiveTargetUrl);

    for (const param of parsedParameters) {
      if (param?.type === "cart_addon" || param?.type === "text_input" || param?.type === "product_linking" || param?.type === "product_link") continue;
      if (Array.isArray(param?.options)) {
        for (const opt of param.options) {
          if (opt?.linkedProductId) continue;
          if (typeof opt?.supplierUrl === "string" && opt.supplierUrl.trim()) {
            const cUrl = cleanSupplierUrl(opt.supplierUrl);
            if (cUrl === effectiveTargetUrl) matchedTargetNode = opt;
            if (!opt.supplierStockStatus || isAvailabilityStale(opt.supplierStockCheckedAt)) {
              if (!targetShopifyBase || getShopifyBaseUrl(cUrl) === targetShopifyBase) {
                hasUncheckedSiblingVariants = true;
              }
            }
          }
          if (Array.isArray(opt?.connections)) {
            for (const conn of opt.connections) {
              if (typeof conn?.supplierUrl === "string" && conn.supplierUrl.trim()) {
                const cUrl = cleanSupplierUrl(conn.supplierUrl);
                if (cUrl === effectiveTargetUrl) matchedTargetNode = conn;
                if (!conn.supplierStockStatus || isAvailabilityStale(conn.supplierStockCheckedAt)) {
                  if (!targetShopifyBase || getShopifyBaseUrl(cUrl) === targetShopifyBase) {
                    hasUncheckedSiblingVariants = true;
                  }
                }
              }
            }
          }
        }
      }
    }

    // Check 8-hour freshness rule for the specific target URL
    const targetCheckedAt = matchedTargetNode
      ? matchedTargetNode.supplierStockCheckedAt
      : effectiveTargetUrl === baseCleanUrl
      ? product.supplierStockCheckedAt
      : null;
    const targetHasStatus = matchedTargetNode
      ? Boolean(matchedTargetNode.supplierStockStatus)
      : effectiveTargetUrl === baseCleanUrl
      ? Boolean(product.supplierStockStatus)
      : false;
    const isTargetStale = !targetHasStatus || isAvailabilityStale(targetCheckedAt);

    if (!forceFresh && !isTargetStale && !hasUncheckedSiblingVariants) {
      const variantMap = collectVariantAvailabilitiesMap(parsedParameters, product);
      const targetAvail =
        variantMap[effectiveTargetUrl] ||
        buildAvailabilityObject({
          status: matchedTargetNode?.supplierStockStatus || product.supplierStockStatus,
          stockCount: matchedTargetNode?.supplierStockCount ?? product.supplierStockCount,
          platform: matchedTargetNode?.supplierPlatform || product.supplierPlatform,
          messageEs: matchedTargetNode?.supplierStockMessageEs || product.supplierStockMessageEs,
          messageEn: matchedTargetNode?.supplierStockMessageEn || product.supplierStockMessageEn,
          leadDaysMin: matchedTargetNode?.supplierLeadDaysMin || product.supplierLeadDaysMin,
          leadDaysMax: matchedTargetNode?.supplierLeadDaysMax || product.supplierLeadDaysMax,
          supplierUrl: effectiveTargetUrl,
          supplierPriceUSD: matchedTargetNode?.supplierLastPriceUSD ?? product.supplierLastPriceUSD,
          checkedAt: targetCheckedAt || product.supplierStockCheckedAt,
        });

      return {
        success: true,
        product,
        targetAvailability: targetAvail,
        variantAvailabilities: variantMap,
      };
    }

    if (forceFresh) {
      clearShopifyPayloadCacheForUrl(effectiveTargetUrl);
    }

    // Re-verify live from US supplier for effectiveTargetUrl
    const live = await fetchLiveSupplierAvailability(effectiveTargetUrl);
    const isRateLimitedFallback = Boolean(
      live.rawDetails?.botProtectionMitigated || live.rawDetails?.fallback
    );

    // Also update any parameter options / connections matching effectiveTargetUrl or sharing the same Shopify baseProductUrl
    let parametersModified = false;
    const checkedUrlResults = new Map<string, SupplierAvailabilityResult>();
    if (live.success) {
      checkedUrlResults.set(effectiveTargetUrl, live);
    }

    for (const param of parsedParameters) {
      if (param?.type === "cart_addon" || param?.type === "text_input") continue;
      if (Array.isArray(param?.options)) {
        for (const opt of param.options) {
          if (typeof opt?.supplierUrl === "string" && opt.supplierUrl.trim()) {
            const cUrl = cleanSupplierUrl(opt.supplierUrl);
            const sharesShopifyBase =
              Boolean(targetShopifyBase) && getShopifyBaseUrl(cUrl) === targetShopifyBase;

            if (cUrl === effectiveTargetUrl || (sharesShopifyBase && !isRateLimitedFallback)) {
              let optLive = checkedUrlResults.get(cUrl);
              if (!optLive) {
                optLive = await fetchLiveSupplierAvailability(cUrl);
                if (optLive.success) checkedUrlResults.set(cUrl, optLive);
              }
              if (optLive && optLive.success) {
                const optRateLimited = Boolean(
                  optLive.rawDetails?.botProtectionMitigated || optLive.rawDetails?.fallback
                );
                // If manualStockOverride is true, NEVER overwrite with automated status
                if (!opt.manualStockOverride && (!optRateLimited || !opt.supplierStockStatus)) {
                  // If rate-limited, do NOT overwrite an existing OUT_OF_STOCK
                  if (!optRateLimited || opt.supplierStockStatus !== "OUT_OF_STOCK") {
                    opt.supplierStockStatus = optLive.status;
                    opt.supplierStockCount = optLive.stockCount;
                    opt.supplierPlatform = optLive.platform;
                    opt.supplierStockMessageEs = optLive.messageEs;
                    opt.supplierStockMessageEn = optLive.messageEn;
                    opt.supplierStockCheckedAt = new Date().toISOString();
                    opt.supplierLeadDaysMin = optLive.leadDaysMin;
                    opt.supplierLeadDaysMax = optLive.leadDaysMax;
                    if (optLive.supplierPriceUSD) {
                      opt.supplierLastPriceUSD = optLive.supplierPriceUSD;
                    }
                    parametersModified = true;
                  }
                }
              }
            }
          }

          if (Array.isArray(opt?.connections)) {
            for (const conn of opt.connections) {
              if (typeof conn?.supplierUrl === "string" && conn.supplierUrl.trim()) {
                const cUrl = cleanSupplierUrl(conn.supplierUrl);
                const sharesShopifyBase =
                  Boolean(targetShopifyBase) && getShopifyBaseUrl(cUrl) === targetShopifyBase;

                if (cUrl === effectiveTargetUrl || (sharesShopifyBase && !isRateLimitedFallback)) {
                  let connLive = checkedUrlResults.get(cUrl);
                  if (!connLive) {
                    connLive = await fetchLiveSupplierAvailability(cUrl);
                    if (connLive.success) checkedUrlResults.set(cUrl, connLive);
                  }
                  if (connLive && connLive.success) {
                    const connRateLimited = Boolean(
                      connLive.rawDetails?.botProtectionMitigated || connLive.rawDetails?.fallback
                    );
                    if (!conn.manualStockOverride && (!connRateLimited || !conn.supplierStockStatus)) {
                      if (!connRateLimited || conn.supplierStockStatus !== "OUT_OF_STOCK") {
                        conn.supplierStockStatus = connLive.status;
                        conn.supplierStockCount = connLive.stockCount;
                        conn.supplierPlatform = connLive.platform;
                        conn.supplierStockMessageEs = connLive.messageEs;
                        conn.supplierStockMessageEn = connLive.messageEn;
                        conn.supplierStockCheckedAt = new Date().toISOString();
                        conn.supplierLeadDaysMin = connLive.leadDaysMin;
                        conn.supplierLeadDaysMax = connLive.leadDaysMax;
                        if (connLive.supplierPriceUSD) {
                          conn.supplierLastPriceUSD = connLive.supplierPriceUSD;
                        }
                        parametersModified = true;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Also obtain the live result for the product's base supplierUrl if it wasn't effectiveTargetUrl but shares the Shopify payload
    let baseLive: SupplierAvailabilityResult | null = null;
    if (baseCleanUrl) {
      if (baseCleanUrl === effectiveTargetUrl) {
        baseLive = live;
      } else if (checkedUrlResults.has(baseCleanUrl)) {
        baseLive = checkedUrlResults.get(baseCleanUrl)!;
      } else if (
        targetShopifyBase &&
        getShopifyBaseUrl(baseCleanUrl) === targetShopifyBase &&
        !isRateLimitedFallback
      ) {
        baseLive = await fetchLiveSupplierAvailability(baseCleanUrl);
      }
    }

    let updatedProduct = product;

    if (baseLive && baseLive.success) {
      const baseRateLimited = Boolean(
        baseLive.rawDetails?.botProtectionMitigated || baseLive.rawDetails?.fallback
      );
      const preservePreviousBaseStatus =
        baseRateLimited && Boolean(product.supplierStockStatus);

      let effectiveDiscount = Math.max(
        0,
        Math.min(100, Number(product.dealerDiscountPercent) || 0)
      );
      if (effectiveDiscount === 0 && product.brandName) {
        const dbDealer = await prisma.dealerBrand.findFirst({
          where: {
            name: { equals: product.brandName.trim() },
            isActive: true,
          },
          select: { dealerDiscountPercent: true },
        });
        if (dbDealer && Number(dbDealer.dealerDiscountPercent) > 0) {
          effectiveDiscount = Math.max(
            0,
            Math.min(100, Number(dbDealer.dealerDiscountPercent))
          );
        }
      }

      // Preserve existing processingPriceD & supplierLastPriceUSD during stock-only checks
      // so the daily 3:00 AM price sync engine can properly auto-apply increases and queue decreases for staff approval.
      const shouldSeedMissingPrice =
        (!product.processingPriceD || product.processingPriceD <= 0) &&
        baseLive.supplierPriceUSD &&
        baseLive.supplierPriceUSD > 0;

      let nextProcessingPriceD: number | undefined = undefined;
      if (shouldSeedMissingPrice && baseLive.supplierPriceUSD) {
        nextProcessingPriceD =
          effectiveDiscount > 0
            ? Number((baseLive.supplierPriceUSD * (1 - effectiveDiscount / 100)).toFixed(2))
            : baseLive.supplierPriceUSD;
      }

      updatedProduct = await prisma.product.update({
        where: { id: product.id },
        data: {
          supplierStockStatus: preservePreviousBaseStatus
            ? product.supplierStockStatus
            : baseLive.status,
          supplierStockCount: preservePreviousBaseStatus
            ? product.supplierStockCount
            : baseLive.stockCount,
          supplierPlatform: baseLive.platform,
          supplierStockMessageEs: preservePreviousBaseStatus
            ? product.supplierStockMessageEs
            : baseLive.messageEs,
          supplierStockMessageEn: preservePreviousBaseStatus
            ? product.supplierStockMessageEn
            : baseLive.messageEn,
          supplierStockCheckedAt: new Date(),
          supplierLeadDaysMin: baseLive.leadDaysMin,
          supplierLeadDaysMax: baseLive.leadDaysMax,
          ...(!product.supplierLastPriceUSD && baseLive.supplierPriceUSD
            ? { supplierLastPriceUSD: baseLive.supplierPriceUSD }
            : {}),
          ...(parametersModified
            ? { parametersJson: JSON.stringify(parsedParameters) }
            : {}),
          ...(effectiveDiscount > 0
            ? { dealerDiscountPercent: effectiveDiscount }
            : {}),
          ...(nextProcessingPriceD && nextProcessingPriceD > 0
            ? { processingPriceD: nextProcessingPriceD }
            : {}),
          updatedAt: new Date(),
        },
      });
    } else if (parametersModified) {
      updatedProduct = await prisma.product.update({
        where: { id: product.id },
        data: {
          parametersJson: JSON.stringify(parsedParameters),
          updatedAt: new Date(),
        },
      });
    }

    const variantMap = collectVariantAvailabilitiesMap(
      parsedParameters,
      updatedProduct
    );

    const targetAvailability =
      variantMap[effectiveTargetUrl] ||
      buildAvailabilityObject({
        status:
          (matchedTargetNode?.manualStockOverride || isRateLimitedFallback) && matchedTargetNode?.supplierStockStatus
            ? matchedTargetNode.supplierStockStatus
            : live.status,
        stockCount:
          matchedTargetNode?.manualStockOverride && matchedTargetNode?.supplierStockStatus === "OUT_OF_STOCK"
            ? 0
            : live.stockCount,
        platform: live.platform,
        messageEs:
          (matchedTargetNode?.manualStockOverride || isRateLimitedFallback) && matchedTargetNode?.supplierStockMessageEs
            ? matchedTargetNode.supplierStockMessageEs
            : live.messageEs,
        messageEn:
          (matchedTargetNode?.manualStockOverride || isRateLimitedFallback) && matchedTargetNode?.supplierStockMessageEn
            ? matchedTargetNode.supplierStockMessageEn
            : live.messageEn,
        leadDaysMin: live.leadDaysMin,
        leadDaysMax: live.leadDaysMax,
        supplierUrl: effectiveTargetUrl,
        supplierPriceUSD: live.supplierPriceUSD,
        checkedAt: live.checkedAt,
      });

    return {
      success: true,
      product: updatedProduct,
      liveResult: live,
      targetAvailability,
      variantAvailabilities: variantMap,
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
    const [products, dealerBrands] = await Promise.all([
      prisma.product.findMany({
        where: {
          supplierUrl: { not: null },
          isArchived: false,
        },
      }),
      prisma.dealerBrand.findMany({
        where: { isActive: true },
        select: { name: true, dealerDiscountPercent: true },
      }),
    ]);

    const brandDiscountMap: Record<string, number> = {};
    dealerBrands.forEach((db) => {
      if (db.name && Number(db.dealerDiscountPercent) > 0) {
        brandDiscountMap[db.name.trim().toLowerCase()] = Math.max(
          0,
          Math.min(100, Number(db.dealerDiscountPercent))
        );
      }
    });

    const results: Array<{ slug: string; status: string; updated: boolean }> = [];
    let synced = 0;

    for (const prod of products) {
      if (!prod.supplierUrl) continue;
      const isStale = isAvailabilityStale(prod.supplierStockCheckedAt);

      if (forceAll || isStale) {
        const live = await fetchLiveSupplierAvailability(prod.supplierUrl);
        if (live.success) {
          const prodDisc = Math.max(0, Math.min(100, Number(prod.dealerDiscountPercent) || 0));
          const brandDisc = prod.brandName
            ? brandDiscountMap[prod.brandName.trim().toLowerCase()] || 0
            : 0;
          const effectiveDiscount = prodDisc > 0 ? prodDisc : brandDisc;

          const shouldSeedMissingPrice =
            (!prod.processingPriceD || prod.processingPriceD <= 0) &&
            live.supplierPriceUSD &&
            live.supplierPriceUSD > 0;

          let nextProcessingPriceD: number | undefined = undefined;
          if (shouldSeedMissingPrice && live.supplierPriceUSD) {
            nextProcessingPriceD =
              effectiveDiscount > 0
                ? Number((live.supplierPriceUSD * (1 - effectiveDiscount / 100)).toFixed(2))
                : live.supplierPriceUSD;
          }

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
              ...(!prod.supplierLastPriceUSD && live.supplierPriceUSD
                ? { supplierLastPriceUSD: live.supplierPriceUSD }
                : {}),
              ...(effectiveDiscount > 0 ? { dealerDiscountPercent: effectiveDiscount } : {}),
              ...(nextProcessingPriceD && nextProcessingPriceD > 0
                ? { processingPriceD: nextProcessingPriceD }
                : {}),
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
