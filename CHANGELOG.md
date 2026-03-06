# Changelog

## [0.10.0] - 2026-03-06

### Added
- **Text-to-Speech (TTS) pricing module** — 13 models from 7 providers (OpenAI, Google Cloud, Amazon Polly, Azure, ElevenLabs, Deepgram, PlayHT) tracked at cost per million characters
  - `TtsPricingSnapshot` Prisma model, SDK types (`TtsModelPricing`, `TtsCostEstimate`, etc.), static seed data, and cost functions
  - TTS provider registry + LLM extraction pipeline with 3-tier verification
  - `/api/v1/tts/*` routes (all, single, cheapest, compare, history, providers) with `after`/`before` date filtering
  - TTS pricing table, cost calculator, model comparison, and price history pages
  - SDK client methods: `getTtsPricing()`, `getTtsModel()`, `compareTtsModels()`, `getCheapestTtsModel()`, etc.
- **Speech-to-Text (STT) pricing module** — 10 models from 5 providers (OpenAI, Deepgram, AssemblyAI, Google Cloud, Azure) tracked at cost per minute
  - `SttPricingSnapshot` Prisma model, SDK types (`SttModelPricing`, `SttCostEstimate`, etc.), static seed data, and cost functions
  - STT provider registry + LLM extraction pipeline with 3-tier verification
  - `/api/v1/stt/*` routes (all, single, cheapest, compare, history, providers) with `after`/`before` date filtering
  - STT pricing table, cost calculator, model comparison, and price history pages
  - SDK client methods: `getSttPricing()`, `getSttModel()`, `compareSttModels()`, `getCheapestSttModel()`, etc.
- TTS and STT support in both npm and Python SDKs (types, static data, cost functions, client methods, tests)
- Navigation links, docs tab switcher (6 tabs), homepage modality cards, and sitemap entries for TTS and STT
- TTS and STT seed scripts, fetch scripts, and cron endpoints added to sequential runner
- Sanity bounds: TTS $0.50–$500/M chars, STT $0.0005–$1.00/min
- Launch date filter tests for TTS and STT route endpoints

### Fixed
- HeyGen avatar scraper switched to docs.heygen.com reference page
- Launch date fallback to static data for all store layers

## [0.9.0] - 2026-03-06

### Added
- **Avatar AI pricing module** — HeyGen API pricing with 3 models (Standard Avatar, Interactive Avatar IV, Video Translation) tracked at cost-per-minute granularity
  - `AvatarPricingSnapshot` Prisma model, avatar SDK types, static seed data, and cost functions
  - Avatar provider registry + LLM extraction pipeline with 3-tier verification
  - `/api/v1/avatar/*` routes (all, single, cheapest, compare, history, providers)
  - Avatar cost calculator, comparison, price history pages, and non-API provider directory cards
  - SDK client methods: `getAvatarPricing()`, `getAvatarModel()`, `compareAvatarModels()`, etc.
  - Navigation entries, docs, homepage card, and sitemap entries
  - Avatar seed and cron scripts added to sequential runner
- Avatar test coverage for both npm and Python SDKs (cost calculation + client methods)
- Sequential cron runner script for orchestrating text, image, video, and avatar fetch pipelines
- Conference-style 3-tier verification (reviewers, area chair, general chair) for pricing extraction
- `launchDate` extraction from provider pricing pages
- Re-verification for flagged models before giving up
- GPT-5.4 text models and LTX video provider
- Disabled 3D/World modality card with "coming soon" provider section
- Image pricing cron endpoint
- GitHub Release creation on version tags

### Fixed
- `maxDuration` required and verified for all video models
- Provider URLs and extraction prompts updated for reliable extraction
- Model ID constraints added to video and image extraction prompts
- Extraction-layer failures fixed with re-verification and `launchDate` extraction
- Scraper text limit increased to 30k, browser timeout to 90s, AI max tokens to 8192
- Verification consensus and verdict parsing improved
- Image/video carry-forward preserves `launchDate` in snapshots
- Docker deploy: wait for Postgres, retry Prisma migrations on DNS failures, OAuth for Claude CLI
- Providers already verified today skipped on re-run
- Amazon and Mistral providers removed
- Unknown model IDs filtered in image/video pipelines

