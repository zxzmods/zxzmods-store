"use client";

import React from "react";

/**
 * Rule 7: Dedicated Animated Skeleton Loader for the Financial Dashboard.
 * Matches exact layout: Month/Year Header, 5 KPI Cards, Sankey/Flow Visualizer, and Transactions Table.
 */
export function FinancialDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Header & Selector Skeleton */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-black/[0.04] flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-56 bg-neutral-200 rounded-lg" />
          <div className="h-3.5 w-80 bg-neutral-100 rounded-md" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-32 bg-neutral-200 rounded-full" />
          <div className="h-10 w-24 bg-neutral-200 rounded-full" />
          <div className="h-10 w-36 bg-neutral-200 rounded-full" />
        </div>
      </div>

      {/* 5 KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 bg-neutral-200 rounded" />
              <div className="w-7 h-7 rounded-full bg-neutral-100" />
            </div>
            <div className="space-y-1.5">
              <div className="h-7 w-32 bg-neutral-200 rounded-lg" />
              <div className="h-2.5 w-20 bg-neutral-100 rounded" />
            </div>
            <div className="h-1.5 w-full bg-neutral-100 rounded-full" />
          </div>
        ))}
      </div>

      {/* Flow Visualization Skeleton */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-black/[0.04] space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-64 bg-neutral-200 rounded-lg" />
            <div className="h-3 w-48 bg-neutral-100 rounded" />
          </div>
          <div className="h-8 w-28 bg-neutral-100 rounded-full" />
        </div>
        <div className="h-44 w-full bg-neutral-100/70 rounded-2xl" />
      </div>

      {/* Transactions Table Skeleton */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-black/[0.04] space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-48 bg-neutral-200 rounded-lg" />
          <div className="h-8 w-36 bg-neutral-100 rounded-full" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div
              key={row}
              className="h-12 w-full bg-neutral-50 rounded-xl flex items-center justify-between px-4"
            >
              <div className="h-3.5 w-24 bg-neutral-200 rounded" />
              <div className="h-5 w-20 bg-neutral-200 rounded-full" />
              <div className="h-3.5 w-28 bg-neutral-200 rounded" />
              <div className="h-3.5 w-24 bg-neutral-200 rounded" />
              <div className="h-3.5 w-20 bg-neutral-200 rounded" />
              <div className="h-3.5 w-32 bg-neutral-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
