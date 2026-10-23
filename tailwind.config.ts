import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          charcoal: "#1A1A1D",
          red: "#C02030",
          "red-glow": "#E02A3C",
          "red-deep": "#3D0B10",
          slate: "#4D5660",
          "slate-hover": "#66727F",
          "slate-surface": "#22262B",
          grey: "#E6E6E8",
          surface: {
            base: "#121214",
            card: "#1A1A1D",
            elevated: "#242428",
            border: "#2E2E34",
          },
          status: {
            fit: "#10B981",
            unfit: "#EF4444",
            transit: "#0EA5E9",
            pending: "#F59E0B",
            whatsapp: "#25D366",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-orbitron)", "sans-serif"],
      },
      boxShadow: {
        "red-glow": "0 0 25px -5px rgba(192, 32, 48, 0.4)",
        "red-glow-lg": "0 0 40px -5px rgba(224, 42, 60, 0.6)",
        "cyan-glow": "0 0 25px -5px rgba(14, 165, 233, 0.4)",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1", filter: "drop-shadow(0 0 15px rgba(192, 32, 48, 0.6))" },
          "50%": { opacity: "0.85", filter: "drop-shadow(0 0 5px rgba(192, 32, 48, 0.2))" },
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite linear",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
