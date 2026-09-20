'use client';

import React from 'react';
import Link from 'next/link';
import {
  Trophy,
  Search,
  X,
  SlidersHorizontal,
  FilePlus,
  Layers,
  LayoutGrid,
  List,
  Sparkles,
  BookOpen,
  Filter,
  ArrowLeft,
  Home,
} from 'lucide-react';
import { ShelfViewMode, FilterCategory, SortOption, IngestionProgressState } from '@/types/trophy';

interface TrophyHeaderProps {
  viewMode: ShelfViewMode;
  onViewModeChange: (mode: ShelfViewMode) => void;
  filter: FilterCategory;
  onFilterChange: (filter: FilterCategory) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddModal: () => void;
  onOpenSettingsModal: () => void;
  totalBooks: number;
  offlineCount?: number;
  inProgressCount?: number;
  ingestionProgress?: IngestionProgressState | null;
}

export default function TrophyHeader({
  viewMode,
  onViewModeChange,
  filter,
  onFilterChange,
  sortOption,
  onSortChange,
  searchQuery,
  onSearchChange,
  onOpenAddModal,
  onOpenSettingsModal,
  totalBooks,
  offlineCount = 0,
  inProgressCount = 0,
  ingestionProgress,
}: TrophyHeaderProps) {
  const percentProgress = ingestionProgress
    ? Math.round((ingestionProgress.currentFileIndex / Math.max(1, ingestionProgress.totalFiles)) * 100)
    : 0;

  // Determine current format and status values from filter
  const formatValue = ['cbz', 'epub', 'pdf'].includes(filter) ? filter : 'all';
  const statusValue = ['in-progress', 'completed', 'offline'].includes(filter) ? filter : 'all';

  return (
    <header className="sticky top-0 z-40 bg-[#F8F9FA] border-b-4 border-[#111827] shadow-[0_4px_0_#111827] pt-safe -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-3.5 mb-6">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Row 1: Brand + Stats + Action Buttons */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Logo & Title & Homepage Link */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Back to Homepage Button */}
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-[#111827] font-black text-xs uppercase tracking-wider rounded-2xl border-3 border-[#111827] shadow-[3px_3px_0_#111827] active:translate-x-0.5 active:translate-y-0.5 transition-all group shrink-0"
              title="Return to Rock The Western World Homepage"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5] group-hover:-translate-x-0.5 transition-transform text-[#FF4757]" />
              <span className="hidden sm:inline">Rock The Western World</span>
              <span className="sm:hidden">Home</span>
            </Link>

            <div className="relative">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#FFDE59] border-3 border-[#111827] flex items-center justify-center shadow-[3px_3px_0_#111827] transform -rotate-2 hover:rotate-0 transition-transform">
                <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-[#111827] fill-[#FF4757]" />
              </div>
              {offlineCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#2ED573] text-[#111827] border-2 border-[#111827] text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-[1px_1px_0_#111827]">
                  {offlineCount}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-4xl font-hero tracking-wider text-[#111827] drop-shadow-[2px_2px_0_#FFDE59] uppercase leading-none">
                  TROPHY ROOM
                </h1>
                <span className="bg-[#FF4757] text-white border-2 border-[#111827] text-[10px] sm:text-[11px] font-comic font-black px-1.5 sm:px-2 py-0.5 rounded-lg shadow-[2px_2px_0_#111827] uppercase tracking-wider -rotate-3">
                  IPAD EDITION
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-bold font-comic text-slate-600 tracking-wide mt-0.5">
                The Stacks • Offline Comic & eBook Library
              </p>
            </div>
          </div>

          {/* Right Action Icons & View Switcher */}
          <div className="flex items-center gap-2.5">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-white p-1 rounded-2xl border-3 border-[#111827] shadow-[3px_3px_0_#111827]">
              <button
                onClick={() => onViewModeChange('stacked')}
                className={`p-1.5 rounded-xl transition-all ${
                  viewMode === 'stacked'
                    ? 'bg-[#111827] text-[#FFDE59]'
                    : 'text-slate-600 hover:text-black'
                }`}
                title="Bundled Stacks View"
              >
                <Layers className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-1.5 rounded-xl transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#111827] text-[#FFDE59]'
                    : 'text-slate-600 hover:text-black'
                }`}
                title="All Covers Grid"
              >
                <LayoutGrid className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-1.5 rounded-xl transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#111827] text-[#FFDE59]'
                    : 'text-slate-600 hover:text-black'
                }`}
                title="Detailed List View"
              >
                <List className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Add Files Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 bg-[#2ED573] hover:bg-[#26af5f] text-[#111827] font-black text-sm tracking-wide px-4 py-2.5 rounded-2xl border-3 border-[#111827] shadow-[3px_3px_0_#111827] active:translate-x-0.5 active:translate-y-0.5 transition-all"
              title="Add or ingest files to Cloudflare R2"
            >
              <FilePlus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Files</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettingsModal}
              className="flex items-center gap-2 bg-[#FFDE59] hover:bg-[#f3cb30] text-[#111827] font-black text-sm tracking-wide px-4 py-2.5 rounded-2xl border-3 border-[#111827] shadow-[3px_3px_0_#111827] active:translate-x-0.5 active:translate-y-0.5 transition-all"
              title="Reader settings & display preferences"
            >
              <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Global Live Ingestion Progress Banner */}
        {ingestionProgress && ingestionProgress.isIngesting && (
          <div className="p-3 bg-gradient-to-r from-amber-100 to-emerald-100 rounded-xl border-2 border-[#111827] shadow-[3px_3px_0_#111827] animate-in fade-in duration-200">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
                <span className="font-black text-xs uppercase tracking-wider text-[#111827]">
                  Indexing File {ingestionProgress.currentFileIndex} of {ingestionProgress.totalFiles}:
                </span>
                <span className="font-bold text-xs text-slate-800 truncate max-w-xs sm:max-w-md">
                  {ingestionProgress.currentFileName}
                </span>
              </div>
              <span className="font-mono font-black text-xs text-[#111827]">
                {percentProgress}%
              </span>
            </div>

            <div className="w-full bg-white h-2 rounded-full border border-[#111827] overflow-hidden">
              <div
                className="h-full bg-[#2ED573] transition-all duration-300"
                style={{ width: `${percentProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Row 2: Full-Width Search Bar */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4 text-[#111827] stroke-[2.5]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search comics, series, manga, or tags..."
            className="w-full pl-10 pr-9 py-2.5 bg-white text-[#111827] placeholder:text-slate-400 font-sans text-sm font-semibold rounded-2xl border-3 border-[#111827] shadow-[3px_3px_0_#111827] focus:outline-none focus:ring-2 focus:ring-[#FFDE59]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-black"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* Row 3: Medium Filter Ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: `ALL (${totalBooks})`, icon: '📚' },
            { id: 'comic', label: 'COMICS', icon: '🦸' },
            { id: 'manga', label: 'MANGA', icon: '⛩️' },
            { id: 'cookbook', label: 'COOKBOOKS', icon: '🍳' },
            { id: 'reference', label: 'REFERENCE (101s)', icon: '🛠️' },
            { id: 'wellness', label: 'WELLNESS', icon: '🧘' },
            { id: 'magazine', label: 'MAGAZINES', icon: '📰' },
            { id: 'favorites', label: 'FAVORITES', icon: '⭐' },
          ].map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onFilterChange(tab.id as FilterCategory)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[#111827] font-black text-xs uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#111827] text-[#FFDE59] shadow-[2px_2px_0_#FF4757]'
                    : 'bg-white text-[#111827] hover:bg-amber-50 shadow-[1.5px_1.5px_0_#111827]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Row 4: Format, Status & Sort Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Format Dropdown */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#111827]">
            <BookOpen className="w-3.5 h-3.5 text-[#FF4757] stroke-[2.5]" />
            <label className="text-[11px] font-black uppercase text-slate-700 whitespace-nowrap">
              FORMAT:
            </label>
            <select
              value={formatValue}
              onChange={(e) => onFilterChange(e.target.value as FilterCategory)}
              className="bg-transparent text-[#111827] text-xs font-black tracking-wide focus:outline-none cursor-pointer pl-1 uppercase"
            >
              <option value="all">All File Formats</option>
              <option value="cbz">CBZ Comics</option>
              <option value="epub">EPUB eBooks</option>
              <option value="pdf">PDF Documents</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#111827]">
            <Filter className="w-3.5 h-3.5 text-[#2ED573] stroke-[2.5]" />
            <label className="text-[11px] font-black uppercase text-slate-700 whitespace-nowrap">
              STATUS:
            </label>
            <select
              value={statusValue}
              onChange={(e) => onFilterChange(e.target.value as FilterCategory)}
              className="bg-transparent text-[#111827] text-xs font-black tracking-wide focus:outline-none cursor-pointer pl-1 uppercase"
            >
              <option value="all">All Statuses</option>
              <option value="in-progress">In Progress ({inProgressCount})</option>
              <option value="completed">Completed</option>
              <option value="offline">Downloaded / OPFS ({offlineCount})</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#111827]">
            <label className="text-[11px] font-black uppercase text-slate-700 whitespace-nowrap">
              SORT:
            </label>
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-transparent text-[#111827] text-xs font-black tracking-wide focus:outline-none cursor-pointer pl-1 uppercase"
            >
              <option value="series-asc">Series & Issue</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="recently-read">Recently Read</option>
              <option value="progress-desc">Highest Progress</option>
              <option value="issue-asc">Issue / Volume #</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
