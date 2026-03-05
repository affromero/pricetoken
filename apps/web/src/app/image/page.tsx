import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ImagePricingTable } from '@/components/ImagePricingTable/ImagePricingTable';
import { ImageCostCalculator } from '@/components/ImageCostCalculator/ImageCostCalculator';
import { STATIC_IMAGE_PRICING } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Image Generation Pricing',
  description:
    'Compare image generation API pricing across providers. DALL-E, Imagen, Stable Diffusion, FLUX, and more.',
  alternates: { canonical: 'https://pricetoken.ai/image' },
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

export default async function ImagePricingPage() {
  const pricing = await getImagePricing();

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <section className={styles.hero}>
          <h1 className={styles.title}>
            Image Generation Pricing.
            <br />
            <span className={styles.accent}>Every provider.</span>
          </h1>
          <p className={styles.subtitle}>
            Compare per-image pricing across DALL-E, Imagen, Stable Diffusion, FLUX, and more.
            Updated daily from official provider pages.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Current Pricing</h2>
          <p className={styles.sectionSubtitle}>
            Sorted by price per image. Prices in USD.
          </p>
          <ImagePricingTable data={pricing} />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Cost Calculator</h2>
          <p className={styles.sectionSubtitle}>
            Estimate your image generation costs across providers.
          </p>
          <ImageCostCalculator models={pricing} />
        </section>
      </main>
      <Footer />
    </>
  );
}
