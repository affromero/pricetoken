import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { MusicCostCalculator } from '@/components/MusicCostCalculator/MusicCostCalculator';
import { STATIC_MUSIC_PRICING } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Music Cost Calculator',
  description:
    'Estimate your AI music generation costs across ElevenLabs, Soundverse, and more. Drag the slider and compare prices instantly.',
  alternates: { canonical: 'https://pricetoken.ai/music/calculator' },
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

export default async function MusicCalculatorPage() {
  const pricing = await getMusicPricing();

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="music" />
        <h1 className={styles.title}>Music Cost Calculator</h1>
        <p className={styles.subtitle}>
          Estimate your AI music generation costs.
        </p>
        <MusicCostCalculator pricing={pricing} />
      </main>
      <Footer />
    </>
  );
}
