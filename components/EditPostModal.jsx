'use client';
import { useState } from 'react';
import Modal from './Modal';

export default function EditPostModal({ post, open, onClose, onSaved }) {
  const [commentary, setCommentary] = useState(post?.commentary || '');
  const [scheduledAt, setScheduledAt] = useState(
    post?.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const charPct = Math.min((commentary.length / 3000) * 100, 100);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const body = { commentary };
      if (scheduledAt) body.scheduledAt = new Date(scheduledAt).toISOString();
      const res = await fetch(`/api/posts/${post._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      onSaved(data);
      onClose();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  if (!post) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Post"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !commentary.trim()}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </>
      }
    >
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="form-group">
        <label>Post Content</label>
        <textarea
          value={commentary}
          onChange={(e) => setCommentary(e.target.value)}
          maxLength={3000}
          rows={6}
          placeholder="What do you want to share?"
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <div style={{ flex: 1, height: 3, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              borderRadius: 3,
              width: `${charPct}%`,
              background: charPct > 90 ? 'var(--red)' : charPct > 70 ? 'var(--orange)' : 'var(--blue)',
              transition: 'width 0.15s ease',
            }} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {commentary.length} / 3000
          </span>
        </div>
      </div>

      <div className="form-group">
        <label>Schedule Date & Time</label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          min={new Date().toISOString().slice(0, 16)}
        />
        {post.status === 'DRAFT' && !scheduledAt && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Set a date to move this draft to Pending.
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className={`badge badge-${post.status.toLowerCase()}`}>{post.status}</span>
        {post.status === 'DRAFT' && scheduledAt && (
          <span style={{ fontSize: 12, color: 'var(--green)' }}>→ Will become PENDING</span>
        )}
      </div>
    </Modal>
  );
}
