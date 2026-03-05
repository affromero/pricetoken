import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { ImageCostCalculator } from '@/components/ImageCostCalculator/ImageCostCalculator';
import { STATIC_IMAGE_PRICING } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Image AI Cost Calculator',
  description:
    'Estimate the cost of AI-generated images across DALL-E, Imagen, Stable Diffusion, FLUX, and more. Adjust the slider and compare prices instantly.',
  alternates: { canonical: 'https://pricetoken.ai/image/calculator' },
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

export default async function ImageCalculatorPage() {
  const pricing = await getImagePricing();

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="image" />
        <h1 className={styles.title}>Image Cost Calculator</h1>
        <p className={styles.subtitle}>
          Estimate the cost of AI-generated images across providers.
        </p>
        <ImageCostCalculator models={pricing} />
      </main>
      <Footer />
    </>
  );
}
