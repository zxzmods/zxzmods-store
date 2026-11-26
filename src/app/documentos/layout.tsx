import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/documentos",
  title: "Documentos Legales, Políticas y Garantías",
  description:
    "Centro oficial de documentos legales, políticas de privacidad, garantías y términos de servicio de ZxZ Mods Costa Rica.",
});

export default function DocumentosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
