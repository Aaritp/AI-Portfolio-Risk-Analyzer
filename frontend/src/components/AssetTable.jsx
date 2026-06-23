import { pct, num, signClass, seriesColor } from "../colors";

export default function AssetTable({ tickers, weights, stockMetrics }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto thin-scroll">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-canvas/60 border-b border-border-base">
              <th className="text-left eyebrow px-4 py-3 font-normal">Asset</th>
              <th className="text-right eyebrow px-4 py-3 font-normal">Weight</th>
              <th className="text-right eyebrow px-4 py-3 font-normal">Return</th>
              <th className="text-right eyebrow px-4 py-3 font-normal">Volatility</th>
              <th className="text-right eyebrow px-4 py-3 font-normal">Sharpe</th>
              <th className="text-right eyebrow px-4 py-3 font-normal">Beta</th>
              <th className="text-right eyebrow px-4 py-3 font-normal">Max DD</th>
              <th className="text-right eyebrow px-4 py-3 font-normal">VaR 95%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-base">
            {tickers.map((t, i) => {
              const m = stockMetrics[t];
              return (
                <tr key={t} className="hover:bg-canvas/70 transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full shrink-0 ring-2 ring-canvas" style={{ backgroundColor: seriesColor(i) }} />
                      <span className="fig font-medium text-ink">{t}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="inline-flex items-center gap-2 justify-end">
                      <span className="hidden sm:block w-12 h-1.5 rounded-full bg-canvas overflow-hidden">
                        <span className="block h-full rounded-full" style={{ width: `${weights[i] * 100}%`, backgroundColor: seriesColor(i) }} />
                      </span>
                      <span className="fig text-ink-secondary w-9">{pct(weights[i], 0)}</span>
                    </span>
                  </td>
                  <td className={`px-4 py-3.5 fig text-right font-medium ${signClass(m.return)}`}>{pct(m.return)}</td>
                  <td className="px-4 py-3.5 fig text-right text-ink-secondary">{pct(m.volatility)}</td>
                  <td className={`px-4 py-3.5 fig text-right font-medium ${m.sharpe >= 1 ? "pos" : "text-ink-secondary"}`}>{num(m.sharpe)}</td>
                  <td className="px-4 py-3.5 fig text-right text-ink-secondary">{m.beta !== null ? num(m.beta) : "—"}</td>
                  <td className="px-4 py-3.5 fig text-right neg">{pct(m.max_drawdown)}</td>
                  <td className="px-4 py-3.5 fig text-right neg">{pct(m.var_95)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
