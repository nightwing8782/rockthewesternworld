'use client';

import React from 'react';
import { BookOpen, FastForward, Play, Zap, Flame, Compass } from 'lucide-react';
import { TrophyBook, TrophyProgress } from '@/types/trophy';
import { getNextVolumeToRead, getReadingMomentum } from '@/lib/trophy/discoveryEngine';

interface ReadingContinuityBannerProps {
  books: TrophyBook[];
  progressMap: Map<string, TrophyProgress>;
  onOpenBook: (book: TrophyBook) => void;
  onOpenSeries?: (seriesName: string) => void;
}

export default function ReadingContinuityBanner({
  books,
  progressMap,
  onOpenBook,
  onOpenSeries,
}: ReadingContinuityBannerProps) {
  // Find all series with active progress (> 0% and < 100%)
  const activeSeriesRuns = React.useMemo(() => {
    const seriesSet = new Set<string>();
    progressMap.forEach((prog, bId) => {
      if (prog.percent_read > 0 && !prog.completed) {
        const b = books.find((book) => book.id === bId);
        if (b && b.series && b.series !== 'Standalone') {
          seriesSet.add(b.series);
        }
      }
    });

    const results = Array.from(seriesSet).map((sName) =>
      getNextVolumeToRead(sName, books, progressMap)
    );

    // Sort by recent reading activity if possible
    return results.filter((r) => r.currentBook !== null);
  }, [books, progressMap]);

  const momentum = React.useMemo(() => {
    return getReadingMomentum(books, progressMap);
  }, [books, progressMap]);

  if (activeSeriesRuns.length === 0) return null;

  // Lead active series
  const leadRun = activeSeriesRuns[0];
  const currentBook = leadRun.currentBook!;
  const currentProg = progressMap.get(currentBook.id);
  const nextBook = leadRun.nextBook;
  const isLeadAtEnd = nextBook?.id === currentBook.id;

  return (
    <div className="bg-gradient-to-r from-amber-50 via-white to-orange-50 border-4 border-[#111827] rounded-3xl p-5 sm:p-6 shadow-[6px_6px_0_#111827] space-y-4">
      {/* Top Header: Reading Momentum Velocity Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b-2 border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#FFDE59] rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#111827]">
            <Zap className="w-4 h-4 text-[#111827]" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF4757]">
              READING CONTINUITY & MOMENTUM
            </span>
            <h3 className="font-black text-sm sm:text-base uppercase tracking-wide text-[#111827] leading-tight">
              {momentum.velocityDescription}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border-2 border-[#111827] rounded-lg text-[11px] font-black uppercase tracking-wider text-[#111827] shadow-[2px_2px_0_#111827]">
            <Flame className="w-3.5 h-3.5 text-[#FF4757] fill-[#FF4757]" />
            <span>{momentum.activeTitlesCount} Active Titles</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2ED573] border-2 border-[#111827] rounded-lg text-[11px] font-black uppercase tracking-wider text-[#111827] shadow-[2px_2px_0_#111827]">
            <span>{momentum.totalPagesRead} Pages Read</span>
          </span>
        </div>
      </div>

      {/* Main Focus Card: Current Volume + Up Next In Series */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Active Volume in Progress */}
        <div className="bg-white border-3 border-[#111827] rounded-2xl p-4 shadow-[4px_4px_0_#111827] flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                CURRENT SESSION IN RUN
              </span>
              <h4 className="font-black text-base uppercase text-[#111827] line-clamp-1">
                {currentBook.title}
              </h4>
              <p className="text-xs font-bold text-slate-600 uppercase">
                {leadRun.seriesName} • Issue {currentBook.issue_number}
              </p>
            </div>
            <span className="px-2 py-0.5 bg-[#FFDE59] border-2 border-[#111827] rounded-md text-[10px] font-black uppercase">
              {currentProg?.percent_read || 0}% READ
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 border-2 border-[#111827] overflow-hidden">
            <div
              className="bg-[#2ED573] h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, currentProg?.percent_read || 0)}%` }}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onOpenBook(currentBook)}
              className="flex-1 py-2.5 px-4 bg-[#FF4757] hover:bg-[#ff3344] text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#111827] shadow-[3px_3px_0_#111827] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Resume Current Volume</span>
            </button>
            {onOpenSeries && (
              <button
                onClick={() => onOpenSeries(leadRun.seriesName)}
                className="py-2.5 px-3 bg-slate-100 hover:bg-[#FFDE59] text-[#111827] font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#111827] active:scale-95 transition-all cursor-pointer"
                title="View Full Series Run"
              >
                <Compass className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Next Up In Series */}
        <div className="bg-amber-100/60 border-3 border-[#111827] rounded-2xl p-4 shadow-[4px_4px_0_#111827] flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                {isLeadAtEnd ? 'RUN COMPLETED TARGET' : 'UP NEXT IN SERIES'}
              </span>
              <h4 className="font-black text-base uppercase text-[#111827] line-clamp-1">
                {nextBook?.title || currentBook.title}
              </h4>
              <p className="text-xs font-bold text-slate-700 uppercase">
                {leadRun.seriesName} • {isLeadAtEnd ? 'All Current Issues Read' : `Issue ${nextBook?.issue_number || (Number(currentBook.issue_number) + 1)}`}
              </p>
            </div>
            <span className="px-2 py-0.5 bg-white border-2 border-[#111827] rounded-md text-[10px] font-black uppercase">
              {leadRun.completedVolumes}/{leadRun.totalVolumes} VOLS
            </span>
          </div>

          <p className="text-xs font-medium text-slate-700">
            {isLeadAtEnd
              ? 'You are at the latest issue available in this series run!'
              : `Seamless continuity: start Issue ${nextBook?.issue_number} immediately after finishing.`}
          </p>

          <div className="pt-1">
            <button
              onClick={() => onOpenBook(nextBook || currentBook)}
              className="w-full py-2.5 px-4 bg-[#FFDE59] hover:bg-[#ffcf21] text-[#111827] font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#111827] shadow-[3px_3px_0_#111827] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FastForward className="w-4 h-4 stroke-[2.5]" />
              <span>{isLeadAtEnd ? 'Revisit Series Run' : 'Start Next Volume'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Other Active Series Quick Jump Strip */}
      {activeSeriesRuns.length > 1 && (
        <div className="pt-2 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 shrink-0">
            Also In Progress:
          </span>
          {activeSeriesRuns.slice(1).map((run) => (
            <button
              key={run.seriesName}
              onClick={() => onOpenBook(run.currentBook!)}
              className="px-3 py-1 bg-white hover:bg-[#FFDE59] border-2 border-[#111827] rounded-lg font-bold text-[#111827] shrink-0 text-xs shadow-[2px_2px_0_#111827] transition-all flex items-center gap-1.5"
            >
              <BookOpen className="w-3 h-3" />
              <span>{run.seriesName} (Vol. {run.currentBook?.issue_number})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
