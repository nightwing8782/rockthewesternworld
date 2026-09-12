'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Entry } from '@/types/database';
import Masthead from '@/components/navigation/Masthead';
import { ArrowLeft, Star, BookOpen, Music, Radio, Loader2 } from 'lucide-react';

export default function NotFoundPage() {
  const [post, setPost] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState('');

  useEffect(() => {
    const pathSlug = window.location.pathname.replace(/^\/+|\/+$/g, '');
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
          .eq('slug', pathSlug)
          .eq('status', 'published')
          .maybeSingle();

        if (!error && data) {
          setPost(data as Entry);
        }
      } catch (e) {}
      setLoading(false);
    }

    fetchArticle();
  }, []);

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
    const { title, body_html, metadata, published_at } = post;
    return (
      <article className="min-h-screen bg-[#FAF8F5] text-[#242120] flex flex-col selection:bg-[#1E40AF] selection:text-white">
        <Masthead currentCategory={metadata?.category} activeDesk={metadata?.desk} />

        <div className="w-full max-w-[680px] mx-auto px-4 sm:px-8 py-10 sm:py-14 flex-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-[0.2em] text-[#44403C] hover:text-[#1E40AF] transition-colors mb-8 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Return to Front Page</span>
          </Link>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-display font-bold uppercase tracking-[0.22em] text-[#1E40AF]">
              {metadata?.kicker || metadata?.desk?.toUpperCase() || 'ESSAY & CRITIQUE'}
            </span>
            <span className="text-[#B45309] text-xs">◆</span>
            <span className="text-[13px] font-serif uppercase tracking-wider text-[#44403C] font-semibold">
              {metadata?.category || 'Journal Dispatch'}
            </span>
          </div>

          <h1 className="font-display font-bold text-3xl sm:text-5xl text-[#1C1917] tracking-tight leading-[1.15] mb-4">
            {title}
          </h1>

          <div className="text-xs uppercase tracking-wider text-[#44403C] font-serif pb-4 mb-6 border-b border-[#DDD5C7] flex items-center justify-between">
            <span>
              {published_at
                ? new Date(published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : 'Recent Dispatch'}
            </span>
            <span className="italic">
              {Math.max(1, Math.ceil((body_html?.replace(/<[^>]+>/g, '').split(/\s+/).length || 200) / 220))} min read
            </span>
          </div>

          <div
            className="prose-broadsheet font-reading text-lg sm:text-[19px] leading-[1.8] text-[#242120]"
            dangerouslySetInnerHTML={{ __html: body_html || '' }}
          />

          <div className="mt-16 pt-8 border-t-2 border-[#1C1917] flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-[0.2em] text-[#1E40AF] hover:text-[#1D4ED8] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Index</span>
            </Link>
          </div>
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
            The essay or review you are seeking at <span className="font-mono text-xs bg-[#E5DFC5] px-1.5 py-0.5 text-[#1C1917]">/{slug}</span> has either been moved or has not yet been filed with the editors.
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
