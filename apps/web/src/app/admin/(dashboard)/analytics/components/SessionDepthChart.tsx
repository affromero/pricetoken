'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { SessionDepthBucket } from '@/lib/analytics/query';
import styles from './ChartCard.module.css';

export function SessionDepthChart({ data }: { data: SessionDepthBucket[] }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Pages Per Session</h2>
      <div className={styles.chartContainer}>
        {data.length === 0 ? (
          <p className={styles.empty}>No session data</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--pt-border)" />
              <XAxis dataKey="depth" stroke="var(--pt-text-secondary)" fontSize={12} />
              <YAxis stroke="var(--pt-text-secondary)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--pt-surface)',
                  border: '1px solid var(--pt-border)',
                  borderRadius: '8px',
                  color: 'var(--pt-text)',
                }}
                labelFormatter={(label) => `${label} page${label === '1' ? '' : 's'}`}
              />
              <Bar dataKey="count" fill="var(--pt-accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
