"""
quant.py — Quantitative finance calculations

Covers:
  - Log returns, annualized return, volatility
  - Sharpe ratio, max drawdown, VaR
  - Beta vs market
  - Correlation matrix
  - Efficient frontier (Monte Carlo over weights)
  - Monte Carlo price path simulation (Geometric Brownian Motion)
"""

import numpy as np
import pandas as pd

TRADING_DAYS = 252

# Ceiling on one batch of simulated shocks, in bytes. Keeps Monte Carlo peak
# memory bounded on small instances without falling back to a per-path loop.
MC_BATCH_BYTES = 16 * 1024 ** 2


# ── Individual metrics ─────────────────────────────────────────────────────

def daily_log_returns(prices: pd.DataFrame) -> pd.DataFrame:
    """
    Log returns: ln(P_t / P_{t-1})
    Preferred over simple returns because they're time-additive
    and better suited for statistical analysis.
    """
    return np.log(prices / prices.shift(1)).dropna()


def annualized_return(returns: pd.Series) -> float:
    """Scale daily mean return to a yearly figure: mean * 252"""
    return float(returns.mean() * TRADING_DAYS)


def annualized_volatility(returns: pd.Series) -> float:
    """Scale daily std dev to yearly: std * sqrt(252)"""
    return float(returns.std() * np.sqrt(TRADING_DAYS))


def sharpe_ratio(returns: pd.Series, risk_free_rate: float = 0.05) -> float:
    """
    Sharpe = (Return - Risk Free Rate) / Volatility
    Measures return per unit of risk. Higher = better.
    """
    ret = annualized_return(returns)
    vol = annualized_volatility(returns)
    if vol == 0:
        return 0.0
    return float((ret - risk_free_rate) / vol)


def max_drawdown(prices: pd.Series) -> float:
    """
    Worst peak-to-trough decline.
    Tells you the worst loss if you bought at the top.
    """
    peak = prices.cummax()
    drawdown = (prices - peak) / peak
    return float(drawdown.min())


def value_at_risk(returns: pd.Series, confidence: float = 0.95) -> float:
    """
    Historical VaR: worst daily loss at given confidence level.
    VaR(95%) = -0.02 means on 95% of days you lose no more than 2%.
    """
    return float(np.percentile(returns, (1 - confidence) * 100))


def beta(stock_returns: pd.Series, market_returns: pd.Series) -> float:
    """
    Sensitivity to market movements.
    Beta > 1: more volatile than market. Beta < 1: less volatile.
    """
    cov_matrix = np.cov(stock_returns, market_returns)
    return float(cov_matrix[0, 1] / cov_matrix[1, 1])


# ── Portfolio-level metrics ────────────────────────────────────────────────

def portfolio_returns(returns: pd.DataFrame, weights: np.ndarray) -> pd.Series:
    """Weighted sum of individual returns"""
    return (returns * weights).sum(axis=1)


def portfolio_metrics(returns: pd.DataFrame, weights: np.ndarray,
                      risk_free_rate: float = 0.05) -> dict:
    """All metrics at the portfolio level"""
    port_ret = portfolio_returns(returns, weights)
    return {
        "return":     annualized_return(port_ret),
        "volatility": annualized_volatility(port_ret),
        "sharpe":     sharpe_ratio(port_ret, risk_free_rate),
        "var_95":     value_at_risk(port_ret, 0.95),
        "var_99":     value_at_risk(port_ret, 0.99),
    }


def correlation_matrix(returns: pd.DataFrame) -> dict:
    """
    Pearson correlation between every pair of assets.
    Low correlation = good diversification.
    """
    corr = returns.corr()
    return {
        "labels": corr.columns.tolist(),
        "matrix": [[round(v, 4) for v in row] for row in corr.values.tolist()],
    }


# ── Efficient Frontier ─────────────────────────────────────────────────────

def efficient_frontier(returns: pd.DataFrame,
                       n_portfolios: int = 3000,
                       risk_free_rate: float = 0.05) -> dict:
    """
    Monte Carlo over random weight combinations.
    Generates the risk/return cloud whose upper-left edge
    is the efficient frontier (Markowitz, 1952).
    The portfolio with highest Sharpe = optimal allocation.

    Vectorized: every candidate portfolio is evaluated in one pass rather
    than one pandas round-trip per portfolio.
    """
    n_assets = len(returns.columns)

    # One draw for all candidates at once: (n_portfolios, n_assets).
    all_weights = np.random.dirichlet(np.ones(n_assets), size=n_portfolios)

    # Return series for every candidate simultaneously:
    #   (n_days, n_assets) @ (n_assets, n_portfolios) -> (n_days, n_portfolios)
    # This replaces n_portfolios separate (returns * w).sum(axis=1) calls.
    port_rets = returns.values @ all_weights.T

    # ddof=1 reproduces pandas Series.std(), which the per-portfolio version
    # used via annualized_volatility — NumPy's default ddof=0 would not.
    rets = port_rets.mean(axis=0) * TRADING_DAYS
    vols = port_rets.std(axis=0, ddof=1) * np.sqrt(TRADING_DAYS)

    with np.errstate(divide="ignore", invalid="ignore"):
        sharpes = np.where(vols > 0, (rets - risk_free_rate) / vols, 0.0)

    # Round before selecting, so ties resolve exactly as the original max()/
    # min() over the rounded dicts did (both pick the lowest index).
    rets_r, vols_r, sharpes_r = (np.round(rets, 4), np.round(vols, 4),
                                 np.round(sharpes, 4))

    portfolios = [{"return": float(r), "volatility": float(v), "sharpe": float(s)}
                  for r, v, s in zip(rets_r, vols_r, sharpes_r)]

    best_i = int(np.argmax(sharpes_r))
    min_vi = int(np.argmin(vols_r))

    return {
        "portfolios":      portfolios,
        "optimal_weights": {returns.columns[i]: round(float(all_weights[best_i][i]), 4)
                            for i in range(n_assets)},
        "optimal_metrics": portfolios[best_i],
        "min_vol_metrics": portfolios[min_vi],
        "min_vol_weights": {returns.columns[i]: round(float(all_weights[min_vi][i]), 4)
                            for i in range(n_assets)},
    }


