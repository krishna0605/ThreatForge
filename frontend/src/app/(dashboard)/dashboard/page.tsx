'use client';

import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  getDashboardStats,
  getDashboardActivity,
  getThreatDistribution,
  getScans,
  getSecurityHealth,
  getSeverityBreakdown,
  getSecurityActions,
  getThreatMapData,
  getThreatOrigins,
} from '@/lib/api';

import {
  SystemHealthWidget,
  SeverityBreakdownWidget,
  RecentScansWidget,
  SecurityActionsWidget,
  ThreatOriginsWidget,
} from '@/components/dashboard';

interface HealthData {
  network_integrity: { value: number; label: string; subtitle: string };
  ai_confidence: { value: number; label: string; subtitle: string };
  firewall_status: { value: number; label: string; subtitle: string };
}

interface ScanItem {
  id: string;
  filename?: string;
  threats_found: number;
  status: string;
  created_at: string;
  scan_type: string;
  duration_seconds: number | null;
}

interface DashboardStats {
  total_scans: number;
  threats_found: number;
  clean_files: number;
  critical_alerts: number;
  storage?: string;
  network_integrity?: { value: number; label: string; subtitle: string };
  ai_confidence?: { value: number; label: string; subtitle: string };
  firewall_status?: { value: number; label: string; subtitle: string };
  [key: string]: unknown;
}

interface ActivityResponse {
  labels: string[];
  data: number[];
}

interface DistributionResponse {
  labels: string[];
  data: number[];
}

interface SeverityResponse {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    breakdown: any[];
}
interface ActionsResponse {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    actions: any[];
}
interface MapResponse {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    locations: any[];
}
interface OriginsResponse {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    origins: any[];
}

interface ScanResponse {
  scans: ScanItem[];
}

interface ActivityData {
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

interface DistributionData {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
    borderColor: string;
    borderWidth: number;
  }[];
}

interface SeverityItem {
  severity: string;
  count: number;
  level: string;
  pct: number;
}

interface ActionItem {
  id: string;
  title: string;
  type: string;
  status: string;
  created_at: string;
  icon: string;
  desc: string;
}

interface ThreatLocation {
  lat: number;
  lng: number;
  country: string;
  city: string;
  ip: string;
  type: string;
  attacks: number;
  risk: string;
  color: string;
}

interface OriginItem {
  country: string;
  count: number;
  risk_score: number;
  flag: string;
  attacks: number;
  risk: string;
}

const ThreatDistributionWidget = dynamic(() => import('@/components/dashboard/ThreatDistributionWidget'), {
  ssr: false,
  loading: () => <div className="h-[220px] bg-gray-100 dark:bg-gray-800/50 rounded-sm animate-pulse" />
});

const ScanActivityWidget = dynamic(() => import('@/components/dashboard/ScanActivityWidget'), {
  ssr: false,
  loading: () => <div className="h-[220px] bg-gray-100 dark:bg-gray-800/50 rounded-sm animate-pulse" />
});

