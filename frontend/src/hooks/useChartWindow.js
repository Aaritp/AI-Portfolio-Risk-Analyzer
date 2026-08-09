import { useCallback, useEffect, useRef, useState } from "react";
import { MIN_WINDOW, ZOOM_IN, ZOOM_OUT, clampWindow, zoomWindow } from "../lib/chartWindow";

/**
 * The visible window over one chart's series, plus the wheel handling that
 * pans it.
 *
 * State is per chart and deliberately so: the two time-series charts on the
 * page show different things over the same dates, and a reader who zooms into
 * one is not asking the other to follow. Nothing here is shared or global.
 *
 * The buttons, the scrollbar and the wheel are three doors into one piece of
 * state — pan by any of them and the other two show it immediately.
 *
 * `surfaceRef` is a callback ref rather than an object ref because the
 * element it goes on can appear after mount (the equity curve renders nothing
 * until it has measured its width). A callback ref re-runs the listener setup
 * when the node arrives; an object ref would have been read once, found null,
 * and left the chart deaf to the wheel.
 */
export function useChartWindow(total) {
  const [win, setWin] = useState({ start: 0, count: total });
  const [surface, setSurface] = useState(null);
  const surfaceRef = useCallback(node => setSurface(node), []);

  // A new analysis replaces the series wholesale, and indices into the old
  // one mean nothing against it. Guarded on the values so an ordinary
  // re-render never yanks a window the reader has set.
  useEffect(() => {
    setWin(w => (w.start === 0 && w.count === total ? w : { start: 0, count: total }));
  }, [total]);

  // Read by the wheel listener, which is attached once per element rather
  // than re-bound on every pan step.
  const winRef = useRef(win);
  winRef.current = win;

  const zoomIn  = useCallback(() => setWin(w => zoomWindow(w.start, w.count, total, ZOOM_IN)),  [total]);
  const zoomOut = useCallback(() => setWin(w => zoomWindow(w.start, w.count, total, ZOOM_OUT)), [total]);
  const panTo   = useCallback(start => setWin(w => clampWindow(start, w.count, total)), [total]);
  const panBy   = useCallback(delta => setWin(w => clampWindow(w.start + delta, w.count, total)), [total]);
  const reset   = useCallback(() => setWin({ start: 0, count: total }), [total]);

  // Sub-point remainders accumulate here instead of rounding to nothing: a
  // slow trackpad swipe across a wide window moves well under one data point
  // per event, and truncating each event would leave the chart unmovable.
  const wheelRest = useRef(0);

  useEffect(() => {
    if (!surface) return;

    const onWheel = e => {
      const horizontal = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);

      // Vertical intent, or a window with nowhere left to go: the page keeps
      // the gesture. This is the line that decides whether a reader can
      // scroll past the chart or gets trapped on it, so it comes first and
      // returns before preventDefault.
      if (!horizontal || winRef.current.count >= total) return;
      e.preventDefault();

      // Chrome puts shift+wheel on deltaX; Firefox leaves it on deltaY. Take
      // whichever axis actually carries the gesture.
      const raw   = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const width = surface.clientWidth || 1;
      // deltaMode 1 is lines, 2 is pages — a wheel mouse on Firefox reports
      // lines, and 3 of them unconverted would move the window by 3 pixels.
      const px = raw * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? width : 1);

      wheelRest.current += (px / width) * winRef.current.count;
      const whole = Math.trunc(wheelRest.current);
      if (!whole) return;
      wheelRest.current -= whole;
      setWin(w => clampWindow(w.start + whole, w.count, total));
    };

    // Passive listeners cannot preventDefault, and React's own onWheel is
    // attached passively at the root — hence the manual binding.
    surface.addEventListener("wheel", onWheel, { passive: false });
    return () => surface.removeEventListener("wheel", onWheel);
  }, [surface, total]);

  return {
    surfaceRef,
    start: win.start,
    count: win.count,
    end: Math.min(total, win.start + win.count),   // exclusive
    total,
    zoomed:     win.count < total,
    canZoomIn:  win.count > Math.min(MIN_WINDOW, total),
    canZoomOut: win.count < total,
    zoomIn, zoomOut, panTo, panBy, reset,
  };
}
