import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/servicios/proteccion-garantia",
  title: "Protección y Garantía Certificada ZxZ",
  description:
    "Conoce la cobertura de garantía en mano de obra e instalación y protección certificada para piezas UTV y ATV en ZxZ Mods Costa Rica.",
});

export default function ProteccionGarantiaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
