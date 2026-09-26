import { MetadataRoute } from 'next';
import { createStaticClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';
import { Entry } from '@/types/database';

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://rockthewesternworld.com';
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/journal`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/trophy-room`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  const postSlugs = new Map<string, Date>();

  // 1. Fetch published entries from Supabase
  try {
    const supabase = createStaticClient();
    const { data } = await supabase
      .from('entries')
      .select('slug, published_at, updated_at')
      .eq('status', 'published');

    if (data) {
      data.forEach((item) => {
        if (item.slug) {
          const rawDate = item.updated_at || item.published_at;
          const date = rawDate ? new Date(rawDate) : new Date();
          postSlugs.set(item.slug, date);
        }
      });
    }
  } catch (e) {
    console.warn('[Sitemap] Supabase fetch notice:', e);
  }

  // 2. Load from WordPress imported JSON archive
  try {
    const archivePath = path.join(process.cwd(), 'public', 'archive', 'imported-entries.json');
    if (fs.existsSync(archivePath)) {
      const entries: Entry[] = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
      entries.forEach((e) => {
        const isPublished = e.status ? e.status === 'published' : true;
        if (e.slug && isPublished && !postSlugs.has(e.slug)) {
          const rawDate = e.updated_at || e.published_at;
          const date = rawDate ? new Date(rawDate) : new Date();
          postSlugs.set(e.slug, date);
        }
      });
    }
  } catch (e) {
    console.warn('[Sitemap] Archive fetch notice:', e);
  }

  // Add all post pages to sitemap
  postSlugs.forEach((lastModified, slug) => {
    routes.push({
      url: `${baseUrl}/${slug}`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  });

  return routes;
}
