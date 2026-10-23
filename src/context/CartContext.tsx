"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { formatCRC, formatUSD, convertCRCToUSD } from "@/lib/i18n";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getWhatsAppUrl } from "@/config/company";

import { SelectedParameterItem } from "@/lib/products";

export interface CartItem {
  id: string;
  sku?: string;
  title: string;
  brand?: string;
  category?: string[];
  comp?: string[];
  priceCRC: number;
  basePriceCRC?: number;
  basePriceUSD?: number;
  supplierUrl?: string | null;
  selectedParameters?: SelectedParameterItem[];
  parametersSummary?: string;
  installationPriceCRC: number;
  withInstallation: boolean;
  quantity: number;
  type: "PRODUCT" | "COMBO" | "PACKAGE";
  imageUrl: string;
  homeInstallation?: boolean;
  freeInstallation?: boolean;
  supplierStockStatus?: string;
  supplierStockMessage?: string;
  supplierLeadDaysMin?: number;
  supplierLeadDaysMax?: number;
}


export interface LiveExchangeRate {
  rate: number;       // Live USD sell rate (venta)
  buyRate: number;    // USD buy rate (compra)
  currency: string;   // "USD"
  baseCurrency: string; // "CRC"
  source: string;     // "Ministerio de Hacienda / BCCR"
  date: string;       // e.g. "2026-10-06"
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  toggleInstallation: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;

  // Last added product tracking for right partial screen callout
  lastAddedItem: CartItem | null;
  lastAddedTimestamp: number | null;
  clearLastAddedItem: () => void;

  // Currency & Live Exchange Rate transformation
  currency: "CRC" | "USD";
  setCurrency: (c: "CRC" | "USD") => void;
  toggleCurrency: () => void;
  exchangeRate: LiveExchangeRate | null;
  isRateLoading: boolean;
  sellRate: number;

  // Calculations in CRC
  partsSubtotal: number;
  laborSubtotal: number;
  installedItemCount: number;
  isEligibleForLaborDiscount: boolean;
  laborDiscount: number;
  finalLaborSubtotal: number;
  totalCRC: number;

  // Calculations in USD (dynamic transformation using live sell rate)
  partsSubtotalUSD: number;
  laborSubtotalUSD: number;
  laborDiscountUSD: number;
  finalLaborSubtotalUSD: number;
  totalUSD: number;

  // Formatting helper based on active currency
  formatPrice: (amountCRC: number) => string;

  generateWhatsAppLink: (vehicleName?: string, orderNumber?: string) => string;
  createOrderFromCart: (serviceType?: string, notes?: string) => Promise<{ success: boolean; order?: any; error?: string }>;
  activeQuotation: any | null;
  setActiveQuotation: (order: any | null) => void;
  clearActiveQuotation: () => void;
  createQuotationOrder: (notes?: string) => Promise<{ success: boolean; order?: any; error?: string }>;
  createBacCompraClickOrder: (vehicleName?: string) => Promise<{ success: boolean; order?: any; waUrl?: string; error?: string }>;
  generateBacCompraClickWhatsAppMessage: (vehicleName?: string, orderNumber?: string) => string;

  // Add-to-cart popup modal & recommendations
  isAddedModalOpen: boolean;
  setIsAddedModalOpen: (open: boolean) => void;
  addedModalItem: CartItem | null;
  openAddedModal: (item: CartItem) => void;
  closeAddedModal: () => void;
  addItemSilently: (item: Omit<CartItem, "quantity">) => void;

  // Combo swap for smart checkout
  swapItemsForCombo: (combo: {
    id: string;
    slug: string;
    titleEs: string;
    titleEn?: string;
    priceCRC: number;
    imageUrl?: string;
  }, itemIdsToRemove: string[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const DEFAULT_SELL_RATE = 457.03;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, requireAuth, refreshUser } = useAuth();
  const { t, lang } = useLanguage();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);
  const [lastAddedTimestamp, setLastAddedTimestamp] = useState<number | null>(null);

  // Add-to-cart popup modal & recommendations state
  const [isAddedModalOpen, setIsAddedModalOpen] = useState(false);
  const [addedModalItem, setAddedModalItem] = useState<CartItem | null>(null);

  const openAddedModal = (item: CartItem) => {
    setAddedModalItem(item);
    setIsAddedModalOpen(true);
  };

  const closeAddedModal = () => {
    setIsAddedModalOpen(false);
    setAddedModalItem(null);
  };

