'use client';

import Widget from './Widget';

interface OriginItem {
  country: string;
  flag: string;
  attacks: number;
  risk: string;
  risk_color?: string;
}

const RISK_STYLES: Record<string, string> = {
  High: 'text-red-500 bg-red-500/10',
  Med: 'text-yellow-500 bg-yellow-500/10',
  Low: 'text-blue-500 bg-blue-500/10',
};

export default function ThreatOriginsWidget({ origins }: { origins: OriginItem[] }) {
  return (
    <Widget id="ORIGIN_TBL">
      <h3 className="font-display text-base font-bold text-text-main dark:text-white mb-4">Top Threat Origins</h3>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="pb-2 text-[10px] font-mono text-text-muted dark:text-gray-500 uppercase tracking-wider">Country</th>
            <th className="pb-2 text-[10px] font-mono text-text-muted dark:text-gray-500 uppercase tracking-wider">Attacks</th>
            <th className="pb-2 text-[10px] font-mono text-text-muted dark:text-gray-500 uppercase tracking-wider text-right">Risk</th>
          </tr>
        </thead>
        <tbody className="font-mono text-xs">
          {origins.map((r, i) => (
            <tr key={i} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
              <td className="py-2.5 flex items-center gap-2 text-text-main dark:text-white">
                <span>{r.flag}</span> {r.country}
              </td>
              <td className="py-2.5 text-text-muted dark:text-gray-400">{r.attacks.toLocaleString()}</td>
              <td className="py-2.5 text-right">
                <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wider ${RISK_STYLES[r.risk] || 'text-gray-500 bg-gray-500/10'}`}>
                  {r.risk}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Widget>
  );
}
