'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import styles from './AppShell.module.css';

// Ping /api/cron/tick every 60s while the tab is visible.
// Keeps scheduled posts publishing on Vercel free tier (1 cron/day limit).
function useSchedulerHeartbeat() {
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'hidden') return;
      fetch('/api/cron/tick', { method: 'POST' }).catch(() => {});
    };
    const initial = setTimeout(tick, 5_000);
    const interval = setInterval(tick, 60_000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, []);
}

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  useSchedulerHeartbeat();
  if (pathname === '/sign-in' || pathname.startsWith('/admin')) return children;

  return (
    <div className={styles.shell}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className={styles.main}>
        {/* Mobile header */}
        <header className={styles.mobileHeader}>
          <button
            className={styles.hamburger}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <img src="https://fuyl.in/cdn/shop/files/Final_Logo_290526.png?v=1780044950&width=300" alt="FUYL" style={{ height: 22 }} />
        </header>

        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}
