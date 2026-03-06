import { describe, it, expect, vi } from 'vitest';
import { fetchPricingPage, fetchPricingPageWithBrowser, stripHtml } from './scraper';

vi.mock('puppeteer-core', () => {
  const mockPage = {
    setUserAgent: vi.fn(),
    setExtraHTTPHeaders: vi.fn(),
    goto: vi.fn(),
    content: vi.fn().mockResolvedValue('<html><body><p>Model pricing $5.00</p></body></html>'),
  };
  const mockBrowser = {
    newPage: vi.fn().mockResolvedValue(mockPage),
    close: vi.fn(),
  };
  return {
    launch: vi.fn().mockResolvedValue(mockBrowser),
  };
});

describe('stripHtml', () => {
  it('removes script and style tags with content', () => {
    const html = '<p>hello</p><script>alert(1)</script><style>.x{}</style><p>world</p>';
    expect(stripHtml(html)).toBe('hello world');
  });

  it('truncates to 30000 characters', () => {
    const html = '<p>' + 'a'.repeat(40_000) + '</p>';
    expect(stripHtml(html).length).toBeLessThanOrEqual(30_000);
  });
});

describe('fetchPricingPage', () => {
  it('rejects non-OK responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 })
    );
    await expect(fetchPricingPage('https://example.com')).rejects.toThrow('HTTP 404');
    vi.unstubAllGlobals();
  });
});

describe('fetchPricingPageWithBrowser', () => {
  it('launches browser, navigates, and returns stripped HTML', async () => {
    const result = await fetchPricingPageWithBrowser('https://example.com/pricing');

    const puppeteer = await import('puppeteer-core');
    expect(puppeteer.launch).toHaveBeenCalledWith(
      expect.objectContaining({ headless: true })
    );
    expect(result).toContain('Model pricing $5.00');
  });

  it('closes browser even if navigation fails', async () => {
    const puppeteer = await import('puppeteer-core');
    const mockPage = {
      setUserAgent: vi.fn(),
      setExtraHTTPHeaders: vi.fn(),
      goto: vi.fn().mockRejectedValue(new Error('timeout')),
      content: vi.fn(),
    };
    const mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn(),
    };
    vi.mocked(puppeteer.launch).mockResolvedValueOnce(mockBrowser as never);

    await expect(fetchPricingPageWithBrowser('https://example.com')).rejects.toThrow('timeout');
    expect(mockBrowser.close).toHaveBeenCalled();
  });
});
