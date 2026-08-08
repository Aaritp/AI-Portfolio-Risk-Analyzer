"""
main.py — FastAPI backend for Portfolio Risk Analyzer

Run locally:
    uvicorn main:app --reload --port 8000

Auto-generated API docs available at:
    http://localhost:8000/docs
"""

import logging
import os
import time
from contextlib import contextmanager

import numpy as np
import pandas as pd
import yfinance as yf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
from pydantic import BaseModel, field_validator
from typing import List, Optional
from dotenv import load_dotenv

ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=ENV_PATH)

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
from storage import save_analysis, get_analysis, list_history, storage_enabled

load_dotenv()

app = FastAPI(title="Portfolio Risk Analyzer", version="1.0.0")

# The browser reaches this API through a same-origin rewrite on Vercel, so it
# sends no Origin header and this middleware never fires for normal traffic.
# It stays as a narrow backstop for anything that does arrive cross-origin.
# Kept rather than deleted because credentialed requests (OAuth) cannot use a
# wildcard origin — an empty slot here invites someone to refill it with "*".
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


# ── TEMPORARY: phase timing instrumentation ────────────────────────────────
# Added to find where /api/analyze spends its time. Remove once profiling is
# done — this whole block and the `with phase(...)` wrappers in analyze().

# uvicorn already configures this logger with a handler at INFO, so timings
# reach the server log without touching global logging config.
timing_log = logging.getLogger("uvicorn.error")


@contextmanager
def phase(name: str, timings: dict):
    """Record wall-clock time for one phase of a request."""
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - start
        timings[name] = elapsed
        timing_log.info("[timing]   %-24s %7.2fs", name, elapsed)


# ── Request model ──────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    tickers:         List[str]
    weights:         Optional[List[float]] = None
    period:          str   = "1y"
    risk_free_rate:  float = 0.05

    @field_validator("tickers")
    @classmethod
    def validate_tickers(cls, v):
        if len(v) < 2:
            raise ValueError("At least 2 tickers required")
        if len(v) > 10:
            raise ValueError("Maximum 10 tickers")
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

    timings: dict = {}
    request_start = time.perf_counter()
    timing_log.info("[timing] === analyze %s period=%s ===",
                    ",".join(req.tickers), req.period)

    # 1. Fetch market data
    with phase("yfinance prices", timings):
        try:
            raw    = yf.download(req.tickers, period=req.period,
                                 auto_adjust=True, progress=False, threads=True)
            prices = raw["Close"] if len(req.tickers) > 1 else raw["Close"].to_frame(req.tickers[0])
            prices = prices[req.tickers].dropna()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch data: {str(e)}")

    if prices.empty or len(prices) < 30:
        raise HTTPException(status_code=400,
                            detail="Not enough data — check ticker symbols or try a longer period.")

    # 2. Returns
    returns = daily_log_returns(prices)

    # 3. Weights
    n = len(req.tickers)
    if req.weights and len(req.weights) == n:
        weights = np.array(req.weights, dtype=float)
        weights = weights / weights.sum()
    else:
        weights = np.ones(n) / n

    # 4. Fetch SPY for beta
    with phase("yfinance SPY", timings):
        spy_returns = None
        try:
            spy_raw     = yf.download("SPY", period=req.period,
                                      auto_adjust=True, progress=False)
            spy_prices  = spy_raw["Close"]
            spy_ret_df  = daily_log_returns(spy_prices.to_frame("SPY"))
            spy_returns = spy_ret_df["SPY"].reindex(returns.index).dropna()
        except Exception:
            pass

    # 5. Individual stock metrics
    with phase("per-asset metrics", timings):
        stock_metrics = {}
        for ticker in req.tickers:
            s_ret = returns[ticker]
            m = {
                "return":       annualized_return(s_ret),
                "volatility":   annualized_volatility(s_ret),
                "sharpe":       sharpe_ratio(s_ret, req.risk_free_rate),
                "max_drawdown": max_drawdown(prices[ticker]),
                "var_95":       value_at_risk(s_ret, 0.95),
                "beta":         None,
            }
            if spy_returns is not None:
                try:
                    aligned   = s_ret.reindex(spy_returns.index).dropna()
                    m["beta"] = beta(aligned, spy_returns.reindex(aligned.index))
                except Exception:
                    pass
            stock_metrics[ticker] = m

    # 6. Portfolio metrics
    port_metrics = portfolio_metrics(returns, weights, req.risk_free_rate)

    # 7. Correlation matrix
    corr = correlation_matrix(returns)

    # 8. Efficient frontier
    with phase("efficient frontier", timings):
        frontier = efficient_frontier(returns, n_portfolios=3000,
                                      risk_free_rate=req.risk_free_rate)

    # 9. Monte Carlo simulation (GBM, 10k paths, 1-year horizon)
    with phase("monte carlo", timings):
        mc = monte_carlo_simulation(prices=prices, weights=weights,
                                    n_simulations=10_000, n_days=252)

    # 10. Normalized price history for chart
    price_history = {}
    for ticker in req.tickers:
        p = prices[ticker]
        price_history[ticker] = {
            "dates":      p.index.strftime("%Y-%m-%d").tolist(),
            "prices":     [round(v, 2) for v in p.tolist()],
            "normalized": [round(v, 4) for v in (p / p.iloc[0] * 100).tolist()],
        }

    # 11. AI risk summary
    with phase("openrouter ai summary", timings):
        ai_summary = await generate_risk_summary(
            req.tickers, stock_metrics, port_metrics, weights.tolist()
        )

    response = {
        "tickers":            req.tickers,
        "weights":            weights.tolist(),
        "period":             req.period,
        "stock_metrics":      stock_metrics,
        "portfolio_metrics":  port_metrics,
        "correlation":        corr,
        "efficient_frontier": frontier,
        "monte_carlo":        mc,
        "price_history":      price_history,
        "ai_summary":         ai_summary,
    }

    # 12. Persist to S3 (best effort — failures never break the analysis).
    # boto3 is synchronous, so run it in a worker thread to keep the upload
    # off the event loop.
    with phase("s3 write", timings):
        analysis_id = await run_in_threadpool(save_analysis, response, req.tickers)
    response["analysis_id"] = analysis_id

    total = time.perf_counter() - request_start
    timing_log.info("[timing]   %-24s %7.2fs  (unmeasured %.2fs)",
                    "TOTAL", total, total - sum(timings.values()))

    return response


@app.get("/api/history")
def history(limit: int = 20):
    """List recent saved analyses (id, timestamp, tickers only)."""
    return {
        "enabled": storage_enabled(),
        "results":  list_history(limit=limit),
    }


@app.get("/api/history/{analysis_id}")
def history_detail(analysis_id: str):
    """Retrieve a single saved analysis in full, for reloading in the UI."""
    record = get_analysis(analysis_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return record


@app.get("/api/search/{query}")
def search_ticker(query: str):
    """Quick ticker lookup — name, sector, current price"""
    try:
        info = yf.Ticker(query.upper()).info
        return {
            "symbol":   info.get("symbol", query.upper()),
            "name":     info.get("longName", "Unknown"),
            "sector":   info.get("sector", "N/A"),
            "industry": info.get("industry", "N/A"),
            "price":    info.get("regularMarketPrice"),
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
