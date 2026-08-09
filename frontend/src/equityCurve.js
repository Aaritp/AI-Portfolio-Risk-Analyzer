// Pure geometry + annotation math for the portfolio equity curve.
// Kept out of the component so the callout placement can be exercised
// directly across widths and series shapes.

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const HIGH_COLOR = "#34D399";
export const DRAW_COLOR = "#FB7185";

export function fmtDate(iso, withYear) {
  const [y, m, d] = iso.split("-");
  return `${+d} ${MONTHS[+m - 1]}${withYear ? ` '${y.slice(2)}` : ""}`;
}

export function signedPct(v, digits = 1) {
  return `${v >= 0 ? "+" : "-"}${Math.abs(v * 100).toFixed(digits)}%`;
}

/** Whether dates need a year to be unambiguous. A 1-year lookback runs
 *  8 Aug → 7 Aug, so "day + month" alone reads as a one-day range. */
export function spansYears(dates) {
  return dates.length > 1 && dates[0].slice(0, 4) !== dates[dates.length - 1].slice(0, 4);
}

/**
 * Weighted portfolio value. Each per-ticker series is already indexed to 100
 * at period start, so with fixed weights the weighted sum is exactly the
 * buy-and-hold portfolio — and it also starts at 100.
 */
export function portfolioSeries(priceHistory, tickers, weights) {
  const dates = priceHistory[tickers[0]]?.dates || [];
  const wsum = weights.reduce((s, w) => s + w, 0) || 1;
  return dates.map((_, i) =>
    tickers.reduce((sum, t, k) => sum + (weights[k] / wsum) * (priceHistory[t]?.normalized?.[i] ?? 0), 0)
  );
}

/** The two annotated points, both read off the real series. */
export function findMarks(series, dates) {
  let hiIdx = 0;
  for (let i = 1; i < series.length; i++) if (series[i] > series[hiIdx]) hiIdx = i;

  let peak = series[0], ddIdx = -1, worstDD = 0;
  for (let i = 0; i < series.length; i++) {
    if (series[i] > peak) peak = series[i];
    const dd = series[i] / peak - 1;
    if (dd < worstDD) { worstDD = dd; ddIdx = i; }
  }

  const withYear = spansYears(dates);

  return [
    { idx: hiIdx, color: HIGH_COLOR, label: "PERIOD HIGH", above: true,
      value: `${signedPct(series[hiIdx] / series[0] - 1)} · ${fmtDate(dates[hiIdx], withYear)}` },
    // Only annotated when the series genuinely drew down.
    ...(ddIdx >= 0 ? [{ idx: ddIdx, color: DRAW_COLOR, label: "MAX DRAWDOWN", above: false,
      value: `${signedPct(worstDD)} · ${fmtDate(ddIdx >= 0 ? dates[ddIdx] : dates[0], withYear)}` }] : []),
  ];
}

/**
 * Everything the component needs to draw: dimensions, scales, paths, axis
 * ticks and the placed callout boxes.
 *
 * `start` and `count` are the visible window in data-point indices. Scales,
 * paths and the value domain are all built from that slice — a zoom that left
 * the value axis on the whole series' extent would draw the same shape wider
 * and call it magnification.
 */
