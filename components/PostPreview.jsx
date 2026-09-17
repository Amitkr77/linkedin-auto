'use client';
import styles from './PostPreview.module.css';

export default function PostPreview({ commentary, imagePreview, account }) {
  const hasContent = commentary?.trim() || imagePreview;

  if (!hasContent) {
    return (
      <div className={styles.card}>
        <div className={styles.placeholder}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="12" y2="17" />
          </svg>
          <p>Start typing to see a live preview of your LinkedIn post.</p>
        </div>
      </div>
    );
  }

  const displayName = account?.displayName || account?.authorUrn || 'Your Name';
  const headline = account?.headline || 'LinkedIn Member';
  const initials = displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className={styles.card}>
      {/* Author header */}
      <div className={styles.header}>
        <div className={styles.avatar}>
          {account?.profilePictureUrl ? (
            <img src={account.profilePictureUrl} alt="" />
          ) : (
            initials || 'U'
          )}
        </div>
        <div className={styles.authorInfo}>
          <div className={styles.authorName}>{displayName}</div>
          <div className={styles.authorHeadline}>{headline}</div>
          <div className={styles.authorTime}>
            Just now · <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"/></svg>
          </div>
        </div>
      </div>

      {/* Post body */}
      {commentary?.trim() && (
        <div className={styles.body}>{commentary}</div>
      )}

      {/* Image */}
      {imagePreview && (
        <div className={styles.imageWrap}>
          <img src={imagePreview} alt="Post attachment" />
        </div>
      )}

      {/* Mock reactions bar */}
      <div className={styles.reactions}>
        <div className={styles.reactionIcons}>
          <div className={styles.reactionDot} style={{ background: '#0a66c2' }} />
          <div className={styles.reactionDot} style={{ background: '#df704d' }} />
          <div className={styles.reactionDot} style={{ background: '#7fc15e' }} />
        </div>
        <span className={styles.reactionText}>0 comments</span>
      </div>

      {/* Mock action bar */}
      <div className={styles.actions}>
        <div className={styles.actionBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
          Like
        </div>
        <div className={styles.actionBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Comment
        </div>
        <div className={styles.actionBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          Share
        </div>
        <div className={styles.actionBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          Send
        </div>
      </div>
    </div>
  );
}