  const [currency, setCurrencyState] = useState<"CRC" | "USD">("CRC");
  const [exchangeRate, setExchangeRate] = useState<LiveExchangeRate | null>(null);
  const [isRateLoading, setIsRateLoading] = useState(true);
  const [activeQuotation, setActiveQuotation] = useState<any | null>(null);

  const clearActiveQuotation = () => {
    setActiveQuotation(null);
    try {
      localStorage.removeItem("zxz_active_quotation");
    } catch (e) {}
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("zxz_quotation_cleared"));
    }
  };

  // Load cart, preferred currency, and active quotation from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("zxz_cart");
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed)) {
            const sanitized = parsed.map((item: any) => {
              const isFree =
                item.freeInstallation === true ||
                item.id === "BMP-Z10-EXH-01" ||
                item.sku === "BMP-Z10-EXH-01" ||
                (item.withInstallation && item.installationPriceCRC === 0);
              return {
                ...item,
                freeInstallation: isFree ? true : item.freeInstallation,
                installationPriceCRC: isFree ? 0 : item.installationPriceCRC,
                withInstallation: isFree ? true : item.withInstallation,
              };
            });
            setItems(sanitized);
          }
        } catch {}
      }

      const savedCurrency = localStorage.getItem("zxz_currency");
      if (savedCurrency === "USD" || savedCurrency === "CRC") {
        setCurrencyState(savedCurrency);
      }

      const savedQuote = localStorage.getItem("zxz_active_quotation");
      if (savedQuote) {
        try {
          const parsed = JSON.parse(savedQuote);
          if (parsed && typeof parsed === "object") {
            const statusUpper = String(parsed.status || "").toUpperCase();
            if (statusUpper && statusUpper !== "COTIZACION") {
              localStorage.removeItem("zxz_active_quotation");
            } else {
              setActiveQuotation(parsed);
            }
          }
        } catch {}
      }
    } catch (e) {
      console.error("Failed to read cart from localStorage", e);
    }
  }, []);

  // Synchronize cart items with live database catalog (updates homeInstallation, prices, titles)
  useEffect(() => {
    if (items.length === 0) return;

    let isMounted = true;
    const syncCartWithServer = async () => {
      try {
        const [prodRes, comboRes] = await Promise.all([
          fetch("/api/products").catch(() => null),
          fetch("/api/combos").catch(() => null),
        ]);

        const prodData = prodRes?.ok ? await prodRes.json().catch(() => null) : null;
        const comboData = comboRes?.ok ? await comboRes.json().catch(() => null) : null;

        const serverProducts: any[] = prodData?.products || [];
        const serverCombos: any[] = comboData?.combos || [];

        if (!isMounted) return;

        let hasChanges = false;
        const updatedItems = items.map((cartItem) => {
          if (cartItem.type === "PRODUCT") {
            const rawProdId = cartItem.id.split("__")[0];
            const matched = serverProducts.find(
              (p) =>
                p.id?.toLowerCase() === rawProdId.toLowerCase() ||
                p.slug?.toLowerCase() === rawProdId.toLowerCase() ||
                p.id?.toLowerCase() === cartItem.sku?.toLowerCase()
            );

            if (matched) {
              const isFree = Boolean(
                matched.price?.I_price?.includes === true ||
                matched.price?.I_price?.includes === "true" ||
                matched.isInstallationIncluded === true
              );
              const freshHomeInstall = matched.homeInstallation !== false;
              const deltaSum = (cartItem.selectedParameters || []).reduce((acc, p) => acc + (p.priceDeltaCRC || 0), 0);
              const freshBasePrice = matched.price?.T_price ?? (cartItem.basePriceCRC ?? (cartItem.priceCRC - deltaSum));
              const freshPrice = freshBasePrice + deltaSum;
              const freshInstallPrice = isFree ? 0 : (Number(matched.price?.I_price?.I_price) || 0);
              const freshWithInstallation = isFree ? true : cartItem.withInstallation;
              const freshFreeInstallation = isFree;
              const freshSupplierStatus = matched.supplierStockStatus || "IN_STOCK";
              const freshSupplierMsg = matched.supplierStockMessageEs || null;
              const freshLeadMin = matched.supplierLeadDaysMin ?? 7;
              const freshLeadMax = matched.supplierLeadDaysMax ?? 12;
              const freshComp = matched.comp || cartItem.comp;
              const compChanged = Boolean(matched.comp && JSON.stringify(cartItem.comp || []) !== JSON.stringify(matched.comp));

              if (
                compChanged ||
                cartItem.homeInstallation !== freshHomeInstall ||
                cartItem.priceCRC !== freshPrice ||
                cartItem.installationPriceCRC !== freshInstallPrice ||
                cartItem.withInstallation !== freshWithInstallation ||
                cartItem.freeInstallation !== freshFreeInstallation ||
                cartItem.supplierStockStatus !== freshSupplierStatus
              ) {
                hasChanges = true;
                return {
                  ...cartItem,
                  comp: freshComp,
                  homeInstallation: freshHomeInstall,
                  basePriceCRC: freshBasePrice,
                  priceCRC: freshPrice,
                  installationPriceCRC: freshInstallPrice,
                  withInstallation: freshWithInstallation,
                  freeInstallation: freshFreeInstallation,
                  supplierStockStatus: freshSupplierStatus,
                  supplierStockMessage: freshSupplierMsg,
                  supplierLeadDaysMin: freshLeadMin,
                  supplierLeadDaysMax: freshLeadMax,
                };
              }
            }
          } else if (cartItem.type === "COMBO") {
            const rawComboId = cartItem.id.split("__")[0].replace(/^combo-/, "");
            const matched = serverCombos.find(
              (c) =>
                c.id === rawComboId ||
                c.slug === rawComboId ||
                `combo-${c.id}` === cartItem.id.split("__")[0]
            );

            if (matched) {
              const isComboFree = Boolean(
                matched.freeInstallation === true ||
                matched.isInstallationIncluded === true ||
                matched.installationPriceCRC === 0
              );
              const freshHomeInstall = matched.homeInstallationAvailable !== false;
              const comboDeltaSum = (cartItem.selectedParameters || []).reduce((acc, p) => acc + (p.priceDeltaCRC || 0), 0);
              const freshBasePrice = matched.priceCRC ?? (cartItem.basePriceCRC ?? (cartItem.priceCRC - comboDeltaSum));
              const freshPrice = freshBasePrice + comboDeltaSum;
              const freshInstallPrice = isComboFree ? 0 : (matched.installationPriceCRC ?? cartItem.installationPriceCRC);
              const freshWithInstallation = isComboFree ? true : cartItem.withInstallation;
              const freshFreeInstallation = isComboFree;

              const freshStockStatus = matched.stockStatus || matched.availability?.status || "IN_STOCK";
              const freshStockMsg = matched.availability?.summaryEs || null;
              const freshLeadMin = matched.leadDaysMin || matched.availability?.leadDaysMin || 7;
              const freshLeadMax = matched.leadDaysMax || matched.availability?.leadDaysMax || 12;

              if (
                cartItem.homeInstallation !== freshHomeInstall ||
                cartItem.priceCRC !== freshPrice ||
                cartItem.installationPriceCRC !== freshInstallPrice ||
                cartItem.withInstallation !== freshWithInstallation ||
                cartItem.freeInstallation !== freshFreeInstallation ||
                cartItem.supplierStockStatus !== freshStockStatus
              ) {
                hasChanges = true;
                return {
                  ...cartItem,
                  homeInstallation: freshHomeInstall,
                  basePriceCRC: freshBasePrice,
                  priceCRC: freshPrice,
                  installationPriceCRC: freshInstallPrice,
                  withInstallation: freshWithInstallation,
                  freeInstallation: freshFreeInstallation,
                  supplierStockStatus: freshStockStatus,
                  supplierStockMessage: freshStockMsg,
                  supplierLeadDaysMin: freshLeadMin,
                  supplierLeadDaysMax: freshLeadMax,
                };
              }
            }
          }
          return cartItem;
        });

        if (hasChanges && isMounted) {
          setItems(updatedItems);
          try {
            localStorage.setItem("zxz_cart", JSON.stringify(updatedItems));
          } catch (e) {}
        }
      } catch (err) {
        console.error("Cart sync with server error:", err);
      }
    };

    syncCartWithServer();

    return () => {
      isMounted = false;
    };
  }, [items.length]);

  // Fetch live sell rate from /api/exchange-rate and keep it refreshed
  useEffect(() => {
    let isMounted = true;

    const fetchLiveRate = async () => {
      try {
        const res = await fetch("/api/exchange-rate");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.success && data?.data) {
            setExchangeRate(data.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch live exchange rate:", err);
      } finally {
        if (isMounted) setIsRateLoading(false);
      }
    };

    fetchLiveRate();

    // Re-check rate periodically (every 10 minutes) and whenever tab gains focus
    const intervalId = setInterval(fetchLiveRate, 10 * 60 * 1000);
    const handleFocus = () => fetchLiveRate();
    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Listen for quotation clearing events across tabs and window
  useEffect(() => {
    const handleQuotationCleared = () => {
      setActiveQuotation(null);
    };
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "zxz_active_quotation") {
        if (!e.newValue) {
          setActiveQuotation(null);
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed && String(parsed.status || "").toUpperCase() !== "COTIZACION") {
              clearActiveQuotation();
            } else {
              setActiveQuotation(parsed);
            }
          } catch {
            clearActiveQuotation();
          }
        }
      }
    };

    window.addEventListener("zxz_quotation_cleared", handleQuotationCleared);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("zxz_quotation_cleared", handleQuotationCleared);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Dynamically verify active quotation status with database
  // Once an order type '#COT' gets updated to PAYMENT_CONFIRMATION, the advert on the cart disappears!
  useEffect(() => {
    if (!activeQuotation?.id) return;

    let isMounted = true;
    const verifyQuoteStatus = async () => {
      try {
        const res = await fetch(`/api/orders/${activeQuotation.id}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.success && data?.order) {
            const statusUpper = String(data.order.status || "").toUpperCase();
            if (statusUpper !== "COTIZACION") {
              clearActiveQuotation();
            } else {
              setActiveQuotation(data.order);
              try {
                localStorage.setItem("zxz_active_quotation", JSON.stringify(data.order));
              } catch (e) {}
            }
          }
        } else if (res.status === 404) {
          if (isMounted) clearActiveQuotation();
        }
      } catch (e) {}
    };

    verifyQuoteStatus();

    const intervalId = setInterval(verifyQuoteStatus, 10000);
    const handleFocus = () => verifyQuoteStatus();
    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [activeQuotation?.id]);

  const setCurrency = (c: "CRC" | "USD") => {
    setCurrencyState(c);
    try {
      localStorage.setItem("zxz_currency", c);
    } catch (e) {}
  };

  const toggleCurrency = () => {
    setCurrency(currency === "CRC" ? "USD" : "CRC");
  };

  const saveItems = (newItems: CartItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem("zxz_cart", JSON.stringify(newItems));
    } catch (e) {}
  };

  const performAddItem = (item: Omit<CartItem, "quantity">, openModal = true) => {
    let computedId = item.id;
    if (item.selectedParameters && item.selectedParameters.length > 0 && !computedId.includes("__")) {
      const paramSlug = item.selectedParameters.map((p) => `${p.parameterId}_${p.optionId}`).join("__");
      computedId = `${item.id}__${paramSlug}`;
    }

    const computedSummary = item.parametersSummary || (item.selectedParameters && item.selectedParameters.length > 0
      ? item.selectedParameters.map((p) => `${p.parameterName}: ${p.optionLabel}${p.priceDeltaCRC ? ` (${p.priceDeltaCRC > 0 ? `+₡${p.priceDeltaCRC.toLocaleString()}` : `-₡${Math.abs(p.priceDeltaCRC).toLocaleString()}`})` : ""}`).join(" | ")
      : undefined);

    const isFree = Boolean(
      item.freeInstallation === true ||
      (item.withInstallation && item.installationPriceCRC === 0)
    );
    const sanitizedItem: Omit<CartItem, "quantity"> = {
      ...item,
      id: computedId,
      parametersSummary: computedSummary,
      freeInstallation: isFree,
      installationPriceCRC: isFree ? 0 : item.installationPriceCRC,
      withInstallation: isFree ? true : item.withInstallation,
    };

    let updatedItem: CartItem = { ...sanitizedItem, quantity: 1 };
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (i) => i.id === sanitizedItem.id && i.withInstallation === sanitizedItem.withInstallation
      );
      let nextItems: CartItem[];
      if (existingIndex > -1) {
        nextItems = [...prevItems];
        nextItems[existingIndex] = {
          ...nextItems[existingIndex],
          quantity: nextItems[existingIndex].quantity + 1,
        };
        updatedItem = nextItems[existingIndex];
      } else {
        updatedItem = { ...sanitizedItem, quantity: 1 };
        nextItems = [...prevItems, updatedItem];
      }
      try {
        localStorage.setItem("zxz_cart", JSON.stringify(nextItems));
      } catch (e) {}
      return nextItems;
    });

    // Set last added item to show callout in the right partial screen
    setLastAddedItem(updatedItem);
    setLastAddedTimestamp(Date.now());

    // When requested, open dedicated add-to-cart recommendation popup modal
    if (openModal) {
      setAddedModalItem(updatedItem);
      setIsAddedModalOpen(true);
      setIsOpen(false);
    }
  };

  const addItem = (item: Omit<CartItem, "quantity">) => {
    if (!user) {
      requireAuth(() => performAddItem(item, true), t.authGatingCartReason);
      return;
    }
    performAddItem(item, true);
  };

  const addItemSilently = (item: Omit<CartItem, "quantity">) => {
    performAddItem(item, false);
  };

  const swapItemsForCombo = (
    combo: {
      id: string;
      slug: string;
      titleEs: string;
      titleEn?: string;
      priceCRC: number;
      imageUrl?: string;
    },
    itemIdsToRemove: string[]
  ) => {
    const removeSet = new Set(itemIdsToRemove.map((id) => id.toLowerCase()));
    const remainingItems = items.filter(
      (item) => !removeSet.has(item.id.toLowerCase())
    );

    const comboCartItem: CartItem = {
      id: `combo-${combo.id || combo.slug}`,
      type: "COMBO",
      title: lang === "es" ? combo.titleEs : (combo.titleEn || combo.titleEs),
      priceCRC: combo.priceCRC,
      basePriceCRC: combo.priceCRC,
      quantity: 1,
      imageUrl: combo.imageUrl || "/images/sxs/z10_front.png",
      category: ["performance"],
      withInstallation: false,
      installationPriceCRC: 0,
      freeInstallation: false,
      supplierStockStatus: "IN_STOCK",
      supplierLeadDaysMin: 2,
      supplierLeadDaysMax: 4,
    };

    saveItems([...remainingItems, comboCartItem]);
  };

  const clearLastAddedItem = () => {
    setLastAddedItem(null);
    setLastAddedTimestamp(null);
  };

  const removeItem = (id: string) => {
    if (lastAddedItem?.id === id) {
      clearLastAddedItem();
    }
    saveItems(items.filter((i) => i.id !== id));
  };

  const toggleInstallation = (id: string) => {
    saveItems(
      items.map((i) => {
        if (i.id !== id) return i;
        // Products with free installation cannot be unselected or toggled
        if (i.freeInstallation || (i.installationPriceCRC === 0 && i.withInstallation)) {
          return i;
        }
        return { ...i, withInstallation: !i.withInstallation };
      })
    );
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      removeItem(id);
    } else {
      saveItems(items.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
    }
  };

  const clearCart = () => {
    clearLastAddedItem();
    saveItems([]);
  };

  // Calculations
  const partsSubtotal = items.reduce(
    (sum, item) => sum + item.priceCRC * item.quantity,
    0
  );

  const laborSubtotal = items.reduce(
    (sum, item) => {
      const isFree = item.freeInstallation || (item.installationPriceCRC === 0 && item.withInstallation);
      if (isFree) return sum;
      return sum + (item.withInstallation ? item.installationPriceCRC * item.quantity : 0);
    },
    0
  );

  // User rule: products with free installation do NOT count towards the labor discount
  const installedItemCount = items.reduce(
    (sum, item) => {
      const isFree = item.freeInstallation || (item.installationPriceCRC === 0 && item.withInstallation);
      return (
        sum +
        (!isFree && item.withInstallation && (item.installationPriceCRC || 0) > 0
          ? item.quantity
          : 0)
      );
    },
    0
  );

  const isEligibleForLaborDiscount = false;
  const laborDiscount = 0;
  const finalLaborSubtotal = laborSubtotal;
  // User Rule: When paying the cart and checking out, never charge the install price since that is for the service screen and service checkout
  const totalCRC = partsSubtotal;

  // USD Calculations with live sell value
  const activeSellRate = exchangeRate?.rate || DEFAULT_SELL_RATE;
  const partsSubtotalUSD = convertCRCToUSD(partsSubtotal, activeSellRate);
  const laborSubtotalUSD = convertCRCToUSD(laborSubtotal, activeSellRate);
  const laborDiscountUSD = 0;
  const finalLaborSubtotalUSD = convertCRCToUSD(finalLaborSubtotal, activeSellRate);
  const totalUSD = convertCRCToUSD(totalCRC, activeSellRate);

  const formatPrice = (amountCRC: number) => {
    if (currency === "USD") {
      const usdValue = convertCRCToUSD(amountCRC, activeSellRate);
      return formatUSD(usdValue);
    }
    return formatCRC(amountCRC);
  };

  const generateWhatsAppLink = (vehicleName?: string, orderNumber?: string) => {
    let msg = `¡Hola ZxZ Mods! Me gustaría cotizar la siguiente orden`;
    if (orderNumber) {
      msg += ` (*Pedido #${orderNumber}*)`;
    }
    if (vehicleName) {
      msg += ` para mi vehículo: *${vehicleName}*`;
    }
    msg += `:\n\n`;

    items.forEach((item, idx) => {
      const itemPriceStr =
        currency === "USD"
          ? `${formatUSD(convertCRCToUSD(item.priceCRC, activeSellRate))} (₡${formatCRC(item.priceCRC)})`
          : formatCRC(item.priceCRC);

      const paramStr = item.parametersSummary ? ` [${item.parametersSummary}]` : "";
      msg += `${idx + 1}. *${item.title}*${paramStr} (Cant: ${item.quantity}) - ${itemPriceStr}\n`;
      if (item.withInstallation) {
        const installStr =
          currency === "USD"
            ? `${formatUSD(convertCRCToUSD(item.installationPriceCRC, activeSellRate))} (₡${formatCRC(item.installationPriceCRC)})`
            : formatCRC(item.installationPriceCRC);

        const homeTag = item.homeInstallation ? " [Apto Instalación a Domicilio]" : "";
        msg += `   └ [✓] Con Instalación en Taller ZxZ (+${installStr})${homeTag}\n`;
      }
    });

    msg += `\n*Subtotal Partes:* ${formatCRC(partsSubtotal)} (${formatUSD(partsSubtotalUSD)})`;
    if (laborSubtotal > 0) {
      msg += `\n*Mano de Obra:* ${formatCRC(laborSubtotal)} (${formatUSD(laborSubtotalUSD)})`;
    }
    msg += `\n*Total Estimado:* ${formatCRC(totalCRC)} (${formatUSD(totalUSD)} USD)`;
    msg += `\n*T.C. Venta:* ₡${activeSellRate.toFixed(2)} / USD (Oficial BCCR)`;
    msg += `\n\n¿Tienen disponibilidad y fecha estimada para taller/entrega?`;

    return getWhatsAppUrl(msg);
  };

  const createOrderFromCart = async (serviceType = "STORE_PICKUP", notes?: string) => {
    if (items.length === 0) return { success: false, error: "Carrito vacío" };
    try {
      const res = await fetch("/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          totalCRC: partsSubtotal,
          partsSubtotalCRC: partsSubtotal,
          laborSubtotalCRC: 0,
          serviceType: items.some((i) => i.homeInstallation) ? "HOME_SERVICE" : serviceType,
          notes,
          customerName: user?.displayName || null,
        }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        if (refreshUser) {
          await refreshUser();
        }
        return { success: true, order: data.order };
      }
      return { success: false, error: data.error };
    } catch (e: any) {
      return { success: false, error: e?.message || "Error al crear orden" };
    }
  };

  const [isCreatingQuote, setIsCreatingQuote] = useState(false);

  const createQuotationOrder = async (notes?: string) => {
    if (items.length === 0) {
      return { success: false, error: "El carrito está vacío. Agrega productos o combos para cotizar." };
    }
    if (isCreatingQuote) {
      return { success: false, error: "Generando cotización en curso..." };
    }

    setIsCreatingQuote(true);
    try {
      const endpoint = user ? "/api/user/orders" : "/api/orders";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          totalCRC: partsSubtotal,
          partsSubtotalCRC: partsSubtotal,
          laborSubtotalCRC: 0,
          serviceType: items.some((i) => i.homeInstallation) ? "HOME_SERVICE" : "STORE_PICKUP",
          notes: notes || null,
          customerName: user?.displayName || null,
          status: "COTIZACION",
          isQuotation: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setActiveQuotation(data.order);
        try {
          localStorage.setItem("zxz_active_quotation", JSON.stringify(data.order));
        } catch (e) {}

        // User Rule: A user can't create two quotations with the same cart -> clear cart!
        clearCart();

        if (refreshUser) {
          await refreshUser();
        }
        return { success: true, order: data.order };
      }
      return { success: false, error: data.error };
    } catch (e: any) {
      return { success: false, error: e?.message || "Error al solicitar cotización" };
    } finally {
      setIsCreatingQuote(false);
    }
  };

  const generateBacCompraClickWhatsAppMessage = (vehicleName?: string, orderNumber?: string) => {
    let msg = `💳 *SOLICITUD BAC COMPRA-CLICK*\n`;
    if (orderNumber) {
      msg += `*Cotización:* #${orderNumber}\n`;
    }
    if (user?.displayName) {
      msg += `*Cliente:* ${user.displayName}\n`;
    }
    if (vehicleName) {
      msg += `*Vehículo:* ${vehicleName}\n`;
    }
    msg += `\n*Artículos:*\n`;

    items.forEach((item, idx) => {
      const installTag = item.withInstallation ? " (+Instalación)" : "";
      msg += `${idx + 1}. ${item.title} (x${item.quantity})${installTag}\n`;
    });

    msg += `\n*TOTAL A PAGAR:* ₡${formatCRC(totalCRC)} ($${formatUSD(totalUSD)} USD)\n`;
    msg += `_(13% IVA incluido)_\n\n`;
    msg += `Favor enviar el enlace de pago BAC Compra-Click.`;

    return getWhatsAppUrl(msg);
  };

  const [isCreatingBacOrder, setIsCreatingBacOrder] = useState(false);

  const createBacCompraClickOrder = async (vehicleName?: string) => {
    if (items.length === 0) {
      return { success: false, error: "El carrito está vacío. Agrega productos o combos para cotizar." };
    }
    if (isCreatingBacOrder) {
      return { success: false, error: "Generando solicitud BAC Compra Click..." };
    }

    setIsCreatingBacOrder(true);
    try {
      const endpoint = user ? "/api/user/orders" : "/api/orders";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          totalCRC: partsSubtotal,
          partsSubtotalCRC: partsSubtotal,
          laborSubtotalCRC: 0,
          serviceType: items.some((i) => i.homeInstallation) ? "HOME_SERVICE" : "STORE_PICKUP",
          paymentMethod: "BAC_COMPRA_CLICK",
          requestedBacLink: true,
          notes: "Solicitud de Enlace BAC Compra Click por WhatsApp",
          customerName: user?.displayName || null,
          status: "COTIZACION",
          isQuotation: true,
          garageVehicle: vehicleName ? { nickname: vehicleName } : undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setActiveQuotation(data.order);
        try {
          localStorage.setItem("zxz_active_quotation", JSON.stringify(data.order));
        } catch (e) {}

        const waUrl = generateBacCompraClickWhatsAppMessage(vehicleName, data.order.orderNumber);

        clearCart();

        if (refreshUser) {
          await refreshUser();
        }
        return { success: true, order: data.order, waUrl };
      }
      return { success: false, error: data.error };
    } catch (e: any) {
      return { success: false, error: e?.message || "Error al solicitar BAC Compra Click" };
    } finally {
      setIsCreatingBacOrder(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        toggleInstallation,
        updateQuantity,
        clearCart,
        isOpen,
        setIsOpen,
        lastAddedItem,
        lastAddedTimestamp,
        clearLastAddedItem,
        currency,
        setCurrency,
        toggleCurrency,
        exchangeRate,
        isRateLoading,
        sellRate: activeSellRate,
        partsSubtotal,
        laborSubtotal,
        installedItemCount,
        isEligibleForLaborDiscount,
        laborDiscount,
        finalLaborSubtotal,
        totalCRC,
        partsSubtotalUSD,
        laborSubtotalUSD,
        laborDiscountUSD,
        finalLaborSubtotalUSD,
        totalUSD,
        formatPrice,
        generateWhatsAppLink,
        createOrderFromCart,
        activeQuotation,
        setActiveQuotation,
        clearActiveQuotation,
        createQuotationOrder,
        createBacCompraClickOrder,
        generateBacCompraClickWhatsAppMessage,

        // Add-to-cart popup modal & recommendations
        isAddedModalOpen,
        setIsAddedModalOpen,
        addedModalItem,
        openAddedModal,
        closeAddedModal,
        addItemSilently,

        // Combo swap for smart checkout
        swapItemsForCombo,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
