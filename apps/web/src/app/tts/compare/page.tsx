import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { TtsModelCompare } from '@/components/TtsModelCompare/TtsModelCompare';
import { STATIC_TTS_PRICING } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Compare TTS AI Models',
  description:
    'Side-by-side pricing comparison of text-to-speech models across OpenAI, Google, ElevenLabs and more.',
  alternates: { canonical: 'https://pricetoken.ai/tts/compare' },
};

async function getTtsPricing() {
  try {
    const { getCurrentTtsPricing } = await import('@/lib/tts-pricing-queries');
    const pricing = await getCurrentTtsPricing();
    return pricing.length > 0 ? pricing : STATIC_TTS_PRICING;
  } catch {
    return STATIC_TTS_PRICING;
  }
}

export default async function TtsComparePage() {
  const pricing = await getTtsPricing();

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="tts" />
        <h1 className={styles.title}>Compare TTS Models</h1>
        <p className={styles.subtitle}>
          Side-by-side pricing comparison across text-to-speech models and providers.
        </p>
        <TtsModelCompare pricing={pricing} />
      </main>
      <Footer />
    </>
  );
}
