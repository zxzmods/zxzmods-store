import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/ubicacion",
  title: "Ubicación y Taller Especializado en Santa Ana, Costa Rica",
  description:
    "Visita nuestro taller especializado en UTV y ATV en Pozos de Santa Ana, San José, Costa Rica.",
});

export default function TallerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
