import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation/Navigation';
import { Footer } from '@/components/Footer/Footer';
import { CodeBlock } from '@/components/CodeBlock/CodeBlock';
import { DocsModeSwitcher } from '@/components/DocsModeSwitcher/DocsModeSwitcher';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'API Documentation',
  description:
    'PriceToken REST API documentation. Endpoints for LLM pricing, cost comparison, price history, and provider data. Free, no signup required.',
  alternates: { canonical: 'https://pricetoken.ai/docs' },
};

const curlExample = `curl https://pricetoken.ai/api/v1/text`;

const jsExample = `import { PriceTokenClient } from 'pricetoken';

const client = new PriceTokenClient();
const pricing = await client.getPricing();
console.log(pricing);`;

const pythonExample = `import requests

r = requests.get("https://pricetoken.ai/api/v1/text")
pricing = r.json()["data"]
print(pricing)`;

const launchDateCurlExample = `# Models launched in 2025 or later
curl "https://pricetoken.ai/api/v1/text?after=2025-01-01"

# Models launched before 2025
curl "https://pricetoken.ai/api/v1/text?before=2025-01-01"

# Models launched in H1 2025
curl "https://pricetoken.ai/api/v1/text?after=2025-01-01&before=2025-07-01"

# Cheapest model launched since October 2025
curl "https://pricetoken.ai/api/v1/text/cheapest?after=2025-10-01"`;

const launchDateJsExample = `import { PriceTokenClient } from 'pricetoken';

const client = new PriceTokenClient();

// Models launched in 2025 or later
const recent = await client.getPricing({ after: '2025-01-01' });

// Cheapest model launched since October 2025
const cheapest = await client.getCheapest({ after: '2025-10-01' });`;

const launchDatePyExample = `from pricetoken import PriceTokenClient

client = PriceTokenClient()

# Models launched in 2025 or later
recent = client.get_pricing(after="2025-01-01")

# Cheapest model launched since October 2025
cheapest = client.get_cheapest(after="2025-10-01")`;

const videoCurlExample = `# All video models
curl https://pricetoken.ai/api/v1/video

# Single video model
curl https://pricetoken.ai/api/v1/video/runway-gen4-720p

# Cheapest video model
curl https://pricetoken.ai/api/v1/video/cheapest?provider=runway`;

const videoJsExample = `import { PriceTokenClient, calculateVideoCost } from 'pricetoken';

const client = new PriceTokenClient();
const models = await client.getVideoPricing();
const cheapest = await client.getCheapestVideoModel();

// Offline cost calculation
const cost = calculateVideoCost('runway-gen4-720p', 7.2, 30);
console.log(cost.totalCost); // $3.60 for 30 seconds`;

const videoPyExample = `from pricetoken import PriceTokenClient, calculate_video_cost

client = PriceTokenClient()
models = client.get_video_pricing()
cheapest = client.get_cheapest_video_model()

# Offline cost calculation
cost = calculate_video_cost("runway-gen4-720p", 7.2, 30)
print(cost.total_cost)  # 3.6 for 30 seconds`;

const avatarCurlExample = `# All avatar models
curl https://pricetoken.ai/api/v1/avatar

# Single avatar model
curl https://pricetoken.ai/api/v1/avatar/heygen-public-avatar-iii

# Cheapest avatar model
curl https://pricetoken.ai/api/v1/avatar/cheapest`;

const avatarJsExample = `import { PriceTokenClient, calculateAvatarCost } from 'pricetoken';

const client = new PriceTokenClient();
const models = await client.getAvatarPricing();
const cheapest = await client.getCheapestAvatarModel();

// Offline cost calculation
const cost = calculateAvatarCost('heygen-public-avatar-iii', 0.99, 60);
console.log(cost.totalCost); // $0.99 for 1 minute`;

const avatarPyExample = `from pricetoken import PriceTokenClient, calculate_avatar_cost

client = PriceTokenClient()
models = client.get_avatar_pricing()
cheapest = client.get_cheapest_avatar_model()

# Offline cost calculation
cost = calculate_avatar_cost("heygen-public-avatar-iii", 0.99, 60)
print(cost.total_cost)  # 0.99 for 1 minute`;

