"use client";

import { useEffect } from "react";

/**
 * ExtensionErrorGuard
 * Intercepts and silences runtime errors originating from third-party browser
 * extensions (e.g. Urban VPN "eppiocemhmnlbhjplcgkofciiegomcon" reading M_ID)
 * so they do not trigger the Next.js dev error overlay or disrupt the user.
 */
export function ExtensionErrorGuard() {
  useEffect(() => {
    const isExtensionError = (msg?: string, src?: string, err?: Error | null) => {
      const fullText = `${msg || ""} ${src || ""} ${err?.stack || ""}`;
      return (
        fullText.includes("chrome-extension://") ||
        fullText.includes("moz-extension://") ||
        fullText.includes("safari-extension://") ||
        fullText.includes("eppiocemhmnlbhjplcgkofciiegomcon") ||
        fullText.includes("M_ID")
      );
    };

    const errorHandler = (event: ErrorEvent) => {
      if (isExtensionError(event.message, event.filename, event.error)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return true;
      }
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const stack = event.reason?.stack || String(event.reason || "");
      if (isExtensionError("", "", { name: "", message: "", stack })) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener("error", errorHandler, true);
    window.addEventListener("unhandledrejection", rejectionHandler, true);

    return () => {
      window.removeEventListener("error", errorHandler, true);
      window.removeEventListener("unhandledrejection", rejectionHandler, true);
    };
  }, []);

  return null;
}
