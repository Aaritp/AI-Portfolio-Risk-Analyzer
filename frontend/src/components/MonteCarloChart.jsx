import { usd, pct, signClass } from "../colors";

const W = 800, H = 300;
const PL = 58, PR = 12, PT = 12, PB = 28;
const PW = W - PL - PR, PH = H - PT - PB;

function pctAt(sorted, q) { return sorted[Math.floor(q * (sorted.length - 1))]; }

export default function MonteCarloChart({ monteCarlo }) {
  const { sample_paths, initial_value, percentile_outcomes, cvar, prob_loss, n_simulations, n_days } = monteCarlo;

  const n = sample_paths[0].length;

  const bands = Array.from({ length: n }, (_, t) => {
    const vals = sample_paths.map(p => p[t]).sort((a, b) => a - b);
    return { p5: pctAt(vals,0.05), p25: pctAt(vals,0.25), p50: pctAt(vals,0.5), p75: pctAt(vals,0.75), p95: pctAt(vals,0.95) };
  });

  let minV = Infinity, maxV = -Infinity;
  sample_paths.forEach(p => p.forEach(v => { if(v < minV) minV=v; if(v > maxV) maxV=v; }));
  const pad = (maxV - minV) * 0.05;
  minV -= pad; maxV += pad;

  const xs = i => PL + (i / (n-1)) * PW;
  const ys = v => PT + (1 - (v - minV) / (maxV - minV)) * PH;

  const band = (lo, hi) => {
    let d = "";
    bands.forEach((b,i) => { d += `${i===0?"M":"L"}${xs(i)},${ys(b[hi])} `; });
    for(let i=bands.length-1;i>=0;i--) { d += `L${xs(i)},${ys(bands[i][lo])} `; }
    return d + "Z";
  };

  const line = k => bands.map((b,i) => `${i===0?"M":"L"}${xs(i)},${ys(b[k])}`).join(" ");

  const paths = sample_paths.filter((_,i) => i%3===0);
  const ticks = Array.from({length:5},(_,i) => minV + ((maxV-minV)*i)/4);
  const yrs = (n_days/252).toFixed(0);

  return (
    <div className="card card-hover p-5">
      <div className="flex items-center justify-between mb-1">
        <span className="eyebrow">Monte Carlo simulation</span>
        <span className="text-2xs text-subtle">{n_simulations.toLocaleString()} paths · GBM · Cholesky correlation</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        {[
          { label: "Median outcome", value: usd(percentile_outcomes.p50), cls: "text-ink" },
          { label: "5th – 95th pctl", value: `${usd(percentile_outcomes.p5)} – ${usd(percentile_outcomes.p95)}`, cls: "text-ink", small: true },
          { label: "Prob. of loss", value: pct(prob_loss,1), cls: prob_loss > 0.3 ? "neg" : "text-ink" },
          { label: "CVaR (95%)", value: pct(cvar.cvar_95,1), cls: signClass(cvar.cvar_95), sub: "avg loss in worst 5%" },
        ].map(({ label, value, cls, small, sub }) => (
          <div key={label} className="rounded-xl bg-canvas/70 border border-border-base p-3">
            <div className="eyebrow mb-1.5">{label}</div>
            <div className={`fig font-display font-semibold leading-none ${small ? "text-sm" : "text-xl"} ${cls}`}>{value}</div>
            {sub && <div className="text-2xs text-subtle mt-1.5">{sub}</div>}
          </div>
        ))}
      </div>

      {/* Fan chart */}
      <div style={{ animation: "mcIn 1s ease-out both", overflow: "hidden" }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {ticks.map((v,i) => (
            <g key={i}>
              <line x1={PL} x2={W-PR} y1={ys(v)} y2={ys(v)} stroke="#EEF1F5" />
              <text x={PL-6} y={ys(v)} textAnchor="end" dominantBaseline="middle"
                fontSize="10" fontFamily="IBM Plex Mono" fill="#9CA3AF">{usd(v)}</text>
            </g>
          ))}
          <text x={xs(0)} y={H-6} fontSize="10" fontFamily="IBM Plex Mono" fill="#9CA3AF" textAnchor="start">Today</text>
          <text x={xs(n-1)} y={H-6} fontSize="10" fontFamily="IBM Plex Mono" fill="#9CA3AF" textAnchor="end">+{yrs}Y</text>

          {paths.map((p,i) => (
            <path key={i} d={p.map((v,t)=>`${t===0?"M":"L"}${xs(t)},${ys(v)}`).join(" ")}
              fill="none" stroke="#D97706" strokeWidth="0.5" strokeOpacity="0.12" />
          ))}

          <path d={band("p5","p95")} fill="#6366F1" fillOpacity="0.08" />
          <path d={band("p25","p75")} fill="#6366F1" fillOpacity="0.16" />
          <path d={line("p50")} fill="none" stroke="#4F46E5" strokeWidth="2" />

          <circle cx={xs(0)} cy={ys(initial_value)} r="3" fill="#111827" />
          <line x1={xs(0)} x2={W-PR} y1={ys(initial_value)} y2={ys(initial_value)}
            stroke="#111827" strokeOpacity="0.15" strokeDasharray="3 3" />
        </svg>
      </div>

      <div className="flex flex-wrap gap-4 mt-3">
        {[
          { type:"band", op:0.16, label:"25th–75th percentile", color:"#6366F1" },
          { type:"band", op:0.08, label:"5th–95th percentile", color:"#6366F1" },
          { type:"line", label:"Median path", color:"#4F46E5" },
          { type:"dot",  label:`Starting value (${usd(initial_value)})`, color:"#111827" },
        ].map(({ type,op,label,color }) => (
          <span key={label} className="inline-flex items-center gap-1.5 text-2xs text-muted">
            {type==="band" && <span className="w-4 h-2 rounded-sm" style={{backgroundColor:color,opacity:op*5}} />}
            {type==="line" && <span className="w-4 border-t-2" style={{borderColor:color}} />}
            {type==="dot"  && <span className="w-2 h-2 rounded-full" style={{backgroundColor:color}} />}
            {label}
          </span>
        ))}
      </div>

      <p className="text-2xs text-muted mt-3 max-w-xl">
        Each path simulates correlated daily returns via Geometric Brownian Motion calibrated to historical drift and covariance (Cholesky decomposition). Bands show the distribution across all {n_simulations.toLocaleString()} simulations.
      </p>
      <style>{`@keyframes mcIn{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0% 0 0)}}
      @media(prefers-reduced-motion:reduce){svg{animation:none}}`}</style>
    </div>
  );
}
