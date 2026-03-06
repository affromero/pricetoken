import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { AvatarPricingTable } from '@/components/AvatarPricingTable/AvatarPricingTable';
import { NonApiProviderCards } from '@/components/NonApiProviderCards/NonApiProviderCards';
import { NON_API_AVATAR_PROVIDERS } from '@/lib/avatar-non-api-providers';
import { STATIC_AVATAR_PRICING } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Avatar AI Pricing — Compare HeyGen, Synthesia, D-ID & More',
  description:
    'Real-time pricing for AI avatar APIs. Compare cost per minute across HeyGen and other avatar providers.',
  alternates: { canonical: 'https://pricetoken.ai/avatar' },
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

export default async function AvatarPage() {
  const pricing = await getAvatarPricing();

  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <ModalitySubNav modality="avatar" />
        <section className={styles.hero}>
          <h1 className={styles.title}>
            Avatar AI Pricing.
            <br />
            <span className={styles.accent}>Every provider.</span>
          </h1>
          <p className={styles.subtitle}>
            Compare per-minute pricing for AI avatar and talking-head APIs.
            Updated daily from official provider pages.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Current Pricing</h2>
          <p className={styles.sectionSubtitle}>
            Sorted by cost per minute. Prices in USD.
          </p>
          <AvatarPricingTable pricing={pricing} />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Other Avatar Providers</h2>
          <p className={styles.sectionSubtitle}>
            These providers require subscriptions. We&apos;ll track them when they offer pay-per-use APIs.
          </p>
          <NonApiProviderCards providers={NON_API_AVATAR_PROVIDERS} />
        </section>
      </main>
      <Footer />
    </>
  );
}
