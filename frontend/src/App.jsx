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
  "1mo": "1-month", "3mo": "3-month", "6mo": "3-month", ytd: "year-to-date",
  "1y": "1-year", "2y": "2-year", "5y": "5-year", max: "full history",
};

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastParams, setLastParams] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          : "Request failed. Try again."
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

  function handleSubmitAndClose(params) {
    setSidebarOpen(false);
    return handleSubmit(params);
  }
  function loadDemoAndClose(params) {
    setSidebarOpen(false);
    loadDemo(params);
  }

  return (
    <div className="relative min-h-screen flex overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.14),transparent_28%),#07111F] text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-12%] top-16 h-72 w-72 rounded-full bg-cyan-400/18 blur-3xl" />
        <div className="absolute right-[-10%] top-48 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute left-[45%] top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-fuchsia-500/15 blur-2xl" />
      </div>
      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-sm lg:hidden animate-fadeIn"
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`w-72 shrink-0 flex flex-col bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.15),transparent_25%),#08131f] border-r border-[#1f2d48]
          fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-out
          lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:z-auto
          h-screen overflow-y-auto thin-scroll
          ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}
      >
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-indigo-DEFAULT/10 to-transparent pointer-events-none" />
        <div className="relative p-5 flex-1 flex flex-col">
          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute right-4 top-4 w-8 h-8 rounded-lg flex items-center justify-center text-sidebar-subtle hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close sidebar"
          >
            <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current">
              <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <TickerForm onSubmit={handleSubmitAndClose} onDemo={loadDemoAndClose} loading={loading} hasResults={!!data} />
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Sticky top bar */}
        <div className="topbar sticky top-0 z-20 px-4 sm:px-6 md:px-10 h-16 flex items-center justify-between bg-slate-950/70 border-b border-white/10 backdrop-blur-2xl shadow-lg shadow-slate-950/20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden -ml-1 w-9 h-9 rounded-2xl flex items-center justify-center text-slate-200 hover:text-ink hover:bg-white/10 transition-colors"
              aria-label="Open portfolio controls"
            >
              <svg viewBox="0 0 20 20" className="w-5 h-5 fill-none stroke-current">
                <path d="M3 6h14M3 10h14M3 14h14" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <span className="font-display font-semibold text-ink tracking-tight">Frontier</span>
          </div>
        </div>

        <div className="flex-1 px-6 md:px-10 pb-20">
          {/* Empty / hero state */}
          {!data && !loading && (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] animate-fadeIn">
              <div className="relative max-w-lg text-center animate-fadeSlideUp">
                <div className="absolute inset-x-0 -top-10 h-28 rounded-[32px] bg-cyan-400/10 blur-3xl" />
                <div className="relative overflow-hidden rounded-[40px] border border-white/12 bg-slate-900/80 p-8 shadow-[0_36px_120px_-60px_rgba(56,189,248,0.28)] backdrop-blur-xl">
                  <div className="absolute -left-8 top-4 h-28 w-28 rounded-full bg-cyan-400/12 blur-3xl" />
                  <div className="absolute right-[-18px] top-14 h-28 w-28 rounded-full bg-fuchsia-500/10 blur-3xl" />
                  <div className="absolute inset-x-6 top-4 h-1 rounded-full bg-gradient-to-r from-cyan-400/80 via-violet-500/80 to-fuchsia-500/80" />
                  <div className="relative w-16 h-16 rounded-[28px] bg-gradient-to-br from-indigo-500/25 via-cyan-500/20 to-fuchsia-500/15 shadow-2xl border border-white/10 flex items-center justify-center mx-auto mb-6">
                    <svg viewBox="0 0 24 24" className="w-7 h-7 text-indigo-DEFAULT fill-none stroke-current">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.6}
                      d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
                    />
                  </svg>
                </div>
                <h1 className="font-display font-semibold text-3xl text-white mb-3 tracking-tight">
                  Quantitative portfolio risk, decoded
                </h1>
                <p className="text-slate-300 text-base leading-relaxed">
                  Configure your holdings in the sidebar, then run the analysis for a full breakdown —
                  efficient frontier, Monte Carlo simulation, correlation matrix, and an AI risk story.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {["Efficient Frontier", "Monte Carlo GBM", "Sharpe Ratio", "VaR / CVaR", "Beta"].map((t) => (
                    <span key={t} className="chip rounded-full bg-gradient-to-r from-cyan-400/15 via-violet-500/10 to-fuchsia-500/15 border border-white/10 text-slate-100 shadow-sm">{t}</span>
                  ))}
                </div>
                <div className="mt-8 flex items-center justify-center">
                  <button
                    onClick={() => loadDemo()}
                    className="relative overflow-hidden shimmer-btn inline-flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 text-sm font-semibold rounded-3xl px-5 py-2.5 shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all"
                  >
                    Load starter portfolio
                    <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current">
                      <path d="M7.5 4.5L13 10l-5.5 5.5L6 14l4-4-4-4 1.5-1.5z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] animate-fadeIn">
              <div className="text-center animate-fadeSlideUp">
                <div className="w-9 h-9 border-2 border-indigo-DEFAULT border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium text-ink">Running analysis…</p>
                <p className="text-2xs text-slate-300 mt-1.5">
                  Fetching data · mapping frontier · 10k Monte Carlo paths
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="pt-10 max-w-xl mx-auto animate-fadeIn">
              <div className="card p-5 border-l-4 border-l-rose-DEFAULT animate-fadeSlideUp bg-slate-950/90 shadow-[0_24px_80px_-30px_rgba(239,68,68,0.25)]">
                <p className="text-sm font-semibold text-rose-DEFAULT mb-1">Analysis failed</p>
                <p className="text-sm text-slate-300 leading-relaxed">{error}</p>
                <button
                  onClick={() => loadDemo()}
                  className="mt-4 inline-flex items-center gap-2 bg-ink text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-ink/90 transition-colors"
                >
                  Try starter portfolio
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
                  <p className="text-sm text-slate-300 mt-1">
                    {PERIOD_LABELS[data.period] || data.period} lookback ·{" "}
                    {data.weights.map((w, i) => `${data.tickers[i]} ${(w * 100).toFixed(0)}%`).join(" · ")}
                  </p>
                </div>
              </div>

              <Section title="Portfolio summary" subtitle="Top-level risk and return metrics for the weighted portfolio." delay={0}>
                <PortfolioSummary metrics={data.portfolio_metrics} />
              </Section>

              <Section title="Historical performance" subtitle="Normalized price history — each series indexed to 100 at the period start." delay={80}>
                <PerformanceChart priceHistory={data.price_history} tickers={data.tickers} />
              </Section>

              <Section title="Per-asset metrics" subtitle="Return, volatility, Sharpe, beta, max drawdown, and VaR for each holding." delay={140}>
                <AssetTable tickers={data.tickers} weights={data.weights} stockMetrics={data.stock_metrics} />
              </Section>

              <Section
                title="Efficient frontier"
                subtitle="3,000 randomly weighted allocations mapped by risk and return. Your portfolio vs. the Max Sharpe and Min Volatility optima."
                delay={200}
              >
                <EfficientFrontierChart frontier={data.efficient_frontier} currentMetrics={data.portfolio_metrics} />
              </Section>

              <Section title="Correlation matrix" subtitle="Pairwise correlation of daily returns — lower values signal stronger diversification." delay={260}>
                <CorrelationHeatmap correlation={data.correlation} />
              </Section>

              <Section
                title="Monte Carlo simulation"
                subtitle="10,000 forward paths simulated via Geometric Brownian Motion with Cholesky-correlated shocks."
                delay={320}
              >
                <MonteCarloChart monteCarlo={data.monte_carlo} />
              </Section>

              <Section title="AI risk assessment" subtitle="Synthesized from all metrics above." delay={380}>
                <AISummary summary={data.ai_summary} />
              </Section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
