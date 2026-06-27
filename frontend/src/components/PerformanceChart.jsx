import { useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { seriesColor } from "../colors";

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const sorted = [...payload].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  return (
    <div className="card shadow-lg px-3 py-2.5">
      <div className="text-2xs text-muted mb-1.5 fig">{label}</div>
      <div className="flex flex-col gap-1">
        {sorted.map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="fig text-ink-secondary w-12">{p.dataKey}</span>
            <span className="fig text-ink font-medium ml-auto">{p.value?.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PerformanceChart({ priceHistory, tickers }) {
  const [hidden, setHidden] = useState({});
  const dates = priceHistory[tickers[0]]?.dates || [];
  const data = dates.map((date, i) => {
    const row = { date };
    tickers.forEach((t) => {
      row[t] = priceHistory[t]?.normalized?.[i];
    });
    return row;
  });

  const interval = Math.max(1, Math.floor(dates.length / 6));
  const toggle = (t) => setHidden((h) => ({ ...h, [t]: !h[t] }));

  return (
    <div className="card card-hover p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="eyebrow">Normalized performance</span>
        <span className="text-2xs text-subtle">Indexed to 100 at period start</span>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
            <defs>
              {tickers.map((t, i) => (
                <linearGradient key={t} id={`grad-${t}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={seriesColor(i)} stopOpacity={0.14} />
                  <stop offset="100%" stopColor={seriesColor(i)} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="#EEF1F5" vertical={false} />
            <XAxis
              dataKey="date"
              interval={interval}
              tick={{ fill: "#94A3B8", fontSize: 10, fontFamily: "IBM Plex Mono" }}
              tickFormatter={(d) => d.slice(2, 7)}
              axisLine={false}
              tickLine={false}
              dy={4}
            />
            <YAxis
              domain={["dataMin - 4", "dataMax + 4"]}
              tickFormatter={(v) => Math.round(v)}
              tick={{ fill: "#94A3B8", fontSize: 10, fontFamily: "IBM Plex Mono" }}
              axisLine={false}
              tickLine={false}
              width={40}
              allowDecimals={false}
            />
            <Tooltip content={<ChartTip />} cursor={{ stroke: "#CBD5E1", strokeDasharray: "3 3" }} />
            {tickers.map((t, i) => (
              <Area
                key={t}
                type="monotone"
                dataKey={t}
                stroke={seriesColor(i)}
                strokeWidth={1.9}
                fill={`url(#grad-${t})`}
                dot={false}
                activeDot={{ r: 3.5, strokeWidth: 0 }}
                hide={hidden[t]}
                isAnimationActive
                animationDuration={700}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* Interactive legend */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border-base">
        {tickers.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => toggle(t)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-2xs fig transition-all ${
              hidden[t]
                ? "border-border-base text-subtle line-through"
                : "border-border-strong text-ink-secondary hover:bg-canvas"
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hidden[t] ? "#CBD5E1" : seriesColor(i) }} />
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
