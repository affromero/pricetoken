import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { AvatarCostCalculator } from '@/components/AvatarCostCalculator/AvatarCostCalculator';
import { STATIC_AVATAR_PRICING } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Avatar AI Cost Calculator',
  description:
    'Estimate the cost of AI avatar videos across HeyGen and more. Drag the slider and compare prices instantly.',
  alternates: { canonical: 'https://pricetoken.ai/avatar/calculator' },
};

async function getAvatarPricing() {
  try {
    const { getCurrentAvatarPricing } = await import('@/lib/avatar-pricing-queries');
    const pricing = await getCurrentAvatarPricing();
    return pricing.length > 0 ? pricing : STATIC_AVATAR_PRICING;
  } catch {
    return STATIC_AVATAR_PRICING;
  }
}

export default async function AvatarCalculatorPage() {
  const pricing = await getAvatarPricing();

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="avatar" />
        <h1 className={styles.title}>Avatar Cost Calculator</h1>
        <p className={styles.subtitle}>
          Estimate the cost of AI avatar videos across providers.
        </p>
        <AvatarCostCalculator pricing={pricing} />
      </main>
      <Footer />
    </>
  );
}
