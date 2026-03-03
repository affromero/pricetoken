import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { CodeBlock } from '@/components/CodeBlock/CodeBlock';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'API Documentation',
  description:
    'PriceToken REST API documentation. Endpoints for LLM pricing, cost comparison, price history, and provider data. Free, no signup required.',
  alternates: { canonical: 'https://pricetoken.ai/docs' },
};

const curlExample = `curl https://pricetoken.ai/api/v1/pricing`;

const jsExample = `import { PriceTokenClient } from 'pricetoken';

const client = new PriceTokenClient();
const pricing = await client.getPricing();
console.log(pricing);`;

const pythonExample = `import requests

r = requests.get("https://pricetoken.ai/api/v1/pricing")
pricing = r.json()["data"]
print(pricing)`;

const costExample = `import { calculateModelCost } from 'pricetoken';

const cost = calculateModelCost(
  'claude-sonnet-4-6',
  1_000_000,  // 1M input tokens
  100_000     // 100K output tokens
);

console.log(cost.totalCost); // $4.50`;

const curlAuthExample = `curl https://pricetoken.ai/api/v1/pricing \\
  -H "Authorization: Bearer pt_live_YOUR_KEY"`;

const jsAuthExample = `const res = await fetch("https://pricetoken.ai/api/v1/pricing", {
  headers: {
    "Authorization": "Bearer pt_live_YOUR_KEY",
  },
});
const data = await res.json();`;

const pythonAuthExample = `import requests

r = requests.get(
    "https://pricetoken.ai/api/v1/pricing",
    headers={"Authorization": "Bearer pt_live_YOUR_KEY"},
)
pricing = r.json()["data"]`;

export default function DocsPage() {
  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <h1 className={styles.title}>API Documentation</h1>
        <p className={styles.subtitle}>
          Free REST API for LLM pricing data. No signup required for 30 requests/hour.
        </p>

        <section className={styles.section}>
          <h2 className={styles.heading}>Quick Start</h2>
          <CodeBlock
            tabs={[
              { label: 'curl', code: curlExample },
              { label: 'JavaScript', code: jsExample },
              { label: 'Python', code: pythonExample },
            ]}
          />
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Offline Cost Calculator</h2>
          <p className={styles.text}>
            Calculate costs without any API call — works in browsers, Node.js, and edge runtimes.
          </p>
          <CodeBlock tabs={[{ label: 'JavaScript', code: costExample }]} />
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Endpoints</h2>
          <div className={styles.endpoints}>
            <Endpoint
              method="GET"
              path="/api/v1/pricing"
              description="Current pricing for all models. Params: ?provider=anthropic&currency=EUR"
            />
            <Endpoint
              method="GET"
              path="/api/v1/pricing/:modelId"
              description="Single model pricing and metadata. Param: ?currency=EUR"
            />
            <Endpoint
              method="GET"
              path="/api/v1/pricing/history"
              description="Historical pricing data. Params: ?days=30&modelId=x&provider=y"
            />
            <Endpoint
              method="GET"
              path="/api/v1/pricing/providers"
              description="Provider list with model counts and cheapest prices."
            />
            <Endpoint
              method="GET"
              path="/api/v1/pricing/compare"
              description="Side-by-side comparison. Params: ?models=a,b,c (max 10)&currency=EUR"
            />
            <Endpoint
              method="GET"
              path="/api/v1/pricing/cheapest"
              description="Cheapest model overall or per provider. Params: ?provider=x&currency=EUR"
            />
            <Endpoint
              method="GET"
              path="/api/v1/pricing/currencies"
              description="Supported currencies with exchange rates."
            />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Rate Limits</h2>
          <div className={styles.table}>
            <div className={styles.tableRow}>
              <span className={styles.tableLabel}>Without API key</span>
              <span className={styles.tableValue}>30 requests / hour</span>
            </div>
            <div className={styles.tableRow}>
              <span className={styles.tableLabel}>With API key</span>
              <span className={styles.tableValue}>500 requests / hour</span>
            </div>
          </div>
          <p className={styles.textNote}>
            API keys are free — no charges, ever. Key holders get higher rate limits.
          </p>
          <p className={styles.text}>
            Rate limit headers are included in every response:{' '}
            <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>,{' '}
            <code>X-RateLimit-Reset</code>.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>API Keys</h2>
          <p className={styles.text}>
            API keys are <strong>completely free</strong> — there are no charges, no credit card
            required, and no usage fees. Keys simply unlock higher rate limits (500 requests/hour
            instead of 30).
          </p>
          <h3 className={styles.subheading}>Key Format</h3>
          <p className={styles.text}>
            All keys use the <code className={styles.keyExample}>pt_</code> prefix:
          </p>
          <p className={styles.keyExample}>pt_live_abc123def456...</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Authentication</h2>
          <p className={styles.text}>
            Pass your API key via the <code>Authorization</code> header using Bearer token format:
          </p>
          <CodeBlock
            tabs={[
              { label: 'curl', code: curlAuthExample },
              { label: 'JavaScript', code: jsAuthExample },
              { label: 'Python', code: pythonAuthExample },
            ]}
          />
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Get an API Key</h2>
          <div className={styles.comingSoon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
            <div>
              <h3 className={styles.subheading}>Self-service signup coming soon</h3>
              <p className={styles.text}>
                In the meantime, you can request a free API key by{' '}
                <a href="https://github.com/nichochar/pricetoken/issues/new?title=API+Key+Request&labels=api-key">
                  opening a GitHub issue
                </a>{' '}
                or emailing <a href="mailto:hello@pricetoken.ai">hello@pricetoken.ai</a>.
              </p>
              <p className={styles.text}>
                <strong>Keys are free</strong> — no credit card, no trial period, no catches.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Response Format</h2>
          <CodeBlock
            tabs={[
              {
                label: 'Success',
                code: `{
  "data": [...],
  "meta": {
    "timestamp": "2026-03-03T12:00:00Z",
    "cached": false,
    "currency": "EUR",      // only with ?currency
    "exchangeRate": 0.92    // only with ?currency
  }
}`,
              },
              {
                label: 'Error',
                code: `{
  "error": "Rate limit exceeded",
  "status": 429
}`,
              },
            ]}
          />
        </section>
      </main>
      <Footer />
    </>
  );
}

function Endpoint({
  method,
  path,
  description,
}: {
  method: string;
  path: string;
  description: string;
}) {
  return (
    <div className={styles.endpoint}>
      <div className={styles.endpointHeader}>
        <span className={styles.method}>{method}</span>
        <code className={styles.path}>{path}</code>
      </div>
      <p className={styles.endpointDesc}>{description}</p>
    </div>
  );
}
