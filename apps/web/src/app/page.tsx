import type { Metadata } from 'next';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { ModalitySubNav } from '@/components/ModalitySubNav/ModalitySubNav';
import { PricingTable } from '@/components/PricingTable/PricingTable';
import { DataSources } from '@/components/DataSources/DataSources';
import { TrustedBy } from '@/components/TrustedBy/TrustedBy';
import { STATIC_PRICING } from 'pricetoken';
import styles from './page.module.css';

export const metadata: Metadata = {
  alternates: { canonical: 'https://pricetoken.ai' },
};

async function getPricing() {
  try {
    const { getCurrentPricing } = await import('@/lib/pricing-queries');
    const pricing = await getCurrentPricing();
    return pricing.length > 0 ? pricing : STATIC_PRICING;
  } catch {
    return STATIC_PRICING;
  }
}

export default async function HomePage() {
  const pricing = await getPricing();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'PriceToken',
            url: 'https://pricetoken.ai',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            description:
              'Free REST API, npm package, and Python SDK for real-time AI pricing data across text, image, and video generation providers.',
          }),
        }}
      />
      <Navigation />
      <main className={styles.root}>
        <section className={styles.hero}>
          <h1 className={styles.title}>
            Real-time AI pricing.
            <br />
            <span className={styles.accent}>One API.</span>
          </h1>
          <p className={styles.subtitle}>
            Free REST API for real-time pricing across text, image, and video AI providers.
            Open source. Self-hostable.
          </p>
          <div className={styles.cta}>
            <code className={styles.install}>npm install pricetoken</code>
            <code className={styles.install}>pip install pricetoken</code>
          </div>

          <div className={styles.modalities}>
            <Link href="/" className={`${styles.modalityCard} ${styles.modalityActive}`}>
              <span className={styles.modalityIcon}>T</span>
              <span className={styles.modalityLabel}>Text</span>
              <span className={styles.modalityMeta}>$/M tokens</span>
            </Link>
            <Link href="/image" className={styles.modalityCard}>
              <span className={styles.modalityIcon}>I</span>
              <span className={styles.modalityLabel}>Image</span>
              <span className={styles.modalityMeta}>$/image</span>
            </Link>
            <Link href="/video" className={styles.modalityCard}>
              <span className={styles.modalityIcon}>V</span>
              <span className={styles.modalityLabel}>Video</span>
              <span className={styles.modalityMeta}>$/minute</span>
            </Link>
            <div className={styles.modalityCardDisabled}>
              <span className={styles.modalityIcon}>W</span>
              <span className={styles.modalityLabel}>3D / World</span>
              <span className={styles.modalityMeta}>coming soon</span>
              <div className={styles.modalityTooltip}>
                No standard pricing unit exists yet. Providers use credits,
                subscriptions, or per-generation fees — no apples-to-apples
                comparison is possible today.
              </div>
            </div>
          </div>
        </section>

        <ModalitySubNav modality="text" />

        <section className={styles.section}>
          <PricingTable pricing={pricing} />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How We Get Our Data</h2>
          <DataSources />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3D / World Models</h2>
          <p className={styles.sectionSubtitle}>
            We&apos;re tracking the emerging world model space. Once providers converge on a
            standard pricing unit, we&apos;ll add full comparisons.
          </p>
          <div className={styles.comingSoonGrid}>
            {[
              { name: 'World Labs', url: 'https://www.worldlabs.ai' },
              { name: 'Google Genie', url: 'https://deepmind.google/technologies/genie/' },
              { name: 'Meshy', url: 'https://www.meshy.ai' },
              { name: 'Tripo', url: 'https://www.tripo3d.ai' },
              { name: 'Rodin', url: 'https://hyperhuman.deemos.com' },
              { name: 'Sloyd', url: 'https://www.sloyd.ai' },
              { name: 'SpaitialAI', url: 'https://www.spaitial.ai' },
            ].map((provider) => (
              <a
                key={provider.name}
                href={provider.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.comingSoonCard}
              >
                <span className={styles.comingSoonDot} />
                <span className={styles.comingSoonName}>{provider.name}</span>
                <span className={styles.comingSoonArrow}>&rarr;</span>
              </a>
            ))}
          </div>
        </section>

        <section className={styles.features}>
          <div className={styles.feature}>
            <h3>Free REST API</h3>
            <p>30 requests/hour free. No signup required. JSON responses with CORS enabled.</p>
          </div>
          <div className={styles.feature}>
            <h3>npm & PyPI Packages</h3>
            <p>Typed clients for JS/TS and Python. Offline cost calculator and static pricing data. Zero runtime deps.</p>
          </div>
          <div className={styles.feature}>
            <h3>Open Source</h3>
            <p>MIT licensed. Self-host on your own infrastructure. Fork and extend.</p>
          </div>
        </section>

        <TrustedBy />
      </main>
      <Footer />
    </>
  );
}