const ttsCurlExample = `# All TTS models
curl https://pricetoken.ai/api/v1/tts

# Single TTS model
curl https://pricetoken.ai/api/v1/tts/openai-tts-1

# Cheapest TTS model
curl https://pricetoken.ai/api/v1/tts/cheapest`;

const ttsJsExample = `import { PriceTokenClient, calculateTtsCost } from 'pricetoken';

const client = new PriceTokenClient();
const models = await client.getTtsPricing();
const cheapest = await client.getCheapestTtsModel();

// Offline cost calculation
const cost = calculateTtsCost('openai-tts-1', 15.0, 1_000_000);
console.log(cost.totalCost); // $15.00 for 1M characters`;

const ttsPyExample = `from pricetoken import PriceTokenClient, calculate_tts_cost

client = PriceTokenClient()
models = client.get_tts_pricing()
cheapest = client.get_cheapest_tts_model()

# Offline cost calculation
cost = calculate_tts_cost("openai-tts-1", 15.0, 1_000_000)
print(cost.total_cost)  # 15.0 for 1M characters`;

const sttCurlExample = `# All STT models
curl https://pricetoken.ai/api/v1/stt

# Single STT model
curl https://pricetoken.ai/api/v1/stt/openai-whisper-1

# Cheapest STT model
curl https://pricetoken.ai/api/v1/stt/cheapest`;

const sttJsExample = `import { PriceTokenClient, calculateSttCost } from 'pricetoken';

const client = new PriceTokenClient();
const models = await client.getSttPricing();
const cheapest = await client.getCheapestSttModel();

// Offline cost calculation
const cost = calculateSttCost('openai-whisper-1', 0.006, 60);
console.log(cost.totalCost); // $0.006 for 1 minute`;

const sttPyExample = `from pricetoken import PriceTokenClient, calculate_stt_cost

client = PriceTokenClient()
models = client.get_stt_pricing()
cheapest = client.get_cheapest_stt_model()

# Offline cost calculation
cost = calculate_stt_cost("openai-whisper-1", 0.006, 60)
print(cost.total_cost)  # 0.006 for 1 minute`;

const musicCurlExample = `# All music models
curl https://pricetoken.ai/api/v1/music

# Single music model
curl https://pricetoken.ai/api/v1/music/elevenlabs-eleven-music

# Cheapest music model
curl https://pricetoken.ai/api/v1/music/cheapest`;

const musicJsExample = `import { PriceTokenClient, calculateMusicCost } from 'pricetoken';

const client = new PriceTokenClient();
const models = await client.getMusicPricing();
const cheapest = await client.getCheapestMusicModel();

// Offline cost calculation
const cost = calculateMusicCost('elevenlabs-eleven-music', 0.50, 300);
console.log(cost.totalCost); // $2.50 for 5 minutes`;

const musicPyExample = `from pricetoken import PriceTokenClient, calculate_music_cost

client = PriceTokenClient()
models = client.get_music_pricing()
cheapest = client.get_cheapest_music_model()

# Offline cost calculation
cost = calculate_music_cost("elevenlabs-eleven-music", 0.50, 300)
print(cost.total_cost)  # 2.5 for 5 minutes`;

const costExample = `import { calculateModelCost } from 'pricetoken';

const cost = calculateModelCost(
  'claude-sonnet-4-6',
  1_000_000,  // 1M input tokens
  100_000     // 100K output tokens
);

console.log(cost.totalCost); // $4.50`;

const curlAuthExample = `curl https://pricetoken.ai/api/v1/text \\
  -H "Authorization: Bearer pt_live_YOUR_KEY"`;

const jsAuthExample = `const res = await fetch("https://pricetoken.ai/api/v1/text", {
  headers: {
    "Authorization": "Bearer pt_live_YOUR_KEY",
  },
});
const data = await res.json();`;

