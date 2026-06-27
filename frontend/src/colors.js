export const SERIES_COLORS = [
  "#818CF8", // indigo
  "#22D3EE", // cyan
  "#FBBF24", // amber
  "#A78BFA", // violet
  "#34D399", // emerald
  "#FB7185", // coral
  "#60A5FA", // blue
  "#F472B6", // pink
  "#84CC16", // lime
  "#F97316", // orange
];

const LOGO_MAP = {
  AAPL: "apple.com",
  MSFT: "microsoft.com",
  GOOGL: "abc.xyz",
  AMZN: "amazon.com",
  TSLA: "tesla.com",
  JPM: "jpmorganchase.com",
  NVDA: "nvidia.com",
  META: "meta.com",
  NFLX: "netflix.com",
  CRM: "salesforce.com",
  PYPL: "paypal.com",
  V: "visa.com",
  MA: "mastercard.com",
  BAC: "bankofamerica.com",
  KO: "coca-colacompany.com",
  PFE: "pfizer.com",
  XOM: "exxonmobil.com",
};

export function seriesColor(i) {
  return SERIES_COLORS[i % SERIES_COLORS.length];
}

export function tickerLogo(ticker) {
  const domain = LOGO_MAP[ticker] || `${ticker.toLowerCase()}.com`;
  return `https://logo.clearbit.com/${domain}?size=128`;
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
