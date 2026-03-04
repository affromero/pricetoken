'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';

interface FetchRunSummary {
  id: string;
  status: string;
  providersRun: number;
  modelsVerified: number;
  modelsFlagged: number;
  verificationCost: number;
  errors: string[];
  createdAt: string;
}

export default function FetchStatusPage() {
  const [runs, setRuns] = useState<FetchRunSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRuns = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/fetch-status');
      if (res.ok) {
        const json = await res.json();
        setRuns(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const handleUnfreeze = async () => {
    const res = await fetch('/api/admin/unfreeze', { method: 'POST' });
    if (res.ok) {
      loadRuns();
    }
  };

  const isFrozen = runs.length > 0 && runs[0]!.status === 'failed';

  if (loading) return null;

  return (
    <>
      <h1>Fetch Status</h1>

      <div className={`${styles.banner} ${isFrozen ? styles.bannerFrozen : styles.bannerActive}`}>
        <span className={styles.bannerDot} />
        <span className={styles.bannerText}>
          {isFrozen ? 'Frozen — requires review' : 'Active'}
        </span>
        {isFrozen && (
          <button className={styles.unfreezeBtn} onClick={handleUnfreeze}>
            Unfreeze
          </button>
        )}
      </div>

      {runs.length > 0 ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Providers</th>
              <th>Verified</th>
              <th>Flagged</th>
              <th>Cost</th>
              <th>Errors</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id}>
                <td className={styles.mono}>
                  {new Date(run.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[`status_${run.status}`] ?? ''}`}>
                    {run.status}
                  </span>
                </td>
                <td className={styles.mono}>{run.providersRun}</td>
                <td className={styles.mono}>{run.modelsVerified}</td>
                <td className={styles.mono}>{run.modelsFlagged}</td>
                <td className={styles.mono}>${run.verificationCost.toFixed(3)}</td>
                <td>
                  {run.errors.length > 0 && (
                    <span className={styles.errorCount}>{run.errors.length} error(s)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className={styles.empty}>No fetch runs recorded yet.</p>
      )}
    </>
  );
}
