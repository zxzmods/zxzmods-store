import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Servicios Programados");

export default function ServiciosProgramadosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
