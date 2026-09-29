'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import EmptyState from '@/components/EmptyState';
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
                    <span>{new Date(acc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Setup Guide */}
      <div className={styles.guide}>
        <h2 className={styles.guideTitle}>How to configure</h2>
        <p className={styles.guideSub}>Follow these steps to set up LinkedIn posting for the first time or on a new deployment.</p>

        <div className={styles.steps}>
          <div className={`card ${styles.step}`}>
            <div className={styles.stepNum}>1</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>Create a LinkedIn App</div>
              <p className={styles.stepDesc}>
                Go to <a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noopener noreferrer">LinkedIn Developer Portal</a> and create a new app.
                Under the <strong>Products</strong> tab, request access to <strong>Share on LinkedIn</strong> and <strong>Sign In with LinkedIn using OpenID Connect</strong>.
              </p>
            </div>
          </div>

          <div className={`card ${styles.step}`}>
            <div className={styles.stepNum}>2</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>Set the redirect URI</div>
              <p className={styles.stepDesc}>
                In your LinkedIn app's <strong>Auth</strong> tab, add the redirect URL. For local development use <code>http://localhost:3000/api/auth/signin/callback</code>. For production, use your deployed URL:
              </p>
              <div className={styles.envBlock}>{`http://localhost:3000/api/auth/signin/callback
https://your-domain.vercel.app/api/auth/signin/callback`}</div>
            </div>
          </div>

          <div className={`card ${styles.step}`}>
            <div className={styles.stepNum}>3</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>Set environment variables</div>
              <p className={styles.stepDesc}>
                Copy your Client ID and Client Secret from the LinkedIn app, then set these environment variables in your <code>.env.local</code> file (local) or Vercel dashboard (production):
              </p>
              <div className={styles.envBlock}>{`LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/auth/signin/callback
AUTH_SECRET=generate_a_random_32_char_string
MONGODB_URI=your_mongodb_connection_string
LINKEDIN_VERSION=202601`}</div>
            </div>
          </div>

          <div className={`card ${styles.step}`}>
            <div className={styles.stepNum}>4</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>Connect your account</div>
              <p className={styles.stepDesc}>
                Click <strong>"Reconnect LinkedIn"</strong> above or sign in from the login page. After authorizing, your LinkedIn profile and access token are stored securely. The token lasts <strong>60 days</strong> — come back to this page to check its status and refresh before it expires.
              </p>
            </div>
          </div>

          <div className={`card ${styles.step}`}>
            <div className={styles.stepNum}>5</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>Set up auto-publishing (Vercel)</div>
              <p className={styles.stepDesc}>
                On Vercel, add a <code>CRON_SECRET</code> env var (16+ random characters). The scheduler runs via an Apps Script trigger or Vercel Cron that calls <code>/api/cron</code> every minute to publish due posts.
              </p>
            </div>
          </div>

          <div className={`card ${styles.step}`}>
            <div className={styles.stepNum}>6</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>Email notifications (optional)</div>
              <p className={styles.stepDesc}>
                To receive emails when posts publish or fail, add your Gmail credentials. Use an <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">App Password</a> (not your regular password):
              </p>
              <div className={styles.envBlock}>{`SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx`}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
