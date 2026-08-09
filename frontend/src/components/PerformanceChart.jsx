import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { seriesStyle, seriesBackground } from "../lib/seriesStyle";

/** Legend / tooltip key. Carries the dash pattern as well as the colour, so
 *  the two channels that separate later series are both present wherever a
 *  series is named — not only on the line itself. */
function SeriesKey({ index }) {
  return (
    <span className="inline-block w-4 h-[3px] rounded-sm align-middle shrink-0"
          style={{ backgroundImage: seriesBackground(index), backgroundColor: "transparent" }} />
  );
}

function CustomTooltip({ active, payload, label, tickers }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass px-3 py-2 text-xs fig">
      <div className="text-secondary mb-1.5">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <SeriesKey index={tickers.indexOf(p.dataKey)} />
          <span className="text-secondary">{p.dataKey}</span>
          <span className="text-primary ml-auto pl-4">{p.value?.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

function CustomLegend({ payload, tickers }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 pt-3">
      {payload.map(entry => (
        <span key={entry.value} className="inline-flex items-center gap-1.5 text-2xs fig text-secondary">
          <SeriesKey index={tickers.indexOf(entry.value)} />
          {entry.value}
        </span>
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

  // Underlit plane: no border, the content sits on a surface lit from below.
  // The bottom padding is what the wash needs to read as light rather than
  // as a band sitting behind the caption.
  return (
    <div className="underlit pb-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-1">
        <span className="eyebrow">Normalized performance</span>
        <span className="text-2xs text-muted">Indexed to 100 at period start</span>
      </div>
      <div className="h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          {/* left margin stays >= 0: a negative one pushes the Y axis outside
              the SVG and clips the tick labels to their last glyph. */}
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            {/* Grid stroke and tick fill come from :root via index.css — see
                the chart furniture block there. */}
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" interval={interval}
              tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
              tickFormatter={d => d.slice(2, 7)} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
              axisLine={false} tickLine={false} width={42} />
            <Tooltip content={<CustomTooltip tickers={tickers} />} />
            <Legend content={<CustomLegend tickers={tickers} />} />
            {tickers.map((t, i) => {
              const { color, dash } = seriesStyle(i);
              return (
                <Line key={t} type="monotone" dataKey={t} stroke={color} strokeDasharray={dash}
                  strokeWidth={1.75} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-2xs text-secondary mt-3">
        One style per holding — hue, and past the fifth a lighter weight and a dash — held
        consistent across every chart on this page.
      </p>
    </div>
  );
}
