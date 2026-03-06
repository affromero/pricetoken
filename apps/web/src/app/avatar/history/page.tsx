import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { AvatarHistoryCharts } from './AvatarHistoryCharts';
import { STATIC_AVATAR_PRICING } from 'pricetoken';
import type { AvatarModelHistory, AvatarModelPricing } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Avatar AI Price History',
  description:
    'Track AI avatar pricing changes over time. Historical price data for HeyGen and more — updated daily.',
  alternates: { canonical: 'https://pricetoken.ai/avatar/history' },
};

async function getAvatarHistory(): Promise<AvatarModelHistory[]> {
  try {
    const { getAvatarPriceHistory } = await import('@/lib/avatar-pricing-queries');
    const history = await getAvatarPriceHistory(365);
    return history.length > 0 ? history : getFallbackHistory();
  } catch {
    return getFallbackHistory();
  }
}

async function getAvatarPricingData(): Promise<AvatarModelPricing[]> {
  try {
    const { getCurrentAvatarPricing } = await import('@/lib/avatar-pricing-queries');
    const pricing = await getCurrentAvatarPricing();
    return pricing.length > 0 ? pricing : STATIC_AVATAR_PRICING;
  } catch {
    return STATIC_AVATAR_PRICING;
  }
}

function getFallbackHistory(): AvatarModelHistory[] {
  const today = new Date().toISOString().split('T')[0]!;
  return STATIC_AVATAR_PRICING.map((m) => ({
    modelId: m.modelId,
    provider: m.provider,
    displayName: m.displayName,
    history: [
      { date: today, costPerMinute: m.costPerMinute },
    ],
  }));
}

export default async function AvatarHistoryPage() {
  const [history, pricing] = await Promise.all([getAvatarHistory(), getAvatarPricingData()]);

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="avatar" />
        <h1 className={styles.title}>Avatar Price History</h1>
        <p className={styles.subtitle}>
          Track AI avatar pricing changes over time across all providers.
        </p>

        <AvatarHistoryCharts history={history} pricing={pricing} />
      </main>
      <Footer />
    </>
  );
}
