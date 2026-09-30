'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import EmptyState from '@/components/EmptyState';
import LocalTime from '@/components/LocalTime';
import styles from './page.module.css';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const addToast = useToast();

  useEffect(() => {
    fetch('/api/auth/accounts')
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        setAccounts(data);
      })
      .catch((err) => addToast('error', err.message))
      .finally(() => setLoading(false));

    if (searchParams.get('connected')) addToast('success', 'LinkedIn account connected!');
    if (searchParams.get('error')) addToast('error', 'Failed to connect LinkedIn.');
  }, []);

  const getTokenStatus = (expiresAt) => {
    const diff = new Date(expiresAt) - new Date();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: 'Expired', cls: styles.expired };
    if (days < 7) return { label: `${days}d left`, cls: styles.expiring };
    return { label: `${days}d left`, cls: styles.healthy };
  };

  return (
    <div>
      <div className="page-header">
        <h1>Accounts</h1>
        <p>Your LinkedIn account is connected automatically when you sign in.</p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <a href="/api/auth/signin" className="btn btn-outline">
          Reconnect LinkedIn (refresh token)
        </a>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      ) : accounts.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            }
            title="No account found"
            description="Sign in again to reconnect your LinkedIn account."
            action={<a href="/api/auth/signin" className="btn btn-primary">Sign in with LinkedIn</a>}
          />
        </div>
      ) : (
        <div className={styles.grid}>
          {accounts.map((acc) => {
            const token = getTokenStatus(acc.tokenExpiresAt);
            return (
              <div key={acc._id} className={`card ${styles.accountCard}`}>
                <div className={styles.header}>
                  <div className={styles.avatar}>
                    {acc.profilePictureUrl ? (
                      <img src={acc.profilePictureUrl} alt="" />
                    ) : (
                      <span>{(acc.displayName || '?')[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div className={styles.info}>
                    <h3>{acc.displayName || 'LinkedIn User'}</h3>
                    {acc.email && <p className={styles.email}>{acc.email}</p>}
                    <p className={styles.urn}>{acc.authorUrn}</p>
                  </div>
                </div>

                <div className={styles.meta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Token Status</span>
                    <span className={`${styles.tokenBadge} ${token.cls}`}>{token.label}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Connected</span>
                    <LocalTime date={acc.createdAt} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* How it works */}
      <div className={styles.guide}>
        <h2 className={styles.guideTitle}>How it works</h2>
        <p className={styles.guideSub}>A simple guide to scheduling and publishing your LinkedIn posts.</p>

        <div className={styles.steps}>
          <div className={`card ${styles.step}`}>
            <div className={styles.stepNum}>1</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>Sign in with LinkedIn</div>
              <p className={styles.stepDesc}>
                Click <strong>"Continue with LinkedIn"</strong> on the sign-in page. This connects your LinkedIn account and logs you in — one step, done. Your profile name and photo appear on this page once connected.
              </p>
            </div>
          </div>

          <div className={`card ${styles.step}`}>
            <div className={styles.stepNum}>2</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>Create a post</div>
              <p className={styles.stepDesc}>
                Go to <a href="/schedule"><strong>Create Post</strong></a> in the sidebar. Write your content (up to 3,000 characters), optionally attach an image, and pick a date and time. You can also use a saved <a href="/templates"><strong>Post Template</strong></a> to fill in the content quickly. A live preview shows how the post will look on LinkedIn.
              </p>
            </div>
          </div>

          <div className={`card ${styles.step}`}>
            <div className={styles.stepNum}>3</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>Schedule or save as draft</div>
              <p className={styles.stepDesc}>
                Click <strong>"Schedule Post"</strong> to queue it for auto-publishing, or <strong>"Save as Draft"</strong> to come back later. Drafts have no publish date — you can set one when you're ready. You can also bulk-import posts from a <strong>CSV or Excel</strong> file on the <a href="/posts"><strong>All Posts</strong></a> page.
              </p>
            </div>
          </div>

          <div className={`card ${styles.step}`}>
            <div className={styles.stepNum}>4</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>It publishes automatically</div>
              <p className={styles.stepDesc}>
                A background scheduler checks every ~60 seconds for posts that are due. When the time comes, it publishes your post directly to LinkedIn using your access token. You don't need to be online — close the browser, go to sleep, it handles itself. You'll get an <strong>email notification</strong> when a post publishes or fails.
              </p>
            </div>
          </div>

          <div className={`card ${styles.step}`}>
            <div className={styles.stepNum}>5</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>Track and manage</div>
              <p className={styles.stepDesc}>
                Use <a href="/posts"><strong>All Posts</strong></a> to see every post and its status. Use the <a href="/sheet"><strong>Post Sheet</strong></a> for a spreadsheet view you can export. Use <a href="/calendar"><strong>Calendar</strong></a> to see your schedule visually — drag posts between days to reschedule. Check <a href="/analytics"><strong>Analytics</strong></a> for engagement data (likes, comments, shares).
              </p>
            </div>
          </div>

          <div className={`card ${styles.step}`}>
            <div className={styles.stepNum}>6</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>Keep your token fresh</div>
              <p className={styles.stepDesc}>
                Your LinkedIn access token lasts <strong>60 days</strong>. Check the status above — if it shows <strong style={{color: 'var(--orange)'}}>expiring</strong> or <strong style={{color: 'var(--red)'}}>expired</strong>, click <strong>"Reconnect LinkedIn"</strong> to refresh it. If the token expires, pending posts will fail until you reconnect.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
