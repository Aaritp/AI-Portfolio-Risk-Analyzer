import { useState, useRef } from "react";
import Hero from "./components/Hero";
import Section from "./components/Section";
import TickerForm from "./components/TickerForm";
import EquityCurve from "./components/EquityCurve";
import PortfolioSummary from "./components/PortfolioSummary";
import PerformanceChart from "./components/PerformanceChart";
import AssetTable from "./components/AssetTable";
import EfficientFrontierChart from "./components/EfficientFrontierChart";
import CorrelationHeatmap from "./components/CorrelationHeatmap";
import MonteCarloChart from "./components/MonteCarloChart";
import AISummary from "./components/AISummary";
import LoadingState from "./components/LoadingState";
import { analyzePortfolio, ApiError } from "./api";
import { seriesColor } from "./lib/seriesStyle";

const PERIOD_LABELS = {
  "3mo":"3-month","6mo":"6-month",ytd:"year-to-date",
  "1y":"1-year","2y":"2-year","5y":"5-year",max:"full history",
};

export default function App() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const resultsRef = useRef(null);

  async function handleSubmit(params) {
    setLoading(true); setError(null);
    try {
      const result = await analyzePortfolio(params);
      setData(result);
      // Smooth scroll to results after short delay for render
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e) {
      setData(null);
      setError(e instanceof ApiError ? e.message : "Couldn't reach the backend. Make sure it's running on port 8000.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#05080F" }}>

      {/* ── Hero + input form ── */}
      <Hero>
        <TickerForm onSubmit={handleSubmit} loading={loading} />
        {error && (
          <div className="mt-3 glass border border-rose-DEFAULT/30 px-4 py-3 text-sm text-rose-DEFAULT text-left">
            {error}
          </div>
        )}
      </Hero>

      {/* ── Loading state ── */}
      {loading && <LoadingState />}

      {/* ── Results ── */}
      {data && !loading && (
        <div ref={resultsRef} className="max-w-6xl mx-auto px-5 md:px-10 pb-24">

          {/* Result header */}
          <div className="py-10 border-b border-white/[0.06] mb-2">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                {/* Each ticker in its own series colour — the same one it
                    carries in every chart and table below. */}
                <h2 className="font-display font-bold tracking-tight"
                    style={{ fontSize: "clamp(1.5rem,4vw,2.5rem)" }}>
                  {data.tickers.map((t, i) => (
                    <span key={t}>
                      {i > 0 && <span className="text-muted font-normal"> / </span>}
                      <span style={{ color: seriesColor(i) }}>{t}</span>
                    </span>
                  ))}
                </h2>
                <p className="text-secondary text-sm mt-1">
                  {PERIOD_LABELS[data.period] || data.period} lookback ·{" "}
                  {data.weights.map((w, i) => (
                    <span key={data.tickers[i]}>
                      {i > 0 && " · "}
                      <span style={{ color: seriesColor(i) }}>{data.tickers[i]}</span>
                      {` ${(w * 100).toFixed(0)}%`}
                    </span>
                  ))}
                </p>
              </div>
              <div className="glass-sm flex items-center gap-2 px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: "var(--interaction)" }} />
                <span className="eyebrow text-secondary">Live analysis</span>
              </div>
            </div>
          </div>

          <Section title="Portfolio summary" subtitle="How the weighted portfolio moved over the lookback, and the risk and return figures that describe the whole series." delay={0}>
            <EquityCurve priceHistory={data.price_history} tickers={data.tickers} weights={data.weights} />
            <div className="mt-8">
              <PortfolioSummary metrics={data.portfolio_metrics} />
            </div>
          </Section>

          <div className="border-t border-white/[0.04]" />

          <Section title="Historical performance" subtitle="Normalized price history — each series indexed to 100 at period start." delay={50}>
            <PerformanceChart priceHistory={data.price_history} tickers={data.tickers} />
          </Section>

          <div className="border-t border-white/[0.04]" />

          <Section title="Per-asset metrics" subtitle="Return, volatility, Sharpe, beta, max drawdown, and VaR for each holding." delay={50}>
            <AssetTable tickers={data.tickers} weights={data.weights} stockMetrics={data.stock_metrics} />
          </Section>

          <div className="border-t border-white/[0.04]" />

          <Section title="Efficient frontier" subtitle="3,000 randomly weighted allocations mapped by risk and return. Your portfolio vs. Max Sharpe and Min Volatility optima." delay={50}>
            <EfficientFrontierChart frontier={data.efficient_frontier} currentMetrics={data.portfolio_metrics} />
          </Section>

          <div className="border-t border-white/[0.04]" />

          <Section title="Correlation matrix" subtitle="Pairwise Pearson correlation of daily returns — lower values signal diversification benefit." delay={50}>
            <CorrelationHeatmap correlation={data.correlation} />
          </Section>

          <div className="border-t border-white/[0.04]" />

          <Section title="Monte Carlo simulation" subtitle="10,000 forward paths via Geometric Brownian Motion with Cholesky-correlated shocks." delay={50}>
            <MonteCarloChart monteCarlo={data.monte_carlo} />
          </Section>

          <div className="border-t border-white/[0.04]" />

          <Section title="AI risk assessment" subtitle="Synthesized from all metrics above." delay={50}>
            <AISummary summary={data.ai_summary} />
          </Section>

          {/* Footer */}
          <footer className="mt-16 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between gap-2">
            <span className="text-2xs text-muted fig">Built by Aarit Panwar · FastAPI · NumPy · SciPy · React</span>
            <span className="text-2xs text-muted">Modern Portfolio Theory · GBM · Monte Carlo Simulation</span>
          </footer>
        </div>
      )}
    </div>
  );
}
