import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { TtsHistoryCharts } from './TtsHistoryCharts';
import { STATIC_TTS_PRICING } from 'pricetoken';
import type { TtsModelHistory, TtsModelPricing } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'TTS AI Price History',
  description:
    'Track text-to-speech pricing changes over time. Historical price data for OpenAI, Google, ElevenLabs and more — updated daily.',
  alternates: { canonical: 'https://pricetoken.ai/tts/history' },
};

async function getTtsHistory(): Promise<TtsModelHistory[]> {
  try {
    const { getTtsPriceHistory } = await import('@/lib/tts-pricing-queries');
    const history = await getTtsPriceHistory(365);
    return history.length > 0 ? history : getFallbackHistory();
  } catch {
    return getFallbackHistory();
  }
}

async function getTtsPricingData(): Promise<TtsModelPricing[]> {
  try {
    const { getCurrentTtsPricing } = await import('@/lib/tts-pricing-queries');
    const pricing = await getCurrentTtsPricing();
    return pricing.length > 0 ? pricing : STATIC_TTS_PRICING;
  } catch {
    return STATIC_TTS_PRICING;
  }
}

function getFallbackHistory(): TtsModelHistory[] {
  const today = new Date().toISOString().split('T')[0]!;
  return STATIC_TTS_PRICING.map((m) => ({
    modelId: m.modelId,
    provider: m.provider,
    displayName: m.displayName,
    history: [
      { date: today, costPerMChars: m.costPerMChars },
    ],
  }));
}

export default async function TtsHistoryPage() {
  const [history, pricing] = await Promise.all([getTtsHistory(), getTtsPricingData()]);

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="tts" />
        <h1 className={styles.title}>TTS Price History</h1>
        <p className={styles.subtitle}>
          Track text-to-speech pricing changes over time across all providers.
        </p>

        <TtsHistoryCharts history={history} pricing={pricing} />
      </main>
      <Footer />
    </>
  );
}
