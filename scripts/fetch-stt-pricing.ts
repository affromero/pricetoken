import { runSttFetch } from '../apps/web/src/lib/fetcher/run-stt-fetch';

async function main() {
  const result = await runSttFetch();
  console.log(`\nSummary: ${result.totalModels} STT models updated`);
  if (result.errors.length > 0) {
    console.log('Errors:');
    for (const err of result.errors) {
      console.log(`  - ${err}`);
    }
  }
  process.exit(result.errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('STT fetch failed:', err);
  process.exit(1);
});
