import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { SttHistoryCharts } from './SttHistoryCharts';
import { STATIC_STT_PRICING } from 'pricetoken';
import type { SttModelHistory, SttModelPricing } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'STT AI Price History',
  description:
    'Track speech-to-text pricing changes over time. Historical price data for OpenAI, Deepgram, AssemblyAI and more — updated daily.',
  alternates: { canonical: 'https://pricetoken.ai/stt/history' },
};

async function getSttHistory(): Promise<SttModelHistory[]> {
  try {
    const { getSttPriceHistory } = await import('@/lib/stt-pricing-queries');
    const history = await getSttPriceHistory(365);
    return history.length > 0 ? history : getFallbackHistory();
  } catch {
    return getFallbackHistory();
  }
}

async function getSttPricingData(): Promise<SttModelPricing[]> {
  try {
    const { getCurrentSttPricing } = await import('@/lib/stt-pricing-queries');
    const pricing = await getCurrentSttPricing();
    return pricing.length > 0 ? pricing : STATIC_STT_PRICING;
  } catch {
    return STATIC_STT_PRICING;
  }
}

function getFallbackHistory(): SttModelHistory[] {
  const today = new Date().toISOString().split('T')[0]!;
  return STATIC_STT_PRICING.map((m) => ({
    modelId: m.modelId,
    provider: m.provider,
    displayName: m.displayName,
    history: [
      { date: today, costPerMinute: m.costPerMinute },
    ],
  }));
}

export default async function SttHistoryPage() {
  const [history, pricing] = await Promise.all([getSttHistory(), getSttPricingData()]);

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="stt" />
        <h1 className={styles.title}>STT Price History</h1>
        <p className={styles.subtitle}>
          Track speech-to-text pricing changes over time across all providers.
        </p>

        <SttHistoryCharts history={history} pricing={pricing} />
      </main>
      <Footer />
    </>
  );
}
