'use client';

import dynamic from 'next/dynamic';
import type { ModelHistory, ModelPricing } from 'pricetoken';
import styles from './page.module.css';

const PriceHistoryChart = dynamic(
  () => import('@/components/PriceHistoryChart/PriceHistoryChart').then((m) => m.PriceHistoryChart),
  { ssr: false }
);
const LaunchPriceChart = dynamic(
  () => import('@/components/LaunchPriceChart/LaunchPriceChart').then((m) => m.LaunchPriceChart),
  { ssr: false }
);

interface HistoryChartsProps {
  history: ModelHistory[];
  pricing: ModelPricing[];
}

export function HistoryCharts({ history, pricing }: HistoryChartsProps) {
  return (
    <>
      <div className={styles.chart}>
        <PriceHistoryChart history={history} />
      </div>

      <h2 className={styles.sectionTitle}>Launch Price Timeline</h2>
      <p className={styles.subtitle}>
        See how model pricing compares at launch across providers and time.
      </p>
      <div className={styles.chart}>
        <LaunchPriceChart pricing={pricing} />
      </div>
    </>
  );
}
