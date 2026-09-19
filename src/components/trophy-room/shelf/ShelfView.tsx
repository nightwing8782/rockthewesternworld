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
import { BookOpen, PlusCircle, HardDrive, Layers, LayoutGrid, List, Loader2 } from 'lucide-react';

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

  const offlineCount = books.filter((b) => b.isOffline).length;
  const totalItemCount = viewMode === 'stacked' ? seriesGroups.length : filteredBooks.length;

  return (
    <div className="min-h-screen bg-paper-texture text-[#111827] font-sans pb-24 selection:bg-[#FFDE59] selection:text-[#111827]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Search, Filter Tabs, and Ingest Action */}
        <TrophyHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          filter={filter}
          onFilterChange={setFilter}
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

        {/* Content Views */}
        {!isLoading && totalItemCount > 0 && (
          <main className="space-y-6">
            {/* Shelf Bar: View Mode Switcher + Stats */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border-3 border-[#111827] shadow-[4px_4px_0_#111827]">
              {/* Left: View Mode Toggle Buttons */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border-2 border-[#111827]">
                <button
                  onClick={() => setViewMode('stacked')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs tracking-wider uppercase transition-all ${
                    viewMode === 'stacked'
                      ? 'bg-[#111827] text-[#FFDE59] shadow-[2px_2px_0_#FF4757] font-black'
                      : 'text-slate-700 hover:text-black font-bold'
                  }`}
                  title="Group series into bundle stacks"
                >
                  <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>BUNDLED STACKS</span>
                </button>

                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs tracking-wider uppercase transition-all ${
                    viewMode === 'grid'
                      ? 'bg-[#111827] text-[#FFDE59] shadow-[2px_2px_0_#FF4757] font-black'
                      : 'text-slate-700 hover:text-black font-bold'
                  }`}
                  title="Display all individual issue covers"
                >
                  <LayoutGrid className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>ALL COVERS</span>
                </button>

                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs tracking-wider uppercase transition-all ${
                    viewMode === 'list'
                      ? 'bg-[#111827] text-[#FFDE59] shadow-[2px_2px_0_#FF4757] font-black'
                      : 'text-slate-700 hover:text-black font-bold'
                  }`}
                  title="Detailed compact list with progress"
                >
                  <List className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>LIST VIEW</span>
                </button>
              </div>

              {/* Right: Summary info */}
              <div className="flex items-center gap-3 text-xs font-bold text-slate-600 self-end sm:self-center">
                <span>
                  {viewMode === 'stacked'
                    ? `${seriesGroups.length} Series & Standalones`
                    : `${filteredBooks.length} Issues & Books`}
                </span>
                <div className="flex items-center gap-1.5 text-slate-900 bg-amber-100 px-2 py-0.5 rounded-lg border border-[#111827]">
                  <HardDrive className="w-3 h-3 text-amber-700" />
                  <span>R2 Cloud + OPFS Ready</span>
                </div>
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
  );
}
