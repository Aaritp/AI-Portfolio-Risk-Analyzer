import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { seriesColor } from "../colors";

export default function PerformanceChart({ priceHistory, tickers }) {
  const dates = priceHistory[tickers[0]]?.dates || [];
  const data = dates.map((date, i) => {
    const row = { date };
    tickers.forEach(t => { row[t] = priceHistory[t]?.normalized?.[i]; });
    return row;
  });

  const interval = Math.max(1, Math.floor(dates.length / 6));

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="eyebrow">Normalized performance</span>
        <span className="text-2xs text-muted">Indexed to 100 at period start</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="date" interval={interval}
              tick={{ fill: "#9CA3AF", fontSize: 10, fontFamily: "IBM Plex Mono" }}
              tickFormatter={d => d.slice(2, 7)} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#9CA3AF", fontSize: 10, fontFamily: "IBM Plex Mono" }}
              axisLine={false} tickLine={false} width={36} />
            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 6,
              fontFamily: "IBM Plex Mono", fontSize: 11 }}
              formatter={(v, n) => [v?.toFixed(2), n]} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "IBM Plex Mono", paddingTop: 8 }} />
            {tickers.map((t, i) => (
              <Line key={t} type="monotone" dataKey={t} stroke={seriesColor(i)}
                strokeWidth={1.75} dot={false} activeDot={{ r: 3 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
