"use client";

import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function GarageRegisterSkeleton() {
  return (
    <div className="w-full space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header & Breadcrumb */}
      <div className="space-y-3 pb-2">
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-9 w-64 sm:w-80 rounded-xl" />
        <Skeleton className="h-4 w-full max-w-md rounded-md" />
      </div>

      {/* Top Brand Logo Space Skeleton */}
      <div className="w-full h-48 sm:h-56 rounded-3xl bg-gray-50 border border-gray-200 p-6 flex flex-col items-center justify-center space-y-4">
        <Skeleton className="h-16 w-48 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-md" />
        </div>
      </div>

      {/* Form Specifications Grid Skeleton */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 space-y-6">
        <Skeleton className="h-6 w-48 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
          <Skeleton className="h-12 w-32 rounded-xl" />
          <Skeleton className="h-12 w-48 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
