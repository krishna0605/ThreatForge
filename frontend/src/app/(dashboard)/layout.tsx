import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardShell from '@/components/layout/DashboardShell';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | ThreatForge Dashboard',
    default: 'Dashboard | ThreatForge',
  },
  description: 'Monitor your security posture, view real-time threat maps, and manage scan results.',
  robots: {
    index: false, // Dashboard should not be indexed
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardShell>
        {children}
      </DashboardShell>
    </ProtectedRoute>
  );
}
