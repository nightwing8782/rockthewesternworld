import { NextResponse } from 'next/server';
import { createStaticClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';
import { Entry } from '@/types/database';

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export const dynamic = 'force-static';

export async function GET() {
  const baseUrl = 'https://rockthewesternworld.com';
  const allEntries = new Map<string, { title: string; slug: string; date: string; excerpt: string; html?: string }>();

  // 1. Fetch from Supabase
  try {
    const supabase = createStaticClient();
    const { data } = await supabase
      .from('entries')
      .select('title, slug, published_at, body_html, metadata')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (data) {
      data.forEach((item) => {
        if (item.slug && !allEntries.has(item.slug)) {
          allEntries.set(item.slug, {
            title: item.title || 'Untitled',
            slug: item.slug,
            date: item.published_at || new Date().toISOString(),
            excerpt: item.metadata?.excerpt || item.metadata?.deck || '',
            html: item.body_html || '',
          });
        }
      });
    }
  } catch (e) {
    console.warn('[RSS Feed] Supabase query notice:', e);
  }

  // 2. Fetch from WordPress imported JSON archive
  try {
    const archivePath = path.join(process.cwd(), 'public', 'archive', 'imported-entries.json');
    if (fs.existsSync(archivePath)) {
      const entries: Entry[] = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
      entries.forEach((e) => {
        const isPublished = e.status ? e.status === 'published' : true;
        if (e.slug && isPublished && !allEntries.has(e.slug)) {
          allEntries.set(e.slug, {
            title: e.title || 'Untitled',
            slug: e.slug,
            date: e.published_at || new Date().toISOString(),
            excerpt: e.metadata?.excerpt || e.metadata?.deck || '',
            html: e.body_html || '',
          });
        }
      });
    }
  } catch (e) {
    console.warn('[RSS Feed] Archive notice:', e);
  }

  // Sort by published date descending
  const sorted = Array.from(allEntries.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const rssItems = sorted
    .slice(0, 50)
    .map((item) => {
      const url = `${baseUrl}/${item.slug}`;
      const pubDate = new Date(item.date).toUTCString();
      return `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(item.excerpt || item.title)}</description>
    </item>`;
    })
    .join('\n');

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Rock The Western World</title>
    <link>${baseUrl}</link>
    <description>An occasional cultural journal, reading log, and essays by Dan Billings.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
