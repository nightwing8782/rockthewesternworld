'use client';

import { useState, useEffect, useRef } from 'react';
import { EntryType, EntryMetadata } from '@/types/database';
import { lookupBooks, lookupComics, lookupMusic, lookupPodcasts } from '@/lib/lookups';
import {
  Search,
  Book,
  BookOpen,
  Music,
  Radio,
  Star,
  CheckCircle2,
  X,
  Loader2,
  FileText,
} from 'lucide-react';

interface ReviewCraftPanelProps {
  entryType: EntryType;
  metadata: EntryMetadata;
  onMetadataChange: (newMeta: Partial<EntryMetadata>) => void;
  onApplyTemplate: (templateHtml: string) => void;
  onAutoTitle?: (suggestedTitle: string) => void;
}

export default function ReviewCraftPanel({
  entryType,
  metadata,
  onMetadataChange,
  onApplyTemplate,
  onAutoTitle,
}: ReviewCraftPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isReview = ['book_review', 'comic_review', 'music_review', 'podcast_review'].includes(entryType);

  useEffect(() => {
    setSearchQuery('');
    setSearchResults([]);
    setIsDropdownOpen(false);
  }, [entryType]);

  if (!isReview) return null;

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!q.trim()) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setIsDropdownOpen(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        let results: any[] = [];
        if (entryType === 'comic_review') {
          results = await lookupComics(q);
        } else if (entryType === 'book_review') {
          results = await lookupBooks(q);
        } else if (entryType === 'music_review') {
          results = await lookupMusic(q);
        } else if (entryType === 'podcast_review') {
          results = await lookupPodcasts(q);
        }
        setSearchResults(results);
      } catch (e) {
        console.warn('Search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  };

  const handleSelectItem = (item: any) => {
    setIsDropdownOpen(false);
    setSearchQuery('');

    if (entryType === 'comic_review') {
      const updated: Partial<EntryMetadata> = {
        series: item.series || item.title || '',
        writer: item.writer || item.author || '',
        publisher: item.publisher || '',
        year: item.year || '',
        coverUrl: item.coverUrl || metadata.coverUrl,
      };
      onMetadataChange(updated);
      if (onAutoTitle && item.series) {
        onAutoTitle(`Review: ${item.series}`);
      }
    } else if (entryType === 'book_review') {
      const updated: Partial<EntryMetadata> = {
        title: item.title || '',
        author: item.author || '',
        publisher: item.publisher || '',
        year: item.year || '',
        isbn: item.isbn || '',
        pageCount: item.pageCount || '',
        coverUrl: item.coverUrl || metadata.coverUrl,
      };
      onMetadataChange(updated);
      if (onAutoTitle && item.title) {
        onAutoTitle(`Review: ${item.title} by ${item.author || 'Author'}`);
      }
    } else if (entryType === 'music_review') {
      const updated: Partial<EntryMetadata> = {
        title: item.title || '',
        artist: item.artist || '',
        label: item.label || '',
        year: item.year || '',
        coverUrl: item.coverUrl || metadata.coverUrl,
      };
      onMetadataChange(updated);
      if (onAutoTitle && item.title) {
        onAutoTitle(`Review: ${item.title} — ${item.artist || 'Artist'}`);
      }
    } else if (entryType === 'podcast_review') {
      const updated: Partial<EntryMetadata> = {
        podcastName: item.podcastName || item.title || '',
        creator: item.creator || '',
        network: item.network || item.creator || '',
        artworkUrl: item.artworkUrl || metadata.artworkUrl || metadata.coverUrl,
        coverUrl: item.artworkUrl || metadata.coverUrl,
      };
      onMetadataChange(updated);
      if (onAutoTitle && item.podcastName) {
        onAutoTitle(`Podcast Review: ${item.podcastName}`);
      }
    }
  };

  const handleClearSelected = () => {
    onMetadataChange({
      title: '',
      series: '',
      podcastName: '',
      author: '',
      writer: '',
      artist: '',
      creator: '',
      publisher: '',
      label: '',
      year: '',
      isbn: '',
      coverUrl: undefined,
      artworkUrl: undefined,
    });
  };

  const getSelectedTitle = () => {
    return metadata.title || metadata.series || metadata.podcastName || '';
  };

  const getSelectedCreator = () => {
    return metadata.author || metadata.writer || metadata.artist || metadata.creator || '';
  };

  const handleApplyThreeActTemplate = () => {
    let template = '';
    if (entryType === 'comic_review') {
      template = `<h2>The Script & Narrative</h2><p>Examine the narrative arc, dialogue, pacing, and thematic ambition of the writing...</p><h2>The Visuals & Paneling</h2><p>Evaluate the linework, panel sequencing, color palette, and visual rhythm of the art...</p><h2>The Complete Work</h2><p>Deliver your overarching assessment, standout moments, and critical verdict...</p>`;
    } else if (entryType === 'book_review') {
      template = `<h2>The Voice & Prose</h2><p>Analyze the sentence craft, stylistic texture, authorial voice, and register of the work...</p><h2>Narrative & Thematic Arc</h2><p>Explore the architecture of the plot, characters, and philosophical inquiries...</p><h2>The Complete Work</h2><p>Synthesize the book's lasting impression and deliver your critical verdict...</p>`;
    } else if (entryType === 'music_review') {
      template = `<h2>The Sonic Landscape</h2><p>Analyze the acoustic textures, production depth, instrumentation, and sonic atmosphere...</p><h2>Writing & Composition</h2><p>Examine the melody, lyricism, arrangements, and thematic progression of the tracks...</p><h2>The Complete Work</h2><p>Synthesize the album's place in the artist's catalog and deliver your critical verdict...</p>`;
    } else if (entryType === 'podcast_review') {
      template = `<h2>Editorial Quality & Rigor</h2><p>Evaluate the reporting depth, host chemistry, storytelling rigor, and perspective...</p><h2>Pacing & Audio Craft</h2><p>Analyze the sound design, scoring, editing cadence, and listening momentum...</p><h2>The Complete Work</h2><p>Summarize who this series is essential for and deliver your critical verdict...</p>`;
    }

    onApplyTemplate(template);
  };

  const renderStarRating = (
    label: string,
    value: number | undefined,
    onChange: (val: number) => void
  ) => {
    const current = value || 0;
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-display uppercase tracking-widest text-[#44403C] font-semibold">
            {label}
          </span>
          <span className="text-[11px] font-serif font-bold text-[#B45309]">
            {current > 0 ? `${current} / 5` : 'Unrated'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(current === star ? 0 : star)}
              className="p-1 hover:scale-110 transition-transform cursor-pointer"
              title={`Rate ${star} of 5`}
            >
              <Star
                className={`w-4 h-4 ${
                  current >= star
                    ? 'fill-[#B45309] text-[#B45309]'
                    : 'text-stone-300 hover:text-amber-400'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const selectedTitle = getSelectedTitle();
  const selectedCreator = getSelectedCreator();

  return (
    <div className="mb-6 p-4 bg-[#F2ECE1] border border-[#DDD5C7] rounded shadow-xs space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#DDD5C7]">
        <div className="flex items-center gap-2">
          {entryType === 'comic_review' && <BookOpen className="w-4 h-4 text-[#1E40AF]" />}
          {entryType === 'book_review' && <Book className="w-4 h-4 text-[#1E40AF]" />}
          {entryType === 'music_review' && <Music className="w-4 h-4 text-[#1E40AF]" />}
          {entryType === 'podcast_review' && <Radio className="w-4 h-4 text-[#1E40AF]" />}
          <span className="text-xs font-display font-bold uppercase tracking-wider text-[#1C1917]">
            {entryType === 'comic_review' && 'Comic Review Craft Ledger'}
            {entryType === 'book_review' && 'Book Log & Literary Review'}
            {entryType === 'music_review' && 'Record Log & Sonic Review'}
            {entryType === 'podcast_review' && 'Podcast Review & Audio Log'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleApplyThreeActTemplate}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] rounded text-[11px] font-display uppercase tracking-wider font-bold transition-colors self-start sm:self-auto shadow-2xs cursor-pointer"
          title="Insert 3-act review headings into editor"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Apply 3-Act Structure</span>
        </button>
      </div>

      {/* Selected Confirmation Badge or Search Box */}
      {selectedTitle ? (
        <div className="p-3 bg-[#FAF8F5] border border-emerald-300 rounded flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            {metadata.coverUrl ? (
              <img
                src={metadata.coverUrl}
                alt=""
                className="w-10 h-14 object-cover border border-[#DDD5C7] shrink-0"
              />
            ) : (
              <div className="w-10 h-10 bg-emerald-50 text-emerald-700 flex items-center justify-center rounded shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[10px] font-display uppercase tracking-wider font-bold text-emerald-800">
                Selected Work:
              </div>
              <div className="font-display font-bold text-sm text-[#1C1917] truncate">
                {selectedTitle}
              </div>
              {selectedCreator && (
                <div className="text-xs font-serif text-[#66615C] truncate">
                  by {selectedCreator} {metadata.year ? `(${metadata.year})` : ''}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearSelected}
            className="text-xs font-display uppercase tracking-wider text-[#9C9589] hover:text-red-700 p-1.5 rounded transition-colors shrink-0 cursor-pointer"
            title="Clear and search another work"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#B45309] mb-1">
            DIRECT CLIENT LOOKUP ({entryType === 'comic_review' ? 'Google Books Comics' : entryType === 'book_review' ? 'Google Books API' : entryType === 'music_review' ? 'iTunes Albums API' : 'iTunes Podcast API'})
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9C9589] absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={
                entryType === 'comic_review'
                  ? 'Search comic series, graphic novel (e.g. Watchmen, Saga)...'
                  : entryType === 'book_review'
                  ? 'Search book title or author (e.g. Moby Dick, Cormac McCarthy)...'
                  : entryType === 'music_review'
                  ? 'Search album or artist (e.g. Blue Train, Radiohead)...'
                  : 'Search podcast title or host (e.g. Hardcore History)...'
              }
              className="w-full pl-9 pr-9 py-2 bg-[#FAF8F5] border border-[#DDD5C7] rounded text-xs font-serif text-[#1C1917] placeholder:text-[#9C9589] focus:outline-[#1E40AF]"
            />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-[#1E40AF] animate-spin absolute right-3 top-2.5" />
            )}
          </div>

          {/* Results Dropdown */}
          {isDropdownOpen && searchResults.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-[#FAF8F5] border border-[#DDD5C7] rounded shadow-lg divide-y divide-[#E5DFC5]">
              {searchResults.map((item, idx) => (
                <div
                  key={item.id || idx}
                  onClick={() => handleSelectItem(item)}
                  className="p-2.5 hover:bg-[#F3EFEA] cursor-pointer flex items-center gap-3 transition-colors"
                >
                  {item.coverUrl || item.artworkUrl ? (
                    <img
                      src={item.coverUrl || item.artworkUrl}
                      alt=""
                      className="w-8 h-11 object-cover border border-[#DDD5C7] shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-stone-200 flex items-center justify-center shrink-0">
                      <Search className="w-3.5 h-3.5 text-stone-500" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-semibold text-xs text-[#1C1917] truncate">
                      {item.title || item.series || item.podcastName}
                    </div>
                    <div className="text-[11px] font-serif text-[#66615C] truncate">
                      {item.author || item.writer || item.artist || item.creator}
                      {item.year ? ` (${item.year})` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Specialized Craft Metadata Fields */}
      {entryType === 'comic_review' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Series Title
            </label>
            <input
              type="text"
              value={metadata.series || ''}
              onChange={(e) => onMetadataChange({ series: e.target.value })}
              placeholder="e.g. The Sandman"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Issue / Arc / Vol
            </label>
            <input
              type="text"
              value={metadata.issueNumber || ''}
              onChange={(e) => onMetadataChange({ issueNumber: e.target.value })}
              placeholder="e.g. Vol. 1: Preludes"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Writer
            </label>
            <input
              type="text"
              value={metadata.writer || ''}
              onChange={(e) => onMetadataChange({ writer: e.target.value })}
              placeholder="e.g. Neil Gaiman"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Artist / Illustrator
            </label>
            <input
              type="text"
              value={metadata.artist || ''}
              onChange={(e) => onMetadataChange({ artist: e.target.value })}
              placeholder="e.g. Sam Kieth, Mike Dringenberg"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Publisher
            </label>
            <input
              type="text"
              value={metadata.publisher || ''}
              onChange={(e) => onMetadataChange({ publisher: e.target.value })}
              placeholder="e.g. DC / Vertigo"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Year
            </label>
            <input
              type="text"
              value={metadata.year || ''}
              onChange={(e) => onMetadataChange({ year: e.target.value })}
              placeholder="e.g. 1989"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Accessibility
            </label>
            <select
              value={metadata.accessibility || 'Accessible Standalone'}
              onChange={(e) => onMetadataChange({ accessibility: e.target.value })}
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            >
              <option value="Accessible Standalone">Accessible Standalone</option>
              <option value="Jumping-on Point">Jumping-on Point</option>
              <option value="Requires Prior Context">Requires Prior Context</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Previous Review Link
            </label>
            <input
              type="text"
              value={metadata.prevReviewLink || ''}
              onChange={(e) => onMetadataChange({ prevReviewLink: e.target.value })}
              placeholder="/slug-of-previous-issue"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
        </div>
      )}

      {entryType === 'book_review' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Book Title
            </label>
            <input
              type="text"
              value={metadata.title || ''}
              onChange={(e) => onMetadataChange({ title: e.target.value })}
              placeholder="e.g. The Brothers Karamazov"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Author
            </label>
            <input
              type="text"
              value={metadata.author || ''}
              onChange={(e) => onMetadataChange({ author: e.target.value })}
              placeholder="e.g. Fyodor Dostoevsky"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Translator (if any)
            </label>
            <input
              type="text"
              value={metadata.translator || ''}
              onChange={(e) => onMetadataChange({ translator: e.target.value })}
              placeholder="e.g. Pevear & Volokhonsky"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Publisher
            </label>
            <input
              type="text"
              value={metadata.publisher || ''}
              onChange={(e) => onMetadataChange({ publisher: e.target.value })}
              placeholder="e.g. Farrar, Straus and Giroux"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Year
            </label>
            <input
              type="text"
              value={metadata.year || ''}
              onChange={(e) => onMetadataChange({ year: e.target.value })}
              placeholder="e.g. 1880"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              ISBN
            </label>
            <input
              type="text"
              value={metadata.isbn || ''}
              onChange={(e) => onMetadataChange({ isbn: e.target.value })}
              placeholder="e.g. 9780374528379"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Page Count
            </label>
            <input
              type="text"
              value={metadata.pageCount || ''}
              onChange={(e) => onMetadataChange({ pageCount: e.target.value })}
              placeholder="e.g. 796"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Pacing
            </label>
            <select
              value={metadata.pacing || 'Deliberate'}
              onChange={(e) => onMetadataChange({ pacing: e.target.value })}
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            >
              <option value="Slow Burn">Slow Burn</option>
              <option value="Deliberate">Deliberate</option>
              <option value="Page-Turner">Page-Turner</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Standout Pull-Quote
            </label>
            <input
              type="text"
              value={metadata.pullQuote || ''}
              onChange={(e) => onMetadataChange({ pullQuote: e.target.value })}
              placeholder="A memorable line from the work..."
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
        </div>
      )}

      {entryType === 'music_review' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Album Title
            </label>
            <input
              type="text"
              value={metadata.title || ''}
              onChange={(e) => onMetadataChange({ title: e.target.value })}
              placeholder="e.g. A Love Supreme"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Artist / Band
            </label>
            <input
              type="text"
              value={metadata.artist || ''}
              onChange={(e) => onMetadataChange({ artist: e.target.value })}
              placeholder="e.g. John Coltrane"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Record Label
            </label>
            <input
              type="text"
              value={metadata.label || ''}
              onChange={(e) => onMetadataChange({ label: e.target.value })}
              placeholder="e.g. Impulse! Records"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Release Year
            </label>
            <input
              type="text"
              value={metadata.year || ''}
              onChange={(e) => onMetadataChange({ year: e.target.value })}
              placeholder="e.g. 1965"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Format
            </label>
            <select
              value={metadata.format || 'Vinyl'}
              onChange={(e) => onMetadataChange({ format: e.target.value })}
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            >
              <option value="Vinyl">Vinyl</option>
              <option value="Digital">Digital</option>
              <option value="CD">CD</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Sonic Neighbors / Tags
            </label>
            <input
              type="text"
              value={metadata.sonicNeighbors || ''}
              onChange={(e) => onMetadataChange({ sonicNeighbors: e.target.value })}
              placeholder="e.g. Modal Jazz, Spiritual Jazz, Post-Bop"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Key / Essential Tracks
            </label>
            <input
              type="text"
              value={metadata.essentialTracks || ''}
              onChange={(e) => onMetadataChange({ essentialTracks: e.target.value })}
              placeholder="e.g. Part 1: Acknowledgement, Part 3: Pursuance"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
        </div>
      )}

      {entryType === 'podcast_review' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Podcast Name
            </label>
            <input
              type="text"
              value={metadata.podcastName || ''}
              onChange={(e) => onMetadataChange({ podcastName: e.target.value })}
              placeholder="e.g. Hardcore History"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Host(s)
            </label>
            <input
              type="text"
              value={metadata.creator || ''}
              onChange={(e) => onMetadataChange({ creator: e.target.value })}
              placeholder="e.g. Dan Carlin"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Network / Studio
            </label>
            <input
              type="text"
              value={metadata.network || ''}
              onChange={(e) => onMetadataChange({ network: e.target.value })}
              placeholder="e.g. Independent / Wondery"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Style
            </label>
            <select
              value={metadata.style || 'Narrative'}
              onChange={(e) => onMetadataChange({ style: e.target.value })}
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            >
              <option value="Narrative">Narrative</option>
              <option value="Interview">Interview</option>
              <option value="Panel">Panel</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Best Starting Episode
            </label>
            <input
              type="text"
              value={metadata.startingEpisode || ''}
              onChange={(e) => onMetadataChange({ startingEpisode: e.target.value })}
              placeholder="e.g. Ep 50: Blueprint for Armageddon I"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Average Runtime
            </label>
            <input
              type="text"
              value={metadata.averageRuntime || ''}
              onChange={(e) => onMetadataChange({ averageRuntime: e.target.value })}
              placeholder="e.g. 3–4 hours"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
        </div>
      )}

      {/* Craft Sub-Ratings Section */}
      <div className="pt-3 border-t border-[#DDD5C7] bg-[#FAF8F5] p-3 rounded">
        <div className="text-[10px] font-display font-bold uppercase tracking-widest text-[#B45309] mb-2.5">
          CRAFT SUB-RATINGS & CRITICAL VERDICT
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {entryType === 'comic_review' && (
            <>
              {renderStarRating('Story & Script', metadata.storyRating, (val) =>
                onMetadataChange({ storyRating: val })
              )}
              {renderStarRating('Art & Visuals', metadata.artRating, (val) =>
                onMetadataChange({ artRating: val })
              )}
              {renderStarRating('Overall Verdict', metadata.rating, (val) =>
                onMetadataChange({ rating: val })
              )}
            </>
          )}

          {entryType === 'book_review' && (
            <>
              {renderStarRating('Prose & Voice', metadata.proseRating, (val) =>
                onMetadataChange({ proseRating: val })
              )}
              {renderStarRating('Narrative & Pacing', metadata.narrativeRating, (val) =>
                onMetadataChange({ narrativeRating: val })
              )}
              {renderStarRating('Overall Verdict', metadata.rating, (val) =>
                onMetadataChange({ rating: val })
              )}
            </>
          )}

          {entryType === 'music_review' && (
            <>
              {renderStarRating('Songwriting & Composition', metadata.songwritingRating, (val) =>
                onMetadataChange({ songwritingRating: val })
              )}
              {renderStarRating('Production & Sound', metadata.productionRating, (val) =>
                onMetadataChange({ productionRating: val })
              )}
              {renderStarRating('Overall Verdict', metadata.rating, (val) =>
                onMetadataChange({ rating: val })
              )}
            </>
          )}

          {entryType === 'podcast_review' && (
            <>
              {renderStarRating('Research & Rigor', metadata.researchRating, (val) =>
                onMetadataChange({ researchRating: val })
              )}
              {renderStarRating('Audio Craft & Pacing', metadata.audioCraftRating, (val) =>
                onMetadataChange({ audioCraftRating: val })
              )}
              {renderStarRating('Overall Verdict', metadata.rating, (val) =>
                onMetadataChange({ rating: val })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
