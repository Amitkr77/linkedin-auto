'use client';
import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 401) { router.replace('/admin'); return; }
      const json = await res.json();
      if (!json.success) { setError(json.message || 'Failed'); return; }
      setData(json);
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin');
  }

  function formatDateTime(d) {
    if (!d) return '--';
    return new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  }

  if (loading) return <div className={styles.loadingPage}><div className={styles.spinner} /></div>;
  if (error) return (
    <main className={styles.page}><div className={styles.container}>
      <div className="alert alert-error">{error}</div>
      <button className="btn btn-outline" onClick={() => router.replace('/admin')}>Back</button>
    </div></main>
  );

  const { users, platformStats: ps } = data;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.lockBadge}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <h1 className={styles.headerTitle}>Admin Dashboard</h1>
              <p className={styles.headerSub}>Platform overview and user management</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/admin/settings" className="btn btn-ghost">Settings</a>
            <button className="btn btn-ghost" onClick={fetchUsers}>Refresh</button>
            <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* Platform stats */}
        <div className={styles.statsGrid}>
          {[
            { label: 'Users', value: ps.totalUsers },
            { label: 'Accounts', value: ps.totalAccounts },
            { label: 'Total Posts', value: ps.totalPosts },
            { label: 'Published', value: ps.totalPublished, cls: styles.statPublished },
            { label: 'Pending', value: ps.totalPending, cls: styles.statPending },
            { label: 'Failed', value: ps.totalFailed, cls: styles.statFailed },
            { label: 'Drafts', value: ps.totalDrafts },
            { label: 'Total Logins', value: ps.totalLogins || 0 },
            { label: 'Total Actions', value: ps.totalActions || 0 },
          ].map(({ label, value, cls }) => (
            <div key={label} className={styles.statCard}>
              <div className={styles.statLabel}>{label}</div>
              <div className={`${styles.statValue} ${cls || ''}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div className={styles.tableWrap}>
          {users.length === 0 ? (
            <div className={styles.emptyState}><p>No users yet</p></div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Location</th>
                  <th className={styles.numCell}>Posts</th>
                  <th className={styles.numCell}>Published</th>
                  <th className={styles.numCell}>Logins</th>
                  <th>Last Active</th>
                  <th>Token</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const tokenDays = user.tokenExpiresAt ? Math.floor((new Date(user.tokenExpiresAt) - new Date()) / 86400000) : null;
                  const tokenStatus = tokenDays === null ? '--' : tokenDays < 0 ? 'Expired' : `${tokenDays}d`;
                  const tokenColor = tokenDays === null ? '' : tokenDays < 0 ? 'var(--red)' : tokenDays < 7 ? 'var(--orange)' : 'var(--green)';
                  const location = [user.lastCity, user.lastCountry].filter(Boolean).join(', ') || '--';

                  return (
                    <tr key={user.ownerId} onClick={() => router.push(`/admin/users/${user.ownerId}`)} className={styles.clickableRow}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {user.profilePictureUrl ? (
                            <img src={user.profilePictureUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--blue-light)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                              {(user.displayName || '?')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className={styles.userName}>{user.displayName}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{user.authorUrn}</div>
                          </div>
                        </div>
                      </td>
                      <td className={styles.userEmail}>{user.email}</td>
                      <td style={{ fontSize: 13 }}>{location}</td>
                      <td className={styles.numCell}>{user.total}</td>
                      <td className={styles.numCell}>{user.published}</td>
                      <td className={styles.numCell}>{user.loginCount || 0}</td>
                      <td className={styles.dateCell}>{formatDateTime(user.lastActive)}</td>
                      <td style={{ fontWeight: 600, color: tokenColor, fontSize: 13 }}>{tokenStatus}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
