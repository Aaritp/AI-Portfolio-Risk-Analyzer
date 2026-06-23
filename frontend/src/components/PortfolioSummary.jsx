import { pct, num, signClass } from "../colors";

function Metric({ label, value, cls = "", sub }) {
  return (
    <div className="card p-4">
      <div className="eyebrow mb-2">{label}</div>
      <div className={`fig font-display font-semibold text-2xl leading-none ${cls}`}>{value}</div>
      {sub && <div className="text-2xs text-muted mt-1.5">{sub}</div>}
    </div>
  );
}

export default function PortfolioSummary({ metrics }) {
  const { return: ret, volatility, sharpe, var_95, var_99 } = metrics;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      <Metric label="Annualized return" value={pct(ret)} cls={signClass(ret)} />
      <Metric label="Annualized volatility" value={pct(volatility)} cls="text-ink" />
      <Metric label="Sharpe ratio" value={num(sharpe)} cls={sharpe >= 1 ? "pos" : "text-ink"} sub="vs. risk-free rate" />
      <Metric label="Daily VaR (95%)" value={pct(var_95)} cls="neg" sub="1-in-20 day loss" />
      <Metric label="Daily VaR (99%)" value={pct(var_99)} cls="neg" sub="1-in-100 day loss" />
    </div>
  );
}