# ── Monte Carlo Price Path Simulation (GBM) ───────────────────────────────

def monte_carlo_simulation(prices: pd.DataFrame,
                           weights: np.ndarray,
                           n_simulations: int = 10_000,
                           n_days: int = 252,
                           confidence_levels: list = [0.95, 0.99]) -> dict:
    """
    Simulate future portfolio value paths using Geometric Brownian Motion.

    GBM (the stochastic process behind Black-Scholes):
        S(t+dt) = S(t) * exp( (μ - σ²/2)*dt  +  σ*√dt * Z )

    where:
        μ          = drift (expected daily return from history)
        σ          = daily volatility from history
        σ²/2       = Ito correction (adjusts for log-normal asymmetry)
        Z ~ N(0,1) = random shock each time step

    Cholesky decomposition preserves realistic correlations between assets
    so correlated stocks (e.g. two tech names) move together.

    10,000 paths → full distribution of outcomes → forward-looking VaR,
    CVaR, and probability statements unavailable from historical data alone.

    Vectorized: paths are generated in batches rather than one at a time.
    Because each day multiplies by exp(increment), the running product over
    252 days is exp() of the running *sum* — so the per-day loop collapses
    into a single reduction. Only the sampled paths kept for the chart need
    the intermediate cumulative sums.
    """
    returns  = daily_log_returns(prices)
    n_assets = len(prices.columns)

    mu  = returns.mean().values      # expected daily return per asset
    cov = returns.cov().values       # covariance matrix

    # Cholesky: preserves inter-asset correlations in simulated shocks
    L = np.linalg.cholesky(cov)

    drift = mu - 0.5 * np.diag(cov)  # drift with Ito correction, hoisted

    S0           = 10_000.0
    n_sample     = min(200, n_simulations)
    final_values = np.zeros(n_simulations)
    sample_paths = np.zeros((n_sample, n_days + 1))
    # Day 0: every asset sits at 1.0, so the portfolio starts at sum(weights).
    sample_paths[:, 0] = float(np.sum(weights)) * S0

    # Generating all paths at once would allocate ~80 MB per intermediate at
    # the default 10k x 252 x 4. Batching holds peak memory flat regardless
    # of n_simulations while keeping every operation vectorized.
    batch = max(1, MC_BATCH_BYTES // (n_days * n_assets * 8))

    for start in range(0, n_simulations, batch):
        b = min(batch, n_simulations - start)

        Z = np.random.standard_normal((b, n_days, n_assets))
        # (b, n_days, n_assets) — correlated shocks plus drift, per day
        increments = drift + Z @ L.T

        # Total log growth over the horizon, then convert to portfolio value.
        final_values[start:start + b] = (
            np.exp(increments.sum(axis=1)) @ weights * S0
        )

        # Only the first n_sample paths are charted, so only they need the
        # per-day cumulative sums.
        k = min(n_sample - start, b)
        if k > 0:
            cumulative = np.cumsum(increments[:k], axis=1)
            sample_paths[start:start + k, 1:] = np.exp(cumulative) @ weights * S0

    final_returns = (final_values - S0) / S0

    var_results  = {}
    cvar_results = {}
    for conf in confidence_levels:
        key     = f"var_{int(conf * 100)}"
        cutoff  = float(np.percentile(final_returns, (1 - conf) * 100))
        tail    = final_returns[final_returns <= cutoff]
        var_results[key]                          = round(cutoff, 4)
        cvar_results[key.replace("var", "cvar")] = round(float(tail.mean()) if len(tail) else cutoff, 4)

    return {
        "n_simulations":       n_simulations,
        "n_days":              n_days,
        "initial_value":       S0,
        "var":                 var_results,
        "cvar":                cvar_results,
        "prob_loss":           round(float(np.mean(final_values < S0)), 4),
        "prob_gain_10pct":     round(float(np.mean(final_returns > 0.10)), 4),
        "prob_gain_20pct":     round(float(np.mean(final_returns > 0.20)), 4),
        "percentile_outcomes": {
            "p5":  round(float(np.percentile(final_values, 5)), 2),
            "p25": round(float(np.percentile(final_values, 25)), 2),
            "p50": round(float(np.percentile(final_values, 50)), 2),
            "p75": round(float(np.percentile(final_values, 75)), 2),
            "p95": round(float(np.percentile(final_values, 95)), 2),
        },
        "sample_paths":  sample_paths[:, ::5].tolist(),
        "mean_final":    round(float(np.mean(final_values)), 2),
        "std_final":     round(float(np.std(final_values)), 2),
    }
