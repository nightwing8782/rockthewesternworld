'use client';

import React, { useState } from 'react';
import { X, Save, Edit3, Loader2 } from 'lucide-react';
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!book) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950">
          <h2 className="font-serif text-lg font-bold tracking-wide text-amber-400 flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Edit Book Metadata
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-1 rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-widest text-stone-400">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-sm text-stone-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Series & Issue */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-widest text-stone-400">
                Series / Collection
              </label>
              <input
                type="text"
                value={series}
                onChange={(e) => setSeries(e.target.value)}
                placeholder="e.g. Batman (2016)"
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-sm text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-widest text-stone-400">
                Issue #
              </label>
              <input
                type="number"
                step="any"
                value={issueNumber}
                onChange={(e) => setIssueNumber(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-sm text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Author / Creator */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-widest text-stone-400">
              Author / Writer / Artist
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Neil Gaiman, Frank Miller"
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-sm text-stone-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Reading Direction */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-widest text-stone-400">
              Reading Direction
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReadingDirection('ltr')}
                className={`py-2 px-3 rounded-lg border text-xs font-mono uppercase tracking-wider transition-colors ${
                  readingDirection === 'ltr'
                    ? 'border-amber-600 bg-amber-950/40 text-amber-300 font-bold'
                    : 'border-stone-800 bg-stone-950 text-stone-400'
                }`}
              >
                LTR (Western)
              </button>
              <button
                type="button"
                onClick={() => setReadingDirection('rtl')}
                className={`py-2 px-3 rounded-lg border text-xs font-mono uppercase tracking-wider transition-colors ${
                  readingDirection === 'rtl'
                    ? 'border-amber-600 bg-amber-950/40 text-amber-300 font-bold'
                    : 'border-stone-800 bg-stone-950 text-stone-400'
                }`}
              >
                RTL (Manga)
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-widest text-stone-400">
              Synopsis / Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-sm text-stone-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-stone-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-mono uppercase rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-bold text-xs uppercase tracking-widest rounded-lg transition-colors flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
