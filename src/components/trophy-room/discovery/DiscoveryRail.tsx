'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { TrophyBook } from '@/types/trophy';
import BookCard from '../shelf/BookCard';

interface DiscoveryRailProps {
  title: string;
  subtitle?: string;
  books: TrophyBook[];
  badge?: string;
  onOpenBook: (book: TrophyBook) => void;
  onOpenCreator?: (creator: string) => void;
  onOpenPublisher?: (publisher: string) => void;
  onEditMetadata?: (book: TrophyBook) => void;
  onToggleOffline?: (book: TrophyBook) => void;
  onDelete?: (book: TrophyBook) => void;
}

export default function DiscoveryRail({
  title,
  subtitle,
  books,
  badge,
  onOpenBook,
  onOpenCreator,
  onOpenPublisher,
  onEditMetadata,
  onToggleOffline,
  onDelete,
}: DiscoveryRailProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!books || books.length === 0) return null;

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white border-4 border-[#111827] rounded-3xl p-5 sm:p-6 shadow-[6px_6px_0_#111827] space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#FFDE59] rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#111827]">
            <Sparkles className="w-4 h-4 text-[#111827]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base sm:text-lg uppercase tracking-wide text-[#111827]">
                {title}
              </h3>
              {badge && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-[#FF4757] text-white px-2 py-0.5 rounded-md border border-[#111827]">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Scroll Buttons (Desktop only) */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={scrollLeft}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#FFDE59] border-2 border-[#111827] text-[#111827] shadow-[2px_2px_0_#111827] active:scale-95 transition-all"
            title="Scroll Left"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
          <button
            onClick={scrollRight}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#FFDE59] border-2 border-[#111827] text-[#111827] shadow-[2px_2px_0_#111827] active:scale-95 transition-all"
            title="Scroll Right"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Snap Carousel */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x snap-mandatory focus:outline-none [-webkit-overflow-scrolling:touch]"
      >
        {books.map((book) => (
          <div
            key={book.id}
            className="w-36 sm:w-44 md:w-48 shrink-0 snap-start"
          >
            <BookCard
              book={book}
              onOpen={onOpenBook}
              onEditMetadata={onEditMetadata}
              onToggleOffline={onToggleOffline}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
