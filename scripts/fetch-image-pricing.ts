import { runImagePricingFetch } from '../apps/web/src/lib/fetcher/run-image-fetch';

async function main() {
  const result = await runImagePricingFetch();
  console.log(`\nSummary: ${result.totalModels} image models updated`);
  if (result.errors.length > 0) {
    console.log('Errors:');
    for (const err of result.errors) {
      console.log(`  - ${err}`);
    }
  }
  process.exit(result.errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Image fetch failed:', err);
  process.exit(1);
});
