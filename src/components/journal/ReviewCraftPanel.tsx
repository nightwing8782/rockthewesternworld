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
  Loader2,
  FileText,
  Sparkles,
} from 'lucide-react';

interface ReviewCraftPanelProps {
  entryType: EntryType;
  metadata: EntryMetadata;
  onMetadataChange: (newMeta: Partial<EntryMetadata>, autoSave?: boolean) => void;
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
  const [isChangingSelection, setIsChangingSelection] = useState(false);
  const [seoFeedback, setSeoFeedback] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isReview = ['book_review', 'comic_review', 'music_review', 'podcast_review'].includes(entryType);

  useEffect(() => {
    setSearchQuery('');
    setSearchResults([]);
    setIsDropdownOpen(false);
    setIsChangingSelection(false);
    setSeoFeedback(null);
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
    setIsChangingSelection(false);

    if (entryType === 'comic_review') {
      const cover = item.cover_image_url || item.coverUrl || metadata.cover_image_url || metadata.coverUrl;
      const updated: Partial<EntryMetadata> = {
        series: item.series || item.title || '',
        writer: item.writer || metadata.writer || '',
        artist: item.artist || metadata.artist || '',
        publisher: item.publisher || 'Independent / Creator-Owned',
        year: item.year || '',
        issue_count: item.issue_count || undefined,
        comic_vine_id: item.comic_vine_id || item.id || undefined,
        cover_image_url: cover,
        coverUrl: cover,
      };
      onMetadataChange(updated, true);
      if (onAutoTitle && (item.series || item.title)) {
        onAutoTitle(`Review: ${item.series || item.title}`);
      }
    } else if (entryType === 'book_review') {
      const cover = item.cover_image_url || item.coverUrl || metadata.cover_image_url || metadata.coverUrl;
      const updated: Partial<EntryMetadata> = {
        title: item.title || '',
        author: item.author || item.creator || 'Unknown',
        publisher: item.publisher || '',
        year: item.year || '',
        isbn: item.isbn || '',
        page_count: item.page_count || item.pageCount || undefined,
        pageCount: item.page_count || item.pageCount || undefined,
        cover_image_url: cover,
        coverUrl: cover,
        openLibraryKey: item.openLibraryKey || undefined,
      };
      onMetadataChange(updated, true);
      if (onAutoTitle && item.title) {
        onAutoTitle(`Review: ${item.title} by ${item.author || 'Author'}`);
      }
    } else if (entryType === 'music_review') {
      const cover = item.coverUrl || item.cover_image_url || metadata.coverUrl;
      const updated: Partial<EntryMetadata> = {
        title: item.title || '',
        artist: item.artist || '',
        label: item.label || '',
        year: item.year || '',
        cover_image_url: cover,
        coverUrl: cover,
      };
      onMetadataChange(updated, true);
      if (onAutoTitle && item.title) {
        onAutoTitle(`Review: ${item.title} — ${item.artist || 'Artist'}`);
      }
    } else if (entryType === 'podcast_review') {
      const cover = item.artworkUrl || item.coverUrl || metadata.artworkUrl || metadata.coverUrl;
      const updated: Partial<EntryMetadata> = {
        podcastName: item.podcastName || item.title || '',
        creator: item.creator || '',
        network: item.network || item.creator || '',
        artworkUrl: cover,
        cover_image_url: cover,
        coverUrl: cover,
      };
      onMetadataChange(updated, true);
      if (onAutoTitle && item.podcastName) {
        onAutoTitle(`Podcast Review: ${item.podcastName}`);
      }
    }
  };

  const handleClearSelected = () => {
    setIsChangingSelection(false);
    setIsDropdownOpen(false);
    setSearchQuery('');
    onMetadataChange(
      {
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
        page_count: undefined,
        pageCount: undefined,
        issue_count: undefined,
        comic_vine_id: undefined,
        coverUrl: undefined,
        cover_image_url: undefined,
        artworkUrl: undefined,
        openLibraryKey: undefined,
      },
      true
    );
  };

  const getSelectedTitle = () => {
    return metadata.series || metadata.title || metadata.podcastName || '';
  };

  const getSelectedCreator = () => {
    if (entryType === 'comic_review') {
      const parts = [];
      if (metadata.writer) parts.push(`${metadata.writer} (Writer)`);
      if (metadata.artist) parts.push(`${metadata.artist} (Art)`);
      if (metadata.inker) parts.push(`${metadata.inker} (Inks)`);
      if (metadata.colorist) parts.push(`${metadata.colorist} (Colors)`);
      if (metadata.letterer) parts.push(`${metadata.letterer} (Letters)`);
      if (parts.length > 0) return parts.join(' • ');
    }
    return metadata.author || metadata.writer || metadata.artist || metadata.creator || '';
  };

  const handleGenerateSeoTitleAndExcerpt = () => {
    const seriesTitle = metadata.series || metadata.title || metadata.podcastName || '';
    const issueNum = metadata.issueNumber ? `#${metadata.issueNumber}` : '';
    const writer = metadata.writer || metadata.author || '';
    const artist = metadata.artist || '';
    const publisher = metadata.publisher || metadata.network || metadata.label || '';
    const year = metadata.year ? `(${metadata.year})` : '';

    let generatedTitle = '';
    let generatedExcerpt = '';

    if (entryType === 'comic_review') {
      const artScore = metadata.artRating || 0;
      const storyScore = metadata.storyRating || 0;
      const overall = metadata.rating || 0;

      if (artScore === 5 && artist) {
        generatedTitle = `${artist}’s Visual Triumph: ${seriesTitle} ${issueNum} Review ${publisher ? `(${publisher} ${metadata.year || ''})` : year}`.trim();
      } else if (writer && artist) {
        generatedTitle = `${seriesTitle} ${issueNum} Comic Review: ${writer} and ${artist} Deliver for ${publisher || 'Fans'}`.trim();
      } else if (writer) {
        generatedTitle = `${seriesTitle} ${issueNum} Review: ${writer}’s Run ${publisher ? `at ${publisher}` : ''}`.trim();
      } else {
        generatedTitle = `${seriesTitle} ${issueNum} Comic Review ${year}`.trim();
      }

      // Build creator credits line
      const credits = [];
      if (writer) credits.push(`Writer: ${writer}`);
      if (artist) credits.push(`Art: ${artist}`);
      if (metadata.inker) credits.push(`Inks: ${metadata.inker}`);
      if (metadata.colorist) credits.push(`Colors: ${metadata.colorist}`);
      if (metadata.letterer) credits.push(`Letters: ${metadata.letterer}`);
      const creditsStr = credits.join(' · ');

      generatedExcerpt = `Complete critical review of ${seriesTitle} ${issueNum} ${publisher ? `(${publisher} ${metadata.year || ''})` : ''}. ${creditsStr ? `[${creditsStr}]. ` : ''}${storyScore ? `Story: ${storyScore}/5, ` : ''}${artScore ? `Art: ${artScore}/5. ` : ''}${overall ? `Overall Verdict: ${overall}/5.` : ''}`.trim();
    } else if (entryType === 'book_review') {
      generatedTitle = `Review: ${seriesTitle} by ${writer} ${year}`.trim();
      generatedExcerpt = `Critical analysis and review of ${seriesTitle} by ${writer}${publisher ? ` (${publisher})` : ''}.`;
    } else if (entryType === 'music_review') {
      generatedTitle = `Album Review: ${seriesTitle} — ${metadata.artist || 'Artist'}`.trim();
      generatedExcerpt = `Sonic review and breakdown of ${seriesTitle} by ${metadata.artist || 'Artist'}${publisher ? ` (${publisher})` : ''}.`;
    } else if (entryType === 'podcast_review') {
      generatedTitle = `Podcast Review: ${seriesTitle}`.trim();
      generatedExcerpt = `Audio analysis and critical evaluation of ${seriesTitle}${metadata.creator ? ` hosted by ${metadata.creator}` : ''}.`;
    }

    if (generatedTitle && onAutoTitle) {
      onAutoTitle(generatedTitle);
    }
    if (generatedExcerpt) {
      onMetadataChange({
        kicker: entryType === 'comic_review' ? 'OFF THE COMIC RACK' : entryType === 'book_review' ? 'A LITERAL CORNER' : 'CULTURAL CRITIQUE',
        excerpt: generatedExcerpt,
        deck: generatedExcerpt,
      }, true);
    }

    setSeoFeedback(`Applied: "${generatedTitle}"`);
    setTimeout(() => setSeoFeedback(null), 4500);
  };

  const handleApplyThreeActTemplate = () => {
    let template = '';
    if (entryType === 'comic_review') {
      const credits = [];
      if (metadata.series) credits.push(`<strong>Series / Work:</strong> ${metadata.series} ${metadata.issueNumber ? `#${metadata.issueNumber}` : ''}`);
      if (metadata.writer) credits.push(`<strong>Writer:</strong> ${metadata.writer}`);
      if (metadata.artist) credits.push(`<strong>Penciller / Artist:</strong> ${metadata.artist}`);
      if (metadata.inker) credits.push(`<strong>Inker:</strong> ${metadata.inker}`);
      if (metadata.colorist) credits.push(`<strong>Colorist:</strong> ${metadata.colorist}`);
      if (metadata.letterer) credits.push(`<strong>Letterer:</strong> ${metadata.letterer}`);
      if (metadata.publisher) credits.push(`<strong>Publisher:</strong> ${metadata.publisher} ${metadata.year ? `(${metadata.year})` : ''}`);
      if (metadata.accessibility) credits.push(`<strong>Accessibility:</strong> ${metadata.accessibility}`);
      
      const scores = [];
      if (metadata.storyRating) scores.push(`Story: ${metadata.storyRating}/5`);
      if (metadata.artRating) scores.push(`Art: ${metadata.artRating}/5`);
      if (metadata.rating) scores.push(`Overall Verdict: ${metadata.rating}/5`);
      if (scores.length > 0) credits.push(`<strong>Craft Scores:</strong> ${scores.join(' · ')}`);

      const creditsBlock = credits.length > 0
        ? `<blockquote><p>${credits.join('<br/>')}</p></blockquote><p></p>`
        : '';

      template = `${creditsBlock}<h2>The Script &amp; Narrative Craft ${metadata.storyRating ? `(${metadata.storyRating}/5)` : ''}</h2><p>Examine the narrative arc, dialogue, character dynamics, and thematic pacing...</p><h2>Visual Storytelling, Line Art &amp; Color ${metadata.artRating ? `(${metadata.artRating}/5)` : ''}</h2><p>Evaluate the linework, panel sequencing, inking, color saturation, and visual mood...</p><h2>Critical Verdict &amp; Cultural Resonance ${metadata.rating ? `(${metadata.rating}/5)` : ''}</h2><p>Synthesize the complete work, standalone accessibility, and deliver your overarching assessment...</p>`;
    } else if (entryType === 'book_review') {
      template = `<h2>The Voice &amp; Prose</h2><p>Analyze the sentence craft, stylistic texture, authorial voice, and register of the work...</p><h2>Narrative &amp; Thematic Arc</h2><p>Explore the architecture of the plot, characters, and philosophical inquiries...</p><h2>The Complete Work</h2><p>Synthesize the book's lasting impression and deliver your critical verdict...</p>`;
    } else if (entryType === 'music_review') {
      template = `<h2>The Sonic Landscape</h2><p>Analyze the acoustic textures, production depth, instrumentation, and sonic atmosphere...</p><h2>Writing &amp; Composition</h2><p>Examine the melody, lyricism, arrangements, and thematic progression of the tracks...</p><h2>The Complete Work</h2><p>Synthesize the album's place in the artist's catalog and deliver your critical verdict...</p>`;
    } else if (entryType === 'podcast_review') {
      template = `<h2>Editorial Quality &amp; Rigor</h2><p>Evaluate the reporting depth, host chemistry, storytelling rigor, and perspective...</p><h2>Pacing &amp; Audio Craft</h2><p>Analyze the sound design, scoring, editing cadence, and listening momentum...</p><h2>The Complete Work</h2><p>Summarize who this series is essential for and deliver your critical verdict...</p>`;
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
  const isWorkSelected = Boolean(selectedTitle);
  const activeCover = metadata.cover_image_url || metadata.coverUrl || metadata.artworkUrl;

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

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleGenerateSeoTitleAndExcerpt}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF8F5] hover:bg-[#FAF8F5] text-[#1E40AF] border border-[#BFDBFE] rounded text-[11px] font-display uppercase tracking-wider font-bold transition-colors shadow-2xs cursor-pointer"
            title="Generate optimized editorial headline, SEO slug, and GEO excerpts based on craft ledger"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>⚡ Generate SEO Title &amp; Excerpt</span>
          </button>

          <button
            type="button"
            onClick={handleApplyThreeActTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] rounded text-[11px] font-display uppercase tracking-wider font-bold transition-colors shadow-2xs cursor-pointer"
            title="Insert 3-act review headings and full creative team credits into editor"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Apply 3-Act Structure</span>
          </button>
        </div>
      </div>

      {/* SEO Generation Confirmation Toast */}
      {seoFeedback && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-900 font-serif flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="font-bold font-display uppercase tracking-wider text-[10px] text-emerald-800 block">
              SEO Headline &amp; Deck Applied to Canvas
            </span>
            <span className="truncate block font-semibold">{seoFeedback}</span>
          </div>
        </div>
      )}

      {/* Selected Confirmation Card OR Search Input */}
      {isWorkSelected && !isChangingSelection ? (
        <div className="p-3.5 bg-[#FAF8F5] border border-emerald-400/80 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3.5 min-w-0">
            {activeCover ? (
              <img
                src={activeCover}
                alt=""
                className="w-12 h-16 object-cover border border-[#DDD5C7] shrink-0 rounded shadow-xs"
              />
            ) : (
              <div className="w-12 h-16 bg-[#EAE4D7] text-[#44403C] flex items-center justify-center rounded shrink-0 border border-[#DDD5C7]">
                <CheckCircle2 className="w-6 h-6 text-emerald-700" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[10px] font-display uppercase tracking-widest font-bold text-emerald-800 flex items-center gap-1 mb-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />
                <span>Locked Work</span>
              </div>
              <div className="font-display font-bold text-sm sm:text-base text-[#1C1917] truncate">
                {selectedTitle} {metadata.year ? `(${metadata.year})` : ''}
              </div>
              <div className="text-xs font-serif text-[#66615C] truncate mt-0.5">
                {selectedCreator ? `by ${selectedCreator}` : ''}
                {selectedCreator && metadata.publisher ? ` • ` : ''}
                {metadata.publisher ? `${metadata.publisher}` : ''}
                {metadata.issue_count ? ` • ${metadata.issue_count} issues` : ''}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setIsChangingSelection(true)}
              className="px-2.5 py-1 text-xs font-display uppercase tracking-wider font-semibold text-[#1E40AF] hover:bg-[#EEF2FF] border border-[#BFDBFE] rounded transition-colors cursor-pointer"
            >
              Change Selection
            </button>
            <button
              type="button"
              onClick={handleClearSelected}
              className="px-2.5 py-1 text-xs font-display uppercase tracking-wider font-semibold text-[#9C9589] hover:text-red-700 hover:bg-red-50 border border-transparent rounded transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div className="relative space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#B45309]">
              {entryType === 'comic_review' && 'COMIC & GRAPHIC NOVEL SEARCH (AUTO-FILLS WRITER, ARTIST, PUBLISHER & COVER)'}
              {entryType === 'book_review' && 'OPEN LIBRARY SEARCH (AUTO-FILLS AUTHOR, PUBLISHER, ISBN & COVER)'}
              {entryType === 'music_review' && 'ITUNES ALBUMS API'}
              {entryType === 'podcast_review' && 'ITUNES PODCASTS API'}
            </label>
            {isChangingSelection && (
              <button
                type="button"
                onClick={() => {
                  setIsChangingSelection(false);
                  setIsDropdownOpen(false);
                }}
                className="text-[10px] font-display uppercase tracking-wider text-[#66615C] hover:text-[#1C1917] underline cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9C9589] absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={
                entryType === 'comic_review'
                  ? 'Type comic title or series name (e.g. Watchmen, Saga, Sandman, Batman, Maus)...'
                  : entryType === 'book_review'
                  ? 'Type book title, author, or ISBN (e.g. Moby Dick, Cormac McCarthy)...'
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
            <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-72 overflow-y-auto bg-[#FAF8F5] border border-[#DDD5C7] rounded shadow-lg divide-y divide-[#E5DFC5]">
              {searchResults.map((item, idx) => {
                const thumb = item.cover_image_url || item.coverUrl || item.artworkUrl;
                const itemTitle = item.series || item.title || item.podcastName;
                const itemAuthor = item.author || item.creator || item.writer || item.artist;
                return (
                  <div
                    key={item.id || idx}
                    onClick={() => handleSelectItem(item)}
                    className="p-3 hover:bg-[#F3EFEA] cursor-pointer flex items-center gap-3.5 transition-colors"
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        className="w-12 h-16 object-cover border border-[#DDD5C7] shrink-0 rounded shadow-2xs"
                      />
                    ) : (
                      <div className="w-12 h-16 bg-stone-200 flex items-center justify-center shrink-0 rounded">
                        <Search className="w-4 h-4 text-stone-500" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-semibold text-xs sm:text-sm text-[#1C1917] truncate">
                        {itemTitle} {item.year ? `(${item.year})` : ''}
                      </div>
                      <div className="text-[11px] font-serif text-[#66615C] truncate mt-0.5">
                        {itemAuthor ? `by ${itemAuthor}` : ''}
                        {item.publisher ? ` • ${item.publisher}` : ''}
                        {item.issue_count ? ` • ${item.issue_count} issues` : ''}
                        {item.isbn ? ` • ISBN: ${item.isbn}` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quiet Manual Fallback Link */}
          <div className="flex items-center justify-between pt-0.5">
            <button
              type="button"
              onClick={() => {
                setIsDropdownOpen(false);
                setIsChangingSelection(false);
              }}
              className="text-[11px] font-serif italic text-[#78716C] hover:text-[#1E40AF] transition-colors cursor-pointer"
            >
              Fill in details manually →
            </button>
          </div>
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
              Inker (if separate)
            </label>
            <input
              type="text"
              value={metadata.inker || ''}
              onChange={(e) => onMetadataChange({ inker: e.target.value })}
              placeholder="e.g. Klaus Janson"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Colorist
            </label>
            <input
              type="text"
              value={metadata.colorist || ''}
              onChange={(e) => onMetadataChange({ colorist: e.target.value })}
              placeholder="e.g. Lynn Varley, Jordie Bellaire"
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
              Letterer
            </label>
            <input
              type="text"
              value={metadata.letterer || ''}
              onChange={(e) => onMetadataChange({ letterer: e.target.value })}
              placeholder="e.g. Todd Klein, Chris Eliopoulos"
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
              value={metadata.page_count || metadata.pageCount || ''}
              onChange={(e) =>
                onMetadataChange({
                  page_count: e.target.value,
                  pageCount: e.target.value,
                })
              }
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
          CRAFT SUB-RATINGS &amp; CRITICAL VERDICT
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
