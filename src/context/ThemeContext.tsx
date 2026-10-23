"use client";

import React, { createContext, useContext, useEffect } from "react";

interface ThemeContextType {
  theme: "light";
  toggleTheme: () => void;
  setTheme: (t: "light") => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Enforce Pure Light Mode across the entire application
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    localStorage.removeItem("zxz_theme");
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: "light",
        toggleTheme: () => {},
        setTheme: () => {},
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
