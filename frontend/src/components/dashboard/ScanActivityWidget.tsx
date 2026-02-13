'use client';

import Widget from './Widget';
import '@/lib/chartRegistry';
import { Line } from 'react-chartjs-2';

interface ActivityChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    fill: boolean;
    pointBackgroundColor: string;
    pointBorderColor: string;
    pointRadius: number;
    pointHoverRadius: number;
  }[];
}

export default function ScanActivityWidget({ data }: { data: ActivityChartData | null }) {
  return (
    <Widget id="LINE_02">
      <h3 className="font-display text-base font-bold text-text-main dark:text-white mb-4">Scan Activity (7 days)</h3>
      <div className="h-[220px]">
        {data && (
          <Line
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                mode: 'index' as const,
                intersect: false,
              },
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  titleFont: { family: "'JetBrains Mono', monospace", size: 10 },
                  bodyFont: { family: "'JetBrains Mono', monospace", size: 10 },
                  padding: 8,
                  cornerRadius: 0,
                },
              },
              scales: {
                y: {
                  grid: { color: 'rgba(0,0,0,0.05)' },
                  ticks: { font: { family: "'JetBrains Mono', monospace", size: 10 }, color: '#9ca3af' },
                  border: { display: false },
                },
                x: {
                  grid: { display: false },
                  ticks: { font: { family: "'JetBrains Mono', monospace", size: 10 }, color: '#9ca3af' },
                  border: { display: false },
                },
              },
            }}
          />
        )}
      </div>
    </Widget>
  );
}
