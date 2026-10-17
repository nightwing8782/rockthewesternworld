'use client';

import React from 'react';
import { X, Building2, Layers, BookOpen, ArrowRight } from 'lucide-react';
import { TrophyBook, TrophyProgress } from '@/types/trophy';
import { getPublisherProfile } from '@/lib/trophy/discoveryEngine';
import BookCard from '../shelf/BookCard';

interface PublisherLandingModalProps {
  publisherName: string | null;
  allBooks: TrophyBook[];
  progressMap: Map<string, TrophyProgress>;
  onClose: () => void;
  onOpenBook: (book: TrophyBook) => void;
  onOpenSeries?: (seriesName: string) => void;
  onOpenCreator?: (creator: string) => void;
  onEditMetadata?: (book: TrophyBook) => void;
  onToggleOffline?: (book: TrophyBook) => void;
  onDelete?: (book: TrophyBook) => void;
}

export default function PublisherLandingModal({
  publisherName,
  allBooks,
  progressMap,
  onClose,
  onOpenBook,
  onOpenSeries,
  onOpenCreator,
  onEditMetadata,
  onToggleOffline,
  onDelete,
}: PublisherLandingModalProps) {
  if (!publisherName) return null;

  const profile = getPublisherProfile(publisherName, allBooks, progressMap);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-4 border-[#111827] rounded-3xl shadow-[10px_10px_0_#111827] max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-[#111827]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b-4 border-[#111827] bg-[#FFDE59] shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 rounded-xl bg-white border-2 border-[#111827] shadow-[2px_2px_0_#111827]">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#111827]" />
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#FF4757]">
                PUBLISHER SPOTLIGHT
              </span>
              <h2 className="text-base sm:text-2xl font-black uppercase tracking-wide text-[#111827] line-clamp-1 leading-tight">
                {profile.name}
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-paper-texture space-y-6">
          {/* Publisher Summary Card */}
          <div className="bg-white border-3 border-[#111827] rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0_#111827] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-[#FFDE59] border-2 border-[#111827] rounded-md text-[10px] font-black uppercase">
                  {profile.totalBooks} {profile.totalBooks === 1 ? 'Volume' : 'Volumes'} in Vault
                </span>
                <span className="px-2.5 py-0.5 bg-slate-100 border-2 border-[#111827] rounded-md text-[10px] font-bold uppercase text-slate-700">
                  {profile.seriesRuns.length} Series Runs
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black uppercase text-[#111827]">
                {profile.name}
              </h3>
              <p className="text-xs font-bold text-slate-600 uppercase">
                Primary Specialty: {profile.primaryMedium.toUpperCase()}
              </p>
            </div>

            {/* Format Distribution Pills */}
            <div className="flex items-center gap-2 flex-wrap border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
              {Object.entries(profile.formatBreakdown).map(([fmt, count]) => (
                <span
                  key={fmt}
                  className="px-2.5 py-1 bg-slate-50 border-2 border-[#111827] rounded-lg text-xs font-black uppercase shadow-[2px_2px_0_#111827]"
                >
                  {fmt}: {count}
                </span>
              ))}
            </div>
          </div>

          {/* Flagship Series Runs */}
          {profile.seriesRuns.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-black text-sm sm:text-base uppercase tracking-wide text-[#111827] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#FF4757]" />
                <span>Flagship Series Runs ({profile.seriesRuns.length})</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.seriesRuns.map((run) => (
                  <div
                    key={run.seriesName}
                    onClick={() => {
                      onClose();
                      onOpenSeries?.(run.seriesName);
                    }}
                    className="group p-4 bg-white border-3 border-[#111827] rounded-2xl shadow-[4px_4px_0_#111827] hover:shadow-[6px_6px_0_#111827] hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#FF4757]">
                          {run.volumes} {run.volumes === 1 ? 'Volume' : 'Volumes'}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                          {run.leadBook.medium}
                        </span>
                      </div>
                      <h5 className="font-black text-base uppercase text-[#111827] group-hover:text-[#FF4757] transition-colors line-clamp-1">
                        {run.seriesName}
                      </h5>
                      {run.leadBook.author && (
                        <p className="text-xs font-bold text-slate-600 uppercase mt-0.5">
                          By {run.leadBook.author}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-black text-slate-800">
                      <span className="text-[10px] uppercase text-slate-500">
                        {run.leadBook.reading_direction === 'rtl' ? 'RTL Manga' : 'LTR Western'}
                      </span>
                      <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Explore Series <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sample Publications Grid */}
          {profile.recentBooks.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-black text-sm sm:text-base uppercase tracking-wide text-[#111827] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#FF4757]" />
                <span>Featured Catalog Titles</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {profile.recentBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onOpen={(b) => {
                      onClose();
                      onOpenBook(b);
                    }}
                    onEditMetadata={onEditMetadata}
                    onToggleOffline={onToggleOffline}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 border-t-3 border-[#111827] bg-white flex justify-between items-center text-xs font-bold text-slate-600 shrink-0">
          <span className="font-mono uppercase tracking-wider text-[11px]">
            Trophy Vault Publisher Imprint Archive
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#111827] hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#FF4757] transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
