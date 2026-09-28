'use client';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ToastProvider';
import LocalTime from '@/components/LocalTime';
import styles from './page.module.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export default function CalendarPage() {
  const [current, setCurrent] = useState(new Date());
  const [posts, setPosts] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const addToast = useToast();

  const fetchPosts = useCallback(async () => {
    const from = startOfMonth(current).toISOString();
    const to = endOfMonth(current).toISOString();
    try {
      const res = await fetch(`/api/posts?from=${from}&to=${to}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPosts(data);
    } catch (err) {
      addToast('error', err.message);
    }
  }, [current, addToast]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const postsByDay = {};
  posts.forEach((p) => {
    if (!p.scheduledAt) return;
    const day = new Date(p.scheduledAt).getDate();
    if (!postsByDay[day]) postsByDay[day] = [];
    postsByDay[day].push(p);
  });

  const prev = () => setCurrent(new Date(year, month - 1, 1));
  const next = () => setCurrent(new Date(year, month + 1, 1));
  const goToday = () => setCurrent(new Date());

  const dayPosts = selectedDay ? (postsByDay[selectedDay] || []) : [];

  // Drag-and-drop handlers
  const handleDragStart = (e, postId) => {
    e.dataTransfer.setData('text/plain', postId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, day) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(day);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e, targetDay) => {
    e.preventDefault();
    setDropTarget(null);
    const postId = e.dataTransfer.getData('text/plain');
    if (!postId) return;

    const post = posts.find((p) => p._id === postId);
    if (!post) return;
    if (!['DRAFT', 'PENDING'].includes(post.status)) {
      addToast('error', 'Only draft or pending posts can be rescheduled.');
      return;
    }

    // Keep the original time, just change the date
    const oldDate = post.scheduledAt ? new Date(post.scheduledAt) : new Date();
    const newDate = new Date(year, month, targetDay, oldDate.getHours(), oldDate.getMinutes());

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt: newDate.toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to reschedule');
      addToast('success', `Post moved to ${DAYS[newDate.getDay()]} ${targetDay}`);
      fetchPosts();
    } catch (err) {
      addToast('error', err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Calendar</h1>
        <p>Drag and drop posts between days to reschedule.</p>
      </div>

      <div className={styles.layout}>
        <div className="card">
          <div className={styles.calNav}>
            <button className="btn btn-ghost btn-sm" onClick={prev}>&larr;</button>
            <h2 className={styles.monthTitle}>
              {current.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button className="btn btn-ghost btn-sm" onClick={goToday}>Today</button>
            <button className="btn btn-ghost btn-sm" onClick={next}>&rarr;</button>
          </div>

          <div className={styles.grid}>
            {DAYS.map((d) => (
              <div key={d} className={styles.dayHeader}>{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e${i}`} className={styles.cell} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
              const dayItems = postsByDay[day] || [];
              const isSelected = selectedDay === day;
              const isDragOver = dropTarget === day;
              return (
                <div
                  key={day}
                  className={`${styles.cell} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''} ${dayItems.length ? styles.hasItems : ''} ${isDragOver ? styles.dropTarget : ''}`}
                  onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  onDragOver={(e) => handleDragOver(e, day)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, day)}
                >
                  <span className={styles.dayNum}>{day}</span>
                  {dayItems.length > 0 && (
                    <div className={styles.dots}>
                      {dayItems.slice(0, 3).map((p) => (
                        <span
                          key={p._id}
                          className={`${styles.dot} ${styles[`dot_${p.status.toLowerCase()}`]}`}
                          draggable={p.status === 'DRAFT' || p.status === 'PENDING'}
                          onDragStart={(e) => handleDragStart(e, p._id)}
                          title={p.commentary.slice(0, 60)}
                          style={{ cursor: (p.status === 'DRAFT' || p.status === 'PENDING') ? 'grab' : 'default' }}
                        />
                      ))}
                      {dayItems.length > 3 && <span className={styles.dotMore}>+{dayItems.length - 3}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Side panel */}
        {selectedDay && (
          <div className={`card ${styles.panel}`}>
            <h3 className={styles.panelTitle}>
              {current.toLocaleString('default', { month: 'short' })} {selectedDay}
            </h3>
            {dayPosts.length === 0 ? (
              <p className={styles.noPosts}>No posts on this day.</p>
            ) : (
              <div className={styles.panelList}>
                {dayPosts.map((p) => (
                  <div
                    key={p._id}
                    className={styles.panelItem}
                    draggable={p.status === 'DRAFT' || p.status === 'PENDING'}
                    onDragStart={(e) => handleDragStart(e, p._id)}
                    style={{ cursor: (p.status === 'DRAFT' || p.status === 'PENDING') ? 'grab' : 'default' }}
                  >
                    <span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span>
                    <p className={styles.panelText}>{p.commentary}</p>
                    <span className={styles.panelTime}>
                      <LocalTime date={p.scheduledAt} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
