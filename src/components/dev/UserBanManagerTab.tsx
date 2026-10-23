"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  X,
  UserX,
  UserCheck,
  Calendar,
  Clock,
  ShoppingBag,
  Car,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Lock,
  RefreshCw,
  User,
} from "lucide-react";

interface BannedUserRecord {
  id: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  phoneNumber: string | null;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  bannedAt: string | null;
  bannedReason: string | null;
  bannedBy: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  ordersCount: number;
  vehiclesCount: number;
}

export function UserBanManagerTab({ userRole }: { userRole?: string }) {
  const { t, lang } = useLanguage();
  const isMaster = userRole === "MASTER";

  const [emailQuery, setEmailQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchedUser, setSearchedUser] = useState<BannedUserRecord | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Modal State
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [isUnbanModalOpen, setIsUnbanModalOpen] = useState(false);
  const [banReasonInput, setBanReasonInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Query function - strictly queries only when called with a valid email
  const executeUserLookup = useCallback(async (emailToSearch: string) => {
    const clean = emailToSearch.trim();
    if (!clean || clean.length < 3) {
      setSearchedUser(null);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/sys/users/ban?email=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSearchedUser(data.user || null);
      } else {
        setSearchedUser(null);
      }
    } catch (err) {
      console.error("[USER_BAN_LOOKUP_ERROR]:", err);
      setSearchedUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced input handler (only queries when typing)
  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmailQuery(value);
    setFeedback(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value.trim() || value.trim().length < 3) {
      setSearchedUser(null);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    // Set animated loading state during typing debounce
    setLoading(true);
    debounceTimerRef.current = setTimeout(() => {
      executeUserLookup(value);
    }, 450);
  };

  // Immediate search on submit / enter
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    executeUserLookup(emailQuery);
  };

  // Clear search input
  const handleClearSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setEmailQuery("");
    setSearchedUser(null);
    setHasSearched(false);
    setLoading(false);
    setFeedback(null);
  };

  // Action: Ban User
  const handleConfirmBan = async () => {
    if (!searchedUser || actionLoading) return;
    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/sys/users/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: searchedUser.email,
          action: "BAN",
          reason: banReasonInput.trim() || t.userBanDefaultReason,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsBanModalOpen(false);
        setBanReasonInput("");
        setFeedback({
          type: "success",
          msg: data.message || t.userBanSuccessBan,
        });
        // Refresh target user state
        await executeUserLookup(searchedUser.email);
      } else {
        setFeedback({
          type: "error",
          msg: data.error || "Error al procesar la suspensión.",
        });
      }
    } catch (err) {
      console.error("[BAN_ACTION_ERROR]:", err);
      setFeedback({ type: "error", msg: "Error de conexión al aplicar baneo." });
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Unban User
  const handleConfirmUnban = async () => {
    if (!searchedUser || actionLoading) return;
    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/sys/users/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: searchedUser.email,
          action: "UNBAN",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsUnbanModalOpen(false);
        setFeedback({
          type: "success",
          msg: data.message || t.userBanSuccessUnban,
        });
        // Refresh target user state
        await executeUserLookup(searchedUser.email);
      } else {
        setFeedback({
          type: "error",
          msg: data.error || "Error al levantar la suspensión.",
        });
      }
    } catch (err) {
      console.error("[UNBAN_ACTION_ERROR]:", err);
      setFeedback({ type: "error", msg: "Error de conexión al levantar baneo." });
    } finally {
      setActionLoading(false);
    }
  };

  // Non-master security fallback
  if (!isMaster) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-xs max-w-lg mx-auto space-y-3">
        <Lock className="w-10 h-10 text-red-600 mx-auto" />
        <h3 className="text-base font-black text-slate-900">
          {lang === "es" ? "Acceso Restringido a Master" : "Master Exclusive Access"}
        </h3>
        <p className="text-xs text-slate-500">
          {lang === "es"
            ? "El sistema de baneo y suspensión de perfiles requiere credenciales exclusivas de nivel Master."
            : "The profile banning and suspension console requires root Master privileges."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 shadow-xs transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/5 rounded-md transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-[#C02030]" />
            </div>
            <h2 className="text-sm font-black text-slate-900 tracking-tight">
              {t.userBanTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            {t.userBanSubtitle}
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-bold">
          <Lock className="w-3 h-3" />
          <span>ROOT MASTER</span>
        </div>
      </div>

      {/* Search Input Bar (Strict requirement: Only queries DB when typing email) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              value={emailQuery}
              onChange={handleEmailInputChange}
              placeholder={t.userBanSearchPlaceholder}
              autoFocus
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition"
            />
            {emailQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full transition"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!emailQuery.trim() || loading}
            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-5 rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>{lang === "es" ? "Buscar Usuario" : "Search User"}</span>
          </button>
        </form>

        <p className="text-[11px] text-slate-400 flex items-center gap-1">
          <span>ℹ️</span>
          <span>{t.userBanSearchHelp}</span>
        </p>
      </div>

      {/* Main Workspace Display */}
      {loading ? (
        /* MANDATORY ANIMATED SKELETON LOADER (Rule 7) */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-200" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-200 rounded-md w-1/3" />
              <div className="h-3 bg-slate-100 rounded-md w-1/4" />
            </div>
            <div className="h-8 w-24 bg-slate-200 rounded-xl" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-5 bg-slate-200 rounded w-3/4" />
              </div>
            ))}
          </div>

          <div className="h-24 bg-slate-100 rounded-xl" />
        </div>
      ) : searchedUser ? (
        /* FOUND USER PROFILE CARD */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100">
          {/* Top User Info Bar */}
          <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${
                searchedUser.isBanned
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : "bg-slate-100 text-slate-800 border border-slate-200"
              }`}>
                {searchedUser.photoUrl ? (
                  <img
                    src={searchedUser.photoUrl}
                    alt=""
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  (searchedUser.displayName?.[0] || searchedUser.email[0]).toUpperCase()
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900">
                    {searchedUser.displayName || (lang === "es" ? "Sin nombre de perfil" : "No display name")}
                  </h3>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      searchedUser.role === "MASTER"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : searchedUser.role === "STAFF"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {searchedUser.role}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1 font-mono">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{searchedUser.email}</span>
                  </span>
                  {searchedUser.phoneNumber && (
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{searchedUser.phoneNumber}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <div>
              {searchedUser.isBanned ? (
                <button
                  type="button"
                  onClick={() => setIsUnbanModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition shadow-xs cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{t.userBanActionUnbanBtn}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setBanReasonInput("");
                    setIsBanModalOpen(true);
                  }}
                  className="bg-[#C02030] hover:bg-red-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition shadow-xs cursor-pointer"
                >
                  <UserX className="w-4 h-4" />
                  <span>{t.userBanActionBanBtn}</span>
                </button>
              )}
            </div>
          </div>

          {/* User Metrics & History */}
          <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/50">
            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t.userBanOrdersCount}
              </span>
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <span>{searchedUser.ordersCount}</span>
              </div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t.userBanVehiclesCount}
              </span>
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                <Car className="w-4 h-4 text-emerald-600" />
                <span>{searchedUser.vehiclesCount}</span>
              </div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t.userBanRegisteredAt}
              </span>
              <div className="flex items-center gap-1.5 font-medium text-slate-700 text-xs font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{new Date(searchedUser.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t.userBanLastLogin}
              </span>
              <div className="flex items-center gap-1.5 font-medium text-slate-700 text-xs font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {searchedUser.lastLoginAt
                    ? new Date(searchedUser.lastLoginAt).toLocaleDateString()
                    : (lang === "es" ? "Sin registro" : "None")}
                </span>
              </div>
            </div>
          </div>

          {/* Live Ban Status Indicator Box */}
          <div className="p-6">
            {searchedUser.isBanned ? (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-xs font-black uppercase text-red-900 tracking-wider">
                      {t.userBanBannedStatus}
                    </span>
                  </div>
                  {searchedUser.bannedAt && (
                    <span className="text-[11px] font-mono text-red-700 font-medium">
                      {new Date(searchedUser.bannedAt).toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="text-xs text-red-950 font-medium">
                  <span className="font-bold">{t.userBanReasonLabel}: </span>
                  <span className="italic">{searchedUser.bannedReason || t.userBanDefaultReason}</span>
                </div>

                {searchedUser.bannedBy && (
                  <div className="text-[11px] text-red-700">
                    <span className="font-semibold">{t.userBanByLabel}: </span>
                    <span className="font-mono">{searchedUser.bannedBy}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-emerald-900">
                    {t.userBanActiveStatus}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-700">
                  {lang === "es"
                    ? "Este usuario tiene acceso pleno a compras, garaje y cotizaciones."
                    : "This user has full access to checkout, garage, and quotes."}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : hasSearched ? (
        /* NO USER FOUND STATE */
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">
            {t.userBanNoUserFound}
          </h3>
          <p className="text-xs text-slate-500 font-mono">
            {emailQuery}
          </p>
        </div>
      ) : (
        /* INITIAL EMPTY STATE (Zero queries on initial render) */
        <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-xs font-bold text-slate-700">
            {t.userBanInitialStatePrompt}
          </h3>
          <p className="text-[11px] text-slate-400 max-w-md mx-auto">
            {lang === "es"
              ? "Para mantener la máxima velocidad y optimizar los recursos del servidor, el sistema no descarga listas completas de usuarios; únicamente consulta la base de datos cuando escribes el correo electrónico."
              : "To maintain maximum performance and optimize server resources, the system avoids loading full user tables; it strictly queries the database when you type an email."}
          </p>
        </div>
      )}

      {/* MODAL: CONFIRM BAN */}
      {isBanModalOpen && searchedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-red-600 font-black text-sm">
                <ShieldAlert className="w-5 h-5" />
                <span>{t.userBanModalTitle}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsBanModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 space-y-1">
              <p className="font-bold">
                {searchedUser.displayName || searchedUser.email}
              </p>
              <p className="font-mono text-[11px] text-red-700">{searchedUser.email}</p>
              <p className="text-[11px] leading-relaxed pt-1 text-red-800">
                {t.userBanModalSubtitle}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">
                {t.userBanReasonPrompt}
              </label>
              <textarea
                rows={3}
                value={banReasonInput}
                onChange={(e) => setBanReasonInput(e.target.value)}
                placeholder={t.userBanReasonPlaceholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-600 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBanModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                {t.userBanCancelBtn}
              </button>

              <button
                type="button"
                onClick={handleConfirmBan}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#C02030] hover:bg-red-700 text-white transition flex items-center gap-1.5 shadow-sm"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{t.userBanConfirmBanBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM UNBAN */}
      {isUnbanModalOpen && searchedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>{lang === "es" ? "Levantar Suspensión de Usuario" : "Lift User Suspension"}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsUnbanModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1">
              <p className="font-bold">
                {searchedUser.displayName || searchedUser.email}
              </p>
              <p className="font-mono text-[11px] text-emerald-700">{searchedUser.email}</p>
              <p className="text-[11px] leading-relaxed pt-1 text-emerald-800">
                {lang === "es"
                  ? "El usuario podrá iniciar sesión normalmente, navegar la tienda y registrar pedidos."
                  : "The user will be able to log in, browse the store, and create orders normally."}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsUnbanModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                {t.userBanCancelBtn}
              </button>

              <button
                type="button"
                onClick={handleConfirmUnban}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{t.userBanConfirmUnbanBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
