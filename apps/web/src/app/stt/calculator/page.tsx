import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { SttCostCalculator } from '@/components/SttCostCalculator/SttCostCalculator';
import { STATIC_STT_PRICING } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'STT AI Cost Calculator',
  description:
    'Estimate the cost of speech-to-text across OpenAI, Deepgram, AssemblyAI and more. Drag the slider and compare prices instantly.',
  alternates: { canonical: 'https://pricetoken.ai/stt/calculator' },
};

async function getSttPricing() {
  try {
    const { getCurrentSttPricing } = await import('@/lib/stt-pricing-queries');
    const pricing = await getCurrentSttPricing();
    return pricing.length > 0 ? pricing : STATIC_STT_PRICING;
  } catch {
    return STATIC_STT_PRICING;
  }
}

export default async function SttCalculatorPage() {
  const pricing = await getSttPricing();

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="stt" />
        <h1 className={styles.title}>STT Cost Calculator</h1>
        <p className={styles.subtitle}>
          Estimate the cost of speech-to-text across providers.
        </p>
        <SttCostCalculator pricing={pricing} />
      </main>
      <Footer />
    </>
  );
}
