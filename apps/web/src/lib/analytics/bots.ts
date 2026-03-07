export type BotCategory = 'crawler' | 'scraper' | 'malicious';

export interface BotClassification {
  isBot: boolean;
  category: BotCategory | null;
  name: string | null;
}

interface BotSignature {
  token: string;
  category: BotCategory;
  name: string;
}

const BOT_SIGNATURES: BotSignature[] = [
  // Search engine crawlers
  { token: 'googlebot', category: 'crawler', name: 'Googlebot' },
  { token: 'bingbot', category: 'crawler', name: 'Bingbot' },
  { token: 'yandexbot', category: 'crawler', name: 'YandexBot' },
  { token: 'baiduspider', category: 'crawler', name: 'Baiduspider' },
  { token: 'duckduckbot', category: 'crawler', name: 'DuckDuckBot' },
  { token: 'slurp', category: 'crawler', name: 'Yahoo Slurp' },
  { token: 'sogou', category: 'crawler', name: 'Sogou' },
  { token: 'exabot', category: 'crawler', name: 'Exabot' },

  // AI scrapers
  { token: 'gptbot', category: 'scraper', name: 'GPTBot' },
  { token: 'claudebot', category: 'scraper', name: 'ClaudeBot' },
  { token: 'anthropic-ai', category: 'scraper', name: 'Anthropic' },
  { token: 'ccbot', category: 'scraper', name: 'CCBot' },
  { token: 'google-extended', category: 'scraper', name: 'Google-Extended' },
  { token: 'bytespider', category: 'scraper', name: 'ByteSpider' },
  { token: 'amazonbot', category: 'scraper', name: 'Amazonbot' },
  { token: 'perplexitybot', category: 'scraper', name: 'PerplexityBot' },
  { token: 'cohere-ai', category: 'scraper', name: 'Cohere' },
  { token: 'diffbot', category: 'scraper', name: 'Diffbot' },
  { token: 'applebot', category: 'scraper', name: 'Applebot' },

  // Social/preview bots
  { token: 'facebookexternalhit', category: 'crawler', name: 'Facebook' },
  { token: 'twitterbot', category: 'crawler', name: 'TwitterBot' },
  { token: 'linkedinbot', category: 'crawler', name: 'LinkedInBot' },
  { token: 'slackbot', category: 'crawler', name: 'Slackbot' },
  { token: 'telegrambot', category: 'crawler', name: 'TelegramBot' },
  { token: 'whatsapp', category: 'crawler', name: 'WhatsApp' },
  { token: 'discordbot', category: 'crawler', name: 'DiscordBot' },

  // Generic bot/spider indicators
  { token: 'bot/', category: 'malicious', name: 'Generic Bot' },
  { token: 'spider/', category: 'malicious', name: 'Generic Spider' },
  { token: 'crawler/', category: 'malicious', name: 'Generic Crawler' },
  { token: 'scrapy', category: 'malicious', name: 'Scrapy' },
  { token: 'python-requests', category: 'malicious', name: 'Python Requests' },
  { token: 'python-urllib', category: 'malicious', name: 'Python urllib' },
  { token: 'go-http-client', category: 'malicious', name: 'Go HTTP Client' },
  { token: 'curl/', category: 'malicious', name: 'curl' },
  { token: 'wget/', category: 'malicious', name: 'wget' },
  { token: 'libwww-perl', category: 'malicious', name: 'libwww-perl' },
  { token: 'php/', category: 'malicious', name: 'PHP Client' },
  { token: 'java/', category: 'malicious', name: 'Java Client' },
  { token: 'httpclient', category: 'malicious', name: 'HTTPClient' },
  { token: 'headlesschrome', category: 'malicious', name: 'Headless Chrome' },
  { token: 'phantomjs', category: 'malicious', name: 'PhantomJS' },
  { token: 'semrushbot', category: 'crawler', name: 'SemrushBot' },
  { token: 'ahrefsbot', category: 'crawler', name: 'AhrefsBot' },
  { token: 'mj12bot', category: 'crawler', name: 'Majestic' },
  { token: 'dotbot', category: 'crawler', name: 'DotBot' },
  { token: 'petalbot', category: 'crawler', name: 'PetalBot' },

  // AI scrapers (additional)
  { token: 'meta-externalagent', category: 'scraper', name: 'Meta External Agent' },
  { token: 'meta-externalfetcher', category: 'scraper', name: 'Meta External Fetcher' },
  { token: 'facebookbot', category: 'scraper', name: 'FacebookBot' },
  { token: 'oai-searchbot', category: 'scraper', name: 'OAI SearchBot' },
  { token: 'chatgpt-user', category: 'scraper', name: 'ChatGPT-User' },
  { token: 'iaskspider', category: 'scraper', name: 'iAsk Spider' },
  { token: 'youbot', category: 'scraper', name: 'YouBot' },
  { token: 'ai2bot', category: 'scraper', name: 'AI2Bot' },
  { token: 'omgili', category: 'scraper', name: 'Omgili' },
  { token: 'friendlycrawler', category: 'scraper', name: 'FriendlyCrawler' },
  { token: 'timpibot', category: 'scraper', name: 'TimpiBot' },
  { token: 'velenpublicwebcrawler', category: 'scraper', name: 'Velen Public Web Crawler' },
  { token: 'webz.io', category: 'scraper', name: 'Webz.io' },
  { token: 'img2dataset', category: 'scraper', name: 'img2dataset' },

  // Monitoring
  { token: 'uptimerobot', category: 'crawler', name: 'UptimeRobot' },
  { token: 'pingdom', category: 'crawler', name: 'Pingdom' },
  { token: 'site24x7', category: 'crawler', name: 'Site24x7' },

  // Generic HTTP clients
  { token: 'axios/', category: 'malicious', name: 'Axios' },
  { token: 'node-fetch', category: 'malicious', name: 'node-fetch' },
  { token: 'undici', category: 'malicious', name: 'Undici' },
];

