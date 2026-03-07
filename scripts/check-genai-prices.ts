/**
 * Diagnostic: compare PriceToken static pricing against pydantic/genai-prices.
 *
 * PURPOSE
 * -------
 * pydantic/genai-prices is the most widely-used open-source LLM pricing dataset.
 * This script cross-references it against our STATIC_PRICING to surface
 * discrepancies, identify which source is stale, and provide everything needed
 * to verify the correct price — so we can either fix our data or open a PR
 * upstream. It is diagnostic only and never modifies any files.
 *
 * INTENDED WORKFLOW (Claude Code)
 * --------------------------------
 * 1. Run: npx tsx scripts/check-genai-prices.ts
 * 2. For each discrepancy investigation, Claude should:
 *    a. Fetch the official pricing page URL listed in the output
 *    b. Find the model's current price on that page
 *    c. Determine which dataset (PriceToken or genai-prices) is correct
 *    d. If PriceToken is wrong → update static.ts + static.py
 *    e. If genai-prices is wrong → report findings, ask user before any PR
 * 3. The output is structured for easy parsing: labeled sections, direct
 *    URLs, exact file paths, and explicit verification steps.
 *
 * SCOPE
 * -----
 * - Compares text LLM pricing only (inputPerMTok, outputPerMTok)
 * - Embeddings, TTS, audio, image models are excluded from comparison
 * - genai-prices does not track per-image/video/avatar/TTS/STT pricing,
 *   so those modalities are unique to PriceToken
 * - Context windows are skipped (convention differences: 1Mi vs 1M)
 */

import { STATIC_PRICING } from '../packages/sdk/src/static';
import type { ModelPricing } from '../packages/sdk/src/types';
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

// Official pricing page URLs for each provider (from apps/web/src/lib/fetcher/providers.ts)
const PROVIDER_URLS: Record<string, string> = {
  anthropic: 'https://platform.claude.com/docs/en/docs/about-claude/models',
  openai: 'https://developers.openai.com/api/docs/pricing',
  google: 'https://ai.google.dev/gemini-api/docs/pricing',
  deepseek: 'https://api-docs.deepseek.com/quick_start/pricing',
  xai: 'https://docs.x.ai/docs/models',
  cohere: 'https://cohere.com/pricing',
};

function genaiYamlUrl(provider: string): string {
  return `https://github.com/pydantic/genai-prices/blob/main/prices/providers/${PROVIDER_MAP[provider]}.yml`;
}

function formatPricesChecked(val: string | Date | undefined): string {
  if (!val) return 'unknown';
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return String(val);
}

interface GenAIModel {
  id: string;
  name?: string;
  match?: MatchClause;
  context_window?: number;
  deprecated?: boolean;
  removed?: boolean;
  prices_checked?: string | Date;
  prices: GenAIPrices | GenAIConditionalPrice[];
}

type MatchClause =
  | { equals: string }
  | { starts_with: string }
  | { ends_with: string }
  | { contains: string }
  | { regex: string }
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
  ourModel: ModelPricing;
  genaiModel: GenAIModel;
}

function resolvePrice(val: number | TieredPrice | undefined): number | null {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  return val.base;
}

/** Format a genai-prices model's conditional price tiers for display. */
function formatPriceTiers(model: GenAIModel): string[] {
  if (!Array.isArray(model.prices)) return [];
  const lines: string[] = [];
  for (const entry of model.prices) {
    const input = resolvePrice(entry.prices.input_mtok);
    const output = resolvePrice(entry.prices.output_mtok);
    if (!entry.constraint) {
      lines.push(`      Default:              input=$${input}  output=$${output}`);
    } else {
      const c = entry.constraint as Record<string, unknown>;
      if ('start_time' in c && 'end_time' in c) {
        lines.push(`      UTC ${c.start_time}–${c.end_time}: input=$${input}  output=$${output}`);
      } else if ('start_date' in c) {
        const d = c.start_date instanceof Date ? c.start_date.toISOString().split('T')[0] : c.start_date;
        lines.push(`      From ${d}:          input=$${input}  output=$${output}`);
      }
    }
  }
  return lines;
}

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
 * Check if a genai-prices model is a text LLM (has both input and output
 * per-token pricing). Excludes embedding-only, audio-only, image, and
 * moderation models.
 */
