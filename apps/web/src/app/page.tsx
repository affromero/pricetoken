import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { PricingTable } from '@/components/PricingTable/PricingTable';
import { DataSources } from '@/components/DataSources/DataSources';
import { UsedBy } from '@/components/UsedBy/UsedBy';
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
              'Free REST API, npm package, and Python SDK for real-time LLM pricing data across OpenAI, Anthropic, Google, and more.',
          }),
        }}
      />
      <Navigation />
      <main className={styles.root}>
        <section className={styles.hero}>
          <h1 className={styles.title}>
            Real-time LLM pricing.
            <br />
            <span className={styles.accent}>One API.</span>
          </h1>
          <p className={styles.subtitle}>
            Free REST API for real-time pricing data across OpenAI, Anthropic, Google, and more.
            Open source. Self-hostable.
          </p>
          <div className={styles.cta}>
            <code className={styles.install}>npm install pricetoken</code>
            <code className={styles.install}>pip install pricetoken</code>
          </div>
          <div className={styles.curlExample}>
            <code className={styles.curlCommand}>
              <span className={styles.curlPrompt}>$</span>{' '}
              curl https://pricetoken.ai/api/v1/pricing
            </code>
            <pre className={styles.curlResponse}>{`{ "data": [{ "modelId": "claude-sonnet-4-6", "inputPerMTok": 3, ... }], "meta": { "currency": "USD" } }`}</pre>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Current Pricing</h2>
          <p className={styles.sectionSubtitle}>
            Updated daily from official provider pricing pages. Prices in USD per million tokens.
          </p>
          <PricingTable pricing={pricing} />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How We Get Our Data</h2>
          <DataSources />
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

        <UsedBy />
      </main>
      <Footer />
    </>
  );
}
