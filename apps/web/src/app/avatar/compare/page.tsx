import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { AvatarModelCompare } from '@/components/AvatarModelCompare/AvatarModelCompare';
import { STATIC_AVATAR_PRICING } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Compare Avatar AI Models',
  description:
    'Side-by-side pricing comparison of AI avatar models across HeyGen and more.',
  alternates: { canonical: 'https://pricetoken.ai/avatar/compare' },
};

async function getAvatarPricing() {
  try {
    const { getCurrentAvatarPricing } = await import('@/lib/avatar-pricing-queries');
    const pricing = await getCurrentAvatarPricing();
    return pricing.length > 0 ? pricing : STATIC_AVATAR_PRICING;
  } catch {
    return STATIC_AVATAR_PRICING;
  }
}

export default async function AvatarComparePage() {
  const pricing = await getAvatarPricing();

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="avatar" />
        <h1 className={styles.title}>Compare Avatar Models</h1>
        <p className={styles.subtitle}>
          Side-by-side pricing comparison across AI avatar models and providers.
        </p>
        <AvatarModelCompare pricing={pricing} />
      </main>
      <Footer />
    </>
  );
}
