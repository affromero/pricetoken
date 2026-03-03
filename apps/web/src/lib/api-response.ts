import { NextResponse } from 'next/server';
import type { PriceTokenResponse, PriceTokenError } from 'pricetoken';

export function apiSuccess<T>(data: T, cached = false): NextResponse<PriceTokenResponse<T>> {
  return NextResponse.json(
    {
      data,
      meta: {
        timestamp: new Date().toISOString(),
        cached,
      },
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Cache-Control': 'public, max-age=300',
      },
    }
  );
}

export function apiError(
  error: string,
  status: number,
  headers?: Record<string, string>
): NextResponse<PriceTokenError> {
  return NextResponse.json(
    { error, status },
    {
      status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        ...headers,
      },
    }
  );
}
