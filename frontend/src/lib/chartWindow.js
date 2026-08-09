// Pure maths for the visible window shared by the two time-series charts.
// A window is (start, count) in data-point indices — not dates, not pixels.
// Indices are the only representation all three inputs (buttons, scrollbar,
// wheel) can agree on without a scale in hand.
//
// Kept out of the hook so the clamping — the part that has to hold exactly at
// the edges of the data — can be exercised directly.

/** Below about a dozen points a line stops reading as a series and starts
 *  reading as a polyline between markers. That is the floor on zoom. */
export const MIN_WINDOW = 12;

/** One click in, one click out. 0.74 * 1.35 = 0.999, so a click each way
 *  lands back on the window it started from rather than drifting. */
export const ZOOM_IN  = 0.74;
export const ZOOM_OUT = 1.35;

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

/**
 * Round a window to whole points and pull it back inside the data. Every
 * state transition goes through here, which is what makes "the window can
 * never run past the data" a property of the module rather than something
 * each caller has to remember.
 */
export function clampWindow(start, count, total) {
  const c = clamp(Math.round(count), Math.min(MIN_WINDOW, total), total);
  return { start: clamp(Math.round(start), 0, total - c), count: c };
}

/** Scale the window about the centre of the current view, so whatever the
 *  reader has in the middle of the chart is what they zoom into. */
export function zoomWindow(start, count, total, factor) {
  const next = clamp(Math.round(count * factor), Math.min(MIN_WINDOW, total), total);
  return clampWindow(start + count / 2 - next / 2, next, total);
}

/**
 * 1 / 2 / 5 x 10^k — the step sizes whose labels a reader can add up.
 *
 * Rounded to the nearest of those in log space (the thresholds are the
 * geometric means) rather than always upward. Always-up can hand back a step
 * more than twice the one asked for, which on a zoomed window spends half the
 * chart's height on empty axis.
 */
function niceStep(raw) {
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  return (norm >= 7.0710678 ? 10 : norm >= 3.1622777 ? 5 : norm >= 1.4142136 ? 2 : 1) * mag;
}

/**
 * Value axis for one window: the extent of what is actually visible, plus a
 * little air, with ticks on round numbers inside it.
 *
 * Recomputing this per window is what makes zoom worth having. Against the
 * full series' extent, a zoomed view is the same shape drawn wider; against
 * the window's own extent, it opens up.
 *
 * The domain is the padded data extent and the ticks are placed inside it,
 * rather than the domain being rounded out to whole steps. Rounding the
 * bounds is the usual move, but it can add most of a step of dead space at
 * each end — which is exactly the resolution a zoom was asked to recover.
 */
export function niceAxis(values, divisions = 4) {
  let lo = Infinity, hi = -Infinity;
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (lo > hi) return { domain: [0, 1], ticks: [0, 1] };  // nothing finite in view
  if (hi - lo < 1e-9) { lo -= 1; hi += 1; }               // a perfectly flat window

  const pad = (hi - lo) * 0.08;
  const min = lo - pad, max = hi + pad;
  const step = niceStep((max - min) / divisions);

  // Indexing out from a multiple of step rather than accumulating += step
  // keeps float error from reaching the tick labels.
  const ticks = [];
  for (let i = Math.ceil(min / step); i * step <= max + 1e-9; i++) ticks.push(+(i * step).toFixed(6));

  return { domain: [+min.toFixed(6), +max.toFixed(6)], ticks: ticks.length ? ticks : [min, max] };
}

/** Calendar days between two ISO dates. Both parse as UTC midnight, so the
 *  difference is exact — there is no DST hour to round away. */
export function daysBetween(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}
