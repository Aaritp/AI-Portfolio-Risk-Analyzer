// All requests use same-origin relative paths. In production, vercel.json
// rewrites /api/* to the Render backend; in dev, the Vite proxy forwards it
// to the local uvicorn server. Keeping the browser on one origin means
// session cookies are first-party.

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

export async function analyzePortfolio({ tickers, weights, period, riskFreeRate }) {
  const res = await fetch("/api/analyze", {
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
