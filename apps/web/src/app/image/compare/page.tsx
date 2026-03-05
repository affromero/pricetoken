import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { ImageModelCompare } from '@/components/ImageModelCompare/ImageModelCompare';
import { STATIC_IMAGE_PRICING } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Compare Image AI Models',
  description:
    'Side-by-side pricing comparison of image AI models across DALL-E, Imagen, Stable Diffusion, FLUX, and more.',
  alternates: { canonical: 'https://pricetoken.ai/image/compare' },
};

async function getImagePricing() {
  try {
    const { getCurrentImagePricing } = await import('@/lib/image-pricing-queries');
    const pricing = await getCurrentImagePricing();
    return pricing.length > 0 ? pricing : STATIC_IMAGE_PRICING;
  } catch {
    return STATIC_IMAGE_PRICING;
  }
}

export default async function ImageComparePage() {
  const pricing = await getImagePricing();

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="image" />
        <h1 className={styles.title}>Compare Image Models</h1>
        <p className={styles.subtitle}>
          Side-by-side pricing comparison across image AI models and providers.
        </p>
        <ImageModelCompare pricing={pricing} />
      </main>
      <Footer />
    </>
  );
}
