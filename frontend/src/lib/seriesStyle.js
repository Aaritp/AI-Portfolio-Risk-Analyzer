// Per-series styling for holdings. Deterministic: index in, style out. No
// randomness, no state, no user control — holding n looks the same on every
// chart, on every render, in every portfolio.
//
// Hue advances by the golden angle, so any prefix of the sequence stays well
// separated and adding an 8th holding never re-colours the first seven.
// Past TIER series the golden angle's minimum gap falls below what the eye
// reliably resolves, so a second channel (lightness) and a third (dash
// pattern) take over. The dash is also what keeps the chart readable in
// greyscale and under colour-vision deficiency.

// L_LO is 0.59 rather than 0.58 because 0.58 puts the red-orange at i=7 at
// 4.33:1 on the page background — under AA. 0.59 is the lowest value at
// which all ten series clear 4.5:1; i=7 is the binding case at 4.53:1.
const C = 0.16, START_HUE = 145, GOLDEN = 137.508;
const L_HI = 0.80, L_LO = 0.59, TIER = 5;

const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x);

// Linear-light → gamma-encoded sRGB (IEC 61966-2-1). Clamped first: an
// out-of-gamut channel is negative here, and Math.pow of a negative is NaN.
const encode = c => {
  const v = clamp01(c);
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
};

const channel = c => Math.round(encode(c) * 255).toString(16).padStart(2, "0");

/**
 * OKLCH → sRGB hex. `l` is perceptual lightness 0–1, `c` chroma, `h` hue in
 * degrees. Out-of-gamut channels clip, which is why the chroma above sits at
 * a value every hue on the wheel can actually reach in sRGB.
 *
 * Matrices are Björn Ottosson's OKLab definition.
 */
export function oklchToHex(l, c, h) {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);

  // OKLab → non-linear LMS
  const L_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const M_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const S_ = l - 0.0894841775 * a - 1.2914855480 * b;

  // → linear LMS
  const L = L_ * L_ * L_, M = M_ * M_ * M_, S = S_ * S_ * S_;

  // → linear sRGB
  const r = +4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S;
  const g = -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S;
  const bl = -0.0041960863 * L - 0.7034186147 * M + 1.7076147010 * S;

  return `#${channel(r)}${channel(g)}${channel(bl)}`;
}

/** Stroke colour and dash pattern for the i-th holding. */
export const seriesStyle = i => ({
  color: oklchToHex(i < TIER ? L_HI : L_LO, C, (START_HUE + i * GOLDEN) % 360),
  dash:  i < TIER ? undefined : '7 5',
});

/** Convenience for the common case of wanting only the colour. */
export const seriesColor = i => seriesStyle(i).color;

/**
 * The same style as a CSS background-image, for swatches, legend keys and
 * slider tracks — DOM nodes rather than SVG strokes. A dashed series has to
 * read as dashed everywhere it appears, not only on the chart line, or the
 * third channel goes missing exactly where the legend is meant to explain it.
 *
 * Always a gradient, even for the solid tier, so callers can layer it over a
 * track with background-size without special-casing.
 *
 * `angle` runs along the swatch's long axis: 90deg horizontal, 180deg upright.
 */
export function seriesBackground(i, angle = "90deg") {
  const { color, dash } = seriesStyle(i);
  if (!dash) return `linear-gradient(${angle}, ${color} 0 100%)`;
  const [on, off] = dash.split(" ").map(Number);
  return `repeating-linear-gradient(${angle}, ${color} 0 ${on}px, transparent ${on}px ${on + off}px)`;
}
