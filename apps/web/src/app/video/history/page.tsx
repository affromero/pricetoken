import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { VideoHistoryCharts } from './VideoHistoryCharts';
import { STATIC_VIDEO_PRICING } from 'pricetoken';
import type { VideoModelHistory } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Video AI Price History',
  description:
    'Track video AI pricing changes over time. Historical price data for Runway, Sora, Veo, Kling, and more — updated daily.',
  alternates: { canonical: 'https://pricetoken.ai/video/history' },
};

async function getVideoHistory(): Promise<VideoModelHistory[]> {
  try {
    const { getVideoPriceHistory } = await import('@/lib/video-pricing-queries');
    const history = await getVideoPriceHistory(365);
    return history.length > 0 ? history : getFallbackHistory();
  } catch {
    return getFallbackHistory();
  }
}

function getFallbackHistory(): VideoModelHistory[] {
  const today = new Date().toISOString().split('T')[0]!;
  return STATIC_VIDEO_PRICING.map((m) => ({
    modelId: m.modelId,
    provider: m.provider,
    displayName: m.displayName,
    history: [
      { date: today, costPerMinute: m.costPerMinute },
    ],
  }));
}

export default async function VideoHistoryPage() {
  const history = await getVideoHistory();

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="video" />
        <h1 className={styles.title}>Video Price History</h1>
        <p className={styles.subtitle}>
          Track video AI pricing changes over time across all providers.
        </p>

        <VideoHistoryCharts history={history} />
      </main>
      <Footer />
    </>
  );
}
