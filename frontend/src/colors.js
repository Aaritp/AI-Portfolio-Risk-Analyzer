// Single brand accent — used everywhere a holding is identified (dots,
// sliders, badges). One color, no rainbow.
export const BRAND = "#1CADF0";

// Monochrome blue family — ONLY for multi-line charts, so overlapping series
// stay distinguishable without reintroducing rainbow colors.
export const LINE_COLORS = [
  "#1CADF0", // brand
  "#7DD3FC", // sky-300
  "#0284C7", // sky-600
  "#38BDF8", // sky-400
  "#0E7490", // cyan-700
  "#67E8F9", // cyan-300
  "#2563EB", // blue-600
  "#93C5FD", // blue-300
  "#22D3EE", // cyan-400
  "#60A5FA", // blue-400
];

// Chart lines cycle through the blue family so they remain readable.
export function lineColor(i) {
  return LINE_COLORS[i % LINE_COLORS.length];
}

export function pct(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function num(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toFixed(digits);
}

export function usd(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function signClass(value) {
  if (value === null || value === undefined) return "text-secondary";
  return value >= 0 ? "text-emerald-DEFAULT" : "text-rose-DEFAULT";
}
