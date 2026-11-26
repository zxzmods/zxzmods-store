import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Mis Pedidos");

export default function PedidosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
