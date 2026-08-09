import { useState } from "react";
import { seriesColor } from "../lib/seriesStyle";

// Company logo by ticker (financialmodelingprep — no API key, ticker-keyed).
// Falls back to a monogram if the logo is missing or fails to load. The
// monogram identifies a holding, so it takes that holding's series colour —
// callers pass the holding's index. Without one it stays neutral rather than
// borrowing a colour that means something else.
export default function Logo({ symbol, size = 22, index }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    const tint = index === undefined ? "var(--text-muted)" : seriesColor(index);
    return (
      <span
        className="grid place-items-center rounded-full shrink-0 fig font-semibold"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.46,
          background: "rgba(255,255,255,0.08)",
          color: tint,
        }}
        aria-hidden="true"
      >
        {symbol[0]}
      </span>
    );
  }

  return (
    <img
      src={`https://financialmodelingprep.com/image-stock/${symbol}.png`}
      alt={`${symbol} logo`}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className="rounded-full shrink-0 object-contain"
      style={{ width: size, height: size, background: "#fff", padding: size * 0.12 }}
    />
  );
}
