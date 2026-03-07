'use client';

import { useState, useEffect } from 'react';
import styles from './RealtimePulse.module.css';

export function RealtimePulse({ initial }: { initial: number }) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/analytics/query?metric=realtime');
        if (res.ok) {
          const data = await res.json();
          setCount(data.activeVisitors);
        }
      } catch {
        // Silently fail — will retry next interval
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.pulse}>
      <span className={styles.dot} />
      <span className={styles.text}>
        <strong>{count}</strong> {count === 1 ? 'visitor' : 'visitors'} in the last 5 minutes
      </span>
    </div>
  );
}
