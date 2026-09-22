'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from '@/lib/auth-client';
import ThemeToggle from './ThemeToggle';
import styles from './Sidebar.module.css';

const navLinks = [
  {
    href: '/',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    href: '/schedule',
    label: 'Create Post',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
  },
  {
    href: '/posts',
    label: 'All Posts',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    href: '/templates',
    label: 'Templates',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
      </svg>
    ),
  },
  {
    href: '/calendar',
    label: 'Calendar',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    href: '/accounts',
    label: 'Accounts',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
];

export default function Sidebar({ isOpen, onToggle }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      const result = await signOut();
      if (result?.error) throw new Error(result.error.message || 'Sign out failed');
      // replace() prevents Back from reopening an authenticated page from history.
      window.location.replace('/sign-in?signedOut=1');
    } catch {
      setIsSigningOut(false);
      window.alert('Sign out failed. Please try again.');
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className={styles.overlay} onClick={onToggle} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.logo}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
              <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
            </svg>
          </div>
          <span className={styles.brandText}>LinkedIn Auto</span>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {navLinks.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.navLink} ${pathname === href ? styles.active : ''}`}
              onClick={() => { if (window.innerWidth < 768) onToggle(); }}
            >
              <span className={styles.navIcon}>{icon}</span>
              <span className={styles.navLabel}>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className={styles.footer}>
          <ThemeToggle />
          {session?.user && <span className={styles.navLabel}>{session.user.name || session.user.email}</span>}
          <button className={styles.connectBtn} onClick={handleSignOut} disabled={isSigningOut}>
            <span>{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
