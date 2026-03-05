'use client';

import { VideoPriceHistoryChart } from '@/components/VideoPriceHistoryChart/VideoPriceHistoryChart';
import type { VideoModelHistory } from 'pricetoken';
import styles from './page.module.css';

interface VideoHistoryChartsProps {
  history: VideoModelHistory[];
}

export function VideoHistoryCharts({ history }: VideoHistoryChartsProps) {
  return (
    <div className={styles.chart}>
      <VideoPriceHistoryChart history={history} />
    </div>
  );
}
