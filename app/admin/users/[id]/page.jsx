'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from './page.module.css';

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/users?userId=${userId}`)
      .then(async (r) => {
        if (r.status === 401) { router.replace('/admin'); return; }
        const json = await r.json();
        if (json.success) setData(json.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  function fmt(d) {
    if (!d) return '--';
    return new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  }

  if (loading) return <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div>;
  if (!data) return <div className={styles.page}><div className={styles.container}><p>User not found.</p><a href="/admin/dashboard" className={styles.backLink}>&larr; Back</a></div></div>;

  const primary = data.accounts?.[0];
  const s = data.stats || {};
  const b = data.behavior || {};
  const tokenDays = primary?.tokenExpiresAt ? Math.floor((new Date(primary.tokenExpiresAt) - new Date()) / 86400000) : null;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <a href="/admin/dashboard" className={styles.backLink}>&larr; Back to users</a>

        {/* Profile header */}
        <div className={styles.profileHeader}>
          {primary?.profilePictureUrl ? (
            <img src={primary.profilePictureUrl} alt="" className={styles.avatar} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {(primary?.displayName || '?')[0].toUpperCase()}
            </div>
          )}
          <div className={styles.profileInfo}>
            <h1 className={styles.profileName}>{primary?.displayName || 'Unknown'}</h1>
            <p className={styles.profileEmail}>{primary?.email || 'No email'}</p>
            <p className={styles.profileUrn}>{primary?.authorUrn || userId}</p>
            <div className={styles.profileMeta}>
              {tokenDays !== null && (
                <span className={styles.metaTag} style={{ color: tokenDays < 0 ? 'var(--red)' : tokenDays < 7 ? 'var(--orange)' : 'var(--green)' }}>
                  Token: {tokenDays < 0 ? 'Expired' : `${tokenDays}d left`}
                </span>
              )}
              {primary?.lastScreenSize && <span className={styles.metaTag}>Screen: {primary.lastScreenSize}</span>}
              {primary?.createdAt && <span className={styles.metaTag}>Connected: {new Date(primary.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className={styles.statsRow}>
          {[
            { value: s.total || 0, label: 'Total posts' },
            { value: s.published || 0, label: 'Published', color: 'var(--green)' },
            { value: s.pending || 0, label: 'Pending', color: 'var(--orange)' },
            { value: s.failed || 0, label: 'Failed', color: 'var(--red)' },
            { value: s.drafts || 0, label: 'Drafts' },
            { value: b.postsPerWeek ?? '--', label: 'Posts/week' },
            { value: b.avgPostLength ?? '--', label: 'Avg chars' },
            { value: b.imageUsageRate != null ? `${b.imageUsageRate}%` : '--', label: 'Image use' },
            { value: b.failureRate != null ? `${b.failureRate}%` : '--', label: 'Fail rate' },
            { value: b.daysSinceLastLogin ?? '--', label: 'Days since login' },
          ].map(({ value, label, color }) => (
            <div key={label} className={styles.miniStat}>
              <div className={styles.miniStatValue} style={color ? { color } : {}}>{value}</div>
              <div className={styles.miniStatLabel}>{label}</div>
            </div>
          ))}
        </div>

        {/* Cards grid */}
        <div className={styles.cardsGrid}>
          {/* Devices & browsers */}
          <div className={styles.detailCard}>
            <h3 className={styles.cardTitle}>Devices & browsers</h3>
            {(data.devices?.length > 0 || data.browsers?.length > 0 || data.operatingSystems?.length > 0) ? (
              <>
                {data.devices?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-faint)', marginBottom: 4 }}>DEVICE</div>
                    {data.devices.map((d, i) => (
                      <div key={i} className={styles.listItem}><span className={styles.listName}>{d.name}</span><span className={styles.listMeta}>{d.count}x</span></div>
                    ))}
                  </div>
                )}
                {data.browsers?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-faint)', marginBottom: 4 }}>BROWSER</div>
                    {data.browsers.map((b, i) => (
                      <div key={i} className={styles.listItem}><span className={styles.listName}>{b.name}</span><span className={styles.listMeta}>{b.count}x</span></div>
                    ))}
                  </div>
                )}
                {data.operatingSystems?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-faint)', marginBottom: 4 }}>OS</div>
                    {data.operatingSystems.map((o, i) => (
                      <div key={i} className={styles.listItem}><span className={styles.listName}>{o.name}</span><span className={styles.listMeta}>{o.count}x</span></div>
                    ))}
                  </div>
                )}
              </>
            ) : <p className={styles.muted}>No device data yet</p>}
          </div>

          {/* Login locations */}
          <div className={styles.detailCard}>
            <h3 className={styles.cardTitle}>Login locations</h3>
            {data.loginLocations?.length > 0 ? (
              data.loginLocations.map((loc, i) => (
                <div key={i} className={styles.listItem}>
                  <span className={styles.listName}>{[loc.city, loc.region, loc.country].filter(Boolean).join(', ')}</span>
                  <span className={styles.listMeta}>{loc.count} login{loc.count !== 1 ? 's' : ''}</span>
                </div>
              ))
            ) : <p className={styles.muted}>No location data yet</p>}
          </div>

          {/* Active hours */}
          <div className={styles.detailCard}>
            <h3 className={styles.cardTitle}>Most active hours (IST)</h3>
            {data.activeHours?.length > 0 ? (
              data.activeHours.map((h, i) => {
                // UTC hour → IST: add 5h 30m
                const utcMin = h.hour * 60;
                const istTotalMin = utcMin + 330; // +5:30 = 330 minutes
                const istH = Math.floor(istTotalMin / 60) % 24;
                const istM = istTotalMin % 60;
                return (
                <div key={i} className={styles.listItem}>
                  <span className={styles.listName}>{String(istH).padStart(2, '0')}:{String(istM).padStart(2, '0')}</span>
                  <span className={styles.listMeta}>{h.count} actions</span>
                </div>
              );
              })
            ) : <p className={styles.muted}>No data yet</p>}
          </div>

          {/* Accounts */}
          <div className={styles.detailCard}>
            <h3 className={styles.cardTitle}>Connected accounts ({data.accounts?.length || 0})</h3>
            {data.accounts?.length > 0 ? (
              data.accounts.map((acc, i) => (
                <div key={i} className={styles.listItem}>
                  <div>
                    <span className={styles.listName}>{acc.displayName || 'Unknown'}</span>
                    <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'monospace' }}>{acc.authorUrn}</div>
                  </div>
                  <span className={styles.metaTag}>{acc.accountType}</span>
                </div>
              ))
            ) : <p className={styles.muted}>No accounts</p>}
          </div>
        </div>

        {/* Activity timeline */}
        <div className={styles.detailCard} style={{ marginBottom: 16 }}>
          <h3 className={styles.cardTitle}>Recent activity ({data.activities?.length || 0})</h3>
          {data.activities?.length > 0 ? (
            <div className={styles.timeline}>
              {data.activities.map((act, i) => (
                <div key={i} className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div style={{ flex: 1 }}>
                    <span className={styles.timelineAction}>{act.action.replace(/_/g, ' ')}</span>
                    {act.device && <span className={styles.timelineDevice}> · {act.device}</span>}
                    {act.browser && <span className={styles.timelineDevice}> · {act.browser}</span>}
                    {act.city && <span className={styles.timelineDevice}> · {act.city}, {act.country}</span>}
                    {act.ip && <span className={styles.timelineIp}> · {act.ip}</span>}
                  </div>
                  <span className={styles.timelineTime}>{fmt(act.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : <p className={styles.muted}>No activity yet</p>}
        </div>

        {/* Recent posts */}
        <div className={styles.detailCard}>
          <h3 className={styles.cardTitle}>Recent posts ({data.recentPosts?.length || 0})</h3>
          {data.recentPosts?.length > 0 ? (
            <table className={styles.postsTable}>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Text</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {data.recentPosts.map((post) => (
                  <tr key={post._id}>
                    <td><span className={`badge badge-${post.status.toLowerCase()}`}>{post.status}</span></td>
                    <td><span className={styles.postText}>{post.commentary}</span></td>
                    <td className={styles.muted}>{fmt(post.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className={styles.muted}>No posts yet</p>}
        </div>
      </div>
    </main>
  );
}
