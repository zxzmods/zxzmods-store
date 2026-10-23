"use client";

import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function HomeSkeleton() {
  return (
    <div className="w-full min-h-screen bg-white text-[#1A1A1D]">
      {/* Top Banner Skeleton */}
      <div className="w-full bg-[#F5F5F7] border-b border-gray-200 py-3 px-4">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-2/3 max-w-lg" />
          <Skeleton className="h-8 w-36 rounded-full" />
        </div>
      </div>

      {/* Nav Skeleton (Glass Nav Bar) */}
      <div className="w-full border-b border-gray-200 py-4 px-6 bg-white/80 backdrop-blur-md">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
          <div className="hidden md:flex gap-6">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-10 rounded-full" />
          </div>
        </div>
      </div>

      {/* Hero Skeleton (sketch_1.png Constant Video Viewport) */}
      <div className="w-full h-[75vh] bg-gray-100 relative overflow-hidden flex flex-col justify-end p-8">
        <Skeleton className="absolute inset-0 w-full h-full" />
        <div className="relative z-10 flex flex-col items-center max-w-xl mx-auto space-y-3 w-full pb-4">
          <Skeleton className="h-4 w-40 rounded-full" />
          <Skeleton className="h-10 w-full max-w-md rounded-xl" />
          <Skeleton className="h-4 w-3/4 max-w-sm rounded-lg" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-10 w-36 rounded-full" />
            <Skeleton className="h-10 w-36 rounded-full" />
          </div>
        </div>
      </div>

      {/* Brands Grid Skeleton (Session s4 slightly reduced card size) */}
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 pt-10 sm:pt-14 pb-4 sm:pb-6 border-b border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          <Skeleton className="md:col-span-2 h-[390px] sm:h-[440px] rounded-3xl" />
          <Skeleton className="h-[350px] sm:h-[390px] rounded-3xl" />
          <Skeleton className="h-[350px] sm:h-[390px] rounded-3xl" />
          <Skeleton className="h-[350px] sm:h-[390px] rounded-3xl" />
          <Skeleton className="h-[350px] sm:h-[390px] rounded-3xl" />
        </div>
      </div>

      {/* Product Zone Skeleton (Session s4 increased card height & reduced top margin) */}
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 pt-4 sm:pt-6 pb-12 sm:pb-20 border-b border-gray-200">
        <div className="flex gap-6 items-center justify-center">
          <Skeleton className="hidden md:block w-1/5 lg:w-[14%] h-[540px] sm:h-[600px] lg:h-[640px] rounded-3xl opacity-40" />
          <Skeleton className="w-full md:w-[68%] lg:w-[72%] h-[620px] sm:h-[680px] lg:h-[720px] rounded-3xl" />
          <Skeleton className="hidden md:block w-1/5 lg:w-[14%] h-[540px] sm:h-[600px] lg:h-[640px] rounded-3xl opacity-40" />
        </div>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Skeleton className="w-full max-w-md h-1.5 rounded-full" />
          <Skeleton className="w-32 h-6 rounded-full" />
        </div>
      </div>

      {/* Company Info Skeleton */}
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-16 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
