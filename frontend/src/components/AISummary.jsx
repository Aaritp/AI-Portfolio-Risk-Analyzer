import { useReveal } from "../hooks/useReveal";

const CORNERS = ["bracket-tl", "bracket-tr", "bracket-bl", "bracket-br"];

/**
 * Split the summary at the sentence boundary nearest its middle. The model
 * returns three or four sentences as one unbroken string and the sign has to
 * sit between two statements, so the break is found rather than authored.
 *
 * A decimal point never has whitespace after it, so "a Sharpe of 0.63" cannot
 * be mistaken for a full stop. The capital-letter test is what skips
 * "U.S. equity" and similar abbreviations, which do.
 */
export function splitAtSentence(text) {
  const t = (text || "").trim();
  const stops = [];
  const re = /[.!?]["')\]]?\s+/g;

  for (let m = re.exec(t); m !== null; m = re.exec(t)) {
    const next = t[re.lastIndex];
    if (next && next !== next.toLowerCase()) stops.push(re.lastIndex);
  }

  if (!stops.length) return [t, ""];
  const cut = stops[Math.ceil((stops.length + 1) / 2) - 1];
  return [t.slice(0, cut).trim(), t.slice(cut).trim()];
}

export default function AISummary({ summary }) {
  const [ref, visible] = useReveal(0.2);
  const [opening, closing] = splitAtSentence(summary);

  return (
    // Corner brackets rather than a frame: four marks are enough to say where
    // the block starts and stops, and they leave the neon as the only lit
    // thing in the section.
    <div ref={ref} className="brackets px-6 py-9 md:px-10 md:py-11">
      {CORNERS.map(c => <span key={c} className={`bracket ${c}`} aria-hidden="true" />)}

      <p className="measure-92 font-medium text-base md:text-lg leading-relaxed text-secondary">
        {opening}
      </p>

      {/* The sign divides the two statements — it is not a heading, and it is
          the section's only marker now that the icon is gone. Hairlines carry
          out of it to both container edges. */}
      <div className="neon-row my-9 md:my-11">
        <span className="neon-rule" aria-hidden="true" />
        <span className={`neon-sign ${visible ? "is-lit" : ""}`}>AI RISK ASSESSMENT</span>
        <span className="neon-rule neon-rule-right" aria-hidden="true" />
      </div>

      {closing && (
        <p className="measure-92 font-medium text-base md:text-lg leading-relaxed text-secondary">
          {closing}
        </p>
      )}

      {/* Centred rather than measured: one short line, and the composition
          either side of it is symmetric. */}
      <p className="text-2xs text-muted mt-8 text-center">
        Generated from quantitative metrics above · informational only, not financial advice
      </p>
    </div>
  );
}
