'use client';

import { MusicPriceHistoryChart } from '@/components/MusicPriceHistoryChart/MusicPriceHistoryChart';
import { LaunchPriceChart } from '@/components/LaunchPriceChart/LaunchPriceChart';
import type { MusicModelHistory, MusicModelPricing } from 'pricetoken';
import styles from './page.module.css';

interface MusicHistoryChartsProps {
  history: MusicModelHistory[];
  pricing: MusicModelPricing[];
}

const MUSIC_PRICE_FIELDS = [
  { key: 'costPerMinute', label: 'Cost per Minute', unit: '/min' },
];

export function MusicHistoryCharts({ history, pricing }: MusicHistoryChartsProps) {
  return (
    <>
      <h2 className={styles.sectionTitle}>Cost Per Minute Over Time</h2>
      <p className={styles.subtitle}>
        Track how music generation pricing changes over time.
      </p>
      <div className={styles.chart}>
        <MusicPriceHistoryChart history={history} />
      </div>

      <h2 className={styles.sectionTitle}>Launch Price Timeline</h2>
      <p className={styles.subtitle}>
        See how music model pricing compares at launch across providers and time.
      </p>
      <div className={styles.chart}>
        <LaunchPriceChart pricing={pricing} priceFields={MUSIC_PRICE_FIELDS} />
      </div>
    </>
  );
}
