/**
 * Fetches current pricing from the live API and writes it to
 * packages/sdk/src/static.ts. Run before npm publish.
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

const API_URL = process.env.PRICETOKEN_API_URL ?? 'https://pricetoken.ai';

interface ModelPricing {
  modelId: string;
  provider: string;
  displayName: string;
  inputPerMTok: number;
  outputPerMTok: number;
  contextWindow: number | null;
  maxOutputTokens: number | null;
  source: string;
  lastUpdated: string | null;
}

async function main() {
  console.log(`Fetching pricing from ${API_URL}...`);

  const res = await fetch(`${API_URL}/api/v1/pricing`);
  if (!res.ok) {
    throw new Error(`API returned ${res.status}`);
  }

  const json = (await res.json()) as { data: ModelPricing[] };
  const models = json.data;

  console.log(`Got ${models.length} models`);

  const entries = models
    .map((m) => {
      const fields = [
        `    modelId: '${m.modelId}',`,
        `    provider: '${m.provider}',`,
        `    displayName: '${m.displayName}',`,
        `    inputPerMTok: ${m.inputPerMTok},`,
        `    outputPerMTok: ${m.outputPerMTok},`,
        `    contextWindow: ${m.contextWindow ?? 'null'},`,
        `    maxOutputTokens: ${m.maxOutputTokens ?? 'null'},`,
        `    source: 'seed',`,
        `    lastUpdated: null,`,
      ];
      return `  {\n${fields.join('\n')}\n  }`;
    })
    .join(',\n');

  const content = `import type { ModelPricing } from './types';

export const STATIC_PRICING: ModelPricing[] = [
${entries},
];
`;

  const outputPath = join(__dirname, '..', 'packages', 'sdk', 'src', 'static.ts');
  writeFileSync(outputPath, content, 'utf-8');
  console.log(`Wrote ${models.length} models to ${outputPath}`);
}

main().catch((err) => {
  console.error('Failed to update static data:', err);
  process.exit(1);
});