const pythonAuthExample = `import requests

r = requests.get(
    "https://pricetoken.ai/api/v1/text",
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
          <h2 className={styles.heading}>Filter by Launch Date</h2>
          <p className={styles.text}>
            Every model includes a <code>launchDate</code> field (API GA date). Use the{' '}
            <code>after</code> and <code>before</code> query params on{' '}
            <code>/text</code> and <code>/text/cheapest</code> to filter by date range.
          </p>
          <CodeBlock
            tabs={[
              { label: 'curl', code: launchDateCurlExample },
              { label: 'JavaScript', code: launchDateJsExample },
              { label: 'Python', code: launchDatePyExample },
            ]}
          />
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Endpoints</h2>
          <DocsModeSwitcher
            textContent={
              <>
                <p className={styles.text}>
                  Token-based pricing for LLMs. Uses <code>inputPerMTok</code> and{' '}
                  <code>outputPerMTok</code> (cost per million tokens).
                </p>
                <div className={styles.endpoints}>
                  <Endpoint
                    method="GET"
                    path="/api/v1/text"
                    description="Current pricing for all models. Params: ?provider=anthropic&currency=EUR&after=2025-01-01&before=2025-12-31"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/text/:modelId"
                    description="Single model pricing and metadata. Param: ?currency=EUR"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/text/history"
                    description="Historical pricing data. Params: ?days=30&modelId=x&provider=y"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/text/providers"
                    description="Provider list with model counts and cheapest prices."
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/text/compare"
                    description="Side-by-side comparison. Params: ?models=a,b,c (max 10)&currency=EUR"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/text/cheapest"
                    description="Cheapest model overall or per provider. Params: ?provider=x&currency=EUR&after=2025-01-01&before=2025-12-31"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/pricing/currencies"
                    description="Supported currencies with exchange rates."
                  />
                </div>
              </>
            }
            imageContent={
              <>
                <p className={styles.text}>
                  Per-image pricing for generation models. Uses <code>costPerImage</code> instead of
                  per-token pricing.
                </p>
                <div className={styles.endpoints}>
                  <Endpoint
                    method="GET"
                    path="/api/v1/image"
                    description="Current pricing for all image models. Params: ?provider=openai&currency=EUR"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/image/:modelId"
                    description="Single image model pricing. Param: ?currency=EUR"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/image/history"
                    description="Historical image pricing. Params: ?days=30&modelId=x&provider=y"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/image/providers"
                    description="Image provider list with model counts and cheapest prices."
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/image/compare"
                    description="Side-by-side image model comparison. Params: ?models=a,b,c (max 10)&currency=EUR"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/image/cheapest"
                    description="Cheapest image model overall or per provider. Params: ?provider=x&currency=EUR"
                  />
                </div>
              </>
            }
            videoContent={
              <>
                <p className={styles.text}>
                  Per-minute pricing for video generation across Runway, Sora, Veo, Kling, and more.
                  Uses <code>costPerMinute</code> instead of token pricing.
                </p>
                <CodeBlock
                  tabs={[
                    { label: 'curl', code: videoCurlExample },
                    { label: 'JavaScript', code: videoJsExample },
                    { label: 'Python', code: videoPyExample },
                  ]}
                />
                <div className={styles.endpoints}>
                  <Endpoint
                    method="GET"
                    path="/api/v1/video"
                    description="Current pricing for all video models. Params: ?provider=runway&currency=EUR"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/video/:modelId"
                    description="Single video model pricing. Param: ?currency=EUR"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/video/history"
                    description="Historical video pricing data. Params: ?days=30&modelId=x&provider=y"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/video/providers"
                    description="Video provider list with model counts and cheapest prices."
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/video/compare"
                    description="Side-by-side video model comparison. Params: ?models=a,b,c (max 10)&currency=EUR"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/video/cheapest"
                    description="Cheapest video model overall or per provider. Params: ?provider=x&currency=EUR"
                  />
                </div>
              </>
            }
            avatarContent={
              <>
                <p className={styles.text}>
                  Per-minute pricing for AI avatar and talking-head APIs. Uses{' '}
                  <code>costPerMinute</code> with an additional <code>avatarType</code> field
                  (standard, premium, translation, streaming).
                </p>
                <CodeBlock
                  tabs={[
                    { label: 'curl', code: avatarCurlExample },
                    { label: 'JavaScript', code: avatarJsExample },
                    { label: 'Python', code: avatarPyExample },
                  ]}
                />
                <div className={styles.endpoints}>
                  <Endpoint
                    method="GET"
                    path="/api/v1/avatar"
                    description="Current pricing for all avatar models. Params: ?provider=heygen&currency=EUR"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/avatar/:modelId"
                    description="Single avatar model pricing. Param: ?currency=EUR"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/avatar/history"
                    description="Historical avatar pricing data. Params: ?days=30&modelId=x&provider=y"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/avatar/providers"
                    description="Avatar provider list with model counts and cheapest prices."
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/avatar/compare"
                    description="Side-by-side avatar model comparison. Params: ?models=a,b,c (max 10)&currency=EUR"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/avatar/cheapest"
                    description="Cheapest avatar model overall or per provider. Params: ?provider=x&currency=EUR"
                  />
                </div>
              </>
            }
            ttsContent={
              <>
                <p className={styles.text}>
                  Per-character pricing for text-to-speech APIs. Uses{' '}
                  <code>costPerMChars</code> (cost per million characters) with an additional{' '}
                  <code>voiceType</code> field (standard, neural, wavenet, hd).
                </p>
                <CodeBlock
                  tabs={[
                    { label: 'curl', code: ttsCurlExample },
                    { label: 'JavaScript', code: ttsJsExample },
                    { label: 'Python', code: ttsPyExample },
                  ]}
                />
                <div className={styles.endpoints}>
                  <Endpoint
                    method="GET"
                    path="/api/v1/tts"
                    description="Current pricing for all TTS models. Params: ?provider=openai&currency=EUR"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/tts/:modelId"
                    description="Single TTS model pricing. Param: ?currency=EUR"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/tts/history"
                    description="Historical TTS pricing data. Params: ?days=30&modelId=x&provider=y"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/tts/providers"
                    description="TTS provider list with model counts and cheapest prices."
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/tts/compare"
                    description="Side-by-side TTS model comparison. Params: ?models=a,b,c (max 10)&currency=EUR"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/tts/cheapest"
                    description="Cheapest TTS model overall or per provider. Params: ?provider=x&currency=EUR"
                  />
                </div>
              </>
            }
            sttContent={
              <>
                <p className={styles.text}>
                  Per-minute pricing for speech-to-text APIs. Uses{' '}
                  <code>costPerMinute</code> with an additional <code>sttType</code> field
                  (batch, streaming, real-time).
                </p>
                <CodeBlock
                  tabs={[
                    { label: 'curl', code: sttCurlExample },
                    { label: 'JavaScript', code: sttJsExample },
                    { label: 'Python', code: sttPyExample },
                  ]}
                />
                <div className={styles.endpoints}>
                  <Endpoint
                    method="GET"
                    path="/api/v1/stt"
                    description="Current pricing for all STT models. Params: ?provider=openai&currency=EUR"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/stt/:modelId"
                    description="Single STT model pricing. Param: ?currency=EUR"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/stt/history"
                    description="Historical STT pricing data. Params: ?days=30&modelId=x&provider=y"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/stt/providers"
                    description="STT provider list with model counts and cheapest prices."
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/stt/compare"
                    description="Side-by-side STT model comparison. Params: ?models=a,b,c (max 10)&currency=EUR"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/stt/cheapest"
                    description="Cheapest STT model overall or per provider. Params: ?provider=x&currency=EUR"
                  />
                </div>
              </>
            }
            musicContent={
              <>
                <p className={styles.text}>
                  Per-minute pricing for AI music generation APIs. Uses{' '}
                  <code>costPerMinute</code> with additional fields for{' '}
                  <code>outputFormat</code>, <code>vocals</code>, and <code>official</code> (marks unofficial third-party wrappers).
                </p>
                <CodeBlock
                  tabs={[
                    { label: 'curl', code: musicCurlExample },
                    { label: 'JavaScript', code: musicJsExample },
                    { label: 'Python', code: musicPyExample },
                  ]}
                />
                <div className={styles.endpoints}>
                  <Endpoint
                    method="GET"
                    path="/api/v1/music"
                    description="Current pricing for all music models. Params: ?provider=elevenlabs&currency=EUR"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/music/:modelId"
                    description="Single music model pricing. Param: ?currency=EUR"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/music/history"
                    description="Historical music pricing data. Params: ?days=30&modelId=x&provider=y"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/music/providers"
                    description="Music provider list with model counts and cheapest prices."
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/music/compare"
                    description="Side-by-side music model comparison. Params: ?models=a,b,c (max 10)&currency=EUR"
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/music/cheapest"
                    description="Cheapest music model overall or per provider. Params: ?provider=x&currency=EUR"
                  />
                </div>
              </>
            }
          />
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
          <h2 className={styles.heading}>Confidence Scoring</h2>
          <p className={styles.text}>
            Every model includes a Bayesian confidence score (0&ndash;100) that reflects how much you can
            trust the pricing data. The score is computed at query time so it naturally decays as data ages.
          </p>
          <h3 className={styles.subheading}>How it works</h3>
          <p className={styles.text}>
            We use log-odds Bayesian updating: start with a prior based on data source, then update with
            evidence from agent consensus, data age, and price stability.
          </p>
          <p className={styles.formula}>
            <code>P(correct) = sigmoid(log_prior + LLR_agents + LLR_age + LLR_stability)</code>
          </p>
          <div className={styles.table}>
            <div className={styles.tableRow}>
              <span className={styles.tableLabel}>Source prior</span>
              <span className={styles.tableValue}>verified=0.90, admin=0.85, seed=0.55, fetched=0.40, carried=0.25</span>
            </div>
            <div className={styles.tableRow}>
              <span className={styles.tableLabel}>Agent consensus</span>
              <span className={styles.tableValue}>3/3 approve: +1.5 LLR, 1/3: -0.7 LLR</span>
            </div>
            <div className={styles.tableRow}>
              <span className={styles.tableLabel}>Age decay</span>
              <span className={styles.tableValue}>+1.0 at 0 days, 0.0 at 7 days, -1.5 at 14+ days</span>
            </div>
            <div className={styles.tableRow}>
              <span className={styles.tableLabel}>Price stability</span>
              <span className={styles.tableValue}>Unchanged: +0.3, changed: -0.3</span>
            </div>
          </div>
          <h3 className={styles.subheading}>Response fields</h3>
          <div className={styles.table}>
            <div className={styles.tableRow}>
              <span className={styles.tableLabel}><code>confidenceScore</code></span>
              <span className={styles.tableValue}>0&ndash;100 numeric score</span>
            </div>
            <div className={styles.tableRow}>
              <span className={styles.tableLabel}><code>confidenceLevel</code></span>
              <span className={styles.tableValue}>&quot;high&quot; (&ge;80), &quot;medium&quot; (50&ndash;79), &quot;low&quot; (&lt;50)</span>
            </div>
            <div className={styles.tableRow}>
              <span className={styles.tableLabel}><code>freshness.lastVerified</code></span>
              <span className={styles.tableValue}>ISO 8601 timestamp of last verification</span>
            </div>
            <div className={styles.tableRow}>
              <span className={styles.tableLabel}><code>freshness.ageHours</code></span>
              <span className={styles.tableValue}>Hours since last verification</span>
            </div>
            <div className={styles.tableRow}>
              <span className={styles.tableLabel}><code>freshness.stale</code></span>
              <span className={styles.tableValue}>true if data is older than 48 hours</span>
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
  "data": [
    {
      "modelId": "claude-sonnet-4-6",
      "provider": "anthropic",
      "displayName": "Claude Sonnet 4.6",
      "inputPerMTok": 3,
      "outputPerMTok": 15,
      "contextWindow": 200000,
      "confidenceScore": 97,
      "confidenceLevel": "high",
      "freshness": {
        "lastVerified": "2026-03-05T08:00:00Z",
        "ageHours": 4,
        "stale": false
      },
      "launchDate": "2026-02-17",
      ...
    }
  ],
  "meta": {
    "timestamp": "2026-03-05T12:00:00Z",
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
