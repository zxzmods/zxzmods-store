import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Orders");

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
