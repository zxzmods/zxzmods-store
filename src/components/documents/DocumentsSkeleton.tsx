"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";

export function DocumentsSkeleton() {
  const { theme } = useTheme();
  const isDark = (theme as string) === "dark";

  const baseBg = isDark ? "bg-white/10" : "bg-gray-200";
  const pillBg = isDark ? "bg-white/5" : "bg-gray-100";
  const cardBorder = isDark ? "border-white/10 bg-[#18181B]" : "border-gray-200 bg-white";

  return (
    <div className="w-full max-w-7xl mx-auto py-6 sm:py-8 space-y-8 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="space-y-4 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`h-6 w-32 rounded-full ${baseBg}`} />
          <div className={`h-6 w-24 rounded-full ${pillBg}`} />
        </div>
        <div className={`h-10 sm:h-12 w-2/3 max-w-2xl rounded-2xl ${baseBg}`} />
        <div className={`h-4 w-4/5 max-w-3xl rounded-lg ${pillBg}`} />
        <div className="flex items-center gap-4 pt-2">
          <div className={`h-4 w-40 rounded-md ${pillBg}`} />
          <div className={`h-4 w-44 rounded-md ${pillBg}`} />
        </div>
      </div>

      {/* Main Grid: Sidebar + Reading Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar Skeleton */}
        <div className="lg:col-span-4 space-y-3">
          <div className={`h-11 w-full rounded-2xl ${pillBg} mb-4`} />
          {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border ${cardBorder} flex items-center justify-between gap-3`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-8 h-8 rounded-xl ${baseBg} flex-shrink-0`} />
                <div className="space-y-1.5 flex-1">
                  <div className={`h-4 w-3/4 rounded-md ${baseBg}`} />
                  <div className={`h-3 w-1/2 rounded-md ${pillBg}`} />
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full ${pillBg}`} />
            </div>
          ))}
        </div>

        {/* Right Content Panel Skeleton */}
        <div className={`lg:col-span-8 p-6 sm:p-10 rounded-3xl border ${cardBorder} space-y-8`}>
          {/* Document Top Bar */}
          <div className="space-y-3 pb-6 border-b border-gray-100">
            <div className={`h-5 w-48 rounded-full ${baseBg}`} />
            <div className={`h-8 sm:h-10 w-4/5 rounded-xl ${baseBg}`} />
            <div className={`h-4 w-full rounded-md ${pillBg}`} />
            <div className={`h-4 w-5/6 rounded-md ${pillBg}`} />
          </div>

          {/* Applicable Laws Pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            <div className={`h-6 w-56 rounded-full ${pillBg}`} />
            <div className={`h-6 w-48 rounded-full ${pillBg}`} />
            <div className={`h-6 w-40 rounded-full ${pillBg}`} />
          </div>

          {/* Quick Notice Card */}
          <div className={`p-5 rounded-2xl border ${isDark ? "border-red-900/40 bg-red-950/20" : "border-red-100 bg-red-50/50"} space-y-2`}>
            <div className={`h-4 w-40 rounded-md ${baseBg}`} />
            <div className={`h-3 w-full rounded-md ${pillBg}`} />
            <div className={`h-3 w-3/4 rounded-md ${pillBg}`} />
          </div>

          {/* Clauses Blocks */}
          {[1, 2, 3, 4].map((c) => (
            <div key={c} className="space-y-3 pt-4">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg ${baseBg}`} />
                <div className={`h-5 w-60 rounded-md ${baseBg}`} />
              </div>
              <div className={`h-4 w-full rounded-md ${pillBg}`} />
              <div className={`h-4 w-11/12 rounded-md ${pillBg}`} />
              <div className={`h-4 w-4/5 rounded-md ${pillBg}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
