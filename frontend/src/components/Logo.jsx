import { useState } from "react";
import { BRAND } from "../colors";

// Company logo by ticker (financialmodelingprep — no API key, ticker-keyed).
// Falls back to a brand-blue monogram if the logo is missing or fails to load.
export default function Logo({ symbol, size = 22 }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className="grid place-items-center rounded-full shrink-0 fig font-semibold"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.46,
          background: `${BRAND}26`,
          color: BRAND,
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
