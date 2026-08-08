"""
main.py — FastAPI backend for Portfolio Risk Analyzer

Run locally:
    uvicorn main:app --reload --port 8000

Auto-generated API docs available at:
    http://localhost:8000/docs
"""

import asyncio
import os

import numpy as np
import yfinance as yf
from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
from storage import (
    new_analysis_id,
    stage_analysis,
    flush_analysis,
    get_analysis,
    list_history,
    storage_enabled,
)

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


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    """Return request-validation failures as 400 with `detail` as one string.

    FastAPI's default is 422 with `detail` as a list of error objects. The
    frontend reads `detail` straight into the error banner, so a list renders
    as "[object Object]" at best and throws "Objects are not valid as a React
    child" at worst. A single sentence keeps every client trivial to write.
    """
    parts = []
    for err in exc.errors():
        msg = err.get("msg", "Invalid request")
        if msg.startswith("Value error, "):
            # Raised by our own field_validators, already written for humans
            # and already naming the field it is about.
            parts.append(msg[len("Value error, "):])
        else:
            # Pydantic's built-ins ("Field required", type mismatches) mean
            # nothing without saying which field they refer to.
            field = ".".join(str(p) for p in err.get("loc", ()) if p != "body")
            parts.append(f"{field}: {msg}" if field else msg)

    return JSONResponse(status_code=400, content={"detail": "; ".join(parts)})


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

        cleaned = [t.upper().strip() for t in v]

        # Compare after normalizing, so "aapl" and " AAPL " count as one
        # holding. Rejected rather than de-duplicated: weights line up with
        # tickers by position, so silently dropping an entry would shift the
        # remaining weights onto the wrong assets — and de-duplicating
        # ["AAPL", "AAPL"] would then fail the two-ticker minimum with a
        # message that describes neither what the caller sent nor how to fix
        # it. Duplicate columns also break the per-asset maths downstream.
        seen: set = set()
        duplicates: List[str] = []
        for t in cleaned:
            if t in seen and t not in duplicates:
                duplicates.append(t)
            seen.add(t)
        if duplicates:
            raise ValueError(
                f"Duplicate tickers: {', '.join(duplicates)}. "
                "List each holding once and use weights to set its share."
            )
        return cleaned

    @field_validator("period")
    @classmethod
    def validate_period(cls, v):
        # A tuple, not a set: this list is interpolated into a message the
        # user reads, and a set's repr order is not stable between runs.
        # Ordered shortest to longest rather than sorted lexicographically,
        # which would interleave months and years ("1mo, 1y, 2y, 3mo, 5y,
        # 6mo") and read worse than the range it describes.
        valid = ("1mo", "3mo", "6mo", "ytd", "1y", "2y", "5y", "max")
        if v not in valid:
            raise ValueError(f"Period must be one of: {', '.join(valid)}")
        return v


# ── Routes ─────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze(req: AnalyzeRequest, background: BackgroundTasks):

    # 1. Fetch market data
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

    # 7. AI risk summary — started here, awaited at step 11.
    # Everything it needs is ready now, and it is a network round-trip, so it
    # runs while the simulations below work. That only overlaps because those
    # simulations are dispatched to a worker thread: called inline they would
    # hold the event loop and this request could not progress.
    ai_task = asyncio.create_task(
        generate_risk_summary(
            req.tickers, stock_metrics, port_metrics, weights.tolist()
        )
    )

    try:
        # 8. Correlation matrix
        corr = correlation_matrix(returns)

        # 9. Efficient frontier
        frontier = await run_in_threadpool(
            efficient_frontier, returns, n_portfolios=3000,
            risk_free_rate=req.risk_free_rate)

        # 10. Monte Carlo simulation (GBM, 10k paths, 1-year horizon)
        mc = await run_in_threadpool(
            monte_carlo_simulation, prices=prices, weights=weights,
            n_simulations=10_000, n_days=252)

        # 11. Normalized price history for chart
        price_history = {}
        for ticker in req.tickers:
            p = prices[ticker]
            price_history[ticker] = {
                "dates":      p.index.strftime("%Y-%m-%d").tolist(),
                "prices":     [round(v, 2) for v in p.tolist()],
                "normalized": [round(v, 4) for v in (p / p.iloc[0] * 100).tolist()],
            }

        # 12. Collect the AI summary. Whatever ran above has already been
        # deducted from its latency; this is only the remainder.
        ai_summary = await ai_task
    except BaseException:
        # Never leave the summary running behind a failed request.
        ai_task.cancel()
        raise

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

    # 13. Persist to S3 (best effort — failures never break the analysis).
    # The id is allocated here rather than by the writer, so it can travel
    # with the response while the upload happens after it. The record is
    # staged synchronously first, which is what makes it retrievable by id
    # the moment the client has one.
    analysis_id = new_analysis_id() if storage_enabled() else None
    if analysis_id is not None:
        # Snapshot before analysis_id is attached, matching exactly what
        # the previous synchronous writer persisted.
        stage_analysis(analysis_id, dict(response), req.tickers)
        background.add_task(flush_analysis, analysis_id)
    response["analysis_id"] = analysis_id

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
