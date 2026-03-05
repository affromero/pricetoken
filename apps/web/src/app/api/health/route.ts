import { NextResponse } from 'next/server';

export async function GET() {
  const checks: Record<string, string> = {
    status: 'ok',
    version: process.env.APP_VERSION ?? '0.0.0',
    timestamp: new Date().toISOString(),
  };

  // Database check
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'connected';
  } catch {
    checks.database = 'disconnected';
  }

  // Redis check
  try {
    const { getRedisClient } = await import('@/lib/redis');
    const redis = getRedisClient();
    await redis.ping();
    checks.redis = 'connected';
  } catch {
    checks.redis = 'disconnected';
  }

  const healthy = checks.database === 'connected';
  return NextResponse.json(checks, { status: healthy ? 200 : 503 });
}
