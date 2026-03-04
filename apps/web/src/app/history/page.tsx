import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { PriceHistoryChart } from '@/components/PriceHistoryChart/PriceHistoryChart';
import { LaunchPriceChart } from '@/components/LaunchPriceChart/LaunchPriceChart';
import { STATIC_PRICING } from 'pricetoken';
import type { ModelHistory, ModelPricing } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'LLM Price History',
  description:
    'Track LLM pricing changes over time. Historical price data for OpenAI, Anthropic, Google, and more — updated daily.',
  alternates: { canonical: 'https://pricetoken.ai/history' },
};

async function getHistory(): Promise<ModelHistory[]> {
  try {
    const { getPriceHistory } = await import('@/lib/pricing-queries');
    const history = await getPriceHistory(365);
    return history.length > 0 ? history : getFallbackHistory();
  } catch {
    return getFallbackHistory();
  }
}

async function getPricingData(): Promise<ModelPricing[]> {
  try {
    const { getCurrentPricing } = await import('@/lib/pricing-queries');
    const pricing = await getCurrentPricing();
    return pricing.length > 0 ? pricing : STATIC_PRICING;
  } catch {
    return STATIC_PRICING;
  }
}

function getFallbackHistory(): ModelHistory[] {
  const today = new Date().toISOString().split('T')[0]!;
  return STATIC_PRICING.map((m) => ({
    modelId: m.modelId,
    provider: m.provider,
    displayName: m.displayName,
    history: [
      { date: today, inputPerMTok: m.inputPerMTok, outputPerMTok: m.outputPerMTok },
    ],
  }));
}

export default async function HistoryPage() {
  const [history, pricing] = await Promise.all([getHistory(), getPricingData()]);

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <h1 className={styles.title}>Price History</h1>
        <p className={styles.subtitle}>
          Track LLM pricing changes over time across all providers.
        </p>
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
      </main>
      <Footer />
    </>
  );
}
