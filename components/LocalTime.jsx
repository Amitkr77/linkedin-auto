'use client';

export default function LocalTime({ date }) {
  if (!date) return <span>Not scheduled</span>;
  return <span>{new Date(date).toLocaleString()}</span>;
}
