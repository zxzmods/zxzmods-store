import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Pago de Servicios");

export default function ServiciosPagoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
