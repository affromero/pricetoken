/**
 * One-time Cloudflare DNS setup for pricetoken.ai
 *
 * Usage: doppler run -- npx tsx scripts/setup-dns.ts
 *
 * Required env: CF_DNS_API_TOKEN, CF_ZONE_ID, HETZNER_IP
 */

const CF_API = 'https://api.cloudflare.com/client/v4';

interface DnsRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  proxied: boolean;
}

interface CfListResponse {
  success: boolean;
  result: DnsRecord[];
  errors: { message: string }[];
}

interface CfMutateResponse {
  success: boolean;
  result: DnsRecord;
  errors: { message: string }[];
}

const REQUIRED_ENV = ['CF_DNS_API_TOKEN', 'CF_ZONE_ID', 'HETZNER_IP'] as const;

function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
  return value;
}

async function cfFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getEnv('CF_DNS_API_TOKEN');
  const res = await fetch(`${CF_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  const json = (await res.json()) as T;
  return json;
}

async function getExistingRecords(zoneId: string): Promise<DnsRecord[]> {
  const response = await cfFetch<CfListResponse>(
    `/zones/${zoneId}/dns_records?per_page=100`
  );
  if (!response.success) {
    console.error('Failed to list DNS records:', response.errors);
    process.exit(1);
  }
  return response.result;
}

async function upsertRecord(
  zoneId: string,
  existing: DnsRecord[],
  record: { type: string; name: string; content: string; proxied: boolean }
): Promise<void> {
  const match = existing.find(
    (r) => r.type === record.type && r.name === record.name
  );

  if (match && match.content === record.content && match.proxied === record.proxied) {
    console.log(`  SKIP  ${record.type} ${record.name} → ${record.content} (already exists)`);
    return;
  }

  if (match) {
    const response = await cfFetch<CfMutateResponse>(
      `/zones/${zoneId}/dns_records/${match.id}`,
      {
        method: 'PUT',
        body: JSON.stringify(record),
      }
    );
    if (!response.success) {
      console.error(`  FAIL  update ${record.name}:`, response.errors);
      return;
    }
    console.log(`  UPDATE ${record.type} ${record.name} → ${record.content}`);
  } else {
    const response = await cfFetch<CfMutateResponse>(
      `/zones/${zoneId}/dns_records`,
      {
        method: 'POST',
        body: JSON.stringify(record),
      }
    );
    if (!response.success) {
      console.error(`  FAIL  create ${record.name}:`, response.errors);
      return;
    }
    console.log(`  CREATE ${record.type} ${record.name} → ${record.content}`);
  }
}

async function main() {
  for (const key of REQUIRED_ENV) {
    getEnv(key);
  }

  const zoneId = getEnv('CF_ZONE_ID');
  const ip = getEnv('HETZNER_IP');

  console.log('Fetching existing DNS records...');
  const existing = await getExistingRecords(zoneId);
  console.log(`Found ${existing.length} existing records\n`);

  const records = [
    { type: 'A', name: 'pricetoken.ai', content: ip, proxied: true },
    { type: 'A', name: 'www.pricetoken.ai', content: ip, proxied: true },
    { type: 'CNAME', name: 'api.pricetoken.ai', content: 'pricetoken.ai', proxied: true },
  ];

  console.log('Upserting DNS records:');
  for (const record of records) {
    await upsertRecord(zoneId, existing, record);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('DNS setup failed:', err);
  process.exit(1);
});
