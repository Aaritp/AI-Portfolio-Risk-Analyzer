// Series colours moved to lib/seriesStyle.js — they are now generated from
// the holding's index rather than drawn from a fixed list, so a portfolio of
// any size gets separated colours and holding n never changes colour when
// holding n+1 is added. This module keeps the value formatters.

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
