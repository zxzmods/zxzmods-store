import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/barrialcr",
  title: "BarrialCR | Comunidad Off-Road y Rutas UTV en Costa Rica",
  description:
    "Únete a BarrialCR, la comunidad oficial de rutas off-road, expediciones UTV y 4x4 en Costa Rica impulsada por ZxZ Mods.",
});

export default function BarrialCrLayout({ children }: { children: React.ReactNode }) {
  return children;
}
