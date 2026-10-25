"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  X,
  User,
  ShoppingBag,
  ShoppingCart,
  LogOut,
  Mail,
  CheckCircle2,
  Save,
  RefreshCw,
  ArrowRight,
  ChevronRight,
  Calendar,
  ShieldAlert,
} from "lucide-react";
import { WarrantyPartsModal } from "@/components/profile/WarrantyPartsModal";

export function ProfileDrawer() {
  const router = useRouter();
  const { user, orders, isProfileDrawerOpen, closeProfileDrawer, logout, refreshUser } = useAuth();
  const { items, totalCRC, formatPrice, setIsOpen: setCartOpen } = useCart();
  const { t, lang } = useLanguage();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isWarrantyModalOpen, setIsWarrantyModalOpen] = useState(false);

  // Sync state if user updates
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
    } else {
      setDisplayName("");
    }
  }, [user]);

  if (!isProfileDrawerOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        await refreshUser();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error saving profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCartFromProfile = () => {
    closeProfileDrawer();
    setCartOpen(true);
  };

  const handleGoToOrders = () => {
    closeProfileDrawer();
    router.push("/pedidos");
  };

  const handleGoToScheduledServices = () => {
    closeProfileDrawer();
    router.push("/servicios/programados");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeProfileDrawer}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C02030] text-white flex items-center justify-center font-bold text-sm shadow-md overflow-hidden">
                {user?.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoUrl}
                    alt={user.displayName || "Avatar"}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : user?.displayName ? (
                  user.displayName[0].toUpperCase()
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm leading-tight">
                  {user?.displayName ? user.displayName : t.profileNoNameSet}
                </h3>
                <p className="text-xs text-gray-500 truncate max-w-[200px]">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={closeProfileDrawer}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
              aria-label="Cerrar perfil"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Active Cart Link Bar (Links cart to profile) */}
            <div className="p-3 bg-red-50/60 rounded-2xl border border-red-100 flex items-center justify-between transition-all">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#C02030] text-white flex items-center justify-center relative shadow-sm">
                  <ShoppingCart className="w-4 h-4" />
                  {items.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-900 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {items.length}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{t.profileActiveCart}</h4>
                  <p className="text-[11px] text-gray-600 font-medium">
                    {items.length === 0
                      ? lang === "es"
                        ? "0 artículos agregados"
                        : "0 items added"
                      : `${items.length} ${
                          items.length === 1
                            ? lang === "es"
                              ? "artículo"
                              : "item"
                            : lang === "es"
                            ? "artículos"
                            : "items"
                        } • ${formatPrice(totalCRC)}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenCartFromProfile}
                className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-[#C02030] hover:text-[#C02030] text-xs font-bold text-gray-800 transition-colors shadow-2xs flex items-center gap-1"
              >
                <span>{t.profileViewCart}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Dedicated Orders Redirection Button / Card (User Request: change orders to a button to redirect to orders page) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleGoToOrders}
                className="w-full p-4 rounded-2xl border border-gray-200 hover:border-[#C02030] bg-gray-50/80 hover:bg-red-50/40 transition-all flex items-center justify-between group shadow-2xs text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#111827] group-hover:bg-[#C02030] text-white flex items-center justify-center transition-colors shadow-sm">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#C02030] transition-colors">
                        {t.ordersPageTitle}
                      </h4>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-gray-200 group-hover:bg-red-100 group-hover:text-[#C02030] text-gray-700 transition-colors">
                        {orders.length}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t.ordersViewTracking}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-gray-700 group-hover:text-[#C02030] transition-colors">
                  <span>{t.ordersRedirectBtn}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>

            {/* Dedicated Scheduled Services Redirection Button / Card (User Request) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleGoToScheduledServices}
                className="w-full p-4 rounded-2xl border border-gray-200 hover:border-[#C02030] bg-gray-50/80 hover:bg-red-50/40 transition-all flex items-center justify-between group shadow-2xs text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#111827] group-hover:bg-[#C02030] text-white flex items-center justify-center transition-colors shadow-sm">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#C02030] transition-colors">
                      {t.scheduledServicesDrawerButton}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t.scheduledServicesDrawerView}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-gray-700 group-hover:text-[#C02030] transition-colors">
                  <span>{lang === "es" ? "Ver Citas" : "View Services"}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>

            {/* Dedicated Warranty Protection Button / Card (User Request: shows parts that void dealer warranty) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsWarrantyModalOpen(true)}
                className="w-full p-4 rounded-2xl border border-red-200/80 hover:border-[#C02030] bg-gradient-to-r from-red-50/60 to-amber-50/40 hover:from-red-50 hover:to-amber-50 transition-all flex items-center justify-between group shadow-2xs text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#C02030] text-white flex items-center justify-center transition-colors shadow-sm">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#C02030] transition-colors flex items-center gap-2">
                      <span>{t.warrantyProtectionProfileBtn}</span>
                    </h4>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                      {t.warrantyProtectionProfileSubtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-[#C02030] transition-colors">
                  <span>{lang === "es" ? "Gestionar" : "Manage"}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>

            {/* Profile Info Form */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                {t.profileInfoTab}
              </h4>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {saveSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{t.profileSavedSuccess}</span>
                  </div>
                )}

                {/* Name section: Empty if not set yet */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t.profileFullName}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={t.profileNamePlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-gray-300 focus:border-[#C02030] outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {lang === "es"
                      ? "Puedes configurar tu nombre para personalizar tus pedidos y cotizaciones."
                      : "You can set your name to customize your orders and quotations."}
                  </p>
                </div>

                {/* Email Section (Read-only) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t.profileEmail}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 bg-gray-100 text-gray-500 outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{t.profileSave}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Footer with Logout */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/70">
            <button
              onClick={logout}
              className="w-full py-2.5 px-4 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.profileLogout}</span>
            </button>
          </div>
        </motion.div>

        {/* Warranty Protected Parts Modal */}
        <WarrantyPartsModal
          isOpen={isWarrantyModalOpen}
          onClose={() => setIsWarrantyModalOpen(false)}
          onGoToWarrantyInfo={() => {
            setIsWarrantyModalOpen(false);
            closeProfileDrawer();
            router.push("/servicios/proteccion-garantia");
          }}
        />
      </div>
    </AnimatePresence>
  );
}
