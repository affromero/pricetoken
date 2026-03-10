import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { MusicHistoryCharts } from './MusicHistoryCharts';
import { STATIC_MUSIC_PRICING } from 'pricetoken';
import type { MusicModelHistory, MusicModelPricing } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Music Price History',
  description:
    'Track AI music generation pricing changes over time. Historical price data for ElevenLabs, Soundverse, and more — updated daily.',
  alternates: { canonical: 'https://pricetoken.ai/music/history' },
};

async function getMusicHistory(): Promise<MusicModelHistory[]> {
  try {
    const { getMusicPriceHistory } = await import('@/lib/music-pricing-queries');
    const history = await getMusicPriceHistory(365);
    return history.length > 0 ? history : getFallbackHistory();
  } catch {
    return getFallbackHistory();
  }
}

async function getMusicPricingData(): Promise<MusicModelPricing[]> {
  try {
    const { getCurrentMusicPricing } = await import('@/lib/music-pricing-queries');
    const pricing = await getCurrentMusicPricing();
    return pricing.length > 0 ? pricing : STATIC_MUSIC_PRICING;
  } catch {
    return STATIC_MUSIC_PRICING;
  }
}

function getFallbackHistory(): MusicModelHistory[] {
  const today = new Date().toISOString().split('T')[0]!;
  return STATIC_MUSIC_PRICING.map((m) => ({
    modelId: m.modelId,
    provider: m.provider,
    displayName: m.displayName,
    history: [
      { date: today, costPerMinute: m.costPerMinute },
    ],
  }));
}

export default async function MusicHistoryPage() {
  const [history, pricing] = await Promise.all([getMusicHistory(), getMusicPricingData()]);

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="music" />
        <h1 className={styles.title}>Music Price History</h1>
        <p className={styles.subtitle}>
          Track AI music generation pricing changes over time across all providers.
        </p>

        <MusicHistoryCharts history={history} pricing={pricing} />
      </main>
      <Footer />
    </>
  );
}
