"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  phoneNumber: string | null;
  role: string;
  createdAt?: string;
}

export interface UserOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalCRC: number;
  partsSubtotalCRC: number;
  laborSubtotalCRC: number;
  itemsJson: string;
  serviceType: string;
  shippingAddress: string | null;
  notes?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  isServiceScheduled?: boolean;
  isInstallationPaymentConfirmed?: boolean;
  serviceDocumentsJson?: string | null;
  paymentProofUrl?: string | null;
  installationPaymentProofUrl?: string | null;
  installationCostCRC?: number;
  discountCRC?: number;
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  orders: UserOrder[];
  loading: boolean;
  isAuthModalOpen: boolean;
  isProfileDrawerOpen: boolean;
  isTermsModalOpen: boolean;
  isDocumentModalOpen: boolean;
  activeDocumentSlug: string | null;
  authPromptReason: string | null;
  openAuthModal: (reason?: string, onComplete?: () => void) => void;
  closeAuthModal: () => void;
  openProfileDrawer: () => void;
  closeProfileDrawer: () => void;
  openTermsModal: () => void;
  closeTermsModal: () => void;
  openDocumentModal: (slug?: string) => void;
  closeDocumentModal: () => void;
  requireAuth: (action: () => void, promptReason?: string) => boolean;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  sendEmailCode: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmailCode: (email: string, code: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState<boolean>(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState<boolean>(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState<boolean>(false);
  const [activeDocumentSlug, setActiveDocumentSlug] = useState<string | null>("terminos-condiciones");
  const [authPromptReason, setAuthPromptReason] = useState<string | null>(null);
  const [postAuthCallback, setPostAuthCallback] = useState<(() => void) | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setOrders(data.orders || []);
      } else {
        setUser(null);
        setOrders([]);
      }
    } catch (err) {
      console.error("Error refreshing user session:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const openAuthModal = (reason?: string, onComplete?: () => void) => {
    setAuthPromptReason(reason || null);
    if (onComplete) {
      setPostAuthCallback(() => onComplete);
    } else {
      setPostAuthCallback(null);
    }
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthPromptReason(null);
    setPostAuthCallback(null);
  };

  const openProfileDrawer = () => setIsProfileDrawerOpen(true);
  const closeProfileDrawer = () => setIsProfileDrawerOpen(false);

  const openTermsModal = () => {
    setActiveDocumentSlug("terminos-condiciones");
    setIsDocumentModalOpen(true);
    setIsTermsModalOpen(true);
  };
  const closeTermsModal = () => {
    setIsTermsModalOpen(false);
    setIsDocumentModalOpen(false);
  };

  const openDocumentModal = (slug: string = "terminos-condiciones") => {
    setActiveDocumentSlug(slug);
    setIsDocumentModalOpen(true);
  };

  const closeDocumentModal = () => {
    setIsDocumentModalOpen(false);
  };

  const handleAuthSuccess = (userData: UserProfile) => {
    setUser(userData);
    setIsAuthModalOpen(false);
    if (postAuthCallback) {
      const cb = postAuthCallback;
      setPostAuthCallback(null);
      setAuthPromptReason(null);
      try {
        cb();
      } catch (cbErr) {
        console.error("Error executing post-auth callback:", cbErr);
      }
    } else {
      setAuthPromptReason(null);
    }
  };

  const requireAuth = (action: () => void, promptReason?: string): boolean => {
    if (user) {
      action();
      return true;
    }
    openAuthModal(promptReason, action);
    return false;
  };

  // Google Sign-In with Firebase Auth
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!isFirebaseConfigured || !auth || !googleProvider) {
        return {
          success: false,
          error:
            "El acceso con Google requiere credenciales de Firebase en producción. Por favor utiliza el acceso con Código por Correo (100% operativo).",
        };
      }

      // Configure provider to always prompt account chooser
      googleProvider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      // Sync with backend Prisma database with verified ID Token (preserving default profile image)
      const syncRes = await fetch("/api/auth/social-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "google",
          idToken,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoUrl: null, // User preference: profile image stays the default branded avatar
          phoneNumber: firebaseUser.phoneNumber,
        }),
      });

      let syncData: any = {};
      try {
        syncData = await syncRes.json();
      } catch (jsonErr) {
        console.error("[SOCIAL_SYNC_JSON_PARSE_ERROR]:", jsonErr, "HTTP Status:", syncRes.status);
      }

      if (syncData.success) {
        handleAuthSuccess(syncData.user);
        await refreshUser();
        return { success: true };
      } else {
        console.error("[SOCIAL_SYNC_ERROR]:", syncData, "HTTP Status:", syncRes.status);
        const serverError =
          syncData.error ||
          syncData.message ||
          (syncRes.status >= 500
            ? `Error interno del servidor al procesar la sesión (${syncRes.status}).`
            : undefined);
        return {
          success: false,
          error: serverError || "Error de sincronización con Google en el servidor.",
        };
      }
    } catch (error: any) {
      console.error("[GOOGLE_AUTH_ERROR_DETAILS]:", {
        code: error?.code,
        message: error?.message,
        customData: error?.customData,
      });

      const errCode = String(error?.code || "").toLowerCase();
      const errMsg = String(error?.message || "").toLowerCase();

      if (
        errCode.includes("popup-closed-by-user") ||
        errMsg.includes("popup-closed-by-user") ||
        errMsg.includes("closed by user")
      ) {
        return { success: false, error: "Inicio de sesión con Google cancelado por el usuario." };
      }

      if (errCode.includes("popup-blocked") || errMsg.includes("popup-blocked")) {
        return {
          success: false,
          error: "El navegador bloqueó la ventana emergente de Google. Por favor permite las ventanas emergentes en tu navegador para continuar.",
        };
      }

      if (errCode.includes("cancelled-popup-request") || errMsg.includes("cancelled-popup-request")) {
        return {
          success: false,
          error: "Se canceló la ventana de autenticación anterior. Por favor intenta de nuevo con un solo clic.",
        };
      }

      if (errCode.includes("operation-not-allowed") || errMsg.includes("operation-not-allowed")) {
        return {
          success: false,
          error: "El proveedor Google no está habilitado en Firebase Console. Por favor ve a Firebase Console > Authentication > Sign-in method y activa Google.",
        };
      }

      if (errCode.includes("unauthorized-domain") || errMsg.includes("unauthorized-domain")) {
        const currentHost = typeof window !== "undefined" ? window.location.hostname : "este dominio";
        return {
          success: false,
          error: `El dominio actual (${currentHost}) no está autorizado en Firebase Console (Authentication > Settings > Authorized domains).`,
        };
      }

      if (errCode.includes("network-request-failed") || errMsg.includes("network-request-failed")) {
        return {
          success: false,
          error: "Error de red al conectar con Google. Por favor verifica tu conexión a internet e intenta de nuevo.",
        };
      }

      if (
        errCode.includes("account-exists-with-different-credential") ||
        errMsg.includes("account-exists-with-different-credential")
      ) {
        return {
          success: false,
          error: "Ya existe una cuenta registrada con este correo mediante otro método. Por favor ingresa mediante Código por Correo.",
        };
      }

      if (
        !isFirebaseConfigured ||
        errCode.includes("api-key") ||
        errMsg.includes("api-key") ||
        errCode.includes("configuration-not-found") ||
        errMsg.includes("configuration-not-found") ||
        errCode.includes("invalid-api-key") ||
        errMsg.includes("invalid-api-key")
      ) {
        return {
          success: false,
          error:
            "El acceso con Google no está disponible temporalmente debido a la configuración de Firebase. Por favor utiliza el acceso con Código por Correo.",
        };
      }

      const readableError = error?.code || error?.message;
      return {
        success: false,
        error: readableError
          ? `Error al autenticar con Google (${readableError}). Si el problema continúa, ingresa mediante Código por Correo.`
          : "Error al autenticar con Google. Por favor ingresa mediante Código por Correo.",
      };
    }
  };

  // Send 6-digit verification code to email
  const sendEmailCode = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err: any) {
      return { success: false, error: "Error de conexión al enviar el código" };
    }
  };

  // Verify 6-digit code and authenticate
  const verifyEmailCode = async (
    email: string,
    code: string,
    name?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, name }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        handleAuthSuccess(data.user);
        await refreshUser();
        return { success: true };
      }
      return { success: false, error: data.error || "Código inválido o expirado" };
    } catch (err: any) {
      return { success: false, error: "Error de conexión al verificar el código" };
    }
  };

  // Log out user
  const logout = async () => {
    try {
      if (auth) {
        await firebaseSignOut(auth).catch(() => {});
      }
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setOrders([]);
      closeProfileDrawer();
    } catch (err) {
      console.error("Error during logout:", err);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        orders,
        loading,
        isAuthModalOpen,
        isProfileDrawerOpen,
        isTermsModalOpen,
        isDocumentModalOpen,
        activeDocumentSlug,
        authPromptReason,
        openAuthModal,
        closeAuthModal,
        openProfileDrawer,
        closeProfileDrawer,
        openTermsModal,
        closeTermsModal,
        openDocumentModal,
        closeDocumentModal,
        requireAuth,
        loginWithGoogle,
        sendEmailCode,
        verifyEmailCode,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
