import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Carrito de Compras");

export default function CarritoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
