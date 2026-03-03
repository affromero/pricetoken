import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PriceToken — Real-time LLM Pricing API',
    short_name: 'PriceToken',
    description:
      'Free REST API for real-time LLM pricing data. Compare costs across providers.',
    start_url: '/',
    display: 'standalone',
    theme_color: '#0a0a0a',
    background_color: '#0a0a0a',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
