"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { DevConsoleSkeleton } from "@/components/dev/DevConsoleSkeleton";
import { DevConsoleLogin } from "@/components/dev/DevConsoleLogin";
import {
  BackdoorOverviewTab,
  type AnalyticsPayload,
} from "@/components/dev/BackdoorOverviewTab";
import { BackdoorAnalyticsTab } from "@/components/dev/BackdoorAnalyticsTab";
import { OrdersPipelineTab } from "@/components/dev/OrdersPipelineTab";
import { CreateOrderTab } from "@/components/dev/CreateOrderTab";
import { CatalogManagerTab } from "@/components/dev/CatalogManagerTab";
import { AuditHistoryTab } from "@/components/dev/AuditHistoryTab";
import { StaffManagerTab } from "@/components/dev/StaffManagerTab";
import { LogisticsRatesTab } from "@/components/dev/LogisticsRatesTab";
import { GarageVehiclesTab } from "@/components/dev/GarageVehiclesTab";
import { ServicesAgendaTab } from "@/components/dev/ServicesAgendaTab";
import { BankAccountsTab } from "@/components/dev/BankAccountsTab";
import { ExchangeRateTab } from "@/components/dev/ExchangeRateTab";
import { HomePageManagerTab } from "@/components/dev/HomePageManagerTab";
import { WorkshopSettingsTab } from "@/components/dev/WorkshopSettingsTab";
import { UserBanManagerTab } from "@/components/dev/UserBanManagerTab";
import { FinancialDashboardTab } from "@/components/dev/FinancialDashboardTab";
import { ProductsAnalysisTab } from "@/components/dev/ProductsAnalysisTab";
import { useLanguage } from "@/context/LanguageContext";
import {
  LogOut,
  Globe,
  LayoutGrid,
  BarChart3,
  Layers,
  ShoppingBag,
  PlusCircle,
  History,
  Users,
  Truck,
  Car,
  Calendar,
  CreditCard,
  DollarSign,
  LayoutTemplate,
  Building,
  ShieldAlert,
  Landmark,
  TrendingUp,
} from "lucide-react";

interface SysUser {
  id: string;
  email: string;
  role: "MASTER" | "STAFF";
  displayName: string | null;
  permissions: Record<string, boolean>;
  lastLoginAt?: string;
}

export type BackdoorTabId =
  | "overview"
  | "analytics"
  | "financial_dashboard"
  | "orders"
  | "services_agenda"
  | "create_order"
  | "catalog"
  | "products_analysis"
  | "homepage"
  | "vehicles"
  | "logistics"
  | "workshop"
  | "bank_accounts"
  | "exchange_rate"
  | "audit"
  | "staff"
  | "user_bans";

