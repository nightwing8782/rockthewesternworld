'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  Sparkles,
  Layers,
  BookOpen,
  ArrowRight,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { TrophyBook, TrophyProgress } from '@/types/trophy';
import { getDiscoveryInsights } from '@/lib/trophy/discoveryEngine';

interface DiscoveryInsightsGridProps {
  books: TrophyBook[];
  progressMap: Map<string, TrophyProgress>;
  onOpenBook: (book: TrophyBook) => void;
  onOpenSeries?: (seriesName: string) => void;
  onOpenCreator?: (creatorName: string) => void;
}

export default function DiscoveryInsightsGrid({
  books,
  progressMap,
  onOpenBook,
  onOpenSeries,
  onOpenCreator,
}: DiscoveryInsightsGridProps) {
  const [activeTab, setActiveTab] = useState<'runs' | 'gems' | 'completed' | 'most-read'>('runs');

  const insights = React.useMemo(() => {
    return getDiscoveryInsights(books, progressMap);
  }, [books, progressMap]);

  return (
    <div className="bg-white border-4 border-[#111827] rounded-3xl p-5 sm:p-6 shadow-[6px_6px_0_#111827] space-y-5">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-3 border-[#111827] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FFDE59] rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#111827]">
            <TrendingUp className="w-5 h-5 text-[#111827]" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF4757]">
              CURATED COLLECTION INTEL
            </span>
            <h3 className="font-black text-lg uppercase tracking-wide text-[#111827]">
              Discovery Insights
            </h3>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('runs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-[#111827] transition-all cursor-pointer ${
              activeTab === 'runs'
                ? 'bg-[#111827] text-[#FFDE59] shadow-[2px_2px_0_#FF4757]'
                : 'bg-white text-slate-700 hover:bg-slate-100 shadow-[2px_2px_0_#111827]'
            }`}
          >
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Largest Runs</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('gems')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-[#111827] transition-all cursor-pointer ${
              activeTab === 'gems'
                ? 'bg-[#111827] text-[#FFDE59] shadow-[2px_2px_0_#FF4757]'
                : 'bg-white text-slate-700 hover:bg-slate-100 shadow-[2px_2px_0_#111827]'
            }`}
          >
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hidden Gems</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-[#111827] transition-all cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-[#111827] text-[#FFDE59] shadow-[2px_2px_0_#FF4757]'
                : 'bg-white text-slate-700 hover:bg-slate-100 shadow-[2px_2px_0_#111827]'
            }`}
          >
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>Series Progress</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('most-read')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-[#111827] transition-all cursor-pointer ${
              activeTab === 'most-read'
                ? 'bg-[#111827] text-[#FFDE59] shadow-[2px_2px_0_#FF4757]'
                : 'bg-white text-slate-700 hover:bg-slate-100 shadow-[2px_2px_0_#111827]'
            }`}
          >
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              <span>Active Titles</span>
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Largest Runs */}
      {activeTab === 'runs' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {insights.largestRuns.map((run, i) => (
            <div
              key={run.seriesName}
              onClick={() => onOpenSeries?.(run.seriesName)}
              className="group p-4 bg-paper-texture border-3 border-[#111827] rounded-2xl shadow-[4px_4px_0_#111827] hover:shadow-[6px_6px_0_#111827] hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="px-2 py-0.5 bg-[#FFDE59] border-2 border-[#111827] rounded-md text-[10px] font-black uppercase">
                    RANK #{i + 1}
                  </span>
                  <span className="text-xs font-black font-mono text-[#FF4757]">
                    {run.totalVols} VOLS
                  </span>
                </div>
                <h4 className="font-black text-sm uppercase text-[#111827] group-hover:text-[#FF4757] transition-colors line-clamp-1">
                  {run.seriesName}
                </h4>
                <p className="text-xs font-bold text-slate-600 uppercase mt-0.5">
                  {run.publisher}
                </p>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-300 flex items-center justify-between text-xs font-black text-slate-800">
                <span className="uppercase text-[10px] text-slate-500">
                  {run.medium}
                </span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Explore Run <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Hidden Gems */}
      {activeTab === 'gems' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {insights.hiddenGems.map((book) => (
            <div
              key={book.id}
              onClick={() => onOpenBook(book)}
              className="group p-4 bg-paper-texture border-3 border-[#111827] rounded-2xl shadow-[4px_4px_0_#111827] hover:shadow-[6px_6px_0_#111827] hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="px-2 py-0.5 bg-[#2ED573] border-2 border-[#111827] rounded-md text-[10px] font-black uppercase text-white">
                    UNREAD GEM
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-600 uppercase">
                    {book.format}
                  </span>
                </div>
                <h4 className="font-black text-sm uppercase text-[#111827] group-hover:text-[#FF4757] transition-colors line-clamp-2">
                  {book.title}
                </h4>
                {book.author && (
                  <p className="text-xs font-bold text-slate-600 uppercase mt-1">
                    {book.author}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-2 border-t border-slate-300 flex items-center justify-between text-xs font-black text-slate-800">
                <span className="uppercase text-[10px] text-slate-500">
                  {book.medium || 'Book'}
                </span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Open Vault <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Most Completed Series */}
      {activeTab === 'completed' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.mostCompletedSeries.map((s) => (
            <div
              key={s.seriesName}
              onClick={() => onOpenSeries?.(s.seriesName)}
              className="p-4 bg-paper-texture border-3 border-[#111827] rounded-2xl shadow-[4px_4px_0_#111827] hover:shadow-[6px_6px_0_#111827] hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-black text-sm uppercase text-[#111827] line-clamp-1">
                    {s.seriesName}
                  </h4>
                  <p className="text-xs font-bold text-slate-600 uppercase">
                    {s.totalVols} Volumes in Run
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-[#FFDE59] border-2 border-[#111827] rounded-md text-[10px] font-black uppercase">
                  {s.completedVols}/{s.totalVols} READ
                </span>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-2.5 border-2 border-[#111827] overflow-hidden">
                <div
                  className="bg-[#2ED573] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(8, s.percentCompleted)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-black text-slate-800">
                <span className="text-[10px] uppercase text-slate-600">
                  {s.percentCompleted}% Series Complete
                </span>
                <span className="flex items-center gap-1 text-[#111827]">
                  View Reading Order <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Most Read / Active */}
      {activeTab === 'most-read' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.mostRead.map((item) => (
            <div
              key={item.book.id}
              onClick={() => onOpenBook(item.book)}
              className="p-4 bg-paper-texture border-3 border-[#111827] rounded-2xl shadow-[4px_4px_0_#111827] hover:shadow-[6px_6px_0_#111827] hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-black text-sm uppercase text-[#111827] line-clamp-1">
                    {item.book.title}
                  </h4>
                  <p className="text-xs font-bold text-slate-600 uppercase">
                    {item.book.series || 'Standalone'}
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-[#FF4757] text-white border-2 border-[#111827] rounded-md text-[10px] font-black uppercase">
                  {item.progress.percent_read}% READ
                </span>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-2.5 border-2 border-[#111827] overflow-hidden">
                <div
                  className="bg-[#FFDE59] h-full rounded-full transition-all duration-300"
                  style={{ width: `${item.progress.percent_read}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-black text-slate-800">
                <span className="text-[10px] uppercase text-slate-600">
                  Page {item.progress.last_page || 1}
                </span>
                <span className="flex items-center gap-1 text-[#111827]">
                  Resume <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
