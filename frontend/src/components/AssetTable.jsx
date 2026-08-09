import { pct, num, signClass } from "../colors";
import { seriesBackground } from "../lib/seriesStyle";
import Logo from "./Logo";

export default function AssetTable({ tickers, weights, stockMetrics }) {
  return (
    <div className="glass overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {["Asset","Weight","Return","Volatility","Sharpe","Beta","Max DD","VaR 95%"].map(h => (
              <th key={h} className={`eyebrow px-4 py-3.5 font-normal ${h === "Asset" ? "text-left" : "text-right"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {tickers.map((t, i) => {
            const m = stockMetrics[t];
            return (
              <tr key={t} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2.5">
                    {/* Same colour and dash this ticker carries in every chart
                        on the page. 180deg runs the dash down the upright bar. */}
                    <span className="w-1 h-4 rounded-full shrink-0"
                          style={{ backgroundImage: seriesBackground(i, "180deg") }} />
                    <Logo symbol={t} size={20} index={i} />
                    <span className="fig font-semibold text-primary">{t}</span>
                  </div>
                </td>
                <td className="px-4 py-4 fig text-right text-muted">{pct(weights[i], 0)}</td>
                <td className={`px-4 py-4 fig text-right font-medium ${signClass(m.return)}`}>{pct(m.return)}</td>
                <td className="px-4 py-4 fig text-right text-secondary">{pct(m.volatility)}</td>
                <td className={`px-4 py-4 fig text-right font-medium ${m.sharpe >= 1 ? "text-emerald-DEFAULT" : "text-secondary"}`}>{num(m.sharpe)}</td>
                <td className="px-4 py-4 fig text-right text-secondary">{m.beta !== null ? num(m.beta) : "—"}</td>
                <td className="px-4 py-4 fig text-right text-rose-DEFAULT">{pct(m.max_drawdown)}</td>
                <td className="px-4 py-4 fig text-right text-rose-DEFAULT">{pct(m.var_95)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
