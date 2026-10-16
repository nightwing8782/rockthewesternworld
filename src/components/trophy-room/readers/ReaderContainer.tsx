'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { TrophyBook, ReaderSettings } from '@/types/trophy';
import { getBookFromOpfs, saveBookToOpfs } from '@/lib/trophy/opfs';
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
  const [downloadProgress, setDownloadProgress] = useState<{
    percent: number;
    loadedMb: string;
    totalMb: string;
    speedMb?: string;
  } | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [hudVisible, setHudVisible] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Current page & total pages
  const [currentPage, setCurrentPage] = useState<number>(book.progress?.last_page || 1);
  const [totalPages, setTotalPages] = useState<number>(book.page_count || 1);
  const [currentCfi, setCurrentCfi] = useState<string | null>(book.progress?.current_cfi || null);

  // Restore local progress fallback if available
  useEffect(() => {
    try {
      const localProgStr = localStorage.getItem(`rww_trophy_prog_${book.id}`);
      if (localProgStr) {
        const localProg = JSON.parse(localProgStr);
        if (localProg.last_page && !book.progress?.last_page) {
          setCurrentPage(localProg.last_page);
        }
        if (localProg.current_cfi && !book.progress?.current_cfi) {
          setCurrentCfi(localProg.current_cfi);
        }
        if (localProg.total_pages && (!book.page_count || book.page_count <= 1)) {
          setTotalPages(localProg.total_pages);
        }
      }
    } catch {}
  }, [book.id, book.progress]);

  // Prevent browser viewport scrolling and bounce on iPad/Safari/Chrome while reader is mounted
  useEffect(() => {
    const originalOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    const originalOverscroll = (document.body.style as any).overscrollBehavior;

    document.documentElement.style.overflow = 'hidden';
    (document.documentElement.style as any).overscrollBehavior = 'none';
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    (document.body.style as any).overscrollBehavior = 'none';

    return () => {
      document.documentElement.style.overflow = originalOverflow;
      (document.documentElement.style as any).overscrollBehavior = originalOverscroll;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.touchAction = originalTouchAction;
      (document.body.style as any).overscrollBehavior = originalOverscroll;
    };
  }, []);

  // Compute effective settings with book metadata intelligence
  const effectiveSettings: ReaderSettings = {
    ...settings,
    readingDirection:
      settings.readingDirection ||
      book.reading_direction ||
      (book.medium === 'manga' ? 'rtl' : 'ltr'),
    pageSpreadMode:
      settings.pageSpreadMode ||
      (settings.dualPageLandscape ? 'auto' : 'single'),
    firstPageCoverOffset:
      settings.firstPageCoverOffset !== undefined ? settings.firstPageCoverOffset : true,
  };

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
    const abortController = new AbortController();

    async function loadData() {
      setLoadingFile(true);
      setFileError(null);
      setDownloadProgress(null);

      try {
        // 1. Try local OPFS cache
        const localBlob = await getBookFromOpfs(book.id);
        if (localBlob && !isCancelled) {
          setFileBlob(localBlob);
          setLoadingFile(false);
          resetHudTimer();
          return;
        }

        // 2. Fetch presigned streaming URL
        let streamUrl: string | null = null;
        try {
          const { getPresignedDownloadUrl } = await import('@/lib/trophy/s3');
          streamUrl = await getPresignedDownloadUrl(book.file_key, 86400);
        } catch (s3Err) {
          console.warn('[ReaderContainer] Client presigning fallback attempt:', s3Err);
        }

        if (!streamUrl) {
          throw new Error('Failed to generate streaming URL for this title.');
        }

        // 30s connection / 120s stream timeout
        const timeoutId = setTimeout(() => {
          abortController.abort();
        }, 120000);

        const startTime = Date.now();
        const fileResponse = await fetch(streamUrl, {
          signal: abortController.signal,
        });

        if (!fileResponse.ok) {
          clearTimeout(timeoutId);
          throw new Error(`Storage server returned error (${fileResponse.status}: ${fileResponse.statusText})`);
        }

        const contentLengthHeader = fileResponse.headers.get('content-length');
        const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
        const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';

        let blob: Blob;

        if (!fileResponse.body || totalBytes === 0) {
          blob = await fileResponse.blob();
        } else if (totalBytes >= 30 * 1024 * 1024) {
          // Large file optimization: 4 parallel range streams to maximize bandwidth utilization
          const numWorkers = 4;
          const chunkSize = Math.ceil(totalBytes / numWorkers);
          let loadedBytes = 0;
          let lastProgressUpdate = Date.now();
          let lastLoaded = 0;
          let rollingSpeedMb = '0.0';

          const workerPromises = Array.from({ length: numWorkers }, async (_, workerIdx) => {
            const rangeStart = workerIdx * chunkSize;
            const rangeEnd = Math.min((workerIdx + 1) * chunkSize - 1, totalBytes - 1);
            if (rangeStart > rangeEnd) return new Uint8Array(0);

            const rangeRes = await fetch(streamUrl, {
              headers: { Range: `bytes=${rangeStart}-${rangeEnd}` },
              signal: abortController.signal,
            });

            if (!rangeRes.ok || !rangeRes.body) {
              const buf = await rangeRes.arrayBuffer();
              loadedBytes += buf.byteLength;
              return new Uint8Array(buf);
            }

            const rReader = rangeRes.body.getReader();
            const rChunks: Uint8Array[] = [];

            while (true) {
              const { done, value } = await rReader.read();
              if (done) break;
              if (isCancelled) {
                rReader.cancel();
                return new Uint8Array(0);
              }
              rChunks.push(value);
              loadedBytes += value.length;

              const now = Date.now();
              const timeDeltaSec = (now - lastProgressUpdate) / 1000;
              if (timeDeltaSec > 0.25 || loadedBytes === totalBytes) {
                if (timeDeltaSec > 0) {
                  const bytesDelta = loadedBytes - lastLoaded;
                  rollingSpeedMb = (bytesDelta / timeDeltaSec / (1024 * 1024)).toFixed(1);
                  lastLoaded = loadedBytes;
                  lastProgressUpdate = now;
                }

                const percent = Math.min(100, Math.round((loadedBytes / totalBytes) * 100));
                const loadedMb = (loadedBytes / (1024 * 1024)).toFixed(1);
                const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);

                setDownloadProgress({
                  percent,
                  loadedMb,
                  totalMb,
                  speedMb: `${rollingSpeedMb} MB/s`,
                });
              }
            }

            const workerTotal = rChunks.reduce((acc, c) => acc + c.length, 0);
            const mergedWorker = new Uint8Array(workerTotal);
            let offset = 0;
            for (const chunk of rChunks) {
              mergedWorker.set(chunk, offset);
              offset += chunk.length;
            }
            return mergedWorker;
          });

          const workerBuffers = await Promise.all(workerPromises);
          blob = new Blob(workerBuffers, { type: contentType });
        } else {
          // Standard single-stream for smaller files (< 30 MB)
          const reader = fileResponse.body.getReader();
          const chunks: BlobPart[] = [];
          let loadedBytes = 0;
          let lastProgressUpdate = Date.now();
          let lastLoaded = 0;
          let rollingSpeedMb = '0.0';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (isCancelled) {
              reader.cancel();
              return;
            }

            chunks.push(value);
            loadedBytes += value.length;

            const now = Date.now();
            const timeDeltaSec = (now - lastProgressUpdate) / 1000;
            if (timeDeltaSec > 0.25 || loadedBytes === totalBytes) {
              if (timeDeltaSec > 0) {
                const bytesDelta = loadedBytes - lastLoaded;
                rollingSpeedMb = (bytesDelta / timeDeltaSec / (1024 * 1024)).toFixed(1);
                lastLoaded = loadedBytes;
                lastProgressUpdate = now;
              }

              const percent = totalBytes > 0 ? Math.min(100, Math.round((loadedBytes / totalBytes) * 100)) : 0;
              const loadedMb = (loadedBytes / (1024 * 1024)).toFixed(1);
              const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);

              setDownloadProgress({
                percent,
                loadedMb,
                totalMb,
                speedMb: `${rollingSpeedMb} MB/s`,
              });
            }
          }

          blob = new Blob(chunks, { type: contentType });
        }

        clearTimeout(timeoutId);

        if (!isCancelled) {
          setFileBlob(blob);
          setLoadingFile(false);
          resetHudTimer();

          // Save to OPFS for instant subsequent opens (deferred to prioritize initial reader render)
          setTimeout(() => {
            saveBookToOpfs(book.id, blob).catch((e) => {
              console.warn('[ReaderContainer] Could not persist to OPFS cache:', e);
            });
          }, 600);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('[ReaderContainer] Error streaming book binary:', err);
          const errorMsg =
            err.name === 'AbortError'
              ? 'Download connection timed out. Please check your internet connection and try again.'
              : err.message || 'Unable to stream book content.';
          setFileError(errorMsg);
          setLoadingFile(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
      abortController.abort();
      if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    };
  }, [book.id, book.file_key, retryTrigger, resetHudTimer]);

  // Direction Change Feedback Toast
  const [directionToast, setDirectionToast] = useState<string | null>(null);
  const prevDirectionRef = useRef(effectiveSettings.readingDirection);

  useEffect(() => {
    if (prevDirectionRef.current !== effectiveSettings.readingDirection) {
      prevDirectionRef.current = effectiveSettings.readingDirection;
      const isRtl = effectiveSettings.readingDirection === 'rtl';
      setDirectionToast(
        isRtl
          ? '⛩️ Manga Mode (RTL): Tap Left or Swipe Right to Advance'
          : '🦸 Comic Mode (LTR): Tap Right or Swipe Left to Advance'
      );
      const t = setTimeout(() => setDirectionToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [effectiveSettings.readingDirection]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape' || e.key === 'h' || e.key === 'm') {
        toggleHUD();
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [toggleHUD]);

  // Progress Update Handler (deterministic functional state updater prevents stale closures)
  const handlePageChange = useCallback(
    (page: number, total?: number) => {
      const safePage = Math.max(1, page);
      setCurrentPage(safePage);
      setTotalPages((prevTotal) => {
        const resolvedTotal = total !== undefined && total > 0 ? total : Math.max(1, prevTotal);
        onUpdateProgress(book.id, safePage, resolvedTotal, currentCfi);
        try {
          localStorage.setItem(
            `rww_trophy_prog_${book.id}`,
            JSON.stringify({
              book_id: book.id,
              last_page: safePage,
              total_pages: resolvedTotal,
              current_cfi: currentCfi,
              last_read_at: new Date().toISOString(),
            })
          );
        } catch {}
        return resolvedTotal;
      });
      resetHudTimer();
    },
    [book.id, currentCfi, onUpdateProgress, resetHudTimer]
  );

  const handleEpubProgress = useCallback(
    (percent: number, cfi: string, page: number, total: number) => {
      const safePage = Math.max(1, page);
      const safeTotal = Math.max(1, total);
      setCurrentPage(safePage);
      setTotalPages(safeTotal);
      setCurrentCfi(cfi);
      onUpdateProgress(book.id, safePage, safeTotal, cfi);
      try {
        localStorage.setItem(
          `rww_trophy_prog_${book.id}`,
          JSON.stringify({
            book_id: book.id,
            last_page: safePage,
            total_pages: safeTotal,
            current_cfi: cfi,
            percent_read: percent,
            last_read_at: new Date().toISOString(),
          })
        );
      } catch {}
      resetHudTimer();
    },
    [book.id, onUpdateProgress, resetHudTimer]
  );

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden select-none touch-none overscroll-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-screen h-[100dvh]">
      {/* Top Edge Hover Rescue Zone for Desktop Mouse Navigation */}
      <div
        onMouseEnter={() => {
          setHudVisible(true);
          resetHudTimer();
        }}
        className="fixed top-0 left-0 right-0 h-8 z-40 cursor-default"
        aria-hidden="true"
      />

      {/* Direction Feedback Toast */}
      {directionToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 text-amber-300 font-mono text-xs px-4 py-2 rounded-full border border-amber-600/60 shadow-2xl backdrop-blur-md pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-2">
          {directionToast}
        </div>
      )}

      {/* Amber Night Filter Overlay */}
      <AmberOverlay percent={effectiveSettings.amberFilterPercent} />

      {/* Loading State with Real-Time Progress Bar */}
      {loadingFile && (
        <div className="flex flex-col items-center justify-center space-y-5 text-stone-300 max-w-sm w-full px-6 text-center">
          <div className="relative">
            <Loader2 className="w-14 h-14 animate-spin text-[#FFDE59]" />
          </div>
          <div className="space-y-1.5">
            <p className="font-serif text-lg tracking-wide text-stone-100 font-bold">{book.title}</p>
            <p className="font-mono text-xs uppercase tracking-widest text-stone-400">
              {downloadProgress ? 'Streaming from Zero-Egress Vault' : 'Connecting to Vault...'}
            </p>
          </div>

          {downloadProgress ? (
            <div className="w-full space-y-2">
              <div className="w-full bg-stone-800 rounded-full h-3 overflow-hidden border border-stone-700 shadow-inner">
                <div
                  className="bg-[#FFDE59] h-full transition-all duration-150 ease-out rounded-full"
                  style={{ width: `${downloadProgress.percent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-stone-400 px-0.5">
                <span className="font-bold text-[#FFDE59]">{downloadProgress.percent}%</span>
                <span>{downloadProgress.loadedMb} / {downloadProgress.totalMb} MB</span>
                {downloadProgress.speedMb && (
                  <span className="text-stone-500">{downloadProgress.speedMb}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Initializing secure stream...
            </div>
          )}
        </div>
      )}

      {/* Error State with Retry Button */}
      {!loadingFile && fileError && (
        <div className="max-w-md p-6 bg-stone-900 border-2 border-stone-800 rounded-2xl text-center space-y-4 shadow-2xl">
          <AlertTriangle className="w-12 h-12 text-[#FF4757] mx-auto" />
          <h2 className="font-serif text-lg font-bold text-stone-100">Unable to Stream Document</h2>
          <p className="font-sans text-xs text-stone-400 leading-relaxed">{fileError}</p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => setRetryTrigger((prev) => prev + 1)}
              className="px-4 py-2 bg-[#FFDE59] hover:bg-[#ffcf21] text-[#111827] text-xs font-bold font-mono tracking-wider uppercase rounded-lg transition-colors shadow-md"
            >
              Retry Download
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono tracking-wider uppercase rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Shelf
            </button>
          </div>
        </div>
      )}

      {/* Active Reader */}
      {!loadingFile && !fileError && fileBlob && (
        <div className="w-full h-full relative overflow-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {book.format === 'cbz' && (
            <CbzReader
              fileBlob={fileBlob}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              onToggleHUD={toggleHUD}
              settings={effectiveSettings}
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
              settings={effectiveSettings}
              bookMedium={book.medium}
            />
          )}

          {book.format === 'pdf' && (
            <PdfReader
              fileBlob={fileBlob}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              onToggleHUD={toggleHUD}
              settings={effectiveSettings}
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
          onPageChange={(p) => handlePageChange(p)}
          onClose={onClose}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleHUD={toggleHUD}
          settings={effectiveSettings}
          onUpdateSettings={onUpdateSettings}
          isOffline={isOffline}
          onToggleOffline={onToggleOffline}
        />
      )}

      {/* Reader Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={effectiveSettings}
        onUpdateSettings={onUpdateSettings}
        format={book.format}
      />
    </div>
  );
}
