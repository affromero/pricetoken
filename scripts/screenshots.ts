/**
 * Capture high-DPI screenshots of all pages for the README.
 * Usage: npx tsx scripts/screenshots.ts
 */

import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE = 'http://localhost:3001';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '..', 'assets');

const PAGES = [
  { name: 'hero', path: '/', waitFor: 'table' },
  { name: 'calculator', path: '/calculator', waitFor: 'input[type="range"]' },
  { name: 'compare', path: '/compare', waitFor: '.root' },
  { name: 'history', path: '/history', waitFor: '.recharts-wrapper' },
  { name: 'docs', path: '/docs', waitFor: 'main' },
];

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // 2x DPI (Retina)
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });

  // Dark mode (the app uses dark theme by default)
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: 'dark' },
  ]);

  for (const { name, path: pagePath, waitFor } of PAGES) {
    console.log(`Capturing ${name}...`);
    await page.goto(`${BASE}${pagePath}`, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for content to render
    try {
      await page.waitForSelector(waitFor, { timeout: 5000 });
    } catch {
      console.log(`  Warning: selector "${waitFor}" not found, capturing anyway`);
    }

    // Small delay for animations to settle
    await new Promise((r) => setTimeout(r, 500));

    const outPath = path.join(OUT, `${name}.png`);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`  Saved: ${outPath}`);
  }

  await browser.close();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
