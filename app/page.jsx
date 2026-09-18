import Link from 'next/link';
import { connectDB } from '@/lib/db';
import Post from '@/lib/models/Post';
import Account from '@/lib/models/Account';
import EmptyState from '@/components/EmptyState';
import styles from './page.module.css';

async function getStats() {
  await connectDB();
  const [total, pending, published, failed, accounts] = await Promise.all([
    Post.countDocuments(),
    Post.countDocuments({ status: 'PENDING' }),
    Post.countDocuments({ status: 'PUBLISHED' }),
    Post.countDocuments({ status: 'FAILED' }),
    Account.countDocuments(),
  ]);
  return { total, pending, published, failed, accounts };
}

async function getRecentPosts() {
  await connectDB();
  return Post.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('account', 'authorUrn')
    .lean();
}

export default async function Dashboard({ searchParams }) {
  const [stats, recentPosts] = await Promise.all([getStats(), getRecentPosts()]);
  const connected = (await searchParams)?.connected;
  const authError = (await searchParams)?.error;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your LinkedIn automation engine</p>
      </div>

      {connected && (
        <div className="alert alert-success">LinkedIn account connected successfully!</div>
      )}
      {authError && (
        <div className="alert alert-error">Authentication failed. Please try again.</div>
      )}

      {/* Stats */}
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

      {/* Quick actions */}
      <div className={styles.actions}>
        <Link href="/schedule" className="btn btn-primary">+ Create Post</Link>
        {stats.accounts > 0 ? (
          <Link href="/accounts" className="btn btn-outline">Manage Accounts</Link>
        ) : (
          <a href="/api/auth" className="btn btn-outline">Connect LinkedIn</a>
        )}
      </div>

      {/* Recent posts */}
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
                      {new Date(post.scheduledAt).toLocaleString()}
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
