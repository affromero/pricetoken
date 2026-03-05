import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { VideoPricingTable } from '@/components/VideoPricingTable/VideoPricingTable';
import { STATIC_VIDEO_PRICING } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Video AI Pricing — Compare Runway, Sora, Veo, Kling & More',
  description:
    'Real-time pricing for video AI generation APIs. Compare cost per minute across Runway, Sora, Veo, Pika, Kling, Luma, and more.',
  alternates: { canonical: 'https://pricetoken.ai/video' },
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

export default async function VideoPage() {
  const pricing = await getVideoPricing();

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="video" />
        <section className={styles.hero}>
          <h1 className={styles.title}>
            Video Generation Pricing.
            <br />
            <span className={styles.accent}>Every provider.</span>
          </h1>
          <p className={styles.subtitle}>
            Compare per-minute pricing across Runway, Sora, Veo, Kling, and more.
            Updated daily from official provider pages.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Current Pricing</h2>
          <p className={styles.sectionSubtitle}>
            Sorted by cost per minute. Prices in USD.
          </p>
          <VideoPricingTable pricing={pricing} />
        </section>
      </main>
      <Footer />
    </>
  );
}
