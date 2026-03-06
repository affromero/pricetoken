import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { SttPricingTable } from '@/components/SttPricingTable/SttPricingTable';
import { STATIC_STT_PRICING } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'STT AI Pricing — Compare OpenAI, Deepgram, AssemblyAI & More',
  description:
    'Real-time pricing for speech-to-text APIs. Compare cost per minute across OpenAI, Deepgram, AssemblyAI and other STT providers.',
  alternates: { canonical: 'https://pricetoken.ai/stt' },
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

export default async function SttPage() {
  const pricing = await getSttPricing();

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="stt" />
        <section className={styles.hero}>
          <h1 className={styles.title}>
            STT AI Pricing.
            <br />
            <span className={styles.accent}>Every provider.</span>
          </h1>
          <p className={styles.subtitle}>
            Compare per-minute pricing for speech-to-text APIs.
            Updated daily from official provider pages.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Current Pricing</h2>
          <p className={styles.sectionSubtitle}>
            Sorted by cost per minute. Prices in USD.
          </p>
          <SttPricingTable pricing={pricing} />
        </section>
      </main>
      <Footer />
    </>
  );
}
