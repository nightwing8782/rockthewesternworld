'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Entry } from '@/types/database';
import Masthead from '@/components/navigation/Masthead';
import ArticleHeroImage from '@/components/article/ArticleHeroImage';
import CommentsSection from '@/components/article/CommentsSection';
import {
  ArrowLeft,
  Star,
  Book,
  BookOpen,
  Music,
  Radio,
  ChevronRight,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { sanitizeHtml } from '@/lib/security/sanitize';

export default function NotFoundPage() {
  const [post, setPost] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState('');

  useEffect(() => {
    const rawPath = window.location.pathname.replace(/^\/+|\/+$/g, '');
    const pathSlug = decodeURIComponent(rawPath);
    setSlug(pathSlug);

    if (!pathSlug || pathSlug === '_not-found') {
      setLoading(false);
      return;
    }

    async function fetchArticle() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('entries')
          .select('*')
          .eq('status', 'published')
          .or(`slug.eq."${pathSlug}",id.eq."${pathSlug}"`)
          .maybeSingle();

        if (!error && data) {
          setPost(data as Entry);
        }
      } catch (e) {
        console.warn('Error fetching dynamic article in not-found:', e);
      }
      setLoading(false);
    }

    fetchArticle();
  }, []);

  useEffect(() => {
    if (post?.title) {
      document.title = `${post.title} | Rock The Western World`;
    }
  }, [post]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="text-xs font-display uppercase tracking-[0.25em] text-[#B45309] font-bold animate-pulse flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Searching Archival Indexes...</span>
        </div>
      </div>
    );
  }

  // If article was found in Supabase (live dynamic post before rebuild)
  if (post) {
    const { entry_type, title, body_html, metadata = {}, published_at } = post;
    const heroUrl = metadata.cover_image_url || metadata.coverUrl;
    const isReview = ['book_review', 'comic_review', 'music_review', 'podcast_review'].includes(
      entry_type
    );

    return (
      <article className="min-h-screen bg-[#FAF8F5] text-[#242120] flex flex-col selection:bg-[#1E40AF] selection:text-white">
        <Masthead currentCategory={metadata.category} activeDesk={metadata.desk} />

        <div className="w-full max-w-[680px] mx-auto px-4 sm:px-8 py-10 sm:py-14 flex-1">
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-[0.2em] text-[#44403C] hover:text-[#1E40AF] transition-colors mb-6 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Return to Front Page</span>
          </Link>

          {/* Dynamic Feed Status Note */}
          <div className="mb-6 px-3.5 py-2 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-serif flex items-center justify-between rounded shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Fresh Dispatch:</strong> Live reading stream active from cloud database.
              </span>
            </div>
          </div>

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
              {published_at
                ? new Date(published_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Recent Dispatch'}
            </span>
            <span className="italic">
              {Math.max(
                1,
                Math.ceil((body_html?.replace(/<[^>]+>/g, '').split(/\s+/).length || 200) / 220)
              )}{' '}
              min read
            </span>
          </div>

          {/* Feature Hero Image for Essays / Thoughts */}
          {heroUrl && !isReview && (
            <ArticleHeroImage
              src={heroUrl}
              alt={metadata.credit_title || metadata.imageCaption || title || ''}
              caption={metadata.imageCaption}
              creditTitle={metadata.credit_title}
              creditCreator={metadata.credit_creator}
              creditSource={metadata.credit_source}
              creditSourceUrl={metadata.credit_source_url}
              creditLicense={metadata.credit_license}
              imageCredit={metadata.imageCredit}
            />
          )}

          {/* Structured Cultural Review Header Box */}
          {isReview &&
            (metadata.title || metadata.series || metadata.podcastName || metadata.coverUrl) && (
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
                        {metadata.author ||
                          metadata.artist ||
                          metadata.creator ||
                          (metadata.writer ? `Written by ${metadata.writer}` : '')}
                        {metadata.artist && metadata.writer
                          ? ` • Art by ${metadata.artist}`
                          : ''}
                        {metadata.year ? ` (${metadata.year})` : ''}
                      </p>
                      {metadata.publisher && (
                        <p className="text-xs text-[#66615C] italic mt-0.5">
                          Published by {metadata.publisher}
                        </p>
                      )}
                    </div>
                  </div>

                  {metadata.rating && (
                    <div className="flex flex-col sm:items-end gap-1 shrink-0">
                      <span className="text-[11px] font-display uppercase tracking-wider font-bold text-[#44403C]">
                        CRITICAL VERDICT
                      </span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Number(metadata.rating)
                                ? 'text-[#B45309] fill-[#B45309]'
                                : 'text-[#DDD5C7]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {metadata.pullQuote && (
                  <div className="p-3 bg-[#FAF8F5] border-l-2 border-[#B45309] text-xs italic text-[#3A352F]">
                    "{metadata.pullQuote}"
                  </div>
                )}
              </div>
            )}

          {/* Prose Body */}
          <div
            className="prose-broadsheet"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(body_html) }}
          />

          {/* Concluding Flourish */}
          <div className="mt-12 pt-6 border-t border-[#DDD5C7] text-center">
            <div className="inline-block text-[#B45309] font-display text-sm tracking-[0.3em] uppercase">
              ◆ ◆ ◆
            </div>
          </div>

          {/* Reader Discussion & Comments */}
          <CommentsSection slug={slug} title={title || ''} />
        </div>
      </article>
    );
  }

  // True 404
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#242120] flex flex-col selection:bg-[#1E40AF] selection:text-white">
      <Masthead />

      <main className="max-w-xl mx-auto px-6 py-20 text-center flex-1 flex flex-col items-center justify-center">
        <div className="w-full border-2 border-[#1C1917] p-8 sm:p-12 shadow-[8px_8px_0px_0px_#1C1917]">
          <div className="text-xs font-display font-bold uppercase tracking-[0.25em] text-[#B45309] mb-2">
            BROADSHEET 404
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-[#1C1917] uppercase tracking-tight mb-4">
            Dispatch Not Found
          </h1>
          <p className="font-serif text-[#44403C] text-sm sm:text-base leading-relaxed mb-8">
            The essay or review you are seeking at{' '}
            <span className="font-mono text-xs bg-[#E5DFC5] px-1.5 py-0.5 text-[#1C1917]">
              /{slug}
            </span>{' '}
            has either been moved or has not yet been filed with the editors.
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1C1917] text-[#FAF8F5] text-xs font-display uppercase tracking-widest font-bold hover:bg-[#1E40AF] transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Front Page</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
