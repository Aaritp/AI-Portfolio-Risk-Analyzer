"""
quant.py — Quantitative finance calculations

This module handles all the math:
  - Returns, volatility, Sharpe ratio, max drawdown
  - Value at Risk (VaR)
  - Correlation matrix
  - Efficient frontier via Monte Carlo simulation

These are the same metrics used by quant analysts at hedge funds daily.
"""

import numpy as np
import pandas as pd

# ── Constants ──────────────────────────────────────────────────────────────
TRADING_DAYS = 252   # US market trading days per year


# ── Individual metrics ─────────────────────────────────────────────────────

def daily_log_returns(prices: pd.DataFrame) -> pd.DataFrame:
    """
    Log returns: ln(P_t / P_{t-1})
    We use log returns instead of simple returns because they're
    time-additive and better suited for statistical analysis.
    """
    return np.log(prices / prices.shift(1)).dropna()


def annualized_return(returns: pd.Series) -> float:
    """
    Scale daily mean return up to a yearly figure.
    Formula: mean_daily_return * 252
    """
    return float(returns.mean() * TRADING_DAYS)


def annualized_volatility(returns: pd.Series) -> float:
    """
    Scale daily std dev up to yearly.
    Formula: std_daily * sqrt(252)
    Volatility is the core risk measure in finance.
    """
    return float(returns.std() * np.sqrt(TRADING_DAYS))


def sharpe_ratio(returns: pd.Series, risk_free_rate: float = 0.05) -> float:
    """
    Sharpe ratio = (Return - Risk Free Rate) / Volatility
    Measures return per unit of risk. Higher = better.
    Risk free rate defaults to ~5% (current US T-bill rate).
    """
    ret = annualized_return(returns)
    vol = annualized_volatility(returns)
    if vol == 0:
        return 0.0
    return float((ret - risk_free_rate) / vol)


def max_drawdown(prices: pd.Series) -> float:
    """
    Max drawdown = worst peak-to-trough decline.
    Formula: min((P_t - peak_t) / peak_t)
    Critical risk metric — tells you the worst loss you'd have suffered
    if you bought at the top.
    """
    peak = prices.cummax()
    drawdown = (prices - peak) / peak
    return float(drawdown.min())


def value_at_risk(returns: pd.Series, confidence: float = 0.95) -> float:
    """
    Historical VaR at given confidence level.
    VaR(95%) = -0.02 means: on 95% of days, you lose no more than 2%.
    On the worst 5% of days, you lose more than 2%.
    """
    return float(np.percentile(returns, (1 - confidence) * 100))


def beta(stock_returns: pd.Series, market_returns: pd.Series) -> float:
    """
    Beta measures sensitivity to market movements.
    Beta > 1: more volatile than market
    Beta < 1: less volatile than market
    Formula: Cov(stock, market) / Var(market)
    """
    cov_matrix = np.cov(stock_returns, market_returns)
    return float(cov_matrix[0, 1] / cov_matrix[1, 1])


# ── Portfolio-level metrics ────────────────────────────────────────────────

def portfolio_returns(returns: pd.DataFrame, weights: np.ndarray) -> pd.Series:
    """Weighted sum of individual returns = portfolio daily return series"""
    return (returns * weights).sum(axis=1)


