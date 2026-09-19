'use client';

import React from 'react';
import { X, Layers, CheckCircle2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border-4 border-[#111827] rounded-3xl shadow-[8px_8px_0_#111827] max-w-5xl w-full max-h-[85vh] flex flex-col overflow-hidden text-[#111827]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-4 border-[#111827] bg-[#FFDE59] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-white border-2 border-[#111827] shadow-[2px_2px_0_#111827]">
              <Layers className="w-5 h-5 text-[#111827]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-[#111827]">
                {series.seriesName}
              </h2>
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {series.totalIssues} {series.totalIssues === 1 ? 'Issue' : 'Issues'} • {series.completedIssues} Completed
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white border-2 border-[#111827] text-[#111827] hover:bg-[#FF4757] hover:text-white shadow-[2px_2px_0_#111827] transition-colors"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body: Issue Grid */}
        <div className="p-6 overflow-y-auto flex-1 bg-paper-texture">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
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
        <div className="px-6 py-3 border-t-3 border-[#111827] bg-white flex justify-between items-center text-xs font-bold text-slate-600">
          <span className="font-mono uppercase tracking-wider">Trophy Vault Collection</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#111827] hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#FF4757] transition-all"
          >
            Close Series
          </button>
        </div>
      </div>
    </div>
  );
}
