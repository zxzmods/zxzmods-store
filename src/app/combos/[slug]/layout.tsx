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
    return buildNoIndexMetadata("Combo no encontrado");
  }

  try {
    const combo = await prisma.combo.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
      },
      select: {
        slug: true,
        titleEs: true,
        descriptionEs: true,
        imageUrl: true,
        isArchived: true,
      },
    });

    if (!combo || combo.isArchived) {
      return buildNoIndexMetadata("Combo no disponible");
    }

    const description = cleanMetaDescription(
      combo.descriptionEs,
      `Combo ${combo.titleEs} con descuento especial e instalación profesional en ZxZ Mods Costa Rica.`
    );

    return buildPageMetadata({
      path: `/combos/${combo.slug}`,
      title: combo.titleEs,
      description,
      imageUrl: combo.imageUrl,
    });
  } catch {
    return buildPageMetadata({
      path: `/combos/${slug}`,
      title: "Combo Performance UTV & ATV",
      description:
        "Paquetes y combos performance con instalación profesional en ZxZ Mods Costa Rica.",
    });
  }
}

export default function ComboSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
