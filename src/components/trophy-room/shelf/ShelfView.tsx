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
import { Loader2, Plus, Sparkles, BookOpen } from 'lucide-react';

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

  // Ingest wrapper
  const handleIngest = async (files: FileList | File[]) => {
    await ingestFiles(files);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans pb-24 selection:bg-amber-500/30 selection:text-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Search, Filter Tabs, and Ingest Action */}
        <TrophyHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          filter={filter}
          onFilterChange={setFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsOpen(true)}
          totalBooks={books.length}
        />

        {/* Loading State */}
        {isLoading && (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            <p className="font-mono text-xs uppercase tracking-widest text-stone-400">
              Synchronizing library vault...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && books.length === 0 && (
          <div className="py-20 text-center max-w-md mx-auto border border-dashed border-stone-800 rounded-2xl p-8 bg-stone-900/20">
            <div className="w-16 h-16 rounded-full bg-amber-950/40 border border-amber-600/30 flex items-center justify-center text-amber-400 mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-100 mb-2">
              The Trophy Room is Empty
            </h3>
            <p className="text-xs text-stone-400 font-sans mb-6 leading-relaxed">
              Upload your personal collection of CBZ comic books, EPUB digital editions, or PDF manuscripts to begin reading.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs font-mono uppercase tracking-wider rounded-lg shadow-lg hover:shadow-amber-500/20 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Your First Book
            </button>
          </div>
        )}

        {/* Content Views */}
        {!isLoading && books.length > 0 && (
          <main className="mt-4">
            {/* View Mode 1: Series Stacks (Default) */}
            {viewMode === 'stacked' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 sm:gap-6">
                  {seriesGroups.map((group) => (
                    <SeriesStackCard
                      key={group.seriesName}
                      series={group}
                      onOpenSeries={(s) => setSelectedSeries(s)}
                      onOpenBook={(b) => setActiveBook(b)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* View Mode 2: Individual Grid */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 sm:gap-6">
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
        onSaved={() => loadLibrary()}
      />

      {/* Add / Ingest Books Modal */}
      <AddBookModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onIngest={handleIngest}
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
