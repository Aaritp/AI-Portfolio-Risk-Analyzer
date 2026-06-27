import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip } from "recharts";
import { pct } from "../colors";

const G = "rgba(255,255,255,0.05)";
const A = "#475569";

function Tip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="glass px-3 py-2 text-xs fig">
      <div className="text-secondary font-medium mb-1">{p.label || "Portfolio"}</div>
      <div className="text-muted">Return <span className="text-primary ml-2">{pct(p.return)}</span></div>
      <div className="text-muted">Vol <span className="text-primary ml-2">{pct(p.volatility)}</span></div>
      <div className="text-muted">Sharpe <span className="text-primary ml-2">{p.sharpe?.toFixed(2)}</span></div>
    </div>
  );
}

export default function EfficientFrontierChart({ frontier, currentMetrics }) {
  const cloud = frontier.portfolios
    .filter((_, i) => i % 4 === 0)
    .map(p => ({ x: p.volatility, return: p.return, volatility: p.volatility, sharpe: p.sharpe }));

  const make = (m, label) => ({ x: m.volatility, return: m.return, volatility: m.volatility, sharpe: m.sharpe, label });

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-1">
        <span className="eyebrow">Efficient frontier</span>
        <span className="text-2xs text-muted">{frontier.portfolios.length.toLocaleString()} simulated allocations</span>
      </div>
      <p className="text-xs text-muted mb-4">X · annualized volatility &nbsp;/&nbsp; Y · annualized return</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid stroke={G} />
            <XAxis type="number" dataKey="volatility" tickFormatter={v => pct(v, 0)}
              tick={{ fill: A, fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
            <YAxis type="number" dataKey="return" tickFormatter={v => pct(v, 0)}
              tick={{ fill: A, fontSize: 10, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} width={44} />
            <ZAxis range={[14, 14]} />
            <Tooltip content={<Tip />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
            <Scatter data={cloud} fill="#6366F1" fillOpacity={0.15} isAnimationActive={false} />
            <Scatter data={[make(frontier.min_vol_metrics, "Min volatility")]} isAnimationActive={false}
              shape={p => <circle cx={p.cx} cy={p.cy} r={5} fill="#34D399" style={{ filter: "drop-shadow(0 0 6px #34D399)" }} />} />
            <Scatter data={[make(frontier.optimal_metrics, "Max Sharpe")]} isAnimationActive={false}
              shape={p => <circle cx={p.cx} cy={p.cy} r={5} fill="#FBBF24" style={{ filter: "drop-shadow(0 0 6px #FBBF24)" }} />} />
            <Scatter data={[make(currentMetrics, "Your portfolio")]} isAnimationActive={false}
              shape={p => <circle cx={p.cx} cy={p.cy} r={7} fill="#818CF8" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} style={{ filter: "drop-shadow(0 0 8px #6366F1)" }} />} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-5 mt-3">
        {[
          { color: "#818CF8", label: "Your portfolio" },
          { color: "#FBBF24", label: "Max Sharpe" },
          { color: "#34D399", label: "Min volatility" },
          { color: "#6366F1", label: "Simulated", faded: true },
        ].map(({ color, label, faded }) => (
          <span key={label} className="inline-flex items-center gap-1.5 text-2xs text-muted">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color, opacity: faded ? 0.4 : 1 }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
