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

const PERIOD_LABELS = {
  "1mo":"1-month","3mo":"3-month","6mo":"6-month",ytd:"year-to-date",
  "1y":"1-year","2y":"2-year","5y":"5-year",max:"full history",
};

export default function App() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function handleSubmit(params) {
    setLoading(true); setError(null);
    try {
      setData(await analyzePortfolio(params));
    } catch(e) {
      setData(null);
      setError(e instanceof ApiError ? e.message : "Couldn't reach the backend. Make sure it's running on port 8000.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#F9FAFB" }}>
      {/* ── Dark sidebar ── */}
      <aside className="w-72 shrink-0 bg-sidebar min-h-screen sticky top-0 h-screen overflow-y-auto flex flex-col">
        <div className="p-5 flex-1 flex flex-col">
          <TickerForm onSubmit={handleSubmit} loading={loading} hasResults={!!data} />
        </div>

        {/* Footer credit */}
        <div className="px-5 py-3 border-t border-sidebar-border">
          <p className="text-2xs" style={{ color: "#4B5563" }}>
            Built by Aarit Panwar · FastAPI · NumPy · SciPy
          </p>
        </div>
      </aside>

      {/* ── Main canvas ── */}
      <main className="flex-1 min-w-0 px-8 pb-16">
        {/* Hero / empty state */}
        {!data && !loading && (
          <div className="flex items-center justify-center h-full min-h-screen">
            <div className="max-w-md text-center" style={{ animation: "fadeSlideUp 0.5s ease-out both" }}>
              <div className="w-12 h-12 rounded-xl bg-indigo-subtle flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-indigo-DEFAULT fill-none stroke-current strokeWidth={1.5}">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              </div>
              <h1 className="font-display font-semibold text-2xl text-ink mb-2 tracking-tight">
                Portfolio Risk Engine
              </h1>
              <p className="text-muted text-sm leading-relaxed">
                Configure your holdings in the sidebar, then run the analysis to get a full
                quantitative breakdown — efficient frontier, Monte Carlo simulation, correlation
                matrix, and an AI-generated risk summary.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {["Efficient Frontier","Monte Carlo GBM","Sharpe Ratio","VaR / CVaR","Beta"].map(t => (
                  <span key={t} className="eyebrow bg-white border border-border-base rounded-full px-3 py-1">{t}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center h-full min-h-screen">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-indigo-DEFAULT border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted">Running analysis…</p>
              <p className="text-2xs text-subtle mt-1">Fetching data · mapping frontier · running 10k Monte Carlo paths</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="pt-12 max-w-lg">
            <div className="card border-rose-DEFAULT/30 p-4">
              <p className="text-sm font-medium text-rose-DEFAULT mb-1">Analysis failed</p>
              <p className="text-sm text-muted">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {data && !loading && (
          <div className="pt-2 animate-fadeIn">
            {/* Header strip */}
            <div className="py-5 border-b border-border-base mb-2 flex items-baseline justify-between gap-4 flex-wrap">
              <div>
                <h1 className="font-display font-semibold text-xl text-ink tracking-tight">
                  {data.tickers.join(" / ")}
                </h1>
                <p className="text-sm text-muted mt-0.5">
                  {PERIOD_LABELS[data.period] || data.period} lookback ·{" "}
                  {data.weights.map((w, i) => `${data.tickers[i]} ${(w*100).toFixed(0)}%`).join(" · ")}
                </p>
              </div>
              <span className="eyebrow bg-indigo-subtle text-indigo-DEFAULT border border-indigo-DEFAULT/20 px-3 py-1.5 rounded-full">
                Live analysis
              </span>
            </div>

            <Section title="Portfolio summary" subtitle="Top-level risk and return metrics for the weighted portfolio.">
              <PortfolioSummary metrics={data.portfolio_metrics} />
            </Section>

            <div className="border-t border-border-base" />

            <Section title="Historical performance" subtitle="Normalized price history — each series indexed to 100 at the period start.">
              <PerformanceChart priceHistory={data.price_history} tickers={data.tickers} />
            </Section>

            <div className="border-t border-border-base" />

            <Section title="Per-asset metrics" subtitle="Return, volatility, Sharpe, beta, max drawdown, and VaR for each holding.">
              <AssetTable tickers={data.tickers} weights={data.weights} stockMetrics={data.stock_metrics} />
            </Section>

            <div className="border-t border-border-base" />

            <Section title="Efficient frontier"
              subtitle="3,000 randomly weighted allocations mapped by risk and return. Your portfolio vs. the Max Sharpe and Min Volatility optima.">
              <EfficientFrontierChart frontier={data.efficient_frontier} currentMetrics={data.portfolio_metrics} />
            </Section>

            <div className="border-t border-border-base" />

            <Section title="Correlation matrix" subtitle="Pairwise correlation of daily returns — lower values signal stronger diversification.">
              <CorrelationHeatmap correlation={data.correlation} />
            </Section>

            <div className="border-t border-border-base" />

            <Section title="Monte Carlo simulation"
              subtitle="10,000 forward paths simulated via Geometric Brownian Motion with Cholesky-correlated shocks.">
              <MonteCarloChart monteCarlo={data.monte_carlo} />
            </Section>

            <div className="border-t border-border-base" />

            <Section title="AI risk assessment" subtitle="Synthesized from all metrics above.">
              <AISummary summary={data.ai_summary} />
            </Section>
          </div>
        )}
      </main>
    </div>
  );
}
