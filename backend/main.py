"""
main.py — FastAPI backend for Portfolio Risk Analyzer

FastAPI is like Express but for Python. Key differences you'll notice:
  - Type hints on function parameters = automatic validation
  - async/await built in
  - Auto-generates API docs at /docs (try it!)
"""

import os
import numpy as np
import pandas as pd
import yfinance as yf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing import List, Optional
from dotenv import load_dotenv

from quant import (
    daily_log_returns,
    annualized_return,
    annualized_volatility,
    sharpe_ratio,
    max_drawdown,
    value_at_risk,
    correlation_matrix,
    portfolio_metrics,
    efficient_frontier,
    monte_carlo_simulation,
    beta,
)
from ai import generate_risk_summary

load_dotenv()

app = FastAPI(title="Portfolio Risk Analyzer", version="1.0.0")

# Allow React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response models ──────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    tickers: List[str]
    weights: Optional[List[float]] = None   # if None, equal weight
    period: str = "1y"                       # 1y, 2y, 5y, ytd, 6mo
    risk_free_rate: float = 0.05            # annualized, default 5%

    @field_validator("tickers")
    @classmethod
    def validate_tickers(cls, v):
        if len(v) < 2:
            raise ValueError("At least 2 tickers required")
        if len(v) > 10:
            raise ValueError("Maximum 10 tickers allowed")
        return [t.upper().strip() for t in v]

    @field_validator("period")
    @classmethod
    def validate_period(cls, v):
        valid = {"1mo", "3mo", "6mo", "ytd", "1y", "2y", "5y", "max"}
        if v not in valid:
            raise ValueError(f"Period must be one of: {valid}")
        return v


# ── Routes ─────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze(req: AnalyzeRequest):
    """
    Main analysis endpoint.
    Takes a list of tickers + optional weights → returns full risk breakdown.
    """

    # ── 1. Fetch market data ───────────────────────────────────────────────
    try:
        raw = yf.download(
            req.tickers,
            period=req.period,
            auto_adjust=True,
            progress=False,
            threads=True,
        )
        # yfinance returns multi-level columns when multiple tickers
        prices = raw["Close"] if len(req.tickers) > 1 else raw["Close"].to_frame(req.tickers[0])
        prices = prices[req.tickers]   # ensure consistent column order
        prices = prices.dropna()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch market data: {str(e)}")

    if prices.empty or len(prices) < 30:
        raise HTTPException(status_code=400,
                            detail="Not enough data — check ticker symbols or try a longer period.")

    # ── 2. Calculate returns ───────────────────────────────────────────────
    returns = daily_log_returns(prices)

    # ── 3. Resolve weights ────────────────────────────────────────────────
    n = len(req.tickers)
    if req.weights and len(req.weights) == n:
        weights = np.array(req.weights, dtype=float)
        weights = weights / weights.sum()   # normalize to sum to 1
    else:
        weights = np.ones(n) / n            # equal weight

    # ── 4. Individual stock metrics ───────────────────────────────────────
    # Fetch S&P 500 for beta calculation
    try:
        spy_raw = yf.download("SPY", period=req.period, auto_adjust=True, progress=False)
        spy_prices = spy_raw["Close"]
        spy_returns = daily_log_returns(spy_prices.to_frame("SPY"))["SPY"]
        spy_returns = spy_returns.reindex(returns.index).dropna()
    except Exception:
        spy_returns = None

    stock_metrics = {}
    for ticker in req.tickers:
        s_ret = returns[ticker]
        metrics = {
            "return":      annualized_return(s_ret),
            "volatility":  annualized_volatility(s_ret),
            "sharpe":      sharpe_ratio(s_ret, req.risk_free_rate),
            "max_drawdown": max_drawdown(prices[ticker]),
            "var_95":      value_at_risk(s_ret, 0.95),
        }
        # Add beta if SPY data available
        if spy_returns is not None:
            try:
                aligned = s_ret.reindex(spy_returns.index).dropna()
                metrics["beta"] = beta(aligned, spy_returns.reindex(aligned.index))
            except Exception:
                metrics["beta"] = None
        else:
            metrics["beta"] = None

        stock_metrics[ticker] = metrics

    # ── 5. Portfolio metrics ───────────────────────────────────────────────
    port_metrics = portfolio_metrics(returns, weights, req.risk_free_rate)

    # ── 6. Correlation matrix ──────────────────────────────────────────────
    corr = correlation_matrix(returns)

    # ── 7. Efficient frontier ──────────────────────────────────────────────
    frontier = efficient_frontier(returns, n_portfolios=3000,
                                  risk_free_rate=req.risk_free_rate)

    # ── 8. Normalized price history for performance chart ─────────────────
    price_history = {}
    for ticker in req.tickers:
        p = prices[ticker]
        price_history[ticker] = {
            "dates":      p.index.strftime("%Y-%m-%d").tolist(),
            "prices":     [round(v, 2) for v in p.tolist()],
            "normalized": [round(v, 4) for v in (p / p.iloc[0] * 100).tolist()],
        }

    # ── 9. Monte Carlo price path simulation (GBM) ────────────────────────
    mc = monte_carlo_simulation(
        prices=prices,
        weights=weights,
        n_simulations=10_000,
        n_days=252,
    )

    # ── 10. AI risk summary ────────────────────────────────────────────────
    ai_summary = await generate_risk_summary(
        req.tickers, stock_metrics, port_metrics, weights.tolist()
    )

    return {
        "tickers":             req.tickers,
        "weights":             weights.tolist(),
        "period":              req.period,
        "stock_metrics":       stock_metrics,
        "portfolio_metrics":   port_metrics,
        "correlation":         corr,
        "efficient_frontier":  frontier,
        "monte_carlo":         mc,
        "price_history":       price_history,
        "ai_summary":          ai_summary,
    }


@app.get("/api/search/{query}")
def search_tickers(query: str):
    """
    Basic ticker lookup — returns info about a stock symbol.
    Useful for the frontend search feature.
    """
    try:
        ticker = yf.Ticker(query.upper())
        info = ticker.info
        return {
            "symbol":   info.get("symbol", query.upper()),
            "name":     info.get("longName", "Unknown"),
            "sector":   info.get("sector", "N/A"),
            "industry": info.get("industry", "N/A"),
            "price":    info.get("regularMarketPrice", None),
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── Dev server ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
