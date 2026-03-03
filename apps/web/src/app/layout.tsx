import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';

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

export const metadata: Metadata = {
  title: 'PriceToken — Real-time LLM Pricing API',
  description:
    'Free REST API for real-time LLM pricing data. Compare costs across OpenAI, Anthropic, Google, and more. Open source, self-hostable.',
  openGraph: {
    title: 'PriceToken — Real-time LLM Pricing API',
    description:
      'Free REST API for real-time LLM pricing data. Compare costs across providers.',
    url: 'https://pricetoken.ai',
    siteName: 'PriceToken',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PriceToken — Real-time LLM Pricing API',
    description: 'Free REST API for real-time LLM pricing data.',
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
      <body>{children}</body>
    </html>
  );
}
