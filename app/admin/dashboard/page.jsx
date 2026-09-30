'use client';
import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  async function loadUserDetail(ownerId) {
    if (expandedUser === ownerId) { setExpandedUser(null); setUserDetail(null); return; }
    setExpandedUser(ownerId);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/users?userId=${ownerId}`);
      const json = await res.json();
      if (json.success) setUserDetail(json.user);
    } catch { /* ignore */ }
    setDetailLoading(false);
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin');
  }

  function formatDate(d) {
    if (!d) return '--';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  function formatDateTime(d) {
    if (!d) return '--';
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
              <p className={styles.headerSub}>Platform overview, user activity, and analytics</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
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
                  <th></th>
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
                  const isExpanded = expandedUser === user.ownerId;
                  const tokenDays = user.tokenExpiresAt ? Math.floor((new Date(user.tokenExpiresAt) - new Date()) / 86400000) : null;
                  const tokenStatus = tokenDays === null ? '--' : tokenDays < 0 ? 'Expired' : `${tokenDays}d`;
                  const tokenColor = tokenDays === null ? '' : tokenDays < 0 ? 'var(--red)' : tokenDays < 7 ? 'var(--orange)' : 'var(--green)';
                  const location = [user.lastCity, user.lastCountry].filter(Boolean).join(', ') || '--';

                  return (
                    <Fragment key={user.ownerId}>
                      <tr className={isExpanded ? styles.expandedRow : ''} onClick={() => loadUserDetail(user.ownerId)} style={{ cursor: 'pointer' }}>
                        <td style={{ width: 32, textAlign: 'center' }}>
                          <span style={{ fontSize: 12, transition: 'transform 0.2s', display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>&#9654;</span>
                        </td>
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
                      {isExpanded && (
                        <tr>
                          <td colSpan="9" className={styles.detailCell}>
                            {detailLoading ? (
                              <p style={{ color: 'var(--text-muted)', padding: 16 }}>Loading...</p>
                            ) : userDetail ? (
                              <div className={styles.detailGrid}>
                                {/* Behavior stats */}
                                {userDetail.behavior && (
                                  <div className={styles.detailCard}>
                                    <h4 className={styles.detailTitle}>Behavior insights</h4>
                                    <div className={styles.behaviorGrid}>
                                      <div className={styles.behaviorItem}>
                                        <div className={styles.behaviorValue}>{userDetail.behavior.postsPerWeek}</div>
                                        <div className={styles.behaviorLabel}>Posts/week</div>
                                      </div>
                                      <div className={styles.behaviorItem}>
                                        <div className={styles.behaviorValue}>{userDetail.behavior.avgPostLength}</div>
                                        <div className={styles.behaviorLabel}>Avg chars</div>
                                      </div>
                                      <div className={styles.behaviorItem}>
                                        <div className={styles.behaviorValue}>{userDetail.behavior.imageUsageRate}%</div>
                                        <div className={styles.behaviorLabel}>Image use</div>
                                      </div>
                                      <div className={styles.behaviorItem}>
                                        <div className={styles.behaviorValue}>{userDetail.behavior.failureRate}%</div>
                                        <div className={styles.behaviorLabel}>Fail rate</div>
                                      </div>
                                      <div className={styles.behaviorItem}>
                                        <div className={styles.behaviorValue}>{userDetail.behavior.daysSinceLastLogin ?? '--'}</div>
                                        <div className={styles.behaviorLabel}>Days since login</div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Device / Browser / OS */}
                                <div className={styles.detailCard}>
                                  <h4 className={styles.detailTitle}>Devices & browsers</h4>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {(userDetail.devices?.length > 0) && (
                                      <div>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-faint)', marginBottom: 4 }}>DEVICE</div>
                                        {userDetail.devices.map((d, i) => (
                                          <div key={i} className={styles.locationItem}>
                                            <span className={styles.locationName}>{d.name}</span>
                                            <span className={styles.locationMeta}>{d.count}x</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {(userDetail.browsers?.length > 0) && (
                                      <div>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-faint)', marginBottom: 4 }}>BROWSER</div>
                                        {userDetail.browsers.map((b, i) => (
                                          <div key={i} className={styles.locationItem}>
                                            <span className={styles.locationName}>{b.name}</span>
                                            <span className={styles.locationMeta}>{b.count}x</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {(userDetail.operatingSystems?.length > 0) && (
                                      <div>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-faint)', marginBottom: 4 }}>OS</div>
                                        {userDetail.operatingSystems.map((o, i) => (
                                          <div key={i} className={styles.locationItem}>
                                            <span className={styles.locationName}>{o.name}</span>
                                            <span className={styles.locationMeta}>{o.count}x</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {(!userDetail.devices?.length && !userDetail.browsers?.length) && (
                                      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No device data yet</p>
                                    )}
                                  </div>
                                </div>

                                {/* Login locations */}
                                <div className={styles.detailCard}>
                                  <h4 className={styles.detailTitle}>Login locations</h4>
                                  {userDetail.loginLocations.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No location data yet</p>
                                  ) : (
                                    <div className={styles.locationList}>
                                      {userDetail.loginLocations.map((loc, i) => (
                                        <div key={i} className={styles.locationItem}>
                                          <span className={styles.locationName}>
                                            {[loc.city, loc.region, loc.country].filter(Boolean).join(', ')}
                                          </span>
                                          <span className={styles.locationMeta}>{loc.count} login{loc.count !== 1 ? 's' : ''}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Active hours */}
                                <div className={styles.detailCard}>
                                  <h4 className={styles.detailTitle}>Most active hours (UTC)</h4>
                                  {(userDetail.activeHours?.length > 0) ? (
                                    <div className={styles.locationList}>
                                      {userDetail.activeHours.map((h, i) => (
                                        <div key={i} className={styles.locationItem}>
                                          <span className={styles.locationName}>{String(h.hour).padStart(2, '0')}:00</span>
                                          <span className={styles.locationMeta}>{h.count} actions</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet</p>
                                  )}
                                </div>

                                {/* Recent activity */}
                                <div className={styles.detailCard}>
                                  <h4 className={styles.detailTitle}>Recent activity</h4>
                                  {userDetail.activities.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No activity yet</p>
                                  ) : (
                                    <div className={styles.activityList}>
                                      {userDetail.activities.slice(0, 15).map((act, i) => (
                                        <div key={i} className={styles.activityItem}>
                                          <span className={styles.activityAction}>{act.action.replace(/_/g, ' ')}</span>
                                          <span className={styles.activityTime}>{formatDateTime(act.createdAt)}</span>
                                          {act.device && <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{act.device}</span>}
                                          {act.ip && <span className={styles.activityIp}>{act.ip}</span>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Recent posts */}
                                <div className={styles.detailCard} style={{ gridColumn: '1 / -1' }}>
                                  <h4 className={styles.detailTitle}>Recent posts</h4>
                                  {userDetail.recentPosts.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No posts yet</p>
                                  ) : (
                                    <div className={styles.postList}>
                                      {userDetail.recentPosts.map((post) => (
                                        <div key={post._id} className={styles.postItem}>
                                          <span className={`badge badge-${post.status.toLowerCase()}`}>{post.status}</span>
                                          <span className={styles.postText}>{post.commentary}</span>
                                          <span className={styles.postDate}>{formatDateTime(post.createdAt)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      )}
                    </Fragment>
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

