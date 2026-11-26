import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/servicios/proteccion-garantia/contrato-legal",
  title: "Contrato Legal de Protección y Garantía",
  description:
    "Términos y condiciones legales del servicio de protección y garantía de instalación de ZxZ Mods Costa Rica.",
});

export default function ContratoLegalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