function isTextModel(model: GenAIModel): boolean {
  const prices = Array.isArray(model.prices) ? model.prices[0]?.prices : model.prices;
  if (!prices) return false;
  return prices.input_mtok != null && prices.output_mtok != null;
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

/** Tokenize a model ID into comparable parts (split on -, ., _). */
function tokenize(id: string): Set<string> {
  return new Set(id.toLowerCase().split(/[-._]/));
}

/** Jaccard similarity between two model IDs based on their token overlap. */
function similarity(a: string, b: string): number {
  const tokA = tokenize(a);
  const tokB = tokenize(b);
  let intersection = 0;
  for (const t of tokA) if (tokB.has(t)) intersection++;
  const union = new Set([...tokA, ...tokB]).size;
  return union === 0 ? 0 : intersection / union;
}

/** Find the best near-matches in genai-prices for an unmatched model ID. */
function findNearMatches(
  genaiModels: GenAIModel[],
  modelId: string,
  threshold = 0.4,
  max = 3,
): { id: string; name?: string; score: number }[] {
  return genaiModels
    .map((m) => ({ id: m.id, name: m.name, score: similarity(modelId, m.id) }))
    .filter((m) => m.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, max);
}

/** Check if a model ID matches a genai-prices match clause */
function matchesClause(modelId: string, clause: MatchClause): boolean {
  if ('equals' in clause) return modelId === clause.equals;
  if ('starts_with' in clause) return modelId.startsWith(clause.starts_with);
  if ('ends_with' in clause) return modelId.endsWith(clause.ends_with);
  if ('contains' in clause) return modelId.includes(clause.contains);
  if ('regex' in clause) return new RegExp(clause.regex).test(modelId);
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

/** Check if any of our models match a genai-prices model (reverse lookup). */
function ourModelMatchesGenAI(
  ourModels: ModelPricing[],
  genaiModel: GenAIModel,
  provider: string,
): boolean {
  const ourProviderModels = ourModels.filter((m) => m.provider === provider);

  // 1. Exact ID match
  if (ourProviderModels.some((m) => m.modelId === genaiModel.id)) return true;

  // 2. Normalized ID match (dots ↔ hyphens)
  const genaiNorm = normalize(genaiModel.id);
  if (ourProviderModels.some((m) => normalize(m.modelId) === genaiNorm))
    return true;

  // 3. Match clause — check if any of our model IDs satisfy the genai pattern
  if (genaiModel.match) {
    if (
      ourProviderModels.some((m) => matchesClause(m.modelId, genaiModel.match!))
    )
      return true;
  }

  return false;
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
      // Time-based pricing — flag for investigation
      discrepancies.push({
        modelId: model.modelId,
        provider: model.provider,
        field: 'inputPerMTok',
        ours: model.inputPerMTok,
        theirs: NaN,
        matchType,
        hasConditionalPricing: true,
        ourModel: model,
        genaiModel,
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
        ourModel: model,
        genaiModel,
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
        ourModel: model,
        genaiModel,
      });
    }
  }

  // --- Coverage analysis ---

  // Models we have (in mapped providers) that genai-prices doesn't have
  const matchedModelIds = new Set(matched.map((m) => `${m.provider}/${m.ours}`));
  const ourUnmatched = STATIC_PRICING
    .filter((m) => PROVIDER_MAP[m.provider])
    .filter((m) => !matchedModelIds.has(`${m.provider}/${m.modelId}`));

  // Text models genai-prices has (in mapped providers) that we don't have
  const theirUnmatched: { provider: string; modelId: string; name?: string; deprecated?: boolean }[] = [];
  for (const [provider, data] of providerData) {
    for (const model of data.models) {
      if (model.removed) continue;
      if (!isTextModel(model)) continue;
      if (ourModelMatchesGenAI(STATIC_PRICING, model, provider)) continue;
      theirUnmatched.push({
        provider,
        modelId: model.id,
        name: model.name,
        deprecated: model.deprecated,
      });
    }
  }

  // Provider coverage gaps
  const allOurProviders = [...new Set(STATIC_PRICING.map((m) => m.provider))];
  const ourOnlyProviders = allOurProviders.filter((p) => !PROVIDER_MAP[p]);

  // --- Report ---

  // 1. Provider coverage
  console.log('=== Provider Coverage ===\n');
  console.log(`  Overlapping: ${Object.keys(PROVIDER_MAP).join(', ')}`);
  if (ourOnlyProviders.length > 0) {
    console.log(`  Only in PriceToken: ${ourOnlyProviders.join(', ')} (not tracked by genai-prices)`);
  }
  console.log('');

  // 2. Matched models
  console.log(`=== Matched Models (${matched.length}) ===\n`);
  for (const m of matched) {
    const note = m.ours !== m.theirs ? ` (→ ${m.theirs})` : '';
    console.log(`  ${m.provider}/${m.ours}${note}  [${m.matchType}]`);
  }
  console.log('');

  // 3. Price discrepancy investigations
  // Group discrepancies by model for per-model investigation blocks
  const discrepancyGroups = new Map<string, Discrepancy[]>();
  for (const d of discrepancies) {
    const key = `${d.provider}/${d.modelId}`;
    if (!discrepancyGroups.has(key)) discrepancyGroups.set(key, []);
    discrepancyGroups.get(key)!.push(d);
  }

  if (discrepancyGroups.size === 0) {
    console.log('=== Discrepancy Investigations (0) ===\n');
    console.log('  All matched models are in sync — no investigations needed.\n');
  } else {
    console.log(`=== Discrepancy Investigations (${discrepancyGroups.size} models) ===\n`);

    for (const [key, diffs] of discrepancyGroups) {
      const first = diffs[0];
      const { ourModel, genaiModel, matchType, provider } = first;
      const isTimeBased = first.hasConditionalPricing && isNaN(first.theirs);
      const officialUrl = PROVIDER_URLS[provider] ?? 'unknown';
      const yamlUrl = genaiYamlUrl(provider);

      console.log(`--- ${key} [${matchType} match → ${genaiModel.id}] ---\n`);

      if (isTimeBased) {
        console.log('  TYPE: time-of-day conditional pricing\n');
        console.log('  PriceToken (single price):');
        console.log(`    inputPerMTok:  $${ourModel.inputPerMTok}`);
        console.log(`    outputPerMTok: $${ourModel.outputPerMTok}\n`);
        console.log('  genai-prices (multiple tiers):');
        const tiers = formatPriceTiers(genaiModel);
        for (const line of tiers) console.log(line);
        console.log('');
        console.log('  CAUSE: genai-prices models time-of-day pricing (e.g. off-peak discounts).');
        console.log('         PriceToken stores a single canonical price.');
      } else {
        console.log('  TYPE: price-mismatch\n');
        console.log('  COMPARISON:');
        for (const d of diffs) {
          const delta = `${d.theirs > d.ours ? '+' : ''}${(((d.theirs - d.ours) / d.ours) * 100).toFixed(1)}%`;
          console.log(`    ${d.field.padEnd(16)} PriceToken=$${d.ours}   genai-prices=$${d.theirs}   (${delta})`);
        }
        console.log('');
        console.log('  CAUSE: Straightforward price disagreement. One source has stale data.');
      }

      console.log('\n  FRESHNESS:');
      console.log(`    PriceToken:    source=${ourModel.source}, launchDate=${ourModel.launchDate ?? 'unknown'}`);
      console.log(`    genai-prices:  prices_checked=${formatPricesChecked(genaiModel.prices_checked)}`);

      console.log('\n  TO VERIFY:');
      console.log(`    1. Fetch the official pricing page: ${officialUrl}`);
      console.log(`    2. Find "${genaiModel.name ?? ourModel.displayName}" pricing on that page`);
      console.log(`    3. Compare the official input/output per-million-token prices against both datasets`);

      console.log('\n  IF PRICETOKEN IS WRONG:');
      console.log(`    Update: packages/sdk/src/static.ts (search: "${ourModel.modelId}")`);
      console.log(`    Also:   packages/sdk-python/src/pricetoken/static.py`);

      console.log('\n  IF GENAI-PRICES IS WRONG:');
      console.log(`    Their YAML: ${yamlUrl}`);
      console.log(`    PR target: https://github.com/pydantic/genai-prices (ask before opening)`);

      console.log('');
    }
  }

  // 4. Only in PriceToken (we have, they don't) — with near-match suggestions
  console.log(`=== Only in PriceToken (${ourUnmatched.length} text models) ===\n`);
  if (ourUnmatched.length === 0) {
    console.log('  All PriceToken models (in overlapping providers) exist in genai-prices.\n');
  } else {
    console.log('  These models exist in PriceToken but not in genai-prices:\n');
    const byProvider = new Map<string, typeof ourUnmatched>();
    for (const m of ourUnmatched) {
      if (!byProvider.has(m.provider)) byProvider.set(m.provider, []);
      byProvider.get(m.provider)!.push(m);
    }
    for (const [provider, models] of byProvider) {
      const genaiModels = providerData.get(provider)?.models ?? [];
      for (const m of models) {
        const status = m.status ? ` [${m.status}]` : '';
        console.log(`  ${provider}/${m.modelId}${status}  — ${m.displayName}`);
        const nearMatches = findNearMatches(genaiModels, m.modelId);
        if (nearMatches.length > 0) {
          for (const nm of nearMatches) {
            const pct = (nm.score * 100).toFixed(0);
            const name = nm.name ? ` — ${nm.name}` : '';
            console.log(`    ~ ${nm.id} (${pct}% similar)${name}`);
          }
        }
      }
    }
    console.log('');
  }

  // 5. Only in genai-prices (they have, we don't) — just counts per provider
  const theirActive = theirUnmatched.filter((m) => !m.deprecated);
  const theirDeprecated = theirUnmatched.filter((m) => m.deprecated);
  console.log(`=== Only in genai-prices (${theirUnmatched.length} text models) ===\n`);
  if (theirUnmatched.length === 0) {
    console.log('  All genai-prices text models (in overlapping providers) exist in PriceToken.\n');
  } else {
    console.log('  PriceToken intentionally curates a smaller set of current models.');
    console.log('  genai-prices includes legacy, fine-tuning, and niche model variants.\n');
    const countByProvider = new Map<string, { active: number; deprecated: number }>();
    for (const m of theirUnmatched) {
      if (!countByProvider.has(m.provider)) countByProvider.set(m.provider, { active: 0, deprecated: 0 });
      const c = countByProvider.get(m.provider)!;
      if (m.deprecated) c.deprecated++;
      else c.active++;
    }
    for (const [provider, counts] of countByProvider) {
      const parts = [`${counts.active} active`];
      if (counts.deprecated > 0) parts.push(`${counts.deprecated} deprecated`);
      console.log(`  ${provider}: ${parts.join(', ')}`);
    }
    console.log('');
  }

  // 6. Summary
  console.log('=== Summary ===\n');
  console.log(`  Providers compared:        ${Object.keys(PROVIDER_MAP).length}`);
  console.log(`  Models matched:            ${matched.length}`);
  console.log(`  Investigations needed:     ${discrepancyGroups.size}`);
  console.log(`  Only in PriceToken:        ${ourUnmatched.length}`);
  console.log(`  Only in genai-prices:      ${theirActive.length} active, ${theirDeprecated.length} deprecated`);
  if (ourOnlyProviders.length > 0) {
    console.log(`  PriceToken-only providers: ${ourOnlyProviders.join(', ')}`);
  }

  if (discrepancyGroups.size > 0) {
    console.log('\n  NEXT STEPS: For each investigation above, fetch the official pricing');
    console.log('  page and compare. Report findings — never update files or open PRs');
    console.log('  without explicit user approval.');
  }
}

main().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});
