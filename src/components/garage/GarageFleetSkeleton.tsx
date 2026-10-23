"use client";

import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function GarageFleetSkeleton() {
  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* Top Header & Fleet Status Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-gray-200">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-10 w-72 sm:w-96 rounded-xl" />
          <Skeleton className="h-4 w-full max-w-xl rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-44 rounded-2xl" />
          <Skeleton className="h-11 w-44 rounded-2xl" />
        </div>
      </div>

      {/* Grid of registered vehicle cards with brand logos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-gray-200 bg-white p-6 space-y-5 shadow-sm"
          >
            {/* Top Badge */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>

            {/* Brand Logo Display Area */}
            <div className="h-28 w-full rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Skeleton className="h-14 w-36 rounded-xl" />
            </div>

            {/* Title & Category */}
            <div className="space-y-2 pt-1">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-6 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-1/3 rounded-md" />
            </div>

            {/* Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <Skeleton className="h-10 flex-1 rounded-xl" />
              <Skeleton className="h-10 w-12 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
