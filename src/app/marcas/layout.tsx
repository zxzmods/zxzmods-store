import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/marcas",
  title: "Marcas Compatibles y Distribuidores Oficiales UTV & ATV",
  description:
    "Piezas y modificaciones para Can-Am, Polaris, CFMOTO, Honda, Yamaha y Segway, con marcas distribuidoras líderes como EVP, Bikeman Performance, RPM Powersports, DRT, SuperATV y más.",
});

export default function MarcasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