const ThreatMapWidget = dynamic(() => import('@/components/dashboard/ThreatMapWidget'), {
  ssr: false,
  loading: () => <div className="h-[220px] bg-gray-100 dark:bg-gray-800/50 rounded-sm animate-pulse" />
});

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total_scans: 0, threats_found: 0, clean_files: 0, critical_alerts: 0 });
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [distributionData, setDistributionData] = useState<DistributionData | null>(null);
  const [recentScans, setRecentScans] = useState<ScanItem[]>([]);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [severityData, setSeverityData] = useState<SeverityItem[]>([]);
  const [securityActions, setSecurityActions] = useState<ActionItem[]>([]);
  const [threatMapLocations, setThreatMapLocations] = useState<ThreatLocation[]>([]);
  const [threatOrigins, setThreatOrigins] = useState<OriginItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, activityRes, distRes, scansRes, healthRes, severityRes, actionsRes, mapRes, originsRes] = await Promise.allSettled([
          getDashboardStats(),
          getDashboardActivity(),
          getThreatDistribution(),
          getScans(1, 4),
          getSecurityHealth(),
          getSeverityBreakdown(),
          getSecurityActions(),
          getThreatMapData(),
          getThreatOrigins(),
        ]);

        // Stats
        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value as DashboardStats);
        }

        if (scansRes.status === 'fulfilled') {
          const scansData = scansRes.value as ScanResponse;
          setRecentScans((scansData.scans || []).map((s: ScanItem) => ({
            ...s,
            filename: s.filename || undefined
          })));
        }

        // Activity chart
        if (activityRes.status === 'fulfilled') {
          const activityVal = activityRes.value as ActivityResponse;
          setActivityData({
            labels: activityVal.labels,
            datasets: [{
              label: 'Scans',
              data: activityVal.data,
              borderColor: '#008f39',
              backgroundColor: 'rgba(0,143,57,0.08)',
              tension: 0.4,
              fill: true,
              pointBackgroundColor: '#008f39',
              pointBorderColor: '#fff',
              pointRadius: 4,
              pointHoverRadius: 6,
            }],
          });
        }

        // Distribution chart
        if (distRes.status === 'fulfilled') {
          const distVal = distRes.value as DistributionResponse;
          setDistributionData({
            labels: distVal.labels,
            datasets: [{
              data: distVal.data,
              backgroundColor: ['#ef4444', '#f59e0b', '#22c55e', '#8b5cf6'],
              borderColor: '#ffffff',
              borderWidth: 2,
            }],
          });
        }

        // Recent scans
        // Duplicate scan processing block removed

        // Security health
        if (healthRes.status === 'fulfilled') setHealthData(healthRes.value as HealthData);
        if (severityRes.status === 'fulfilled') setSeverityData((severityRes.value as SeverityResponse).breakdown || []);
        if (actionsRes.status === 'fulfilled') setSecurityActions((actionsRes.value as ActionsResponse).actions || []);

        if (mapRes.status === 'fulfilled') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setThreatMapLocations(((mapRes.value as MapResponse).locations || []).map((l: any) => ({
            ...l,
            risk: String(l.risk)
          })));
        }

        // Threat origins
        if (originsRes.status === 'fulfilled') setThreatOrigins((originsRes.value as OriginsResponse).origins || []);

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchData();
  }, [user]);

  const now = new Date();
  const month = now.toLocaleString('default', { month: 'short' });
  const year = now.getFullYear();

  const statCards = [
    { label: 'Total Scans', value: stats.total_scans, icon: 'search', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Threats Found', value: stats.threats_found, icon: 'bug_report', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
    { label: 'Clean Files', value: stats.clean_files, icon: 'check_circle', color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' },
    { label: 'Critical Alerts', value: stats.critical_alerts, icon: 'warning', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            className="material-icons text-primary text-4xl"
            aria-hidden="true"
          >
            sync
          </motion.span>
          <span className="font-mono text-xs text-text-muted dark:text-gray-500 tracking-wider">LOADING_DASHBOARD...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-text-main dark:text-white">
            Welcome back, <span className="text-primary">{user?.display_name || 'User'}</span>
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="font-mono text-[10px] text-text-muted dark:text-gray-500 uppercase tracking-wider">SYSTEM_STATUS: ONLINE</span>
          </div>
        </div>
        <span className="font-mono text-xs text-text-muted dark:text-gray-500 tracking-wider">
          {month} {year}
        </span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 120, damping: 16 }}
            whileHover={{ y: -3, boxShadow: '0 8px 25px rgba(0,0,0,0.06)' }}
            className={`glass-panel border p-5 flex items-center gap-4 cursor-default ${s.bg}`}
          >
            <div className={`p-2.5 rounded-sm ${s.bg}`}>
              <span className={`material-symbols-outlined text-2xl ${s.color}`} aria-hidden="true">{s.icon}</span>
            </div>
            <div>
              <p className="font-mono text-[10px] text-text-muted dark:text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
              <p className="font-display text-3xl font-bold text-text-main dark:text-white leading-none">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* System Security Health */}
      <SystemHealthWidget data={healthData} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ThreatDistributionWidget data={distributionData} />
        <ScanActivityWidget data={activityData} />
      </div>

      {/* Severity + Recent Scans Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SeverityBreakdownWidget data={severityData.length > 0 ? severityData : null} />
        <RecentScansWidget scans={recentScans} />
      </div>

      {/* Recommended Security Actions */}
      <SecurityActionsWidget actions={securityActions} />

      {/* Global Threat Map + Top Origins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ThreatMapWidget locations={threatMapLocations} />
        <ThreatOriginsWidget origins={threatOrigins} />
      </div>
    </div>
  );
}
