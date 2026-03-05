import { runVideoFetch } from '../apps/web/src/lib/fetcher/run-video-fetch';

async function main() {
  const result = await runVideoFetch();
  console.log(`\nSummary: ${result.totalModels} video models updated`);
  if (result.errors.length > 0) {
    console.log('Errors:');
    for (const err of result.errors) {
      console.log(`  - ${err}`);
    }
  }
  process.exit(result.errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Video fetch failed:', err);
  process.exit(1);
});
