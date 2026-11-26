import type { Metadata } from "next";

/**
 * Single canonical production origin for ZxZ Mods.
 * Matches Vercel's live 308 redirect (zxzmods.com -> www.zxzmods.com).
 */
export const CANONICAL_SITE_URL = "https://www.zxzmods.com";

export function getSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "").trim();
  if (!raw) return CANONICAL_SITE_URL;
  try {
    const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const host = parsed.hostname.toLowerCase();
    // Always normalize zxzmods.com to https://www.zxzmods.com so canonicals match the live 308 primary domain
    if (host === "zxzmods.com" || host === "www.zxzmods.com") {
      return CANONICAL_SITE_URL;
    }
    return parsed.origin.replace(/\/$/, "");
  } catch {
    return CANONICAL_SITE_URL;
  }
}

export function buildCanonicalUrl(pathname: string): string {
  const base = getSiteUrl();
  const clean = (pathname || "/").trim();
  if (clean === "/" || clean === "") return base;
  const normalized = clean.startsWith("/") ? clean : `/${clean}`;
  return `${base}${normalized.replace(/\/+$/, "")}`;
}

export function buildPageMetadata(opts: {
  path: string;
  title: string;
  description: string;
  noIndex?: boolean;
  imageUrl?: string | null;
  languages?: Record<string, string>;
}): Metadata {
  const canonical = buildCanonicalUrl(opts.path);
  const ogImage =
    opts.imageUrl && opts.imageUrl.startsWith("http")
      ? opts.imageUrl
      : opts.imageUrl
      ? `${getSiteUrl()}${opts.imageUrl.startsWith("/") ? opts.imageUrl : `/${opts.imageUrl}`}`
      : `${getSiteUrl()}/images/logo.png`;

  return {
    title: opts.title,
    description: opts.description,
    alternates: {
      canonical,
      ...(opts.languages ? { languages: opts.languages } : {}),
    },
    robots: opts.noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
        },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: canonical,
      siteName: "ZxZ Mods",
      locale: "es_CR",
      type: "website",
      images: [{ url: ogImage }],
    },
  };
}

export function buildNoIndexMetadata(title: string): Metadata {
  return {
    title,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}
