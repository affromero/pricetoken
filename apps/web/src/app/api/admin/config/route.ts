import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getFetcherConfig, updateFetcherConfig } from '@/lib/fetcher-config';
import { EXTRACTION_PROVIDERS } from '@/lib/fetcher/ai-registry';

export async function GET() {
  try {
    const config = await getFetcherConfig();
    return NextResponse.json({ data: config });
  } catch (err) {
    console.error('GET /api/admin/config error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Manual validation
    const update: Record<string, unknown> = {};

    if ('extractionProvider' in body) {
      if (typeof body.extractionProvider !== 'string' || !(body.extractionProvider in EXTRACTION_PROVIDERS)) {
        return NextResponse.json(
          { error: `Invalid provider. Must be one of: ${Object.keys(EXTRACTION_PROVIDERS).join(', ')}` },
          { status: 400 }
        );
      }
      update.extractionProvider = body.extractionProvider;
    }

    if ('extractionModel' in body) {
      if (typeof body.extractionModel !== 'string') {
        return NextResponse.json({ error: 'extractionModel must be a string' }, { status: 400 });
      }
      update.extractionModel = body.extractionModel;
    }

    if ('maxTextLength' in body) {
      if (typeof body.maxTextLength !== 'number' || body.maxTextLength < 1000 || body.maxTextLength > 100000) {
        return NextResponse.json({ error: 'maxTextLength must be a number between 1000 and 100000' }, { status: 400 });
      }
      update.maxTextLength = body.maxTextLength;
    }

    if ('enabled' in body) {
      if (typeof body.enabled !== 'boolean') {
        return NextResponse.json({ error: 'enabled must be a boolean' }, { status: 400 });
      }
      update.enabled = body.enabled;
    }

    if ('verificationAgents' in body) {
      if (!Array.isArray(body.verificationAgents)) {
        return NextResponse.json({ error: 'verificationAgents must be an array' }, { status: 400 });
      }
      for (const agent of body.verificationAgents) {
        if (
          typeof agent !== 'object' ||
          agent === null ||
          typeof agent.provider !== 'string' ||
          typeof agent.model !== 'string'
        ) {
          return NextResponse.json(
            { error: 'Each verification agent must have provider and model strings' },
            { status: 400 }
          );
        }
        if (!(agent.provider in EXTRACTION_PROVIDERS)) {
          return NextResponse.json(
            { error: `Invalid verification agent provider: ${agent.provider}` },
            { status: 400 }
          );
        }
      }
      update.verificationAgents = body.verificationAgents;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const config = await updateFetcherConfig(update);
    return NextResponse.json({ data: config });
  } catch (err) {
    console.error('PATCH /api/admin/config error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
