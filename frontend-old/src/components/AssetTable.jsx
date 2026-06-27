import { useState } from "react";
import { pct, num, signClass, seriesColor, tickerLogo } from "../colors";

export default function AssetTable({ tickers, weights, stockMetrics }) {
  const [failedLogos, setFailedLogos] = useState({});
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto thin-scroll">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 backdrop-blur-sm">
              <th className="text-left eyebrow px-4 py-3 font-normal text-slate-200">Asset</th>
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
                <tr key={t} className="hover:bg-white/10 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80">
                        <span className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
                        <span className="relative fig font-semibold text-slate-100 uppercase text-[11px] tracking-[0.16em]">
                          {t.slice(0, 2)}
                        </span>
                        {tickerLogo(t) && !failedLogos[t] && (
                          <img
                            src={tickerLogo(t)}
                            alt={`${t} logo`}
                            className="relative h-9 w-9 object-contain"
                            loading="lazy"
                            onError={() => setFailedLogos((prev) => ({ ...prev, [t]: true }))}
                          />
                        )}
                      </div>
                      <div>
                        <div className="fig font-medium text-ink">{t}</div>
                        <div className="text-[11px] text-slate-400">{stockMetrics[t].beta !== null ? `β ${num(stockMetrics[t].beta)}` : "β —"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="inline-flex items-center gap-2 justify-end">
                      <span className="hidden sm:block w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <span className="block h-full rounded-full" style={{ width: `${weights[i] * 100}%`, backgroundColor: seriesColor(i) }} />
                      </span>
                      <span className="fig text-slate-300 w-9">{pct(weights[i], 0)}</span>
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
