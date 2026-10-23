"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Language, translations, Translations } from "@/lib/i18n";
import {
  COMPANY_CONFIG,
  GLOBAL_MASTER_PHONE,
  GLOBAL_MASTER_WHATSAPP,
  formatWhatsappDigits,
  setGlobalMasterPhone,
} from "@/config/company";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
  companyPhone: string;
  companyWhatsapp: string;
  companyWhatsappDigits: string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  const [companyPhone, setCompanyPhone] = useState<string>(GLOBAL_MASTER_PHONE);
  const [companyWhatsapp, setCompanyWhatsapp] = useState<string>(GLOBAL_MASTER_WHATSAPP);

  useEffect(() => {
    const saved = localStorage.getItem("zxz_lang") as Language | null;
    if (saved && (saved === "es" || saved === "en")) {
      setLangState(saved);
    } else {
      setLangState("en"); // General / first time users default to English per user setting
    }
  }, []);

  // Synchronize global phone & WhatsApp number from database (/api/location) on mount
  // and listen for instant updates when Master saves in the backdoor
  useEffect(() => {
    let isMounted = true;

    const handleConfigUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.phone) {
        setCompanyPhone(customEvent.detail.phone);
      } else {
        setCompanyPhone(COMPANY_CONFIG.contact.phone);
      }
      if (customEvent.detail?.whatsapp) {
        setCompanyWhatsapp(customEvent.detail.whatsapp);
      } else {
        setCompanyWhatsapp(COMPANY_CONFIG.contact.whatsapp);
      }
    };

    window.addEventListener("zxz-company-config-updated", handleConfigUpdated);

    fetch("/api/location", { cache: "no-store" })
      .then((res) => res.json())
      .then((res) => {
        if (isMounted && res.success && res.data) {
          const dbPhone = res.data.phone || GLOBAL_MASTER_PHONE;
          const dbWhatsapp = res.data.whatsapp || dbPhone;
          setGlobalMasterPhone(
            dbPhone,
            dbWhatsapp,
            res.data.addressEs,
            res.data.addressEn
          );
          setCompanyPhone(COMPANY_CONFIG.contact.phone);
          setCompanyWhatsapp(COMPANY_CONFIG.contact.whatsapp);
        }
      })
      .catch((err) => {
        console.error("Failed to sync global phone from /api/location:", err);
      });

    return () => {
      isMounted = false;
      window.removeEventListener("zxz-company-config-updated", handleConfigUpdated);
    };
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("zxz_lang", newLang);
  };

  const t = translations[lang];
  const companyWhatsappDigits = formatWhatsappDigits(companyWhatsapp || companyPhone);

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        t,
        companyPhone,
        companyWhatsapp,
        companyWhatsappDigits,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}

