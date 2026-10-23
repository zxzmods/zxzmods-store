"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useGarage } from "@/context/GarageContext";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  Car,
  ShoppingCart,
  Globe,
  Menu,
  X,
  Search,
  CheckCircle2,
  Truck,
  Wrench,
  User as UserIcon,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === "/";
  const { vehicle, openModal } = useGarage();
  const { items, setIsOpen: setCartOpen } = useCart();
  const { lang, setLang, t } = useLanguage();
  const { user, openAuthModal, openProfileDrawer } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close drawers on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [pathname]);

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  // If on home page and not scrolled down, navbar starts transparent over video
  const isTransparent = isHomePage && !isScrolled;
  // When mobile drawer or search is open, force solid frosted white so header and drawer blend seamlessly
  const isSolid = !isTransparent || mobileMenuOpen || mobileSearchOpen;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/productos?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ease-in-out ${
          !isSolid
            ? "bg-transparent border-b border-transparent text-white"
            : "bg-white/95 backdrop-blur-md border-b border-gray-200/90 text-[#1A1A1D] shadow-sm"
        }`}
      >
        <div className="w-full px-3 sm:px-6 md:px-8 lg:px-12 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Brand Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
            <div className="relative w-28 sm:w-36 md:w-40 h-8 sm:h-10 md:h-12 transition-transform group-hover:scale-105">
              <Image
                src="/images/logo.png"
                alt="ZxZ Mods"
                fill
                priority
                className={`object-contain transition-all duration-300 ${
                  !isSolid ? "drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]" : ""
                }`}
              />
            </div>
          </Link>

          {/* Center: Clean Minimalist Navigation Links (Desktop) */}
          <nav
            className={`hidden xl:flex items-center gap-6 text-xs sm:text-sm font-medium transition-colors ${
              !isSolid ? "text-white/90" : "text-gray-700"
            }`}
          >
            <Link
              href="/marcas"
              className={`transition-colors ${
                !isSolid ? "hover:text-white" : "hover:text-black"
              }`}
            >
              {t.navBrands}
            </Link>
            <Link
              href="/combos"
              className={`transition-colors ${
                !isSolid ? "hover:text-white" : "hover:text-black"
              }`}
            >
              {t.navCombos}
            </Link>
            <Link
              href="/ubicacion"
              className={`transition-colors ${
                !isSolid ? "hover:text-white" : "hover:text-black"
              }`}
            >
              {t.navWorkshop}
            </Link>
            <Link
              href="/barrialcr"
              className={`transition-colors ${
                !isSolid ? "hover:text-white" : "hover:text-black"
              }`}
            >
              {t.navBarrialCr || "BarrialCR"}
            </Link>

            {/* At-Home Installation Service Button */}
            <Link
              href="/instalacion-domicilio"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                !isSolid
                  ? "bg-white/15 hover:bg-white/25 border-white/30 text-white backdrop-blur-sm"
                  : "bg-gray-100 hover:bg-gray-200/80 border-gray-200 text-gray-800 hover:border-gray-300"
              }`}
              title={lang === "es" ? "Instalación profesional a domicilio" : "At-home professional installation"}
            >
              <Wrench className="w-3.5 h-3.5 text-[#C02030]" />
              <span>{t.navHomeInstallation}</span>
            </Link>

            {/* Delivery Quotation Service Button */}
            <Link
              href="/cotizar-envio"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                !isSolid
                  ? "bg-white/15 hover:bg-white/25 border-white/30 text-white backdrop-blur-sm"
                  : "bg-gray-100 hover:bg-gray-200/80 border-gray-200 text-gray-800 hover:border-gray-300"
              }`}
              title={lang === "es" ? "Cotizar servicio de entrega y envío" : "Get quotation for delivery"}
            >
              <Truck className="w-3.5 h-3.5 text-[#C02030]" />
              <span>{t.navDeliveryQuote}</span>
            </Link>

            {/* UTV Pick-Up Service Button */}
            <Link
              href="/recogida-utv"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                !isSolid
                  ? "bg-[#C02030]/30 hover:bg-[#C02030]/45 border-[#C02030]/60 text-white backdrop-blur-sm"
                  : "bg-red-50 hover:bg-red-100/80 border-red-200 text-[#C02030] hover:border-red-300"
              }`}
              title={lang === "es" ? "Servicio de recogida de UTV, instalación y entrega" : "UTV pick-up, installation, and return service"}
            >
              <Car className="w-3.5 h-3.5 text-[#C02030]" />
              <span>{t.navUtvPickup}</span>
            </Link>
          </nav>

          {/* Right: Search Bar & User Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Desktop Search Form */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden sm:flex items-center relative"
            >
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all duration-300 ${
                  !isSolid
                    ? "bg-white/20 border-white/40 text-white backdrop-blur-md focus-within:bg-black/70 focus-within:border-white shadow-sm"
                    : "bg-gray-100/95 border-gray-300 text-gray-900 focus-within:bg-white focus-within:border-[#C02030] focus-within:ring-2 focus-within:ring-[#C02030]/20 shadow-inner"
                }`}
              >
                <Search
                  className={`w-4 h-4 flex-shrink-0 ${
                    !isSolid ? "text-white/80" : "text-gray-500"
                  }`}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === "es" ? "Buscar piezas, combos..." : "Search parts, kits..."}
                  className={`w-28 md:w-44 lg:w-56 bg-transparent text-xs outline-none transition-all ${
                    !isSolid
                      ? "placeholder-white/70 text-white"
                      : "placeholder-gray-500 text-gray-900"
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-gray-400 hover:text-gray-600 p-0.5"
                    aria-label={t.ariaClearSearch}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </form>

            {/* Mobile Search Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen(!mobileSearchOpen);
                if (!mobileSearchOpen) setMobileMenuOpen(false);
              }}
              className={`sm:hidden p-2 rounded-full border transition-colors ${
                !isSolid
                  ? "bg-black/30 border-white/30 text-white hover:bg-black/50 backdrop-blur-md"
                  : "bg-gray-100 border-gray-200 text-gray-700 hover:text-black hover:border-gray-300"
              }`}
              aria-label={t.docsSearchPlaceholder}
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Active Garage Vehicle Badge (Visible on md+ screens; inside drawer on phones) */}
            <Link
              href="/garaje"
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                vehicle
                  ? !isSolid
                    ? "bg-emerald-500/20 border-emerald-400 text-emerald-200 backdrop-blur-md"
                    : "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                  : !isSolid
                  ? "bg-black/30 border-white/30 text-white hover:bg-black/50 backdrop-blur-md"
                  : "bg-gray-100 border-gray-200 text-gray-700 hover:text-black hover:border-gray-300"
              }`}
            >
              {vehicle ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.navGarage}</span>
                </>
              ) : (
                <>
                  <Car className="w-3.5 h-3.5 text-[#C02030]" />
                  <span>{t.navNoVehicle}</span>
                </>
              )}
            </Link>

            {/* Language Toggle (Visible on sm+ screens; inside drawer on phones) */}
            <button
              type="button"
              onClick={() => setLang(lang === "es" ? "en" : "es")}
              className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                !isSolid
                  ? "bg-black/30 border-white/30 text-white hover:bg-black/50 backdrop-blur-md"
                  : "bg-gray-100 border-gray-200 text-gray-700 hover:text-black hover:border-gray-300"
              }`}
              title="Cambiar Idioma / Switch Language"
            >
              <Globe className={`w-3.5 h-3.5 ${!isSolid ? "text-white/80" : "text-gray-500"}`} />
              <span className="uppercase text-[11px]">{lang}</span>
            </button>

            {/* Profile Button */}
            <button
              type="button"
              onClick={() => {
                if (user) {
                  openProfileDrawer();
                } else {
                  openAuthModal();
                }
              }}
              className={`relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border transition-all ${
                !isSolid
                  ? "bg-black/30 border-white/30 text-white hover:bg-black/50 backdrop-blur-md"
                  : "bg-gray-100 border-gray-200 text-gray-800 hover:text-black hover:border-gray-300 hover:bg-gray-200"
              }`}
              aria-label={t.navProfile}
              title={user ? `${t.profileLoggedInAs}: ${user.displayName || user.email}` : t.navProfile}
            >
              {user ? (
                user.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoUrl}
                    alt={user.displayName || "Avatar"}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#C02030] text-white flex items-center justify-center font-bold text-xs">
                    {(user.displayName?.[0] || user.email?.[0] || "U").toUpperCase()}
                  </div>
                )
              ) : (
                <UserIcon className="w-4 h-4" />
              )}
              {user && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
              )}
            </button>

            {/* Shopping Cart Redirect Button */}
            <Link
              href="/carrito"
              className={`relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border transition-all ${
                !isSolid
                  ? "bg-black/30 border-white/30 text-white hover:bg-black/50 backdrop-blur-md"
                  : "bg-gray-100 border-gray-200 text-gray-800 hover:text-black hover:border-gray-300 hover:bg-gray-200"
              }`}
              aria-label={t.navCart}
              title="Carrito de Compras"
            >
              <ShoppingCart className="w-4 h-4" />
              {totalQuantity > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C02030] text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                  {totalQuantity}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                if (!mobileMenuOpen) setMobileSearchOpen(false);
              }}
              className={`xl:hidden p-2 rounded-full border transition-colors ${
                !isSolid
                  ? "bg-black/30 border-white/30 text-white hover:bg-black/50"
                  : "bg-gray-100 border-gray-200 text-gray-800 hover:bg-gray-200"
              }`}
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Input Dropdown */}
        {mobileSearchOpen && (
          <div className="sm:hidden bg-white/98 backdrop-blur-md border-b border-gray-200 px-4 py-3 shadow-md">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3.5 py-2 rounded-full bg-gray-100 border border-gray-300">
                <Search className="w-4 h-4 text-gray-500 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === "es" ? "Buscar piezas, combos..." : "Search parts..."}
                  className="w-full bg-transparent text-xs text-gray-900 outline-none"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-gray-400 hover:text-gray-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-full bg-[#C02030] text-white text-xs font-bold shrink-0"
              >
                Buscar
              </button>
            </form>
          </div>
        )}

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-white/98 backdrop-blur-md border-b border-gray-200 px-5 sm:px-6 py-5 space-y-4 shadow-2xl text-[#1A1A1D] max-h-[calc(100vh-4.25rem)] overflow-y-auto">
            {/* Active Garage Vehicle Quick Card */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/90">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      vehicle ? "bg-emerald-500/10 text-emerald-600" : "bg-[#C02030]/10 text-[#C02030]"
                    }`}
                  >
                    <Car className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      {t.navGarage}
                    </p>
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {vehicle
                        ? `${vehicle.year} ${vehicle.brandName} ${vehicle.modelName}`
                        : t.navNoVehicle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openModal();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-800 shadow-2xs shrink-0 transition"
                >
                  {vehicle ? t.navChangeVehicle : (lang === "es" ? "Seleccionar" : "Select")}
                </button>
              </div>
            </div>

            {/* Profile Action Row */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (user) {
                  openProfileDrawer();
                } else {
                  openAuthModal();
                }
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200/90 text-left hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#111827] text-white flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                  {user?.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : user ? (
                    (user.displayName?.[0] || user.email?.[0] || "U").toUpperCase()
                  ) : (
                    <UserIcon className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {user ? user.displayName || user.email : t.navProfile}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {user ? t.profileOrdersTab : t.authModalTitle}
                  </p>
                </div>
              </div>
              {user ? (
                <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold">
                  {t.badgeActiveStatus}
                </span>
              ) : (
                <span className="text-xs font-bold text-[#C02030]">
                  {lang === "es" ? "Ingresar →" : "Sign In →"}
                </span>
              )}
            </button>

            {/* Primary Navigation Links */}
            <nav className="flex flex-col gap-1 text-sm font-semibold text-gray-800 pt-1">
              <Link
                href="/marcas"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-gray-100 transition"
              >
                {t.navBrands}
              </Link>
              <Link
                href="/combos"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-gray-100 transition"
              >
                {t.navCombos}
              </Link>
              <Link
                href="/ubicacion"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-gray-100 transition"
              >
                {t.navWorkshop}
              </Link>
              <Link
                href="/barrialcr"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-gray-100 transition"
              >
                {t.navBarrialCr || "BarrialCR"}
              </Link>
            </nav>

            {/* Mobile Service Buttons */}
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider px-1">
                {lang === "es" ? "Servicios Especializados" : "Specialized Services"}
              </p>
              <Link
                href="/instalacion-domicilio"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200/90 text-xs font-semibold text-gray-800 hover:bg-gray-100 transition"
              >
                <Wrench className="w-4 h-4 text-[#C02030]" />
                <span>{t.navHomeInstallation}</span>
              </Link>
              <Link
                href="/cotizar-envio"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200/90 text-xs font-semibold text-gray-800 hover:bg-gray-100 transition"
              >
                <Truck className="w-4 h-4 text-[#C02030]" />
                <span>{t.navDeliveryQuote}</span>
              </Link>
              <Link
                href="/recogida-utv"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-red-50/70 border border-red-200/90 text-xs font-semibold text-[#C02030] hover:bg-red-100/70 transition"
              >
                <Car className="w-4 h-4 text-[#C02030]" />
                <span>{t.navUtvPickup}</span>
              </Link>
            </div>

            {/* Bilingual Language Switcher in Mobile Drawer */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between px-1">
              <span className="text-xs text-gray-600 font-medium flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-gray-400" />
                <span>{lang === "es" ? "Idioma" : "Language"}</span>
              </span>
              <div className="flex items-center p-0.5 rounded-xl bg-gray-100 border border-gray-200 text-xs">
                <button
                  type="button"
                  onClick={() => setLang("es")}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    lang === "es"
                      ? "bg-white text-[#C02030] shadow-xs"
                      : "text-gray-600 hover:text-black"
                  }`}
                >
                  Español (ES)
                </button>
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    lang === "en"
                      ? "bg-white text-[#C02030] shadow-xs"
                      : "text-gray-600 hover:text-black"
                  }`}
                >
                  English (EN)
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Backdrop Overlay (Tap outside to close drawer) */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="xl:hidden fixed inset-0 top-16 sm:top-20 bg-black/40 backdrop-blur-xs z-40 transition-opacity animate-fade-in"
          aria-hidden="true"
        />
      )}
    </>
  );
}
