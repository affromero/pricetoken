import { seedFromStatic } from '../apps/web/src/lib/fetcher/store';

async function main() {
  const count = await seedFromStatic();
  if (count === 0) {
    console.log('Database already has pricing data, skipping seed.');
  } else {
    console.log(`Seeded ${count} pricing snapshots.`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
