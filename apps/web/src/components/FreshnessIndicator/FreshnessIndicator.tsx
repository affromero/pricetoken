import type { ConfidenceLevel, FreshnessInfo } from 'pricetoken';
import styles from './FreshnessIndicator.module.css';

interface FreshnessIndicatorProps {
  freshness: FreshnessInfo;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
}

function formatAge(hours: number): string {
  if (hours < 1) return '<1h ago';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

export function FreshnessIndicator({ freshness, confidenceScore, confidenceLevel }: FreshnessIndicatorProps) {
  const dotClass = confidenceLevel === 'high'
    ? styles.dotHigh
    : confidenceLevel === 'medium'
      ? styles.dotMedium
      : styles.dotLow;

  return (
    <span
      className={styles.root}
      title={`Confidence: ${confidenceScore}/100 — Verified ${formatAge(freshness.ageHours)}`}
    >
      <span className={`${styles.dot} ${dotClass}`} />
      {formatAge(freshness.ageHours)}
    </span>
  );
}
