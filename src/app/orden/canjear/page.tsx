"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

function OrderCanjearContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      router.replace(`/pedidos/reclamar/${token}`);
    } else {
      router.replace("/perfil");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-xs font-semibold text-slate-500 animate-pulse">{t.redirectingToOrderClaim}</div>
    </div>
  );
}

export default function OrderCanjearRedirect() {
  const { t } = useLanguage();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-xs font-semibold text-slate-500 animate-pulse">{t.redirectingToOrderClaim}</div>
        </div>
      }
    >
      <OrderCanjearContent />
    </Suspense>
  );
}
