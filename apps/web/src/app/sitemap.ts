import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://pricetoken.ai';
  const buildDate = new Date('2026-03-04');

  return [
    { url: baseUrl, lastModified: buildDate, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/history`, lastModified: buildDate, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/calculator`, lastModified: buildDate, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/compare`, lastModified: buildDate, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/docs`, lastModified: buildDate, changeFrequency: 'monthly', priority: 0.9 },
  ];
}
