function cellBg(v) {
  // -1 → emerald dim / 0 → transparent / +1 → indigo
  const t = (v + 1) / 2;
  if (t < 0.5) {
    const f = t / 0.5;
    // teal → dark
    const r = Math.round(16 + (20 - 16) * f);
    const g = Math.round(185 + (25 - 185) * f);
    const b = Math.round(129 + (40 - 129) * f);
    const a = (1 - f) * 0.55;
    return `rgba(${r},${g},${b},${a + 0.04})`;
  } else {
    const f = (t - 0.5) / 0.5;
    const r = Math.round(20 + (99 - 20) * f);
    const g = Math.round(25 + (102 - 25) * f);
    const b = Math.round(40 + (241 - 40) * f);
    const a = f * 0.65;
    return `rgba(${r},${g},${b},${a + 0.04})`;
  }
}

function cellText(v) {
  return Math.abs(v) > 0.45 ? "rgba(255,255,255,0.9)" : "#64748B";
}

function Row({ label, row }) {
  return (
    <>
      <div className="text-2xs fig text-muted flex items-center pr-2 truncate">{label}</div>
      {row.map((v, j) => (
        <div key={j}
          className="rounded flex items-center justify-center text-[10px] fig transition-all duration-150 hover:scale-105 cursor-default"
          style={{ backgroundColor: cellBg(v), color: cellText(v), aspectRatio: "1", border: "1px solid rgba(255,255,255,0.04)" }}
          title={v.toFixed(3)}>
          {v.toFixed(2)}
        </div>
      ))}
    </>
  );
}

export default function CorrelationHeatmap({ correlation }) {
  const { labels, matrix } = correlation;
  const n = labels.length;

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="eyebrow">Correlation matrix</span>
        <div className="flex items-center gap-2 text-2xs text-muted">
          <span>−1</span>
          <div className="w-20 h-1.5 rounded-full" style={{ background: "linear-gradient(to right, #10B981, rgba(255,255,255,0.05), #6366F1)" }} />
          <span>+1</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="inline-grid gap-1" style={{ gridTemplateColumns: `72px repeat(${n}, 52px)` }}>
          <div />
          {labels.map(l => (
            <div key={l} className="text-2xs fig text-muted text-center pb-1.5 truncate">{l}</div>
          ))}
          {matrix.map((row, i) => (
            <Row key={labels[i]} label={labels[i]} row={row} />
          ))}
        </div>
      </div>
      <p className="text-2xs text-muted mt-4">
        Pearson correlation of daily log returns. Values near 0 signal diversification benefit.
      </p>
    </div>
  );
}
