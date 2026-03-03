import { createHash } from 'crypto';
import { prisma } from './prisma';

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export async function validateApiKey(
  key: string
): Promise<{ valid: boolean; rateLimit: number }> {
  const keyHash = hashApiKey(key);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: { id: true, rateLimit: true, revokedAt: true },
  });

  if (!apiKey || apiKey.revokedAt) {
    return { valid: false, rateLimit: 0 };
  }

  // Update last used timestamp (fire-and-forget)
  prisma.apiKey.update({
    where: { keyHash },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return { valid: true, rateLimit: apiKey.rateLimit };
}
