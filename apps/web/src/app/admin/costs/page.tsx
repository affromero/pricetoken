'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './page.module.css';

interface CostData {
  breakdown: Array<{
    provider: string;
    model: string;
    requests: number;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  }>;
  trend: Array<{ date: string; costUsd: number; requests: number }>;
  totals: { '7d': number; '30d': number; all: number };
}

function formatCost(usd: number): string {
  return `$${usd.toFixed(3)}`;
}

export default function AdminCostsPage() {
  const [data, setData] = useState<CostData | null>(null);

  const loadData = useCallback(async () => {
    const res = await fetch('/api/admin/costs?days=30');
    if (res.ok) {
      const json = await res.json();
      setData(json.data);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!data) return null;

  return (
    <>
      <h1>Costs</h1>

      <div className={styles.totals}>
        <div className={styles.totalCard}>
          <div className={styles.totalLabel}>Last 7 Days</div>
          <div className={styles.totalValue}>{formatCost(data.totals['7d'])}</div>
        </div>
        <div className={styles.totalCard}>
          <div className={styles.totalLabel}>Last 30 Days</div>
          <div className={styles.totalValue}>{formatCost(data.totals['30d'])}</div>
        </div>
        <div className={styles.totalCard}>
          <div className={styles.totalLabel}>All Time</div>
          <div className={styles.totalValue}>{formatCost(data.totals.all)}</div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Daily Cost Trend</h2>
        <div className={styles.chartWrapper}>
          {data.trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.trend}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis tick={{ fontSize: 11, fill: '#888' }} tickFormatter={(v: number) => `$${v.toFixed(3)}`} />
                <Tooltip
                  contentStyle={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 6 }}
                  labelStyle={{ color: '#888' }}
                  formatter={(value: number) => [formatCost(value), 'Cost']}
                />
                <Bar dataKey="costUsd" fill="#22c55e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.empty}>No cost data yet</div>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Breakdown by Provider / Model</h2>
        {data.breakdown.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Provider</th>
                <th>Model</th>
                <th>Requests</th>
                <th>Input Tokens</th>
                <th>Output Tokens</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {data.breakdown.map((row) => (
                <tr key={`${row.provider}-${row.model}`}>
                  <td>{row.provider}</td>
                  <td className={styles.mono}>{row.model}</td>
                  <td className={styles.mono}>{row.requests.toLocaleString()}</td>
                  <td className={styles.mono}>{row.inputTokens.toLocaleString()}</td>
                  <td className={styles.mono}>{row.outputTokens.toLocaleString()}</td>
                  <td className={styles.mono}>{formatCost(row.costUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.empty}>No cost data yet</div>
        )}
      </div>
    </>
  );
}
