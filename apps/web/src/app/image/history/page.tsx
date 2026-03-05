import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { ImageHistoryCharts } from './ImageHistoryCharts';
import { STATIC_IMAGE_PRICING } from 'pricetoken';
import type { ImageModelHistory } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Image AI Price History',
  description:
    'Track image AI pricing changes over time. Historical price data for DALL-E, Imagen, Stable Diffusion, FLUX, and more — updated daily.',
  alternates: { canonical: 'https://pricetoken.ai/image/history' },
};

async function getImageHistory(): Promise<ImageModelHistory[]> {
  try {
    const { getImagePriceHistory } = await import('@/lib/image-pricing-queries');
    const history = await getImagePriceHistory(365);
    return history.length > 0 ? history : getFallbackHistory();
  } catch {
    return getFallbackHistory();
  }
}

function getFallbackHistory(): ImageModelHistory[] {
  const today = new Date().toISOString().split('T')[0]!;
  return STATIC_IMAGE_PRICING.map((m) => ({
    modelId: m.modelId,
    provider: m.provider,
    displayName: m.displayName,
    history: [
      { date: today, pricePerImage: m.pricePerImage },
    ],
  }));
}

export default async function ImageHistoryPage() {
  const history = await getImageHistory();

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="image" />
        <h1 className={styles.title}>Image Price History</h1>
        <p className={styles.subtitle}>
          Track image AI pricing changes over time across all providers.
        </p>

        <ImageHistoryCharts history={history} />
      </main>
      <Footer />
    </>
  );
}
