import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { ModelCompare } from '@/components/ModelCompare/ModelCompare';
import { STATIC_PRICING } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Compare LLM Models',
  description:
    'Side-by-side pricing comparison of LLM models across OpenAI, Anthropic, Google, and more. Find the best value for your use case.',
  alternates: { canonical: 'https://pricetoken.ai/compare' },
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

export default async function ComparePage() {
  const pricing = await getPricing();

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="text" />
        <h1 className={styles.title}>Compare Models</h1>
        <p className={styles.subtitle}>
          Side-by-side pricing comparison across models and providers.
        </p>
        <ModelCompare pricing={pricing} />
      </main>
      <Footer />
    </>
  );
}
