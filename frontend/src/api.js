const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

console.log("API URL:", import.meta.env.VITE_API_URL);

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

export async function analyzePortfolio({ tickers, weights, period, riskFreeRate }) {
  const res = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tickers, weights, period, risk_free_rate: riskFreeRate }),
  });

  if (!res.ok) {
    let detail = "The analysis couldn't be completed.";
    try { const b = await res.json(); detail = b.detail || detail; } catch {}
    throw new ApiError(detail, res.status);
  }
  return res.json();
}
