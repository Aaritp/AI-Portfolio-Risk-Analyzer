import { pct, num } from "../colors";

/** One cell of the rule strip: mono label, large figure, optional grey sub-line.
 *  No box of its own — the hairlines in .rule-strip do all the dividing. */
function Cell({ label, value, cls, sub }) {
  return (
    <div>
      <div className="eyebrow mb-2">{label}</div>
      <div className={`fig font-display font-bold leading-none ${cls}`}
           style={{ fontSize: "clamp(1.5rem, 2.6vw, 2.125rem)" }}>
        {value}
      </div>
      {sub && <div className="text-2xs text-muted mt-2">{sub}</div>}
    </div>
  );
}

export default function PortfolioSummary({ metrics }) {
  const { return: ret, volatility, sharpe, var_95, var_99 } = metrics;

  return (
    <div className="rule-strip">
      <Cell label="Annualized return" value={pct(ret)}        cls={ret >= 0 ? "text-emerald-DEFAULT" : "text-rose-DEFAULT"} sub="mean daily × 252" />
      <Cell label="Annualized vol"    value={pct(volatility)} cls="text-primary" sub="σ daily × √252" />
      <Cell label="Sharpe ratio"      value={num(sharpe)}     cls={sharpe >= 1 ? "text-emerald-DEFAULT" : "text-primary"} sub="vs. risk-free rate" />
      <Cell label="Daily VaR (95%)"   value={pct(var_95)}     cls="text-rose-DEFAULT" sub="1-in-20 day loss" />
      <Cell label="Daily VaR (99%)"   value={pct(var_99)}     cls="text-rose-DEFAULT" sub="1-in-100 day loss" />
    </div>
  );
}
