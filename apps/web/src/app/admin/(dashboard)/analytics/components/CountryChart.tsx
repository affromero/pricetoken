'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { CountryBreakdown } from '@/lib/analytics/query';
import styles from './ChartCard.module.css';

function countryFlag(code: string): string {
  if (code.length !== 2) return '';
  const offset = 0x1F1E6 - 65;
  return String.fromCodePoint(
    code.charCodeAt(0) + offset,
    code.charCodeAt(1) + offset,
  );
}

function formatCountryLabel(code: string): string {
  return `${countryFlag(code)} ${code}`;
}

export function CountryChart({ data }: { data: CountryBreakdown[] }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Top Countries</h2>
      <div className={styles.chartContainer}>
        {data.length === 0 ? (
          <p className={styles.empty}>No country data</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(300, data.length * 30)}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--pt-border)" />
              <XAxis type="number" stroke="var(--pt-text-secondary)" fontSize={12} />
              <YAxis
                type="category"
                dataKey="country"
                stroke="var(--pt-text-secondary)"
                fontSize={12}
                width={60}
                interval={0}
                tickFormatter={formatCountryLabel}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--pt-surface)',
                  border: '1px solid var(--pt-border)',
                  borderRadius: '8px',
                  color: 'var(--pt-text)',
                }}
                formatter={(value) => [String(value ?? 0), 'Visits']}
                labelFormatter={(label) => formatCountryLabel(String(label))}
              />
              <Bar dataKey="count" fill="var(--pt-preview)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
