'use client';

import React, { useState, useEffect } from 'react';
import { Play, Sparkles, BookOpen, Clock, ChevronRight, Star } from 'lucide-react';
import { TrophyBook } from '@/types/trophy';
import TypographicCover from '../common/TypographicCover';
import { resolveCoverUrl } from '@/lib/trophy/coverResolver';

interface DeckCoverProps {
  book: TrophyBook;
}

function DeckCover({ book }: DeckCoverProps) {
  const [coverSrc, setCoverSrc] = useState<string | null>(book.cover_url || null);
  const [imageError, setImageError] = useState(false);

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

  return (
    <div className="relative w-20 h-28 sm:w-24 sm:h-32 shrink-0 rounded-2xl border-3 border-[#111827] overflow-hidden bg-slate-900 shadow-[3px_3px_0_#111827]">
      {coverSrc && !imageError ? (
        <img
          src={coverSrc}
          alt={book.title}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      ) : (
        <TypographicCover
          title={book.title}
          series={book.series}
          issueNumber={book.issue_number}
          format={book.format}
          author={book.author}
        />
      )}

      {/* Format Pill */}
      <span className="absolute top-1 left-1 comic-stamp text-[8px] px-1 py-0.2 rounded bg-black/80 text-white font-mono">
        {book.format?.toUpperCase() || 'CBZ'}
      </span>
    </div>
  );
}

interface ContinueReadingDeckProps {
  books: TrophyBook[];
  onOpenBook: (book: TrophyBook) => void;
}

export default function ContinueReadingDeck({
  books,
  onOpenBook,
}: ContinueReadingDeckProps) {
  // Find top 3 in-progress or recently read items
  const inProgressBooks = books
    .filter((b) => b.progress && b.progress.percent_read > 0 && !b.progress.completed)
    .sort((a, b) => {
      const aTime = a.progress?.last_read_at ? new Date(a.progress.last_read_at).getTime() : 0;
      const bTime = b.progress?.last_read_at ? new Date(b.progress.last_read_at).getTime() : 0;
      return bTime - aTime;
    });

  // Fallback: If fewer than 3 in-progress, pick favorites or prominent items
  const fallbackBooks = books.slice(0, 3);
  const displayBooks = inProgressBooks.length > 0 ? inProgressBooks.slice(0, 3) : fallbackBooks;

  if (displayBooks.length === 0) return null;

  return (
    <section className="mb-10 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#FF4757] rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#111827]">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-hero tracking-wider uppercase text-[#111827] drop-shadow-[1px_1px_0_#FFDE59]">
              {inProgressBooks.length > 0 ? 'RESUME TRANSMISSION' : 'FEATURED WATCHTOWER LOGS'}
            </h2>
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest font-comic">
              {inProgressBooks.length > 0
                ? 'Continue reading where you left off'
                : 'Selected titles from your private archives'}
            </p>
          </div>
        </div>

        <span className="comic-stamp text-[10px] px-2.5 py-1 rounded-lg bg-[#FFDE59] text-[#111827] border-2 border-[#111827] shadow-[2px_2px_0_#111827]">
          {inProgressBooks.length > 0 ? `${inProgressBooks.length} IN FLIGHT` : 'READY TO READ'}
        </span>
      </div>

      {/* 3-Column Deck */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {displayBooks.map((book) => {
          const percentRead = book.progress?.percent_read || 0;
          const lastPage = book.progress?.last_page || 1;
          const totalPages = book.page_count || 1;

          return (
            <div
              key={book.id}
              onClick={() => onOpenBook(book)}
              className="group relative bg-white border-4 border-[#111827] rounded-3xl p-4 shadow-[6px_6px_0_#111827] hover:shadow-[8px_8px_0_#111827] hover:-translate-y-1 transition-all duration-150 cursor-pointer flex flex-col justify-between overflow-hidden text-left"
            >
              {/* Halftone Top Bar */}
              <div className="flex gap-4 items-start">
                {/* Book Thumbnail */}
                <DeckCover book={book} />

                {/* Metadata */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#FF4757] line-clamp-1">
                      {book.series && book.series !== 'Standalone' ? book.series : 'STANDALONE ISSUE'}
                    </span>
                    <h3
                      className="font-black text-sm sm:text-base text-[#111827] line-clamp-2 leading-tight group-hover:text-[#FF4757] transition-colors mt-0.5"
                      title={book.title}
                    >
                      {book.title}
                    </h3>
                    <p className="text-[11px] font-bold text-slate-500 truncate mt-1">
                      {book.author ? `by ${book.author}` : `${totalPages} Pages`}
                    </p>
                  </div>

                  {/* Reading Status Pill */}
                  <div className="mt-2 flex items-center justify-between text-[11px] font-mono font-bold text-slate-700">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      Page {lastPage}/{totalPages}
                    </span>
                    <span className="text-[#FF4757] font-black">{percentRead}%</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3.5 w-full bg-slate-100 h-2.5 rounded-full border-2 border-[#111827] overflow-hidden">
                <div
                  className="h-full bg-[#2ED573] transition-all duration-300"
                  style={{ width: `${Math.max(percentRead, 5)}%` }}
                />
              </div>

              {/* Action Button */}
              <button
                type="button"
                className="mt-3.5 w-full py-2 bg-[#FFDE59] group-hover:bg-[#ffcf21] text-[#111827] font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center gap-1.5 transition-all"
              >
                <BookOpen className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Resume Reading</span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
