'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import LocalTime from '@/components/LocalTime';
import EmptyState from '@/components/EmptyState';
import styles from './page.module.css';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const addToast = useToast();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (err) {
      addToast('error', err.message);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const refreshAnalytics = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      addToast('success', `Refreshed ${json.refreshed} post(s). ${json.skipped} skipped.`);
      await fetchData();
    } catch (err) {
      addToast('error', err.message);
    }
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>Analytics</h1>
          <p>Insights on your LinkedIn posting activity.</p>
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Loading analytics...</p>
      </div>
    );
  }

  const stats = data?.stats || {};
  const posts = data?.posts || [];

  return (
    <div>
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Insights on your LinkedIn posting activity and engagement.</p>
      </div>

      {/* Post counts */}
      <div className={styles.statsGrid}>
        <div className={`card ${styles.stat}`}>
          <div className={styles.statValue} style={{ color: 'var(--green)' }}>{stats.total || 0}</div>
          <div className={styles.statLabel}>Published</div>
        </div>
        <div className={`card ${styles.stat}`}>
          <div className={styles.statValue} style={{ color: 'var(--orange)' }}>{stats.pending || 0}</div>
          <div className={styles.statLabel}>Pending</div>
        </div>
        <div className={`card ${styles.stat}`}>
          <div className={styles.statValue} style={{ color: 'var(--red)' }}>{stats.failed || 0}</div>
          <div className={styles.statLabel}>Failed</div>
        </div>
        <div className={`card ${styles.stat}`}>
          <div className={styles.statValue} style={{ color: 'var(--blue)' }}>{stats.drafts || 0}</div>
          <div className={styles.statLabel}>Drafts</div>
        </div>
      </div>

      {/* Engagement summary */}
      <div className={styles.engagementGrid}>
        <div className={`card ${styles.engageStat}`}>
          <div className={styles.engageIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
            </svg>
          </div>
          <div className={styles.engageValue}>{stats.totalLikes || 0}</div>
          <div className={styles.engageLabel}>Total Likes</div>
        </div>
        <div className={`card ${styles.engageStat}`}>
          <div className={styles.engageIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div className={styles.engageValue}>{stats.totalComments || 0}</div>
          <div className={styles.engageLabel}>Total Comments</div>
        </div>
        <div className={`card ${styles.engageStat}`}>
          <div className={styles.engageIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </div>
          <div className={styles.engageValue}>{stats.totalShares || 0}</div>
          <div className={styles.engageLabel}>Total Shares</div>
        </div>
        <div className={`card ${styles.engageStat}`}>
          <div className={styles.engageIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div className={styles.engageValue}>{stats.totalImpressions || 0}</div>
          <div className={styles.engageLabel}>Impressions</div>
        </div>
      </div>

      {/* Published posts ranked by engagement */}
      <div className="card">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Published Posts — Ranked by Engagement</h2>
          <button
            className={`btn btn-outline btn-sm ${styles.refreshBtn}`}
            onClick={refreshAnalytics}
            disabled={refreshing}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={refreshing ? styles.spinning : ''}>
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            {refreshing ? 'Refreshing…' : 'Refresh Data'}
          </button>
        </div>

        {posts.length === 0 ? (
          <EmptyState
            icon={
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            }
            title="No published posts yet"
            description="Publish some posts to see engagement stats here."
            action={<Link href="/schedule" className="btn btn-primary">Create Post</Link>}
          />
        ) : (
          <div className={styles.postList}>
            {posts.map((post, i) => {
              const a = post.analytics || {};
              return (
                <div key={post._id} className={styles.postRow}>
                  <div className={`${styles.rank} ${i < 3 ? styles.top : ''}`}>
                    #{i + 1}
                  </div>
                  <div className={styles.postInfo}>
                    <p className={styles.commentary}>{post.commentary}</p>
                    <div className={styles.postMeta}>
                      <span>{post.account?.displayName || post.account?.authorUrn}</span>
                      <LocalTime date={post.createdAt} />
                      {post.linkedinPostUrn && (
                        <span className={styles.urn}>{post.linkedinPostUrn}</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.engageBadges}>
                    <span className={styles.engageBadge}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                      </svg>
                      {a.likes || 0}
                    </span>
                    <span className={styles.engageBadge}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      {a.comments || 0}
                    </span>
                    <span className={styles.engageBadge}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/>
                      </svg>
                      {a.shares || 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {posts.some((p) => p.analytics?.fetchedAt) && (
          <p className={styles.lastRefreshed}>
            Last refreshed: <LocalTime date={new Date(
              Math.max(...posts.filter((p) => p.analytics?.fetchedAt).map((p) => new Date(p.analytics.fetchedAt).getTime()))
            )} />
          </p>
        )}
      </div>
    </div>
  );
}
