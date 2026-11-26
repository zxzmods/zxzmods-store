import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/performance",
  title: "Performance y Potenciación UTV & ATV",
  description:
    "Proyectos de potenciación, kits turbo, reprogramación ECU, escapes y clutch tuning para UTV y ATV en Costa Rica.",
});

export default function PerformanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
