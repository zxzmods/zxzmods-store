import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { buildCanonicalUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: buildCanonicalUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: buildCanonicalUrl("/productos"), lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: buildCanonicalUrl("/combos"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: buildCanonicalUrl("/marcas"), lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: buildCanonicalUrl("/servicios"), lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: buildCanonicalUrl("/performance"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: buildCanonicalUrl("/barrialcr"), lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: buildCanonicalUrl("/ubicacion"), lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: buildCanonicalUrl("/cotizar"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    {
      url: buildCanonicalUrl("/servicios/proteccion-garantia"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    { url: buildCanonicalUrl("/documentos"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: buildCanonicalUrl("/privacidad"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: buildCanonicalUrl("/privacy"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: buildCanonicalUrl("/terminos"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: buildCanonicalUrl("/terms"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    const [products, combos] = await Promise.all([
      prisma.product.findMany({
        where: { isArchived: false },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.combo.findMany({
        where: { isArchived: false },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const productEntries: MetadataRoute.Sitemap = products
      .filter((p) => p.slug && p.slug.trim().length > 0)
      .map((p) => ({
        url: buildCanonicalUrl(`/productos/${encodeURIComponent(p.slug.trim())}`),
        lastModified: p.updatedAt || now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));

    const comboEntries: MetadataRoute.Sitemap = combos
      .filter((c) => c.slug && c.slug.trim().length > 0)
      .map((c) => ({
        url: buildCanonicalUrl(`/combos/${encodeURIComponent(c.slug.trim())}`),
        lastModified: c.updatedAt || now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));

    return [...staticRoutes, ...productEntries, ...comboEntries];
  } catch (err) {
    console.warn("[SITEMAP_DB_WARN]:", err);
    return staticRoutes;
  }
}
