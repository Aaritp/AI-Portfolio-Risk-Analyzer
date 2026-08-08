import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { lineColor } from "../colors";

const G = "rgba(255,255,255,0.05)";
const A = "#8FA0B8";  // axis ticks — 7.5:1 on #05080F (WCAG AA)
const L = "#A9B6C7";  // legend text — 9.7:1

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass px-3 py-2 text-xs fig">
      <div className="text-secondary mb-1.5">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-secondary">{p.dataKey}</span>
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
          {/* left margin stays >= 0: a negative one pushes the Y axis outside
              the SVG and clips the tick labels to their last glyph. */}
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={G} vertical={false} />
            <XAxis dataKey="date" interval={interval}
              tick={{ fill: A, fontSize: 10, fontFamily: "JetBrains Mono" }}
              tickFormatter={d => d.slice(2, 7)} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: A, fontSize: 10, fontFamily: "JetBrains Mono" }}
              axisLine={false} tickLine={false} width={42} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "JetBrains Mono", paddingTop: 12 }}
              formatter={v => <span style={{ color: L }}>{v}</span>} />
            {tickers.map((t, i) => (
              <Line key={t} type="monotone" dataKey={t} stroke={lineColor(i)}
                strokeWidth={1.75} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-2xs text-secondary mt-3">
        One hue per holding, held consistent across every chart on this page.
      </p>
    </div>
  );
}
