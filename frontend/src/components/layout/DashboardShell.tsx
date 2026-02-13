'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';
import { getUnreadCount, getNotifications, markAllRead, markNotificationRead } from '@/lib/api';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  { name: 'Scans', path: '/scans', icon: 'radar' },
  { name: 'Rules', path: '/rules', icon: 'gavel' },
  { name: 'Reports', path: '/reports', icon: 'assessment' },
  { name: 'Settings', path: '/settings', icon: 'settings' },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const bellRef = useRef<HTMLDivElement>(null);

  // Fetch unread count + recent notifications
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const data = await getUnreadCount();
        setUnread(data.count || 0);
      } catch { /* not logged in */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when bell opens
  useEffect(() => {
    if (bellOpen) {
      getNotifications(1, 8).then(data => setNotifications(data.notifications || [])).catch(() => {});
    }
  }, [bellOpen]);

  // Close bell dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setUnread(0);
      setNotifications(n => n.map(x => ({ ...x, is_read: true })));
    } catch {}
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const currentPage = navItems.find(i => pathname.startsWith(i.path))?.name || 'Dashboard';

  return (
    <div className="min-h-screen relative selection:bg-primary selection:text-white">
      {/* Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: `linear-gradient(rgba(0,143,57,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,143,57,0.05) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-gray-200 dark:border-gray-800 px-6 py-3">
        <div className="flex items-center justify-between max-w-[1400px] mx-auto">
          {/* Logo + Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 no-underline group" aria-label="ThreatForge Home">
              <motion.span
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="material-icons text-primary text-2xl"
                aria-hidden="true"
              >
                security
              </motion.span>
              <span className="font-display text-lg font-bold tracking-[0.1em] text-text-main dark:text-white">
                THREAT<span className="text-primary">FORGE</span>
              </span>
            </Link>

            {/* Nav Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs uppercase tracking-wider no-underline transition-all duration-200 border ${
                      isActive
                        ? 'border-primary/30 bg-primary/5 text-primary font-bold'
                        : 'border-transparent text-text-muted dark:text-gray-500 hover:text-text-main dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    [{item.name}]
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 border border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-all"
              aria-label="Toggle Search"
            >
              <span className="material-symbols-outlined text-lg text-text-muted dark:text-gray-500" aria-hidden="true">search</span>
            </button>

            {/* Notification Bell */}
            <div ref={bellRef} className="relative">
              <button
                onClick={() => setBellOpen(!bellOpen)}
                className="p-2 border border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-all relative"
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined text-lg text-text-muted dark:text-gray-500" aria-hidden="true">notifications</span>
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-mono font-bold flex items-center justify-center rounded-full">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {bellOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 glass-panel border border-gray-200 dark:border-gray-700 z-50 shadow-xl">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-mono text-xs font-bold text-text-main dark:text-white tracking-wider">NOTIFICATIONS</span>
                    {unread > 0 && (
                      <button onClick={handleMarkAllRead} className="font-mono text-[10px] text-primary hover:underline">MARK ALL READ</button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <span className="material-symbols-outlined text-2xl text-gray-400 mb-1 block" aria-hidden="true">notifications_off</span>
                        <p className="font-mono text-[11px] text-gray-500">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n: any) => (
                        <div key={n.id}
                          className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}
                          onClick={async () => {
                            if (!n.is_read) {
                              try { await markNotificationRead(n.id); setUnread(u => Math.max(0, u - 1)); setNotifications(ns => ns.map(x => x.id === n.id ? { ...x, is_read: true } : x)); } catch {}
                            }
                            if (n.metadata?.scan_id) router.push(`/scans/${n.metadata.scan_id}`);
                            setBellOpen(false);
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <span className={`material-symbols-outlined text-sm mt-0.5 ${
                              n.type === 'threat_alert' ? 'text-red-500' :
                              n.type === 'scan_complete' ? 'text-green-500' :
                              'text-primary'
                            }`} aria-hidden="true">
                              {n.type === 'threat_alert' ? 'warning' : n.type === 'scan_complete' ? 'check_circle' : 'info'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-mono text-[11px] font-bold text-text-main dark:text-white truncate">{n.title}</p>
                              <p className="font-mono text-[10px] text-gray-500 truncate">{n.message}</p>
                              <p className="font-mono text-[9px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                            </div>
                            {!n.is_read && <span className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                    <Link href="/settings" onClick={() => setBellOpen(false)} className="font-mono text-[10px] text-primary hover:underline no-underline">VIEW ALL SETTINGS →</Link>
                  </div>
                </div>
              )}
            </div>
            <div className="relative group">
              <button 
                className="w-8 h-8 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-display font-bold text-sm"
                aria-label="User Menu"
              >
                {user?.display_name?.charAt(0).toUpperCase() || 'U'}
              </button>
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-48 glass-panel border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="font-mono text-xs font-bold text-text-main dark:text-white truncate">{user?.display_name}</p>
                  <p className="font-mono text-[10px] text-text-muted dark:text-gray-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 font-mono text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">logout</span>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar (expandable) */}
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="max-w-[1400px] mx-auto mt-3"
          >
            <input
              autoFocus
              type="text"
              placeholder="Search scans, rules, threats..."
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 font-mono text-sm text-text-main dark:text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              aria-label="Search Input"
            />
          </motion.div>
        )}
      </header>

      {/* Page Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-6 relative z-10">
        {children}
      </main>
    </div>
  );
}
