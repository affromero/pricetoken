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
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0a0a0a',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              fontWeight: 700,
              color: '#0a0a0a',
            }}
          >
            $
          </div>
          <span
            style={{
              fontSize: '56px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-1px',
            }}
          >
            PriceToken
          </span>
        </div>
        <p
          style={{
            fontSize: '28px',
            color: '#a1a1aa',
            margin: '0',
            maxWidth: '700px',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          Real-time LLM pricing API.
          <br />
          Compare costs across providers.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '32px',
            marginTop: '48px',
            fontSize: '18px',
            color: '#22c55e',
          }}
        >
          <span>Free REST API</span>
          <span style={{ color: '#3f3f46' }}>|</span>
          <span>npm package</span>
          <span style={{ color: '#3f3f46' }}>|</span>
          <span>Open Source</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
