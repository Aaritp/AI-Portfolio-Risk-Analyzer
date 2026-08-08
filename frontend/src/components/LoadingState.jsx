import { useEffect, useState } from "react";

const TYPICAL   = 12;  // seconds — a warm backend lands in 7–12s
const COLD_HINT = 15;  // seconds — past this, say why it might be slower

/**
 * Honest wait. The bar tracks elapsed time against the typical run, not
 * server-reported completion (there is no progress channel), so it eases to
 * 92% and holds there rather than claiming to be nearly done.
 */
export default function LoadingState() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t0 = Date.now();
    const id = setInterval(() => setElapsed((Date.now() - t0) / 1000), 250);
    return () => clearInterval(id);
  }, []);

  const progress = Math.min(elapsed / TYPICAL, 1) * 0.92;

  return (
    <div className="flex justify-center px-5 py-32">
      <div className="w-full max-w-md" role="status" aria-live="polite">
        <div className="flex items-baseline justify-between mb-3">
          <span className="eyebrow">Analyzing</span>
          <span className="fig text-2xs text-muted">{elapsed.toFixed(0)}s</span>
        </div>

        <div className="h-[3px] w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              background: "linear-gradient(90deg, #6366F1 0%, #818CF8 100%)",
              boxShadow: "0 0 12px rgba(99,102,241,0.5)",
              transition: "width 0.25s linear",
            }}
          />
        </div>

        <p className="font-display font-medium text-primary mt-4">
          Running 10,000 simulations — this takes a few seconds.
        </p>
        <p className="text-sm text-secondary mt-1">
          Fetching prices, mapping 3,000 frontier portfolios, then 10,000 Monte Carlo paths.
          A warm backend finishes in 7–12 seconds.
        </p>

        {elapsed >= COLD_HINT && (
          <p className="text-sm text-secondary mt-3 pt-3 border-t border-white/[0.06]">
            Still going — the backend may be starting up. A cold container adds another 20–30 seconds.
          </p>
        )}
      </div>
    </div>
  );
}
