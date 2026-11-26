import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/combos",
  title: "Combos y Paquetes Performance UTV & ATV",
  description:
    "Paquetes y combos completos de potenciación, audio, iluminación y protección para Can-Am, Polaris y CFMOTO con instalación profesional en Costa Rica.",
});

export default function CombosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
