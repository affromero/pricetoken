/**
 * Compare PriceToken's static pricing against pydantic/genai-prices.
 *
 * Fetches provider YAML files from GitHub, parses them, and reports
 * discrepancies for models that exist in both datasets.
 * Only compares pricing fields (inputPerMTok, outputPerMTok) — context
 * windows are skipped because conventions differ (1Mi vs 1M, default vs beta).
 *
 * Usage: npx tsx scripts/check-genai-prices.ts
 */

import { STATIC_PRICING } from '../packages/sdk/src/static';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const yaml = require('js-yaml');

// Provider mapping: our provider id → genai-prices filename
const PROVIDER_MAP: Record<string, string> = {
  anthropic: 'anthropic',
  openai: 'openai',
  google: 'google',
  deepseek: 'deepseek',
  xai: 'x_ai',
  cohere: 'cohere',
};

interface GenAIModel {
  id: string;
  name?: string;
  match?: MatchClause;
  context_window?: number;
  deprecated?: boolean;
  removed?: boolean;
  prices: GenAIPrices | GenAIConditionalPrice[];
}

type MatchClause =
  | { equals: string }
  | { starts_with: string }
  | { contains: string }
  | { or: MatchClause[] }
  | { and: MatchClause[] };

interface GenAIPrices {
  input_mtok?: number | TieredPrice;
  output_mtok?: number | TieredPrice;
}

interface TieredPrice {
  base: number;
  tiers: { start: number; price: number }[];
}

interface GenAIConditionalPrice {
  constraint?: unknown;
  prices: GenAIPrices;
}

interface ProviderData {
  id: string;
  name: string;
  models: GenAIModel[];
}

interface Discrepancy {
  modelId: string;
  provider: string;
  field: string;
  ours: number;
  theirs: number;
  matchType: string;
  hasConditionalPricing: boolean;
}

function resolvePrice(val: number | TieredPrice | undefined): number | null {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  return val.base;
}

/**
 * Check if a model uses time-of-day conditional pricing (e.g. DeepSeek off-peak).
 * Date-based price changes (start_date) are NOT considered "conditional" —
 * they represent permanent price updates.
 */
/**
 * Check if a model uses time-of-day conditional pricing (e.g. DeepSeek off-peak).
 * Date-based price changes (start_date) are NOT considered "conditional" —
 * they represent permanent price updates.
 */
function hasTimeBasedPricing(model: GenAIModel): boolean {
  if (!Array.isArray(model.prices)) return false;
  return model.prices.some((p) => {
    if (!p.constraint) return false;
    const c = p.constraint as Record<string, unknown>;
    return 'start_time' in c;
  });
}

/**
 * Resolve a model's prices, handling conditional pricing:
 * - For start_date constraints: pick the latest price whose date has passed.
 * - For time-of-day constraints: return null (requires manual verification).
 */
function resolveModelPrices(model: GenAIModel): GenAIPrices | null {
  if (!Array.isArray(model.prices)) return model.prices;

  if (hasTimeBasedPricing(model)) return null;

  // Date-based: find the latest entry whose start_date is in the past
  const now = new Date();
  let best = model.prices[0].prices;
  for (const entry of model.prices) {
    if (!entry.constraint) {
      best = entry.prices;
      continue;
    }
    const c = entry.constraint as Record<string, unknown>;
    if ('start_date' in c) {
      // js-yaml auto-converts dates to Date objects
      const startDate = c.start_date instanceof Date ? c.start_date : new Date(String(c.start_date));
      if (startDate <= now) {
        best = entry.prices;
      }
    }
  }
  return best;
}

/** Normalize model IDs for comparison: dots→hyphens, lowercase */
function normalize(id: string): string {
  return id.toLowerCase().replace(/\./g, '-');
}

/** Check if a model ID matches a genai-prices match clause */
function matchesClause(modelId: string, clause: MatchClause): boolean {
  if ('equals' in clause) return modelId === clause.equals;
  if ('starts_with' in clause) return modelId.startsWith(clause.starts_with);
  if ('contains' in clause) return modelId.includes(clause.contains);
  if ('or' in clause) return clause.or.some((c) => matchesClause(modelId, c));
  if ('and' in clause) return clause.and.every((c) => matchesClause(modelId, c));
  return false;
}

