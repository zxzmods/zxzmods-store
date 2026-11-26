import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Canjear Orden");

export default function OrdenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
