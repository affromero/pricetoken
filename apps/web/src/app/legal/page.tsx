import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Legal Disclaimer',
  description: 'PriceToken legal disclaimer, data accuracy notice, and trademark attributions.',
  alternates: { canonical: 'https://pricetoken.ai/legal' },
};

export default function LegalPage() {
  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <h1 className={styles.title}>Legal Disclaimer</h1>

        <section className={styles.section}>
          <h2>Data Accuracy</h2>
          <p>
            PriceToken aggregates pricing data from publicly available sources including official
            provider pricing pages. While we make reasonable efforts to keep data accurate and
            up-to-date, we make no warranties or representations of any kind, express or implied,
            about the completeness, accuracy, reliability, or suitability of the pricing data
            provided.
          </p>
          <p>
            Pricing information may be delayed, incomplete, or contain errors. Always verify
            pricing directly with the provider before making purchasing decisions.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Not Financial Advice</h2>
          <p>
            The information provided by PriceToken is for general informational purposes only and
            does not constitute financial, business, or professional advice of any kind. You should
            not rely solely on this data when making decisions about AI service providers or costs.
          </p>
        </section>

        <section className={styles.section}>
          <h2>No Warranty</h2>
          <p>
            PriceToken is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis
            without any warranties of any kind. We do not guarantee that the service will be
            uninterrupted, timely, secure, or error-free. Use of the API, SDK, and website is at
            your own risk.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Limitation of Liability</h2>
          <p>
            In no event shall PriceToken or its contributors be liable for any direct, indirect,
            incidental, special, consequential, or punitive damages arising out of or related to
            your use of the service, including but not limited to damages for loss of profits,
            data, or other intangible losses.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Trademarks</h2>
          <p>
            All product names, logos, and brands mentioned on this site are the property of their
            respective owners. OpenAI, GPT, ChatGPT, and related marks are trademarks of OpenAI,
            Inc. Anthropic, Claude, and related marks are trademarks of Anthropic, PBC. Google,
            Gemini, and related marks are trademarks of Google LLC. All other trademarks are the
            property of their respective owners.
          </p>
          <p>
            PriceToken is not affiliated with, endorsed by, or sponsored by any of the AI
            providers whose pricing data is displayed.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Open Source</h2>
          <p>
            PriceToken is open-source software licensed under the{' '}
            <a
              href="https://github.com/affromero/pricetoken/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
            >
              MIT License
            </a>
            . The source code is available on{' '}
            <a
              href="https://github.com/affromero/pricetoken"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            .
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
