'use client';
import styles from './BulkToolbar.module.css';

export default function BulkToolbar({ selectedCount, onDelete, onPublish, onClear, loading }) {
  if (selectedCount === 0) return null;

  return (
    <div className={styles.bar}>
      <span className={styles.count}>
        {selectedCount} post{selectedCount !== 1 ? 's' : ''} selected
      </span>
      <div className={styles.spacer} />
      <button className="btn btn-ghost btn-sm" onClick={onClear} disabled={loading}>
        Clear
      </button>
      <button className="btn btn-primary btn-sm" onClick={onPublish} disabled={loading}>
        {loading ? 'Processing…' : 'Publish Selected'}
      </button>
      <button className="btn btn-danger btn-sm" onClick={onDelete} disabled={loading}>
        {loading ? 'Processing…' : 'Delete Selected'}
      </button>
    </div>
  );
}
