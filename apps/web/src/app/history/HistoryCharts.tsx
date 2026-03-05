'use client';

import { PriceHistoryChart } from '@/components/PriceHistoryChart/PriceHistoryChart';
import { LaunchPriceChart } from '@/components/LaunchPriceChart/LaunchPriceChart';
import type { ModelHistory, ModelPricing } from 'pricetoken';
import styles from './page.module.css';

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
