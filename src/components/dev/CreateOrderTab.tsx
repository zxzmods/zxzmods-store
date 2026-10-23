"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { formatCRC } from "@/lib/i18n";
import {
  UserCheck,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  Copy,
  Check,
  Share2,
  Wrench,
  Car,
  Truck,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface UserResult {
  id: string;
  email: string;
  displayName: string | null;
  phoneNumber: string | null;
  vehicles?: any[];
}

interface ProductItem {
  id: string;
  nameEn: string;
  nameEs: string;
  priceCRC: number;
  installationPriceCRC: number;
  sku: string;
  imageUrl?: string;
}

interface ComboItem {
  id: string;
  slug: string;
  titleEn: string;
  titleEs: string;
  priceCRC: number;
  installationPriceCRC: number;
  category: string;
  imageUrl?: string;
}

interface SelectedItem {
  id: string;
  name: string;
  sku?: string;
  priceCRC: number;
  installationPriceCRC?: number;
  quantity: number;
  type: "PRODUCT" | "COMBO" | "CUSTOM";
}

export function CreateOrderTab({
  userRole,
  onOrderCreated,
}: {
  userRole: "MASTER" | "STAFF";
  onOrderCreated?: () => void;
}) {
  const { lang, t } = useLanguage();

  // Customer linking
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  // Catalog items
  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>([]);
  const [catalogCombos, setCatalogCombos] = useState<ComboItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // Item Search
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [isItemSearchFocused, setIsItemSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Custom Item entry
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState("");
  const [customItemQty, setCustomItemQty] = useState("1");

  // Delivery & Costs
  const [serviceType, setServiceType] = useState<"STORE_PICKUP" | "HOME_SERVICE" | "UTV_PICKUP" | "SHIPPING">("STORE_PICKUP");
  const [installationCost, setInstallationCost] = useState("0");
  const [shippingCost, setShippingCost] = useState("0");
  const [pickupCost, setPickupCost] = useState("0");

  // Discounts
  const [discountType, setDiscountType] = useState<"NONE" | "PERCENTAGE" | "FIXED">("NONE");
  const [discountValue, setDiscountValue] = useState("0");
  const [discountReason, setDiscountReason] = useState("");

  // Submitting & Claim Link Modal
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [createdOrderResult, setCreatedOrderResult] = useState<{
    orderNumber: string;
    totalCRC: number;
    claimUrl: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetch("/api/sys/catalog")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCatalogProducts(data.products || []);
          setCatalogCombos(data.combos || []);
        }
      })
      .catch((err) => console.error("Catalog fetch error:", err));
  }, []);

  // Customer search debounced
  useEffect(() => {
    if (!userQuery.trim() || userQuery.length < 2) {
      setUserResults([]);
      return;
    }

    const timer = setTimeout(() => {
      fetch(`/api/sys/users/search?q=${encodeURIComponent(userQuery.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setUserResults(data.users || []);
        })
        .catch((err) => console.error("User search error:", err));
    }, 300);

    return () => clearTimeout(timer);
  }, [userQuery]);

  // Click outside listener for item search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsItemSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered search results for items
  const matchedCatalogItems = useMemo(() => {
    if (!itemSearchQuery.trim()) return [];
    const q = itemSearchQuery.toLowerCase().trim();

    const matchedProds = catalogProducts
      .filter(
        (p) =>
          p.sku.toLowerCase().includes(q) ||
          p.nameEs.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: lang === "es" ? p.nameEs : p.nameEn,
        sku: p.sku,
        priceCRC: p.priceCRC,
        installationPriceCRC: p.installationPriceCRC,
        type: "PRODUCT" as const,
        imageUrl: p.imageUrl,
      }));

    const matchedCmb = catalogCombos
      .filter(
        (c) =>
          c.slug.toLowerCase().includes(q) ||
          c.titleEs.toLowerCase().includes(q) ||
          c.titleEn.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        name: lang === "es" ? c.titleEs : c.titleEn,
        sku: c.slug,
        priceCRC: c.priceCRC,
        installationPriceCRC: c.installationPriceCRC,
        type: "COMBO" as const,
        imageUrl: c.imageUrl,
      }));

    return [...matchedProds, ...matchedCmb];
  }, [itemSearchQuery, catalogProducts, catalogCombos, lang]);

  const handleAddItem = (item: {
    id: string;
    name: string;
    sku?: string;
    priceCRC: number;
    installationPriceCRC?: number;
    type: "PRODUCT" | "COMBO";
  }) => {
    const existingIndex = selectedItems.findIndex((it) => it.id === item.id);
    let updated: any[];
    if (existingIndex > -1) {
      updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
    } else {
      updated = [
        ...selectedItems,
        {
          id: item.id,
          name: item.name,
          sku: item.sku,
          priceCRC: item.priceCRC,
          installationPriceCRC: item.installationPriceCRC || 0,
          quantity: 1,
          type: item.type,
        },
      ];
    }
    setSelectedItems(updated);

    const totalInstall = updated.reduce(
      (sum, it) => sum + (it.installationPriceCRC || 0) * (it.quantity || 1),
      0
    );
    setInstallationCost(String(totalInstall));

    setItemSearchQuery("");
    setIsItemSearchFocused(false);
  };

  const handleAddCustomItem = () => {
    if (!customItemName.trim() || !customItemPrice) return;
    const price = Math.max(0, parseInt(customItemPrice) || 0);
    const qty = Math.max(1, parseInt(customItemQty) || 1);

    setSelectedItems([
      ...selectedItems,
      {
        id: `custom_${Date.now()}`,
        name: customItemName.trim(),
        priceCRC: price,
        installationPriceCRC: 0,
        quantity: qty,
        type: "CUSTOM",
      },
    ]);
    setCustomItemName("");
    setCustomItemPrice("");
    setCustomItemQty("1");
  };

  const handleRemoveItem = (index: number) => {
    const updated = selectedItems.filter((_, i) => i !== index);
    setSelectedItems(updated);
    const totalInstall = updated.reduce(
      (sum, it) => sum + (it.installationPriceCRC || 0) * (it.quantity || 1),
      0
    );
    setInstallationCost(String(totalInstall));
  };

  // Calculations
  const partsSubtotal = selectedItems.reduce(
    (acc, it) => acc + (it.priceCRC || 0) * (it.quantity || 1),
    0
  );
  const numInstallation = Math.max(0, parseInt(installationCost) || 0);
  const numShipping = Math.max(0, parseInt(shippingCost) || 0);
  const numPickup = Math.max(0, parseInt(pickupCost) || 0);
  const grossSubtotal = partsSubtotal + numInstallation + numShipping + numPickup;

  let discountCRC = 0;
  const numDiscountVal = Math.max(0, parseFloat(discountValue) || 0);
  if (discountType === "PERCENTAGE") {
    discountCRC = Math.round((grossSubtotal * numDiscountVal) / 100);
  } else if (discountType === "FIXED") {
    discountCRC = Math.round(numDiscountVal);
  }
  const netTotalCRC = Math.max(0, grossSubtotal - discountCRC);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setFeedback({ type: "error", msg: "Agrega al menos una pieza o combo a la cotización." });
      return;
    }

    if (userRole === "STAFF" && discountType === "PERCENTAGE" && numDiscountVal > 15) {
      setFeedback({
        type: "error",
        msg: "El personal técnico tiene un límite máximo de 15% de descuento.",
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const payload = {
      userId: selectedUser ? selectedUser.id : null,
      customerName: selectedUser ? selectedUser.displayName || selectedUser.email : guestName || null,
      customerEmail: selectedUser ? selectedUser.email : guestEmail || null,
      customerPhone: selectedUser ? selectedUser.phoneNumber : guestPhone || null,
      shippingAddress: shippingAddress || null,
      serviceType,
      status: "PAYMENT_CONFIRMATION",
      items: selectedItems,
      partsSubtotalCRC: partsSubtotal,
      installationCostCRC: numInstallation,
      shippingCostCRC: numShipping,
      pickupCostCRC: numPickup,
      discountType,
      discountValue: numDiscountVal,
      discountReason: discountReason || null,
    };

    try {
      const res = await fetch("/api/sys/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success && data.order) {
        setCreatedOrderResult({
          orderNumber: data.order.orderNumber,
          totalCRC: data.order.totalCRC,
          claimUrl: data.claimUrl,
        });

        // Reset form
        setSelectedItems([]);
        setSelectedUser(null);
        setGuestName("");
        setGuestEmail("");
        setGuestPhone("");
        setShippingAddress("");
        setInstallationCost("0");
        setShippingCost("0");
        setPickupCost("0");
        setDiscountType("NONE");
        setDiscountValue("0");
        setDiscountReason("");

        if (onOrderCreated) onOrderCreated();
      } else {
        setFeedback({ type: "error", msg: data.message || data.error || "Error al crear el pedido." });
      }
    } catch (err) {
      console.error("Order submit error:", err);
      setFeedback({ type: "error", msg: "Error de conexión al generar el pedido." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdOrderResult?.claimUrl) return;
    navigator.clipboard.writeText(createdOrderResult.claimUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* SUCCESS MODAL WITH REDEMPTION / CLAIM LINK (USER REQUIREMENT) */}
      {createdOrderResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ¡Pedido #{createdOrderResult.orderNumber} Creado!
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Total cotizado: {formatCRC(createdOrderResult.totalCRC)}
                </span>
              </div>
            </div>

            {/* Generated link for customer to claim and register to their account */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Enlace de Canje para Enviar al Cliente:
                </label>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Envía este enlace al cliente por WhatsApp o correo. Al abrirlo, el cliente canjeará el pedido y quedará registrado permanentemente en su cuenta. El enlace se invalidará una vez canjeado.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdOrderResult.claimUrl}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shrink-0 shadow-xs"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "¡Copiado!" : "Copiar"}</span>
                </button>
              </div>
            </div>

            {/* WhatsApp Share Button & Close */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `¡Hola! Aquí tienes el enlace oficial de tu cotización y pedido en ZxZ Mods (#${createdOrderResult.orderNumber}): ${createdOrderResult.claimUrl}. Abre el enlace para canjearlo e inscribirlo a tu cuenta.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Enviar por WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setCreatedOrderResult(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmitOrder} className="space-y-4">
        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
              feedback.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* 1. Cliente */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-slate-700" />
              1. Cliente & Registro de Cuenta
            </span>
            <button
              type="button"
              onClick={() => {
                setIsGuest(!isGuest);
                setSelectedUser(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-900 underline"
            >
              {isGuest ? "Vincular a usuario existente" : "Cliente nuevo / Generar enlace de canje"}
            </button>
          </div>

          {!isGuest ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Buscar por correo o nombre del cliente registrado..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition"
                />
              </div>

              {userResults.length > 0 && (
                <div className="border border-slate-200 bg-white rounded-xl p-1.5 max-h-40 overflow-y-auto space-y-1 shadow-sm">
                  {userResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setSelectedUser(u);
                        setUserResults([]);
                        setUserQuery("");
                        setGuestName(u.displayName || "");
                        setGuestEmail(u.email || "");
                        setGuestPhone(u.phoneNumber || "");
                      }}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 text-xs flex items-center justify-between transition border-b border-slate-100 last:border-0"
                    >
                      <div>
                        <span className="font-semibold text-slate-900 block">{u.displayName || u.email}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>{u.email}</span>
                          {u.phoneNumber && <span>• Tel: {u.phoneNumber}</span>}
                        </div>
                        {u.vehicles && u.vehicles.length > 0 && (
                          <span className="text-[10px] text-emerald-700 font-mono block mt-0.5">
                            🚗 {u.vehicles[0].year} {u.vehicles[0].brandName} {u.vehicles[0].modelName}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Seleccionar
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {selectedUser && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                  <div className="space-y-0.5">
                    <span className="font-bold block">✓ Cliente Registrado en Sistema:</span>
                    <span className="font-semibold">{selectedUser.displayName || "Usuario Registrado"}</span>
                    <span className="text-[11px] text-emerald-700 block">
                      {selectedUser.email} {selectedUser.phoneNumber ? `• Tel: ${selectedUser.phoneNumber}` : ""}
                    </span>
                    {selectedUser.vehicles && selectedUser.vehicles.length > 0 && (
                      <span className="text-[10px] text-emerald-800 font-mono block">
                        🚗 Vehículo: {selectedUser.vehicles[0].year} {selectedUser.vehicles[0].brandName} {selectedUser.vehicles[0].modelName}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(null);
                      setGuestName("");
                      setGuestEmail("");
                      setGuestPhone("");
                    }}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1 bg-white rounded-lg border border-red-200"
                  >
                    Desvincular
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Nombre del cliente:</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Nombre y apellido"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Teléfono:</label>
                <input
                  type="text"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+506 8888-0000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Correo (para canje):</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* 2. Repuestos & Combos (SEARCH INTERACTIVE UI - USER REQUIREMENT) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
            <Package className="w-4 h-4 text-slate-700" />
            2. Repuestos, Combos & Piezas Cotizadas
          </span>

          {/* Selected items list */}
          {selectedItems.length > 0 ? (
            <div className="space-y-1.5">
              {selectedItems.map((it, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        it.type === "COMBO"
                          ? "bg-purple-100 text-purple-700 border border-purple-200"
                          : it.type === "PRODUCT"
                          ? "bg-slate-200 text-slate-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {it.type}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-900 block">{it.name}</span>
                      {it.sku && <span className="text-[10px] text-slate-400 font-mono">{it.sku}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-mono">x{it.quantity}</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {formatCRC(it.priceCRC * it.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-2">Sin piezas ni combos agregados.</p>
          )}

          {/* SEARCH INPUT WITH SMALL FLOATING RESULTS UI */}
          <div ref={searchContainerRef} className="relative pt-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={itemSearchQuery}
                onFocus={() => setIsItemSearchFocused(true)}
                onChange={(e) => {
                  setItemSearchQuery(e.target.value);
                  setIsItemSearchFocused(true);
                }}
                placeholder="Escribe para buscar productos o combos por SKU o nombre..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition"
              />
            </div>

            {/* Floating Results Popup UI */}
            {isItemSearchFocused && itemSearchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto divide-y divide-slate-100 p-1">
                {matchedCatalogItems.length > 0 ? (
                  matchedCatalogItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAddItem(item)}
                      className="w-full p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between text-left transition group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                            item.type === "COMBO"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {item.type}
                        </span>
                        <div className="truncate">
                          <span className="font-bold text-xs text-slate-900 block truncate group-hover:text-[#C02030] transition-colors">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.sku}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pl-2">
                        <span className="font-bold font-mono text-xs text-slate-900">
                          {formatCRC(item.priceCRC)}
                        </span>
                        <span className="p-1 rounded-md bg-slate-100 text-slate-600 group-hover:bg-[#C02030] group-hover:text-white transition">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No se encontraron productos ni combos con &quot;{itemSearchQuery}&quot;.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Custom Piece Entry */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              O Agregar Pieza Especial Personalizada:
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                placeholder="Nombre de la pieza especial..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
              <input
                type="number"
                value={customItemPrice}
                onChange={(e) => setCustomItemPrice(e.target.value)}
                placeholder="Precio ₡"
                className="w-28 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
              <button
                type="button"
                onClick={handleAddCustomItem}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Descuentos */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <span className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-2.5">
            3. Descuentos & Promociones
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-600 block mb-1">Modalidad de Descuento:</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              >
                <option value="NONE">Sin Descuento</option>
                <option value="PERCENTAGE">Porcentaje (%)</option>
                <option value="FIXED">Monto Fijo (₡)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-600 block mb-1">
                Valor {discountType === "PERCENTAGE" ? "(%)" : "(₡)"}:
              </label>
              <input
                type="number"
                min="0"
                max={userRole === "STAFF" && discountType === "PERCENTAGE" ? 15 : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                disabled={discountType === "NONE"}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 font-mono disabled:opacity-50 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-600 block mb-1">Motivo del Descuento:</label>
              <input
                type="text"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                disabled={discountType === "NONE"}
                placeholder="e.g. Promoción Club UTV"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 disabled:opacity-50 focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>
        </div>

        {/* 5. Total & Confirmación */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Total a Facturar
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {formatCRC(netTotalCRC)}
              </span>
              {discountCRC > 0 && (
                <span className="text-xs text-emerald-600 font-mono font-bold">
                  (-{formatCRC(discountCRC)} de descuento)
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || selectedItems.length === 0}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider transition shadow-sm"
          >
            {submitting ? "Creando y Generando Enlace..." : "Crear Pedido & Generar Enlace"}
          </button>
        </div>
      </form>
    </div>
  );
}