async function fetchProviderYaml(filename: string): Promise<ProviderData> {
  const url = `https://raw.githubusercontent.com/pydantic/genai-prices/main/prices/providers/${filename}.yml`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${filename}.yml: ${res.status}`);
  const text = await res.text();
  return yaml.load(text) as ProviderData;
}

function findGenAIModel(
  models: GenAIModel[],
  ourModelId: string,
): { model: GenAIModel; matchType: string } | undefined {
  // 1. Exact ID match
  const exact = models.find((m) => m.id === ourModelId);
  if (exact) return { model: exact, matchType: 'exact' };

  // 2. Normalized ID match (dots ↔ hyphens)
  const ourNorm = normalize(ourModelId);
  const normalized = models.find((m) => normalize(m.id) === ourNorm);
  if (normalized) return { model: normalized, matchType: 'normalized' };

  // 3. Match clause evaluation — use the genai-prices match patterns
  const clauseMatch = models.find(
    (m) => m.match && matchesClause(ourModelId, m.match),
  );
  if (clauseMatch) return { model: clauseMatch, matchType: 'clause' };

  return undefined;
}

async function main() {
  const providers = Object.keys(PROVIDER_MAP);
  const providerData = new Map<string, ProviderData>();

  console.log('Fetching genai-prices data...\n');
  const results = await Promise.allSettled(
    providers.map(async (p) => {
      const data = await fetchProviderYaml(PROVIDER_MAP[p]);
      providerData.set(p, data);
    }),
  );

  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'rejected') {
      console.error(
        `Failed to fetch ${providers[i]}: ${(results[i] as PromiseRejectedResult).reason}`,
      );
    }
  }

  const discrepancies: Discrepancy[] = [];
  const matched: { ours: string; theirs: string; matchType: string; provider: string }[] = [];

  for (const model of STATIC_PRICING) {
    const data = providerData.get(model.provider);
    if (!data) continue;

    const result = findGenAIModel(data.models, model.modelId);
    if (!result) continue;

    const { model: genaiModel, matchType } = result;
    if (genaiModel.removed) continue;

    matched.push({
      ours: model.modelId,
      theirs: genaiModel.id,
      matchType,
      provider: model.provider,
    });

    const timeBased = hasTimeBasedPricing(genaiModel);
    const prices = resolveModelPrices(genaiModel);

    if (!prices) {
      // Time-based pricing — flag for manual review
      discrepancies.push({
        modelId: model.modelId,
        provider: model.provider,
        field: 'inputPerMTok',
        ours: model.inputPerMTok,
        theirs: NaN,
        matchType,
        hasConditionalPricing: true,
      });
      continue;
    }

    const genaiInput = resolvePrice(prices.input_mtok);
    const genaiOutput = resolvePrice(prices.output_mtok);

    if (genaiInput != null && genaiInput !== model.inputPerMTok) {
      discrepancies.push({
        modelId: model.modelId,
        provider: model.provider,
        field: 'inputPerMTok',
        ours: model.inputPerMTok,
        theirs: genaiInput,
        matchType,
        hasConditionalPricing: timeBased,
      });
    }

    if (genaiOutput != null && genaiOutput !== model.outputPerMTok) {
      discrepancies.push({
        modelId: model.modelId,
        provider: model.provider,
        field: 'outputPerMTok',
        ours: model.outputPerMTok,
        theirs: genaiOutput,
        matchType,
        hasConditionalPricing: timeBased,
      });
    }
  }

  // Report matched models
  console.log(`Matched ${matched.length} models across both datasets:\n`);
  for (const m of matched) {
    const note = m.ours !== m.theirs ? ` (→ ${m.theirs})` : '';
    console.log(`  ${m.provider}/${m.ours}${note}  [${m.matchType}]`);
  }

  console.log('');

  if (discrepancies.length === 0) {
    console.log('No price discrepancies found. All matched models are in sync.');
    return;
  }

  console.log(`Found ${discrepancies.length} price discrepancies:\n`);

  // Table
  console.log(
    '| Provider | Model | Field | Ours | genai-prices | Delta | Match | Note |',
  );
  console.log(
    '|----------|-------|-------|------|-------------|-------|-------|------|',
  );

  for (const d of discrepancies) {
    if (isNaN(d.theirs)) {
      console.log(
        `| ${d.provider} | ${d.modelId} | * | ${d.ours} | (time-based) | — | ${d.matchType} | variable pricing |`,
      );
      continue;
    }
    const delta = `${d.theirs > d.ours ? '+' : ''}${(((d.theirs - d.ours) / d.ours) * 100).toFixed(1)}%`;
    const note = d.hasConditionalPricing ? 'conditional pricing' : '';
    console.log(
      `| ${d.provider} | ${d.modelId} | ${d.field} | ${d.ours} | ${d.theirs} | ${delta} | ${d.matchType} | ${note} |`,
    );
  }

  // Proposed changes (only for non-conditional pricing)
  const actionable = discrepancies.filter((d) => !d.hasConditionalPricing);
  if (actionable.length > 0) {
    console.log('\n--- Proposed changes to packages/sdk/src/static.ts ---\n');
    const grouped = new Map<string, Discrepancy[]>();
    for (const d of actionable) {
      const key = `${d.provider}/${d.modelId}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(d);
    }
    for (const [key, diffs] of grouped) {
      console.log(`// ${key}`);
      for (const d of diffs) {
        console.log(`//   ${d.field}: ${d.ours} → ${d.theirs}`);
      }
    }
  }

  if (discrepancies.some((d) => d.hasConditionalPricing)) {
    console.log('\n--- Models with conditional pricing (verify manually) ---\n');
    const conditional = discrepancies.filter((d) => d.hasConditionalPricing);
    const seen = new Set<string>();
    for (const d of conditional) {
      const key = `${d.provider}/${d.modelId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      console.log(`// ${key} — has time-of-day or date-based pricing in genai-prices`);
    }
  }
}

main().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});
