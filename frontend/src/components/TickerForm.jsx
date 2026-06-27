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

export default function TickerForm({ onSubmit, loading }) {
  const [holdings, setHoldings] = useState(STARTER);
  const [draft,    setDraft]    = useState("");
  const [period,   setPeriod]   = useState("1y");
  const [riskFree, setRiskFree] = useState(5);
  const [err,      setErr]      = useState("");

  function add(e) {
    e?.preventDefault();
    const sym = draft.trim().toUpperCase();
    if (!sym) return;
    if (holdings.some(h => h.symbol === sym)) { setErr(`${sym} already added`); return; }
    if (holdings.length >= 10) { setErr("Max 10 holdings"); return; }
    setHoldings([...holdings, { symbol: sym, weight: 0 }]);
    setDraft(""); setErr("");
  }

  function remove(sym) {
    if (holdings.length <= 2) { setErr("Need at least 2 holdings"); return; }
    setHoldings(holdings.filter(h => h.symbol !== sym)); setErr("");
  }

  function setW(sym, val) {
    setHoldings(holdings.map(h => h.symbol === sym ? { ...h, weight: +val } : h));
  }

  function equalize() {
    const w = Math.round(100 / holdings.length);
    setHoldings(holdings.map(h => ({ ...h, weight: w })));
  }

  const total = holdings.reduce((s, h) => s + h.weight, 0);

  function submit(e) {
    e.preventDefault();
    if (holdings.length < 2) { setErr("Need at least 2 holdings"); return; }
    setErr("");
    onSubmit({ tickers: holdings.map(h => h.symbol), weights: holdings.map(h => h.weight), period, riskFreeRate: riskFree / 100 });
  }

  return (
    <form onSubmit={submit} className="glass p-6 text-left">
      {/* Holdings */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="eyebrow">Holdings</span>
          <button type="button" onClick={equalize}
            className="text-2xs fig text-secondary hover:text-primary transition-colors underline underline-offset-2">
            Equalize
          </button>
        </div>

        <div className="flex flex-col gap-3 mb-3">
          {holdings.map((h, i) => (
            <div key={h.symbol} className="group flex items-center gap-3">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seriesColor(i) }} />
              <span className="fig text-sm font-medium text-primary w-14 shrink-0">{h.symbol}</span>
              <div className="flex-1 relative">
                <input type="range" min="0" max="100" value={h.weight}
                  onChange={e => setW(h.symbol, e.target.value)}
                  className="w-full h-1 cursor-pointer rounded-full appearance-none"
                  style={{ accentColor: seriesColor(i) }}
                  aria-label={`${h.symbol} weight`} />
              </div>
              <span className="fig text-xs text-secondary w-9 text-right shrink-0">{h.weight}%</span>
              <button type="button" onClick={() => remove(h.symbol)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-rose-DEFAULT ml-1"
                aria-label={`Remove ${h.symbol}`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M9.5 3L6 6.5 2.5 3 2 3.5 5.5 7 2 10.5l.5.5L6 7.5 9.5 11l.5-.5L6.5 7 10 3.5z"/>
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input type="text" value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === "Enter" && add(e)}
            placeholder="Add ticker (e.g. NVDA)"
            className="input-base flex-1 px-3 py-2" />
          <button type="button" onClick={add}
            className="px-4 py-2 text-sm rounded-lg border border-white/10 text-secondary hover:text-primary hover:border-white/20 transition-all fig">
            Add
          </button>
        </div>

        <p className="text-2xs text-muted mt-2">
          Total: <span className="fig text-secondary">{total}%</span>
          {total !== 100 && " · auto-normalized on submit"}
        </p>
        {err && <p className="text-xs text-rose-DEFAULT mt-1">{err}</p>}
      </div>

      {/* Period + Risk-free */}
      <div className="flex flex-wrap gap-5 mb-5">
        <div>
          <div className="eyebrow mb-2">Lookback period</div>
          <div className="flex gap-1.5">
            {PERIODS.map(p => (
              <button key={p.v} type="button" onClick={() => setPeriod(p.v)}
                className={`fig text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  period === p.v
                    ? "bg-indigo-DEFAULT border-indigo-DEFAULT text-white"
                    : "border-white/10 text-secondary hover:border-white/20 hover:text-primary"
                }`}>
                {p.l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="eyebrow mb-2">Risk-free rate</div>
          <div className="flex items-center gap-2">
            <input type="number" step="0.1" min="0" max="20" value={riskFree}
              onChange={e => setRiskFree(e.target.value)}
              className="input-base w-16 px-2 py-1.5 text-center" />
            <span className="text-xs text-secondary">% / yr</span>
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-xl font-display font-semibold text-base text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: loading ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", boxShadow: loading ? "none" : "0 0 30px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.15)" }}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analyzing portfolio…
          </span>
        ) : "Run Analysis"}
      </button>
    </form>
  );
}
