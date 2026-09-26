import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';
export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Rock The Western World';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#161413',
          backgroundImage: 'radial-gradient(circle at 25px 25px, #262220 2%, transparent 0%), radial-gradient(circle at 75px 75px, #262220 2%, transparent 0%)',
          backgroundSize: '100px 100px',
          color: '#FAF8F5',
          padding: '70px 90px',
          border: '18px solid #2e2825',
          fontFamily: 'serif',
        }}
      >
        {/* Masthead Tag */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontSize: '22px',
              letterSpacing: '5px',
              textTransform: 'uppercase',
              color: '#d97706',
              fontWeight: 800,
            }}
          >
            Cultural Journal & Library
          </span>
          <span style={{ fontSize: '18px', color: '#a8a29e', letterSpacing: '2px', textTransform: 'uppercase' }}>
            RockTheWesternWorld.com
          </span>
        </div>

        {/* Hero Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', margin: 'auto 0' }}>
          <h1
            style={{
              fontSize: '76px',
              fontWeight: 900,
              lineHeight: 1.05,
              color: '#FAF8F5',
              letterSpacing: '-1px',
              margin: 0,
            }}
          >
            ROCK THE WESTERN WORLD
          </h1>
          <p
            style={{
              fontSize: '28px',
              fontStyle: 'italic',
              color: '#d6d3d1',
              margin: 0,
              letterSpacing: '0.5px',
            }}
          >
            “It&apos;s Either Sadness or Euphoria”
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '2px solid #332d29',
            paddingTop: '28px',
          }}
        >
          <span style={{ fontSize: '22px', color: '#e7e5e4', fontWeight: 600 }}>
            By Dan Billings
          </span>
          <span style={{ fontSize: '18px', color: '#78716c', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Essays • The Trophy Room • Comics & Manga
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
