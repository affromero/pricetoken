'use client';

import { TtsPriceHistoryChart } from '@/components/TtsPriceHistoryChart/TtsPriceHistoryChart';
import { LaunchPriceChart } from '@/components/LaunchPriceChart/LaunchPriceChart';
import type { TtsModelHistory, TtsModelPricing } from 'pricetoken';
import styles from './page.module.css';

interface TtsHistoryChartsProps {
  history: TtsModelHistory[];
  pricing: TtsModelPricing[];
}

const TTS_PRICE_FIELDS = [
  { key: 'costPerMChars', label: 'Cost per 1M Characters', unit: '/1M chars' },
];

export function TtsHistoryCharts({ history, pricing }: TtsHistoryChartsProps) {
  return (
    <>
      <h2 className={styles.sectionTitle}>Cost Per 1M Characters Over Time</h2>
      <p className={styles.subtitle}>
        Track how text-to-speech pricing changes over time.
      </p>
      <div className={styles.chart}>
        <TtsPriceHistoryChart history={history} />
      </div>

      <h2 className={styles.sectionTitle}>Launch Price Timeline</h2>
      <p className={styles.subtitle}>
        See how TTS model pricing compares at launch across providers and time.
      </p>
      <div className={styles.chart}>
        <LaunchPriceChart pricing={pricing} priceFields={TTS_PRICE_FIELDS} />
      </div>
    </>
  );
}
