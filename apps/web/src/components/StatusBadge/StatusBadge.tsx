import type { ModelStatus, DataConfidence } from 'pricetoken';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: ModelStatus | null;
  confidence: DataConfidence;
}

export function StatusBadge({ status, confidence }: StatusBadgeProps) {
  if (confidence === 'low') {
    return <span className={`${styles.badge} ${styles.unverified}`}>unverified</span>;
  }

  if (status === 'deprecated') {
    return <span className={`${styles.badge} ${styles.deprecated}`}>deprecated</span>;
  }

  if (status === 'preview') {
    return <span className={`${styles.badge} ${styles.preview}`}>preview</span>;
  }

  return null;
}
