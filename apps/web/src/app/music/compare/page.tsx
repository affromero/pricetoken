import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { MusicModelCompare } from '@/components/MusicModelCompare/MusicModelCompare';
import { STATIC_MUSIC_PRICING } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Compare Music Models',
  description:
    'Side-by-side pricing comparison of AI music generation models across ElevenLabs, Soundverse, and more.',
  alternates: { canonical: 'https://pricetoken.ai/music/compare' },
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

export default async function MusicComparePage() {
  const pricing = await getMusicPricing();

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="music" />
        <h1 className={styles.title}>Compare Music Models</h1>
        <p className={styles.subtitle}>
          Side-by-side comparison of AI music generation models.
        </p>
        <MusicModelCompare pricing={pricing} />
      </main>
      <Footer />
    </>
  );
}
