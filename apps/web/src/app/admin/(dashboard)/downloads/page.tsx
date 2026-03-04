'use client';

import { useState, useEffect, useCallback } from 'react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import styles from './page.module.css';

interface DownloadData {
  npm: { total7d: number; total30d: number };
  pypi: { total30d: number };
  telemetry: {
    breakdown: Array<{ sdk: string; version: string; runtime: string; count: number }>;
    daily: Array<{ date: string; count: number }>;
  };
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

export default function AdminDownloadsPage() {
  const [data, setData] = useState<DownloadData | null>(null);

  const loadData = useCallback(async () => {
    const res = await fetch('/api/admin/downloads');
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
      <h1>Downloads</h1>

      <div className={styles.totals}>
        <div className={styles.totalCard}>
          <div className={styles.totalLabel}>npm (7 days)</div>
          <div className={styles.totalValue}>{formatNumber(data.npm.total7d)}</div>
        </div>
        <div className={styles.totalCard}>
          <div className={styles.totalLabel}>npm (30 days)</div>
          <div className={styles.totalValue}>{formatNumber(data.npm.total30d)}</div>
        </div>
        <div className={styles.totalCard}>
          <div className={styles.totalLabel}>PyPI (30 days)</div>
          <div className={styles.totalValue}>{formatNumber(data.pypi.total30d)}</div>
        </div>
      </div>

      {data.telemetry.daily.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Telemetry Pings (Last 30 Days)</h2>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.telemetry.daily}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                <Tooltip
                  contentStyle={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 6 }}
                  labelStyle={{ color: '#888' }}
                  formatter={(value: number) => [formatNumber(value), 'Pings']}
                />
                <Bar dataKey="count" fill="#22c55e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {data.telemetry.breakdown.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Telemetry Breakdown</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>SDK</th>
                <th>Version</th>
                <th>Runtime</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {data.telemetry.breakdown.map((row) => (
                <tr key={`${row.sdk}-${row.version}-${row.runtime}`}>
                  <td>{row.sdk}</td>
                  <td className={styles.mono}>{row.version}</td>
                  <td className={styles.mono}>{row.runtime}</td>
                  <td className={styles.mono}>{formatNumber(row.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
