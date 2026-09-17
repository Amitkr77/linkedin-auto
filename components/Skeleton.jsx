import styles from './Skeleton.module.css';

export function SkeletonLine({ width = '100%', height = '14px' }) {
  return <div className={styles.line} style={{ width, height }} />;
}

export function SkeletonBlock({ width = '100%', height = '100px', radius = 'var(--radius-sm)' }) {
  return <div className={styles.line} style={{ width, height, borderRadius: radius }} />;
}

export function SkeletonCircle({ size = '40px' }) {
  return <div className={styles.line} style={{ width: size, height: size, borderRadius: '50%' }} />;
}

export function PostCardSkeleton() {
  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <SkeletonLine width="80px" height="22px" />
        <SkeletonLine width="120px" height="14px" />
      </div>
      <SkeletonLine width="90%" height="14px" />
      <SkeletonLine width="70%" height="14px" />
      <SkeletonLine width="50%" height="14px" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div>
      <div className={styles.statsGrid}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.statCard}>
            <SkeletonLine width="60px" height="36px" />
            <SkeletonLine width="80px" height="12px" />
          </div>
        ))}
      </div>
      <div className={styles.card}>
        <SkeletonLine width="120px" height="16px" />
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLine key={i} width="100%" height="14px" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PostListSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}
