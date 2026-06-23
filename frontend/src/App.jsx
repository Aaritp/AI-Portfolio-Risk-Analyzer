import { useState } from "react";
import TickerForm from "./components/TickerForm";
import Section from "./components/Section";
import PortfolioSummary from "./components/PortfolioSummary";
import PerformanceChart from "./components/PerformanceChart";
import AssetTable from "./components/AssetTable";
import EfficientFrontierChart from "./components/EfficientFrontierChart";
import CorrelationHeatmap from "./components/CorrelationHeatmap";
import MonteCarloChart from "./components/MonteCarloChart";
import AISummary from "./components/AISummary";
import { analyzePortfolio, ApiError } from "./api";
import { buildSampleData } from "./sampleData";

const PERIOD_LABELS = {
  "1mo": "1-month", "3mo": "3-month", "6mo": "6-month", ytd: "year-to-date",
  "1y": "1-year", "2y": "2-year", "5y": "5-year", max: "full history",
};

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastParams, setLastParams] = useState(null);

  async function handleSubmit(params) {
    setLoading(true);
    setError(null);
    setLastParams(params);
    try {
      setData(await analyzePortfolio(params));
    } catch (e) {
      setData(null);
      setError(
        e instanceof ApiError
          ? e.message
          : "Couldn't reach the backend. Make sure it's running on port 8000 — or explore the interactive demo below."
      );
    } finally {
      setLoading(false);
    }
  }

  function loadDemo(params) {
    setError(null);
    setLoading(true);
    const p = params ||
      lastParams || {
        tickers: ["AAPL", "MSFT", "GOOGL", "JPM"],
        weights: [0.25, 0.25, 0.25, 0.25],
        period: "1y",
        riskFreeRate: 0.05,
      };
    // brief delay so the transition feels intentional
    setTimeout(() => {
      setData(buildSampleData(p));
      setLoading(false);
    }, 280);
  }

  return (
    <div className="min-h-screen flex bg-canvas">
      {/* ── Sidebar ── */}
      <aside className="w-72 shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto thin-scroll flex flex-col bg-sidebar border-r border-sidebar-border">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-indigo-DEFAULT/10 to-transparent pointer-events-none" />
        <div className="relative p-5 flex-1 flex flex-col">
          <TickerForm onSubmit={handleSubmit} onDemo={loadDemo} loading={loading} hasResults={!!data} />
        </div>
        <div className="relative px-5 py-3.5 border-t border-sidebar-border">
          <p className="text-2xs text-sidebar-subtle">
            Built by Aarit Panwar · FastAPI · NumPy · SciPy
          </p>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Sticky top bar */}
        <div className="topbar sticky top-0 z-20 px-6 md:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-display font-semibold text-ink tracking-tight">Frontier</span>
            <span className="hidden sm:inline text-subtle">/</span>
            <span className="hidden sm:inline text-sm text-muted truncate">
              {data ? data.tickers.join(" · ") : "Portfolio Risk Engine"}
            </span>
          </div>
          <span className="chip">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                loading ? "bg-amber-DEFAULT animate-pulse" : data ? "bg-emerald-DEFAULT" : "bg-subtle"
              }`}
            />
            {loading ? "Analyzing" : data ? (data.is_demo ? "Demo data" : "Live analysis") : "Idle"}
          </span>
        </div>

        <div className="flex-1 px-6 md:px-10 pb-20">
          {/* Empty / hero state */}
          {!data && !loading && (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
              <div className="max-w-lg text-center animate-fadeSlideUp">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-border-base flex items-center justify-center mx-auto mb-5">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 text-indigo-DEFAULT fill-none stroke-current">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.6}
                      d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
                    />
                  </svg>
                </div>
                <h1 className="font-display font-semibold text-3xl text-ink mb-3 tracking-tight text-balance">
                  Quantitative portfolio risk, decoded
                </h1>
                <p className="text-muted text-[15px] leading-relaxed text-pretty">
                  Configure your holdings in the sidebar, then run the analysis for a full breakdown —
                  efficient frontier, Monte Carlo simulation, correlation matrix, and an AI-generated risk summary.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {["Efficient Frontier", "Monte Carlo GBM", "Sharpe Ratio", "VaR / CVaR", "Beta"].map((t) => (
                    <span key={t} className="chip">{t}</span>
                  ))}
                </div>
                <div className="mt-8 flex items-center justify-center gap-3">
                  <button
                    onClick={() => loadDemo()}
                    className="inline-flex items-center gap-2 bg-ink text-white text-sm font-medium rounded-lg px-4 py-2.5 shadow-sm hover:bg-ink/90 transition-colors"
                  >
                    Explore live demo
                    <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current">
                      <path d="M7.5 4.5L13 10l-5.5 5.5L6 14l4-4-4-4 1.5-1.5z" />
                    </svg>
                  </button>
                  <span className="text-2xs text-subtle">No backend required</span>
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
              <div className="text-center">
                <div className="w-9 h-9 border-2 border-indigo-DEFAULT border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium text-ink">Running analysis…</p>
                <p className="text-2xs text-subtle mt-1.5">
                  Fetching data · mapping frontier · 10k Monte Carlo paths
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="pt-10 max-w-xl mx-auto">
              <div className="card p-5 border-l-4 border-l-rose-DEFAULT">
                <p className="text-sm font-semibold text-rose-DEFAULT mb-1">Analysis failed</p>
                <p className="text-sm text-muted leading-relaxed">{error}</p>
                <button
                  onClick={() => loadDemo()}
                  className="mt-4 inline-flex items-center gap-2 bg-ink text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-ink/90 transition-colors"
                >
                  Load interactive demo instead
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {data && !loading && (
            <div className="max-w-[1200px] mx-auto pt-8 animate-fadeIn">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                <div>
                  <h1 className="font-display font-semibold text-2xl text-ink tracking-tight">
                    {data.tickers.join(" / ")}
                  </h1>
                  <p className="text-sm text-muted mt-1">
                    {PERIOD_LABELS[data.period] || data.period} lookback ·{" "}
                    {data.weights.map((w, i) => `${data.tickers[i]} ${(w * 100).toFixed(0)}%`).join(" · ")}
                  </p>
                </div>
              </div>

              <Section title="Portfolio summary" subtitle="Top-level risk and return metrics for the weighted portfolio.">
                <PortfolioSummary metrics={data.portfolio_metrics} />
              </Section>

              <Section title="Historical performance" subtitle="Normalized price history — each series indexed to 100 at the period start.">
                <PerformanceChart priceHistory={data.price_history} tickers={data.tickers} />
              </Section>

              <Section title="Per-asset metrics" subtitle="Return, volatility, Sharpe, beta, max drawdown, and VaR for each holding.">
                <AssetTable tickers={data.tickers} weights={data.weights} stockMetrics={data.stock_metrics} />
              </Section>

              <Section
                title="Efficient frontier"
                subtitle="3,000 randomly weighted allocations mapped by risk and return. Your portfolio vs. the Max Sharpe and Min Volatility optima."
              >
                <EfficientFrontierChart frontier={data.efficient_frontier} currentMetrics={data.portfolio_metrics} />
              </Section>

              <Section title="Correlation matrix" subtitle="Pairwise correlation of daily returns — lower values signal stronger diversification.">
                <CorrelationHeatmap correlation={data.correlation} />
              </Section>

              <Section
                title="Monte Carlo simulation"
                subtitle="10,000 forward paths simulated via Geometric Brownian Motion with Cholesky-correlated shocks."
              >
                <MonteCarloChart monteCarlo={data.monte_carlo} />
              </Section>

              <Section title="AI risk assessment" subtitle="Synthesized from all metrics above.">
                <AISummary summary={data.ai_summary} />
              </Section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
