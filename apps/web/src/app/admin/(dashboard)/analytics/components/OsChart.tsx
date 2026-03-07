'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { OsBreakdown } from '@/lib/analytics/query';
import styles from './ChartCard.module.css';

export function OsChart({ data }: { data: OsBreakdown[] }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Operating Systems</h2>
      <div className={styles.chartContainer}>
        {data.length === 0 ? (
          <p className={styles.empty}>No OS data</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--pt-border)" />
              <XAxis dataKey="os" stroke="var(--pt-text-secondary)" fontSize={12} />
              <YAxis stroke="var(--pt-text-secondary)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--pt-surface)',
                  border: '1px solid var(--pt-border)',
                  borderRadius: '8px',
                  color: 'var(--pt-text)',
                }}
              />
              <Bar dataKey="count" fill="var(--pt-preview)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