### Changed
- Verification text bumped to 25k with `Accept-Language` header for consistent extraction
- Health endpoint reads version from `package.json` at build time

## [0.8.0] - 2026-03-05

### Added
- **Bayesian confidence scoring** — every model gets a numeric `confidenceScore` (0–100), a three-tier `confidenceLevel` ("high" | "medium" | "low"), and a `freshness` object with `lastVerified`, `ageHours`, and `stale` fields. Scores are computed at query time using log-odds Bayesian updating with priors based on data source, agent consensus, data age, and price stability. (Suggested by [@maxrodrigo](https://github.com/maxrodrigo))
- `agentApprovals` and `agentTotal` columns on all three snapshot tables — verification metadata is now persisted to the database instead of being discarded after scraping
- `FreshnessIndicator` component — colored dot (green/yellow/red) with relative time ("2h ago", "3d ago") and tooltip showing confidence score, added as a new sortable column in all three pricing tables (Text, Image, Video)
- "Score" step (5th) in the data pipeline explainer on the landing page, explaining the Bayesian methodology
- "Confidence Scoring" section in API docs with formula, prior table, and field descriptions
- Confidence scoring section in README with field reference table
- 15 new tests for confidence scoring library (boundary conditions, signal independence, level mapping, freshness)

### Changed
- `DataConfidence` type expanded from `"high" | "low"` to `"high" | "medium" | "low"`
- `ModelPricing.source`, `ImageModelPricing.source`, `VideoModelPricing.source` unions expanded to include `"carried"` and `"verified"` where missing
- `StatusBadge` component now shows "unverified" badge for both `"medium"` and `"low"` confidence
- Response format updated: `confidence` field now reflects the computed level instead of the raw DB value
- Python SDK types updated with `FreshnessInfo` dataclass, `ConfidenceLevel` type, and expanded `Source`/`DataConfidence` literals
- All static pricing entries (JS + Python) include default `confidenceScore`, `confidenceLevel`, and `freshness` fields

## [0.7.0] - 2026-03-05

### Added
- **Video AI pricing module** — 9 providers (Runway, Sora, Veo, Kling, Luma, Pika, MiniMax, Seedance, FAL) with 17 models tracked at cost-per-minute granularity
  - `VideoPricingSnapshot` Prisma model, video SDK types, static seed data
  - Video provider registry + LLM extraction pipeline with cross-verification
  - `/api/v1/video/*` routes (all, single, cheapest, compare, history, providers)
  - Video cost calculator, comparison, and price history pages
  - SDK client methods: `getVideoPricing()`, `getVideoModel()`, `compareVideoModels()`, etc.
  - Python SDK mirror with `calculate_video_cost()` and all video client methods
- **Image generation pricing module** — 11 providers (OpenAI, Google, Stability, BFL, Amazon, Recraft, Mistral, Bytedance, fal, Ideogram, xAI) with image models tracked at cost-per-image
  - `ImagePricingSnapshot` Prisma model, image SDK types, static seed data
  - Image extraction pipeline with cross-verification, prior-consistency checks, and consensus (new in 0.7.0)
  - `/api/v1/image/*` routes
  - Image pricing table page with inline calculator
  - SDK client methods and Python mirror
- **Unified modality navigation** — sub-nav tabs for Text/Image/Video under each section (Pricing, Calculator, Compare, History)
- **Launch Price vs Date** scatter chart on image and video history pages (text already had it)
- **Sanity bounds** for all three modalities — rejects obviously wrong prices (negative, zero, out of range) before verification
- Mobile responsive overhaul across all pages (hamburger nav, responsive tables, charts)
- Configurable AI extraction providers (Claude Code CLI, Anthropic, OpenAI, Google)
- systemd timer for daily automated pricing fetches
- Admin "Fetch Now" button on fetch-status page
- 80 new tests (268 total across JS, 44 Python)

### Fixed
- Full pricing audit across all modalities using official API documentation:
  - Text: Gemini 2.0 Flash/Flash-Lite marked deprecated, Gemini 3 Pro date corrected, DeepSeek display names updated, Qwen launch dates fixed
  - Video: Veo 3.1 prices corrected ($12→$24/min 1080p, $24→$36/min 4K), Kling 3.0 ($1.74→$5.04/min), all 15 launch dates verified, Sora 2 Pro duration fixed (20→25s)
  - Image: BFL FLUX models rewritten (removed non-existent models, added missing ones, corrected all prices and launch dates)
  - FAL aggregator prices corrected to FAL's actual rates (not upstream provider rates)
- Improved LLM system prompts with explicit credit-to-USD and per-second-to-per-minute conversion examples
- Recharts rendering fixes (NaN props, empty charts, SSR issues)
- Robust JSON extraction from LLM responses with surrounding text

### Changed
- `/api/v1/pricing/*` base routes removed — `/api/v1/text/*` is now canonical (parallel with `/image/*` and `/video/*`)
- Image fetch pipeline upgraded from extract-and-save to full 4-layer verification (extraction → sanity bounds → cross-verify → prior-consistency → consensus)
- Video system prompt expanded with concrete conversion examples to prevent common extraction errors

## [0.6.0] - 2026-03-04

### Added
- Opt-in SDK telemetry for both npm and Python packages — fire-and-forget ping on first API call when `telemetry: true` is set
- `POST /api/v1/telemetry` endpoint with 10/hr rate limit per IP, silent drop on errors
- Admin downloads page (`/admin/downloads`) with npm/PyPI download stats, telemetry pings chart, and SDK breakdown table
- "Used by" section on landing page powered by GitHub Code Search (Redis-cached, seeded adopters)
- `SdkTelemetryPing` Prisma model for telemetry storage
- Gemini 3.1 Flash-Lite and Gemini 3 Pro added to static pricing data
- PyPI monthly downloads badge in README
- Python SDK linting (ruff + mypy) added to root CI pipeline
- 11 new tests across telemetry endpoint, JS SDK, and Python SDK (188 total)

### Changed
- Middleware CORS methods expanded from `GET, OPTIONS` to `GET, POST, OPTIONS`
- Telemetry route exempted from general API rate limiter (uses its own 10/hr limit)

## [0.5.0] - 2026-03-04

### Added
- `launchDate` field across the full stack: SDK types, Prisma schema, static data for all 42 models
- `after` and `before` date query params on `/api/v1/text` and `/api/v1/text/cheapest` endpoints for filtering models by launch date
- Sortable "Launched" column in the PricingTable (formats as "Mon YYYY", nulls sorted last)
- Launch Price Timeline scatter plot on `/history` page showing price trends across providers over time
- `after`/`before` params in both TS and Python SDK clients (`getPricing`, `getCheapest`, `get_pricing`, `get_cheapest`)
- GPT-5.3 Instant and GPT-5.3 Codex to static pricing data
- Legal disclaimer page (`/legal`) and footer link
- 7 new tests for date range filtering and SDK param forwarding (188 total)

### Fixed
- Seed script now backfills `launchDate` on existing DB records (previously only inserted new models)
- 6 launch dates corrected to use API GA dates instead of announcement dates (Grok 3/Mini, Gemini 2.0 Flash-Lite, DeepSeek V3, GPT-5.3 Codex, GPT-5.1)
- Deploy workflow seed step added to populate new models on deploy

## [0.4.1] - 2026-03-04

### Added
- Comprehensive API route handler tests: 67 tests across all 8 public endpoints covering HTTP status codes, CORS headers, Cache-Control, cache behavior, query params, currency conversion, and response shapes
- Curl example with JSON response preview in landing page hero section

### Fixed
- Seed script now inserts missing models instead of skipping when database already has data

## [0.4.0] - 2026-03-04

### Added
- xAI provider (Grok 4, Grok 4.1 Fast, Grok 3, Grok 3 Mini)
- Mistral provider (Mistral Large 3, Mistral Medium 3, Codestral, Mistral Small 3.1)
- OpenAI models: GPT-5.1, o3 Pro, o3 Mini
- Google preview models: Gemini 3.1 Pro Preview, Gemini 3 Flash Preview
- Puppeteer-based scraping for JS-rendered pricing pages (React SPAs)
- Provider brand colors for xAI and Mistral in dark/light themes
- PyPI install option in landing page hero CTA

### Fixed
- Deploy workflow Prisma schema path
- Docker build caching in deploy workflow
- USD currency included in API responses by default

## [0.3.1] - 2026-03-04

### Changed
- Admin authentication: replaced IP allowlist with password + HMAC-signed session cookies
- Admin routes restructured with Next.js route groups — login page has no sidebar

### Added
- `/admin/login` page with password form
- `POST /api/admin/auth` login endpoint with timing-safe password comparison
- `POST /api/admin/auth/logout` endpoint
- Logout button in admin sidebar
- Session cookie auth library (`admin-auth.ts`) using `crypto.subtle` (Edge-compatible)

### Removed
- `ADMIN_ALLOWED_IPS` env var — replaced by `ADMIN_PASSWORD` + `ADMIN_SESSION_SECRET`

## [py-0.3.0] - 2026-03-04

### Added
- Python SDK (`packages/sdk-python/`) — zero-dependency Python package mirroring the JS/TS SDK
- `PriceTokenClient` with all 6 API methods (get_pricing, get_model, get_history, get_providers, compare, get_cheapest)
- `calculate_cost` and `calculate_model_cost` for offline cost calculation
- 21 static pricing entries (Anthropic, OpenAI, Google, DeepSeek)
- Full type coverage with `dataclass(slots=True)` and PEP 561 `py.typed` marker
- `ci-python` job in CI workflow (ruff, mypy strict, pytest)
- `publish-python.yml` workflow for PyPI publishing on `py-v*` tags
- Python quick start section and PyPI badge in root README
- PyPI Package row in comparison table

### Fixed
- ESLint `no-undef` for `process` in `.mjs` files
- `package-lock.json` sync for `@pricetoken/sdk-python` workspace

## [0.3.0] - 2026-03-04

### Added
- Multi-agent verification pipeline: three AI providers (Anthropic, OpenAI, Google) cross-check extracted pricing with 2-of-3 consensus
- Admin panel with IP allowlist: fetch status dashboard, alerts page, cost tracking, and provider config
- Admin icon in navigation bar (visible to allowed IPs only)
- Daily cron trigger for automated pricing fetches
- Paste-text input mode for the cost calculator
- Model lifecycle status detection (active, deprecated) with StatusBadge component
- Missing model detection with admin warnings and fallback URL pipeline
- Custom pill dropdown for currency selector
- Full SEO suite: OpenGraph metadata, security headers, structured data
- Trust system with model status badges and confidence scores
- Auto-deploy on push to main via GitHub Actions

### Fixed
- Static pricing data corrections: removed hallucinated models, fixed context windows and prices
- SDK workspace build order in Docker
- OG metadata and social sharing image
- Price history chart tooltip precision (2 decimal places)

### Changed
- README overhauled with feature comparison table and verification explanation
- DataSources component updated with 4-step pipeline explanation

## [0.2.0] - 2026-03-03

### Added
- Gemini 3.1 Pro Preview to static pricing data ($2.00/$12.00 per MTok)
- "How We Get Our Data" transparency section on landing page with provider links and contribution CTA
- Pricing section subtitle explaining update frequency and units
- Alternatives comparison table in README

### Fixed
- Rate limit text corrected from "100 requests/day" to "30 requests/hour" (landing page + SDK README)
- Missing `.filters` CSS class in PricingTable causing unstyled filter bar