const NOT_A_BOT: BotClassification = { isBot: false, category: null, name: null };

export function classifyBot(userAgent: string): BotClassification {
  if (!userAgent) return { isBot: true, category: 'malicious', name: 'Empty UA' };

  const ua = userAgent.toLowerCase();

  for (const sig of BOT_SIGNATURES) {
    if (ua.includes(sig.token)) {
      return { isBot: true, category: sig.category, name: sig.name };
    }
  }

  return NOT_A_BOT;
}

const BROWSER_HEADERS = ['accept-language', 'accept', 'sec-fetch-dest', 'sec-fetch-mode'] as const;

export function classifyByHeaders(headers: { get(name: string): string | null }): number {
  let missing = 0;
  for (const h of BROWSER_HEADERS) {
    if (!headers.get(h)) missing++;
  }
  return missing >= 2 ? 2 : 0;
}

const MALICIOUS_PATHS = [
  '/xmlrpc.php',
  '/wp-admin',
  '/wp-login.php',
  '/wp-content',
  '/wp-includes',
  '/wp-json',
  '/.env',
  '/.git',
  '/.htaccess',
  '/.htpasswd',
  '/phpmyadmin',
  '/pma',
  '/myadmin',
  '/admin.php',
  '/administrator',
  '/config.php',
  '/install.php',
  '/setup.php',
  '/shell.php',
  '/cmd.php',
  '/eval-stdin.php',
  '/vendor/phpunit',
  '/solr/',
  '/actuator',
  '/debug/',
  '/telescope/',
  '/elfinder',
  '/cgi-bin/',
  '/passwd',
  '/etc/passwd',
  '/proc/self',
];

export function isMaliciousPath(path: string): boolean {
  const lower = path.toLowerCase();
  return MALICIOUS_PATHS.some((p) => lower.startsWith(p));
}
