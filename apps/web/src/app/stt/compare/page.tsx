import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { SttModelCompare } from '@/components/SttModelCompare/SttModelCompare';
import { STATIC_STT_PRICING } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Compare STT AI Models',
  description:
    'Side-by-side pricing comparison of speech-to-text models across OpenAI, Deepgram, AssemblyAI and more.',
  alternates: { canonical: 'https://pricetoken.ai/stt/compare' },
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

export default async function SttComparePage() {
  const pricing = await getSttPricing();

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="stt" />
        <h1 className={styles.title}>Compare STT Models</h1>
        <p className={styles.subtitle}>
          Side-by-side pricing comparison across speech-to-text models and providers.
        </p>
        <SttModelCompare pricing={pricing} />
      </main>
      <Footer />
    </>
  );
}
