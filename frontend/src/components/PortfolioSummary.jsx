import { useEffect, useRef, useState } from "react";
import { pct, num, signClass } from "../colors";

// Lightweight count-up for the headline figures
function useCountUp(target, duration = 800) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (typeof target !== "number" || Number.isNaN(target)) {
      setVal(target);
      return;
    }
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVal(target);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(target * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

const ACCENTS = {
  pos: "#059669",
  neg: "#E11D48",
  neutral: "#6366F1",
};

function Metric({ label, raw, format, cls = "text-ink", accent = "neutral", sub }) {
  const animated = useCountUp(raw);
  const value = format(animated);
  return (
    <div className="card card-hover relative p-4 overflow-hidden">
      <span
        className="absolute left-0 top-0 h-full w-1"
        style={{ backgroundColor: ACCENTS[accent], opacity: 0.85 }}
        aria-hidden="true"
      />
      <div className="eyebrow mb-2.5 pl-1">{label}</div>
      <div className={`fig font-display font-semibold text-[28px] leading-none pl-1 ${cls}`}>{value}</div>
      {sub && <div className="text-2xs text-subtle mt-2 pl-1">{sub}</div>}
    </div>
  );
}

export default function PortfolioSummary({ metrics }) {
  const { return: ret, volatility, sharpe, var_95, var_99 } = metrics;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      <Metric
        label="Annualized return"
        raw={ret}
        format={(v) => pct(v)}
        cls={signClass(ret)}
        accent={ret >= 0 ? "pos" : "neg"}
        sub="geometric, annualized"
      />
      <Metric
        label="Annualized volatility"
        raw={volatility}
        format={(v) => pct(v)}
        cls="text-ink"
        accent="neutral"
        sub="standard deviation"
      />
      <Metric
        label="Sharpe ratio"
        raw={sharpe}
        format={(v) => num(v)}
        cls={sharpe >= 1 ? "pos" : "text-ink"}
        accent={sharpe >= 1 ? "pos" : "neutral"}
        sub="vs. risk-free rate"
      />
      <Metric
        label="Daily VaR (95%)"
        raw={var_95}
        format={(v) => pct(v)}
        cls="neg"
        accent="neg"
        sub="1-in-20 day loss"
      />
      <Metric
        label="Daily VaR (99%)"
        raw={var_99}
        format={(v) => pct(v)}
        cls="neg"
        accent="neg"
        sub="1-in-100 day loss"
      />
    </div>
  );
}
