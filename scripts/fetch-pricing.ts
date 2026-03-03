import { runPricingFetch } from '../apps/web/src/lib/fetcher/run-fetch';

async function main() {
  const result = await runPricingFetch();
  console.log(`\nSummary: ${result.totalModels} models updated`);
  if (result.errors.length > 0) {
    console.log('Errors:');
    for (const err of result.errors) {
      console.log(`  - ${err}`);
    }
  }
  process.exit(result.errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fetch failed:', err);
  process.exit(1);
});
