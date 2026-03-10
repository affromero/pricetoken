import type { ModelStatus, DataConfidence, FreshnessInfo } from 'pricetoken';
import { computeConfidenceReason } from '@/lib/confidence';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: ModelStatus | null;
  confidence: DataConfidence;
  source?: string;
  freshness?: FreshnessInfo;
}

export function StatusBadge({ status, confidence, source, freshness }: StatusBadgeProps) {
  if (confidence === 'low' || confidence === 'medium') {
    const tooltip =
      source && freshness
        ? computeConfidenceReason(source, freshness, confidence)
        : undefined;
    return (
      <span
        className={`${styles.badge} ${styles.unverified} ${tooltip ? styles.tooltipWrapper : ''}`}
        data-tooltip={tooltip}
      >
        unverified
      </span>
    );
  }

  if (status === 'deprecated') {
    return <span className={`${styles.badge} ${styles.deprecated}`}>deprecated</span>;
  }

  if (status === 'preview') {
    return <span className={`${styles.badge} ${styles.preview}`}>preview</span>;
  }

  return null;
}
