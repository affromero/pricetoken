import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { CostCalculator } from '@/components/CostCalculator/CostCalculator';
import { STATIC_PRICING } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'LLM Cost Calculator',
  description:
    'Estimate the cost of LLM API calls across OpenAI, Anthropic, Google, and more. Enter your token counts and compare prices instantly.',
  alternates: { canonical: 'https://pricetoken.ai/calculator' },
};

async function getPricing() {
  try {
    const { getCurrentPricing } = await import('@/lib/pricing-queries');
    const pricing = await getCurrentPricing();
    return pricing.length > 0 ? pricing : STATIC_PRICING;
  } catch {
    return STATIC_PRICING;
  }
}

export default async function CalculatorPage() {
  const pricing = await getPricing();

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="text" />
        <h1 className={styles.title}>Cost Calculator</h1>
        <p className={styles.subtitle}>
          Estimate the cost of your LLM API calls across providers.
        </p>
        <CostCalculator pricing={pricing} />
      </main>
      <Footer />
    </>
  );
}
