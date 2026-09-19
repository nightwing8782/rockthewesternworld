'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { TrophyBook, ReaderSettings } from '@/types/trophy';
import { getBookFromOpfs } from '@/lib/trophy/opfs';
import CbzReader from './CbzReader';
import EpubReader from './EpubReader';
import PdfReader from './PdfReader';
import ReaderHUD from './ReaderHUD';
import AmberOverlay from '../layout/AmberOverlay';
import SettingsModal from '../modals/SettingsModal';

interface ReaderContainerProps {
  book: TrophyBook;
  onClose: () => void;
  onUpdateProgress: (bookId: string, lastPage: number, totalPages: number, currentCfi?: string | null) => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
  isOffline?: boolean;
  onToggleOffline?: () => Promise<boolean>;
}

export default function ReaderContainer({
  book,
  onClose,
  onUpdateProgress,
  settings,
  onUpdateSettings,
  isOffline,
  onToggleOffline,
}: ReaderContainerProps) {
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);
  const [loadingFile, setLoadingFile] = useState(true);
  const [fileError, setFileError] = useState<string | null>(null);
  const [hudVisible, setHudVisible] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Current page & total pages
  const [currentPage, setCurrentPage] = useState<number>(book.progress?.last_page || 1);
  const [totalPages, setTotalPages] = useState<number>(book.page_count || 1);
  const [currentCfi, setCurrentCfi] = useState<string | null>(book.progress?.current_cfi || null);

  // Hide HUD timer
  const hudTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetHudTimer = useCallback(() => {
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    hudTimeoutRef.current = setTimeout(() => {
      setHudVisible(false);
    }, 4500);
  }, []);

  const toggleHUD = useCallback(() => {
    setHudVisible((prev) => {
      const next = !prev;
      if (next) resetHudTimer();
      return next;
    });
  }, [resetHudTimer]);

  // Load Book Data: Check OPFS first, then Stream from Cloudflare R2
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setLoadingFile(true);
      setFileError(null);

      try {
        // 1. Try local OPFS cache
        const localBlob = await getBookFromOpfs(book.id);
        if (localBlob && !isCancelled) {
          setFileBlob(localBlob);
          setLoadingFile(false);
          resetHudTimer();
          return;
        }

        // 2. Fetch presigned streaming URL from R2
        const res = await fetch('/api/trophy/stream-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileKey: book.file_key }),
        });

        const resText = await res.text();
        let data: any = {};
        try {
          data = JSON.parse(resText);
        } catch (e) {
          throw new Error(
            res.status === 500
              ? 'R2 credentials may not be configured in your server environment variables.'
              : `Server returned unexpected response (${res.status}): ${resText.slice(0, 100)}`
          );
        }

        if (!res.ok || !data.streamUrl) {
          throw new Error(data?.error || `Failed to generate stream URL (Status ${res.status})`);
        }

        const fileResponse = await fetch(data.streamUrl);
        if (!fileResponse.ok) {
          throw new Error(`Failed to download stream from storage (${fileResponse.status})`);
        }

        const blob = await fileResponse.blob();
        if (!isCancelled) {
          setFileBlob(blob);
          setLoadingFile(false);
          resetHudTimer();
        }
      } catch (err: any) {
        console.error('[ReaderContainer] Error loading book binary:', err);
        if (!isCancelled) {
          setFileError(err.message || 'Unable to stream book content.');
          setLoadingFile(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
      if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    };
  }, [book.id, book.file_key, resetHudTimer]);

  // Progress Update Handler
  const handlePageChange = useCallback(
    (page: number, total: number = totalPages) => {
      const safePage = Math.max(1, page);
      const safeTotal = Math.max(1, total);
      setCurrentPage(safePage);
      setTotalPages(safeTotal);
      onUpdateProgress(book.id, safePage, safeTotal, currentCfi);
      resetHudTimer();
    },
    [book.id, totalPages, currentCfi, onUpdateProgress, resetHudTimer]
  );

  const handleEpubProgress = useCallback(
    (percent: number, cfi: string, page: number, total: number) => {
      setCurrentPage(page);
      setTotalPages(total);
      setCurrentCfi(cfi);
      onUpdateProgress(book.id, page, total, cfi);
      resetHudTimer();
    },
    [book.id, onUpdateProgress, resetHudTimer]
  );

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden select-none">
      {/* Amber Night Filter Overlay */}
      <AmberOverlay percent={settings.amberFilterPercent} />

      {/* Loading State */}
      {loadingFile && (
        <div className="flex flex-col items-center justify-center space-y-4 text-stone-300">
          <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
          <p className="font-serif text-lg tracking-wide text-stone-200">Opening {book.title}...</p>
          <p className="font-mono text-xs uppercase tracking-widest text-stone-500">Streaming from zero-egress vault</p>
        </div>
      )}

      {/* Error State */}
      {!loadingFile && fileError && (
        <div className="max-w-md p-6 bg-stone-900 border border-stone-800 rounded-xl text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="font-serif text-lg font-bold text-stone-100">Unable to Stream Document</h2>
          <p className="font-sans text-sm text-stone-400">{fileError}</p>
          <div className="pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono tracking-wider uppercase rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Shelf
            </button>
          </div>
        </div>
      )}

      {/* Active Reader */}
      {!loadingFile && !fileError && fileBlob && (
        <div className="w-full h-full relative">
          {book.format === 'cbz' && (
            <CbzReader
              fileBlob={fileBlob}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              onToggleHUD={toggleHUD}
              settings={settings}
            />
          )}

          {book.format === 'epub' && (
            <EpubReader
              fileBlob={fileBlob}
              initialCfi={book.progress?.current_cfi}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              onProgressUpdate={handleEpubProgress}
              onToggleHUD={toggleHUD}
              settings={settings}
            />
          )}

          {book.format === 'pdf' && (
            <PdfReader
              fileBlob={fileBlob}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              onToggleHUD={toggleHUD}
              settings={settings}
            />
          )}
        </div>
      )}

      {/* Reader HUD Overlays */}
      {!loadingFile && !fileError && (
        <ReaderHUD
          book={book}
          visible={hudVisible}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => handlePageChange(p, totalPages)}
          onClose={onClose}
          onOpenSettings={() => setIsSettingsOpen(true)}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          isOffline={isOffline}
          onToggleOffline={onToggleOffline}
        />
      )}

      {/* Reader Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        format={book.format}
      />
    </div>
  );
}
