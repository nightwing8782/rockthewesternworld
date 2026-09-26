import { ImageResponse } from 'next/og';
import { createStaticClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';
import { Entry } from '@/types/database';

export const dynamic = 'force-static';
export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Rock The Western World';

export async function generateStaticParams() {
  const slugs = new Set<string>();

  // 1. Fetch only published entries from Supabase
  try {
    const supabase = createStaticClient();
    const { data } = await supabase
      .from('entries')
      .select('slug')
      .eq('status', 'published');
    if (data) {
      data.forEach((item) => {
        if (item.slug) slugs.add(item.slug);
      });
    }
  } catch (e) {}

  // 2. Load from WordPress imported JSON archive
  const archivePath = path.join(process.cwd(), 'public', 'archive', 'imported-entries.json');
  if (fs.existsSync(archivePath)) {
    try {
      const entries: Entry[] = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
      entries.forEach((e) => {
        const isPublished = e.status ? e.status === 'published' : true;
        if (e.slug && isPublished) {
          slugs.add(e.slug);
        }
      });
    } catch (e) {}
  }

  return Array.from(slugs).map((slug) => ({ slug }));
}

async function getPost(slug: string): Promise<Entry | null> {
  // 1. Check Supabase
  try {
    const supabase = createStaticClient();
    const { data } = await supabase
      .from('entries')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (data) return data as Entry;
  } catch (e) {}

  // 2. Check local archive
  try {
    const archivePath = path.join(process.cwd(), 'public', 'archive', 'imported-entries.json');
    if (fs.existsSync(archivePath)) {
      const entries: Entry[] = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
      const match = entries.find((e) => e.slug === slug);
      if (match) return match;
    }
  } catch (e) {}

  return null;
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  const title = post?.title || 'Rock The Western World';
  const rawDate = post?.published_at ? new Date(post.published_at) : new Date();
  const formattedDate = rawDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const excerpt = post?.metadata?.excerpt || post?.metadata?.deck || '';

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
          padding: '60px 80px',
          border: '16px solid #2e2825',
          fontFamily: 'serif',
        }}
      >
        {/* Header Tag */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '14px',
                height: '14px',
                backgroundColor: '#d97706',
                borderRadius: '50%',
              }}
            />
            <span
              style={{
                fontSize: '20px',
                letterSpacing: '4px',
                textTransform: 'uppercase',
                color: '#d97706',
                fontWeight: 700,
              }}
            >
              Rock The Western World
            </span>
          </div>
          <span style={{ fontSize: '18px', color: '#a8a29e', letterSpacing: '2px', textTransform: 'uppercase' }}>
            {formattedDate}
          </span>
        </div>

        {/* Center Title & Excerpt */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', margin: 'auto 0' }}>
          <h1
            style={{
              fontSize: title.length > 50 ? '48px' : '62px',
              fontWeight: 800,
              lineHeight: 1.15,
              color: '#FAF8F5',
              letterSpacing: '-0.5px',
              margin: 0,
            }}
          >
            {title}
          </h1>

          {excerpt ? (
            <p
              style={{
                fontSize: '24px',
                color: '#d6d3d1',
                lineHeight: 1.4,
                margin: 0,
                maxHeight: '68px',
                overflow: 'hidden',
              }}
            >
              {excerpt}
            </p>
          ) : null}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '2px solid #332d29',
            paddingTop: '24px',
          }}
        >
          <span style={{ fontSize: '20px', color: '#e7e5e4', fontWeight: 600, letterSpacing: '1px' }}>
            By Dan Billings
          </span>
          <span style={{ fontSize: '18px', color: '#78716c', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Cultural Journal • Trophy Room
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
