import { runTtsFetch } from '../apps/web/src/lib/fetcher/run-tts-fetch';

async function main() {
  const result = await runTtsFetch();
  console.log(`\nSummary: ${result.totalModels} TTS models updated`);
  if (result.errors.length > 0) {
    console.log('Errors:');
    for (const err of result.errors) {
      console.log(`  - ${err}`);
    }
  }
  process.exit(result.errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('TTS fetch failed:', err);
  process.exit(1);
});
