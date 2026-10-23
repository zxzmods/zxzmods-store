"use client";

import React from "react";

export function DevConsoleSkeleton() {
  return (
    <div className="min-h-screen bg-[#F2F2F4] text-[#141414] p-4 sm:p-6 lg:p-7 flex flex-col gap-6">
      {/* Top Pill Header Skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-white shadow-sm animate-pulse" />
          <div className="h-11 w-32 rounded-full bg-white shadow-sm animate-pulse" />
        </div>
        <div className="hidden md:flex items-center gap-2 bg-white p-1.5 rounded-full shadow-sm">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-9 w-24 rounded-full bg-[#ECECEF] animate-pulse" />
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-full bg-white shadow-sm animate-pulse" />
          <div className="w-11 h-11 rounded-full bg-white shadow-sm animate-pulse" />
          <div className="h-11 w-40 rounded-full bg-white shadow-sm animate-pulse" />
        </div>
      </div>

      {/* Greeting + Left Icon Rail + Bento Grid Skeleton */}
      <div className="flex gap-5 flex-1">
        {/* Left Icon-Only Column Skeleton */}
        <div className="hidden sm:flex flex-col items-center justify-between w-14 shrink-0">
          <div className="bg-white rounded-full p-2 flex flex-col items-center gap-2.5 shadow-sm">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-full animate-pulse ${
                  i === 1 ? "bg-[#141414]/80" : "bg-[#ECECEF]"
                }`}
              />
            ))}
          </div>
          <div className="w-12 h-12 rounded-full bg-white shadow-sm animate-pulse" />
        </div>

        {/* Main Content Area Skeleton */}
        <div className="flex-1 space-y-5">
          {/* Bento Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4 bg-white rounded-[28px] p-6 h-[350px] animate-pulse" />
            <div className="lg:col-span-4 bg-white rounded-[28px] p-5 h-[350px] grid grid-cols-2 gap-3.5">
              <div className="rounded-[22px] bg-[#F05526]/30 animate-pulse" />
              <div className="rounded-[22px] bg-[#F6F6F8] animate-pulse" />
              <div className="rounded-[22px] bg-[#F6F6F8] animate-pulse" />
              <div className="rounded-[22px] bg-[#F6F6F8] animate-pulse" />
            </div>
            <div className="lg:col-span-4 bg-white rounded-[28px] p-6 h-[350px] animate-pulse" />
          </div>

          {/* Bento Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 bg-white rounded-[28px] p-6 h-[320px] animate-pulse" />
            <div className="lg:col-span-7 bg-white rounded-[28px] p-6 h-[320px] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
