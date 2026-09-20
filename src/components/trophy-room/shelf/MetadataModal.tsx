'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Edit3,
  Loader2,
  Sparkles,
  CheckCircle2,
  Search,
  Globe,
  BookOpen,
  Image as ImageIcon,
  Star,
  Layers,
  Calendar,
  Building,
} from 'lucide-react';
import { TrophyBook, ReadingDirection, BookMedium } from '@/types/trophy';

interface MetadataSearchResult {
  id: string;
  source: 'google' | 'openlibrary';
  title: string;
  subtitle?: string;
  series?: string;
  volumeNumber?: number;
  authors: string[];
  description?: string;
  publisher?: string;
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
  thumbnailUrl?: string;
}

interface MetadataModalProps {
  book: TrophyBook | null;
  onClose: () => void;
  onSaveMetadata: (
    bookId: string,
    updates: Partial<TrophyBook>,
    applyToSeries?: boolean
  ) => Promise<void>;
}

export default function MetadataModal({
  book,
  onClose,
  onSaveMetadata,
}: MetadataModalProps) {
  const [title, setTitle] = useState('');
  const [series, setSeries] = useState('');
  const [issueNumber, setIssueNumber] = useState<number>(1);
  const [volumeNumber, setVolumeNumber] = useState<number | ''>('');
  const [author, setAuthor] = useState('');
  const [illustrator, setIllustrator] = useState('');
  const [publisher, setPublisher] = useState('');
  const [franchise, setFranchise] = useState('');
  const [publishedYear, setPublishedYear] = useState('');
  const [medium, setMedium] = useState<BookMedium>('comic');
  const [isFavorite, setIsFavorite] = useState(false);
  const [description, setDescription] = useState('');
  const [pageCount, setPageCount] = useState<number>(1);
  const [readingDirection, setReadingDirection] = useState<ReadingDirection>('ltr');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [applyToSeriesRun, setApplyToSeriesRun] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<MetadataSearchResult[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [searchSuccessMessage, setSearchSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clean filename for automatic initial query
  const deriveCleanSearchQuery = (b: TrophyBook) => {
    if (b.series && b.series !== 'Standalone') {
      return b.series;
    }
    return (b.title || '')
      .replace(/\.(cbz|cbr|epub|pdf|zip)$/i, '')
      .replace(/\[.*?\]/g, ' ')
      .replace(/\((?!19\d\d|20\d\d).*?\)/g, ' ')
      .replace(/\b(?:digital|zone|empire|minutemen|scanner|scan|webrip|nov|c2c)\b/gi, ' ')
      .replace(/\b(?:vol(?:ume)?\.?\s*\d+|#\s*\d+|\bv\d+\b)/gi, ' ')
      .replace(/[-_:]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Reset and populate form whenever active book changes
  useEffect(() => {
    if (book) {
      setTitle(book.title || '');
      setSeries(book.series || '');
      setIssueNumber(book.issue_number || 1);
      setVolumeNumber(book.volume_number !== undefined && book.volume_number !== null ? book.volume_number : '');
      setAuthor(book.author || '');
      setIllustrator(book.illustrator || '');
      setPublisher(book.publisher || '');
      setFranchise(book.franchise || '');
      setPublishedYear(book.published_year || '');
      setMedium((book.medium as BookMedium) || (book.format === 'cbz' ? 'comic' : book.format === 'epub' ? 'novel' : 'comic'));
      setIsFavorite(!!book.is_favorite);
      setDescription(book.description || '');
      setPageCount(book.page_count || 1);
      setReadingDirection(book.reading_direction || (book.medium === 'manga' ? 'rtl' : 'ltr'));
      setCoverUrl(book.cover_url || null);
      setApplyToSeriesRun(false);

      const initialQuery = deriveCleanSearchQuery(book);
      setSearchQuery(initialQuery);
      setSearchResults([]);
      setSelectedResultId(null);
      setSearchSuccessMessage(null);
      setError(null);
    }
  }, [book]);

  if (!book) return null;

  // Smart volume / issue extractor
  const extractVolumeNumber = (str: string): number | null => {
    const match =
      str.match(/\bvol(?:ume)?\.?\s*(\d+(?:\.\d+)?)/i) ||
      str.match(/\bv(\d+(?:\.\d+)?)\b/i) ||
      str.match(/#\s*(\d+(?:\.\d+)?)/) ||
      str.match(/\b(?:issue|bk|book)\.?\s*(\d+)/i) ||
      str.match(/\b(?:part|pt)\.?\s*(\d+)/i);
    if (match && match[1]) {
      const parsed = parseFloat(match[1]);
      if (!isNaN(parsed)) return parsed;
    }
    return null;
  };

  // Perform Cloud Metadata Search (Google Books + Open Library)
  const handleSearch = async (queryToRun?: string) => {
    const q = (queryToRun !== undefined ? queryToRun : searchQuery).trim();
    if (!q) {
      setError('Please type a search query.');
      return;
    }

    setSearching(true);
    setError(null);
    setSearchSuccessMessage(null);
    setSearchResults([]);

    const results: MetadataSearchResult[] = [];

    try {
      // 1. Google Books API
      const gRes = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=6`
      );

      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData.items && gData.items.length > 0) {
          gData.items.forEach((item: any) => {
            const vi = item.volumeInfo || {};
            const itemThumb =
              vi.imageLinks?.thumbnail ||
              vi.imageLinks?.smallThumbnail ||
              vi.imageLinks?.medium;
            const httpsThumb = itemThumb ? itemThumb.replace(/^http:\/\//i, 'https://') : undefined;

            const fullTitle = [vi.title, vi.subtitle].filter(Boolean).join(': ');
            const extractedVol = extractVolumeNumber(fullTitle);

            results.push({
              id: `g_${item.id}`,
              source: 'google',
              title: vi.title || fullTitle,
              subtitle: vi.subtitle,
              series: vi.seriesInfo?.shortSeriesBookTitle || vi.title,
              volumeNumber: extractedVol || undefined,
              authors: vi.authors || [],
              description: vi.description ? vi.description.replace(/<[^>]*>/g, '') : undefined,
              publisher: vi.publisher,
              publishedDate: vi.publishedDate,
              pageCount: vi.pageCount,
              categories: vi.categories || [],
              thumbnailUrl: httpsThumb,
            });
          });
        }
      }

      // 2. Open Library Search
      if (results.length < 4) {
        const olRes = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=4`
        );
        if (olRes.ok) {
          const olData = await olRes.json();
          if (olData.docs && olData.docs.length > 0) {
            olData.docs.forEach((doc: any) => {
              const coverId = doc.cover_i;
              const thumbUrl = coverId
                ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
                : undefined;

              const fullOlTitle = [doc.title, doc.subtitle].filter(Boolean).join(': ');
              const extractedOlVol = extractVolumeNumber(fullOlTitle);

              results.push({
                id: `ol_${doc.key || Math.random()}`,
                source: 'openlibrary',
                title: doc.title,
                subtitle: doc.subtitle,
                volumeNumber: extractedOlVol || undefined,
                authors: doc.author_name ? doc.author_name.slice(0, 3) : [],
                description: doc.first_sentence ? doc.first_sentence[0] : undefined,
                publisher: doc.publisher ? doc.publisher[0] : undefined,
                publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : undefined,
                pageCount: doc.number_of_pages_median || undefined,
                thumbnailUrl: thumbUrl,
              });
            });
          }
        }
      }

      if (results.length === 0) {
        setError(`No matches found for "${q}". Try typing the series or creator name.`);
      } else {
        setSearchResults(results);
      }
    } catch (err: any) {
      console.error('[MetadataModal] Cloud lookup error:', err);
      setError('Could not connect to online metadata service. Check internet connection.');
    } finally {
      setSearching(false);
    }
  };

  // Apply selected cloud result into form
  const handleApplyResult = (res: MetadataSearchResult) => {
    setSelectedResultId(res.id);

    if (res.series) {
      setSeries(res.series);
    } else if (res.title) {
      const parts = res.title.split(/[:\-,]/);
      if (parts.length > 1 && parts[0].trim().length > 2) {
        setSeries(parts[0].trim());
      } else if (!series || series === 'Standalone') {
        setSeries(res.title);
      }
    }

    if (res.title) setTitle(res.title);
    if (res.volumeNumber) {
      setIssueNumber(res.volumeNumber);
      setVolumeNumber(res.volumeNumber);
    }
    if (res.authors && res.authors.length > 0) setAuthor(res.authors.join(', '));
    if (res.publisher) setPublisher(res.publisher);
    if (res.publishedDate) setPublishedYear(res.publishedDate.slice(0, 4));
    if (res.description) setDescription(res.description);
    if (res.pageCount && res.pageCount > 0) setPageCount(res.pageCount);
    if (res.thumbnailUrl) setCoverUrl(res.thumbnailUrl);

    setSearchSuccessMessage(
      `Applied metadata from ${res.source === 'google' ? 'Google Books' : 'Open Library'}: "${res.title}"`
    );
  };

  // Save changes locally and in Supabase
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSaveMetadata(
        book.id,
        {
          title: title.trim() || book.title,
          series: series.trim() || 'Standalone',
          issue_number: Number(issueNumber) || 1,
          volume_number: volumeNumber !== '' ? Number(volumeNumber) : null,
          author: author.trim() || null,
          illustrator: illustrator.trim() || null,
          publisher: publisher.trim() || null,
          franchise: franchise.trim() || null,
          published_year: publishedYear.trim() || null,
          medium,
          is_favorite: isFavorite,
          description: description.trim() || null,
          page_count: Number(pageCount) || book.page_count,
          reading_direction: readingDirection,
          cover_url: coverUrl || book.cover_url || null,
        },
        applyToSeriesRun
      );

      onClose();
    } catch (err: any) {
      console.error('Error saving metadata:', err);
      setError(err.message || 'Failed to save metadata updates.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] border-4 border-[#111827] rounded-3xl shadow-[8px_8px_0_#111827] max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-[#111827]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-4 border-[#111827] bg-[#FFDE59] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#111827]">
              <Edit3 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-wide text-[#111827]">
                Book & Series Metadata Studio
              </h2>
              <p className="text-[11px] font-bold text-slate-800 truncate max-w-md">
                {book.title} ({String(book.format || 'cbz').toUpperCase()})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white border-2 border-[#111827] text-[#111827] hover:bg-[#FF4757] hover:text-white shadow-[2px_2px_0_#111827] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-paper-texture">
          {/* Section 1: Live Cloud Search */}
          <div className="p-4 bg-white rounded-2xl border-3 border-[#111827] shadow-[4px_4px_0_#111827] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF4757]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#111827]">
                  Cloud Metadata Search (Google Books & Open Library)
                </span>
              </div>
              <span className="comic-stamp text-[9px] px-2 py-0.5 rounded bg-[#FFDE59] text-[#111827] font-black">
                Live Lookup
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  placeholder="Search series or book title (e.g. Saga, Peanuts, Watchmen)..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 text-[#111827] text-xs font-bold rounded-xl border-2 border-[#111827] shadow-[1px_1px_0_#111827] focus:outline-none focus:ring-2 focus:ring-[#FFDE59]"
                />
              </div>

              <button
                type="button"
                disabled={searching}
                onClick={() => handleSearch()}
                className="px-4 py-2 bg-[#FF4757] hover:bg-[#e03848] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#111827] flex items-center gap-1.5 transition-all shrink-0 active:scale-95 cursor-pointer"
              >
                {searching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>

            {searchSuccessMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-100 border-2 border-[#2ED573] text-emerald-950 font-bold text-xs flex items-center gap-2 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 text-[#2ED573] shrink-0" />
                <span className="truncate">{searchSuccessMessage}</span>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="mt-3 pt-3 border-t-2 border-slate-100 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center justify-between">
                  <span>Select a match to auto-fill metadata & cover art ({searchResults.length} results):</span>
                  <span className="text-[10px] text-slate-400 lowercase font-normal">click any card to apply</span>
                </p>
                <div className="space-y-2">
                  {searchResults.map((result) => {
                    const isSelected = selectedResultId === result.id;
                    return (
                      <div
                        key={result.id}
                        onClick={() => handleApplyResult(result)}
                        className={`p-3 rounded-2xl border-3 transition-all flex items-center gap-3.5 cursor-pointer text-left ${
                          isSelected
                            ? 'bg-[#FFDE59]/40 border-[#111827] shadow-[3px_3px_0_#111827] ring-2 ring-[#FFDE59]'
                            : 'bg-white hover:bg-amber-50/70 border-slate-300 hover:border-[#111827] shadow-[2px_2px_0_rgba(0,0,0,0.06)]'
                        }`}
                      >
                        {/* Cover Image */}
                        {result.thumbnailUrl ? (
                          <img
                            src={result.thumbnailUrl}
                            alt={result.title}
                            className="w-14 h-20 object-cover rounded-lg border-2 border-[#111827] shrink-0 shadow-[2px_2px_0_#111827]"
                          />
                        ) : (
                          <div className="w-14 h-20 bg-slate-100 rounded-lg border-2 border-slate-300 flex flex-col items-center justify-center shrink-0 text-slate-400">
                            <BookOpen className="w-6 h-6 stroke-[1.5]" />
                            <span className="text-[8px] uppercase font-black mt-1">No Cover</span>
                          </div>
                        )}

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs sm:text-sm font-black text-[#111827] leading-snug break-words">
                              {result.title}
                              {result.subtitle ? ` — ${result.subtitle}` : ''}
                            </h4>
                          </div>

                          <p className="text-xs font-bold text-slate-700 mt-1">
                            {result.authors.length > 0 ? result.authors.join(', ') : 'Unknown Creator'}
                            {result.publisher ? ` • ${result.publisher}` : ''}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-bold text-slate-500">
                            {result.volumeNumber && (
                              <span className="comic-stamp px-1.5 py-0.2 rounded bg-[#FFDE59] text-[#111827] font-black border border-[#111827]">
                                Vol. {result.volumeNumber}
                              </span>
                            )}
                            {result.publishedDate && (
                              <span className="comic-stamp px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-300">
                                Year: {result.publishedDate.slice(0, 4)}
                              </span>
                            )}
                            {result.pageCount && (
                              <span className="comic-stamp px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-300">
                                {result.pageCount} Pages
                              </span>
                            )}
                            <span className="comic-stamp text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-white font-mono">
                              {result.source.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          type="button"
                          className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-[#111827] shrink-0 transition-all ${
                            isSelected
                              ? 'bg-[#2ED573] text-[#111827] shadow-[2px_2px_0_#111827]'
                              : 'bg-[#111827] text-white hover:bg-[#FF4757] shadow-[2px_2px_0_#111827]'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Use'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-100 border-2 border-[#FF4757] text-[#FF4757] font-bold text-xs animate-in fade-in duration-150">
              {error}
            </div>
          )}

          {/* Section 2: Form */}
          <form id="metadata-form" onSubmit={handleSave} className="space-y-4">
            {/* Title & Favorite Star */}
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#111827] flex items-center justify-between">
                  <span>Book / Issue Title</span>
                  <span className="text-[10px] text-slate-500 lowercase font-medium">required</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Saga #1 or Peanuts 1950-1952"
                  className="w-full px-3.5 py-2 bg-white border-2 border-[#111827] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FFDE59] shadow-[2px_2px_0_#111827]"
                />
              </div>

              {/* Favorite Toggle */}
              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-2 rounded-xl border-2 border-[#111827] transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-[2px_2px_0_#111827] ${
                  isFavorite ? 'bg-[#FFDE59] text-[#111827]' : 'bg-white text-slate-400 hover:text-amber-500'
                }`}
                title={isFavorite ? 'In Favorites Hall of Fame' : 'Add to Favorites'}
              >
                <Star className={`w-5 h-5 ${isFavorite ? 'fill-[#FF4757] text-[#111827]' : ''}`} />
              </button>
            </div>

            {/* Medium & Series */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
                  Medium / Category
                </label>
                <select
                  value={medium}
                  onChange={(e) => {
                    const nextMed = e.target.value as BookMedium;
                    setMedium(nextMed);
                    if (nextMed === 'manga') setReadingDirection('rtl');
                  }}
                  className="w-full px-3 py-2 bg-white border-2 border-[#111827] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FFDE59] shadow-[2px_2px_0_#111827] uppercase cursor-pointer"
                >
                  <option value="comic">🦸 Comic / Graphic Novel</option>
                  <option value="manga">⛩️ Manga (RTL)</option>
                  <option value="cookbook">🍳 Cookbook / Culinary</option>
                  <option value="reference">🛠️ Reference / 101s</option>
                  <option value="wellness">🧘 Wellness & Habits</option>
                  <option value="writing">✍️ Writing & Screenplay</option>
                  <option value="magazine">📰 Periodical / Magazine</option>
                  <option value="novel">📖 Prose & Fiction</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
                  Series / Collection Name
                </label>
                <input
                  type="text"
                  value={series}
                  onChange={(e) => setSeries(e.target.value)}
                  placeholder="e.g. Saga, The Complete Peanuts, Adams 101"
                  className="w-full px-3.5 py-2 bg-white border-2 border-[#111827] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FFDE59] shadow-[2px_2px_0_#111827]"
                />
              </div>
            </div>

            {/* Volume #, Issue #, and Franchise */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
                  Volume #
                </label>
                <input
                  type="number"
                  step="any"
                  value={volumeNumber}
                  onChange={(e) => setVolumeNumber(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="e.g. 1"
                  className="w-full px-3.5 py-2 bg-white border-2 border-[#111827] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FFDE59] shadow-[2px_2px_0_#111827]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
                  Issue #
                </label>
                <input
                  type="number"
                  step="any"
                  value={issueNumber}
                  onChange={(e) => setIssueNumber(parseFloat(e.target.value) || 1)}
                  className="w-full px-3.5 py-2 bg-white border-2 border-[#111827] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FFDE59] shadow-[2px_2px_0_#111827]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
                  Franchise / Universe
                </label>
                <input
                  type="text"
                  value={franchise}
                  onChange={(e) => setFranchise(e.target.value)}
                  placeholder="e.g. Transformers, Peanuts"
                  className="w-full px-3.5 py-2 bg-white border-2 border-[#111827] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FFDE59] shadow-[2px_2px_0_#111827]"
                />
              </div>
            </div>

            {/* Batch Series Sync Checkbox */}
            {book.series && (
              <label className="flex items-center gap-2.5 p-2.5 bg-amber-50 rounded-xl border-2 border-[#111827]/40 cursor-pointer hover:bg-amber-100/70 transition-colors">
                <input
                  type="checkbox"
                  checked={applyToSeriesRun}
                  onChange={(e) => setApplyToSeriesRun(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-[#111827] text-[#FF4757] focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-bold text-[#111827]">
                  Apply series <span className="font-black text-[#FF4757]">"{series || 'Standalone'}"</span>, publisher, and medium to all issues in this run
                </span>
              </label>
            )}

            {/* Author, Publisher, Year */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
                  Author / Writer / Chef
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Charles M. Schulz"
                  className="w-full px-3.5 py-2 bg-white border-2 border-[#111827] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FFDE59] shadow-[2px_2px_0_#111827]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
                  Publisher / Imprint
                </label>
                <input
                  type="text"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  placeholder="e.g. Fantagraphics, Adams"
                  className="w-full px-3.5 py-2 bg-white border-2 border-[#111827] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FFDE59] shadow-[2px_2px_0_#111827]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
                  Published Year
                </label>
                <input
                  type="text"
                  value={publishedYear}
                  onChange={(e) => setPublishedYear(e.target.value)}
                  placeholder="e.g. 1959"
                  className="w-full px-3.5 py-2 bg-white border-2 border-[#111827] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FFDE59] shadow-[2px_2px_0_#111827]"
                />
              </div>
            </div>

            {/* Reading Direction & Cover Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
                  Reading Direction
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReadingDirection('ltr')}
                    className={`py-2 px-3 rounded-xl border-2 border-[#111827] text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      readingDirection === 'ltr'
                        ? 'bg-[#111827] text-[#FFDE59] shadow-[2px_2px_0_#FF4757]'
                        : 'bg-white text-slate-700 hover:bg-slate-100 shadow-[1px_1px_0_#111827]'
                    }`}
                  >
                    LTR (Western)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReadingDirection('rtl')}
                    className={`py-2 px-3 rounded-xl border-2 border-[#111827] text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      readingDirection === 'rtl'
                        ? 'bg-[#111827] text-[#FFDE59] shadow-[2px_2px_0_#FF4757]'
                        : 'bg-white text-slate-700 hover:bg-slate-100 shadow-[1px_1px_0_#111827]'
                    }`}
                  >
                    RTL (Manga)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
                  Cover Artwork
                </label>
                <div className="flex items-center gap-3 p-2 bg-white rounded-xl border-2 border-[#111827] shadow-[1px_1px_0_#111827]">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt="Cover"
                      className="w-8 h-11 object-cover rounded border border-[#111827]"
                    />
                  ) : (
                    <div className="w-8 h-11 bg-slate-200 rounded border border-slate-400 flex items-center justify-center text-slate-500">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-[#111827] truncate">
                      {coverUrl ? 'Active Cover Art Linked' : 'Original Archive Cover'}
                    </p>
                    {coverUrl && (
                      <button
                        type="button"
                        onClick={() => setCoverUrl(null)}
                        className="text-[10px] font-bold text-[#FF4757] hover:underline"
                      >
                        Revert to Archive Cover
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
                Synopsis / Book Notes
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter plot summary or book notes..."
                className="w-full px-3.5 py-2 bg-white border-2 border-[#111827] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FFDE59] shadow-[2px_2px_0_#111827]"
              />
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t-3 border-[#111827] bg-white flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#111827] text-xs font-black uppercase tracking-wider rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#111827] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="metadata-form"
            disabled={saving}
            className="px-6 py-2.5 bg-[#2ED573] hover:bg-[#26af5f] disabled:opacity-50 text-[#111827] font-black text-xs uppercase tracking-wider rounded-xl border-3 border-[#111827] shadow-[3px_3px_0_#111827] transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving to Vault...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>Save Changes & Reorganize</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
