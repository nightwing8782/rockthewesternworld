import type { Metadata } from 'next';
import { Cinzel, Source_Serif_4 } from 'next/font/google';
import Script from 'next/script';
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
  title: "Rock The Western World | It's Either Sadness or Euphoria",
  description: 'An occasional cultural journal, reading log, and essays by Dan Sullivan.',
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
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const umamiScriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || 'https://cloud.umami.is/script.js';
  const umamiDomains = process.env.NEXT_PUBLIC_UMAMI_DOMAINS || 'rockthewesternworld.com';

  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${sourceSerif.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-serif bg-[#FAF8F5] text-[#242120] antialiased [text-rendering:optimizeLegibility]">
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
      </body>
    </html>
  );
}
