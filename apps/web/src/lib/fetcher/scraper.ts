const MAX_TEXT_LENGTH = 8_000;

export async function fetchPricingPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'PriceToken/1.0 (https://pricetoken.ai)' },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  }

  const html = await res.text();
  return stripHtml(html);
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
