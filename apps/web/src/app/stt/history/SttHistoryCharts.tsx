'use client';

import { SttPriceHistoryChart } from '@/components/SttPriceHistoryChart/SttPriceHistoryChart';
import { LaunchPriceChart } from '@/components/LaunchPriceChart/LaunchPriceChart';
import type { SttModelHistory, SttModelPricing } from 'pricetoken';
import styles from './page.module.css';

interface SttHistoryChartsProps {
  history: SttModelHistory[];
  pricing: SttModelPricing[];
}

const STT_PRICE_FIELDS = [
  { key: 'costPerMinute', label: 'Cost per Minute', unit: '/min' },
];

export function SttHistoryCharts({ history, pricing }: SttHistoryChartsProps) {
  return (
    <>
      <h2 className={styles.sectionTitle}>Cost Per Minute Over Time</h2>
      <p className={styles.subtitle}>
        Track how speech-to-text pricing changes over time.
      </p>
      <div className={styles.chart}>
        <SttPriceHistoryChart history={history} />
      </div>

      <h2 className={styles.sectionTitle}>Launch Price Timeline</h2>
      <p className={styles.subtitle}>
        See how STT model pricing compares at launch across providers and time.
      </p>
      <div className={styles.chart}>
        <LaunchPriceChart pricing={pricing} priceFields={STT_PRICE_FIELDS} />
      </div>
    </>
  );
}
