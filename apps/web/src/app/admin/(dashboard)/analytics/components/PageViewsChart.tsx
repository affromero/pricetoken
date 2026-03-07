'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { PageViewsOverTime } from '@/lib/analytics/query';
import styles from './ChartCard.module.css';

export function PageViewsChart({ data }: { data: PageViewsOverTime[] }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Page Views Over Time</h2>
      <div className={styles.chartContainer}>
        {data.length === 0 ? (
          <p className={styles.empty}>No data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--pt-border)" />
              <XAxis
                dataKey="date"
                stroke="var(--pt-text-secondary)"
                fontSize={12}
                tickFormatter={(d: string) => d.slice(5)}
              />
              <YAxis stroke="var(--pt-text-secondary)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--pt-surface)',
                  border: '1px solid var(--pt-border)',
                  borderRadius: '8px',
                  color: 'var(--pt-text)',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="var(--pt-accent)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="visitors" stroke="var(--pt-preview)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
