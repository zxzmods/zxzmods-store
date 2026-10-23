"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Smartphone,
  DollarSign,
  Copy,
  Check,
  X,
  ShieldCheck,
  RefreshCw,
  Tag,
  Settings2,
} from "lucide-react";
import { DiscountCodesManagerSection } from "./DiscountCodesManagerSection";
import { ExchangeRateTab } from "./ExchangeRateTab";

interface BankAccount {
  id: string;
  bankName: string;
  currency: "CRC" | "USD";
  iban: string;
  accountNumber: string;
  ownerName: string;
  idCard: string;
  type?: string;
  notes?: string;
  isSinpe?: boolean;
}

interface BankAccountsTabProps {
  userRole?: "MASTER" | "STAFF";
}

export function BankAccountsTab({ userRole = "MASTER" }: BankAccountsTabProps) {
  const { t, lang } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<"ACCOUNTS" | "DISCOUNTS" | "EXCHANGE_RATE">("ACCOUNTS");
  const [exchangeRateInfo, setExchangeRateInfo] = useState<{ rate: number; buyRate: number; override: boolean; date: string } | null>(null);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [formBankName, setFormBankName] = useState("");
  const [formCurrency, setFormCurrency] = useState<"CRC" | "USD">("CRC");
  const [formIban, setFormIban] = useState("");
  const [formAccountNumber, setFormAccountNumber] = useState("");
  const [formOwnerName, setFormOwnerName] = useState("");
  const [formIdCard, setFormIdCard] = useState("");
  const [formType, setFormType] = useState<"CORRIENTE" | "AHORROS">("CORRIENTE");
  const [formNotes, setFormNotes] = useState("");

  // Delete Confirmation State
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Accounts
  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/sys/bank-accounts");
      const data = await res.json();
      if (res.ok && data.success) {
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error("Failed to fetch bank accounts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetch("/api/exchange-rate")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d?.data) {
          setExchangeRateInfo({
            rate: d.data.rate,
            buyRate: d.data.buyRate,
            override: Boolean(d.data.override),
            date: d.data.date,
          });
        }
      })
      .catch(() => {});
  }, [fetchAccounts]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenCreateModal = () => {
    setEditingAccount(null);
    setFormBankName("");
    setFormCurrency("CRC");
    setFormIban("");
    setFormAccountNumber("");
    setFormOwnerName("ZxZ Mods Costa Rica S.A.");
    setFormIdCard("3-101-849201");
    setFormType("CORRIENTE");
    setFormNotes("");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (acc: BankAccount) => {
    setEditingAccount(acc);
    setFormBankName(acc.bankName);
    setFormCurrency(acc.currency);
    setFormIban(acc.iban);
    setFormAccountNumber(acc.accountNumber);
    setFormOwnerName(acc.ownerName);
    setFormIdCard(acc.idCard);
    setFormType((acc.type as any) || (acc.isSinpe ? "SINPE" : "CORRIENTE"));
    setFormNotes(acc.notes || "");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBankName.trim() || !formIban.trim() || !formOwnerName.trim()) {
      setErrorMsg(
        lang === "es"
          ? "Nombre del banco, IBAN y titular son obligatorios."
          : "Bank name, IBAN, and account holder are required."
      );
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const payload = {
      ...(editingAccount ? { id: editingAccount.id } : {}),
      bankName: formBankName.trim(),
      currency: formCurrency,
      iban: formIban.trim(),
      accountNumber: (formAccountNumber || formIban).trim(),
      ownerName: formOwnerName.trim(),
      idCard: formIdCard.trim(),
      type: formType,
      notes: formNotes.trim(),
    };

    try {
      const res = await fetch("/api/sys/bank-accounts", {
        method: editingAccount ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAccounts(data.accounts || []);
        setIsModalOpen(false);
        setSuccessMsg(
          editingAccount
            ? t.backdoorBankAccountsSaveSuccess
            : lang === "es"
            ? "Nueva cuenta bancaria registrada con éxito."
            : "New bank account registered successfully."
        );
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(data.error || "Error al procesar la solicitud.");
      }
    } catch (err) {
      console.error("Error saving bank account:", err);
      setErrorMsg(lang === "es" ? "Error de red al guardar." : "Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/sys/bank-accounts?id=${accountToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAccounts(data.accounts || []);
        setAccountToDelete(null);
        setSuccessMsg(t.backdoorBankAccountsDeleteSuccess);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(data.error || "Error al eliminar la cuenta bancaria.");
      }
    } catch (err) {
      console.error("Error deleting bank account:", err);
      setErrorMsg(lang === "es" ? "Error al eliminar." : "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  // Rule 7: Animated Skeleton Loader
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-2xl w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-slate-200 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SubTab Navigation Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActiveSubTab("ACCOUNTS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === "ACCOUNTS"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>{t.backdoorBankAccountsSubTabAccounts}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 font-mono">
            {accounts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("DISCOUNTS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === "DISCOUNTS"
              ? "bg-purple-900 text-white shadow-xs"
              : "text-slate-600 hover:text-purple-900"
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>{t.backdoorBankAccountsSubTabDiscounts}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-900 font-mono font-bold">
            Master
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("EXCHANGE_RATE")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === "EXCHANGE_RATE"
              ? "bg-purple-900 text-white shadow-xs"
              : "text-slate-600 hover:text-purple-900"
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>{t.backdoorBankAccountsSubTabExchangeRate}</span>
          {exchangeRateInfo && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-900 font-mono font-bold">
              ₡{exchangeRateInfo.rate.toFixed(0)}
            </span>
          )}
        </button>
      </div>

      {activeSubTab === "DISCOUNTS" ? (
        <DiscountCodesManagerSection userRole={userRole} />
      ) : activeSubTab === "EXCHANGE_RATE" ? (
        <ExchangeRateTab userRole={userRole} />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-900 text-white flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  {t.backdoorBankAccountsTitle}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {t.backdoorBankAccountsSubtitle}
              </p>
            </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAccounts}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 transition"
            title="Refrescar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t.backdoorBankAccountsAddBtn}</span>
          </button>
        </div>
      </div>

      {/* Success / Alert Banner */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid of Bank Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const isUSD = acc.currency === "USD";
          const isSinpe = acc.isSinpe || acc.type === "SINPE";

          return (
            <div
              key={acc.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between gap-4 hover:border-slate-300 transition relative overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 ${
                  isUSD
                    ? "bg-emerald-500"
                    : isSinpe
                    ? "bg-blue-600"
                    : "bg-red-600"
                }`}
              />

              {/* Account Header */}
              <div className="space-y-3 pt-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isUSD
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isSinpe
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {isSinpe ? (
                        <Smartphone className="w-4 h-4" />
                      ) : isUSD ? (
                        <DollarSign className="w-4 h-4" />
                      ) : (
                        <Building2 className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 tracking-tight">
                        {acc.bankName}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                            isUSD
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {acc.currency}
                        </span>
                        {acc.type && (
                          <span className="text-[10px] font-medium text-slate-500 uppercase">
                            • {acc.type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(acc)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountToDelete(acc)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Account Details */}
                <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
                  {/* IBAN */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-150">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        IBAN
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-xs truncate block select-all">
                        {acc.iban}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(acc.iban, `iban-${acc.id}`)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition shrink-0"
                      title="Copiar IBAN"
                    >
                      {copiedId === `iban-${acc.id}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Account Number */}
                  {acc.accountNumber && acc.accountNumber !== acc.iban && (
                    <div className="flex items-center justify-between text-[11px] text-slate-600 px-1">
                      <span className="text-slate-400 font-medium">Cuenta:</span>
                      <span className="font-mono font-bold select-all">
                        {acc.accountNumber}
                      </span>
                    </div>
                  )}

                  {/* Owner & Legal ID */}
                  <div className="flex items-center justify-between text-[11px] text-slate-600 px-1">
                    <span className="text-slate-400 font-medium">Titular:</span>
                    <span className="font-bold text-slate-800 truncate">
                      {acc.ownerName}
                    </span>
                  </div>

                  {acc.idCard && (
                    <div className="flex items-center justify-between text-[11px] text-slate-600 px-1">
                      <span className="text-slate-400 font-medium">Cédula:</span>
                      <span className="font-mono font-semibold">{acc.idCard}</span>
                    </div>
                  )}

                  {acc.notes && (
                    <div className="text-[10px] text-slate-500 italic px-1 pt-1 border-t border-slate-100">
                      {acc.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-xl w-fit">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Oficial para transferencias</span>
              </div>
            </div>
          );
        })}
      </div>

      {accounts.length === 0 && (
        <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
          <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">
            {lang === "es"
              ? "No hay cuentas bancarias registradas."
              : "No bank accounts registered."}
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
          >
            {t.backdoorBankAccountsAddBtn}
          </button>
        </div>
      )}

      {/* Section under Cuentas Bancarias for Dollar Exchange Rate & BCCR API */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/5 via-white to-purple-900/10 border border-purple-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-100 text-purple-900">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">{t.backdoorBankAccountsExchangeSectionTitle}</h3>
            {exchangeRateInfo && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  exchangeRateInfo.override
                    ? "bg-amber-100 text-amber-900 border border-amber-200"
                    : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                }`}
              >
                {exchangeRateInfo.override ? t.backdoorExchangeRateStatusOverride : t.backdoorExchangeRateStatusActive}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t.backdoorBankAccountsExchangeSectionDesc}
          </p>
          {exchangeRateInfo && (
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-700 pt-1">
              <span>
                {lang === "es" ? "Venta (Activa):" : "Sell (Active):"}{" "}
                <strong className="font-mono text-slate-900 font-bold">₡{exchangeRateInfo.rate.toFixed(2)}</strong>
              </span>
              <span>•</span>
              <span>
                {lang === "es" ? "Compra:" : "Buy:"}{" "}
                <strong className="font-mono text-slate-900 font-bold">₡{exchangeRateInfo.buyRate.toFixed(2)}</strong>
              </span>
              <span>•</span>
              <span className="text-slate-400 font-mono text-[11px]">
                {lang === "es" ? "Fecha BCCR:" : "BCCR Date:"} {exchangeRateInfo.date}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setActiveSubTab("EXCHANGE_RATE")}
          className="px-5 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm shrink-0 cursor-pointer"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>{t.backdoorBankAccountsManageExchangeBtn}</span>
        </button>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-900 text-white flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  {editingAccount
                    ? t.backdoorBankAccountsEditTitle
                    : t.backdoorBankAccountsCreateTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveAccount} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* Bank Name */}
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Entidad Bancaria / Servicio: *
                  </label>
                  <input
                    type="text"
                    required
                    value={formBankName}
                    onChange={(e) => setFormBankName(e.target.value)}
                    placeholder="Ej: BAC San José, Banco Nacional, BAC (USD)..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-slate-900"
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Moneda: *
                  </label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-slate-900"
                  >
                    <option value="CRC">CRC (Colones - ₡)</option>
                    <option value="USD">USD (Dólares - $)</option>
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Tipo de Cuenta:
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-slate-900"
                  >
                    <option value="CORRIENTE">Cuenta Corriente</option>
                    <option value="AHORROS">Cuenta de Ahorros</option>
                  </select>
                </div>

                {/* IBAN */}
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    IBAN / Número de Transferencia: *
                  </label>
                  <input
                    type="text"
                    required
                    value={formIban}
                    onChange={(e) => setFormIban(e.target.value)}
                    placeholder="CR73010200009482003456"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-slate-900"
                  />
                </div>

                {/* Account Number */}
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Número de Cuenta Local (opcional):
                  </label>
                  <input
                    type="text"
                    value={formAccountNumber}
                    onChange={(e) => setFormAccountNumber(e.target.value)}
                    placeholder="948200345"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-slate-900"
                  />
                </div>

                {/* Owner Name */}
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Titular / Razón Social: *
                  </label>
                  <input
                    type="text"
                    required
                    value={formOwnerName}
                    onChange={(e) => setFormOwnerName(e.target.value)}
                    placeholder="ZxZ Mods Costa Rica S.A."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold focus:outline-none focus:border-slate-900"
                  />
                </div>

                {/* ID Card */}
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Cédula Jurídica / Física:
                  </label>
                  <input
                    type="text"
                    value={formIdCard}
                    onChange={(e) => setFormIdCard(e.target.value)}
                    placeholder="3-101-849201"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-slate-900"
                  />
                </div>

                {/* Notes */}
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Notas o instrucciones adicionales:
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Ej: Indicar número de orden en el detalle del comprobante"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold transition"
                >
                  {t.orderCancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {saving ? t.devSaving : t.devSaveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-fade-in text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900">
                {t.backdoorBankAccountsDeleteConfirm}
              </h3>
              <p className="text-xs text-slate-500">
                Se eliminará permanentemente la cuenta de{" "}
                <span className="font-bold text-slate-800">
                  {accountToDelete.bankName} ({accountToDelete.currency})
                </span>
                .
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                {t.orderCancelBtn}
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {deleting ? t.devSaving : "Eliminar Cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
