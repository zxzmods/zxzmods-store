"use client";

import React from "react";

export function ServicesSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Top Orders Selector Skeleton */}
      <div className="w-full rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gray-200" />
            <div className="space-y-1">
              <div className="w-44 h-4 rounded bg-gray-200" />
              <div className="w-64 h-3 rounded bg-gray-100" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/70 h-20" />
          ))}
        </div>
      </div>

      {/* 3 Service Cards Skeleton: 1. Home Installation, 2. Delivery, 3. Pick-up */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-5 rounded-3xl border border-gray-200 bg-white space-y-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-gray-100" />
            <div className="w-36 h-5 rounded-lg bg-gray-200" />
            <div className="w-48 h-3 rounded bg-gray-100" />
            <div className="w-24 h-4 rounded-full bg-gray-100 pt-2" />
          </div>
        ))}
      </div>

      {/* Main Grid: Input + Map representation Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input & Details Form Skeleton (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl border border-gray-200 bg-white space-y-5">
            <div className="w-40 h-5 rounded-lg bg-gray-200" />
            <div className="w-full h-12 rounded-2xl bg-gray-100" />

            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex justify-between">
                <div className="w-28 h-4 rounded bg-gray-100" />
                <div className="w-20 h-4 rounded bg-gray-200" />
              </div>
              <div className="flex justify-between">
                <div className="w-32 h-4 rounded bg-gray-100" />
                <div className="w-16 h-4 rounded bg-gray-200" />
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <div className="w-32 h-6 rounded bg-gray-200" />
                <div className="w-28 h-6 rounded bg-gray-300" />
              </div>
            </div>

            <div className="w-full h-12 rounded-2xl bg-gray-200" />
          </div>
        </div>

        {/* Right: Map Skeleton (7 cols) */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden p-3 space-y-3 shadow-xs">
            <div className="w-full h-80 sm:h-96 rounded-2xl bg-gray-100 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gray-200" />
                <div className="w-36 h-4 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
