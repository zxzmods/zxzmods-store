"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface ActiveVehicle {
  year: number;
  brandSlug: string;
  brandName: string;
  modelSlug: string;
  modelName: string;
  category?: string | null;
  imageUrl?: string | null;
  pickupServiceAvailable?: boolean;
}

export interface RegisteredVehicle {
  id: string;
  sessionId?: string;
  nickname?: string | null;
  brandSlug: string;
  brandName: string;
  modelSlug: string;
  modelName: string;
  year: number;
  category?: string | null;
  color?: string | null;
  notes?: string | null;
  imageUrl?: string | null;
  pickupServiceAvailable?: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface GarageContextType {
  vehicle: ActiveVehicle | null;
  activeVehicle: RegisteredVehicle | null;
  vehicles: RegisteredVehicle[];
  isLoading: boolean;
  hasConfiguredVehicle: boolean;
  canAddMore: boolean;
  maxVehicles: number;
  setVehicle: (v: ActiveVehicle) => void;
  clearVehicle: () => void;
  isModalOpen: boolean;
  openModal: (onSuccessCallback?: () => void) => void;
  closeModal: () => void;
  requireVehicleBeforeAction: (action: () => void) => void;
  refreshVehicles: () => Promise<void>;
  addRegisteredVehicle: (vehicleData: {
    year: number;
    brandSlug: string;
    brandName: string;
    modelSlug: string;
    modelName: string;
    category?: string;
    color?: string;
    nickname?: string;
    notes?: string;
    imageUrl?: string;
    setAsActive?: boolean;
  }) => Promise<{ success: boolean; data?: RegisteredVehicle; error?: string }>;
  removeRegisteredVehicle: (id: string) => Promise<boolean>;
  setActiveVehicleId: (id: string) => Promise<boolean>;
}

const GarageContext = createContext<GarageContextType | undefined>(undefined);

export function GarageProvider({ children }: { children: React.ReactNode }) {
  const [vehicles, setVehicles] = useState<RegisteredVehicle[]>([]);
  const [activeVehicle, setActiveVehicle] = useState<RegisteredVehicle | null>(null);
  const [vehicle, setVehicleState] = useState<ActiveVehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  const maxVehicles = 10;
  const canAddMore = vehicles.length < maxVehicles;

  const syncActiveToState = useCallback((active: RegisteredVehicle | null) => {
    setActiveVehicle(active);
    if (active) {
      const activeObj: ActiveVehicle = {
        year: active.year,
        brandSlug: active.brandSlug,
        brandName: active.brandName,
        modelSlug: active.modelSlug,
        modelName: active.modelName,
        category: active.category,
        imageUrl: active.imageUrl,
        pickupServiceAvailable: active.pickupServiceAvailable,
      };
      setVehicleState(activeObj);
      try {
        localStorage.setItem("zxz_garage_vehicle", JSON.stringify(activeObj));
      } catch (e) {
        console.error("Failed to save garage vehicle to localStorage", e);
      }
    } else {
      setVehicleState(null);
      try {
        localStorage.removeItem("zxz_garage_vehicle");
      } catch (e) {
        console.error("Failed to remove garage vehicle from localStorage", e);
      }
    }
  }, []);

  const refreshVehicles = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/garage");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const list: RegisteredVehicle[] = json.data.vehicles || [];
          setVehicles(list);

          const foundActive = list.find((v) => v.isActive) || list[0] || null;
          syncActiveToState(foundActive);

          // If DB has 0 vehicles but localStorage has a legacy one, sync it to the DB
          if (list.length === 0) {
            try {
              const saved = localStorage.getItem("zxz_garage_vehicle");
              if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.brandSlug && parsed.modelSlug && parsed.year) {
                  await fetch("/api/garage", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      year: parsed.year,
                      brandSlug: parsed.brandSlug,
                      brandName: parsed.brandName,
                      modelSlug: parsed.modelSlug,
                      modelName: parsed.modelName,
                      category: parsed.category || "UTV",
                      imageUrl: parsed.imageUrl,
                      setAsActive: true,
                    }),
                  });
                  // re-fetch after initial sync
                  const reRes = await fetch("/api/garage");
                  if (reRes.ok) {
                    const reJson = await reRes.json();
                    if (reJson.success && reJson.data) {
                      setVehicles(reJson.data.vehicles || []);
                      syncActiveToState(reJson.data.activeVehicle || null);
                    }
                  }
                }
              }
            } catch (syncErr) {
              console.warn("Legacy vehicle sync ignored:", syncErr);
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch vehicles from garage API", e);
      // Fallback to local storage if API is temporarily unavailable
      try {
        const saved = localStorage.getItem("zxz_garage_vehicle");
        if (saved) {
          setVehicleState(JSON.parse(saved));
        }
      } catch {}
    } finally {
      setIsLoading(false);
    }
  }, [syncActiveToState]);

  useEffect(() => {
    refreshVehicles();
  }, [refreshVehicles]);

  const setVehicle = (v: ActiveVehicle) => {
    setVehicleState(v);
    localStorage.setItem("zxz_garage_vehicle", JSON.stringify(v));
    setIsModalOpen(false);
    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
    }
    // Also save to backend
    fetch("/api/garage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year: v.year,
        brandSlug: v.brandSlug,
        brandName: v.brandName,
        modelSlug: v.modelSlug,
        modelName: v.modelName,
        category: v.category || "UTV",
        imageUrl: v.imageUrl,
        setAsActive: true,
      }),
    })
      .then(() => refreshVehicles())
      .catch((err) => console.error("Error updating garage in backend:", err));
  };

  const clearVehicle = () => {
    setVehicleState(null);
    setActiveVehicle(null);
    localStorage.removeItem("zxz_garage_vehicle");
  };

  const addRegisteredVehicle = async (vehicleData: {
    year: number;
    brandSlug: string;
    brandName: string;
    modelSlug: string;
    modelName: string;
    category?: string;
    color?: string;
    nickname?: string;
    notes?: string;
    imageUrl?: string;
    setAsActive?: boolean;
  }) => {
    try {
      const res = await fetch("/api/garage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicleData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error || "Failed to register vehicle",
        };
      }

      await refreshVehicles();
      return { success: true, data: json.data };
    } catch (e: any) {
      return { success: false, error: e?.message || "Network error" };
    }
  };

  const removeRegisteredVehicle = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/garage/${id}`, { method: "DELETE" });
      if (res.ok) {
        await refreshVehicles();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error removing vehicle:", e);
      return false;
    }
  };

  const setActiveVehicleId = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/garage/${id}/activate`, { method: "POST" });
      if (res.ok) {
        await refreshVehicles();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error setting active vehicle:", e);
      return false;
    }
  };

  const openModal = (onSuccessCallback?: () => void) => {
    if (onSuccessCallback) {
      setPendingCallback(() => onSuccessCallback);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPendingCallback(null);
  };

  const requireVehicleBeforeAction = (action: () => void) => {
    action();
  };

  return (
    <GarageContext.Provider
      value={{
        vehicle,
        activeVehicle,
        vehicles,
        isLoading,
        hasConfiguredVehicle: !!vehicle || vehicles.length > 0,
        canAddMore,
        maxVehicles,
        setVehicle,
        clearVehicle,
        isModalOpen,
        openModal,
        closeModal,
        requireVehicleBeforeAction,
        refreshVehicles,
        addRegisteredVehicle,
        removeRegisteredVehicle,
        setActiveVehicleId,
      }}
    >
      {children}
    </GarageContext.Provider>
  );
}

export function useGarage() {
  const ctx = useContext(GarageContext);
  if (!ctx) throw new Error("useGarage must be used within a GarageProvider");
  return ctx;
}

