import { pct, num, signClass, seriesColor } from "../colors";

export default function AssetTable({ tickers, weights, stockMetrics }) {
  return (
    <div className="card overflow-x-auto thin-scroll">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-base">
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
              <tr key={t} className="hover:bg-canvas transition-colors">
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seriesColor(i) }} />
                    <span className="fig font-medium text-ink">{t}</span>
                  </span>
                </td>
                <td className="px-4 py-3 fig text-right text-muted">{pct(weights[i], 0)}</td>
                <td className={`px-4 py-3 fig text-right ${signClass(m.return)}`}>{pct(m.return)}</td>
                <td className="px-4 py-3 fig text-right text-ink-secondary">{pct(m.volatility)}</td>
                <td className={`px-4 py-3 fig text-right ${m.sharpe >= 1 ? "pos" : "text-ink-secondary"}`}>{num(m.sharpe)}</td>
                <td className="px-4 py-3 fig text-right text-ink-secondary">{m.beta !== null ? num(m.beta) : "—"}</td>
                <td className="px-4 py-3 fig text-right neg">{pct(m.max_drawdown)}</td>
                <td className="px-4 py-3 fig text-right neg">{pct(m.var_95)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
