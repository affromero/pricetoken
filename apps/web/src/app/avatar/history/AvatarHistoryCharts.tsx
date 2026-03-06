'use client';

import { AvatarPriceHistoryChart } from '@/components/AvatarPriceHistoryChart/AvatarPriceHistoryChart';
import { LaunchPriceChart } from '@/components/LaunchPriceChart/LaunchPriceChart';
import type { AvatarModelHistory, AvatarModelPricing } from 'pricetoken';
import styles from './page.module.css';

interface AvatarHistoryChartsProps {
  history: AvatarModelHistory[];
  pricing: AvatarModelPricing[];
}

const AVATAR_PRICE_FIELDS = [
  { key: 'costPerMinute', label: 'Cost per Minute', unit: '/min' },
];

export function AvatarHistoryCharts({ history, pricing }: AvatarHistoryChartsProps) {
  return (
    <>
      <h2 className={styles.sectionTitle}>Cost Per Minute Over Time</h2>
      <p className={styles.subtitle}>
        Track how avatar generation pricing changes over time.
      </p>
      <div className={styles.chart}>
        <AvatarPriceHistoryChart history={history} />
      </div>

      <h2 className={styles.sectionTitle}>Launch Price Timeline</h2>
      <p className={styles.subtitle}>
        See how avatar model pricing compares at launch across providers and time.
      </p>
      <div className={styles.chart}>
        <LaunchPriceChart pricing={pricing} priceFields={AVATAR_PRICE_FIELDS} />
      </div>
    </>
  );
}
