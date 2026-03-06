import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { TtsCostCalculator } from '@/components/TtsCostCalculator/TtsCostCalculator';
import { STATIC_TTS_PRICING } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'TTS AI Cost Calculator',
  description:
    'Estimate the cost of text-to-speech across OpenAI, Google, ElevenLabs and more. Drag the slider and compare prices instantly.',
  alternates: { canonical: 'https://pricetoken.ai/tts/calculator' },
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

export default async function TtsCalculatorPage() {
  const pricing = await getTtsPricing();

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="tts" />
        <h1 className={styles.title}>TTS Cost Calculator</h1>
        <p className={styles.subtitle}>
          Estimate the cost of text-to-speech across providers.
        </p>
        <TtsCostCalculator pricing={pricing} />
      </main>
      <Footer />
    </>
  );
}
