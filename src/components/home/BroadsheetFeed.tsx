'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Entry } from '@/types/database';
import DispatchSignup from '@/components/home/DispatchSignup';
import CategoryFilterBanner from '@/components/home/CategoryFilterBanner';
import { Star } from 'lucide-react';

interface BroadsheetFeedProps {
  initialEntries: Entry[];
}

export default function BroadsheetFeed({ initialEntries }: BroadsheetFeedProps) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase
        .from('entries')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            const map = new Map<string, Entry>();
            data.forEach((item) => {
              const s = item.slug || item.id;
              if (s) map.set(s, item as Entry);
            });
            initialEntries.forEach((item) => {
              const s = item.slug || item.id;
              if (s && !map.has(s)) map.set(s, item);
            });

            const merged = Array.from(map.values()).sort((a, b) => {
              const timeA = new Date(a.published_at || a.created_at || '').getTime() || 0;
              const timeB = new Date(b.published_at || b.created_at || '').getTime() || 0;
              return timeB - timeA;
            });

            // Compare top 10 items to prevent unnecessary re-render / visual layout shifts
            const currentTopSlugs = entries.slice(0, 10).map((e) => e.slug || e.id).join(',');
            const newTopSlugs = merged.slice(0, 10).map((e) => e.slug || e.id).join(',');

            if (currentTopSlugs !== newTopSlugs || entries.length !== merged.length) {
              setEntries(merged);
            }
          }
        });
    } catch (e) {}
  }, [initialEntries]);

  const leadFeature = entries[0];

  const commonwealthEntries = entries.filter(
    (e) =>
      e.metadata?.desk === 'commonwealth' ||
      e.metadata?.category === 'Dan Reads the News' ||
      e.metadata?.category === 'Wading into the Potomac'
  );

  const galleryEntries = entries.filter(
    (e) =>
      e.metadata?.desk === 'gallery' ||
      e.entry_type === 'comic_review' ||
      ['Off the Comic Rack', 'Broadway Baby', 'The Multiplex', 'The Happy Medium'].includes(
        e.metadata?.category as string
      )
  );

  const logbookEntries = entries.filter(
    (e) =>
      e.metadata?.desk === 'logbook' ||
      e.entry_type === 'book_review' ||
      e.entry_type === 'music_review' ||
      e.entry_type === 'podcast_review' ||
      [
        'A Literal Corner',
        'A Foray into Fiction',
        'Listen, My Friends',
        'Either Sadness or Euphoria',
      ].includes(e.metadata?.category as string)
  );

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-8 w-full flex-1">
      <Suspense fallback={null}>
        <CategoryFilterBanner />
      </Suspense>

      {/* TOP SECTION: ASYMMETRIC 2/3 LEAD ESSAY + 1/3 DISPATCH SIGNUP */}
      {leadFeature ? (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10 border-b border-[#DDD5C7]">
          {/* Lead 2/3 Column */}
          <article className="lg:col-span-8 flex flex-col justify-between pr-0 lg:pr-6 lg:border-r border-[#DDD5C7]">
            <div>
              {/* Section Kicker */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-display font-bold uppercase tracking-[0.2em] text-[#1E40AF]">
                  {leadFeature.metadata?.kicker || 'LATEST DISPATCH'}
                </span>
                <span className="text-[#B45309] text-xs">◆</span>
                <span className="text-[13px] uppercase tracking-wider text-[#44403C] font-serif font-semibold">
                  {leadFeature.metadata?.category || 'ESSAY'}
                </span>
              </div>

              {/* Headline */}
              <Link href={`/${leadFeature.slug}`} className="group">
                <h2 className="font-display font-bold text-2xl sm:text-4xl lg:text-[42px] text-[#1C1917] leading-[1.15] tracking-tight mb-4 group-hover:text-[#1E40AF] transition-colors">
                  {leadFeature.title}
                </h2>
              </Link>

              {/* Excerpt with Sturdy Broadsheet Dropcap */}
              <div className="text-[#242120] font-reading text-lg sm:text-[19px] leading-[1.75] mb-6">
                <p className="deco-dropcap mb-4">
                  {leadFeature.metadata?.excerpt ||
                    leadFeature.body_html?.replace(/<[^>]+>/g, ' ').substring(0, 300) ||
                    'Deliberate commentary and structured reflection from the archive.'}
                </p>
              </div>
            </div>

            {/* Read Entry CTA Bar */}
            <div className="pt-4 border-t border-[#DDD5C7]/60 flex items-center justify-between text-xs font-serif text-[#66615C]">
              <span>
                {leadFeature.published_at
                  ? new Date(leadFeature.published_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Recent Entry'}
              </span>

              <Link
                href={`/${leadFeature.slug}`}
                className="font-display font-bold uppercase tracking-wider text-[#1E40AF] hover:text-[#1C1917] transition-colors flex items-center gap-1 group"
              >
                <span>Read Entry</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>
          </article>

          {/* Right 1/3 Column: Dispatch Form & In This Edition */}
          <aside className="lg:col-span-4 flex flex-col justify-between gap-6">
            <DispatchSignup />

            {/* In This Edition List */}
            {entries.length > 1 && (
              <div className="bg-[#FAF8F5] p-4 sm:p-5 border border-[#DDD5C7]">
                <div className="flex items-center justify-between text-xs font-display font-bold uppercase tracking-[0.2em] text-[#1C1917] border-b border-[#DDD5C7] pb-2 mb-3">
                  <span>IN THIS EDITION</span>
                  <span className="text-[#B45309]">◆</span>
                </div>

                <div className="space-y-3.5 font-serif">
                  {entries.slice(1, 5).map((item, idx) => (
                    <Link
                      key={item.id || item.slug || `item-${idx}`}
                      href={`/${item.slug}`}
                      className="block group border-b border-[#DDD5C7]/70 pb-3 last:border-0"
                    >
                      <div className="text-xs font-display font-bold uppercase tracking-wider text-[#1E40AF] mb-0.5">
                        {item.metadata?.category || item.entry_type.replace('_', ' ')}
                      </div>
                      <h4 className="font-display font-bold text-sm text-[#1C1917] group-hover:text-[#1E40AF] transition-colors leading-snug">
                        {item.title}
                      </h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </section>
      ) : (
        <div className="py-16 text-center border-b border-[#DDD5C7]">
          <h2 className="font-display font-bold text-2xl text-[#1C1917] mb-2">No Published Entries Yet</h2>
          <p className="text-sm font-serif text-[#44403C] max-w-md mx-auto mb-6">
            Use the Private Studio to draft your first entry.
          </p>
          <Link
            href="/journal"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-stone-100 rounded text-xs font-display font-bold uppercase tracking-wider hover:bg-stone-800 transition-colors"
          >
            Open Drafting Studio
          </Link>
        </div>
      )}

      {/* BOTTOM SECTION: THE THREE-DESK LEDGER */}
      <section className="pt-10">
        <div className="deco-double-border py-2.5 mb-8 flex items-center justify-between">
          <span className="text-xs sm:text-sm font-display font-bold tracking-[0.22em] uppercase text-[#1C1917]">
            THE THREE-DESK LEDGER
          </span>
          <div className="flex items-center gap-2 text-xs text-[#B45309] font-medium">
            <span>◆</span>
            <span className="tracking-wider">CATEGORIZED ESSAYS & REVIEWS</span>
            <span>◆</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-[#DDD5C7]">
          {/* COLUMN 1: THE COMMONWEALTH */}
          <div className="pr-0 md:pr-6">
            <div className="pb-3 border-b-2 border-[#1C1917] mb-5">
              <span className="text-xs font-display tracking-[0.22em] text-[#1E40AF] uppercase font-bold block mb-0.5">
                DESK I
              </span>
              <h3 className="font-display font-bold text-xl text-[#1C1917] uppercase tracking-wider">
                The Commonwealth
              </h3>
              <p className="text-xs italic text-[#44403C] mt-0.5 font-serif font-medium">
                Dan Reads the News • Wading into the Potomac
              </p>
            </div>

            {commonwealthEntries.length > 0 ? (
              <div className="space-y-4">
                {commonwealthEntries.slice(0, 6).map((post, idx) => (
                  <article
                    key={post.id || post.slug || `cw-${idx}`}
                    className="group flex gap-3.5 border-b border-[#DDD5C7]/60 pb-4 last:border-b-0 min-h-[96px]"
                  >
                    {post.metadata?.coverUrl && (
                      <img
                        src={post.metadata.coverUrl}
                        alt=""
                        className="w-16 h-20 object-cover border border-[#DDD5C7] shrink-0 bg-[#F2ECE1]"
                      />
                    )}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-[11px] font-display font-bold tracking-wider text-[#B45309] uppercase mb-1">
                          {post.metadata?.category || 'ANALYSIS'}
                        </div>
                        <Link href={`/${post.slug}`}>
                          <h4 className="font-display font-bold text-sm text-[#1C1917] group-hover:text-[#1E40AF] transition-colors leading-snug mb-1">
                            {post.title}
                          </h4>
                        </Link>
                      </div>
                      <p className="text-[12.5px] font-serif leading-snug text-[#44403C] line-clamp-2">
                        {post.metadata?.excerpt ||
                          post.body_html?.replace(/<[^>]+>/g, ' ').substring(0, 130) ||
                          'Constitutional and statutory analysis examining current institutions and civic friction.'}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-xs italic text-[#78716C] font-serif py-4">
                No dispatches archived under The Commonwealth yet.
              </div>
            )}
          </div>

          {/* COLUMN 2: THE GALLERY */}
          <div className="pt-6 md:pt-0 px-0 md:px-6">
            <div className="pb-3 border-b-2 border-[#1C1917] mb-5">
              <span className="text-xs font-display tracking-[0.22em] text-[#1E40AF] uppercase font-bold block mb-0.5">
                DESK II
              </span>
              <h3 className="font-display font-bold text-xl text-[#1C1917] uppercase tracking-wider">
                The Gallery
              </h3>
              <p className="text-xs italic text-[#44403C] mt-0.5 font-serif font-medium">
                Comics • Broadway • Multiplex • Happy Medium
              </p>
            </div>

            {galleryEntries.length > 0 ? (
              <div className="space-y-4">
                {galleryEntries.slice(0, 6).map((post, idx) => (
                  <article
                    key={post.id || post.slug || `gal-${idx}`}
                    className="group flex gap-3.5 border-b border-[#DDD5C7]/60 pb-4 last:border-b-0 min-h-[96px]"
                  >
                    {post.metadata?.coverUrl && (
                      <img
                        src={post.metadata.coverUrl}
                        alt=""
                        className="w-16 h-20 object-cover border border-[#DDD5C7] shrink-0 bg-[#F2ECE1]"
                      />
                    )}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[11px] font-display font-bold tracking-wider text-[#1E40AF] uppercase">
                            {post.metadata?.category || 'THE ARTS'}
                          </span>
                          {post.metadata?.rating && (
                            <div className="flex items-center">
                              {[...Array(post.metadata.rating)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-[#B45309] text-[#B45309]" />
                              ))}
                            </div>
                          )}
                        </div>

                        <Link href={`/${post.slug}`}>
                          <h4 className="font-display font-bold text-sm text-[#1C1917] group-hover:text-[#1E40AF] transition-colors leading-snug mb-1">
                            {post.title}
                          </h4>
                        </Link>
                      </div>

                      <p className="text-[12.5px] font-serif leading-snug text-[#44403C] line-clamp-2">
                        {post.metadata?.series
                          ? `${post.metadata.series} ${post.metadata.issueNumber || ''}`
                          : post.metadata?.excerpt || post.body_html?.replace(/<[^>]+>/g, ' ').substring(0, 130)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-xs italic text-[#78716C] font-serif py-4">
                No dispatches archived under The Gallery yet.
              </div>
            )}
          </div>

          {/* COLUMN 3: THE LOGBOOK */}
          <div className="pt-6 md:pt-0 pl-0 md:pl-6">
            <div className="pb-3 border-b-2 border-[#1C1917] mb-5">
              <span className="text-xs font-display tracking-[0.22em] text-[#1E40AF] uppercase font-bold block mb-0.5">
                DESK III
              </span>
              <h3 className="font-display font-bold text-xl text-[#1C1917] uppercase tracking-wider">
                The Logbook
              </h3>
              <p className="text-xs italic text-[#44403C] mt-0.5 font-serif font-medium">
                Literal Corner • Fiction • Music • Euphoria
              </p>
            </div>

            {logbookEntries.length > 0 ? (
              <div className="space-y-4">
                {logbookEntries.slice(0, 6).map((post, idx) => (
                  <article
                    key={post.id || post.slug || `log-${idx}`}
                    className="group flex gap-3.5 border-b border-[#DDD5C7]/60 pb-4 last:border-b-0 min-h-[96px]"
                  >
                    {post.metadata?.coverUrl && (
                      <img
                        src={post.metadata.coverUrl}
                        alt=""
                        className="w-16 h-20 object-cover border border-[#DDD5C7] shrink-0 bg-[#F2ECE1]"
                      />
                    )}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[11px] font-display font-bold tracking-wider text-[#B45309] uppercase">
                            {post.metadata?.category || 'RECORDS & BOOKS'}
                          </span>
                          {post.metadata?.rating && (
                            <div className="flex items-center">
                              {[...Array(post.metadata.rating)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-[#B45309] text-[#B45309]" />
                              ))}
                            </div>
                          )}
                        </div>

                        <Link href={`/${post.slug}`}>
                          <h4 className="font-display font-bold text-sm text-[#1C1917] group-hover:text-[#1E40AF] transition-colors leading-snug mb-1">
                            {post.title}
                          </h4>
                        </Link>
                      </div>

                      <p className="text-[12.5px] font-serif leading-snug text-[#44403C] line-clamp-2">
                        {post.metadata?.author || post.metadata?.artist
                          ? `By ${post.metadata.author || post.metadata.artist}`
                          : post.metadata?.excerpt || post.body_html?.replace(/<[^>]+>/g, ' ').substring(0, 130)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-xs italic text-[#78716C] font-serif py-4">
                No dispatches archived under The Logbook yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
