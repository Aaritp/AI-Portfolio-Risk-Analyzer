import { useState } from "react";
import { seriesColor } from "../colors";

const PERIODS = [
  { v: "3mo", l: "3M" }, { v: "6mo", l: "6M" }, { v: "ytd", l: "YTD" },
  { v: "1y",  l: "1Y"  }, { v: "2y",  l: "2Y" }, { v: "5y",  l: "5Y"  },
];

const STARTER = [
  { symbol: "AAPL", weight: 25 },
  { symbol: "MSFT", weight: 25 },
  { symbol: "GOOGL", weight: 25 },
  { symbol: "JPM",  weight: 25 },
];

export default function TickerForm({ onSubmit, loading, hasResults }) {
  const [holdings, setHoldings] = useState(STARTER);
  const [draft, setDraft] = useState("");
  const [period, setPeriod] = useState("1y");
  const [riskFree, setRiskFree] = useState(5);
  const [err, setErr] = useState("");

  function add(e) {
    e.preventDefault();
    const sym = draft.trim().toUpperCase();
    if (!sym) return;
    if (holdings.some(h => h.symbol === sym)) { setErr(`${sym} already added.`); return; }
    if (holdings.length >= 10) { setErr("Max 10 holdings."); return; }
    setHoldings([...holdings, { symbol: sym, weight: 0 }]);
    setDraft(""); setErr("");
  }

  function remove(sym) {
    if (holdings.length <= 2) { setErr("Need at least 2 holdings."); return; }
    setHoldings(holdings.filter(h => h.symbol !== sym)); setErr("");
  }

  function setWeight(sym, val) {
    setHoldings(holdings.map(h => h.symbol === sym ? { ...h, weight: Number(val) } : h));
  }

  function equalize() {
    const w = Math.round(100 / holdings.length);
    setHoldings(holdings.map(h => ({ ...h, weight: w })));
  }

  const total = holdings.reduce((s, h) => s + h.weight, 0);

  function submit(e) {
    e.preventDefault();
    if (holdings.length < 2) { setErr("Need at least 2 holdings."); return; }
    setErr("");
    onSubmit({ tickers: holdings.map(h => h.symbol), weights: holdings.map(h => h.weight), period, riskFreeRate: riskFree / 100 });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 h-full">
      {/* Brand mark */}
      <div className="pb-4 border-b border-sidebar-border">
        <div className="text-white font-display font-semibold text-lg tracking-tight">Frontier</div>
        <div className="eyebrow mt-0.5" style={{ color: "#6B7280" }}>Portfolio Risk Engine</div>
      </div>

      {/* Holdings */}
      <div className="flex flex-col gap-3">
        <div className="eyebrow">Holdings</div>
        <div className="flex flex-col gap-2.5">
          {holdings.map((h, i) => (
            <div key={h.symbol} className="group">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: seriesColor(i) }} />
                <span className="fig text-white text-xs font-medium w-14 shrink-0">{h.symbol}</span>
                <span className="fig text-xs w-8 text-right shrink-0" style={{ color: "#9CA3AF" }}>{h.weight}%</span>
                <button type="button" onClick={() => remove(h.symbol)}
                  className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  style={{ color: "#6B7280" }} aria-label={`Remove ${h.symbol}`}>
                  ✕
                </button>
              </div>
              <input type="range" min="0" max="100" value={h.weight}
                onChange={e => setWeight(h.symbol, e.target.value)}
                className="w-full h-0.5 cursor-pointer"
                style={{ accentColor: seriesColor(i) }}
                aria-label={`${h.symbol} weight`} />
            </div>
          ))}
        </div>

        {/* Add ticker */}
        <div className="flex gap-1.5 mt-1">
          <input type="text" value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === "Enter" && add(e)}
            placeholder="Add ticker…"
            className="flex-1 bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-500 fig focus:outline-none focus:border-indigo-DEFAULT" />
          <button type="button" onClick={add}
            className="px-2.5 py-1.5 text-xs rounded border border-white/10 text-gray-300 hover:bg-white/5 transition-colors">
            Add
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-2xs" style={{ color: "#6B7280" }}>
            Total: <span className="fig text-white">{total}%</span>
            {total !== 100 && <span className="ml-1">(auto-normalized)</span>}
          </span>
          <button type="button" onClick={equalize}
            className="text-2xs underline underline-offset-2 transition-colors"
            style={{ color: "#6B7280" }}>
            Equalize
          </button>
        </div>

        {err && <p className="text-xs text-rose-DEFAULT">{err}</p>}
      </div>

      {/* Divider */}
      <div className="border-t border-sidebar-border" />

      {/* Period */}
      <div className="flex flex-col gap-2">
        <div className="eyebrow">Lookback period</div>
        <div className="flex flex-wrap gap-1">
          {PERIODS.map(p => (
            <button key={p.v} type="button" onClick={() => setPeriod(p.v)}
              className={`fig text-2xs px-2 py-1 rounded transition-colors ${
                period === p.v
                  ? "bg-indigo-DEFAULT text-white"
                  : "border border-white/10 text-gray-400 hover:border-white/20"
              }`}>
              {p.l}
            </button>
          ))}
        </div>
      </div>

      {/* Risk-free rate */}
      <div className="flex flex-col gap-2">
        <div className="eyebrow">Risk-free rate</div>
        <div className="flex items-center gap-2">
          <input type="number" step="0.1" min="0" max="20" value={riskFree}
            onChange={e => setRiskFree(e.target.value)}
            className="w-14 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs fig text-white focus:outline-none focus:border-indigo-DEFAULT" />
          <span className="text-xs" style={{ color: "#6B7280" }}>% annualized</span>
        </div>
      </div>

      {/* Submit */}
      <div className="mt-auto pt-4 border-t border-sidebar-border">
        <button type="submit" disabled={loading}
          className="w-full bg-indigo-DEFAULT hover:bg-indigo-dark text-white font-medium rounded-md py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Analyzing…" : hasResults ? "Re-run analysis" : "Run analysis"}
        </button>
        {loading && (
          <p className="text-2xs mt-2 text-center" style={{ color: "#6B7280" }}>
            Fetching data · mapping frontier · running 10k paths
          </p>
        )}
      </div>
    </form>
  );
}
