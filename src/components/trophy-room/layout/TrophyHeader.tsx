'use client';

import React from 'react';
import {
  Search,
  Plus,
  Settings,
  Layers,
  Grid,
  List,
  Filter,
  X,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { ShelfViewMode, FilterCategory } from '@/types/trophy';

interface TrophyHeaderProps {
  viewMode: ShelfViewMode;
  onViewModeChange: (mode: ShelfViewMode) => void;
  filter: FilterCategory;
  onFilterChange: (filter: FilterCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddModal: () => void;
  onOpenSettingsModal: () => void;
  totalBooks: number;
}

export default function TrophyHeader({
  viewMode,
  onViewModeChange,
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onOpenAddModal,
  onOpenSettingsModal,
  totalBooks,
}: TrophyHeaderProps) {
  const filterTabs: { id: FilterCategory; label: string }[] = [
    { id: 'all', label: 'All Vault' },
    { id: 'cbz', label: 'Comics (CBZ)' },
    { id: 'epub', label: 'Books (EPUB)' },
    { id: 'pdf', label: 'Documents (PDF)' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'completed', label: 'Finished' },
    { id: 'offline', label: 'Offline Saved' },
  ];

  return (
    <div className="space-y-6 pt-4 pb-6">
      {/* Title Broadsheet Section */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 pb-6 border-b border-stone-800/80">
        <div>
          <div className="flex items-center space-x-2 text-amber-500 font-mono text-xs uppercase tracking-widest mb-1.5">
            <Trophy className="w-4 h-4" />
            <span>Curated Sanctuary & Digital Archive</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-stone-100 uppercase drop-shadow-sm">
            The Trophy Room
          </h1>
          <p className="text-stone-400 font-sans text-xs sm:text-sm mt-1 max-w-xl">
            Zero-egress cloud vault and dedicated reader for illustrated comics, longform literature, and archival manuscripts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5 shrink-0 w-full md:w-auto">
          <button
            onClick={onOpenAddModal}
            className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs font-mono uppercase tracking-wider rounded-lg shadow-lg hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Ingest Files</span>
          </button>

          <button
            onClick={onOpenSettingsModal}
            className="p-2.5 bg-stone-900 border border-stone-800 hover:border-amber-500/50 rounded-lg text-stone-400 hover:text-amber-400 transition-colors"
            title="Global Reader Preferences"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filter, Search & View Mode Controls Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search series, titles, or authors..."
            className="w-full pl-10 pr-9 py-2 bg-stone-900/90 border border-stone-800 rounded-lg text-xs font-sans text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Switcher (Stacks vs Grid vs List) */}
        <div className="flex items-center space-x-1 p-1 bg-stone-900/90 border border-stone-800 rounded-lg shrink-0 self-start lg:self-auto">
          <button
            onClick={() => onViewModeChange('stacked')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
              viewMode === 'stacked'
                ? 'bg-amber-950/60 border border-amber-600/40 text-amber-300 font-bold shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Series Stacks View"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Stacks</span>
          </button>

          <button
            onClick={() => onViewModeChange('grid')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
              viewMode === 'grid'
                ? 'bg-amber-950/60 border border-amber-600/40 text-amber-300 font-bold shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Individual Grid View"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Grid</span>
          </button>

          <button
            onClick={() => onViewModeChange('list')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
              viewMode === 'list'
                ? 'bg-amber-950/60 border border-amber-600/40 text-amber-300 font-bold shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Table List View"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onFilterChange(tab.id)}
            className={`px-3 py-1.5 rounded-full border whitespace-nowrap uppercase tracking-wider transition-colors ${
              filter === tab.id
                ? 'border-amber-500 bg-amber-950/40 text-amber-300 font-bold shadow-sm'
                : 'border-stone-800 bg-stone-900/50 text-stone-400 hover:border-stone-700 hover:text-stone-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
