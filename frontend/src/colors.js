export const SERIES_COLORS = [
  "#818CF8", // indigo-400
  "#34D399", // emerald-400
  "#FBBF24", // amber-400
  "#F472B6", // pink-400
  "#60A5FA", // blue-400
  "#A78BFA", // violet-400
  "#FB923C", // orange-400
  "#4ADE80", // green-400
  "#E879F9", // fuchsia-400
  "#38BDF8", // sky-400
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
  if (value === null || value === undefined) return "text-secondary";
  return value >= 0 ? "text-emerald-DEFAULT" : "text-rose-DEFAULT";
}
