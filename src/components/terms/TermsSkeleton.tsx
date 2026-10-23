"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";

export function TermsSkeleton() {
  const { theme } = useTheme();
  const isDark = (theme as string) === "dark";

  const baseBg = isDark ? "bg-white/5" : "bg-gray-200";
  const cardBg = isDark ? "bg-[#18181B] border-white/10" : "bg-white border-gray-100";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-pulse py-8">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <div className={`h-6 w-36 rounded-full ${baseBg}`} />
        <div className={`h-10 sm:h-12 w-3/4 rounded-2xl ${baseBg}`} />
        <div className={`h-4 w-5/6 rounded-lg ${baseBg}`} />
        <div className={`h-4 w-2/3 rounded-lg ${baseBg}`} />
      </div>

      {/* Highlights Bar Skeleton */}
      <div className={`p-6 rounded-3xl border ${cardBg} space-y-3`}>
        <div className={`h-5 w-48 rounded-lg ${baseBg}`} />
        <div className={`h-4 w-full rounded-md ${baseBg}`} />
        <div className={`h-4 w-4/5 rounded-md ${baseBg}`} />
      </div>

      {/* Sections Skeletons */}
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className={`p-6 sm:p-8 rounded-3xl border ${cardBg} space-y-4`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl ${baseBg}`} />
            <div className={`h-6 w-1/3 rounded-lg ${baseBg}`} />
          </div>
          <div className={`h-4 w-full rounded-md ${baseBg}`} />
          <div className={`h-4 w-11/12 rounded-md ${baseBg}`} />
          <div className={`h-4 w-4/5 rounded-md ${baseBg}`} />
        </div>
      ))}
    </div>
  );
}
