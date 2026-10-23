"use client";

import React, { useState } from "react";
import { Lock, Eye, EyeOff, Globe, ShieldAlert, ArrowRight, KeyRound, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface DevConsoleLoginProps {
  onSuccess: (user: {
    id: string;
    email: string;
    role: "MASTER" | "STAFF";
    displayName: string | null;
    permissions: Record<string, boolean>;
  }) => void;
}

export function DevConsoleLogin({ onSuccess }: DevConsoleLoginProps) {
  const { t, lang, setLang } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lockSeconds, setLockSeconds] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || loading) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/sys/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.retryAfterSeconds) {
          setLockSeconds(data.retryAfterSeconds);
        }
        setErrorMsg(data.message || t.devAuthTerminalLocked);
        setLoading(false);
        return;
      }

      onSuccess(data.user);
    } catch (err) {
      console.error("Login network error:", err);
      setErrorMsg("Connection error. Could not connect to the system.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F4] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-black/[0.05] rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Top Header */}
        <div className="px-7 pt-7 pb-5 border-b border-black/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-sm"
              style={{
                background: "linear-gradient(145deg, #FF7340 0%, #EE4D20 55%, #D93412 100%)",
              }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-[#141414] text-base tracking-tight block">
                ZxZ Control Hub
              </span>
              <span className="text-[11px] text-[#71717A]">
                {lang === "es" ? "Acceso exclusivo personal" : "Authorized personnel only"}
              </span>
            </div>
          </div>

          {/* Bilingual Switch */}
          <button
            type="button"
            onClick={() => setLang(lang === "es" ? "en" : "es")}
            className="flex items-center gap-1.5 text-xs text-[#52525B] hover:text-[#141414] px-3 py-1.5 rounded-full border border-black/[0.06] bg-[#F6F6F8] hover:bg-[#ECECEF] transition cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-[#71717A]" />
            <span className="uppercase font-bold text-[11px]">{lang}</span>
          </button>
        </div>

        {/* Login Body */}
        <div className="p-7 space-y-6">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-[#FFF0EB] border border-[#F05526]/30 text-[#D93412] text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-[#F05526] mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">
                  {lang === "es" ? "Error de acceso:" : "Access error:"}
                </span>
                <p>{errorMsg}</p>
                {lockSeconds && (
                  <p className="text-[#141414] font-semibold mt-1">
                    {lang === "es" ? "Tiempo de espera:" : "Cooldown:"} {lockSeconds}s
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141414] block">
                {t.devAuthEmail}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@zxzmods.com"
                required
                disabled={loading}
                className="w-full bg-[#F6F6F8] border border-black/[0.06] rounded-2xl px-4 py-3 text-sm text-[#141414] placeholder:text-[#A1A1AA] focus:outline-none focus:bg-white focus:border-[#141414] transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141414] flex items-center justify-between">
                <span>{t.devAuthPasskey}</span>
                <Lock className="w-3.5 h-3.5 text-[#71717A]" />
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={loading}
                  className="w-full bg-[#F6F6F8] border border-black/[0.06] rounded-2xl pl-4 pr-11 py-3 text-sm text-[#141414] placeholder:text-[#A1A1AA] focus:outline-none focus:bg-white focus:border-[#141414] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#141414] transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#141414] hover:bg-black/85 active:bg-black disabled:opacity-50 text-white font-semibold py-3.5 px-5 rounded-full flex items-center justify-center gap-2 text-sm transition shadow-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>{t.devAuthAuthenticating}</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 text-[#F05526]" />
                    <span>{t.devAuthLoginBtn}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Status */}
          <div className="pt-4 border-t border-black/[0.05] flex items-center justify-between text-[11px] text-[#71717A]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {t.devAuthSecuredConnection}
            </span>
            <span className="font-semibold text-[#141414]">ZxZ Mods Backdoor</span>
          </div>
        </div>
      </div>
    </div>
  );
}
