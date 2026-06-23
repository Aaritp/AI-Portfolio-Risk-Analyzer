export const SERIES_COLORS = [
  "#6366F1", // indigo
  "#0D9488", // teal
  "#D97706", // amber
  "#7C3AED", // violet
  "#059669", // emerald
  "#E05252", // coral
  "#2563EB", // blue
  "#DB2777", // pink
  "#65A30D", // lime
  "#EA580C", // orange
];

export function seriesColor(i) {
  return SERIES_COLORS[i % SERIES_COLORS.length];
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
  if (value === null || value === undefined) return "text-muted";
  return value >= 0 ? "pos" : "neg";
}
