import { describe, it, expect } from 'vitest';
import { stripHtml } from './scraper';

describe('stripHtml', () => {
  it('removes script tags and content', () => {
    const html = '<p>hello</p><script>alert("xss")</script><p>world</p>';
    expect(stripHtml(html)).toBe('hello world');
  });

  it('removes style tags and content', () => {
    const html = '<style>.foo { color: red; }</style><div>content</div>';
    expect(stripHtml(html)).toBe('content');
  });

  it('removes all HTML tags', () => {
    const html = '<div class="foo"><span>text</span></div>';
    expect(stripHtml(html)).toBe('text');
  });

  it('collapses whitespace', () => {
    const html = '<p>hello</p>   \n\n   <p>world</p>';
    expect(stripHtml(html)).toBe('hello world');
  });

  it('truncates to 8000 characters', () => {
    const html = 'x'.repeat(10_000);
    expect(stripHtml(html).length).toBe(8_000);
  });

  it('handles empty input', () => {
    expect(stripHtml('')).toBe('');
  });
});
