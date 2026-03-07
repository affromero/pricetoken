'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ReferrerDomain } from '@/lib/analytics/query';
import styles from './ChartCard.module.css';

export function ReferrersChart({ data }: { data: ReferrerDomain[] }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Top Referrers</h2>
      <div className={styles.chartContainer}>
        {data.length === 0 ? (
          <p className={styles.empty}>No referrer data</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--pt-border)" />
              <XAxis type="number" stroke="var(--pt-text-secondary)" fontSize={12} />
              <YAxis type="category" dataKey="domain" stroke="var(--pt-text-secondary)" fontSize={12} width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--pt-surface)',
                  border: '1px solid var(--pt-border)',
                  borderRadius: '8px',
                  color: 'var(--pt-text)',
                }}
              />
              <Bar dataKey="count" fill="var(--pt-accent)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
