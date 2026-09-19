'use client';

import React, { useState } from 'react';
import { Layers, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { SeriesGroup, TrophyBook } from '@/types/trophy';
import TypographicCover from '../common/TypographicCover';

interface SeriesStackCardProps {
  series: SeriesGroup;
  onOpenSeries: (series: SeriesGroup) => void;
  onOpenBook: (book: TrophyBook) => void;
}

export default function SeriesStackCard({
  series,
  onOpenSeries,
  onOpenBook,
}: SeriesStackCardProps) {
  const [imgError, setImgError] = useState(false);

  // First book / cover
  const primaryBook = series.books[0];

  // Find next unread issue
  const nextUnread = series.books.find((b) => !b.progress?.completed) || series.books[0];

  return (
    <div
      onClick={() => onOpenSeries(series)}
      className="group relative flex flex-col w-full text-left cursor-pointer select-none"
    >
      {/* 3D Stack Effect Outer Container */}
      <div className="relative aspect-[2/3] w-full">
        {/* Layer 3 (Backmost Page/Cover) */}
        {series.totalIssues > 2 && (
          <div className="absolute inset-0 bg-stone-800/80 border border-stone-700/60 rounded-md translate-x-2 -translate-y-2 group-hover:translate-x-3 group-hover:-translate-y-3 transition-transform duration-300 shadow-md" />
        )}

        {/* Layer 2 (Middle Page/Cover) */}
        {series.totalIssues > 1 && (
          <div className="absolute inset-0 bg-stone-800 border border-stone-700 rounded-md translate-x-1 -translate-y-1 group-hover:translate-x-1.5 group-hover:-translate-y-1.5 transition-transform duration-300 shadow-md" />
        )}

        {/* Layer 1 (Front Primary Cover) */}
        <div className="relative w-full h-full rounded-md overflow-hidden bg-stone-900 border border-stone-800 shadow-xl group-hover:shadow-2xl group-hover:border-amber-500/80 transition-all duration-300">
          {primaryBook?.cover_url && !imgError ? (
            <img
              src={primaryBook.cover_url}
              alt={series.seriesName}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <TypographicCover
              title={series.seriesName}
              series="Complete Run"
              issueNumber={series.totalIssues}
              format={primaryBook?.format || 'cbz'}
            />
          )}

          {/* Issue Count Badge */}
          <div className="absolute top-2 right-2 z-10">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider bg-stone-950/85 text-amber-300 border border-amber-500/40 backdrop-blur-md shadow-md flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {series.totalIssues} {series.totalIssues === 1 ? 'Issue' : 'Issues'}
            </span>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
            <div className="flex items-center justify-between text-xs text-amber-300 font-serif font-bold">
              <span>View Collection</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Series Completion Bar */}
          {series.completedIssues > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-stone-950/80">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{
                  width: `${Math.round((series.completedIssues / series.totalIssues) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Series Info Below Card */}
      <div className="mt-2.5 px-0.5">
        <h4 className="font-serif text-sm font-bold text-stone-200 group-hover:text-amber-400 transition-colors line-clamp-1 leading-snug">
          {series.seriesName}
        </h4>
        <div className="flex items-center justify-between mt-0.5 text-[11px] font-mono text-stone-500">
          <span>{series.totalIssues} {series.totalIssues === 1 ? 'Item' : 'Items'}</span>
          {series.completedIssues > 0 && (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {series.completedIssues}/{series.totalIssues} done
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
