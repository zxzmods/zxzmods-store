"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationBanner } from "@/components/layout/NotificationBanner";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatCRC } from "@/lib/i18n";
import {
  Package,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  UserCheck,
  ShieldCheck,
  Truck,
  Wrench,
  Car,
} from "lucide-react";

interface OrderDetail {
  orderNumber: string;
  status: string;
  serviceType: string;
  totalCRC: number;
  partsSubtotalCRC: number;
  installationCostCRC: number;
  shippingCostCRC: number;
  pickupCostCRC: number;
  discountType: string;
  discountValue: number;
  customerName: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  items: Array<{
    name?: string;
    title?: string;
    quantity?: number;
    priceCRC?: number;
    sku?: string;
  }>;
  createdAt: string;
}

export default function ClaimOrderPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  const { user, openAuthModal } = useAuth();
  const { lang, t } = useLanguage();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimedSuccess, setClaimedSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/orders/claim?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setErrorMsg(data.message || "Este enlace no es válido o ya fue canjeado.");
        }
      })
      .catch((err) => {
        console.error("Claim fetch error:", err);
        setErrorMsg("Error al conectar para verificar el enlace de pedido.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleClaimOrder = async () => {
    if (!user) {
      openAuthModal();
      return;
    }

    setClaiming(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/orders/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          userId: user.id,
          email: user.email,
          displayName: user.displayName,
          phoneNumber: user.phoneNumber,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setClaimedSuccess(true);
      } else {
        setErrorMsg(data.message || data.error || "Error al canjear el pedido.");
      }
    } catch (err) {
      console.error("Claim execute error:", err);
      setErrorMsg("Error de conexión al canjear el pedido.");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between antialiased">
      <NotificationBanner />
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-16 w-full">
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-48 mx-auto" />
            <div className="h-4 bg-slate-100 rounded w-64 mx-auto" />
            <div className="h-32 bg-slate-50 rounded-2xl" />
          </div>
        ) : errorMsg && !claimedSuccess ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center text-red-600 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{t.claimInvalidLinkTitle}</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{errorMsg}</p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <Link
                href="/perfil"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
              >
                {t.claimViewProfileBtn}
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
              >
                {t.claimGoToStoreBtn}
              </Link>
            </div>
          </div>
        ) : claimedSuccess ? (
          /* Success Screen */
          <div className="bg-white rounded-3xl border border-emerald-200 p-8 sm:p-12 text-center shadow-md space-y-5 max-w-lg mx-auto">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {t.claimSuccessTitle}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-2">
                {t.claimOrderNumberPrefix}{order?.orderNumber} {t.claimOrderLinkedBadge}
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                {t.claimOrderSuccessDesc} ({user?.email})
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/perfil")}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
              >
                <span>{t.claimViewInMyAccountBtn}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : order ? (
          /* Order Breakdown & Claim Action Card */
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="border-b border-slate-100 pb-5 space-y-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-[#C02030] tracking-wider uppercase flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  {t.claimSpecialQuoteHeader}
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {t.claimOrderNumberPrefix}{order.orderNumber}
              </h1>
              <p className="text-xs text-slate-500">
                {lang === "es" ? "Creado especialmente por el personal técnico de ZxZ Mods Performance." : "Custom quote created by ZxZ Mods Performance technical team."}
              </p>
            </div>

            {/* Items Included */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-slate-600" />
                {t.claimItemsListLabel}
              </span>

              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-slate-50/50">
                {order.items.map((it, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {it.name || it.title || t.claimItemDefaultTitle}
                      </span>
                      {it.sku && <span className="text-[10px] text-slate-400 font-mono">{it.sku}</span>}
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block text-[11px]">x{it.quantity || 1}</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {formatCRC((it.priceCRC || 0) * (it.quantity || 1))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span>{t.cartSubtotal}:</span>
                <span className="font-mono font-semibold text-slate-900">{formatCRC(order.partsSubtotalCRC)}</span>
              </div>

              {order.shippingCostCRC > 0 && (
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-slate-500" />
                    {t.devCostShipping}:
                  </span>
                  <span className="font-mono font-semibold text-slate-900">{formatCRC(order.shippingCostCRC)}</span>
                </div>
              )}

              {order.pickupCostCRC > 0 && (
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-slate-500" />
                    {t.navUtvPickup}:
                  </span>
                  <span className="font-mono font-semibold text-slate-900">{formatCRC(order.pickupCostCRC)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-black text-slate-900">
                <span>{t.orderTotalLabel}:</span>
                <span className="text-base text-[#C02030] font-mono">{formatCRC(order.totalCRC)}</span>
              </div>
            </div>

            {/* Auth / Claim CTA Box */}
            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-950">
                    {user ? (lang === "es" ? "Listo para vincular a tu cuenta" : "Ready to link to your account") : (lang === "es" ? "Inicia sesión para reclamar este pedido" : "Sign in to claim this order")}
                  </h4>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {user
                      ? (lang === "es"
                          ? `El pedido #${order.orderNumber} quedará guardado permanentemente bajo tu correo ${user.email}.`
                          : `Order #${order.orderNumber} will be permanently saved under your email ${user.email}.`)
                      : (lang === "es"
                          ? "Al iniciar sesión, este pedido se inscribirá en tu cuenta para que puedas seguir el avance y garantías en todo momento."
                          : "By signing in, this order will be registered to your account so you can track progress and warranties at any time.")}
                  </p>
                </div>
              </div>

              {user ? (
                <button
                  type="button"
                  disabled={claiming}
                  onClick={handleClaimOrder}
                  className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{claiming ? (lang === "es" ? "Canjeando..." : "Claiming...") : (lang === "es" ? "Canjear y Vincular a Mi Cuenta" : "Claim & Link to My Account")}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal()}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#C02030] hover:bg-[#A01825] text-white text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{lang === "es" ? "Iniciar Sesión para Canjear Pedido" : "Sign In to Claim Order"}</span>
                </button>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
