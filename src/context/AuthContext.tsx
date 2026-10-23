"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth, googleProvider } from "@/lib/firebase";
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
  sendEmailCode: (email: string) => Promise<{ success: boolean; devCode?: string; error?: string }>;
  verifyEmailCode: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
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
      if (!auth || !googleProvider) {
        return { success: false, error: "Firebase no está inicializado en este cliente" };
      }

      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      // Sync with backend Prisma database with verified ID Token
      const syncRes = await fetch("/api/auth/social-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "google",
          idToken,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoUrl: firebaseUser.photoURL,
          phoneNumber: firebaseUser.phoneNumber,
        }),
      });

      const syncData = await syncRes.json();
      if (syncData.success) {
        handleAuthSuccess(syncData.user);
        await refreshUser();
        return { success: true };
      } else {
        return { success: false, error: syncData.error || "Error de sincronización con Google" };
      }
    } catch (error: any) {
      console.error("Error en Google Sign-In:", error);
      if (error?.code === "auth/popup-closed-by-user") {
        return { success: false, error: "Inicio de sesión con Google cancelado por el usuario." };
      }
      if (error?.code === "auth/configuration-not-found" || error?.code === "auth/invalid-api-key") {
        return {
          success: false,
          error: "Google Sign-In requiere credenciales de Firebase en producción. Utiliza la opción de Código por Correo.",
        };
      }
      return { success: false, error: error?.message || "Error al autenticar con Google" };
    }
  };

  // Send 6-digit verification code to email
  const sendEmailCode = async (
    email: string
  ): Promise<{ success: boolean; devCode?: string; error?: string }> => {
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        return { success: true, devCode: data.devCode };
      }
      return { success: false, error: data.error };
    } catch (err: any) {
      return { success: false, error: "Error de conexión al enviar el código" };
    }
  };

  // Verify 6-digit code and authenticate
  const verifyEmailCode = async (
    email: string,
    code: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
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
