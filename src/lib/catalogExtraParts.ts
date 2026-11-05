export interface InstallExtraPart {
  id?: string;
  name: string;
  priceCRC: number;
}

export interface ExtraPartSuggestion {
  name: string;
  priceCRC: number;
  count: number;
}

/**
 * Normalizes an extra part name for robust comparison:
 * - Lowercases
 * - Removes accents / diacritics (é -> e, etc.)
 * - Unifies "locktite" and "loctite"
 * - Removes non-alphanumeric characters and extra spaces
 */
export function normalizePartKey(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/ck/g, "c")             // locktite -> loctite
    .replace(/[^a-z0-9]/g, "")       // keep only alphanumeric
    .trim();
}

/**
 * Sanitizes an extra parts array for storage or API response:
 * - Discards invalid objects, empty names, or names shorter than 3 characters
 * - Trims part names
 * - Ensures priceCRC is a valid non-negative integer
 * - Eliminates partial typing fragments if a fuller word is present (e.g. "Cab" vs "Cable")
 */
export function sanitizeExtraParts(raw: any): InstallExtraPart[] {
  let list: any[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    } catch {}
  }

  const valid = list
    .filter((pt) => pt && typeof pt.name === "string" && pt.name.trim().length >= 3)
    .map((pt) => ({
      id: pt.id || `pt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: pt.name.trim(),
      priceCRC: Math.max(0, Math.round(Number(pt.priceCRC) || 0)),
      _key: normalizePartKey(pt.name),
    }));

  // Discard any item whose key is a strict prefix of another item in the same list
  const cleaned = valid.filter((item) => {
    if (!item._key || item._key.length < 3) return false;
    const isPrefixOfAnother = valid.some(
      (other) => other._key !== item._key && other._key.startsWith(item._key)
    );
    return !isPrefixOfAnother;
  });

  return cleaned.map(({ _key, ...part }) => part);
}

/**
 * Aggregates candidate parts across products/combos and filters out keystroke fragments,
 * keeping only real, complete parts + authorized baseline (red locktite, Pasta Termica).
 */
export function aggregateSuggestedExtraParts(
  products: any[] = [],
  combos: any[] = []
): ExtraPartSuggestion[] {
  const map = new Map<string, { name: string; priceCRC: number; count: number }>();

  const recordPart = (rawName: any, rawPrice: any) => {
    if (!rawName || typeof rawName !== "string") return;
    const cleanName = rawName.trim();
    if (cleanName.length < 3) return;
    const key = normalizePartKey(cleanName);
    if (!key || key.length < 3) return;

    const price = Math.max(0, Math.round(Number(rawPrice) || 0));
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      if (!existing.priceCRC && price > 0) {
        existing.priceCRC = price;
      }
      if (!existing.priceCRC && price > 0) {
        existing.name = cleanName;
      }
    } else {
      map.set(key, {
        name: cleanName,
        priceCRC: price,
        count: 1,
      });
    }
  };

  const extractParts = (source: any) => {
    if (!source) return;
    if (Array.isArray(source)) {
      source.forEach((pt) => recordPart(pt?.name, pt?.priceCRC));
    } else if (typeof source === "string") {
      try {
        const parsed = JSON.parse(source);
        if (Array.isArray(parsed)) {
          parsed.forEach((pt) => recordPart(pt?.name, pt?.priceCRC));
        }
      } catch {}
    }
  };

  (products || []).forEach((p: any) => {
    extractParts(p.installExtraParts);
    extractParts(p.installExtraPartsJson);
  });

  (combos || []).forEach((c: any) => {
    extractParts(c.installExtraParts);
    extractParts(c.installExtraPartsJson);
  });

  // Baseline parts authorized by workshop staff
  const baseline = [
    { name: "red locktite", priceCRC: 0 },
    { name: "Pasta Termica", priceCRC: 0 },
  ];

  baseline.forEach((item) => {
    const key = normalizePartKey(item.name);
    if (!map.has(key)) {
      map.set(key, { name: item.name, priceCRC: item.priceCRC, count: 0 });
    }
  });

  const allItems = Array.from(map.values());

  // Filter out any item whose normalized key is a strict prefix of another item's key
  // (e.g. "cab", "cabl" are dropped if "cable" exists; "con", "cone", "conec", "conect" are dropped if "conectores" exists)
  const filtered = allItems.filter((item) => {
    const itemKey = normalizePartKey(item.name);
    if (itemKey.length < 3) return false;

    const isTypingPrefix = allItems.some((other) => {
      const otherKey = normalizePartKey(other.name);
      return otherKey !== itemKey && otherKey.startsWith(itemKey);
    });

    return !isTypingPrefix;
  });

  return filtered.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
