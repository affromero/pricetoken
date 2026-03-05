'use client';

import { VideoPriceHistoryChart } from '@/components/VideoPriceHistoryChart/VideoPriceHistoryChart';
import { LaunchPriceChart } from '@/components/LaunchPriceChart/LaunchPriceChart';
import type { VideoModelHistory, VideoModelPricing } from 'pricetoken';
import styles from './page.module.css';

interface VideoHistoryChartsProps {
  history: VideoModelHistory[];
  pricing: VideoModelPricing[];
}

const VIDEO_PRICE_FIELDS = [
  { key: 'costPerMinute', label: 'Cost per Minute', unit: '/min' },
];

export function VideoHistoryCharts({ history, pricing }: VideoHistoryChartsProps) {
  return (
    <>
      <div className={styles.chart}>
        <VideoPriceHistoryChart history={history} />
      </div>

      <h2 className={styles.sectionTitle}>Launch Price Timeline</h2>
      <p className={styles.subtitle}>
        See how video model pricing compares at launch across providers and time.
      </p>
      <div className={styles.chart}>
        <LaunchPriceChart pricing={pricing} priceFields={VIDEO_PRICE_FIELDS} />
      </div>
    </>
  );
}
