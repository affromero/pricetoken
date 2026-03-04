import { getCached, setCache } from '@/lib/redis';

export interface Adopter {
  fullName: string;
  htmlUrl: string;
  description: string;
  avatarUrl: string;
  file: string;
}

const KNOWN_ADOPTERS: Adopter[] = [
  {
    fullName: 'nicholasgriffintn/sotto',
    htmlUrl: 'https://github.com/nicholasgriffintn/sotto',
    description: 'Sotto — AI-powered podcast production platform',
    avatarUrl: 'https://github.com/nicholasgriffintn.png?size=40',
    file: 'package.json',
  },
];

const CACHE_KEY = 'adopters:github';
const CACHE_TTL = 21600; // 6 hours
const OWN_REPO = 'affromero/pricetoken';

interface GitHubSearchItem {
  repository: {
    full_name: string;
    html_url: string;
    description: string | null;
    owner: { avatar_url: string };
  };
  path: string;
}

interface GitHubSearchResponse {
  items?: GitHubSearchItem[];
}

async function searchGitHub(query: string, token: string): Promise<GitHubSearchItem[]> {
  const url = `https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=10`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'pricetoken-adopters',
    },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as GitHubSearchResponse;
  return json.items ?? [];
}

function itemToAdopter(item: GitHubSearchItem): Adopter {
  const owner = item.repository.full_name.split('/')[0]!;
  return {
    fullName: item.repository.full_name,
    htmlUrl: item.repository.html_url,
    description: item.repository.description ?? '',
    avatarUrl: `https://github.com/${owner}.png?size=40`,
    file: item.path,
  };
}

export async function getAdopters(): Promise<Adopter[]> {
  const cached = await getCached<Adopter[]>(CACHE_KEY);
  if (cached) return cached;

  const token = process.env.GITHUB_TOKEN;
  if (!token) return KNOWN_ADOPTERS;

  try {
    const queries = [
      'pricetoken filename:package.json',
      'pricetoken filename:requirements.txt',
      'pricetoken filename:pyproject.toml',
    ];

    const results = await Promise.all(queries.map((q) => searchGitHub(q, token)));
    const allItems = results.flat();

    const seen = new Set<string>();
    const adopters: Adopter[] = [];

    // Seed known adopters first
    for (const known of KNOWN_ADOPTERS) {
      seen.add(known.fullName);
      adopters.push(known);
    }

    for (const item of allItems) {
      const name = item.repository.full_name;
      if (seen.has(name) || name === OWN_REPO) continue;
      seen.add(name);
      adopters.push(itemToAdopter(item));
    }

    await setCache(CACHE_KEY, adopters, CACHE_TTL);
    return adopters;
  } catch {
    return KNOWN_ADOPTERS;
  }
}
