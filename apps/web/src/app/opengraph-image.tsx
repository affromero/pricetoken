import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const runtime = 'edge';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 80px',
          backgroundColor: '#0a0a0a',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 700,
              color: '#0a0a0a',
            }}
          >
            $
          </div>
          <span style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff' }}>
            PriceToken
          </span>
        </div>

        {/* Middle: Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h1
            style={{
              fontSize: '52px',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.15,
              margin: 0,
              letterSpacing: '-1px',
            }}
          >
            The missing API for
            <br />
            <span style={{ color: '#22c55e' }}>LLM pricing data</span>
          </h1>
          <p
            style={{
              fontSize: '24px',
              color: '#a1a1aa',
              margin: 0,
              lineHeight: 1.4,
              maxWidth: '700px',
            }}
          >
            Real-time pricing across a growing list of providers.
            Free REST API + npm package. Open source.
          </p>
        </div>

        {/* Bottom: CTA + URL */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '20px',
              fontFamily: 'monospace',
              color: '#22c55e',
            }}
          >
            npm install pricetoken
          </div>
          <span style={{ fontSize: '20px', color: '#52525b' }}>
            pricetoken.ai
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
