'use client';
import { useState, useEffect } from 'react';

export default function LocalTime({ date }) {
  const [formatted, setFormatted] = useState('');

  useEffect(() => {
    if (date) setFormatted(new Date(date).toLocaleString());
  }, [date]);

  if (!date) return <span>Not scheduled</span>;
  return <span>{formatted}</span>;
}
