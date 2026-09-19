'use client';

import React from 'react';
import {
  BookOpen,
  Download,
  CheckCircle2,
  Trash2,
  Edit3,
  Check,
  Cloud,
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
      <div className="py-12 text-center text-slate-500 font-bold text-sm bg-white rounded-2xl border-3 border-[#111827] shadow-[4px_4px_0_#111827]">
        No documents found matching this filter.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto border-3 border-[#111827] rounded-2xl bg-white shadow-[5px_5px_0_#111827]">
      <table className="w-full text-left text-xs font-sans">
        <thead className="bg-[#FFDE59] border-b-3 border-[#111827] text-[#111827] uppercase tracking-wider text-[11px] font-black">
          <tr>
            <th className="py-3.5 px-4">Title</th>
            <th className="py-3.5 px-4 hidden sm:table-cell">Series</th>
            <th className="py-3.5 px-4 text-center">Issue</th>
            <th className="py-3.5 px-4 text-center">Format</th>
            <th className="py-3.5 px-4 hidden md:table-cell">Progress</th>
            <th className="py-3.5 px-4 text-center">Status</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-slate-200 text-[#111827]">
          {books.map((book) => {
            const percentRead = book.progress?.percent_read || 0;
            const isCompleted = book.progress?.completed;

            return (
              <tr
                key={book.id}
                className="hover:bg-amber-50/70 transition-colors group cursor-pointer"
                onClick={() => onOpen(book)}
              >
                {/* Title */}
                <td className="py-3 px-4">
                  <div className="font-black text-sm text-[#111827] group-hover:text-[#FF4757] transition-colors">
                    {book.title}
                  </div>
                  {book.author && (
                    <div className="text-[11px] text-slate-500 font-bold">by {book.author}</div>
                  )}
                </td>

                {/* Series */}
                <td className="py-3 px-4 hidden sm:table-cell text-slate-700 font-bold">
                  {book.series}
                </td>

                {/* Issue # */}
                <td className="py-3 px-4 text-center">
                  <span className="comic-stamp text-[10px] px-1.5 py-0.5 rounded bg-white text-[#111827]">
                    #{book.issue_number}
                  </span>
                </td>

                {/* Format Badge */}
                <td className="py-3 px-4 text-center">
                  <span
                    className={`comic-stamp text-[9px] px-2 py-0.5 rounded ${
                      book.format === 'cbz'
                        ? 'bg-[#FFDE59] text-[#111827]'
                        : book.format === 'epub'
                        ? 'bg-[#00D2D3] text-[#111827]'
                        : 'bg-[#FF4757] text-white'
                    }`}
                  >
                    {book.format.toUpperCase()}
                  </span>
                </td>

                {/* Progress Bar */}
                <td className="py-3 px-4 hidden md:table-cell">
                  <div className="w-32 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono font-bold text-slate-600">
                      <span>{percentRead}%</span>
                      {book.page_count > 0 && (
                        <span>
                          {book.progress?.last_page || 0}/{book.page_count}
                        </span>
                      )}
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full border border-[#111827] overflow-hidden">
                      <div
                        className={`h-full ${isCompleted ? 'bg-[#2ED573]' : 'bg-[#FF4757]'}`}
                        style={{ width: `${percentRead}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Offline Status */}
                <td className="py-3 px-4 text-center">
                  {book.isOffline ? (
                    <span className="comic-stamp text-[9px] px-1.5 py-0.5 rounded bg-[#2ED573] text-[#111827]">
                      <Check className="w-2.5 h-2.5 stroke-[3] mr-1" />
                      Offline
                    </span>
                  ) : (
                    <span className="comic-stamp text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      <Cloud className="w-2.5 h-2.5 mr-1" />
                      Cloud
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end space-x-1.5">
                    <button
                      onClick={() => onOpen(book)}
                      className="p-1.5 rounded-lg border-2 border-[#111827] bg-[#FFDE59] hover:bg-[#f3cb30] text-[#111827] shadow-[1px_1px_0_#111827] transition-all"
                      title="Read"
                    >
                      <BookOpen className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>

                    {onToggleOffline && (
                      <button
                        onClick={() => onToggleOffline(book)}
                        className={`p-1.5 rounded-lg border-2 border-[#111827] transition-all ${
                          book.isOffline
                            ? 'bg-[#2ED573] text-[#111827] shadow-[1px_1px_0_#111827]'
                            : 'bg-white text-slate-700 hover:bg-slate-100 shadow-[1px_1px_0_#111827]'
                        }`}
                        title={book.isOffline ? 'Remove offline' : 'Download offline'}
                      >
                        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    )}

                    {onEditMetadata && (
                      <button
                        onClick={() => onEditMetadata(book)}
                        className="p-1.5 rounded-lg border-2 border-[#111827] bg-white text-slate-700 hover:bg-slate-100 shadow-[1px_1px_0_#111827] transition-all"
                        title="Edit Metadata"
                      >
                        <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    )}

                    {onDelete && (
                      <button
                        onClick={() => onDelete(book)}
                        className="p-1.5 rounded-lg border-2 border-[#111827] bg-white text-slate-400 hover:text-[#FF4757] hover:bg-rose-50 shadow-[1px_1px_0_#111827] transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
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
