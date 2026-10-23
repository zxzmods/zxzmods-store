"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Globe, DollarSign } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { DevConsoleSkeleton } from "@/components/dev/DevConsoleSkeleton";
import { DevConsoleLogin } from "@/components/dev/DevConsoleLogin";
import { FinancialDashboardTab } from "@/components/dev/FinancialDashboardTab";

export default function AdminFinancialDashboardPage() {
  const { lang, setLang } = useLanguage();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<"CRC" | "USD">("CRC");

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/sys/auth/me");
      const data = await res.json();
      if (res.ok && data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to verify session:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (loading) {
    return <DevConsoleSkeleton />;
  }

  if (!user) {
    return <DevConsoleLogin onSuccess={(authenticatedUser) => setUser(authenticatedUser)} />;
  }

  return (
    <div className="min-h-screen bg-[#F2F2F4] text-[#141414] p-4 sm:p-6 lg:p-8 flex flex-col gap-6 selection:bg-[#F05526] selection:text-white">
      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/sys-control"
            className="w-10 h-10 rounded-full bg-white shadow-xs border border-black/[0.04] flex items-center justify-center text-[#141414] hover:bg-[#141414] hover:text-white transition cursor-pointer"
            title={lang === "es" ? "Volver a Control General" : "Back to Control Center"}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <Link href="/sys-control" className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="ZxZ Mods"
              width={100}
              height={26}
              className="h-7 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Currency & Language Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCurrency((c) => (c === "CRC" ? "USD" : "CRC"))}
            className="w-10 h-10 rounded-full bg-white shadow-xs border border-black/[0.04] flex items-center justify-center text-xs font-bold text-[#141414] hover:bg-[#141414] hover:text-white transition cursor-pointer"
          >
            {currency === "CRC" ? "₡" : "$"}
          </button>

          <button
            type="button"
            onClick={() => setLang(lang === "es" ? "en" : "es")}
            className="w-10 h-10 rounded-full bg-white shadow-xs border border-black/[0.04] flex items-center justify-center gap-0.5 text-[11px] font-bold uppercase text-[#141414] hover:bg-[#141414] hover:text-white transition cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang}</span>
          </button>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto w-full">
        <FinancialDashboardTab
          currency={currency}
          onToggleCurrency={() => setCurrency((c) => (c === "CRC" ? "USD" : "CRC"))}
        />
      </main>
    </div>
  );
}
