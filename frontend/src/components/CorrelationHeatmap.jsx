function cellBg(v) {
  const t = (v + 1) / 2;
  const neg = [13, 148, 136];   // teal
  const mid = [246, 247, 249];  // canvas
  const pos = [99, 102, 241];   // indigo

  let c;
  if (t < 0.5) {
    const f = t / 0.5;
    c = neg.map((n, i) => Math.round(n + (mid[i] - n) * f));
  } else {
    const f = (t - 0.5) / 0.5;
    c = mid.map((n, i) => Math.round(n + (pos[i] - n) * f));
  }
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function cellText(v) {
  return Math.abs(v) > 0.5 ? "#FFFFFF" : "#111827";
}

export default function CorrelationHeatmap({ correlation }) {
  const { labels, matrix } = correlation;
  const n = labels.length;

  return (
    <div className="card card-hover p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="eyebrow">Correlation matrix</span>
        <div className="flex items-center gap-2 text-2xs text-subtle">
          <span>−1</span>
          <div className="w-20 h-1.5 rounded-full" style={{ background: "linear-gradient(to right, #0D9488, #F6F7F9, #6366F1)" }} />
          <span>+1</span>
        </div>
      </div>
      <div className="overflow-x-auto thin-scroll">
        <div className="inline-grid gap-1" style={{ gridTemplateColumns: `72px repeat(${n}, 52px)` }}>
          <div />
          {labels.map(l => (
            <div key={l} className="text-2xs fig text-muted text-center pb-1 truncate">{l}</div>
          ))}
          {matrix.map((row, i) => (
            <Row key={labels[i]} label={labels[i]} row={row} />
          ))}
        </div>
      </div>
      <p className="text-2xs text-subtle mt-4">Pearson correlation of daily log returns. Values near 0 signal diversification benefit.</p>
    </div>
  );
}

function Row({ label, row }) {
  return (
    <>
      <div className="text-2xs fig text-muted flex items-center pr-2 truncate">{label}</div>
      {row.map((v, j) => (
        <div key={j} className="rounded-md flex items-center justify-center text-[10px] fig aspect-square transition-transform hover:scale-[1.08] hover:shadow-sm cursor-default"
          style={{ backgroundColor: cellBg(v), color: cellText(v) }}
          title={`${v.toFixed(2)}`}>
          {v.toFixed(2)}
        </div>
      ))}
    </>
  );
}
