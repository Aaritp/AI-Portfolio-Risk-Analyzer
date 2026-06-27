import { useReveal } from "../hooks/useReveal";
import { usd, pct, signClass } from "../colors";

const W = 900, H = 320, PL = 68, PR = 16, PT = 12, PB = 32;
const PW = W - PL - PR, PH = H - PT - PB;

function pAt(sorted, q) { return sorted[Math.floor(q * (sorted.length - 1))]; }

export default function MonteCarloChart({ monteCarlo }) {
  const { sample_paths, initial_value, percentile_outcomes, cvar, prob_loss, n_simulations, n_days } = monteCarlo;
  const [ref, visible] = useReveal(0.1);

  const n = sample_paths[0].length;

  const bands = Array.from({ length: n }, (_, t) => {
    const vals = sample_paths.map(p => p[t]).sort((a, b) => a - b);
    return { p5: pAt(vals,0.05), p25: pAt(vals,0.25), p50: pAt(vals,0.5), p75: pAt(vals,0.75), p95: pAt(vals,0.95) };
  });

  let minV = Infinity, maxV = -Infinity;
  sample_paths.forEach(p => p.forEach(v => { if (v < minV) minV = v; if (v > maxV) maxV = v; }));
  const pad = (maxV - minV) * 0.06;
  minV -= pad; maxV += pad;

  const xs = i => PL + (i / (n - 1)) * PW;
  const ys = v => PT + (1 - (v - minV) / (maxV - minV)) * PH;

  const band = (lo, hi) => {
    let d = "";
    bands.forEach((b, i) => { d += `${i === 0 ? "M" : "L"}${xs(i).toFixed(1)},${ys(b[hi]).toFixed(1)} `; });
    for (let i = bands.length - 1; i >= 0; i--) d += `L${xs(i).toFixed(1)},${ys(bands[i][lo]).toFixed(1)} `;
    return d + "Z";
  };

  const line = k => bands.map((b, i) => `${i === 0 ? "M" : "L"}${xs(i).toFixed(1)},${ys(b[k]).toFixed(1)}`).join(" ");

  const paths = sample_paths.filter((_, i) => i % 3 === 0);
  const ticks = Array.from({ length: 5 }, (_, i) => minV + ((maxV - minV) * i) / 4);
  const yrs = (n_days / 252).toFixed(0);

  const stats = [
    { label: "Median outcome",     value: usd(percentile_outcomes.p50), cls: "text-primary" },
    { label: "5th – 95th pctl",   value: `${usd(percentile_outcomes.p5)} – ${usd(percentile_outcomes.p95)}`, cls: "text-primary", sm: true },
    { label: "Probability of loss", value: pct(prob_loss, 1), cls: prob_loss > 0.3 ? "text-rose-DEFAULT" : "text-emerald-DEFAULT" },
    { label: "CVaR (95%)",         value: pct(cvar.cvar_95, 1), cls: signClass(cvar.cvar_95), sub: "avg loss in worst 5%" },
  ];

  return (
    <div ref={ref} className={`reveal ${visible ? "visible" : ""} glass p-5`}>
      <div className="flex items-center justify-between mb-1">
        <span className="eyebrow">Monte Carlo simulation</span>
        <span className="text-2xs text-muted">{n_simulations.toLocaleString()} paths · GBM · Cholesky</span>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-5 pb-5 border-b border-white/[0.06]">
        {stats.map(({ label, value, cls, sub, sm }) => (
          <div key={label}>
            <div className="eyebrow mb-1.5">{label}</div>
            <div className={`fig font-display font-bold leading-none ${sm ? "text-base" : "text-2xl"} ${cls}`}>{value}</div>
            {sub && <div className="text-2xs text-muted mt-1">{sub}</div>}
          </div>
        ))}
      </div>

      {/* Fan chart */}
      <div style={{ clipPath: visible ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)", transition: "clip-path 1.4s cubic-bezier(0.16,1,0.3,1) 0.3s" }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
             aria-label="Monte Carlo fan chart showing simulated portfolio outcomes">
          <defs>
            <linearGradient id="mcFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.08" />
            </linearGradient>
          </defs>

          {/* Grid */}
          {ticks.map((v, i) => (
            <g key={i}>
              <line x1={PL} x2={W - PR} y1={ys(v)} y2={ys(v)} stroke="rgba(255,255,255,0.05)" />
              <text x={PL - 8} y={ys(v)} textAnchor="end" dominantBaseline="middle"
                fontSize="10" fontFamily="IBM Plex Mono" fill="#475569">{usd(v)}</text>
            </g>
          ))}

          {/* X labels */}
          <text x={xs(0)} y={H - 8} fontSize="10" fontFamily="IBM Plex Mono" fill="#475569" textAnchor="start">Today</text>
          <text x={xs(n - 1)} y={H - 8} fontSize="10" fontFamily="IBM Plex Mono" fill="#475569" textAnchor="end">+{yrs}Y</text>

          {/* Individual paths */}
          {paths.map((p, i) => (
            <path key={i}
              d={p.map((v, t) => `${t === 0 ? "M" : "L"}${xs(t).toFixed(1)},${ys(v).toFixed(1)}`).join(" ")}
              fill="none" stroke="#F59E0B" strokeWidth="0.4" strokeOpacity="0.10" />
          ))}

          {/* Bands */}
          <path d={band("p5",  "p95")} fill="#6366F1" fillOpacity="0.07" />
          <path d={band("p25", "p75")} fill="#6366F1" fillOpacity="0.14" />

          {/* Gradient fill under median */}
          <path d={`${line("p50")} L${xs(n-1)},${ys(minV)} L${xs(0)},${ys(minV)} Z`} fill="url(#mcFade)" />

          {/* Median line */}
          <path d={line("p50")} fill="none" stroke="#818CF8" strokeWidth="2"
            style={{ filter: "drop-shadow(0 0 6px rgba(99,102,241,0.6))" }} />

          {/* Starting point */}
          <circle cx={xs(0)} cy={ys(initial_value)} r="4" fill="#818CF8"
            style={{ filter: "drop-shadow(0 0 8px rgba(99,102,241,0.8))" }} />
          <line x1={xs(0)} x2={W - PR} y1={ys(initial_value)} y2={ys(initial_value)}
            stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-5 mt-3">
        {[
          { type: "band", op: 0.7, label: "25th–75th percentile", color: "#6366F1" },
          { type: "band", op: 0.35, label: "5th–95th percentile", color: "#6366F1" },
          { type: "line", label: "Median path", color: "#818CF8" },
          { type: "dot",  label: `Starting value (${usd(initial_value)})`, color: "#818CF8" },
        ].map(({ type, op, label, color }) => (
          <span key={label} className="inline-flex items-center gap-1.5 text-2xs text-muted">
            {type === "band" && <span className="w-4 h-2 rounded-sm" style={{ backgroundColor: color, opacity: op }} />}
            {type === "line" && <span className="w-4 border-t-2" style={{ borderColor: color }} />}
            {type === "dot"  && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />}
            {label}
          </span>
        ))}
      </div>

      <p className="text-2xs text-muted mt-3 max-w-2xl">
        Each path simulates correlated daily returns via Geometric Brownian Motion, calibrated to historical
        drift and covariance using Cholesky decomposition. Bands show the distribution across all {n_simulations.toLocaleString()} simulations.
      </p>
    </div>
  );
}
