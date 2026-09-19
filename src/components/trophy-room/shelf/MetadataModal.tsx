'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, Loader2, Sparkles, CheckCircle2, Search, Globe } from 'lucide-react';
import { TrophyBook, ReadingDirection } from '@/types/trophy';
import { createClient } from '@/lib/supabase/client';

interface MetadataModalProps {
  book: TrophyBook | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function MetadataModal({
  book,
  onClose,
  onSaved,
}: MetadataModalProps) {
  const [title, setTitle] = useState(book?.title || '');
  const [series, setSeries] = useState(book?.series || '');
  const [issueNumber, setIssueNumber] = useState(book?.issue_number || 1);
  const [author, setAuthor] = useState(book?.author || '');
  const [description, setDescription] = useState(book?.description || '');
  const [readingDirection, setReadingDirection] = useState<ReadingDirection>(
    book?.reading_direction || 'ltr'
  );
  const [customSearchQuery, setCustomSearchQuery] = useState('');
  const [searchingCloud, setSearchingCloud] = useState(false);
  const [cloudMatchFound, setCloudMatchFound] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state whenever active book changes
  useEffect(() => {
    if (book) {
      setTitle(book.title || '');
      setSeries(book.series || '');
      setIssueNumber(book.issue_number || 1);
      setAuthor(book.author || '');
      setDescription(book.description || '');
      setReadingDirection(book.reading_direction || 'ltr');
      setCustomSearchQuery(book.series && book.series !== 'Standalone' ? `${book.series}` : book.title || '');
      setError(null);
      setCloudMatchFound(null);
      setSearchingCloud(false);
    }
  }, [book]);

  if (!book) return null;

  const cleanSearchTerm = (str: string) => {
    return str
      .replace(/\.(cbz|cbr|epub|pdf|zip)$/i, '')
      .replace(/\[.*?\]/g, ' ')
      .replace(/\((?!19\d\d|20\d\d).*?\)/g, ' ')
      .replace(/\b(?:digital|zone|empire|minutemen|scanner|scan|webrip|nov|c2c)\b/gi, ' ')
      .replace(/\b(?:vol(?:ume)?\.?\s*\d+|#\s*\d+|\bv\d+\b)/gi, ' ')
      .replace(/[-_:]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleAutoFetchCloud = async () => {
    const rawSearch = customSearchQuery.trim() || (series && series !== 'Standalone' ? series : title);
    const cleanedSearch = cleanSearchTerm(rawSearch);
    if (!cleanedSearch) {
      setError('Please enter a title or series name to search.');
      return;
    }

    setSearchingCloud(true);
    setError(null);
    setCloudMatchFound(null);

    try {
      // 1. First attempt: Google Books API (superior for comics & graphic novels)
      const gBooksRes = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleanedSearch)}&maxResults=1`
      );

      if (gBooksRes.ok) {
        const gData = await gBooksRes.json();
        if (gData.items && gData.items.length > 0) {
          const info = gData.items[0].volumeInfo;
          if (info.title) {
            // Keep series clean and append title
            if (!series || series === 'Standalone') {
              setSeries(info.title);
            }
          }
          if (info.authors && info.authors.length > 0) {
            setAuthor(info.authors.join(', '));
          }
          if (info.description) {
            setDescription(info.description.replace(/<[^>]*>/g, ''));
          }
          setCloudMatchFound(`Matched on Google Books: "${info.title}" (${info.authors ? info.authors.join(', ') : 'Various'})`);
          setSearchingCloud(false);
          return;
        }
      }

      // 2. Second attempt: Open Library API fallback
      const olRes = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(cleanedSearch)}&limit=1`
      );

      if (olRes.ok) {
        const olData = await olRes.json();
        if (olData.docs && olData.docs.length > 0) {
          const doc = olData.docs[0];
          if (doc.title) {
            if (!series || series === 'Standalone') setSeries(doc.title);
          }
          if (doc.author_name && doc.author_name.length > 0) {
            setAuthor(doc.author_name.slice(0, 3).join(', '));
          }
          if (doc.first_sentence && doc.first_sentence.length > 0) {
            setDescription(doc.first_sentence[0]);
          }
          setCloudMatchFound(`Matched on Open Library: "${doc.title}"`);
          setSearchingCloud(false);
          return;
        }
      }

      setError(`No matching metadata found for "${cleanedSearch}". You can edit the search box above or type details manually.`);
    } catch (e: any) {
      console.error('[MetadataModal] Cloud lookup error:', e);
      setError('Could not connect to online book database. Please verify your internet connection.');
    } finally {
      setSearchingCloud(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('trophy_books')
        .update({
          title: title.trim() || book.title,
          series: series.trim() || 'Standalone',
          issue_number: Number(issueNumber) || 1,
          author: author.trim() || null,
          description: description.trim() || null,
          reading_direction: readingDirection,
        })
        .eq('id', book.id);

      if (updateError) throw updateError;

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Error updating metadata:', err);
      setError(err.message || 'Failed to update metadata.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border-4 border-[#111827] rounded-3xl shadow-[8px_8px_0_#111827] max-w-lg w-full overflow-hidden text-[#111827]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-4 border-[#111827] bg-[#FFDE59]">
          <h2 className="text-xl font-black uppercase tracking-wide text-[#111827] flex items-center gap-2">
            <Edit3 className="w-5 h-5 stroke-[2.5]" />
            Edit Book Metadata
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white border-2 border-[#111827] text-[#111827] hover:bg-[#FF4757] hover:text-white shadow-[2px_2px_0_#111827] transition-colors"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto bg-paper-texture">
          {/* Enhanced Auto-Fetch Cloud Banner */}
          <div className="p-3.5 bg-gradient-to-r from-amber-100 via-[#FFDE59]/40 to-emerald-100 rounded-2xl border-3 border-[#111827] shadow-[3px_3px_0_#111827] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF4757]" />
                <span className="text-xs font-black uppercase tracking-wide text-[#111827]">
                  Cloud Metadata Lookup (Google Books & Open Library)
                </span>
              </div>
              <span className="comic-stamp text-[9px] px-1.5 py-0.2 rounded bg-white text-[#111827]">
                Live API
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={customSearchQuery}
                  onChange={(e) => setCustomSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAutoFetchCloud();
                    }
                  }}
                  placeholder="Search series or book title (e.g. Saga, Peanuts, Batman)..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white text-[#111827] text-xs font-bold rounded-xl border-2 border-[#111827] shadow-[1px_1px_0_#111827] focus:outline-none focus:ring-1 focus:ring-[#FF4757]"
                />
              </div>

              <button
                type="button"
                disabled={searchingCloud}
                onClick={handleAutoFetchCloud}
                className="px-3.5 py-1.5 bg-[#FF4757] hover:bg-[#e03848] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#111827] flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
              >
                {searchingCloud ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5" />
                    <span>Auto-Fetch</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {cloudMatchFound && (
            <div className="p-2.5 rounded-xl bg-emerald-100 border-2 border-[#2ED573] text-emerald-950 font-bold text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-[#2ED573] shrink-0" />
              <span className="truncate">{cloudMatchFound}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-100 border-2 border-[#FF4757] text-[#FF4757] font-bold text-xs animate-in fade-in duration-150">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white border-3 border-[#111827] rounded-xl text-sm font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FFDE59] shadow-[2px_2px_0_#111827]"
            />
          </div>

          {/* Series & Issue */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
                Series / Collection
              </label>
              <input
                type="text"
                value={series}
                onChange={(e) => setSeries(e.target.value)}
                placeholder="e.g. Batman (2016)"
                className="w-full px-3.5 py-2.5 bg-white border-3 border-[#111827] rounded-xl text-sm font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FFDE59] shadow-[2px_2px_0_#111827]"
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
                onChange={(e) => setIssueNumber(parseFloat(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white border-3 border-[#111827] rounded-xl text-sm font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FFDE59] shadow-[2px_2px_0_#111827]"
              />
            </div>
          </div>

          {/* Author */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
              Author / Creator
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Neil Gaiman, Frank Miller"
              className="w-full px-3.5 py-2.5 bg-white border-3 border-[#111827] rounded-xl text-sm font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FFDE59] shadow-[2px_2px_0_#111827]"
            />
          </div>

          {/* Reading Direction */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
              Reading Direction
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReadingDirection('ltr')}
                className={`py-2 px-3 rounded-xl border-2 border-[#111827] text-xs font-black uppercase tracking-wider transition-all ${
                  readingDirection === 'ltr'
                    ? 'bg-[#111827] text-[#FFDE59] shadow-[2px_2px_0_#FF4757]'
                    : 'bg-white text-slate-700 hover:bg-slate-100 shadow-[2px_2px_0_#111827]'
                }`}
              >
                LTR (Western)
              </button>
              <button
                type="button"
                onClick={() => setReadingDirection('rtl')}
                className={`py-2 px-3 rounded-xl border-2 border-[#111827] text-xs font-black uppercase tracking-wider transition-all ${
                  readingDirection === 'rtl'
                    ? 'bg-[#111827] text-[#FFDE59] shadow-[2px_2px_0_#FF4757]'
                    : 'bg-white text-slate-700 hover:bg-slate-100 shadow-[2px_2px_0_#111827]'
                }`}
              >
                RTL (Manga)
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
              Synopsis / Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border-3 border-[#111827] rounded-xl text-sm font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FFDE59] shadow-[2px_2px_0_#111827]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t-2 border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#111827] text-xs font-black uppercase tracking-wider rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#111827] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#2ED573] hover:bg-[#26af5f] disabled:opacity-50 text-[#111827] font-black text-xs uppercase tracking-wider rounded-xl border-3 border-[#111827] shadow-[3px_3px_0_#111827] transition-all flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 stroke-[2.5]" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
