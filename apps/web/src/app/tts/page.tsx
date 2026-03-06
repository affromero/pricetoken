import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { TtsPricingTable } from '@/components/TtsPricingTable/TtsPricingTable';
import { STATIC_TTS_PRICING } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'TTS AI Pricing — Compare OpenAI, Google, ElevenLabs & More',
  description:
    'Real-time pricing for text-to-speech APIs. Compare cost per million characters across OpenAI, Google, ElevenLabs and other TTS providers.',
  alternates: { canonical: 'https://pricetoken.ai/tts' },
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

export default async function TtsPage() {
  const pricing = await getTtsPricing();

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="tts" />
        <section className={styles.hero}>
          <h1 className={styles.title}>
            TTS AI Pricing.
            <br />
            <span className={styles.accent}>Every provider.</span>
          </h1>
          <p className={styles.subtitle}>
            Compare per-million-character pricing for text-to-speech APIs.
            Updated daily from official provider pages.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Current Pricing</h2>
          <p className={styles.sectionSubtitle}>
            Sorted by cost per million characters. Prices in USD.
          </p>
          <TtsPricingTable pricing={pricing} />
        </section>
      </main>
      <Footer />
    </>
  );
}
