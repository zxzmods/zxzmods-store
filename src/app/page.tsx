import type { Metadata } from "next";
import { HomePageClient } from "@/components/home/HomePageClient";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/",
  title: "ZxZ Mods | UTV & ATV Performance, Modificaciones e Importación en Costa Rica",
  description:
    "Especialistas en importación, potenciación e instalación de piezas para Can-Am, Polaris, Yamaha, Honda, Segway y CFMOTO en Costa Rica. Garantía en mano de obra.",
});

export default function HomePage() {
  return <HomePageClient />;
}
