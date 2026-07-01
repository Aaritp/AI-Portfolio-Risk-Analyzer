/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base:    "#05080F",
        surface: "rgba(255,255,255,0.03)",
        "surface-md": "rgba(255,255,255,0.05)",
        "border-subtle": "rgba(255,255,255,0.06)",
        "border-base":   "rgba(255,255,255,0.10)",
        primary: "#E2E8F0",
        secondary: "#A9B6C7",
        muted:   "#64748B",
        indigo:  { DEFAULT: "#6366F1", dark: "#4F46E5", glow: "rgba(99,102,241,0.25)" },
        emerald: { DEFAULT: "#10B981", dim: "rgba(16,185,129,0.15)" },
        rose:    { DEFAULT: "#F87171", dim: "rgba(248,113,113,0.15)" },
        amber:   { DEFAULT: "#F59E0B", dim: "rgba(245,158,11,0.15)" },
      },
      fontFamily: {
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        sans:    ["Inter", "system-ui", "sans-serif"],
        mono:    ["IBM Plex Mono", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        glass: "16px",
        "glass-lg": "24px",
      },
      boxShadow: {
        glass: "0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)",
        "glass-hover": "0 0 0 1px rgba(99,102,241,0.3), 0 8px 40px rgba(99,102,241,0.12)",
        "glow-indigo": "0 0 40px rgba(99,102,241,0.2)",
        "glow-emerald": "0 0 24px rgba(16,185,129,0.2)",
      },
      backgroundImage: {
        "hero-gradient": "radial-gradient(ellipse 80% 60% at 50% 120%, rgba(99,102,241,0.18) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 20%, rgba(99,102,241,0.06) 0%, transparent 60%), linear-gradient(to bottom, #05080F 0%, #080D1A 100%)",
        "card-gradient": "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
      },
      keyframes: {
        revealUp: {
          "0%":   { opacity: "0", transform: "translateY(32px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        revealFade: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        ticker: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        pulse: {
          "0%,100%": { opacity: "1" },
          "50%":     { opacity: "0.5" },
        },
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%":     { transform: "translateY(-6px)" },
        },
      },
      animation: {
        revealUp:   "revealUp 0.7s cubic-bezier(0.16,1,0.3,1) both",
        revealFade: "revealFade 0.6s ease both",
        ticker:     "ticker 30s linear infinite",
        pulse:      "pulse 2s ease-in-out infinite",
        float:      "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
