import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { VideoModelCompare } from '@/components/VideoModelCompare/VideoModelCompare';
import { STATIC_VIDEO_PRICING } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Compare Video AI Models',
  description:
    'Side-by-side pricing comparison of video AI models across Runway, Sora, Veo, Kling, and more.',
  alternates: { canonical: 'https://pricetoken.ai/video/compare' },
};

async function getVideoPricing() {
  try {
    const { getCurrentVideoPricing } = await import('@/lib/video-pricing-queries');
    const pricing = await getCurrentVideoPricing();
    return pricing.length > 0 ? pricing : STATIC_VIDEO_PRICING;
  } catch {
    return STATIC_VIDEO_PRICING;
  }
}

export default async function VideoComparePage() {
  const pricing = await getVideoPricing();

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="video" />
        <h1 className={styles.title}>Compare Video Models</h1>
        <p className={styles.subtitle}>
          Side-by-side pricing comparison across video AI models and providers.
        </p>
        <VideoModelCompare pricing={pricing} />
      </main>
      <Footer />
    </>
  );
}
