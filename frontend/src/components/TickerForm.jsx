import { useState } from "react";
import { seriesColor } from "../colors";

const PERIODS = [
  { v: "3mo", l: "3M" }, { v: "6mo", l: "6M" }, { v: "ytd", l: "YTD" },
  { v: "1y", l: "1Y" }, { v: "2y", l: "2Y" }, { v: "5y", l: "5Y" },
];

const STARTER = [
  { symbol: "AAPL", weight: 25 },
  { symbol: "MSFT", weight: 25 },
  { symbol: "GOOGL", weight: 25 },
  { symbol: "JPM", weight: 25 },
];

export default function TickerForm({ onSubmit, onDemo, loading, hasResults }) {
  const [holdings, setHoldings] = useState(STARTER);
  const [draft, setDraft] = useState("");
  const [period, setPeriod] = useState("1y");
  const [riskFree, setRiskFree] = useState(5);
  const [err, setErr] = useState("");

  function add(e) {
    e.preventDefault();
    const sym = draft.trim().toUpperCase();
    if (!sym) return;
    if (holdings.some((h) => h.symbol === sym)) {
      setErr(`${sym} already added.`);
      return;
    }
    if (holdings.length >= 10) {
      setErr("Max 10 holdings.");
      return;
    }
    setHoldings([...holdings, { symbol: sym, weight: 0 }]);
    setDraft("");
    setErr("");
  }

  function remove(sym) {
    if (holdings.length <= 2) {
      setErr("Need at least 2 holdings.");
      return;
    }
    setHoldings(holdings.filter((h) => h.symbol !== sym));
    setErr("");
  }

  function setWeight(sym, val) {
    setHoldings(holdings.map((h) => (h.symbol === sym ? { ...h, weight: Number(val) } : h)));
  }

  function equalize() {
    const w = Math.round(100 / holdings.length);
    setHoldings(holdings.map((h) => ({ ...h, weight: w })));
  }

  const total = holdings.reduce((s, h) => s + h.weight, 0);

  function buildParams() {
    return {
      tickers: holdings.map((h) => h.symbol),
      weights: holdings.map((h) => h.weight),
      period,
      riskFreeRate: riskFree / 100,
    };
  }

  function submit(e) {
    e.preventDefault();
    if (holdings.length < 2) {
      setErr("Need at least 2 holdings.");
      return;
    }
    setErr("");
    onSubmit(buildParams());
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 h-full">
      {/* Brand */}
      <div className="pb-4 border-b border-sidebar-border flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-DEFAULT/15 ring-1 ring-indigo-DEFAULT/30 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-indigo-light fill-none stroke-current" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
          </svg>
        </div>
        <div>
          <div className="text-white font-display font-semibold text-lg tracking-tight leading-none">Frontier</div>
          <div className="eyebrow mt-1 text-sidebar-subtle">Risk Engine</div>
        </div>
      </div>

      {/* Holdings */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="eyebrow text-sidebar-muted">Holdings</div>
          <button
            type="button"
            onClick={equalize}
            className="text-2xs text-sidebar-subtle hover:text-indigo-light transition-colors"
          >
            Equal weight
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {holdings.map((h, i) => (
            <div key={h.symbol} className="group rounded-lg p-2 -mx-2 hover:bg-white/[0.03] transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full shrink-0 ring-2 ring-white/5" style={{ backgroundColor: seriesColor(i) }} />
                <span className="fig text-white text-xs font-medium">{h.symbol}</span>
                <span className="fig text-2xs ml-auto px-1.5 py-0.5 rounded bg-white/5 text-sidebar-muted">{h.weight}%</span>
                <button
                  type="button"
                  onClick={() => remove(h.symbol)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-sidebar-subtle hover:text-rose-DEFAULT"
                  aria-label={`Remove ${h.symbol}`}
                >
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current">
                    <path d="M4.7 3.3L8 6.6l3.3-3.3 1.4 1.4L9.4 8l3.3 3.3-1.4 1.4L8 9.4l-3.3 3.3-1.4-1.4L6.6 8 3.3 4.7z" />
                  </svg>
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={h.weight}
                onChange={(e) => setWeight(h.symbol, e.target.value)}
                className="range-pretty w-full"
                style={{ "--thumb": seriesColor(i) }}
                aria-label={`${h.symbol} weight`}
              />
            </div>
          ))}
        </div>

        {/* Add ticker */}
        <div className="flex gap-1.5 mt-1">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add(e)}
            placeholder="Add ticker…"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-sidebar-subtle fig focus:outline-none focus:border-indigo-DEFAULT focus:bg-white/[0.07] transition-colors"
          />
          <button
            type="button"
            onClick={add}
            className="px-3 py-2 text-xs rounded-lg border border-white/10 text-sidebar-muted hover:bg-white/5 hover:text-white transition-colors"
          >
            Add
          </button>
        </div>

        {/* Total + allocation bar */}
        <div className="mt-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-2xs text-sidebar-subtle">Total allocation</span>
            <span className="fig text-2xs text-white">{total}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden flex">
            {holdings.map((h, i) => (
              <span
                key={h.symbol}
                style={{ width: `${total ? (h.weight / total) * 100 : 0}%`, backgroundColor: seriesColor(i) }}
                className="h-full transition-all duration-300"
              />
            ))}
          </div>
          {total !== 100 && (
            <p className="text-2xs text-sidebar-subtle mt-1.5">Weights are auto-normalized to 100%.</p>
          )}
        </div>

        {err && <p className="text-xs text-rose-DEFAULT">{err}</p>}
      </div>

      <div className="border-t border-sidebar-border" />

      {/* Period */}
      <div className="flex flex-col gap-2">
        <div className="eyebrow text-sidebar-muted">Lookback period</div>
        <div className="grid grid-cols-3 gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.v}
              type="button"
              onClick={() => setPeriod(p.v)}
              className={`fig text-2xs py-1.5 rounded-lg transition-all ${
                period === p.v
                  ? "bg-indigo-DEFAULT text-white shadow-sm"
                  : "border border-white/10 text-sidebar-muted hover:border-white/25 hover:text-white"
              }`}
            >
              {p.l}
            </button>
          ))}
        </div>
      </div>

      {/* Risk-free */}
      <div className="flex flex-col gap-2">
        <div className="eyebrow text-sidebar-muted">Risk-free rate</div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0"
              max="20"
              value={riskFree}
              onChange={(e) => setRiskFree(e.target.value)}
              className="w-20 bg-white/5 border border-white/10 rounded-lg pl-3 pr-7 py-2 text-xs fig text-white focus:outline-none focus:border-indigo-DEFAULT transition-colors"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-2xs text-sidebar-subtle">%</span>
          </div>
          <span className="text-2xs text-sidebar-subtle">annualized</span>
        </div>
      </div>

      {/* Submit */}
      <div className="mt-auto pt-4 border-t border-sidebar-border flex flex-col gap-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-DEFAULT hover:bg-indigo-dark text-white font-medium rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? "Analyzing…" : hasResults ? "Re-run analysis" : "Run analysis"}
        </button>
        <button
          type="button"
          onClick={() => onDemo?.(buildParams())}
          disabled={loading}
          className="w-full text-sidebar-muted hover:text-white text-2xs py-1.5 transition-colors disabled:opacity-50"
        >
          or explore with demo data
        </button>
        {loading && (
          <p className="text-2xs mt-1 text-center text-sidebar-subtle">
            Fetching data · mapping frontier · 10k paths
          </p>
        )}
      </div>
    </form>
  );
}
