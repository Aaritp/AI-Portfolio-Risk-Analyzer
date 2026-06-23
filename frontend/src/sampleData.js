// Deterministic, realistic-looking sample analysis used for the in-app demo
// when the backend isn't reachable. Generated from the user's chosen inputs so
// the dashboard still feels personalized.

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const PERIOD_DAYS = {
  "3mo": 63,
  "6mo": 126,
  ytd: 120,
  "1y": 252,
  "2y": 504,
  "5y": 756, // sampled
};

function fmtDate(d) {
  const y = String(d.getFullYear()).slice(2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `20${y}-${m}-${day}`;
}

export function buildSampleData({ tickers, weights, period, riskFreeRate }) {
  const rf = riskFreeRate ?? 0.05;
  const totalW = weights.reduce((s, w) => s + w, 0) || 1;
  const normWeights = weights.map((w) => w / totalW);

  const nDays = PERIOD_DAYS[period] || 252;
  const points = Math.min(nDays, 160);

  // Per-asset return series
  const priceHistory = {};
  const stockMetrics = {};
  const dailyReturns = {};

  tickers.forEach((t, idx) => {
    const rng = mulberry32(hashStr(t) + idx * 7919);
    const drift = 0.0002 + (rng() - 0.45) * 0.0014; // daily drift
    const vol = 0.011 + rng() * 0.014; // daily vol
    const series = [100];
    const rets = [];
    let peak = 100;
    let maxDD = 0;
    for (let i = 1; i < points; i++) {
      const shock = (rng() - 0.5) * 2;
      const r = drift + vol * shock;
      rets.push(r);
      const next = series[i - 1] * (1 + r);
      series.push(next);
      if (next > peak) peak = next;
      const dd = next / peak - 1;
      if (dd < maxDD) maxDD = dd;
    }
    dailyReturns[t] = rets;

    const dates = [];
    const start = new Date();
    start.setDate(start.getDate() - points);
    for (let i = 0; i < points; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + Math.floor((i / points) * nDays));
      dates.push(fmtDate(d));
    }

    const annRet = (series[series.length - 1] / 100) ** (252 / nDays) - 1;
    const annVol = vol * Math.sqrt(252);
    const sharpe = (annRet - rf) / annVol;

    priceHistory[t] = { dates, normalized: series };
    stockMetrics[t] = {
      return: annRet,
      volatility: annVol,
      sharpe,
      beta: 0.7 + rng() * 0.9,
      max_drawdown: maxDD,
      var_95: -(vol * 1.645),
    };
  });

  // Portfolio metrics
  const pRet = tickers.reduce((s, t, i) => s + normWeights[i] * stockMetrics[t].return, 0);
  const pVol =
    Math.sqrt(tickers.reduce((s, t, i) => s + (normWeights[i] * stockMetrics[t].volatility) ** 2, 0)) *
    1.05;
  const pSharpe = (pRet - rf) / pVol;
  const portfolioMetrics = {
    return: pRet,
    volatility: pVol,
    sharpe: pSharpe,
    var_95: -(pVol / Math.sqrt(252)) * 1.645,
    var_99: -(pVol / Math.sqrt(252)) * 2.326,
  };

  // Efficient frontier cloud
  const frng = mulberry32(hashStr(tickers.join("")) + 13);
  const portfolios = Array.from({ length: 3000 }, () => {
    const ws = tickers.map(() => frng());
    const sum = ws.reduce((a, b) => a + b, 0);
    const w = ws.map((x) => x / sum);
    const ret = tickers.reduce((s, t, i) => s + w[i] * stockMetrics[t].return, 0);
    const vol =
      Math.sqrt(tickers.reduce((s, t, i) => s + (w[i] * stockMetrics[t].volatility) ** 2, 0)) *
      (0.95 + frng() * 0.25);
    return { return: ret, volatility: vol, sharpe: (ret - rf) / vol };
  });
  const optimal = portfolios.reduce((a, b) => (b.sharpe > a.sharpe ? b : a));
  const minVol = portfolios.reduce((a, b) => (b.volatility < a.volatility ? b : a));

  // Correlation matrix
  const matrix = tickers.map((_, i) =>
    tickers.map((__, j) => {
      if (i === j) return 1;
      const r = mulberry32(hashStr(tickers[i] + tickers[j]))();
      return Math.round((0.2 + r * 0.65) * 100) / 100;
    })
  );
  for (let i = 0; i < tickers.length; i++)
    for (let j = i + 1; j < tickers.length; j++) matrix[j][i] = matrix[i][j];

  // Monte Carlo
  const initial = 100000;
  const days = nDays;
  const mcrng = mulberry32(hashStr(tickers.join("|")) + 99);
  const steps = 40;
  const samplePaths = Array.from({ length: 120 }, () => {
    const path = [initial];
    const dMu = portfolioMetrics.return / 252;
    const dSig = portfolioMetrics.volatility / Math.sqrt(252);
    for (let s = 1; s <= steps; s++) {
      const z = mcrng() + mcrng() + mcrng() - 1.5; // ~normal-ish
      const r = (dMu + dSig * z) * (days / steps);
      path.push(path[s - 1] * (1 + r));
    }
    return path;
  });
  const finals = samplePaths.map((p) => p[p.length - 1]).sort((a, b) => a - b);
  const q = (x) => finals[Math.floor(x * (finals.length - 1))];
  const probLoss = finals.filter((v) => v < initial).length / finals.length;
  const worst = finals.slice(0, Math.floor(finals.length * 0.05));
  const cvar95 = worst.reduce((a, b) => a + (b / initial - 1), 0) / (worst.length || 1);

  const monteCarlo = {
    sample_paths: samplePaths,
    initial_value: initial,
    percentile_outcomes: { p5: q(0.05), p25: q(0.25), p50: q(0.5), p75: q(0.75), p95: q(0.95) },
    cvar: { cvar_95: cvar95 },
    prob_loss: probLoss,
    n_simulations: 10000,
    n_days: days,
  };

  const best = [...tickers].sort((a, b) => stockMetrics[b].return - stockMetrics[a].return)[0];
  const aiSummary =
    `This ${tickers.length}-asset portfolio carries an annualized volatility of ${(pVol * 100).toFixed(1)}% ` +
    `against an expected return of ${(pRet * 100).toFixed(1)}%, producing a Sharpe ratio of ${pSharpe.toFixed(2)}. ` +
    `${best} is the strongest individual contributor, while pairwise correlations remain moderate, suggesting ` +
    `reasonable but improvable diversification. Monte Carlo simulation places the probability of ending below the ` +
    `starting value at ${(probLoss * 100).toFixed(0)}%, with tail losses (CVaR 95%) averaging ${(cvar95 * 100).toFixed(1)}%. ` +
    `Shifting weight toward the Max-Sharpe allocation on the efficient frontier would modestly raise risk-adjusted return.`;

  return {
    tickers,
    weights: normWeights,
    period,
    portfolio_metrics: portfolioMetrics,
    price_history: priceHistory,
    stock_metrics: stockMetrics,
    efficient_frontier: { portfolios, optimal_metrics: optimal, min_vol_metrics: minVol },
    correlation: { labels: tickers, matrix },
    monte_carlo: monteCarlo,
    ai_summary: aiSummary,
    is_demo: true,
  };
}
