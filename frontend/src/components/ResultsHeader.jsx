import { seriesStyle } from "../lib/seriesStyle";

const PERIOD_LABELS = {
  "3mo":"3-month","6mo":"6-month",ytd:"year-to-date",
  "1y":"1-year","2y":"2-year","5y":"5-year",max:"full history",
};

const RING = 38, STROKE = 3.5;
const R = (RING - STROKE) / 2, C = RING / 2;

/** Arc from twelve o'clock, clockwise, covering `frac` of the circle.
 *  Drawn as a path rather than a dashed circle because strokeDasharray is
 *  already spoken for: past the fifth holding it carries the series' dash. */
function arcPath(frac) {
  const a = 2 * Math.PI * frac - Math.PI / 2;
  const x = (C + R * Math.cos(a)).toFixed(2);
  const y = (C + R * Math.sin(a)).toFixed(2);
  return `M ${C} ${C - R} A ${R} ${R} 0 ${frac > 0.5 ? 1 : 0} 1 ${x} ${y}`;
}

/** One holding: a ring filled to its weight, ticker and percentage beside it.
 *  Deliberately not a single donut — at eight or ten holdings a donut becomes
 *  a pinwheel of unlabelled slivers, while rings just wrap onto another row. */
function WeightRing({ ticker, weight, index }) {
  const { color, dash } = seriesStyle(index);
  const full = weight >= 0.999;

  return (
    <div className="flex items-center gap-2.5">
      <svg width={RING} height={RING} className="shrink-0" aria-hidden="true">
        <circle cx={C} cy={C} r={R} fill="none"
                stroke="rgba(255,255,255,0.09)" strokeWidth={STROKE} />
        {full ? (
          <circle cx={C} cy={C} r={R} fill="none" stroke={color}
                  strokeWidth={STROKE} strokeDasharray={dash} />
        ) : weight > 0 ? (
          <path d={arcPath(weight)} fill="none" stroke={color}
                strokeWidth={STROKE} strokeDasharray={dash}
                strokeLinecap={dash ? "butt" : "round"} />
        ) : null}
      </svg>
      <div className="text-left leading-tight">
        <div className="fig text-xs font-semibold" style={{ color }}>{ticker}</div>
        <div className="fig text-2xs text-muted">{(weight * 100).toFixed(0)}%</div>
      </div>
    </div>
  );
}

export default function ResultsHeader({ tickers, weights, period, observations }) {
  return (
    <div className="relative py-10 border-b border-white/[0.06] mb-2 text-center">

      {/* Top-right from sm up. On a narrow viewport it sits above the title
          instead: absolutely positioned, it would land on the eyebrow, which
          runs the full width of a 320px column on its own. */}
      <div className="mb-6 flex justify-center sm:mb-0 sm:block sm:absolute sm:top-10 sm:right-0">
        <span className="glass-sm inline-flex items-center gap-2 px-3 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: "var(--interaction)" }} />
          <span className="eyebrow text-secondary">Live analysis</span>
        </span>
      </div>

      <p className="eyebrow mb-3">
        {PERIOD_LABELS[period] || period} lookback
        {observations > 0 && ` · ${observations} trading days`}
      </p>

      {/* Each ticker in its own series colour — the same one it carries in
          every chart and table below. The slashes stay neutral so they read
          as punctuation rather than as another holding. */}
      <h2 className="font-display font-bold tracking-tight"
          style={{ fontSize: "clamp(1.5rem,4vw,2.5rem)" }}>
        {tickers.map((t, i) => (
          <span key={t}>
            {i > 0 && <span className="text-muted font-normal"> / </span>}
            <span style={{ color: seriesStyle(i).color }}>{t}</span>
          </span>
        ))}
      </h2>

      <div className="mt-7 flex flex-wrap justify-center gap-x-7 gap-y-4">
        {tickers.map((t, i) => (
          <WeightRing key={t} ticker={t} weight={weights[i]} index={i} />
        ))}
      </div>
    </div>
  );
}
