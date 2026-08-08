import { useLayoutEffect, useRef, useState } from "react";
import { useReveal } from "../hooks/useReveal";
import { buildChart, portfolioSeries, fmtDate, signedPct, spansYears } from "../equityCurve";

const AXIS  = "#8FA0B8";   // 7.5:1 on #05080F
const VALUE = "#E2E8F0";
const LINE  = "#818CF8";   // portfolio accent — matches the Monte Carlo median

/** Container width in CSS pixels, measured before paint so the SVG can be
 *  drawn 1:1 — text stays at a fixed size instead of scaling with a viewBox. */
function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(Math.round(el.getBoundingClientRect().width));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, width];
}

export default function EquityCurve({ priceHistory, tickers, weights }) {
  const [wrapRef, width] = useWidth();
  const [revealRef, visible] = useReveal(0.15);

  const dates  = priceHistory[tickers[0]]?.dates || [];
  const series = portfolioSeries(priceHistory, tickers, weights);
  const ready  = series.length >= 2 && width > 0;

  const chart = ready ? buildChart({ width, series, dates }) : null;
  const withYear = spansYears(dates);

  return (
    <div ref={revealRef} className={`reveal ${visible ? "visible" : ""} glass p-5`}>
      <div className="flex items-center justify-between mb-1">
        <span className="eyebrow">Portfolio equity curve</span>
        <span className="text-2xs text-muted">Indexed to 100 at period start</span>
      </div>

      <div ref={wrapRef} className="mt-4" style={{ minHeight: 280 }}>
        {chart && (
          <div style={{
            clipPath: visible ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
            transition: "clip-path 1.4s cubic-bezier(0.16,1,0.3,1) 0.2s",
          }}>
            <svg width={width} height={chart.H} role="img"
                 aria-label={`Portfolio equity curve. ${chart.boxes.map(b => `${b.label.toLowerCase()} ${b.value}`).join(". ")}.`}>
              <defs>
                <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={LINE} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={LINE} stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid + value axis */}
              {chart.ticks.map((v, i) => (
                <g key={i}>
                  <line x1={chart.PL} x2={width - chart.PR} y1={chart.ys(v)} y2={chart.ys(v)}
                        stroke="rgba(255,255,255,0.05)" />
                  <text x={chart.PL - 8} y={chart.ys(v)} textAnchor="end" dominantBaseline="middle"
                        fontSize="10" fontFamily="JetBrains Mono" fill={AXIS}>
                    {signedPct(v / 100 - 1, 0)}
                  </text>
                </g>
              ))}

              {/* Date axis */}
              <text x={chart.PL} y={chart.H - 8} fontSize="10" fontFamily="JetBrains Mono"
                    fill={AXIS} textAnchor="start">
                {fmtDate(dates[0], withYear)}
              </text>
              <text x={width - chart.PR} y={chart.H - 8} fontSize="10" fontFamily="JetBrains Mono"
                    fill={AXIS} textAnchor="end">
                {fmtDate(dates[dates.length - 1], withYear)}
              </text>

              <path d={chart.areaPath} fill="url(#eqFill)" />
              <path d={chart.linePath} fill="none" stroke={LINE} strokeWidth="2"
                    strokeLinejoin="round" strokeLinecap="round" />

              {/* Annotations — hairline leader from box edge to the data point */}
              {chart.boxes.map(b => {
                const anchorX = Math.min(Math.max(b.px, b.x + 12), b.x + b.w - 12);
                const anchorY = b.y > b.py ? b.y : b.y + b.h;
                return (
                  <g key={b.label}>
                    <line x1={b.px} y1={b.py} x2={anchorX} y2={anchorY}
                          stroke={b.color} strokeOpacity="0.5" strokeWidth="1" />
                    <circle cx={b.px} cy={b.py} r="7" fill={b.color} fillOpacity="0.18" />
                    <circle cx={b.px} cy={b.py} r="3.5" fill={b.color} />
                    <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="3"
                          fill="rgba(5,8,15,0.92)" stroke={b.color} strokeOpacity="0.45" />
                    <text x={b.x + 10} y={b.y + (chart.compact ? 12 : 13)}
                          fontSize={chart.LBL} fontFamily="JetBrains Mono" fontWeight="600"
                          letterSpacing={chart.LBL * 0.12} fill={b.color}>
                      {b.label}
                    </text>
                    <text x={b.x + 10} y={b.y + (chart.compact ? 25 : 28)}
                          fontSize={chart.VAL} fontFamily="JetBrains Mono" fontWeight="500" fill={VALUE}>
                      {b.value}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      <p className="text-2xs text-secondary mt-3 max-w-2xl">
        Weighted portfolio value across the lookback. The two callouts mark moments that exist on this
        series — the period high and the deepest drawdown trough. Sharpe, volatility and VaR describe
        the series as a whole, so they are reported below rather than pinned to a date.
      </p>
    </div>
  );
}
