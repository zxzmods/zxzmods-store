import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Mi Garaje");

export default function GarajeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
