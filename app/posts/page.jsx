'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import { PostListSkeleton } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import LocalTime from '@/components/LocalTime';
import EditPostModal from '@/components/EditPostModal';
import BulkToolbar from '@/components/BulkToolbar';
import ImportModal from '@/components/ImportModal';
import styles from './page.module.css';

const STATUS_OPTIONS = ['ALL', 'DRAFT', 'PENDING', 'PUBLISHED', 'FAILED'];

export default function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [editPost, setEditPost] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const addToast = useToast();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filter !== 'ALL' ? `?status=${filter}` : '';
      const res = await fetch(`/api/posts${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to load posts');
      setPosts(data);
    } catch (err) {
      addToast('error', err.message);
    } finally {
      setLoading(false);
    }
  }, [filter, addToast]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  // Clear selection on filter change
  useEffect(() => { setSelected(new Set()); }, [filter]);
  // Fetch accounts for import modal
  useEffect(() => {
    fetch('/api/auth/accounts').then((r) => r.json()).then((d) => { if (Array.isArray(d)) setAccounts(d); }).catch(() => {});
  }, []);

  const publish = async (id) => {
    if (!confirm('Publish this post to LinkedIn now?')) return;
    setActionId(id);
    try {
      const res = await fetch(`/api/posts/${id}/publish`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to publish');
      addToast('success', 'Post published to LinkedIn!');
    } catch (err) {
      addToast('error', err.message);
    }
    setActionId(null);
    fetchPosts();
  };

  const remove = async (id) => {
    if (!confirm('Delete this post?')) return;
    setActionId(id);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to delete');
      addToast('success', 'Post deleted.');
    } catch (err) {
      addToast('error', err.message);
    }
    setActionId(null);
    fetchPosts();
  };

  const retry = async (id) => {
    setActionId(id);
    try {
      const res = await fetch(`/api/posts/${id}/retry`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to retry');
      addToast('success', 'Post queued for retry.');
    } catch (err) {
      addToast('error', err.message);
    }
    setActionId(null);
    fetchPosts();
  };

  // Bulk selection
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectableStatuses = new Set(['DRAFT', 'PENDING', 'FAILED']);
  const selectablePosts = posts.filter((p) => selectableStatuses.has(p.status));

  const toggleAll = () => {
    if (selected.size === selectablePosts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectablePosts.map((p) => p._id)));
    }
  };

  const bulkAction = async (action) => {
    const label = action === 'delete' ? 'delete' : 'publish';
    if (!confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} ${selected.size} post(s)?`)) return;
    setBulkLoading(true);
    try {
      const res = await fetch('/api/posts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected], action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk action failed');
      if (action === 'delete') {
        addToast('success', `${data.deleted} post(s) deleted.`);
      } else {
        addToast('success', `${data.published} published, ${data.failed} failed.`);
      }
      setSelected(new Set());
    } catch (err) {
      addToast('error', err.message);
    }
    setBulkLoading(false);
    fetchPosts();
  };

  const handleEditSaved = () => {
    fetchPosts();
    addToast('success', 'Post updated.');
  };

  return (
    <div>
      <div className="page-header">
        <h1>All Posts</h1>
        <p>View, publish, or delete your scheduled posts.</p>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className={styles.toolbarRight}>
          <button className="btn btn-outline btn-sm" onClick={() => setImportOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Import CSV / Excel
          </button>
          {selectablePosts.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={toggleAll}>
              {selected.size === selectablePosts.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
          <Link href="/schedule" className="btn btn-primary btn-sm">+ New Post</Link>
        </div>
      </div>

      {loading ? (
        <PostListSkeleton />
      ) : posts.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            }
            title="No posts found"
            description={filter !== 'ALL' ? `No ${filter.toLowerCase()} posts.` : 'Schedule your first post to get started.'}
            action={<Link href="/schedule" className="btn btn-primary">Create Post</Link>}
          />
        </div>
      ) : (
        <div className={styles.list}>
          {posts.map((post) => {
            const canSelect = selectableStatuses.has(post.status);
            const isSelected = selected.has(post._id);
            return (
              <div key={post._id} className={`card card-hover ${styles.postCard} ${isSelected ? styles.selected : ''}`}>
                <div className={styles.postTop}>
                  {canSelect && (
                    <label className={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(post._id)}
                      />
                      <span className={styles.checkmark} />
                    </label>
                  )}
                  <span className={`badge badge-${post.status.toLowerCase()}`}>{post.status}</span>
                  {post.mediaUrl && (
                    <span className={styles.mediaBadge}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                      Image
                    </span>
                  )}
                  <span className={styles.time}>
                    <LocalTime date={post.scheduledAt} />
                  </span>
                </div>

                <p className={styles.commentary}>{post.commentary}</p>

                {post.account && (
                  <p className={styles.account}>
                    {post.account.displayName || post.account.authorUrn}
                  </p>
                )}

                {post.linkedinPostUrn && (
                  <p className={styles.urn}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                    {post.linkedinPostUrn}
                  </p>
                )}

                {post.errorMessage && (
                  <div className={styles.errorBox}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    {post.errorMessage}
                  </div>
                )}

                <div className={styles.actions}>
                  {(post.status === 'DRAFT' || post.status === 'PENDING') && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditPost(post)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit
                    </button>
                  )}
                  {post.status === 'PENDING' && (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => publish(post._id)} disabled={actionId === post._id}>
                        {actionId === post._id ? 'Publishing…' : 'Publish Now'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(post._id)} disabled={actionId === post._id}>
                        Delete
                      </button>
                    </>
                  )}
                  {post.status === 'DRAFT' && (
                    <button className="btn btn-danger btn-sm" onClick={() => remove(post._id)} disabled={actionId === post._id}>
                      Delete
                    </button>
                  )}
                  {post.status === 'FAILED' && (
                    <>
                      <button className="btn btn-outline btn-sm" onClick={() => retry(post._id)} disabled={actionId === post._id}>
                        {actionId === post._id ? 'Retrying…' : 'Retry'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(post._id)} disabled={actionId === post._id}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk toolbar */}
      <BulkToolbar
        selectedCount={selected.size}
        onDelete={() => bulkAction('delete')}
        onPublish={() => bulkAction('publish')}
        onClear={() => setSelected(new Set())}
        loading={bulkLoading}
      />

      {/* Edit modal */}
      {editPost && (
        <EditPostModal
          post={editPost}
          open={!!editPost}
          onClose={() => setEditPost(null)}
          onSaved={handleEditSaved}
        />
      )}

      {/* Import modal */}
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        accounts={accounts}
        onImported={fetchPosts}
      />
    </div>
  );
}
