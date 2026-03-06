import { runAvatarFetch } from '../apps/web/src/lib/fetcher/run-avatar-fetch';

async function main() {
  const result = await runAvatarFetch();
  console.log(`\nSummary: ${result.totalModels} avatar models updated`);
  if (result.errors.length > 0) {
    console.log('Errors:');
    for (const err of result.errors) {
      console.log(`  - ${err}`);
    }
  }
  process.exit(result.errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Avatar fetch failed:', err);
  process.exit(1);
});
