import type { BrowserFetchOptions } from './providers';

const MAX_TEXT_LENGTH = 30_000;
const DEFAULT_BROWSER_WAIT_MS = 5_000;

export async function fetchPricingPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'PriceToken/1.0 (https://pricetoken.ai)',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  }

  const html = await res.text();
  return stripHtml(html);
}

export async function fetchPricingPageWithBrowser(
  url: string,
  options?: BrowserFetchOptions
): Promise<string> {
  const waitMs = options?.waitMs ?? DEFAULT_BROWSER_WAIT_MS;
  const scrollToBottom = options?.scrollToBottom ?? false;
  const waitForSelector = options?.waitForSelector;

  const puppeteer = await import('puppeteer-core');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 90_000 });

    if (waitForSelector) {
      try {
        await page.waitForSelector(waitForSelector, { timeout: 15_000 });
      } catch {
        // Selector didn't appear — continue with whatever rendered
      }
    }

    if (scrollToBottom) {
      await autoScroll(page);
    }

    await new Promise((r) => setTimeout(r, waitMs));
    const html = await page.content();
    return stripHtml(html);
  } finally {
    await browser.close();
  }
}

async function autoScroll(page: { evaluate: (fn: () => Promise<void>) => Promise<void> }): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight || totalHeight > 10_000) {
          clearInterval(timer);
          resolve();
        }
      }, 150);
    });
  });
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TEXT_LENGTH);
}
