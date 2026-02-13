'use client';

import Widget from './Widget';
import CircularGauge from './CircularGauge';

interface HealthData {
  network_integrity: { value: number; label: string; subtitle: string };
  ai_confidence: { value: number; label: string; subtitle: string };
  firewall_status: { value: number; label: string; subtitle: string };
}

export default function SystemHealthWidget({ data }: { data: HealthData | null }) {
  const gauges = data
    ? [
        { ...data.network_integrity, color: '#22c55e' },
        { ...data.ai_confidence, color: '#0066cc' },
        { ...data.firewall_status, color: data.firewall_status.value >= 80 ? '#22c55e' : data.firewall_status.value >= 50 ? '#f59e0b' : '#ef4444' },
      ]
    : [
        { value: 0, label: 'Network Integrity', subtitle: 'Loading...', color: '#22c55e' },
        { value: 0, label: 'AI Model Confidence', subtitle: 'Loading...', color: '#0066cc' },
        { value: 0, label: 'Firewall Status', subtitle: 'Loading...', color: '#f59e0b' },
      ];

  return (
    <Widget id="HEALTH_SYS">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-lg font-bold text-text-main dark:text-white">System Security Health</h3>
        <span className="text-[10px] font-mono text-text-muted dark:text-gray-500 tracking-wider">Real-time Metrics</span>
      </div>
      <div className="flex justify-around items-center">
        {gauges.map((g, i) => (
          <CircularGauge key={i} value={g.value} label={g.label} subtitle={g.subtitle} color={g.color} />
        ))}
      </div>
    </Widget>
  );
}
