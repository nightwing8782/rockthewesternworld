'use client';

import { lookupImages, lookupBooks, lookupMusic, lookupPodcasts, ImageResult } from '@/lib/lookups';

import { useState, useEffect, useRef } from 'react';
import { EntryType, EntryMetadata } from '@/types/database';
import {
  Book,
  Music,
  Radio,
  BookOpen,
  Search,
  Loader2,
  Star,
  Feather,
  ImageIcon,
  Sparkles,
  Link2,
  Check,
  Trash2,
} from 'lucide-react';

interface MediaRibbonProps {
  entryType: EntryType;
  metadata: EntryMetadata;
  onUpdateMetadata?: (meta: EntryMetadata) => void;
  onMetadataChange?: (meta: EntryMetadata) => void;
  onTypeChange?: (type: EntryType) => void;
  onAutoTitle?: (title: string) => void;
}

const ENTRY_TYPES: { type: EntryType; label: string; icon: any }[] = [
  { type: 'essay', label: 'Essay / Thought', icon: Feather },
  { type: 'book_review', label: 'Book Log', icon: Book },
  { type: 'comic_review', label: 'Comic Review', icon: BookOpen },
  { type: 'music_review', label: 'Record Log', icon: Music },
  { type: 'podcast_review', label: 'Podcast Log', icon: Radio },
];

const THEME_TAGS = [
  { id: 'chicago', label: 'Chicago Architecture' },
  { id: 'potomac', label: 'Capitol & Potomac' },
  { id: 'desert', label: 'Desert Sublime' },
  { id: 'broadsheet', label: 'Typewriters & Books' },
  { id: 'jazz', label: 'Jazz & Vinyl' },
  { id: 'cinema', label: 'Cinema & Noir' },
];