export default function StealthConsolePage() {
  const { t, lang, setLang } = useLanguage();
  const [user, setUser] = useState<SysUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BackdoorTabId>("overview");
  const [currency, setCurrency] = useState<"CRC" | "USD">("CRC");

  // Real-time Analytics State for Overview & Reports screens
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

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

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch("/api/sys/analytics", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAnalytics(data);
        }
      }
    } catch (err) {
      console.error("Failed to load backdoor analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (user && (activeTab === "overview" || activeTab === "analytics")) {
      fetchAnalytics();
    }
  }, [user, activeTab, fetchAnalytics]);

  useEffect(() => {
    if (user) {
      const userHasMaster =
        user.role === "MASTER" ||
        Boolean(user.permissions?.hasMasterPermissions) ||
        Boolean(user.permissions?.isMaster);

      // Requirement 4: If profile doesn't have master permissions, auto start in orders pipeline
      if (!userHasMaster) {
        setActiveTab("orders");
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const userHasMaster =
        user.role === "MASTER" ||
        Boolean(user.permissions?.hasMasterPermissions) ||
        Boolean(user.permissions?.isMaster);

      const masterOnlyTabs: BackdoorTabId[] = [
        "overview",
        "analytics",
        "financial_dashboard",
        "homepage",
        "workshop",
        "bank_accounts",
        "exchange_rate",
        "audit",
        "staff",
        "user_bans",
      ];

      // Auto redirect if profile without master permissions hits any master-only section
      if (!userHasMaster && masterOnlyTabs.includes(activeTab)) {
        setActiveTab("orders");
      }

      // Requirement 3: Staff & permissions section is strictly root master only
      if (user.role !== "MASTER" && activeTab === "staff") {
        setActiveTab(userHasMaster ? "orders" : "orders");
      }
    }
  }, [user, activeTab]);

  const handleLogout = async () => {
    try {
      await fetch("/api/sys/auth/logout", { method: "POST" });
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Rule 7: Animated skeleton during session check
  if (loading) {
    return <DevConsoleSkeleton />;
  }

  // Not logged in: Show minimalist login prompt
  if (!user) {
    return <DevConsoleLogin onSuccess={(authenticatedUser) => setUser(authenticatedUser)} />;
  }

  const isRootMaster = user.role === "MASTER";
  const hasMasterPermissions =
    isRootMaster ||
    Boolean(user.permissions?.hasMasterPermissions) ||
    Boolean(user.permissions?.isMaster);
  const isMaster = hasMasterPermissions;

  const displayFirstName =
    user.displayName?.trim() || user.email.split("@")[0] || (hasMasterPermissions ? "Master" : "Staff");

  // Left Icon-Only Column Navigation Items
  const sidebarIconItems: {
    id: BackdoorTabId;
    icon: React.ComponentType<{ className?: string }>;
    labelEs: string;
    labelEn: string;
    masterOnly?: boolean;
    rootMasterOnly?: boolean;
    badgeCount?: number;
  }[] = [
    {
      id: "overview",
      icon: LayoutGrid,
      labelEs: "Resumen General (Overview)",
      labelEn: "Overview Dashboard",
      masterOnly: true,
    },
    {
      id: "analytics",
      icon: BarChart3,
      labelEs: "Estadísticas y Gráficas",
      labelEn: "Statistics & Graphs",
      masterOnly: true,
    },
    {
      id: "financial_dashboard",
      icon: Landmark,
      labelEs: "Cierre Financiero Mensual",
      labelEn: "Monthly Financial Dashboard",
      masterOnly: true,
    },
    {
      id: "orders",
      icon: Layers,
      labelEs: "Pedidos y Órdenes",
      labelEn: "Orders Pipeline",
      badgeCount: analytics?.kpis.ordersInProgressCount || 0,
    },
    {
      id: "services_agenda",
      icon: Calendar,
      labelEs: t.backdoorAgendaTab || "Agenda de Servicios",
      labelEn: "Services Agenda",
    },
    {
      id: "create_order",
      icon: PlusCircle,
      labelEs: "Crear Pedido Manual",
      labelEn: "Create Manual Order",
    },
    {
      id: "catalog",
      icon: ShoppingBag,
      labelEs: "Catálogo de Productos",
      labelEn: "Product Catalog",
    },
    {
      id: "products_analysis",
      icon: TrendingUp,
      labelEs: "Análisis de Productos",
      labelEn: "Products Analysis",
      masterOnly: false,
    },
    {
      id: "vehicles",
      icon: Car,
      labelEs: t.backdoorVehiclesTab || "Vehículos en Garaje",
      labelEn: "Garage Vehicles",
    },
    {
      id: "logistics",
      icon: Truck,
      labelEs: "Tarifas por Km y Pick-Up",
      labelEn: "Logistics & Pick-Up Rates",
    },
    {
      id: "homepage",
      icon: LayoutTemplate,
      labelEs: t.backdoorHomePageTab || "Portada Web",
      labelEn: "Home Page Manager",
      masterOnly: true,
    },
    {
      id: "workshop",
      icon: Building,
      labelEs: t.backdoorWorkshopTab || "Taller y Teléfono Global",
      labelEn: "Workshop & Global Phone",
      masterOnly: true,
    },
    {
      id: "bank_accounts",
      icon: CreditCard,
      labelEs: t.backdoorBankAccountsTab || "Cuentas Bancarias",
      labelEn: "Bank Accounts",
      masterOnly: true,
    },
    {
      id: "exchange_rate",
      icon: DollarSign,
      labelEs: t.backdoorExchangeRateTab || "Tipo de Cambio",
      labelEn: "Exchange Rate",
      masterOnly: true,
    },
    {
      id: "audit",
      icon: History,
      labelEs: "Historial de Cambios (6M)",
      labelEn: "Audit History (6M)",
      masterOnly: true,
    },
    {
      id: "staff",
      icon: Users,
      labelEs: "Personal y Permisos",
      labelEn: "Staff & Permissions",
      masterOnly: true,
      rootMasterOnly: true, // Strictly Root Master only
    },
    {
      id: "user_bans",
      icon: ShieldAlert,
      labelEs: t.backdoorUserBansTab || "Bloqueo de Usuarios",
      labelEn: "User Bans",
      masterOnly: true,
    },
  ];

  const visibleSidebarIcons = sidebarIconItems.filter((item) => {
    if (item.rootMasterOnly) return isRootMaster;
    if (item.masterOnly) return hasMasterPermissions;
    return true;
  });

  // Top Pill Bar Primary Categories (matching the 6 pills in the Vertix screenshot)
  const topNavPills: {
    id: BackdoorTabId;
    matchIds: BackdoorTabId[];
    labelEs: string;
    labelEn: string;
  }[] = [
    ...(hasMasterPermissions
      ? [
          {
            id: "overview" as BackdoorTabId,
            matchIds: ["overview" as BackdoorTabId],
            labelEs: "Overview",
            labelEn: "Overview",
          },
        ]
      : []),
    {
      id: "orders",
      matchIds: ["orders", "create_order"],
      labelEs: "Pedidos",
      labelEn: "Activity",
    },
    {
      id: "catalog",
      matchIds: ["catalog", "vehicles", "logistics"],
      labelEs: "Gestión",
      labelEn: "Manage",
    },
    {
      id: "products_analysis" as BackdoorTabId,
      matchIds: ["products_analysis" as BackdoorTabId],
      labelEs: "Análisis",
      labelEn: "Analysis",
    },
    {
      id: "services_agenda",
      matchIds: ["services_agenda"],
      labelEs: "Agenda",
      labelEn: "Program",
    },
    ...(hasMasterPermissions
      ? [
          {
            id: (isRootMaster ? "workshop" : "workshop") as BackdoorTabId,
            matchIds: [
              "workshop" as BackdoorTabId,
              "financial_dashboard" as BackdoorTabId,
              "homepage" as BackdoorTabId,
              "bank_accounts" as BackdoorTabId,
              "exchange_rate" as BackdoorTabId,
              "audit" as BackdoorTabId,
              "staff" as BackdoorTabId,
              "user_bans" as BackdoorTabId,
            ],
            labelEs: "Sistema",
            labelEn: "System",
          },
          {
            id: "analytics" as BackdoorTabId,
            matchIds: ["analytics" as BackdoorTabId],
            labelEs: "Gráficas",
            labelEn: "Reports",
          },
        ]
      : [
          {
            id: "vehicles" as BackdoorTabId,
            matchIds: ["vehicles" as BackdoorTabId],
            labelEs: "Garaje",
            labelEn: "Garage",
          },
        ]),
  ];

  const activeItemMeta =
    visibleSidebarIcons.find((i) => i.id === activeTab) || visibleSidebarIcons[0];

  return (
    <div className="min-h-screen bg-[#F2F2F4] text-[#141414] p-3.5 sm:p-6 lg:p-7 flex flex-col gap-5 selection:bg-[#F05526] selection:text-white">
      {/* =====================================================================
          TOP HEADER BAR (Vertix Style: Nav Pills Left/Center, Actions + User Pill Right, Padded for Stationary Left Column)
         ===================================================================== */}
      <header className="flex items-center justify-between gap-3 pl-[70px] sm:pl-[80px] min-h-[44px]">
        {/* Center: Horizontal Floating Pill Navigation */}
        <nav className="hidden xl:flex items-center bg-white p-1.5 rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04]">
          {topNavPills.map((pill) => {
            const isCurrent = pill.matchIds.includes(activeTab);
            return (
              <button
                key={pill.id + pill.labelEn}
                type="button"
                onClick={() => setActiveTab(pill.id)}
                className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-[#141414] text-white shadow-sm"
                    : "text-[#71717A] hover:text-[#141414]"
                }`}
              >
                {lang === "es" ? pill.labelEs : pill.labelEn}
              </button>
            );
          })}
        </nav>

        {/* Right: Quick Action Circles + User Profile Pill */}
        <div className="flex items-center gap-2.5 ml-auto">
          {/* Currency Toggle Circle (₡ / $) */}
          <button
            type="button"
            onClick={() => setCurrency((c) => (c === "CRC" ? "USD" : "CRC"))}
            title={lang === "es" ? "Cambiar moneda (CRC / USD)" : "Toggle currency (CRC / USD)"}
            className="w-11 h-11 rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] flex items-center justify-center text-xs font-bold text-[#141414] hover:bg-[#141414] hover:text-white transition cursor-pointer"
          >
            {currency === "CRC" ? "₡" : "$"}
          </button>

          {/* Language Toggle Circle */}
          <button
            type="button"
            onClick={() => setLang(lang === "es" ? "en" : "es")}
            title={lang === "es" ? "Switch to English" : "Cambiar a Español"}
            className="w-11 h-11 rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] flex items-center justify-center gap-0.5 text-[11px] font-bold uppercase text-[#141414] hover:bg-[#141414] hover:text-white transition cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang}</span>
          </button>

          {/* User Profile Pill */}
          <div className="bg-white pl-1.5 pr-4 py-1.5 rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold uppercase shrink-0"
              style={{
                background: isMaster
                  ? "linear-gradient(145deg, #FF7340 0%, #EE4D20 60%, #D93412 100%)"
                  : "#141414",
              }}
            >
              {displayFirstName.slice(0, 2)}
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#141414]">{displayFirstName}</span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                    isMaster
                      ? "bg-[#FFF0EB] text-[#F05526]"
                      : "bg-[#F6F6F8] text-[#52525B]"
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <span className="text-[10px] text-[#71717A] block truncate max-w-[140px]">
                {user.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================================
          MAIN BODY: STRICTLY ICON-ONLY LEFT COLUMN + MAIN WORKSPACE
         ===================================================================== */}
      <div className="flex gap-4 sm:gap-6 flex-1 items-start">
        {/* LEFT COLUMN: STATIONARY FIXED LOGO + ICONS RAIL */}
        <aside className="fixed left-3.5 sm:left-6 lg:left-7 top-3.5 sm:top-6 lg:top-7 z-30 flex flex-col items-center gap-3 shrink-0 max-h-[calc(100vh-1.75rem)] sm:max-h-[calc(100vh-3rem)] lg:max-h-[calc(100vh-3.5rem)]">
          {/* Stationary Brand Logo (Fixed at the top of the icons column) */}
          <div className="h-11 flex items-center justify-center shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab(hasMasterPermissions ? "overview" : "orders")}
              className="flex items-center justify-center cursor-pointer hover:opacity-85 transition"
              title="ZxZ Mods Control"
            >
              <Image
                src="/images/logo.png"
                alt="ZxZ Mods"
                width={90}
                height={26}
                className="h-7 w-auto object-contain"
                priority
              />
            </button>
          </div>

          {/* Scrollable Icon Rail & Logout if screen height is constrained */}
          <div className="flex-1 min-h-0 flex flex-col items-center gap-3 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-1">
            {/* Floating White Vertical Icon Pill Rail */}
            <div className="bg-white rounded-[32px] p-2 flex flex-col items-center gap-1.5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] border border-black/[0.04]">
              {visibleSidebarIcons.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const tooltipLabel = lang === "es" ? item.labelEs : item.labelEn;

                const isMasterItem = Boolean(item.masterOnly);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    aria-label={tooltipLabel}
                    title={tooltipLabel}
                    className={`group relative w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? isMasterItem
                          ? "bg-gradient-to-br from-[#FF6B35] to-[#E03A10] text-white shadow-md scale-[1.05] ring-2 ring-[#F05526]/30"
                          : "bg-[#141414] text-white shadow-sm scale-[1.03]"
                        : isMasterItem
                        ? "bg-[#FFF0EB] text-[#F05526] hover:bg-[#FFE2D6] hover:text-[#D93412] border border-[#F05526]/25 shadow-2xs"
                        : "text-[#71717A] hover:text-[#141414] hover:bg-[#F6F6F8]"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />

                    {/* Optional small notification dot for active orders */}
                    {item.badgeCount && item.badgeCount > 0 && !isActive ? (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F05526] ring-2 ring-white" />
                    ) : null}

                    {/* Hover Tooltip (Strictly clean description without the word master) */}
                    <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-14 top-1/2 -translate-y-1/2 bg-[#141414] text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-lg z-50">
                      {tooltipLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Circular Logout Icon Button (Matches Vertix bottom-left icon) */}
            <button
              type="button"
              onClick={handleLogout}
              aria-label={lang === "es" ? "Cerrar Sesión" : "Sign Out"}
              className="group relative w-12 h-12 rounded-full bg-white text-[#71717A] hover:text-[#D93412] hover:bg-[#FFF0EB] shadow-[0_2px_16px_rgba(0,0,0,0.04)] border border-black/[0.04] flex items-center justify-center transition cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-14 top-1/2 -translate-y-1/2 bg-[#141414] text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-lg z-50">
                {lang === "es" ? "Cerrar Sesión" : "Log Out"}
              </span>
            </button>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT WORKSPACE (Pladded to account for stationary fixed sidebar) */}
        <div className="flex-1 min-w-0 pl-[70px] sm:pl-[80px] space-y-5">
          {/* Active Screen Content */}
          <main className="min-w-0">
            {activeTab === "overview" && (
              <BackdoorOverviewTab
                analytics={analytics}
                loading={analyticsLoading}
                currency={currency}
                onToggleCurrency={() => setCurrency((c) => (c === "CRC" ? "USD" : "CRC"))}
                onNavigateTab={(tab) => setActiveTab(tab as BackdoorTabId)}
              />
            )}

            {activeTab === "analytics" && (
              <BackdoorAnalyticsTab
                analytics={analytics}
                loading={analyticsLoading}
                currency={currency}
                onToggleCurrency={() => setCurrency((c) => (c === "CRC" ? "USD" : "CRC"))}
                onRefresh={fetchAnalytics}
              />
            )}

            {activeTab === "financial_dashboard" && isMaster && (
              <FinancialDashboardTab
                currency={currency}
                onToggleCurrency={() => setCurrency((c) => (c === "CRC" ? "USD" : "CRC"))}
                currentUser={user}
              />
            )}

            {activeTab === "orders" && (
              <OrdersPipelineTab
                onOrderDeleted={() => fetchAnalytics()}
                onOrderUpdated={() => fetchAnalytics()}
              />
            )}
            {activeTab === "services_agenda" && (
              <ServicesAgendaTab userRole={user.role} />
            )}
            {activeTab === "create_order" && (
              <CreateOrderTab
                userRole={user.role}
                onOrderCreated={() => {
                  fetchAnalytics();
                  setActiveTab("orders");
                }}
              />
            )}
            {activeTab === "catalog" && <CatalogManagerTab userRole={user.role} />}
            {activeTab === "products_analysis" && (
              <ProductsAnalysisTab
                currency={currency}
                onToggleCurrency={() => setCurrency((c) => (c === "CRC" ? "USD" : "CRC"))}
              />
            )}
            {activeTab === "vehicles" && <GarageVehiclesTab userRole={user.role} />}
            {activeTab === "logistics" && <LogisticsRatesTab userRole={user.role} />}
            {activeTab === "homepage" && isMaster && (
              <HomePageManagerTab userRole={user.role} />
            )}
            {activeTab === "workshop" && isMaster && <WorkshopSettingsTab />}
            {activeTab === "bank_accounts" && isMaster && (
              <BankAccountsTab userRole={user.role} />
            )}
            {activeTab === "exchange_rate" && isMaster && (
              <ExchangeRateTab userRole={user.role} />
            )}
            {activeTab === "audit" && isMaster && <AuditHistoryTab />}
            {activeTab === "staff" && isMaster && <StaffManagerTab />}
            {activeTab === "user_bans" && isMaster && (
              <UserBanManagerTab userRole={user.role} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