export function buildChart({ width, series, dates, start = 0, count = series.length }) {
  const compact = width < 560;
  const H  = compact ? 280 : 340;
  const PR = 14, PT = 18, PB = 26;   // PL comes later — it depends on the labels

  const LBL  = compact ? 8.5 : 9;  // uppercase mono label
  const VAL  = compact ? 11 : 12;  // figure + date
  const TICK = 10;                 // value-axis label
  const boxH = compact ? 32 : 36;
  const GAP  = 16;                 // clearance between a callout and the line

  // Monospace advance is 0.6em; the callout label also carries 0.12em tracking.
  const textW = (s, size, tracking = 0) => s.length * size * (0.6 + tracking);

  const view = series.slice(start, start + count);
  const n = view.length;
  const span = Math.max(1, n - 1);   // a one-point window has no width to divide by

  // The value scale reserves exactly one callout's height above the series
  // max and below its min. That reserve is what makes clearance guaranteed
  // rather than best-effort: a box sitting GAP above the highest point of the
  // line still lands inside the plot.
  const plotTop = PT, plotBot = H - PB;
  const yTop = plotTop + boxH + GAP;   // where the visible max is drawn
  const yBot = plotBot - boxH - GAP;   // where the visible min is drawn

  const rawLo = Math.min(...view), rawHi = Math.max(...view);
  const flat = rawHi - rawLo < 1e-9;

  const ys = flat
    ? () => (yTop + yBot) / 2
    : v => yBot + ((v - rawLo) / (rawHi - rawLo)) * (yTop - yBot);

  // Axis domain = the values at the top and bottom of the plot area.
  const vAt = y => flat ? rawLo : rawLo + ((y - yBot) / (yTop - yBot)) * (rawHi - rawLo);
  const lo = flat ? rawLo - 1 : vAt(plotBot), hi = flat ? rawLo + 1 : vAt(plotTop);
  const ticks = Array.from({ length: 4 }, (_, i) => lo + ((hi - lo) * i) / 3);

  // The value axis is labelled in percent off the 100 index, so one index
  // point is one percentage point. Zoomed into a quiet stretch the four ticks
  // can span well under a point, and at zero decimals they would all print
  // the same number.
  const tickSpan = (hi - lo) / 3;
  const tickDigits = tickSpan >= 1 ? 0 : tickSpan >= 0.1 ? 1 : 2;

  // The gutter is sized to the labels it has to hold, which is why it is
  // measured here rather than fixed at the top: a zoomed window earns two
  // decimal places, and "-12.34%" does not fit the gutter "-12%" needed.
  const labelW = Math.max(...ticks.map(v => textW(signedPct(v / 100 - 1, tickDigits), TICK)));
  const PL = Math.max(compact ? 38 : 48, Math.ceil(labelW) + 12);   // +8 offset, +4 air
  const PW = width - PL - PR;

  // x is indexed within the window; a global index g is drawn at xs(g - start).
  const xs = i => PL + (i / span) * PW;

  const linePath = view.map((v, i) => `${i === 0 ? "M" : "L"}${xs(i).toFixed(1)},${ys(v).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${xs(n - 1).toFixed(1)},${plotBot.toFixed(1)} L${xs(0).toFixed(1)},${plotBot.toFixed(1)} Z`;

  // Topmost / bottommost point the line reaches between two x coordinates.
  // Placing off the point alone is not enough — the line slopes, so a box
  // centred on the point can still be cut by the line at its far end.
  const lineExtent = (xa, xb) => {
    const toI = x => ((x - PL) / PW) * span;
    const i0 = Math.max(0, Math.floor(toI(xa))), i1 = Math.min(n - 1, Math.ceil(toI(xb)));
    let min = Infinity, max = -Infinity;
    for (let i = i0; i <= i1; i++) {
      const y = ys(view[i]);
      if (y < min) min = y;
      if (y > max) max = y;
    }
    return { min, max };
  };

  // The marks are read off the whole series and then filtered to the window,
  // so "period high" keeps meaning the period's high however far in the
  // reader zooms. A window holding neither mark simply gets no callout —
  // better than a callout whose label has quietly changed meaning.
  const boxes = findMarks(series, dates).filter(m => m.idx >= start && m.idx < start + count).map(m => {
    const px = xs(m.idx - start), py = ys(series[m.idx]);
    const w = Math.min(
      Math.max(textW(m.label, LBL, 0.12), textW(m.value, VAL)) + 20,
      Math.max(60, PW),                       // never wider than the plot
    );
    const x = Math.min(Math.max(px - w / 2, PL), Math.max(PL, width - PR - w));
    const { min, max } = lineExtent(x, x + w);
    const y = m.above ? min - GAP - boxH : max + GAP;
    return { ...m, px, py, x, y, w, h: boxH };
  });

  return { compact, H, PL, PR, PT, PB, xs, ys, linePath, areaPath, ticks, tickDigits, boxes, LBL, VAL, TICK };
}