export default function MediaRibbon({
  entryType,
  metadata,
  onUpdateMetadata,
  onMetadataChange,
  onTypeChange,
  onAutoTitle,
}: MediaRibbonProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const notifyChange = (meta: EntryMetadata) => {
    if (onUpdateMetadata) onUpdateMetadata(meta);
    if (onMetadataChange) onMetadataChange(meta);
  };

  useEffect(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setActiveTheme('');
  }, [entryType]);

  // Load curated images for essay/thought by default
  useEffect(() => {
    if (entryType === 'essay' || entryType === 'thought') {
      fetchVisuals('');
    }
  }, [entryType]);

  const fetchVisuals = async (theme: string, searchVal: string = '') => {
    setIsLoading(true);
    try {
      const data = await lookupImages(theme, searchVal);
      setResults(data);
      setIsOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVisual = (item: any) => {
    notifyChange({
      ...metadata,
      coverUrl: item.url,
      imageCaption: item.title,
      imageCredit: item.artist,
    });
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    notifyChange({
      ...metadata,
      coverUrl: customUrl.trim(),
      imageCaption: metadata.imageCaption || 'Feature Illustration',
      imageCredit: metadata.imageCredit || 'Provided by Author',
    });
    setCustomUrl('');
    setShowCustomUrlInput(false);
  };

  // Review lookup handlers
  const fetchReviewResults = async (val: string) => {
    setIsLoading(true);
    try {
      let data: any[] = [];
      const q = val.trim();
      if (entryType === 'book_review') data = await lookupBooks(q);
      else if (entryType === 'music_review') data = await lookupMusic(q);
      else if (entryType === 'podcast_review') data = await lookupPodcasts(q);
      setResults(data);
      setIsOpen(true);
    } catch (err) {
      console.error('Error fetching media results:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewQueryChange = (val: string) => {
    setQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!val || val.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    searchTimeoutRef.current = setTimeout(() => {
      fetchReviewResults(val);
    }, 200);
  };

  const handleSelectReviewItem = (item: any) => {
    let newMeta: EntryMetadata = {};
    let suggestedTitle = '';

    if (entryType === 'book_review') {
      newMeta = {
        title: item.title,
        author: item.author,
        year: item.year,
        isbn: item.isbn,
        coverUrl: item.coverUrl,
        rating: metadata.rating || 5,
      };
      suggestedTitle = `Review: ${item.title} by ${item.author || 'Unknown'}`;
    } else if (entryType === 'music_review') {
      newMeta = {
        title: item.title,
        artist: item.artist,
        year: item.year,
        coverUrl: item.coverUrl,
        rating: metadata.rating || 5,
      };
      suggestedTitle = `Album Review: ${item.title} — ${item.artist}`;
    } else if (entryType === 'podcast_review') {
      newMeta = {
        podcastName: item.podcastName,
        creator: item.creator,
        artworkUrl: item.artworkUrl,
        rating: metadata.rating || 5,
      };
      suggestedTitle = `Podcast Review: ${item.podcastName}`;
    }

    notifyChange(newMeta);
    if (onAutoTitle && suggestedTitle) onAutoTitle(suggestedTitle);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleRatingChange = (rating: number) => {
    notifyChange({ ...metadata, rating });
  };

  const handleComicFieldChange = (field: string, val: string) => {
    notifyChange({ ...metadata, [field]: val });
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Entry Type Ribbon */}
      <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-[#DDD5C7]">
        {ENTRY_TYPES.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => onTypeChange && onTypeChange(type)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-display font-bold uppercase tracking-wider transition-colors ${
              entryType === type
                ? 'bg-[#1C1917] text-[#FAF8F5]'
                : 'bg-[#F2ECE1] text-[#44403C] hover:bg-[#DDD5C7] hover:text-[#1C1917]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* ESSAYS & THOUGHTS: EDITORIAL ART & PHOTOGRAPHY FINDER     */}
      {/* ======================================================== */}
      {(entryType === 'essay' || entryType === 'thought') && (
        <div className="bg-[#F2ECE1] border border-[#DDD5C7] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[#1C1917] font-display font-bold text-xs uppercase tracking-wider">
              <ImageIcon className="w-4 h-4 text-[#1E40AF]" />
              <span>Editorial Art & Photography Finder</span>
            </div>

            <button
              type="button"
              onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
              className="text-xs font-display font-bold text-[#1E40AF] hover:underline uppercase tracking-wider flex items-center gap-1"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>{showCustomUrlInput ? 'Browse Library' : 'Paste Custom URL'}</span>
            </button>
          </div>

          {/* Active Attached Image Card */}
          {metadata.coverUrl && (
            <div className="p-3 bg-[#FAF8F5] border border-[#DDD5C7] mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={metadata.coverUrl}
                  alt=""
                  className="w-16 h-12 object-cover border border-[#DDD5C7] shadow-xs shrink-0"
                />
                <div>
                  <div className="text-[10px] font-display uppercase tracking-widest text-[#1E40AF] font-bold">
                    ATTACHED FEATURE IMAGE
                  </div>
                  <h5 className="font-display font-bold text-xs text-[#1C1917] line-clamp-1">
                    {metadata.imageCaption || 'Feature Illustration'}
                  </h5>
                  <p className="text-[11px] font-serif text-[#44403C]">
                    {metadata.imageCredit || 'Author Upload'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  notifyChange({
                    ...metadata,
                    coverUrl: undefined,
                    imageCaption: undefined,
                    imageCredit: undefined,
                  })
                }
                className="text-xs text-red-700 hover:text-red-900 font-display font-bold uppercase tracking-wider flex items-center gap-1 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          )}

          {/* Custom URL Input Bar */}
          {showCustomUrlInput ? (
            <div className="flex gap-2 mb-3">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/photograph.jpg"
                className="flex-1 text-xs font-serif px-3 py-2 bg-[#FAF8F5] border border-stone-300 text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
              />
              <button
                type="button"
                onClick={handleApplyCustomUrl}
                className="px-4 py-2 bg-stone-900 text-stone-100 text-xs font-display font-bold uppercase tracking-wider hover:bg-stone-800 shrink-0"
              >
                Attach
              </button>
            </div>
          ) : (
            <div>
              {/* Quick-Pick Thematic Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {THEME_TAGS.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      const newTheme = activeTheme === tag.id ? '' : tag.id;
                      setActiveTheme(newTheme);
                      fetchVisuals(newTheme, query);
                    }}
                    className={`text-[11px] font-display font-bold uppercase tracking-wider px-2.5 py-1 border transition-colors ${
                      activeTheme === tag.id
                        ? 'bg-[#1E40AF] text-white border-[#1E40AF]'
                        : 'bg-[#FAF8F5] text-[#44403C] border-[#DDD5C7] hover:bg-[#DDD5C7]'
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>

              {/* Visual Card Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-1">
                {results.map((item) => {
                  const isSelected = metadata.coverUrl === item.url;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectVisual(item)}
                      className={`group relative cursor-pointer border rounded-xs overflow-hidden transition-all ${
                        isSelected
                          ? 'ring-2 ring-[#1E40AF] border-[#1E40AF]'
                          : 'border-[#DDD5C7] hover:border-[#1E40AF]'
                      }`}
                    >
                      <img
                        src={item.thumbUrl}
                        alt={item.title}
                        className="w-full h-20 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                        <span className="text-[10px] text-white font-serif line-clamp-1 leading-tight">
                          {item.title}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-[#1E40AF] text-white rounded-full flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comic Specific Metadata Builder */}
      {entryType === 'comic_review' && (
        <div className="bg-[#F2ECE1] border border-[#DDD5C7] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[#1C1917] font-display font-bold text-xs uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-[#B45309]" />
              <span>Comic Issue Metadata</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-display uppercase tracking-widest text-[#44403C] mr-1">Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingChange(star)}
                  className="p-0.5 text-[#B45309] hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      (metadata.rating || 0) >= star ? 'fill-[#B45309] text-[#B45309]' : 'text-stone-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-[#44403C] mb-1">
                Series Title
              </label>
              <input
                type="text"
                placeholder="e.g. The Incal"
                value={metadata.series || ''}
                onChange={(e) => handleComicFieldChange('series', e.target.value)}
                className="w-full text-xs font-serif px-2.5 py-1.5 bg-[#FAF8F5] border border-[#DDD5C7] text-[#1C1917]"
              />
            </div>
            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-[#44403C] mb-1">
                Issue / Vol #
              </label>
              <input
                type="text"
                placeholder="e.g. Vol. 1"
                value={metadata.issueNumber || ''}
                onChange={(e) => handleComicFieldChange('issueNumber', e.target.value)}
                className="w-full text-xs font-serif px-2.5 py-1.5 bg-[#FAF8F5] border border-[#DDD5C7] text-[#1C1917]"
              />
            </div>
            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-[#44403C] mb-1">
                Writer
              </label>
              <input
                type="text"
                placeholder="e.g. Alejandro Jodorowsky"
                value={metadata.writer || ''}
                onChange={(e) => handleComicFieldChange('writer', e.target.value)}
                className="w-full text-xs font-serif px-2.5 py-1.5 bg-[#FAF8F5] border border-[#DDD5C7] text-[#1C1917]"
              />
            </div>
            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-[#44403C] mb-1">
                Artist
              </label>
              <input
                type="text"
                placeholder="e.g. Mœbius"
                value={metadata.artist || ''}
                onChange={(e) => handleComicFieldChange('artist', e.target.value)}
                className="w-full text-xs font-serif px-2.5 py-1.5 bg-[#FAF8F5] border border-[#DDD5C7] text-[#1C1917]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Book / Music / Podcast Search Ribbon */}
      {(entryType === 'book_review' || entryType === 'music_review' || entryType === 'podcast_review') && (
        <div className="bg-[#F2ECE1] border border-[#DDD5C7] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[#1C1917] font-display font-bold text-xs uppercase tracking-wider">
              {entryType === 'book_review' && <Book className="w-4 h-4 text-[#B45309]" />}
              {entryType === 'music_review' && <Music className="w-4 h-4 text-[#B45309]" />}
              {entryType === 'podcast_review' && <Radio className="w-4 h-4 text-[#B45309]" />}
              <span>
                {entryType === 'book_review' && 'Lookup Book from Open Library'}
                {entryType === 'music_review' && 'Lookup Release from MusicBrainz'}
                {entryType === 'podcast_review' && 'Lookup Podcast from iTunes'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[11px] font-display uppercase tracking-widest text-[#44403C] mr-1">Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingChange(star)}
                  className="p-0.5 text-[#B45309] hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      (metadata.rating || 0) >= star ? 'fill-[#B45309] text-[#B45309]' : 'text-stone-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Search Input and Live Dropdown */}
          <div className="relative" ref={containerRef}>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder={
                  entryType === 'book_review'
                    ? 'Search title, author, or ISBN...'
                    : entryType === 'music_review'
                    ? 'Search album, artist, or record...'
                    : 'Search podcast name or host...'
                }
                value={query}
                onChange={(e) => handleReviewQueryChange(e.target.value)}
                className="w-full text-xs font-serif pl-8 pr-8 py-2 bg-[#FAF8F5] border border-stone-300 text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
              />
              <Search className="w-3.5 h-3.5 text-[#44403C] absolute left-2.5 pointer-events-none" />
              {isLoading && <Loader2 className="w-3.5 h-3.5 text-[#1E40AF] animate-spin absolute right-2.5" />}
            </div>

            {isOpen && results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#FAF8F5] border border-[#DDD5C7] shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-[#DDD5C7]">
                {results.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectReviewItem(item)}
                    className="p-2.5 flex items-center gap-3 cursor-pointer hover:bg-[#F2ECE1] transition-colors"
                  >
                    {(item.coverUrl || item.artworkUrl) && (
                      <img
                        src={item.coverUrl || item.artworkUrl}
                        alt=""
                        className="w-9 h-12 object-cover border border-[#DDD5C7] shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h5 className="font-display font-bold text-xs text-[#1C1917] truncate">
                        {item.title || item.podcastName}
                      </h5>
                      <p className="text-[11px] font-serif text-[#44403C] truncate">
                        {item.author || item.artist || item.creator} {item.year ? `(${item.year})` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
