'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 401) {
        router.replace('/admin');
        return;
      }
      const json = await res.json();
      if (!json.success) {
        setError(json.message || 'Failed to load data');
        return;
      }
      setData(json);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (error) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className="alert alert-error">{error}</div>
          <button className="btn btn-outline" onClick={() => router.replace('/admin')}>
            Back to Login
          </button>
        </div>
      </main>
    );
  }

  const { users, platformStats } = data;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.lockBadge}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h1 className={styles.headerTitle}>Admin Dashboard</h1>
              <p className={styles.headerSub}>Platform overview and user management</p>
            </div>
          </div>
          <button className={`btn btn-outline ${styles.logoutBtn}`} onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Users</div>
            <div className={styles.statValue}>{platformStats.totalUsers}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Accounts</div>
            <div className={styles.statValue}>{platformStats.totalAccounts}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Posts</div>
            <div className={styles.statValue}>{platformStats.totalPosts}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Published</div>
            <div className={`${styles.statValue} ${styles.statPublished}`}>{platformStats.totalPublished}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Pending</div>
            <div className={`${styles.statValue} ${styles.statPending}`}>{platformStats.totalPending}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Failed</div>
            <div className={`${styles.statValue} ${styles.statFailed}`}>{platformStats.totalFailed}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Drafts</div>
            <div className={styles.statValue}>{platformStats.totalDrafts}</div>
          </div>
        </div>

        {/* Users Table */}
        <div className={styles.tableWrap}>
          {users.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No users yet</p>
              <span>Users will appear here once they connect their LinkedIn accounts.</span>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>LinkedIn URN</th>
                  <th className={styles.numCell}>Posts</th>
                  <th className={styles.numCell}>Published</th>
                  <th className={styles.numCell}>Pending</th>
                  <th className={styles.numCell}>Failed</th>
                  <th>Last Active</th>
                  <th>Connected</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.ownerId}>
                    <td className={styles.userName}>{user.displayName}</td>
                    <td className={styles.userEmail}>{user.email}</td>
                    <td className={styles.urn} title={user.authorUrn}>{user.authorUrn}</td>
                    <td className={styles.numCell}>{user.total}</td>
                    <td className={styles.numCell}>{user.published}</td>
                    <td className={styles.numCell}>{user.pending}</td>
                    <td className={styles.numCell}>{user.failed}</td>
                    <td className={styles.dateCell}>{formatDate(user.lastPostDate)}</td>
                    <td className={styles.dateCell}>{formatDate(user.connectedDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
