import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/productos",
  title: "Catálogo de Piezas y Accesorios UTV & ATV",
  description:
    "Explora nuestro catálogo completo de escapes, clutches, suspensiones, turbos y accesorios performance para Can-Am, Polaris, CFMOTO, Honda, Yamaha y Segway en Costa Rica.",
});

export default function ProductosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
