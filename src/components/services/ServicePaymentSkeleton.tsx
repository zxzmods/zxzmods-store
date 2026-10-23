"use client";

import React from "react";

export function ServicePaymentSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between antialiased">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200 animate-pulse" />
            <div className="space-y-1.5">
              <div className="w-36 h-3 rounded bg-slate-200 animate-pulse" />
              <div className="w-56 h-5 rounded bg-slate-200 animate-pulse" />
            </div>
          </div>
          <div className="hidden sm:block w-48 h-7 rounded-full bg-slate-200 animate-pulse" />
        </div>
      </header>

      {/* Main Grid Skeleton */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-16 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Service & Orders Summary Card Skeleton */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse" />
                <div className="space-y-1">
                  <div className="w-48 h-4 rounded bg-slate-200 animate-pulse" />
                  <div className="w-32 h-3 rounded bg-slate-100 animate-pulse" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
                <div className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
              </div>

              <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
            </div>

            {/* Bank Accounts Skeleton */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 animate-pulse" />
                  <div className="space-y-1">
                    <div className="w-52 h-4 rounded bg-slate-200 animate-pulse" />
                    <div className="w-64 h-3 rounded bg-slate-100 animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
                <div className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
              </div>
            </div>

            {/* Contact Phone Card Skeleton */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-3">
              <div className="w-44 h-4 rounded bg-slate-200 animate-pulse" />
              <div className="w-full h-12 rounded-xl bg-slate-100 animate-pulse" />
            </div>
          </div>

          {/* Right Column (4 cols) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="w-44 h-4 rounded bg-slate-200 animate-pulse" />
              <div className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
              <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
              <div className="h-14 rounded-2xl bg-slate-200 animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
