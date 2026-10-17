'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  BookOpen,
  Play,
  FastForward,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowLeft,
  Flame,
} from 'lucide-react';
import { SeriesGroup, TrophyBook, TrophyProgress } from '@/types/trophy';
import BookCard from '../shelf/BookCard';
import TypographicCover from '../common/TypographicCover';
import { resolveCoverUrl } from '@/lib/trophy/coverResolver';
import {
  getNextVolumeToRead,
  getSeriesCompletionForecast,
} from '@/lib/trophy/discoveryEngine';

interface SeriesLandingModalProps {
  series: SeriesGroup | null;
  allBooks: TrophyBook[];
  progressMap: Map<string, TrophyProgress>;
  onClose: () => void;
  onOpenBook: (book: TrophyBook) => void;
  onOpenCreator?: (creator: string) => void;
  onOpenPublisher?: (publisher: string) => void;
  onClearProgress?: (book: TrophyBook) => void;
  onEditMetadata?: (book: TrophyBook) => void;
  onToggleOffline?: (book: TrophyBook) => void;
  onDelete?: (book: TrophyBook) => void;
}

export default function SeriesLandingModal({
  series,
  allBooks,
  progressMap,
  onClose,
  onOpenBook,
  onOpenCreator,
  onOpenPublisher,
  onClearProgress,
  onEditMetadata,
  onToggleOffline,
  onDelete,
}: SeriesLandingModalProps) {
  const [coverSrc, setCoverSrc] = useState<string | null>(series?.coverUrl || null);
  const [imageError, setImageError] = useState(false);

  // Lead volume
  const leadBook = series?.books[0];

  useEffect(() => {
    let isCancelled = false;
    async function loadLeadCover() {
      if (!series || !series.books || series.books.length === 0) return;
      const bookWithCover = series.books.find((b) => b.cover_key || b.cover_url) || series.books[0];
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
  }, [series]);

  if (!series) return null;

  // Reading continuity & completion forecast
  const continuity = getNextVolumeToRead(series.seriesName, allBooks, progressMap);
  const forecast = getSeriesCompletionForecast(series.seriesName, allBooks, progressMap);

  const primaryAuthor = leadBook?.author || 'Various Creators';
  const primaryPublisher = leadBook?.publisher || 'Independent';
  const isRTL = leadBook?.reading_direction === 'rtl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-4 border-[#111827] rounded-3xl shadow-[10px_10px_0_#111827] max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-[#111827]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b-4 border-[#111827] bg-[#FFDE59] shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onClose}
              className="sm:hidden p-1.5 rounded-xl bg-white border-2 border-[#111827] text-[#111827] shadow-[2px_2px_0_#111827] active:scale-95"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <div className="p-1.5 sm:p-2 rounded-xl bg-white border-2 border-[#111827] shadow-[2px_2px_0_#111827]">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-[#111827]" />
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#FF4757]">
                SERIES LANDING PAGE
              </span>
              <h2 className="text-base sm:text-2xl font-black uppercase tracking-wide text-[#111827] line-clamp-1 leading-tight">
                {series.seriesName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-white border-2 border-[#111827] text-[#111827] hover:bg-[#FF4757] hover:text-white shadow-[2px_2px_0_#111827] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body: Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-paper-texture space-y-6">
          {/* Hero Section: Cover & Metadata */}
          <div className="bg-white border-3 border-[#111827] rounded-2xl p-4 sm:p-6 shadow-[4px_4px_0_#111827] flex flex-col sm:flex-row gap-5">
            {/* Hero Cover (Responsive: 100px on mobile, 180px on desktop) */}
            <div className="w-24 sm:w-44 md:w-48 aspect-[3/4] bg-slate-900 rounded-xl border-3 border-[#111827] shadow-[4px_4px_0_#111827] overflow-hidden shrink-0 mx-auto sm:mx-0">
              {coverSrc && !imageError ? (
                <img
                  src={coverSrc}
                  alt={series.seriesName}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <TypographicCover
                  title={leadBook?.title || series.seriesName}
                  series={series.seriesName}
                  issueNumber={leadBook?.issue_number || 1}
                  format={leadBook?.format || 'cbz'}
                  author={primaryAuthor}
                />
              )}
            </div>

            {/* Hero Metadata & Byline */}
            <div className="flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 bg-[#FFDE59] border-2 border-[#111827] rounded-md text-[10px] font-black uppercase">
                    {series.totalIssues} {series.totalIssues === 1 ? 'Volume' : 'Volumes'}
                  </span>
                  {isRTL && (
                    <span className="px-2 py-0.5 bg-rose-500 text-white border-2 border-[#111827] rounded-md text-[10px] font-black uppercase">
                      RTL [MANGA 読]
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-slate-100 border-2 border-[#111827] rounded-md text-[10px] font-bold uppercase text-slate-700">
                    {leadBook?.medium || 'Comic'}
                  </span>
                </div>

                <h1 className="text-xl sm:text-3xl font-black uppercase text-[#111827] tracking-tight leading-tight">
                  {series.seriesName}
                </h1>

                {/* Creator and Publisher Links */}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm font-bold">
                  {primaryAuthor && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 uppercase text-[10px]">Creator:</span>
                      <button
                        onClick={() => onOpenCreator?.(primaryAuthor)}
                        className="text-[#111827] hover:text-[#FF4757] underline decoration-2 underline-offset-2 transition-colors cursor-pointer"
                      >
                        {primaryAuthor}
                      </button>
                    </div>
                  )}

                  {primaryPublisher && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 uppercase text-[10px]">Publisher:</span>
                      <button
                        onClick={() => onOpenPublisher?.(primaryPublisher)}
                        className="text-[#111827] hover:text-[#FF4757] underline decoration-2 underline-offset-2 transition-colors cursor-pointer"
                      >
                        {primaryPublisher}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Series Completion Forecast Panel */}
              <div className="bg-slate-50 border-2 border-[#111827] rounded-xl p-3 sm:p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black uppercase tracking-wider text-[#FF4757]">
                    {forecast.forecastBadge}
                  </span>
                  <span className="font-mono font-bold text-slate-700">
                    {forecast.completionPercentage}% Complete ({forecast.completedVolumes}/{forecast.totalVolumes} Vols)
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2.5 border border-[#111827] overflow-hidden">
                  <div
                    className="bg-[#2ED573] h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(5, forecast.completionPercentage)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Est. {forecast.estimatedHoursRemaining} hrs remaining (~{forecast.remainingPages} pages)
                  </span>
                  <span>{forecast.remainingVolumes} Volumes unread</span>
                </div>
              </div>

              {/* Reading Continuity Action (Desktop) */}
              <div className="hidden sm:flex items-center gap-3 pt-2">
                {continuity.currentBook && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenBook(continuity.currentBook!);
                    }}
                    className="px-5 py-3 bg-[#FF4757] hover:bg-[#ff3344] text-white font-black text-xs uppercase tracking-wider rounded-xl border-3 border-[#111827] shadow-[3px_3px_0_#111827] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Resume Vol. {continuity.currentBook.issue_number}</span>
                  </button>
                )}

                {continuity.nextBook && continuity.nextBook.id !== continuity.currentBook?.id && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenBook(continuity.nextBook!);
                    }}
                    className="px-5 py-3 bg-[#FFDE59] hover:bg-[#ffcf21] text-[#111827] font-black text-xs uppercase tracking-wider rounded-xl border-3 border-[#111827] shadow-[3px_3px_0_#111827] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <FastForward className="w-4 h-4 stroke-[2.5]" />
                    <span>Start Vol. {continuity.nextBook.issue_number}</span>
                  </button>
                )}

                {!continuity.currentBook && leadBook && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenBook(leadBook);
                    }}
                    className="px-6 py-3 bg-[#2ED573] hover:bg-[#26af5f] text-white font-black text-xs uppercase tracking-wider rounded-xl border-3 border-[#111827] shadow-[3px_3px_0_#111827] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Begin Series (Vol. 1)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Chronological Reading Order Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base sm:text-lg uppercase tracking-wide text-[#111827] flex items-center gap-2">
                <span>Complete Reading Order</span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  ({series.books.length} Issues)
                </span>
              </h3>
            </div>

            {/* 2-Column on Mobile (<640px / 390px), 3-col on sm, 4-col on md, 5-col on lg */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5 pb-16 sm:pb-0">
              {series.books.map((book) => {
                const prog = progressMap.get(book.id);
                const isCompleted = prog?.completed;
                const inProgress = prog && !prog.completed && prog.percent_read > 0;

                return (
                  <div key={book.id} className="relative group">
                    <BookCard
                      book={book}
                      onOpen={(b) => {
                        onClose();
                        onOpenBook(b);
                      }}
                      onOpenCreator={onOpenCreator}
                      onOpenPublisher={onOpenPublisher}
                      onClearProgress={onClearProgress}
                      onEditMetadata={onEditMetadata}
                      onToggleOffline={onToggleOffline}
                      onDelete={onDelete}
                    />

                    {/* Status Badge overlay */}
                    <div className="absolute top-2 left-2 pointer-events-none z-10">
                      {isCompleted ? (
                        <span className="px-2 py-0.5 bg-[#2ED573] text-white font-black text-[9px] uppercase rounded border border-[#111827] shadow-[1px_1px_0_#111827]">
                          ✓ READ
                        </span>
                      ) : inProgress ? (
                        <span className="px-2 py-0.5 bg-[#FFDE59] text-[#111827] font-black text-[9px] uppercase rounded border border-[#111827] shadow-[1px_1px_0_#111827]">
                          {prog?.percent_read}% IN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-800 text-white font-black text-[9px] uppercase rounded border border-[#111827] shadow-[1px_1px_0_#111827]">
                          UNREAD
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Sticky Action Footer (<640px) */}
        <div className="sm:hidden px-4 py-3 border-t-3 border-[#111827] bg-white flex items-center gap-2 shrink-0">
          {continuity.currentBook ? (
            <button
              onClick={() => {
                onClose();
                onOpenBook(continuity.currentBook!);
              }}
              className="flex-1 py-3 px-4 bg-[#FF4757] text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#111827] active:scale-95 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Resume Vol. {continuity.currentBook.issue_number}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                onOpenBook(leadBook || series.books[0]);
              }}
              className="flex-1 py-3 px-4 bg-[#2ED573] text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#111827] active:scale-95 flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Begin Vol. 1</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-3 bg-slate-100 text-[#111827] font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#111827]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
