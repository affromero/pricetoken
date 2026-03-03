import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { CodeBlock } from '@/components/CodeBlock/CodeBlock';
import styles from './page.module.css';

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

export default function DocsPage() {
  return (
    <>
      <Navigation />
      <main className={styles.root}>
        <h1 className={styles.title}>API Documentation</h1>
        <p className={styles.subtitle}>
          Free REST API for LLM pricing data. No signup required for 100 requests/day.
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
              description="Current pricing for all models. Filter with ?provider=anthropic"
            />
            <Endpoint
              method="GET"
              path="/api/v1/pricing/:modelId"
              description="Single model pricing and metadata."
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
              description="Side-by-side comparison. Param: ?models=a,b,c (max 10)"
            />
            <Endpoint
              method="GET"
              path="/api/v1/pricing/cheapest"
              description="Cheapest model overall or per provider. Param: ?provider=x"
            />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Rate Limits</h2>
          <div className={styles.table}>
            <div className={styles.tableRow}>
              <span className={styles.tableLabel}>Without API key</span>
              <span className={styles.tableValue}>100 requests / day</span>
            </div>
            <div className={styles.tableRow}>
              <span className={styles.tableLabel}>With API key</span>
              <span className={styles.tableValue}>1,000 requests / day</span>
            </div>
          </div>
          <p className={styles.text}>
            Rate limit headers are included in every response:{' '}
            <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>,{' '}
            <code>X-RateLimit-Reset</code>.
          </p>
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
    "cached": false
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
