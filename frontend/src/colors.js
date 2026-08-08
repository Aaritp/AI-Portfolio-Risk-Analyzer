// Single brand accent — used everywhere a holding is identified (dots,
// sliders, badges). One color, no rainbow.
export const BRAND = "#1CADF0";

// Per-ticker series palette. One color per holding, used everywhere a ticker
// is identified in a chart, so a ticker reads as the same color page-wide.
//
// Ordering rule: consecutive entries are never adjacent hues — the smallest
// gap between neighbours here is 74°, so two series next to each other in a
// legend can never be confused. Hue (°) noted per entry; the wrap from the
// last entry back to the first is 152°, so portfolios of 7–10 holdings stay
// separated too. All ten clear 6.7:1 contrast on #05080F.
export const LINE_COLORS = [
  "#818CF8", // indigo   235°
  "#34D399", // emerald  158°
  "#FB7185", // rose     351°
  "#EFFD5F", // lemon     65°
  "#22D3EE", // cyan     188°
  "#C084FC", // violet   270°
  "#FB923C", // orange    27°
  "#14B8A6", // teal     173°
  "#F0ABFC", // fuchsia  291°
  "#A3E635", // lime      83°
];

// Series color for the i-th ticker. Callers pass the index into the canonical
// `tickers` array, which is the same array in every component — that identity
// is what keeps a ticker's color stable across charts.
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
