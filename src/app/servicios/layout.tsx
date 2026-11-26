import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/servicios",
  title: "Servicios de Taller, Instalación a Domicilio y Traslado UTV",
  description:
    "Instalación en taller Santa Ana, servicio mecánico a domicilio, traslado seguro de UTV/ATV y envíos en toda Costa Rica con garantía certificada.",
});

export default function ServiciosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
