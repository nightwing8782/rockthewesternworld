'use client';

import React, { useState, useEffect } from 'react';
import { Layers, HardDriveDownload, BookOpen, Sparkles } from 'lucide-react';
import { SeriesGroup, TrophyBook } from '@/types/trophy';
import BookCard from './BookCard';
import TypographicCover from '../common/TypographicCover';
import { resolveCoverUrl } from '@/lib/trophy/coverResolver';

interface SeriesStackCardProps {
  series: SeriesGroup;
  onOpenSeries: (series: SeriesGroup) => void;
  onOpenBook: (book: TrophyBook) => void;
  onEditMetadata?: (book: TrophyBook) => void;
  onToggleOffline?: (book: TrophyBook) => void;
  onDelete?: (book: TrophyBook) => void;
}

export default function SeriesStackCard({
  series,
  onOpenSeries,
  onOpenBook,
  onEditMetadata,
  onToggleOffline,
  onDelete,
}: SeriesStackCardProps) {
  const [coverSrc, setCoverSrc] = useState<string | null>(series.coverUrl || null);
  const [imageError, setImageError] = useState(false);

  const leadBook = series.books[0];

  useEffect(() => {
    let isCancelled = false;
    async function loadLeadCover() {
      if (!series || !series.books || series.books.length === 0) return;
      const bookWithCover = series.books.find((b) => b.cover_key || b.cover_url) || leadBook;
      if (bookWithCover) {
        const resolved = await resolveCoverUrl(bookWithCover);
        if (!isCancelled && resolved) {
          setCoverSrc(resolved);
          setImageError(false);
        }
      }
    }
    loadLeadCover();
    return () => {
      isCancelled = true;
    };
  }, [series.books, leadBook]);

  // If only 1 issue in standalone, render as single BookCard AFTER all hooks are called
  if (series.totalIssues <= 1 && series.books[0]) {
    return (
      <BookCard
        book={series.books[0]}
        onOpen={onOpenBook}
        onEditMetadata={onEditMetadata}
        onToggleOffline={onToggleOffline}
        onDelete={onDelete}
      />
    );
  }

  const offlineCount = series.books.filter((b) => b.isOffline).length;
  const progressPercent = Math.round(
    (series.completedIssues / Math.max(1, series.totalIssues)) * 100
  );
  const isAllCompleted = series.completedIssues === series.totalIssues;
  const uniqueFormats = Array.from(new Set(series.formats));

  return (
    <div
      onClick={() => onOpenSeries(series)}
      className="group relative flex flex-col bg-white rounded-2xl border-4 border-[#111827] shadow-[5px_5px_0_#111827] hover:shadow-[7px_7px_0_#111827] hover:-translate-y-1 transition-all duration-150 overflow-hidden cursor-pointer select-none text-left"
    >
      {/* Top Graphic Area: Stack Illusion Cover */}
      <div className="relative aspect-[3/4] bg-slate-900 overflow-hidden p-2.5 flex items-center justify-center">
        {/* Layered Physical Comic Stack Illusion */}
        <div className="relative w-full h-full">
          {/* Back Stack Layer 2 */}
          <div className="absolute inset-0 bg-[#FF4757] rounded-xl border-2 border-[#111827] transform rotate-3 translate-x-1.5 translate-y-1 shadow-[2px_2px_0_#000]" />

          {/* Back Stack Layer 1 */}
          <div className="absolute inset-0 bg-[#FFDE59] rounded-xl border-2 border-[#111827] transform -rotate-2 -translate-x-1 translate-y-0.5 shadow-[2px_2px_0_#000]" />

          {/* Front Cover Image */}
          <div className="relative w-full h-full rounded-xl border-2 border-[#111827] overflow-hidden shadow-[3px_3px_0_#000]">
            {coverSrc && !imageError ? (
              <>
                <img
                  src={coverSrc}
                  alt={series.seriesName}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />
              </>
            ) : (
              <TypographicCover
                title={series.seriesName}
                series={series.seriesName}
                issueNumber={series.totalIssues}
                format={series.formats[0] || 'cbz'}
                author={leadBook?.author}
              />
            )}
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-1.5 pointer-events-none z-10">
          {/* Formats */}
          <div className="flex items-center gap-1">
            {uniqueFormats.map((fmt) => (
              <span
                key={fmt || 'cbz'}
                className="comic-stamp text-[9px] px-1.5 py-0.5 rounded bg-[#FFDE59] text-[#111827]"
              >
                {String(fmt || 'cbz').toUpperCase()}
              </span>
            ))}
          </div>

          {/* Series Stack Pill */}
          <span className="comic-stamp text-[10px] px-2 py-0.5 rounded bg-[#FF4757] text-white flex items-center gap-1 shadow-[1px_1px_0_#000]">
            <Layers className="w-3 h-3 stroke-[2.5]" />
            {series.totalIssues} ISSUES
          </span>
        </div>

        {/* Offline Badge */}
        {offlineCount > 0 && (
          <div className="absolute top-10 left-3.5 z-10 pointer-events-none">
            <span className="comic-stamp text-[9px] px-1.5 py-0.5 rounded bg-[#2ED573] text-[#111827] flex items-center gap-1 shadow-[1px_1px_0_#000]">
              <HardDriveDownload className="w-3 h-3 stroke-[2.5]" />
              {offlineCount}/{series.totalIssues} OFFLINE
            </span>
          </div>
        )}

        {/* Floating Open Series Stack Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 backdrop-blur-[2px] transition-opacity z-20">
          <div className="flex items-center gap-1.5 bg-[#FFDE59] text-[#111827] font-black text-sm tracking-wide px-4 py-2 rounded-xl border-3 border-[#111827] shadow-[3px_3px_0_#111827]">
            <BookOpen className="w-4 h-4 stroke-[2.5]" />
            VIEW {series.totalIssues} {series.totalIssues === 1 ? 'BOOK' : 'BOOKS'}
          </div>
        </div>
      </div>

      {/* Progress bar across bottom of cover */}
      <div className="w-full bg-slate-200 h-2 border-y-2 border-[#111827]">
        <div
          className={`h-full transition-all duration-300 ${
            isAllCompleted ? 'bg-[#2ED573]' : 'bg-[#FF4757]'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Card Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between bg-white">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#FF4757]">
            {series.groupByType === 'collection'
              ? 'CUSTOM COLLECTION'
              : series.groupByType === 'medium'
              ? 'CATEGORY SHELF'
              : series.groupByType === 'publisher'
              ? 'PUBLISHER CATALOG'
              : series.groupByType === 'franchise'
              ? 'FRANCHISE RUN'
              : series.groupByType === 'author'
              ? 'CREATOR PORTFOLIO'
              : 'SERIES RUN'}
          </span>

          <h3
            className="font-black text-sm text-[#111827] line-clamp-1 leading-tight hover:text-[#FF4757] transition-colors mt-0.5"
            title={series.seriesName}
          >
            {series.seriesName}
          </h3>

          <div className="mt-1 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>{series.totalIssues} {series.totalIssues === 1 ? 'Title' : 'Titles'}</span>
            <span className={isAllCompleted ? 'text-[#2ED573] font-black' : 'text-slate-700'}>
              {series.completedIssues}/{series.totalIssues} Read
            </span>
          </div>
        </div>

        {/* Footer info stamp */}
        <div className="mt-3 pt-2 border-t-2 border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-600">
          <span className="text-[#111827] font-black flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#FFDE59]" />
            {series.groupByType === 'collection' ? 'Curated Shelf' : 'Full Stack'}
          </span>
          <span className="text-slate-400 font-mono text-[10px]">
            {series.totalIssues} Items
          </span>
        </div>
      </div>
    </div>
  );
}
