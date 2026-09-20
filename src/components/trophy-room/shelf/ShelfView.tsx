'use client';

import React, { useState } from 'react';
import {
  TrophyBook,
  SeriesGroup,
  ShelfViewMode,
} from '@/types/trophy';
import { useTrophyLibrary } from '@/hooks/useTrophyLibrary';
import TrophyHeader from '../layout/TrophyHeader';
import SeriesStackCard from './SeriesStackCard';
import BookCard from './BookCard';
import BookListView from './BookListView';
import SeriesPickerModal from './SeriesPickerModal';
import MetadataModal from './MetadataModal';
import AddBookModal from '../modals/AddBookModal';
import SettingsModal from '../modals/SettingsModal';
import ReaderContainer from '../readers/ReaderContainer';
import TrophyErrorBoundary from '../common/TrophyErrorBoundary';
import ContinueReadingDeck from '../hub/ContinueReadingDeck';
import WatchtowerSectorsGrid from '../hub/WatchtowerSectorsGrid';
import { BookOpen, PlusCircle, HardDrive, Layers, LayoutGrid, List, Loader2, ArrowLeft, Compass } from 'lucide-react';

interface ShelfViewProps {
  user: any;
}

export default function ShelfView({ user }: ShelfViewProps) {
  const {
    books,
    filteredBooks,
    seriesGroups,
    isLoading,
    filter,
    setFilter,
    groupBy,
    setGroupBy,
    sortOption,
    setSortOption,
    searchQuery,
    setSearchQuery,
    ingestionProgress,
    settings,
    updateSettings,
    ingestFiles,
    updateProgress,
    updateBookMetadata,
    toggleOffline,
    deleteBook,
    loadLibrary,
  } = useTrophyLibrary(user);

  const [viewMode, setViewMode] = useState<ShelfViewMode>('stacked');
  const [activeBook, setActiveBook] = useState<TrophyBook | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<SeriesGroup | null>(null);
  const [editingBook, setEditingBook] = useState<TrophyBook | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const existingCollections = React.useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => {
      if (Array.isArray(b.collections)) {
        b.collections.forEach((c) => {
          if (typeof c === 'string' && c.trim()) set.add(c.trim());
        });
      }
    });
    return Array.from(set).sort();
  }, [books]);

  const offlineCount = books.filter((b) => b.isOffline).length;
  const totalItemCount = viewMode === 'stacked' ? seriesGroups.length : filteredBooks.length;

  return (
    <TrophyErrorBoundary fallbackTitle="Trophy Vault Shelf Error">
      <div className="min-h-screen bg-paper-texture text-[#111827] font-sans pb-24 selection:bg-[#FFDE59] selection:text-[#111827]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Search, Filter Tabs, and Ingest Action */}
        <TrophyHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          filter={filter}
          onFilterChange={setFilter}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          sortOption={sortOption}
          onSortChange={setSortOption}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsOpen(true)}
          totalBooks={books.length}
          offlineCount={offlineCount}
          inProgressCount={books.filter((b) => b.progress && !b.progress.completed && b.progress.percent_read > 0).length}
          ingestionProgress={ingestionProgress}
        />

        {/* Loading State */}
        {isLoading && (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-[#FF4757]" />
            <p className="font-black text-sm uppercase tracking-widest text-[#111827]">
              Synchronizing library vault...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && totalItemCount === 0 && (
          <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-3xl border-4 border-[#111827] shadow-[8px_8px_0_#111827] text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-[#FFDE59] rounded-2xl border-3 border-[#111827] flex items-center justify-center shadow-[4px_4px_0_#111827] transform -rotate-3">
              <BookOpen className="w-10 h-10 text-[#111827]" />
            </div>
            <h3 className="text-2xl font-black font-space tracking-wider text-[#111827] uppercase">
              {books.length === 0 ? 'YOUR TROPHY ROOM IS READY' : 'NO MATCHING BOOKS FOUND'}
            </h3>
            <p className="mt-2 text-sm font-bold text-slate-600 font-comic">
              {books.length === 0
                ? 'Import your CBZ / CBR comics, EPUB eBooks, or PDF graphic novels to build your personal offline library on this device.'
                : searchQuery
                ? `No titles matched "${searchQuery}". Try searching for another keyword or clear filters.`
                : `There are currently no items under the "${filter.toUpperCase()}" filter.`}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-[#2ED573] hover:bg-[#26af5f] text-[#111827] font-comic text-sm tracking-wider uppercase rounded-2xl border-3 border-[#111827] shadow-[4px_4px_0_#111827] active:scale-95 transition-all font-black"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span>{books.length === 0 ? 'ADD FIRST COMIC / BOOK' : 'ADD LOCAL BOOK'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {!isLoading && totalItemCount > 0 && (
          <main className="space-y-6">
            {/* Hub View Mode: Continue Reading Deck + Watchtower Sector Portals */}
            {filter === 'all' && !searchQuery ? (
              <div className="space-y-8">
                {/* 1. Top Hero: Continue Reading Deck */}
                <ContinueReadingDeck
                  books={books}
                  onOpenBook={(b) => setActiveBook(b)}
                />

                {/* 2. Watchtower Sector Portals Grid */}
                <WatchtowerSectorsGrid
                  books={books}
                  onSelectSector={(sec) => setFilter(sec)}
                  onSelectAll={() => setViewMode('grid')}
                />
              </div>
            ) : (
              /* Focused Sector / Filtered Shelf View */
              <div className="space-y-6">
                {/* Sector Navigation & Control Breadcrumb Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border-4 border-[#111827] shadow-[5px_5px_0_#111827]">
                  {/* Left: Return to Hub + Sector Title */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setFilter('all');
                        setSearchQuery('');
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FFDE59] hover:bg-[#ffcf21] text-[#111827] font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#111827] active:scale-95 transition-all cursor-pointer"
                      title="Return to Watchtower Hub Portals"
                    >
                      <ArrowLeft className="w-4 h-4 stroke-[3]" />
                      <span>Watchtower Hub</span>
                    </button>

                    <div className="h-6 w-0.5 bg-slate-300 hidden sm:block" />

                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#FF4757]">
                        {searchQuery ? 'SEARCH QUERY' : 'ACTIVE SECTOR'}
                      </span>
                      <h3 className="font-black text-sm sm:text-base text-[#111827] uppercase tracking-wide leading-none">
                        {searchQuery
                          ? `Results for "${searchQuery}"`
                          : filter === 'comic'
                          ? '🦸 Sector 01: Comic Archives'
                          : filter === 'manga'
                          ? '⛩️ Sector 02: Manga Sanctuary'
                          : filter === 'cookbook'
                          ? '🍳 Sector 03: The Culinary Vault'
                          : filter === 'reference'
                          ? '🛠️ Sector 04: 101 Reference Stacks'
                          : filter === 'wellness'
                          ? '🧘 Sector 05: Wellness & Habits'
                          : filter === 'magazine'
                          ? '📰 Sector 06: Periodicals & Essays'
                          : filter === 'favorites'
                          ? '⭐ Sector 07: Trophy Hall of Fame'
                          : filter === 'epub'
                          ? '📖 Sector 08: Prose & Literature'
                          : `${filter.toUpperCase()} ARCHIVES`}
                      </h3>
                    </div>
                  </div>

                  {/* Right: View Mode & Count */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {/* View Mode Switcher */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border-2 border-[#111827]">
                      <button
                        onClick={() => setViewMode('stacked')}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs tracking-wider uppercase transition-all ${
                          viewMode === 'stacked'
                            ? 'bg-[#111827] text-[#FFDE59] shadow-[2px_2px_0_#FF4757] font-black'
                            : 'text-slate-700 hover:text-black font-bold'
                        }`}
                        title="Group series into bundle stacks"
                      >
                        <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span className="hidden md:inline">Stacks</span>
                      </button>

                      <button
                        onClick={() => setViewMode('grid')}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs tracking-wider uppercase transition-all ${
                          viewMode === 'grid'
                            ? 'bg-[#111827] text-[#FFDE59] shadow-[2px_2px_0_#FF4757] font-black'
                            : 'text-slate-700 hover:text-black font-bold'
                        }`}
                        title="Display all individual issue covers"
                      >
                        <LayoutGrid className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span className="hidden md:inline">Covers</span>
                      </button>

                      <button
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs tracking-wider uppercase transition-all ${
                          viewMode === 'list'
                            ? 'bg-[#111827] text-[#FFDE59] shadow-[2px_2px_0_#FF4757] font-black'
                            : 'text-slate-700 hover:text-black font-bold'
                        }`}
                        title="Detailed compact list with progress"
                      >
                        <List className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span className="hidden md:inline">List</span>
                      </button>
                    </div>

                    <span className="text-xs font-mono font-black text-slate-700">
                      {viewMode === 'stacked'
                        ? `${seriesGroups.length} Stacks`
                        : `${filteredBooks.length} Titles`}
                    </span>
                  </div>
                </div>

                {/* View Mode 1: Series Stacks (Default) */}
                {viewMode === 'stacked' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {seriesGroups.map((group) => (
                      <SeriesStackCard
                        key={group.seriesName}
                        series={group}
                        onOpenSeries={(s) => setSelectedSeries(s)}
                        onOpenBook={(b) => setActiveBook(b)}
                        onEditMetadata={(b) => setEditingBook(b)}
                        onToggleOffline={toggleOffline}
                        onDelete={deleteBook}
                      />
                    ))}
                  </div>
                )}

                {/* View Mode 2: Individual Grid */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredBooks.map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        onOpen={(b) => setActiveBook(b)}
                        onEditMetadata={(b) => setEditingBook(b)}
                        onToggleOffline={toggleOffline}
                        onDelete={deleteBook}
                      />
                    ))}
                  </div>
                )}

                {/* View Mode 3: Table / List View */}
                {viewMode === 'list' && (
                  <BookListView
                    books={filteredBooks}
                    onOpen={(b) => setActiveBook(b)}
                    onEditMetadata={(b) => setEditingBook(b)}
                    onToggleOffline={toggleOffline}
                    onDelete={deleteBook}
                  />
                )}
              </div>
            )}
          </main>
        )}
      </div>

      {/* Series Run Picker Modal */}
      <SeriesPickerModal
        series={selectedSeries}
        onClose={() => setSelectedSeries(null)}
        onOpenBook={(b) => setActiveBook(b)}
        onEditMetadata={(b) => setEditingBook(b)}
        onToggleOffline={toggleOffline}
        onDelete={deleteBook}
      />

      {/* Edit Metadata Modal */}
      <MetadataModal
        book={editingBook}
        onClose={() => setEditingBook(null)}
        onSaveMetadata={updateBookMetadata}
        existingCollections={existingCollections}
      />

      {/* Add / Ingest Books Modal */}
      <AddBookModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onIngest={ingestFiles}
        progress={ingestionProgress}
      />

      {/* Global Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
      />

      {/* Active Fullscreen Reader Shell */}
      {activeBook && (
        <ReaderContainer
          book={activeBook}
          onClose={() => {
            setActiveBook(null);
            loadLibrary();
          }}
          onUpdateProgress={updateProgress}
          settings={settings}
          onUpdateSettings={updateSettings}
          isOffline={activeBook.isOffline}
          onToggleOffline={() => toggleOffline(activeBook)}
        />
      )}
    </div>
  </TrophyErrorBoundary>
  );
}
