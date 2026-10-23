import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { GarageProvider } from "@/context/GarageContext";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { ExtensionErrorGuard } from "@/components/common/ExtensionErrorGuard";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AuthModal } from "@/components/auth/AuthModal";
import { ProfileDrawer } from "@/components/profile/ProfileDrawer";
import { TermsModal } from "@/components/terms/TermsModal";
import { GlobalDocumentModal } from "@/components/documents/GlobalDocumentModal";
import { OrderNotificationAlerts } from "@/components/orders/OrderNotificationAlerts";
import { AddToCartModal } from "@/components/cart/AddToCartModal";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "ZxZ Mods | UTV & ATV Performance, Modificaciones e Importación en Costa Rica",
  description:
    "Especialistas en importación, potenciación e instalación de piezas para Can-Am, Polaris, Yamaha, Honda, Segway y CFMOTO en Costa Rica. Garantía en mano de obra.",
  icons: {
    icon: "/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="light">
      <head>
        {/* Early interceptor for browser extension errors (e.g. Urban VPN M_ID) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                function isExtension(msg, src, err) {
                  var str = (msg || '') + ' ' + (src || '') + ' ' + ((err && err.stack) || '');
                  return str.indexOf('chrome-extension://') !== -1 ||
                         str.indexOf('moz-extension://') !== -1 ||
                         str.indexOf('safari-extension://') !== -1 ||
                         str.indexOf('eppiocemhmnlbhjplcgkofciiegomcon') !== -1 ||
                         str.indexOf('M_ID') !== -1;
                }
                window.addEventListener('error', function(e) {
                  if (isExtension(e.message, e.filename, e.error)) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    return true;
                  }
                }, true);
                window.addEventListener('unhandledrejection', function(e) {
                  var stack = (e.reason && e.reason.stack) || String(e.reason || '');
                  if (isExtension('', '', { stack: stack })) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                  }
                }, true);
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#FFFFFF] text-[#1A1A1D] antialiased selection:bg-[#C02030] selection:text-white">
        <ExtensionErrorGuard />
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <GarageProvider>
                <CartProvider>
                  {children}
                  <CartDrawer />
                  <AddToCartModal />
                  <AuthModal />
                  <ProfileDrawer />
                  <TermsModal />
                  <GlobalDocumentModal />
                  <OrderNotificationAlerts />
                </CartProvider>
              </GarageProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
