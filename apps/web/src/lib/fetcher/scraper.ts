const MAX_TEXT_LENGTH = 30_000;

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

export async function fetchPricingPageWithBrowser(url: string): Promise<string> {
  const puppeteer = await import('puppeteer-core');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent('PriceToken/1.0 (https://pricetoken.ai)');
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 90_000 });
    await new Promise((r) => setTimeout(r, 2_000));
    const html = await page.content();
    return stripHtml(html);
  } finally {
    await browser.close();
  }
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
