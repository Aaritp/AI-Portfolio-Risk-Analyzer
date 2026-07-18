"""
benchmark_py.py — NumPy Monte Carlo benchmark twin of monte_carlo.cpp

Identical inputs, identical math, identical printed metrics — mirrors the
vectorized GBM approach from backend/quant.py so the C++ engine can be
benchmarked fairly against Python/NumPy.

Usage:
    python benchmark_py.py prices.csv [n_simulations=10000] [seed=42]
"""

import sys
import time

import numpy as np
import pandas as pd

TRADING_DAYS = 252
INITIAL_VALUE = 10_000.0


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(f"usage: python {sys.argv[0]} <prices.csv> [n_simulations=10000] [seed=42]")
    csv_path = sys.argv[1]
    n_sims = int(sys.argv[2]) if len(sys.argv) > 2 else 10_000
    seed = int(sys.argv[3]) if len(sys.argv) > 3 else 42

    prices = pd.read_csv(csv_path, index_col="Date")
    tickers = prices.columns.tolist()
    n_assets = len(tickers)

    # Same estimation as backend/quant.py: daily log returns, sample cov (n-1).
    returns = np.log(prices / prices.shift(1)).dropna()
    mu = returns.mean().values
    cov = returns.cov().values
    L = np.linalg.cholesky(cov)

    drift = mu - 0.5 * np.diag(cov)  # Itô correction
    weights = np.full(n_assets, 1.0 / n_assets)

    rng = np.random.default_rng(seed)

    t0 = time.perf_counter()
    # Vectorized over all paths: Z ~ N(0,1), correlate via Z @ L.T, then
    # S(T) = exp( sum_t (drift + L·z_t) ) per asset — same recurrence as the
    # per-day loop in quant.py, collapsed to the final value.
    Z = rng.standard_normal((n_sims, TRADING_DAYS, n_assets))
    correlated = Z @ L.T
    log_growth = (drift + correlated).sum(axis=1)      # (n_sims, n_assets)
    final_values = np.exp(log_growth) @ weights * INITIAL_VALUE
    elapsed_ms = (time.perf_counter() - t0) * 1000.0

    final_returns = (final_values - INITIAL_VALUE) / INITIAL_VALUE

    p5, median, p95 = np.percentile(final_values, [5, 50, 95])
    var95, var99 = np.percentile(final_returns, [5, 1])
    tail = final_returns[final_returns <= var95]
    cvar95 = tail.mean() if len(tail) else var95
    prob_loss = float(np.mean(final_values < INITIAL_VALUE))

    print("Monte Carlo simulation (Python/NumPy)")
    print(f"  assets:        {n_assets} ({', '.join(tickers)})")
    print(f"  paths x days:  {n_sims} x {TRADING_DAYS}   seed: {seed}")
    print(f"  initial value: ${INITIAL_VALUE:.2f}\n")
    print(f"  median outcome:        ${median:.2f}")
    print(f"  5th percentile:        ${p5:.2f}")
    print(f"  95th percentile:       ${p95:.2f}")
    print(f"  VaR 95%:               {var95:.4f}")
    print(f"  VaR 99%:               {var99:.4f}")
    print(f"  CVaR 95%:              {cvar95:.4f}")
    print(f"  probability of loss:   {prob_loss:.4f}")
    print(f"  simulation time:       {elapsed_ms:.1f} ms")


if __name__ == "__main__":
    main()
