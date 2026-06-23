/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        sidebar: "#0B1220",
        "sidebar-elevated": "#121A2B",
        "sidebar-border": "rgba(148,163,184,0.12)",
        "sidebar-muted": "#94A3B8",
        "sidebar-subtle": "#64748B",
        canvas: "#F6F7F9",
        surface: "#FFFFFF",
        "border-base": "rgba(15,23,42,0.06)",
        "border-strong": "rgba(15,23,42,0.1)",
        ink: "#0F172A",
        "ink-secondary": "#475569",
        muted: "#64748B",
        subtle: "#94A3B8",
        indigo: {
          DEFAULT: "#6366F1",
          dark: "#4F46E5",
          light: "#A5B4FC",
          subtle: "#EEF2FF",
        },
        emerald: {
          DEFAULT: "#059669",
          bg: "#ECFDF5",
          text: "#065F46",
        },
        rose: {
          DEFAULT: "#E11D48",
          bg: "#FEF2F2",
          text: "#9F1239",
        },
        amber: {
          DEFAULT: "#D97706",
          bg: "#FFFBEB",
          text: "#92400E",
        },
        teal: "#0D9488",
        violet: "#7C3AED",
        coral: "#E05252",
      },
      fontFamily: {
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },
      boxShadow: {
        xs: "0 1px 2px rgba(15,23,42,0.04)",
        sm: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
        md: "0 4px 14px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.05)",
        lg: "0 12px 32px rgba(15,23,42,0.12), 0 2px 6px rgba(15,23,42,0.06)",
      },
      keyframes: {
        fadeSlideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        fadeSlideUp: "fadeSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) both",
        fadeIn: "fadeIn 0.4s ease-out both",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};
