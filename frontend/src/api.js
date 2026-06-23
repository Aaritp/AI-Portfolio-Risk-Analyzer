const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function analyzePortfolio({ tickers, weights, period, riskFreeRate }) {
  const res = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tickers,
      weights,
      period,
      risk_free_rate: riskFreeRate,
    }),
  });

  if (!res.ok) {
    let detail = "The analysis couldn't be completed.";
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch (e) {
      /* ignore parse error */
    }
    throw new ApiError(detail, res.status);
  }

  return res.json();
}
