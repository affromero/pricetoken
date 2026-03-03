import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModelCompare } from '@/components/ModelCompare/ModelCompare';
import { STATIC_PRICING } from 'pricetoken';
import styles from './page.module.css';

async function getPricing() {
  try {
    const { getCurrentPricing } = await import('@/lib/pricing-queries');
    const pricing = await getCurrentPricing();
    return pricing.length > 0 ? pricing : STATIC_PRICING;
  } catch {
    return STATIC_PRICING;
  }
}

export default async function ComparePage() {
  const pricing = await getPricing();

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <h1 className={styles.title}>Compare Models</h1>
        <p className={styles.subtitle}>
          Side-by-side pricing comparison across models and providers.
        </p>
        <ModelCompare pricing={pricing} />
      </main>
      <Footer />
    </>
  );
}
