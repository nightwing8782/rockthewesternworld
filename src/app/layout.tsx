import type { Metadata } from 'next';
import { Cinzel, Source_Serif_4 } from 'next/font/google';
import Script from 'next/script';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
  weight: ['500', '600', '700', '800', '900'],
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap',
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://rockthewesternworld.com'),
  title: "Rock The Western World | It's Either Sadness or Euphoria",
  description: 'An occasional cultural journal, reading log, and essays by Dan Billings.',
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-1SHX13PF3Y';
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const umamiScriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || 'https://cloud.umami.is/script.js';
  const umamiDomains = process.env.NEXT_PUBLIC_UMAMI_DOMAINS || 'rockthewesternworld.com';

  const rootJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Periodical',
    name: 'Rock The Western World',
    alternateName: "It's Either Sadness or Euphoria",
    url: 'https://rockthewesternworld.com',
    description: 'An occasional cultural journal, reading log, and essays by Dan Billings.',
    inLanguage: 'en-US',
    publisher: {
      '@type': 'Organization',
      name: 'Rock The Western World',
      url: 'https://rockthewesternworld.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://rockthewesternworld.com/favicon.svg',
      },
    },
    author: {
      '@type': 'Person',
      name: 'Dan Billings',
      url: 'https://rockthewesternworld.com',
    },
  };

  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${sourceSerif.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-serif bg-[#FAF8F5] text-[#242120] antialiased [text-rendering:optimizeLegibility]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootJsonLd) }}
        />
        {children}
        {umamiWebsiteId ? (
          <Script
            src={umamiScriptUrl}
            data-website-id={umamiWebsiteId}
            data-domains={umamiDomains}
            data-auto-track="true"
            strategy="afterInteractive"
          />
        ) : null}
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
