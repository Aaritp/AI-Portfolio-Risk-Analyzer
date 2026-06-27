/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        sidebar: "#07111F",
        "sidebar-elevated": "#0E1A2E",
        "sidebar-border": "rgba(148,163,184,0.2)",
        "sidebar-muted": "#A5B4FC",
        "sidebar-subtle": "#94A3B8",
        canvas: "#08101E",
        surface: "#0F172A",
        "border-base": "rgba(148,163,184,0.16)",
        "border-strong": "rgba(148,163,184,0.24)",
        ink: "#E2E8F0",
        "ink-secondary": "#CBD5E1",
        muted: "#94A3B8",
        subtle: "#BCCCDC",
        indigo: {
          DEFAULT: "#818CF8",
          dark: "#6366F1",
          light: "#C7D2FE",
          subtle: "#E0E7FF",
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
          "0%": { opacity: "0", transform: "translateY(20px)" },
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
        fadeSlideUp: "fadeSlideUp 0.65s cubic-bezier(0.22,1,0.36,1) both",
        fadeIn: "fadeIn 0.4s ease-out both",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};
