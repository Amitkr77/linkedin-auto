'use client';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ToastProvider';
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

  return (
    <div>
      <div className="page-header">
        <h1>Calendar</h1>
        <p>Visual overview of your scheduled posts.</p>
      </div>

      <div className={styles.layout}>
        <div className="card">
          {/* Calendar nav */}
          <div className={styles.calNav}>
            <button className="btn btn-ghost btn-sm" onClick={prev}>&larr;</button>
            <h2 className={styles.monthTitle}>
              {current.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button className="btn btn-ghost btn-sm" onClick={goToday}>Today</button>
            <button className="btn btn-ghost btn-sm" onClick={next}>&rarr;</button>
          </div>

          {/* Day headers */}
          <div className={styles.grid}>
            {DAYS.map((d) => (
              <div key={d} className={styles.dayHeader}>{d}</div>
            ))}
            {/* Empty cells for offset */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e${i}`} className={styles.cell} />
            ))}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
              const dayItems = postsByDay[day] || [];
              const isSelected = selectedDay === day;
              return (
                <div
                  key={day}
                  className={`${styles.cell} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''} ${dayItems.length ? styles.hasItems : ''}`}
                  onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                >
                  <span className={styles.dayNum}>{day}</span>
                  {dayItems.length > 0 && (
                    <div className={styles.dots}>
                      {dayItems.slice(0, 3).map((p) => (
                        <span key={p._id} className={`${styles.dot} ${styles[`dot_${p.status.toLowerCase()}`]}`} />
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
                  <div key={p._id} className={styles.panelItem}>
                    <span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span>
                    <p className={styles.panelText}>{p.commentary}</p>
                    <span className={styles.panelTime}>
                      {new Date(p.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
