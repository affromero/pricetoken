import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { MusicPricingTable } from '@/components/MusicPricingTable/MusicPricingTable';
import { STATIC_MUSIC_PRICING } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Music Generation Pricing | PriceToken',
  description:
    'Compare AI music generation API pricing. Real-time per-minute costs for ElevenLabs, Soundverse, and more.',
  alternates: { canonical: 'https://pricetoken.ai/music' },
};

async function getMusicPricing() {
  try {
    const { getCurrentMusicPricing } = await import('@/lib/music-pricing-queries');
    const pricing = await getCurrentMusicPricing();
    return pricing.length > 0 ? pricing : STATIC_MUSIC_PRICING;
  } catch {
    return STATIC_MUSIC_PRICING;
  }
}

export default async function MusicPage() {
  const pricing = await getMusicPricing();

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="music" />
        <section className={styles.hero}>
          <h1 className={styles.title}>
            AI Music Generation Pricing.
            <br />
            <span className={styles.accent}>Every provider.</span>
          </h1>
          <p className={styles.subtitle}>
            Compare per-minute costs across AI music APIs.
            Updated daily from official provider pages.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Current Pricing</h2>
          <p className={styles.sectionSubtitle}>
            Sorted by cost per minute. Prices in USD.
          </p>
          <MusicPricingTable pricing={pricing} />
        </section>
      </main>
      <Footer />
    </>
  );
}
