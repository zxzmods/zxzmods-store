import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildNoIndexMetadata, buildPageMetadata } from "@/lib/seo";

function cleanMetaDescription(raw: string | null | undefined, fallback: string): string {
  const stripped = (raw || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!stripped) return fallback;
  return stripped.length > 160 ? `${stripped.slice(0, 157).trim()}...` : stripped;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug || "").trim();
  if (!slug) {
    return buildNoIndexMetadata("Producto no encontrado");
  }

  try {
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ slug }, { id: slug }, { sku: slug }],
      },
      select: {
        slug: true,
        nameEs: true,
        nameEn: true,
        descriptionEs: true,
        brandName: true,
        imageUrl: true,
        isArchived: true,
      },
    });

    if (!product || product.isArchived) {
      return buildNoIndexMetadata("Producto no disponible");
    }

    const title = product.brandName
      ? `${product.nameEs} (${product.brandName})`
      : product.nameEs;
    const description = cleanMetaDescription(
      product.descriptionEs,
      `Compra e instala ${product.nameEs} en ZxZ Mods Costa Rica con garantía en mano de obra e importación garantizada.`
    );

    return buildPageMetadata({
      path: `/productos/${product.slug}`,
      title,
      description,
      imageUrl: product.imageUrl,
    });
  } catch {
    return buildPageMetadata({
      path: `/productos/${slug}`,
      title: "Producto Performance UTV & ATV",
      description:
        "Repuestos, accesorios y modificaciones de alto rendimiento para UTV y ATV en ZxZ Mods Costa Rica.",
    });
  }
}

export default function ProductSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
