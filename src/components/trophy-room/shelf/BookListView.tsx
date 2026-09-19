'use client';

import React from 'react';
import {
  BookOpen,
  Download,
  CheckCircle2,
  Trash2,
  Edit3,
  Check,
} from 'lucide-react';
import { TrophyBook } from '@/types/trophy';

interface BookListViewProps {
  books: TrophyBook[];
  onOpen: (book: TrophyBook) => void;
  onEditMetadata?: (book: TrophyBook) => void;
  onToggleOffline?: (book: TrophyBook) => void;
  onDelete?: (book: TrophyBook) => void;
}

export default function BookListView({
  books,
  onOpen,
  onEditMetadata,
  onToggleOffline,
  onDelete,
}: BookListViewProps) {
  if (books.length === 0) {
    return (
      <div className="py-12 text-center text-stone-500 font-mono text-sm">
        No documents found matching this filter.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto border border-stone-800 rounded-lg bg-stone-900/40">
      <table className="w-full text-left text-xs font-sans">
        <thead className="bg-stone-950/80 border-b border-stone-800 text-stone-400 font-mono uppercase tracking-wider text-[11px]">
          <tr>
            <th className="py-3 px-4">Title</th>
            <th className="py-3 px-4 hidden sm:table-cell">Series</th>
            <th className="py-3 px-4 text-center">Issue</th>
            <th className="py-3 px-4 text-center">Format</th>
            <th className="py-3 px-4 hidden md:table-cell">Progress</th>
            <th className="py-3 px-4 text-center">Status</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-800/60 text-stone-300">
          {books.map((book) => {
            const percentRead = book.progress?.percent_read || 0;
            const isCompleted = book.progress?.completed;

            return (
              <tr
                key={book.id}
                className="hover:bg-stone-800/40 transition-colors group cursor-pointer"
                onClick={() => onOpen(book)}
              >
                {/* Title */}
                <td className="py-3 px-4">
                  <div className="font-serif font-semibold text-stone-200 group-hover:text-amber-400 transition-colors">
                    {book.title}
                  </div>
                  {book.author && (
                    <div className="text-[11px] text-stone-500 italic">by {book.author}</div>
                  )}
                </td>

                {/* Series */}
                <td className="py-3 px-4 hidden sm:table-cell text-stone-400 font-mono">
                  {book.series}
                </td>

                {/* Issue # */}
                <td className="py-3 px-4 text-center font-mono text-stone-300">
                  #{book.issue_number}
                </td>

                {/* Format Badge */}
                <td className="py-3 px-4 text-center">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                      book.format === 'cbz'
                        ? 'border-amber-500/40 bg-amber-950/40 text-amber-300'
                        : book.format === 'epub'
                        ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                        : 'border-sky-500/40 bg-sky-950/40 text-sky-300'
                    }`}
                  >
                    {book.format}
                  </span>
                </td>

                {/* Progress Bar */}
                <td className="py-3 px-4 hidden md:table-cell">
                  <div className="w-28 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-stone-400">
                      <span>{percentRead}%</span>
                      {book.page_count > 0 && (
                        <span>
                          {book.progress?.last_page || 0}/{book.page_count}
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 w-full bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${percentRead}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Offline Status */}
                <td className="py-3 px-4 text-center">
                  {book.isOffline ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden lg:inline">Saved</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-stone-500">Cloud</span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end space-x-1">
                    <button
                      onClick={() => onOpen(book)}
                      className="p-1.5 rounded text-stone-400 hover:text-amber-400 hover:bg-stone-800 transition-colors"
                      title="Read"
                    >
                      <BookOpen className="w-4 h-4" />
                    </button>

                    {onToggleOffline && (
                      <button
                        onClick={() => onToggleOffline(book)}
                        className={`p-1.5 rounded transition-colors ${
                          book.isOffline
                            ? 'text-emerald-400 hover:bg-stone-800'
                            : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                        }`}
                        title={book.isOffline ? 'Remove offline' : 'Download offline'}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}

                    {onEditMetadata && (
                      <button
                        onClick={() => onEditMetadata(book)}
                        className="p-1.5 rounded text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
                        title="Edit Metadata"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    {onDelete && (
                      <button
                        onClick={() => onDelete(book)}
                        className="p-1.5 rounded text-stone-500 hover:text-rose-400 hover:bg-stone-800 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
