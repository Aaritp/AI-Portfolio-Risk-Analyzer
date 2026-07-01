import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { lineColor } from "../colors";

const G = "rgba(255,255,255,0.05)";
const A = "#64748B";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass px-3 py-2 text-xs fig">
      <div className="text-secondary mb-1.5">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted">{p.dataKey}</span>
          <span className="text-primary ml-auto pl-4">{p.value?.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

export default function PerformanceChart({ priceHistory, tickers }) {
  const dates = priceHistory[tickers[0]]?.dates || [];
  const data = dates.map((date, i) => {
    const row = { date };
    tickers.forEach(t => { row[t] = priceHistory[t]?.normalized?.[i]; });
    return row;
  });
  const interval = Math.max(1, Math.floor(dates.length / 6));

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-1">
        <span className="eyebrow">Normalized performance</span>
        <span className="text-2xs text-muted">Indexed to 100 at period start</span>
      </div>
      <div className="h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={G} vertical={false} />
            <XAxis dataKey="date" interval={interval}
              tick={{ fill: A, fontSize: 10, fontFamily: "IBM Plex Mono" }}
              tickFormatter={d => d.slice(2, 7)} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: A, fontSize: 10, fontFamily: "IBM Plex Mono" }}
              axisLine={false} tickLine={false} width={36} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "IBM Plex Mono", paddingTop: 12,
              color: "#94A3B8" }} />
            {tickers.map((t, i) => (
              <Line key={t} type="monotone" dataKey={t} stroke={lineColor(i)}
                strokeWidth={1.75} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
