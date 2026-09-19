'use client';

import React, { useState } from 'react';
import { X, Save, Edit3, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
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
  const [searchingCloud, setSearchingCloud] = useState(false);
  const [cloudMatchFound, setCloudMatchFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!book) return null;

  const handleAutoFetchCloud = async () => {
    const searchTerm = series && series !== 'Standalone' ? `${series} ${title}` : title;
    setSearchingCloud(true);
    setError(null);
    setCloudMatchFound(false);

    try {
      const cleanQ = encodeURIComponent(searchTerm.replace(/[^a-zA-Z0-9\s]/g, ' ').trim());
      const res = await fetch(`https://openlibrary.org/search.json?q=${cleanQ}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data.docs && data.docs.length > 0) {
          const doc = data.docs[0];
          if (doc.title) setTitle(doc.title);
          if (doc.author_name && doc.author_name.length > 0) setAuthor(doc.author_name.join(', '));
          if (doc.first_sentence && doc.first_sentence.length > 0) {
            setDescription(doc.first_sentence[0]);
          }
          setCloudMatchFound(true);
        } else {
          setError('No cloud matches found for this title. You can still enter details manually.');
        }
      }
    } catch (e: any) {
      setError('Could not connect to book metadata service.');
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
          {/* Quick Auto-Fetch Cloud Banner */}
          <div className="flex items-center justify-between p-3 bg-amber-100 rounded-2xl border-2 border-[#111827] shadow-[2px_2px_0_#111827]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF4757]" />
              <span className="text-xs font-black uppercase tracking-wide text-[#111827]">
                Online Metadata Lookup:
              </span>
            </div>
            <button
              type="button"
              disabled={searchingCloud}
              onClick={handleAutoFetchCloud}
              className="px-3 py-1.5 bg-[#FFDE59] hover:bg-[#f3cb30] disabled:opacity-50 text-[#111827] font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#111827] flex items-center gap-1.5 transition-all"
            >
              {searchingCloud ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Fetch</span>
                </>
              )}
            </button>
          </div>

          {cloudMatchFound && (
            <div className="p-2.5 rounded-xl bg-emerald-100 border-2 border-[#2ED573] text-emerald-900 font-bold text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2ED573] shrink-0" />
              <span>Matching book metadata found & applied! Review and click Save.</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-100 border-2 border-[#FF4757] text-[#FF4757] font-bold text-xs">
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
