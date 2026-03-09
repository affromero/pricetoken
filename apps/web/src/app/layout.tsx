import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';
import { ClientBeacon } from '@/components/ClientBeacon/ClientBeacon';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://pricetoken.ai'),
  title: {
    default: 'PriceToken — Real-time LLM Pricing API',
    template: '%s | PriceToken',
  },
  description:
    'Free REST API for real-time LLM pricing data. Compare costs across OpenAI, Anthropic, Google, and more. Open source, self-hostable.',
  keywords: [
    'llm pricing',
    'ai pricing api',
    'llm cost calculator',
    'token cost',
    'openai pricing',
    'anthropic pricing',
    'google ai pricing',
    'gpt-4 price',
    'claude price',
    'gemini price',
    'llm comparison',
    'ai model costs',
    'pricetoken',
  ],
  openGraph: {
    title: 'PriceToken — Real-time LLM Pricing API & Cost Calculator',
    description:
      'Free REST API for real-time LLM pricing. Compare costs across OpenAI, Anthropic, Google, and more. Open-source npm package with offline cost calculator.',
    url: 'https://pricetoken.ai',
    siteName: 'PriceToken',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PriceToken — Real-time LLM Pricing API & Cost Calculator',
    description:
      'Free REST API for real-time LLM pricing. Compare costs across OpenAI, Anthropic, Google, and more. Open-source npm package with offline cost calculator.',
    site: '@afromero',
    creator: '@afromero',
  },
  alternates: {
    canonical: 'https://pricetoken.ai',
  },
};

const themeScript = `
(function() {
  var theme = localStorage.getItem('pt-theme');
  if (!theme) {
    theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'PriceToken',
              url: 'https://pricetoken.ai',
              description:
                'Free REST API for real-time LLM pricing data. Compare costs across providers.',
            }),
          }}
        />
        <ClientBeacon />
        {children}
      </body>
    </html>
  );
}
