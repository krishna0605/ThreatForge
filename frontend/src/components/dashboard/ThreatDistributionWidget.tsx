'use client';

import Widget from './Widget';
import '@/lib/chartRegistry';
import { Doughnut } from 'react-chartjs-2';

interface DistributionData {
  labels: string[];
  datasets: { data: number[]; backgroundColor: string[]; borderColor: string; borderWidth: number }[];
}

export default function ThreatDistributionWidget({ data }: { data: DistributionData | null }) {
  const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#8b5cf6'];

  return (
    <Widget id="PIE_01">
      <h3 className="font-display text-base font-bold text-text-main dark:text-white mb-4">Threat Distribution</h3>
      <div className="flex items-center gap-6">
        <div className="w-40 h-40">
          {data && (
            <Doughnut
              data={data}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                cutout: '65%',
                plugins: { legend: { display: false } },
              }}
            />
          )}
        </div>
        <div className="space-y-2 text-xs font-mono">
          {(data?.labels || ['Malware', 'Suspicious', 'Clean', 'Stego']).map((l: string, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[i] }} />
              <span className="text-text-muted dark:text-gray-400">{l}</span>
              <span className="text-text-main dark:text-white font-bold ml-auto">
                {data?.datasets?.[0]?.data?.[i] ?? 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Widget>
  );
}
