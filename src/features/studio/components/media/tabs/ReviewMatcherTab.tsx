'use client';

import { useState, useRef } from 'react';
import { EntryMetadata } from '@/types/database';
import { lookupBooks, lookupComics, lookupMusic, lookupPodcasts } from '@/lib/lookups';
import { saveToEditorialMedia, linkEntryMedia } from '@/lib/media/libraryService';
import {
  Search,
  BookOpen,
  Music,
  Radio,
  Film,
  Sparkles,
  CheckCircle2,
  Bookmark,
  Loader2,
  ExternalLink,
  Layers,
} from 'lucide-react';

interface ReviewMatcherTabProps {
  metadata: EntryMetadata;
  entryId?: string;
  onMetadataChange: (newMeta: Partial<EntryMetadata>) => void;
  onNotify?: (msg: string) => void;
}

type MediumType = 'all' | 'books' | 'comics' | 'music' | 'film' | 'podcasts';

interface MatchItem {
  id: string;
  medium: 'Book / Manga' | 'Comic' | 'Album' | 'Film / TV' | 'Podcast';
  title: string;
  creator: string;
  year?: string | number;
  publisher?: string;
  coverUrl: string;
  details?: Record<string, any>;
}

// Television & Film search via TVMaze (Free, CORS-compliant, high-resolution)
async function lookupFilm(query: string): Promise<MatchItem[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query.trim())}`, {
      signal: AbortSignal.timeout(4500),
    });
    if (res.ok) {
      const data = await res.json();
      return (data || []).slice(0, 8).map((item: any) => {
        const show = item.show || {};
        const cover = show.image?.original || show.image?.medium || '';
        return {
          id: `tv-${show.id || Math.random()}`,
          medium: 'Film / TV' as const,
          title: show.name || 'Untitled Production',
          creator: show.network?.name || show.webChannel?.name || 'Studio Production',
          year: show.premiered ? show.premiered.substring(0, 4) : undefined,
          publisher: show.genres?.join(', ') || 'Feature',
          coverUrl: cover,
          details: {
            summary: show.summary ? show.summary.replace(/<[^>]+>/g, '') : '',
            rating: show.rating?.average,
          },
        };
      }).filter((m: MatchItem) => Boolean(m.coverUrl));
    }
  } catch (err) {
    console.warn('Film/TV lookup warning:', err);
  }
  return [];
}

export default function ReviewMatcherTab({
  metadata,
  entryId,
  onMetadataChange,
  onNotify,
}: ReviewMatcherTabProps) {
  const [query, setQuery] = useState('');
  const [medium, setMedium] = useState<MediumType>('all');
  const [results, setResults] = useState<MatchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savingMediaId, setSavingMediaId] = useState<string | null>(null);
  const [savedSuccessMap, setSavedSuccessMap] = useState<Record<string, boolean>>({});
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = (q: string, targetMedium: MediumType = medium) => {
    setQuery(q);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!q.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const aggregated: MatchItem[] = [];

        // Parallel lookups depending on targetMedium
        const promises: Promise<any>[] = [];

        if (targetMedium === 'all' || targetMedium === 'books') {
          promises.push(
            lookupBooks(q).then((books) =>
              books.slice(0, 6).map((b) => ({
                id: `b-${b.openLibraryKey || Math.random()}`,
                medium: 'Book / Manga' as const,
                title: b.title,
                creator: b.author,
                year: b.year,
                publisher: b.publisher,
                coverUrl: b.cover_image_url || b.coverUrl,
                details: { isbn: b.isbn, pageCount: b.page_count },
              }))
            )
          );
        }

        if (targetMedium === 'all' || targetMedium === 'comics') {
          promises.push(
            lookupComics(q).then((comics) =>
              comics.slice(0, 6).map((c) => ({
                id: `c-${c.id || Math.random()}`,
                medium: 'Comic' as const,
                title: c.series || c.title,
                creator: c.writer || c.artist || 'Creator',
                year: c.year,
                publisher: c.publisher,
                coverUrl: c.cover_image_url || c.coverUrl,
                details: { writer: c.writer, artist: c.artist, issueCount: c.issue_count },
              }))
            )
          );
        }

        if (targetMedium === 'all' || targetMedium === 'music') {
          promises.push(
            lookupMusic(q).then((albums) =>
              albums.slice(0, 6).map((a: any) => ({
                id: `m-${a.id || Math.random()}`,
                medium: 'Album' as const,
                title: a.title,
                creator: a.artist,
                year: a.year,
                publisher: a.label,
                coverUrl: a.coverUrl,
                details: { genre: a.genre, trackCount: a.trackCount },
              }))
            )
          );
        }

        if (targetMedium === 'all' || targetMedium === 'film') {
          promises.push(lookupFilm(q));
        }

        if (targetMedium === 'all' || targetMedium === 'podcasts') {
          promises.push(
            lookupPodcasts(q).then((pods) =>
              pods.slice(0, 6).map((p: any) => ({
                id: `p-${p.id || Math.random()}`,
                medium: 'Podcast' as const,
                title: p.podcastName,
                creator: p.creator,
                publisher: p.network,
                coverUrl: p.artworkUrl,
                details: { feedUrl: p.feedUrl, primaryGenre: p.primaryGenre },
              }))
            )
          );
        }

        const resolvedArrays = await Promise.all(promises);
        resolvedArrays.forEach((arr) => {
          if (Array.isArray(arr)) {
            aggregated.push(...arr.filter((item) => Boolean(item.coverUrl)));
          }
        });

        setResults(aggregated);
      } catch (err) {
        console.warn('Search aggregated error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleMediumChange = (newMedium: MediumType) => {
    setMedium(newMedium);
    if (query.trim()) {
      handleSearch(query, newMedium);
    }
  };

  // 1. Attach Cover to current article
  const handleAttachCover = (item: MatchItem) => {
    onMetadataChange({
      coverUrl: item.coverUrl,
      cover_image_url: item.coverUrl,
      cover_type: 'artwork',
      credit_title: item.title,
      credit_creator: item.creator,
      credit_source: `${item.medium} Database / Fair Use Citation`,
      credit_license: 'Promotional / Editorial Fair Use',
      imageCredit: `${item.title} (${item.year || 'Archive'}) by ${item.creator}`,
      imageCaption: `${item.title} — ${item.creator}`,
    });

    if (onNotify) {
      onNotify(`Attached "${item.title}" cover artwork.`);
    }
  };

  // 2. Save into permanent Editorial Media Library
  const handleSaveToLibrary = async (item: MatchItem) => {
    try {
      setSavingMediaId(item.id);

      const saved = await saveToEditorialMedia({
        title: `${item.title} (${item.medium} Cover)`,
        description: `Official cover artwork for ${item.title} by ${item.creator}`,
        imageUrl: item.coverUrl,
        thumbnailUrl: item.coverUrl,
        storagePath: `review-covers/${item.medium.toLowerCase().replace(/[^a-z0-9]/g, '-')}/${encodeURIComponent(item.title).slice(0, 40)}.jpg`,
        sourceType: 'review_cover',
        creator: item.creator,
        source: `${item.medium} Registry`,
        sourceUrl: item.coverUrl,
        license: 'Promotional / Editorial Fair Use',
        attributionText: `${item.title} (${item.year || ''}) by ${item.creator}`,
        category: item.medium === 'Book / Manga' ? 'Literature' : 
                  item.medium === 'Comic' ? 'Comics' : 
                  item.medium === 'Album' ? 'Music' : 
                  item.medium === 'Film / TV' ? 'Cinema' : 'Podcasts',
        tags: [item.medium.toLowerCase(), item.creator.toLowerCase()].slice(0, 10),
      });

      if (saved) {
        setSavedSuccessMap((prev) => ({ ...prev, [item.id]: true }));

        // If entryId exists, create entry_media junction
        if (entryId) {
          await linkEntryMedia(entryId, saved.id, 'cover');
          onMetadataChange({ editorial_media_id: saved.id });
        }

        if (onNotify) {
          onNotify(`Saved "${item.title}" to Editorial Media Library!`);
        }
      }
    } catch (err: any) {
      console.error('Failed to save to library:', err);
    } finally {
      setSavingMediaId(null);
    }
  };

  // 3. Populate review metadata fields
  const handlePopulateDetails = (item: MatchItem) => {
    const patch: Partial<EntryMetadata> = {
      coverUrl: item.coverUrl,
      cover_image_url: item.coverUrl,
      cover_type: 'artwork',
      credit_title: item.title,
      credit_creator: item.creator,
      imageCredit: `${item.title} by ${item.creator}`,
    };

    if (item.medium === 'Book / Manga') {
      patch.title = item.title;
      patch.author = item.creator;
      patch.year = item.year ? String(item.year) : undefined;
      patch.publisher = item.publisher;
      if (item.details?.pageCount) patch.pageCount = item.details.pageCount;
      if (item.details?.isbn) patch.isbn = item.details.isbn;
    } else if (item.medium === 'Comic') {
      patch.series = item.title;
      patch.writer = item.details?.writer || item.creator;
      patch.artist = item.details?.artist || '';
      patch.publisher = item.publisher;
      patch.year = item.year ? String(item.year) : undefined;
      patch.issue_count = item.details?.issueCount;
    } else if (item.medium === 'Album') {
      patch.title = item.title;
      patch.artist = item.creator;
      patch.label = item.publisher;
      patch.year = item.year ? String(item.year) : undefined;
    } else if (item.medium === 'Podcast') {
      patch.podcastName = item.title;
      patch.creator = item.creator;
      patch.network = item.publisher;
      patch.artworkUrl = item.coverUrl;
    }

    onMetadataChange(patch);
    if (onNotify) {
      onNotify(`Populated review details for "${item.title}".`);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header and Medium Filter Pills */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-sans uppercase tracking-wider font-bold text-[#1C1917]">
            Review Work Matcher
          </label>
          <span className="text-[11px] font-sans text-[#78716C]">
            Books · Comics · Manga · Music · Film · Podcasts
          </span>
        </div>

        {/* Medium Selection Pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {[
            { id: 'all', label: 'All Works' },
            { id: 'books', label: 'Books & Manga' },
            { id: 'comics', label: 'Comics' },
            { id: 'music', label: 'Albums' },
            { id: 'film', label: 'Film & TV' },
            { id: 'podcasts', label: 'Podcasts' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => handleMediumChange(pill.id as MediumType)}
              className={`px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer ${
                medium === pill.id
                  ? 'bg-[#1C1917] text-white border-[#1C1917] font-semibold'
                  : 'bg-white text-[#44403C] border-[#DDD5C7] hover:bg-[#F2ECE1]'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search work title or creator (e.g. Blue Period, Kind of Blue, Watchmen)..."
            className="w-full pl-9 pr-9 py-2 text-xs border border-[#DDD5C7] rounded bg-white text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-hidden focus:border-[#B45309]"
          />
          <Search className="w-4 h-4 text-[#A8A29E] absolute left-2.5 top-2.5" />
          {isSearching && (
            <Loader2 className="w-4 h-4 text-[#B45309] animate-spin absolute right-2.5 top-2.5" />
          )}
        </div>
      </div>

      {/* Results grid */}
      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
          {results.map((item) => {
            const isSaved = savedSuccessMap[item.id];
            const isSaving = savingMediaId === item.id;
            const isCurrentCover = metadata.coverUrl === item.coverUrl || metadata.cover_image_url === item.coverUrl;

            return (
              <div
                key={item.id}
                className={`border rounded p-3 flex gap-3 transition-colors ${
                  isCurrentCover
                    ? 'border-[#B45309] bg-[#FFFBEB]'
                    : 'border-[#DDD5C7] bg-white hover:border-[#A8A29E]'
                }`}
              >
                {/* Cover thumbnail */}
                <div className="w-20 h-28 shrink-0 bg-[#F2ECE1] rounded border border-[#E7E5E4] overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.coverUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-sans font-bold uppercase tracking-wider bg-black/75 text-white backdrop-blur-xs">
                    {item.medium}
                  </div>
                </div>

                {/* Metadata details and actions */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h4 className="text-xs font-serif font-bold text-[#1C1917] truncate leading-tight">
                      {item.title}
                    </h4>
                    <p className="text-[11px] font-sans text-[#78716C] truncate mt-0.5">
                      {item.creator} {item.year ? `· ${item.year}` : ''}
                    </p>
                    {item.publisher && (
                      <p className="text-[10px] font-sans text-[#A8A29E] truncate">
                        {item.publisher}
                      </p>
                    )}
                  </div>

                  {/* Actions toolbar */}
                  <div className="mt-2 pt-2 border-t border-[#F2ECE1] flex flex-wrap gap-1.5">
                    {/* 1. Attach Cover */}
                    <button
                      type="button"
                      onClick={() => handleAttachCover(item)}
                      className={`px-2 py-1 text-[11px] font-sans rounded border transition-colors cursor-pointer flex items-center gap-1 ${
                        isCurrentCover
                          ? 'bg-[#B45309] text-white border-[#B45309] font-medium'
                          : 'bg-[#FAF8F5] text-[#1C1917] border-[#DDD5C7] hover:bg-[#F2ECE1]'
                      }`}
                    >
                      {isCurrentCover ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active Cover</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-[#B45309]" />
                          <span>Attach Cover</span>
                        </>
                      )}
                    </button>

                    {/* 2. Save to Media Library */}
                    <button
                      type="button"
                      disabled={isSaved || isSaving}
                      onClick={() => handleSaveToLibrary(item)}
                      className={`px-2 py-1 text-[11px] font-sans rounded border transition-colors cursor-pointer flex items-center gap-1 ${
                        isSaved
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-white text-[#44403C] border-[#DDD5C7] hover:bg-[#F2ECE1]'
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-[#B45309]" />
                          <span>Saving...</span>
                        </>
                      ) : isSaved ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Saved in Library</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3 h-3 text-[#78716C]" />
                          <span>Save to Library</span>
                        </>
                      )}
                    </button>

                    {/* 3. Populate Review Metadata */}
                    <button
                      type="button"
                      onClick={() => handlePopulateDetails(item)}
                      title="Populate author/artist/year and metadata fields"
                      className="px-2 py-1 text-[11px] font-sans rounded border border-[#DDD5C7] bg-white text-[#78716C] hover:text-[#1C1917] hover:bg-[#F2ECE1] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Layers className="w-3 h-3" />
                      <span>Use Metadata</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : query.trim() && !isSearching ? (
        <div className="p-6 text-center border border-dashed border-[#DDD5C7] rounded bg-white">
          <BookOpen className="w-8 h-8 text-[#A8A29E] mx-auto mb-2" />
          <p className="text-xs font-serif text-[#78716C]">
            No matching works found for &ldquo;{query}&rdquo; in {medium === 'all' ? 'any category' : medium}.
          </p>
          <p className="text-[11px] font-sans text-[#A8A29E] mt-1">
            Try searching by creator name or simpler keywords, or import via direct image URL.
          </p>
        </div>
      ) : (
        <div className="p-6 text-center border border-dashed border-[#DDD5C7] rounded bg-white">
          <Sparkles className="w-7 h-7 text-[#B45309] mx-auto mb-2" />
          <p className="text-xs font-serif text-[#1C1917] font-medium">
            Automated Cover & Metadata Retrieval for Criticism
          </p>
          <p className="text-[11px] font-sans text-[#78716C] max-w-md mx-auto mt-1">
            Search Open Library, Comic Vine, TVMaze, and iTunes to find verified artwork and credits for essays, reviews, and features.
          </p>
        </div>
      )}
    </div>
  );
}
