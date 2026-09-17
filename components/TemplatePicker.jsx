'use client';
import { useState, useEffect, useRef } from 'react';
import styles from './TemplatePicker.module.css';

export default function TemplatePicker({ onSelect }) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    fetch('/api/templates')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTemplates(data); })
      .catch(() => {});
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.content.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  const pick = async (template) => {
    onSelect(template.content);
    setOpen(false);
    setSearch('');
    // Increment usage count
    try {
      await fetch(`/api/templates/${template._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usageCount: (template.usageCount || 0) + 1 }),
      });
    } catch {}
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button type="button" className={styles.trigger} onClick={() => setOpen(!open)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        Use Template
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.search}>
            <input
              placeholder="Search templates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              {templates.length === 0 ? 'No templates yet.' : 'No matches.'}
            </div>
          ) : (
            filtered.map((t) => (
              <button key={t._id} className={styles.item} onClick={() => pick(t)}>
                <div className={styles.itemName}>{t.name}</div>
                <div className={styles.itemPreview}>{t.content}</div>
                <span className={styles.itemCategory}>{t.category}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
