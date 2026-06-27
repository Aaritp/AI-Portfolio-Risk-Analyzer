import { useReveal } from "../hooks/useReveal";
import { pct, num } from "../colors";

function MetricCard({ label, value, cls, sub, delay, glow }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "visible" : ""} glass p-5 flex flex-col gap-2 cursor-default group transition-all duration-300`}
      style={{ transitionDelay: `${delay}ms`, ...(glow && { "--glow-color": glow }) }}
    >
      <span className="eyebrow">{label}</span>
      <span className={`fig font-display font-bold leading-none ${cls}`}
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}>
        {value}
      </span>
      {sub && <span className="text-2xs text-muted">{sub}</span>}
    </div>
  );
}

export default function PortfolioSummary({ metrics }) {
  const { return: ret, volatility, sharpe, var_95, var_99 } = metrics;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      <MetricCard delay={0}   label="Annualized return"   value={pct(ret)}       cls={ret >= 0 ? "text-emerald-DEFAULT" : "text-rose-DEFAULT"} />
      <MetricCard delay={80}  label="Annualized vol"      value={pct(volatility)} cls="text-primary" />
      <MetricCard delay={160} label="Sharpe ratio"        value={num(sharpe)}    cls={sharpe >= 1 ? "text-emerald-DEFAULT" : "text-primary"} sub="vs. risk-free rate" />
      <MetricCard delay={240} label="Daily VaR (95%)"     value={pct(var_95)}    cls="text-rose-DEFAULT" sub="1-in-20 day loss" />
      <MetricCard delay={320} label="Daily VaR (99%)"     value={pct(var_99)}    cls="text-rose-DEFAULT" sub="1-in-100 day loss" />
    </div>
  );
}
