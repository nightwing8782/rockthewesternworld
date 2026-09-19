'use client';

import React from 'react';
import { X, Layers, BookOpen, CheckCircle2, Download, Trash2, Edit3 } from 'lucide-react';
import { SeriesGroup, TrophyBook } from '@/types/trophy';
import BookCard from './BookCard';

interface SeriesPickerModalProps {
  series: SeriesGroup | null;
  onClose: () => void;
  onOpenBook: (book: TrophyBook) => void;
  onEditMetadata?: (book: TrophyBook) => void;
  onToggleOffline?: (book: TrophyBook) => void;
  onDelete?: (book: TrophyBook) => void;
}

export default function SeriesPickerModal({
  series,
  onClose,
  onOpenBook,
  onEditMetadata,
  onToggleOffline,
  onDelete,
}: SeriesPickerModalProps) {
  if (!series) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden text-stone-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-600/40 text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-amber-300 tracking-wide">
                {series.seriesName}
              </h2>
              <p className="text-xs font-mono text-stone-400 uppercase tracking-wider">
                {series.totalIssues} {series.totalIssues === 1 ? 'Issue' : 'Issues'} • {series.completedIssues} Completed
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-2 rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Issue Grid */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {series.books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onOpen={(b) => {
                  onClose();
                  onOpenBook(b);
                }}
                onEditMetadata={onEditMetadata}
                onToggleOffline={onToggleOffline}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-stone-800 bg-stone-950/80 flex justify-between items-center text-xs font-mono text-stone-500">
          <span>Trophy Vault Collection</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
