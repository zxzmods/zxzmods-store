import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Control del Sistema");

export default function SysControlLayout({ children }: { children: React.ReactNode }) {
  return children;
}
