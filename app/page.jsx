import Link from 'next/link';
import { connectDB } from '@/lib/db';
import Post from '@/lib/models/Post';
import Account from '@/lib/models/Account';
import EmptyState from '@/components/EmptyState';
import styles from './page.module.css';
import LocalTime from '@/components/LocalTime';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

async function getTokenWarning(ownerId) {
  await connectDB();
  const accounts = await Account.find({ ownerId }).select('tokenExpiresAt displayName').lean();
  for (const acc of accounts) {
    const days = Math.floor((new Date(acc.tokenExpiresAt) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { level: 'expired', days: 0, name: acc.displayName || 'Your account' };
    if (days < 7) return { level: 'expiring', days, name: acc.displayName || 'Your account' };
  }
  return null;
}

async function getStats(ownerId) {
  await connectDB();
  const [total, pending, published, failed, accounts] = await Promise.all([
    Post.countDocuments({ ownerId }),
    Post.countDocuments({ ownerId, status: 'PENDING' }),
    Post.countDocuments({ ownerId, status: 'PUBLISHED' }),
    Post.countDocuments({ ownerId, status: 'FAILED' }),
    Account.countDocuments({ ownerId }),
  ]);
  return { total, pending, published, failed, accounts };
}

async function getRecentPosts(ownerId) {
  await connectDB();
  return Post.find({ ownerId })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('account', 'authorUrn')
    .lean();
}

export default async function Dashboard() {
  const session = await getSession();
  if (!session?.userId) redirect('/sign-in');
  const ownerId = session.userId;
  const [stats, recentPosts, tokenWarning] = await Promise.all([getStats(ownerId), getRecentPosts(ownerId), getTokenWarning(ownerId)]);

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {session.name || 'there'}.</p>
      </div>

      {tokenWarning?.level === 'expired' && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <strong>{tokenWarning.name}:</strong> LinkedIn token has expired. Scheduled posts will fail.{' '}
          <a href="/api/auth/signin" style={{ textDecoration: 'underline', fontWeight: 600 }}>Reconnect now</a>
        </div>
      )}
      {tokenWarning?.level === 'expiring' && (
        <div className="alert alert-error" style={{ marginBottom: 20, background: '#fef9c3', color: '#854d0e' }}>
          <strong>{tokenWarning.name}:</strong> LinkedIn token expires in {tokenWarning.days} day{tokenWarning.days !== 1 ? 's' : ''}.{' '}
          <a href="/api/auth/signin" style={{ textDecoration: 'underline', fontWeight: 600 }}>Reconnect to refresh</a>
        </div>
      )}

      <div className={styles.statsGrid}>
        {[
          { value: stats.accounts, label: 'Accounts', cls: '' },
          { value: stats.total, label: 'Total Posts', cls: '' },
          { value: stats.pending, label: 'Pending', cls: styles.pending },
          { value: stats.published, label: 'Published', cls: styles.published },
          { value: stats.failed, label: 'Failed', cls: styles.failed },
        ].map(({ value, label, cls }) => (
          <div key={label} className={`card card-hover ${styles.statCard} ${cls}`}>
            <div className={styles.statValue}>{value}</div>
            <div className={styles.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <Link href="/schedule" className="btn btn-primary">+ Create Post</Link>
        <Link href="/accounts" className="btn btn-outline">Account</Link>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2 className={styles.sectionTitle}>Recent Posts</h2>
        {recentPosts.length === 0 ? (
          <EmptyState
            icon={
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            }
            title="No posts yet"
            description="Schedule your first LinkedIn post to get started."
            action={<Link href="/schedule" className="btn btn-primary">Create Post</Link>}
          />
        ) : (
          <>
            <div className={styles.postList}>
              {recentPosts.map((post) => (
                <div key={post._id} className={styles.postRow}>
                  <div className={styles.postInfo}>
                    <p className={styles.commentary}>{post.commentary}</p>
                    <span className={styles.postTime}>
                      <LocalTime date={post.scheduledAt} />
                    </span>
                  </div>
                  <span className={`badge badge-${post.status.toLowerCase()}`}>
                    {post.status}
                  </span>
                </div>
              ))}
            </div>
            <Link href="/posts" className={styles.viewAll}>View all posts →</Link>
          </>
        )}
      </div>
    </div>
  );
}
