import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip } from "recharts";
import { pct } from "../colors";

function Tip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="card px-3 py-2 text-xs fig shadow-lg">
      <div className="font-medium text-ink mb-1">{p.label || "Portfolio"}</div>
      <div className="text-muted">Return: <span className="text-ink">{pct(p.return)}</span></div>
      <div className="text-muted">Vol: <span className="text-ink">{pct(p.volatility)}</span></div>
      <div className="text-muted">Sharpe: <span className="text-ink">{p.sharpe?.toFixed(2)}</span></div>
    </div>
  );
}

function Dot({ label, color, faded }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color, opacity: faded ? 0.35 : 1 }} />
      <span className="text-2xs">{label}</span>
    </span>
  );
}

export default function EfficientFrontierChart({ frontier, currentMetrics }) {
  const cloud = frontier.portfolios
    .filter((_, i) => i % 4 === 0)
    .map(p => ({ x: p.volatility, return: p.return, volatility: p.volatility, sharpe: p.sharpe }));

  const make = (m, label) => ({ x: m.volatility, return: m.return, volatility: m.volatility, sharpe: m.sharpe, label });

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <span className="eyebrow">Efficient frontier</span>
        <span className="text-2xs text-muted">{frontier.portfolios.length.toLocaleString()} simulated allocations</span>
      </div>
      <p className="text-xs text-muted mb-4">X-axis: annualized volatility · Y-axis: annualized return</p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid stroke="#F3F4F6" />
            <XAxis type="number" dataKey="volatility" name="Volatility"
              tickFormatter={v => pct(v, 0)}
              tick={{ fill: "#9CA3AF", fontSize: 10, fontFamily: "IBM Plex Mono" }}
              axisLine={false} tickLine={false} />
            <YAxis type="number" dataKey="return" name="Return"
              tickFormatter={v => pct(v, 0)}
              tick={{ fill: "#9CA3AF", fontSize: 10, fontFamily: "IBM Plex Mono" }}
              axisLine={false} tickLine={false} width={44} />
            <ZAxis range={[14, 14]} />
            <Tooltip content={<Tip />} cursor={{ stroke: "#E5E7EB" }} />
            <Scatter data={cloud} fill="#6366F1" fillOpacity={0.12} isAnimationActive={false} />
            <Scatter data={[make(frontier.min_vol_metrics, "Min volatility")]} isAnimationActive={false}
              shape={p => <circle cx={p.cx} cy={p.cy} r={5} fill="#0D9488" />} />
            <Scatter data={[make(frontier.optimal_metrics, "Max Sharpe")]} isAnimationActive={false}
              shape={p => <circle cx={p.cx} cy={p.cy} r={5} fill="#059669" />} />
            <Scatter data={[make(currentMetrics, "Your portfolio")]} isAnimationActive={false}
              shape={p => <circle cx={p.cx} cy={p.cy} r={7} fill="#6366F1" stroke="#fff" strokeWidth={2} />} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-4 mt-3">
        <Dot color="#6366F1" label="Your portfolio" />
        <Dot color="#059669" label="Max Sharpe" />
        <Dot color="#0D9488" label="Min volatility" />
        <Dot color="#6366F1" label="Simulated allocations" faded />
      </div>
    </div>
  );
}
