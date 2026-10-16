import type { NextConfig } from "next";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cloud.umami.is https://www.googletagmanager.com https://www.google-analytics.com https://giscus.app https://cusdis.com https://unpkg.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://giscus.app;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: blob: https:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.r2.cloudflarestorage.com https://*.r2.dev https://cloud.umami.is https://www.google-analytics.com https://region1.google-analytics.com https://api.wikimedia.org https://en.wikipedia.org https://openlibrary.org https://api.allorigins.win https://giscus.app https://cusdis.com;
  frame-src 'self' https://giscus.app https://cusdis.com https://cloud.umami.is https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.npr.org https://open.spotify.com https://bandcamp.com;
  media-src 'self' blob: data: https://*.r2.cloudflarestorage.com https://*.r2.dev;
  worker-src 'self' blob: https://unpkg.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy-Report-Only',
            value: cspHeader,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
