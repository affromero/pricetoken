'use client';

import { Fragment } from 'react';
import type { HourlyHeatmapCell } from '@/lib/analytics/query';
import styles from './HourlyHeatmap.module.css';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function HourlyHeatmap({ data }: { data: HourlyHeatmapCell[] }) {
  const maxCount = Math.max(1, ...data.map((c) => c.count));

  const cellMap = new Map<string, number>();
  for (const cell of data) {
    cellMap.set(`${cell.day}-${cell.hour}`, cell.count);
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Hourly Traffic (UTC)</h2>
      {data.length === 0 ? (
        <p className={styles.empty}>No traffic data</p>
      ) : (
        <>
          <div className={styles.grid}>
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={`h-${h}`} className={styles.hourLabel}>
                {h % 3 === 0 ? h : ''}
              </div>
            ))}

            {DAY_LABELS.map((label, day) => (
              <Fragment key={`d-${day}`}>
                <div className={styles.dayLabel}>
                  {label}
                </div>
                {Array.from({ length: 24 }, (_, hour) => {
                  const count = cellMap.get(`${day}-${hour}`) || 0;
                  const opacity = count > 0 ? 0.15 + 0.85 * (count / maxCount) : 0.05;
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className={styles.cell}
                      style={{ opacity }}
                      title={`${label} ${hour}:00 UTC — ${count} visit${count !== 1 ? 's' : ''}`}
                    />
                  );
                })}
              </Fragment>
            ))}
          </div>
          <div className={styles.legend}>
            <span>Less</span>
            <div className={styles.legendBar}>
              {[0.1, 0.3, 0.5, 0.7, 1.0].map((o) => (
                <div key={o} className={styles.legendCell} style={{ opacity: o }} />
              ))}
            </div>
            <span>More</span>
          </div>
        </>
      )}
    </div>
  );
}
