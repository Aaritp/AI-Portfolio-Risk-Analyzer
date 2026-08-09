import { useRef } from "react";
import { daysBetween } from "../lib/chartWindow";
// Date formatting for charts already lives with the equity curve's geometry;
// imported rather than a second copy of the same month table.
import { fmtDate, spansYears } from "../equityCurve";

/**
 * Zoom pair, range readout and reset — the row above a time-series chart.
 *
 * Takes the whole window object from useChartWindow rather than eight props:
 * the control is a view of that state, and splitting it up here would only
 * make it possible for a caller to wire the buttons to one chart and the
 * readout to another.
 */
export function ChartToolbar({ win, dates, onReset, canReset }) {
  const from = dates[win.start], to = dates[win.end - 1];
  const withYear = spansYears(dates);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
      <div className="chart-ctl" role="group" aria-label="Zoom">
        {/* Disabled is spelled out on the element, not just drawn: a button
            that looks live and does nothing is worse than one that says so. */}
        <button type="button" onClick={win.zoomIn} disabled={!win.canZoomIn}
                title="Zoom in" aria-label="Zoom in">+</button>
        <button type="button" onClick={win.zoomOut} disabled={!win.canZoomOut}
                title="Zoom out" aria-label="Zoom out">&minus;</button>
      </div>

      {/* Live because for a reader not watching the line this readout is the
          only confirmation that a zoom click did anything. */}
      <span className="text-2xs fig text-secondary whitespace-nowrap" aria-live="polite">
        {from && to ? (
          <>
            {fmtDate(from, withYear)} <span className="text-muted">&rarr;</span> {fmtDate(to, withYear)}
            <span className="text-muted"> · {daysBetween(from, to)} days</span>
          </>
        ) : "—"}
      </span>

      <button type="button" onClick={onReset} disabled={!canReset} className="chart-reset ml-auto">
        Reset
      </button>
    </div>
  );
}

/**
 * Horizontal pan bar under a chart. Same state as the wheel — a second way
 * in, not a second window.
 *
 * The thumb has a minimum width, so at deep zoom its position is no longer
 * proportional to `start / total`. Everything below therefore works in one
 * coordinate: the thumb's left edge as a fraction of its own travel. Mixing
 * that with data-index space is what makes drag handles drift under the
 * cursor.
 */
export function ChartScrollbar({ win, controls, label = "Pan chart" }) {
  const { start, count, total, panTo } = win;
  const trackRef = useRef(null);
  const drag = useRef(null);

  const idle     = count >= total;          // nothing to pan
  const maxStart = Math.max(0, total - count);
  const w        = Math.min(1, Math.max(count / total || 1, 0.03));  // thumb width, fraction of track
  const travel   = 1 - w;
  const left     = maxStart ? (start / maxStart) * travel : 0;

  const atX = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    return (clientX - r.left) / (r.width || 1);
  };
  const clampLeft = v => (v < 0 ? 0 : v > travel ? travel : v);
  const startAt   = leftFrac => (travel > 0 ? (clampLeft(leftFrac) / travel) * maxStart : 0);

  const onPointerDown = e => {
    if (idle) return;
    const p = atX(e.clientX);
    const onThumb = p >= left && p <= left + w;
    // A click on the track centres the window there and then continues as a
    // drag, so press-and-slide works from anywhere rather than only from the
    // thumb the reader has to hit first.
    const base = onThumb ? left : clampLeft(p - w / 2);
    if (!onThumb) panTo(startAt(base));
    drag.current = { origin: p, base };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = e => {
    if (!drag.current) return;
    panTo(startAt(drag.current.base + (atX(e.clientX) - drag.current.origin)));
  };

  const onPointerUp = e => {
    drag.current = null;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const onKeyDown = e => {
    const step = Math.max(1, Math.round(count * 0.1));
    const by = { ArrowLeft: -step, ArrowRight: step, PageUp: -count, PageDown: count,
                 Home: -Infinity, End: Infinity }[e.key];
    if (by === undefined) return;
    e.preventDefault();
    panTo(start + by);   // clamped by the window, including the two infinities
  };

  return (
    <div
      className={`chart-scroll ${idle ? "is-idle" : ""}`}
      role="scrollbar" aria-orientation="horizontal" aria-label={label}
      aria-controls={controls}
      aria-valuemin={0} aria-valuemax={100}
      aria-valuenow={Math.round((maxStart ? start / maxStart : 0) * 100)}
      tabIndex={idle ? -1 : 0}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove}
      onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onKeyDown={onKeyDown}
    >
      {/* The bar stays when there is nothing to pan, at rest rather than
          absent: a control that appears and disappears shifts the chart above
          it every time the reader reaches full zoom-out. */}
      <div ref={trackRef} className="chart-scroll-track">
        <div className="chart-scroll-thumb" style={{ left: `${left * 100}%`, width: `${w * 100}%` }} />
      </div>
    </div>
  );
}
