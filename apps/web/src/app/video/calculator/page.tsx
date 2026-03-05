import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { VideoCostCalculator } from '@/components/VideoCostCalculator/VideoCostCalculator';
import { STATIC_VIDEO_PRICING } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Video AI Cost Calculator',
  description:
    'Estimate the cost of AI-generated video across Runway, Sora, Veo, Kling, and more. Drag the slider and compare prices instantly.',
  alternates: { canonical: 'https://pricetoken.ai/video/calculator' },
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

export default async function VideoCalculatorPage() {
  const pricing = await getVideoPricing();

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="video" />
        <h1 className={styles.title}>Video Cost Calculator</h1>
        <p className={styles.subtitle}>
          Estimate the cost of AI-generated video across providers.
        </p>
        <VideoCostCalculator pricing={pricing} />
      </main>
      <Footer />
    </>
  );
}