def portfolio_metrics(returns: pd.DataFrame, weights: np.ndarray,
                      risk_free_rate: float = 0.05) -> dict:
    """All metrics at the portfolio level given a weight vector"""
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
    Values range from -1 (perfect inverse) to +1 (perfect positive).
    Low correlation between assets = good diversification.
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
    Monte Carlo simulation of the efficient frontier.

    How it works:
    1. Generate N random weight combinations (must sum to 1)
    2. For each, calculate annualized return, volatility, and Sharpe
    3. Plot them — the upper-left edge of the cloud IS the efficient frontier
    4. The portfolio with the highest Sharpe is the 'optimal' portfolio

    The efficient frontier is one of the most important concepts in modern
    portfolio theory (Markowitz, 1952). It shows the maximum return
    achievable for each level of risk.
    """
    n_assets = len(returns.columns)
    portfolios = []
    all_weights = []

    for _ in range(n_portfolios):
        # Dirichlet distribution gives random weights that sum to 1
        w = np.random.dirichlet(np.ones(n_assets))
        port_ret = portfolio_returns(returns, w)
        ret = annualized_return(port_ret)
        vol = annualized_volatility(port_ret)
        sharpe = (ret - risk_free_rate) / vol if vol > 0 else 0.0
        portfolios.append({"return": round(ret, 4),
                           "volatility": round(vol, 4),
                           "sharpe": round(sharpe, 4)})
        all_weights.append(w)

    # Max Sharpe portfolio
    best_i = max(range(len(portfolios)), key=lambda i: portfolios[i]["sharpe"])
    best_w = all_weights[best_i]

    # Min volatility portfolio
    min_vol_i = min(range(len(portfolios)), key=lambda i: portfolios[i]["volatility"])

    return {
        "portfolios":       portfolios,
        "optimal_weights":  {returns.columns[i]: round(float(best_w[i]), 4)
                             for i in range(n_assets)},
        "optimal_metrics":  portfolios[best_i],
        "min_vol_metrics":  portfolios[min_vol_i],
        "min_vol_weights":  {returns.columns[i]: round(float(all_weights[min_vol_i][i]), 4)
                             for i in range(n_assets)},
    }


# ── Monte Carlo Price Path Simulation ─────────────────────────────────────

def monte_carlo_simulation(prices: pd.DataFrame,
                           weights: np.ndarray,
                           n_simulations: int = 10_000,
                           n_days: int = 252,
                           confidence_levels: list = [0.95, 0.99]) -> dict:
    """
    Simulate future portfolio value paths using Geometric Brownian Motion (GBM).

    GBM is the stochastic process that underlies Black-Scholes options pricing.
    It assumes stock prices follow:

        S(t+dt) = S(t) * exp((μ - σ²/2)*dt  +  σ*√dt * Z)

    where:
        μ  = drift (expected daily return, estimated from historical data)
        σ  = volatility (daily std dev, estimated from historical data)
        Z  ~ N(0, 1)  random shock each time step

    Why μ - σ²/2 (Ito's correction)?
        Because log returns are normally distributed but price returns are
        log-normal. The σ²/2 term corrects for the asymmetry — without it
        the simulation would systematically overestimate expected prices.

    Running 10,000 paths gives us a distribution of outcomes we can
    use to compute forward-looking VaR, probability of loss, and
    best/worst/median scenarios — far more informative than historical VaR.
    """
    returns = daily_log_returns(prices)

    n_assets = len(prices.columns)

    # Estimate drift (μ) and volatility (σ) for each asset from history
    mu  = returns.mean().values           # shape: (n_assets,)
    cov = returns.cov().values            # shape: (n_assets, n_assets)

    # Cholesky decomposition preserves correlations between assets
    # Instead of simulating each asset independently, this ensures that
    # correlated assets (e.g. two tech stocks) move together realistically.
    L = np.linalg.cholesky(cov)           # lower triangular: cov = L @ L.T

    # Starting portfolio value = $10,000 (normalized)
    S0 = 10_000.0

    # Store only the final portfolio value for each simulation (memory efficient)
    # But also store a sample of paths for visualization
    final_values   = np.zeros(n_simulations)
    sample_paths   = np.zeros((min(200, n_simulations), n_days + 1))  # 200 paths for chart

    for i in range(n_simulations):
        # Generate correlated random shocks for all assets and all days
        # Z shape: (n_days, n_assets)
        Z = np.random.standard_normal((n_days, n_assets))
        correlated_Z = Z @ L.T             # apply Cholesky to correlate shocks

        # GBM step for all assets simultaneously
        # daily_returns shape: (n_days, n_assets)
        daily_ret = np.exp(
            (mu - 0.5 * np.diag(cov)) +   # drift term (with Ito correction)
            correlated_Z                    # random shock term
        )

        # Build price path for each asset: multiply daily returns cumulatively
        # price_paths shape: (n_days+1, n_assets)
        price_paths = np.ones((n_days + 1, n_assets))
        price_paths[0] = 1.0               # normalized starting price
        for t in range(1, n_days + 1):
            price_paths[t] = price_paths[t - 1] * daily_ret[t - 1]

        # Portfolio value = weighted sum of individual asset values
        portfolio_path = price_paths @ weights   # shape: (n_days+1,)
        final_values[i] = portfolio_path[-1] * S0

        if i < 200:
            sample_paths[i] = portfolio_path * S0

    # ── Summary statistics ──────────────────────────────────────────────
    final_returns = (final_values - S0) / S0

    var_results = {}
    for conf in confidence_levels:
        cutoff = np.percentile(final_returns, (1 - conf) * 100)
        var_results[f"var_{int(conf*100)}"] = round(float(cutoff), 4)

    # Expected Shortfall (CVaR) — average loss beyond VaR
    # More conservative and informative than VaR alone
    cvar_results = {}
    for conf in confidence_levels:
        cutoff = var_results[f"var_{int(conf*100)}"]
        tail_losses = final_returns[final_returns <= cutoff]
        cvar_results[f"cvar_{int(conf*100)}"] = round(
            float(tail_losses.mean()) if len(tail_losses) > 0 else cutoff, 4
        )

    # Probability metrics
    prob_loss    = float(np.mean(final_values < S0))
    prob_gain_10 = float(np.mean(final_returns > 0.10))
    prob_gain_20 = float(np.mean(final_returns > 0.20))

    # Percentile outcomes (what $10k turns into at each percentile)
    percentiles = {
        "p5":     round(float(np.percentile(final_values, 5)), 2),
        "p25":    round(float(np.percentile(final_values, 25)), 2),
        "p50":    round(float(np.percentile(final_values, 50)), 2),
        "p75":    round(float(np.percentile(final_values, 75)), 2),
        "p95":    round(float(np.percentile(final_values, 95)), 2),
    }

    # Sample paths for visualization (downsample to every 5 days for speed)
    viz_paths = sample_paths[:, ::5].tolist()

    return {
        "n_simulations":    n_simulations,
        "n_days":           n_days,
        "initial_value":    S0,
        "var":              var_results,
        "cvar":             cvar_results,
        "prob_loss":        round(prob_loss, 4),
        "prob_gain_10pct":  round(prob_gain_10, 4),
        "prob_gain_20pct":  round(prob_gain_20, 4),
        "percentile_outcomes": percentiles,
        "sample_paths":     viz_paths,           # for the fan chart
        "mean_final":       round(float(np.mean(final_values)), 2),
        "std_final":        round(float(np.std(final_values)), 2),
    }
