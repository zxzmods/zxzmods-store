import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/cotizar",
  title: "Cotizar Piezas, Importación e Instalación UTV & ATV",
  description:
    "Solicita una cotización personalizada para importación e instalación de piezas y accesorios UTV y ATV en Costa Rica.",
});

export default function CotizarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
