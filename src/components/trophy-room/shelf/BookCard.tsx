'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Download,
  Trash2,
  Edit3,
  Check,
  Cloud,
  CheckCircle,
  MoreVertical,
} from 'lucide-react';
import { TrophyBook } from '@/types/trophy';
import TypographicCover from '../common/TypographicCover';
import { resolveCoverUrl } from '@/lib/trophy/coverResolver';

interface BookCardProps {
  book: TrophyBook;
  onOpen: (book: TrophyBook) => void;
  onEditMetadata?: (book: TrophyBook) => void;
  onToggleOffline?: (book: TrophyBook) => void;
  onDelete?: (book: TrophyBook) => void;
}

export default function BookCard({
  book,
  onOpen,
  onEditMetadata,
  onToggleOffline,
  onDelete,
}: BookCardProps) {
  const [coverSrc, setCoverSrc] = useState<string | null>(book.cover_url || null);
  const [imageError, setImageError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    async function loadCover() {
      if (book.cover_key || book.cover_url) {
        const resolved = await resolveCoverUrl(book);
        if (!isCancelled && resolved) {
          setCoverSrc(resolved);
          setImageError(false);
        }
      }
    }
    loadCover();
    return () => {
      isCancelled = true;
    };
  }, [book.cover_key, book.cover_url]);

  // Format badge colors
  const formatBadgeBg = {
    cbz: 'bg-[#FFDE59] text-[#111827]',
    epub: 'bg-[#00D2D3] text-[#111827]',
    pdf: 'bg-[#FF4757] text-white',
  }[book.format];

  const percentRead = book.progress?.percent_read || 0;
  const isCompleted = book.progress?.completed;

  return (
    <div
      className="group relative flex flex-col bg-white rounded-2xl border-4 border-[#111827] shadow-[5px_5px_0_#111827] hover:shadow-[7px_7px_0_#111827] hover:-translate-y-1 transition-all duration-150 overflow-hidden text-left"
    >
      {/* Top Graphic Area: Cover & Badges */}
      <div
        className="relative aspect-[3/4] bg-slate-900 overflow-hidden cursor-pointer select-none"
        onClick={() => onOpen(book)}
      >
        {coverSrc && !imageError ? (
          <>
            <img
              src={coverSrc}
              alt={book.title}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {/* Halftone accent overlay on top */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
          </>
        ) : (
          <TypographicCover
            title={book.title}
            series={book.series}
            issueNumber={book.issue_number}
            format={book.format}
            author={book.author}
          />
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none z-10">
          {/* Format Stamp */}
          <span className={`comic-stamp text-[10px] px-2 py-0.5 rounded ${formatBadgeBg}`}>
            {book.format.toUpperCase()}
          </span>

          {/* Reading Direction Badge */}
          {book.reading_direction === 'rtl' ? (
            <span className="comic-stamp text-[9px] px-1.5 py-0.5 rounded bg-[#FF4757] text-white">
              MANGA RTL
            </span>
          ) : (
            <span className="comic-stamp text-[9px] px-1.5 py-0.5 rounded bg-white text-[#111827]">
              LTR
            </span>
          )}
        </div>

        {/* Offline Ready or Cloud Only Badge */}
        <div className="absolute top-9 left-2.5 z-10 pointer-events-none">
          {book.isOffline ? (
            <span className="comic-stamp text-[9px] px-1.5 py-0.5 rounded bg-[#2ED573] text-[#111827] flex items-center gap-1 shadow-[1px_1px_0_#000]">
              <Check className="w-3 h-3 stroke-[3]" />
              OFFLINE READY
            </span>
          ) : (
            <span className="comic-stamp text-[9px] px-1.5 py-0.5 rounded bg-slate-900/85 backdrop-blur-xs text-amber-300 border-amber-400 flex items-center gap-1 shadow-[1px_1px_0_#000]">
              <Cloud className="w-2.5 h-2.5" />
              CLOUD ONLY
            </span>
          )}
        </div>

        {/* Issue Number Stamp on Bottom Right of Cover */}
        <div className="absolute bottom-2.5 right-2.5 z-10">
          <div className="bg-[#111827] text-[#FFDE59] border-2 border-[#FFDE59] px-2 py-0.5 rounded-md font-sans font-black text-xs shadow-[2px_2px_0_#000]">
            #{book.issue_number}
          </div>
        </div>

        {/* Quick Read Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 backdrop-blur-[2px] transition-opacity z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(book);
            }}
            className="flex items-center gap-1.5 bg-[#FFDE59] hover:bg-[#ffcf21] text-[#111827] font-black text-sm tracking-wide px-4 py-2 rounded-xl border-3 border-[#111827] shadow-[3px_3px_0_#111827] active:scale-95 transition-all"
          >
            <BookOpen className="w-4 h-4 stroke-[2.5]" />
            READ NOW
          </button>
        </div>
      </div>

      {/* Reading Progress Bar */}
      <div className="w-full bg-slate-200 h-2 border-y-2 border-[#111827]">
        <div
          className={`h-full transition-all duration-300 ${
            isCompleted ? 'bg-[#2ED573]' : 'bg-[#FF4757]'
          }`}
          style={{ width: `${percentRead}%` }}
        />
      </div>

      {/* Card Body / Metadata */}
      <div className="p-3.5 flex-1 flex flex-col justify-between bg-white">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#FF4757]">
            {book.series !== 'Standalone' ? book.series : 'STANDALONE ISSUE'}
          </span>

          <h3
            onClick={() => onOpen(book)}
            className="font-black text-sm text-[#111827] line-clamp-1 leading-tight hover:text-[#FF4757] transition-colors cursor-pointer mt-0.5"
            title={book.title}
          >
            {book.title}
          </h3>

          <div className="mt-1 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>
              {book.author ? `by ${book.author}` : `${book.page_count || 1} Pages`}
            </span>
            {percentRead > 0 && (
              <span className={`font-mono font-bold ${isCompleted ? 'text-[#2ED573]' : 'text-slate-700'}`}>
                {isCompleted ? 'Finished' : `${percentRead}% Read`}
              </span>
            )}
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="mt-3 pt-2.5 border-t-2 border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {onToggleOffline && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleOffline(book);
                }}
                className={`p-1.5 rounded-lg border-2 border-[#111827] text-xs font-black transition-all ${
                  book.isOffline
                    ? 'bg-[#2ED573] text-[#111827] shadow-[1px_1px_0_#111827]'
                    : 'bg-white text-slate-700 hover:bg-slate-100 shadow-[1px_1px_0_#111827]'
                }`}
                title={book.isOffline ? 'Saved locally in OPFS cache' : 'Download for offline reading'}
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}

            {onEditMetadata && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditMetadata(book);
                }}
                className="p-1.5 rounded-lg border-2 border-[#111827] bg-white text-slate-700 hover:bg-slate-100 shadow-[1px_1px_0_#111827] transition-all"
                title="Edit Comic / Book Metadata"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(book);
              }}
              className="p-1.5 rounded-lg border-2 border-[#111827] bg-white text-slate-400 hover:text-[#FF4757] hover:bg-rose-50 shadow-[1px_1px_0_#111827] transition-all"
              title="Delete Document"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
