'use client';

import { ImagePriceHistoryChart } from '@/components/ImagePriceHistoryChart/ImagePriceHistoryChart';
import type { ImageModelHistory } from 'pricetoken';
import styles from './page.module.css';

interface ImageHistoryChartsProps {
  history: ImageModelHistory[];
}

export function ImageHistoryCharts({ history }: ImageHistoryChartsProps) {
  return (
    <div className={styles.chart}>
      <ImagePriceHistoryChart history={history} />
    </div>
  );
}
