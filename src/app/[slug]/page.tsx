export async function generateStaticParams() {
  const slugs = new Set<string>();

  // 1. Fetch only published entries from Supabase
  try {
    const supabase = await createClient();
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
        if (e.slug && (e.status === 'published' || !e.status)) slugs.add(e.slug);
      });
    } catch (e) {}
  }

  return Array.from(slugs).map((slug) => ({ slug }));
}

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Entry } from '@/types/database';
import Masthead from '@/components/navigation/Masthead';
import Link from 'next/link';
import { ArrowLeft, Star, Book, BookOpen, Music, Radio, ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string): Promise<Entry | null> {
  // 1. Check Supabase strictly for published status
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (!error && data) return data as Entry;
  } catch (err) {}

  // 2. Check local WordPress imported archive
  try {
    const archivePath = path.join(process.cwd(), 'public', 'archive', 'imported-entries.json');
    if (fs.existsSync(archivePath)) {
      const entries: Entry[] = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
      const match = entries.find((e) => e.slug === slug);
      if (match && match.status !== 'private') return match;
    }
  } catch (e) {}

  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: 'Dispatch Not Found | Rock The Western World' };
  }

  return {
    title: `${post.title || 'Untitled Entry'} | Rock The Western World`,
    description: post.metadata?.excerpt || post.metadata?.deck || 'A cultural essay from Rock The Western World.',
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  const { entry_type, title, body_html, metadata, published_at, updated_at } = post;

  let jsonLd: Record<string, any> = {};
  const siteUrl = 'https://rockthewesternworld.com';
  const postUrl = `${siteUrl}/${slug}`;
  const authorObj = {
    '@type': 'Person',
    name: 'Dan Billings',
    url: siteUrl,
  };

  switch (entry_type) {
    case 'comic_review':
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Review',
        itemReviewed: {
          '@type': 'Book',
          name: metadata.series || title,
          author: metadata.writer ? { '@type': 'Person', name: metadata.writer } : undefined,
          illustrator: metadata.artist ? { '@type': 'Person', name: metadata.artist } : undefined,
          publisher: metadata.publisher ? { '@type': 'Organization', name: metadata.publisher } : undefined,
          image: metadata.coverUrl || undefined,
        },
        reviewRating: metadata.rating ? { '@type': 'Rating', ratingValue: metadata.rating, bestRating: '5' } : undefined,
        author: authorObj,
        headline: title,
        datePublished: published_at || updated_at,
        url: postUrl,
      };
      break;

    case 'book_review':
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Review',
        itemReviewed: {
          '@type': 'Book',
          name: metadata.title || title,
          author: metadata.author ? { '@type': 'Person', name: metadata.author } : undefined,
          isbn: metadata.isbn || undefined,
          publisher: metadata.publisher ? { '@type': 'Organization', name: metadata.publisher } : undefined,
          image: metadata.coverUrl || undefined,
        },
        reviewRating: metadata.rating ? { '@type': 'Rating', ratingValue: metadata.rating, bestRating: '5' } : undefined,
        author: authorObj,
        headline: title,
        datePublished: published_at || updated_at,
        url: postUrl,
      };
      break;

    case 'music_review':
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Review',
        itemReviewed: {
          '@type': 'MusicAlbum',
          name: metadata.title || title,
          byArtist: metadata.artist ? { '@type': 'MusicGroup', name: metadata.artist } : undefined,
          recordLabel: metadata.label || undefined,
          image: metadata.coverUrl || undefined,
        },
        reviewRating: metadata.rating ? { '@type': 'Rating', ratingValue: metadata.rating, bestRating: '5' } : undefined,
        author: authorObj,
        headline: title,
        datePublished: published_at || updated_at,
        url: postUrl,
      };
      break;

    case 'podcast_review':
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Review',
        itemReviewed: {
          '@type': 'PodcastSeries',
          name: metadata.podcastName || metadata.title || title,
          author: metadata.creator ? { '@type': 'Person', name: metadata.creator } : undefined,
          image: metadata.artworkUrl || metadata.coverUrl || undefined,
        },
        reviewRating: metadata.rating ? { '@type': 'Rating', ratingValue: metadata.rating, bestRating: '5' } : undefined,
        author: authorObj,
        headline: title,
        datePublished: published_at || updated_at,
        url: postUrl,
      };
      break;

    default:
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        author: authorObj,
        datePublished: published_at || updated_at,
        mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
      };
      break;
  }

  const isReview = ['book_review', 'comic_review', 'music_review', 'podcast_review'].includes(entry_type);

  return (
    <article className="min-h-screen bg-[#FAF8F5] text-[#242120] flex flex-col selection:bg-[#1E40AF] selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Masthead currentCategory={metadata.category} activeDesk={metadata.desk} />

      {/* Reading Canvas Hard-Capped to max-w-[680px] */}
      <div className="w-full max-w-[680px] mx-auto px-4 sm:px-8 py-10 sm:py-14 flex-1">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-[0.2em] text-[#44403C] hover:text-[#1E40AF] transition-colors mb-8 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Return to Front Page</span>
        </Link>

        {/* Section Kicker */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-display font-bold uppercase tracking-[0.22em] text-[#1E40AF]">
            {metadata.kicker || metadata.desk?.toUpperCase() || 'ESSAY & CRITIQUE'}
          </span>
          <span className="text-[#B45309] text-xs">◆</span>
          <span className="text-[13px] font-serif uppercase tracking-wider text-[#44403C] font-semibold">
            {metadata.category || 'Journal Dispatch'}
          </span>
        </div>

        {/* Article Headline */}
        <h1 className="font-display font-bold text-3xl sm:text-5xl text-[#1C1917] tracking-tight leading-[1.15] mb-4">
          {title}
        </h1>

        {/* Reading Time & Publication Note */}
        <div className="text-xs uppercase tracking-wider text-[#44403C] font-serif pb-4 mb-6 border-b border-[#DDD5C7] flex items-center justify-between">
          <span>
            {published_at ? new Date(published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Archived Dispatch'}
          </span>
          <span className="italic">
            {Math.max(1, Math.ceil((body_html?.replace(/<[^>]+>/g, '').split(/\s+/).length || 200) / 220))} min read
          </span>
        </div>

        {/* Feature Hero Image for Essays / Thoughts */}
        {metadata.coverUrl && !isReview && (
          <figure className="my-8">
            <img
              src={metadata.coverUrl}
              alt={metadata.imageCaption || title || ''}
              className="w-full max-h-[460px] object-cover border border-[#DDD5C7] shadow-xs"
            />
            {(metadata.imageCaption || metadata.imageCredit) && (
              <figcaption className="mt-2 text-[12px] italic text-[#44403C] font-serif text-center">
                {metadata.imageCaption} {metadata.imageCredit ? `— ${metadata.imageCredit}` : ''}
              </figcaption>
            )}
          </figure>
        )}

        {/* Structured Cultural Review Header Box */}
        {isReview && (metadata.title || metadata.series || metadata.podcastName || metadata.coverUrl) && (
          <div className="my-8 p-5 bg-[#F2ECE1] border border-[#DDD5C7] rounded shadow-xs space-y-4 font-serif">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                {metadata.coverUrl || metadata.artworkUrl ? (
                  <img
                    src={metadata.coverUrl || metadata.artworkUrl}
                    alt=""
                    className="w-16 h-22 object-cover border border-[#DDD5C7] shrink-0 shadow-2xs"
                  />
                ) : (
                  <div className="w-16 h-16 bg-[#FAF8F5] border border-[#DDD5C7] flex items-center justify-center text-[#44403C] shrink-0">
                    {entry_type === 'book_review' && <Book className="w-6 h-6" />}
                    {entry_type === 'comic_review' && <BookOpen className="w-6 h-6" />}
                    {entry_type === 'music_review' && <Music className="w-6 h-6" />}
                    {entry_type === 'podcast_review' && <Radio className="w-6 h-6" />}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-display font-bold uppercase tracking-wider text-[#B45309] mb-0.5">
                    {metadata.category || entry_type.replace('_', ' ')}
                  </div>
                  <h3 className="font-display font-bold text-[#1C1917] text-base leading-snug">
                    {metadata.title || metadata.series || metadata.podcastName}
                    {metadata.issueNumber ? ` (${metadata.issueNumber})` : ''}
                  </h3>
                  <p className="text-[13px] text-[#44403C] mt-0.5">
                    {metadata.author || metadata.artist || metadata.creator || (metadata.writer ? `Written by ${metadata.writer}` : '')}
                    {metadata.artist && metadata.writer ? ` • Art by ${metadata.artist}` : ''}
                    {metadata.year ? ` (${metadata.year})` : ''}
                  </p>
                  {metadata.publisher && (
                    <p className="text-xs text-[#66615C] italic mt-0.5">
                      Published by {metadata.publisher}
                    </p>
                  )}
                  {metadata.accessibility && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded text-[10px] font-display uppercase tracking-wider font-semibold text-[#44403C]">
                      {metadata.accessibility}
                    </span>
                  )}
                </div>
              </div>

              {/* Overall Critical Verdict */}
              {metadata.rating && (
                <div className="flex flex-col sm:items-end gap-1 shrink-0">
                  <span className="text-[11px] font-display uppercase tracking-wider font-bold text-[#44403C]">
                    CRITICAL VERDICT
                  </span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-4 h-4 ${
                          (metadata.rating ?? 0) > idx ? 'fill-[#B45309] text-[#B45309]' : 'text-stone-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Craft Sub-Ratings Breakdown */}
            {(metadata.storyRating || metadata.artRating || metadata.proseRating || metadata.narrativeRating || metadata.songwritingRating || metadata.productionRating || metadata.researchRating || metadata.audioCraftRating) && (
              <div className="pt-3 border-t border-[#DDD5C7] grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {metadata.storyRating ? (
                  <div>
                    <span className="font-display uppercase text-[10px] text-[#66615C] tracking-wider block">Story & Script</span>
                    <span className="font-bold text-[#B45309]">{metadata.storyRating} / 5 Stars</span>
                  </div>
                ) : null}
                {metadata.artRating ? (
                  <div>
                    <span className="font-display uppercase text-[10px] text-[#66615C] tracking-wider block">Art & Paneling</span>
                    <span className="font-bold text-[#B45309]">{metadata.artRating} / 5 Stars</span>
                  </div>
                ) : null}
                {metadata.proseRating ? (
                  <div>
                    <span className="font-display uppercase text-[10px] text-[#66615C] tracking-wider block">Prose & Voice</span>
                    <span className="font-bold text-[#B45309]">{metadata.proseRating} / 5 Stars</span>
                  </div>
                ) : null}
                {metadata.narrativeRating ? (
                  <div>
                    <span className="font-display uppercase text-[10px] text-[#66615C] tracking-wider block">Narrative & Pacing</span>
                    <span className="font-bold text-[#B45309]">{metadata.narrativeRating} / 5 Stars</span>
                  </div>
                ) : null}
                {metadata.songwritingRating ? (
                  <div>
                    <span className="font-display uppercase text-[10px] text-[#66615C] tracking-wider block">Songwriting</span>
                    <span className="font-bold text-[#B45309]">{metadata.songwritingRating} / 5 Stars</span>
                  </div>
                ) : null}
                {metadata.productionRating ? (
                  <div>
                    <span className="font-display uppercase text-[10px] text-[#66615C] tracking-wider block">Production & Sound</span>
                    <span className="font-bold text-[#B45309]">{metadata.productionRating} / 5 Stars</span>
                  </div>
                ) : null}
                {metadata.researchRating ? (
                  <div>
                    <span className="font-display uppercase text-[10px] text-[#66615C] tracking-wider block">Research & Content</span>
                    <span className="font-bold text-[#B45309]">{metadata.researchRating} / 5 Stars</span>
                  </div>
                ) : null}
                {metadata.audioCraftRating ? (
                  <div>
                    <span className="font-display uppercase text-[10px] text-[#66615C] tracking-wider block">Audio Craft & Pacing</span>
                    <span className="font-bold text-[#B45309]">{metadata.audioCraftRating} / 5 Stars</span>
                  </div>
                ) : null}
              </div>
            )}

            {/* Standout Pull-Quote (if present) */}
            {metadata.pullQuote && (
              <div className="p-3 bg-[#FAF8F5] border-l-2 border-[#B45309] text-xs italic text-[#3A352F]">
                "{metadata.pullQuote}"
              </div>
            )}

            {/* Previous Review Link */}
            {metadata.prevReviewLink && (
              <div className="pt-2">
                <Link
                  href={metadata.prevReviewLink}
                  className="inline-flex items-center gap-1 text-[11px] font-display font-bold uppercase tracking-wider text-[#1E40AF] hover:underline"
                >
                  <span>Previous Issue Review</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Prose Body */}
        <div
          className="prose-broadsheet"
          dangerouslySetInnerHTML={{ __html: body_html || '' }}
        />

        {/* Concluding Flourish */}
        <div className="mt-12 pt-6 border-t border-[#DDD5C7] text-center">
          <div className="inline-block text-[#B45309] font-display text-sm tracking-[0.3em] uppercase">
            ◆ ◆ ◆
          </div>
        </div>
      </div>
    </article>
  );
}
