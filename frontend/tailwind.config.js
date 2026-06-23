/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        sidebar: "#111827",
        "sidebar-border": "rgba(255,255,255,0.08)",
        "sidebar-muted": "#9CA3AF",
        "sidebar-subtle": "#6B7280",
        canvas: "#F9FAFB",
        surface: "#FFFFFF",
        "border-base": "#E5E7EB",
        "border-strong": "#D1D5DB",
        ink: "#111827",
        "ink-secondary": "#374151",
        muted: "#6B7280",
        subtle: "#9CA3AF",
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
          DEFAULT: "#DC2626",
          bg: "#FEF2F2",
          text: "#991B1B",
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
      keyframes: {
        fadeSlideUp: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        fadeSlideUp: "fadeSlideUp 0.4s ease-out both",
        fadeIn: "fadeIn 0.3s ease-out both",
      },
    },
  },
  plugins: [],
};
