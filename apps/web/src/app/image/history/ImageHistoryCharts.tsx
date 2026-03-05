'use client';

import { ImagePriceHistoryChart } from '@/components/ImagePriceHistoryChart/ImagePriceHistoryChart';
import { LaunchPriceChart } from '@/components/LaunchPriceChart/LaunchPriceChart';
import type { ImageModelHistory, ImageModelPricing } from 'pricetoken';
import styles from './page.module.css';

interface ImageHistoryChartsProps {
  history: ImageModelHistory[];
  pricing: ImageModelPricing[];
}

const IMAGE_PRICE_FIELDS = [
  { key: 'pricePerImage', label: 'Price per Image', unit: '/image' },
];

export function ImageHistoryCharts({ history, pricing }: ImageHistoryChartsProps) {
  return (
    <>
      <div className={styles.chart}>
        <ImagePriceHistoryChart history={history} />
      </div>

      <h2 className={styles.sectionTitle}>Launch Price Timeline</h2>
      <p className={styles.subtitle}>
        See how image model pricing compares at launch across providers and time.
      </p>
      <div className={styles.chart}>
        <LaunchPriceChart pricing={pricing} priceFields={IMAGE_PRICE_FIELDS} />
      </div>
    </>
  );
}
