import { useId, useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { seriesStyle, seriesBackground } from "../lib/seriesStyle";
import { useChartWindow } from "../hooks/useChartWindow";
import { niceAxis } from "../lib/chartWindow";
import { ChartToolbar, ChartScrollbar } from "./ChartControls";

/** Legend / tooltip key. Carries the dash pattern as well as the colour, so
 *  the two channels that separate later series are both present wherever a
 *  series is named — not only on the line itself. */
function SeriesKey({ index }) {
  return (
    <span className="series-key inline-block w-4 h-[3px] rounded-sm align-middle shrink-0"
          style={{ backgroundImage: seriesBackground(index), backgroundColor: "transparent" }} />
  );
}

function CustomTooltip({ active, payload, label, tickers, isolated }) {
  if (!active || !payload?.length) return null;
  // While a series is isolated the other nine are drawn at a sixth opacity —
  // listing their values here would put back exactly the wall of numbers the
  // isolation was asked to clear.
  const rows = isolated ? payload.filter(p => p.dataKey === isolated) : payload;
  return (
    <div className="glass px-3 py-2 text-xs fig">
      <div className="text-secondary mb-1.5">{label}</div>
      {rows.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <SeriesKey index={tickers.indexOf(p.dataKey)} />
          <span className="text-secondary">{p.dataKey}</span>
          <span className="text-primary ml-auto pl-4">{p.value?.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

/** Legend entries double as the isolation control — clicking a name is how
 *  you pull one line out of ten, and clicking it again puts it back. */
function CustomLegend({ payload, tickers, isolated, onIsolate }) {
  return (
    <div className="flex flex-wrap justify-center items-center gap-x-1 gap-y-1.5 pt-3">
      {payload.map(entry => {
        const name = entry.value;
        const on = isolated === name;
        return (
          <button key={name} type="button"
                  className={`chart-legend-item ${isolated && !on ? "is-dim" : ""}`}
                  aria-pressed={on}
                  title={on ? `Show all series` : `Isolate ${name}`}
                  onClick={() => onIsolate(on ? null : name)}>
            <SeriesKey index={tickers.indexOf(name)} />
            {name}
          </button>
        );
      })}
      {isolated && (
        <button type="button" className="chart-showall ml-1.5" onClick={() => onIsolate(null)}>
          Show all
        </button>
      )}
    </div>
  );
}

export default function PerformanceChart({ priceHistory, tickers }) {
  const dates = priceHistory[tickers[0]]?.dates || [];
  const win = useChartWindow(dates.length);
  const [isolated, setIsolated] = useState(null);
  const plotId = useId();

  const data = useMemo(() => dates.map((date, i) => {
    const row = { date };
    tickers.forEach(t => { row[t] = priceHistory[t]?.normalized?.[i]; });
    return row;
  }), [priceHistory, tickers, dates]);

  const view = useMemo(() => data.slice(win.start, win.end), [data, win.start, win.end]);

  // The value axis follows the window, not the series. Isolation deliberately
  // does not enter into it: the dimmed lines are still drawn, so the axis has
  // to still contain them.
  const axis = useMemo(
    () => niceAxis(view.flatMap(row => tickers.map(t => row[t]))),
    [view, tickers],
  );

  const interval = Math.max(1, Math.floor(view.length / 6));

  function reset() {
    win.reset();
    setIsolated(null);
  }

  // Underlit plane: no border, the content sits on a surface lit from below.
  // The bottom padding is what the wash needs to read as light rather than
  // as a band sitting behind the caption.
  return (
    <div className="underlit pb-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-1">
        <span className="eyebrow">Normalized performance</span>
        <span className="text-2xs text-muted">Indexed to 100 at period start</span>
      </div>

      <div className="mt-4">
        <ChartToolbar win={win} dates={dates} onReset={reset}
                      canReset={win.zoomed || isolated !== null} />
      </div>

      {/* The wheel surface is the plot itself. Horizontal gestures over it
          pan; vertical ones are left alone and scroll the page. */}
      <div id={plotId} ref={win.surfaceRef} className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {/* left margin stays >= 0: a negative one pushes the Y axis outside
              the SVG and clips the tick labels to their last glyph. */}
          <LineChart data={view} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            {/* Grid stroke and tick fill come from :root via index.css — see
                the chart furniture block there. */}
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" interval={interval}
              tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
              tickFormatter={d => d.slice(2, 7)} axisLine={false} tickLine={false} />
            <YAxis domain={axis.domain} ticks={axis.ticks}
              tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
              axisLine={false} tickLine={false} width={42} />
            <Tooltip content={<CustomTooltip tickers={tickers} isolated={isolated} />} />
            <Legend content={<CustomLegend tickers={tickers} isolated={isolated} onIsolate={setIsolated} />} />
            {tickers.map((t, i) => {
              const { color, dash } = seriesStyle(i);
              const dim = isolated !== null && isolated !== t;
              return (
                // Animation off: with a window over the data every pan step is
                // new data to recharts, and it would re-draw the line from
                // zero on each one.
                <Line key={t} type="monotone" dataKey={t} stroke={color} strokeDasharray={dash}
                  strokeWidth={isolated === t ? 2.75 : 1.75}
                  strokeOpacity={dim ? 0.16 : 1}
                  dot={false} activeDot={dim ? false : { r: 3, strokeWidth: 0 }}
                  isAnimationActive={false} />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ChartScrollbar win={win} controls={plotId} label="Pan performance chart" />

      <p className="text-2xs text-secondary mt-3">
        One style per holding — hue, and past the fifth a lighter weight and a dash — held
        consistent across every chart on this page. Click a name in the legend to isolate
        that holding; drag the bar or swipe sideways over the plot to pan.
      </p>
    </div>
  );
}
