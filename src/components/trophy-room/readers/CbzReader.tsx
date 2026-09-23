'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import JSZip from 'jszip';
import { AlertTriangle, Loader2, BookOpen, Columns, ZoomIn, ZoomOut } from 'lucide-react';
import { useSwipeGestures } from '@/hooks/useSwipeGestures';
import { ReaderSettings } from '@/types/trophy';

interface CbzReaderProps {
  fileBlob: Blob;
  currentPage: number;
  onPageChange: (page: number, totalPages: number) => void;
  onToggleHUD: () => void;
  settings: ReaderSettings;
}

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|svg|avif|bmp)$/i;

function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'svg') return 'image/svg+xml';
  if (ext === 'avif') return 'image/avif';
  return 'image/jpeg';
}

export default function CbzReader({
  fileBlob,
  currentPage,
  onPageChange,
  onToggleHUD,
  settings,
}: CbzReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Archive Index State
  const zipEntriesRef = useRef<{ name: string; file: JSZip.JSZipObject }[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sliding Window Memory Buffer
  const [pageUrls, setPageUrls] = useState<{ [pageIndex: number]: string }>({});
  const pageCacheRef = useRef<Map<number, string>>(new Map());

  // Visual Tap Flash
  const [tapFlash, setTapFlash] = useState<'left' | 'right' | null>(null);

  // Zoom State
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isZoomed = zoomScale > 1.05;

  // Window size for responsive landscape dual-page
  const [windowSize, setWindowSize] = useState({ width: 1024, height: 768 });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const isLandscape = windowSize.width > windowSize.height && windowSize.width >= 768;
  const isDualPageActive = settings.dualPageLandscape && isLandscape;
  const isRtl = settings.readingDirection === 'rtl';

  // Cleanup all allocated Object URLs on unmount
  const cleanupAllUrls = useCallback(() => {
    pageCacheRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {}
    });
    pageCacheRef.current.clear();
    setPageUrls({});
  }, []);

  useEffect(() => {
    return () => {
      cleanupAllUrls();
    };
  }, [cleanupAllUrls]);

  // 1. Fast Indexing of CBZ Archive (No image decompression on initial load = <50ms instant start)
  useEffect(() => {
    let isCancelled = false;

    async function indexCbz() {
      setInitialLoading(true);
      setError(null);
      cleanupAllUrls();

      try {
        if (!fileBlob || fileBlob.size === 0) {
          throw new Error('CBZ archive is empty (0 bytes).');
        }

        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(fileBlob);
        const imageEntries: { name: string; file: JSZip.JSZipObject }[] = [];

        loadedZip.forEach((relativePath, file) => {
          const filename = relativePath.split('/').pop() || '';
          if (
            !file.dir &&
            IMAGE_EXTENSIONS.test(relativePath) &&
            !relativePath.includes('__MACOSX') &&
            !filename.startsWith('.') &&
            !filename.toLowerCase().includes('thumbs.db')
          ) {
            imageEntries.push({ name: relativePath, file });
          }
        });

        if (imageEntries.length === 0) {
          throw new Error('No images found inside the CBZ archive.');
        }

        // Natural alphanumeric sort (page1.jpg, page2.jpg, ... page10.jpg)
        imageEntries.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        );

        if (!isCancelled) {
          zipEntriesRef.current = imageEntries;
          setTotalPages(imageEntries.length);
          setInitialLoading(false);

          const startPage = Math.min(Math.max(1, currentPage), imageEntries.length);
          onPageChange(startPage, imageEntries.length);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Failed to read CBZ file.');
          setInitialLoading(false);
        }
      }
    }

    indexCbz();

    return () => {
      isCancelled = true;
    };
  }, [fileBlob]);

  // 2. Sliding Window Buffer Engine: Lazily extracts only active & surrounding pages
  const loadPage = useCallback(async (pageIdx: number): Promise<string | null> => {
    if (pageIdx < 1 || pageIdx > zipEntriesRef.current.length) return null;
    if (pageCacheRef.current.has(pageIdx)) {
      return pageCacheRef.current.get(pageIdx)!;
    }

    const entry = zipEntriesRef.current[pageIdx - 1];
    if (!entry) return null;

    try {
      const buffer = await entry.file.async('arraybuffer');
      const mime = getMimeType(entry.name);
      const blob = new Blob([buffer], { type: mime });
      const url = URL.createObjectURL(blob);
      pageCacheRef.current.set(pageIdx, url);
      return url;
    } catch (e) {
      console.warn(`[CbzReader] Failed to extract page ${pageIdx}:`, e);
      return null;
    }
  }, []);

  // Update sliding window on currentPage change
  useEffect(() => {
    if (totalPages === 0 || zipEntriesRef.current.length === 0) return;
    let isCancelled = false;

    async function syncBuffer() {
      // Determine pages to keep in memory: [currentPage - 1, currentPage, currentPage + 1, currentPage + 2]
      const targetPages = new Set<number>();
      targetPages.add(currentPage);
      if (currentPage > 1) targetPages.add(currentPage - 1);
      if (currentPage + 1 <= totalPages) targetPages.add(currentPage + 1);
      if (currentPage + 2 <= totalPages) targetPages.add(currentPage + 2);
      if (isDualPageActive && currentPage + 3 <= totalPages) targetPages.add(currentPage + 3);

      // Load missing target pages in parallel
      const loadPromises = Array.from(targetPages).map(async (p) => {
        const url = await loadPage(p);
        return { p, url };
      });

      const loaded = await Promise.all(loadPromises);
      if (isCancelled) return;

      // Update state
      const nextMap: { [pageIndex: number]: string } = {};
      pageCacheRef.current.forEach((url, p) => {
        nextMap[p] = url;
      });
      setPageUrls({ ...nextMap });

      // Evict pages that are too far away from view (> 4 pages distance)
      pageCacheRef.current.forEach((url, p) => {
        if (Math.abs(p - currentPage) > 4) {
          try {
            URL.revokeObjectURL(url);
          } catch (e) {}
          pageCacheRef.current.delete(p);
        }
      });
    }

    syncBuffer();

    // Reset zoom when navigating to new page
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });

    return () => {
      isCancelled = true;
    };
  }, [currentPage, totalPages, isDualPageActive, loadPage]);

  // Page Navigation Handlers
  const stepSize = isDualPageActive && currentPage > 1 ? 2 : 1;

  const triggerTapFlash = (side: 'left' | 'right') => {
    setTapFlash(side);
    setTimeout(() => setTapFlash(null), 250);
  };

  const nextPage = useCallback(() => {
    if (isZoomed) {
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
      return;
    }
    if (currentPage < totalPages) {
      triggerTapFlash('right');
      const target = Math.min(totalPages, currentPage + stepSize);
      onPageChange(target, totalPages);
    }
  }, [currentPage, totalPages, stepSize, isZoomed, onPageChange]);

  const prevPage = useCallback(() => {
    if (isZoomed) {
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
      return;
    }
    if (currentPage > 1) {
      triggerTapFlash('left');
      const target = Math.max(1, currentPage - stepSize);
      onPageChange(target, totalPages);
    }
  }, [currentPage, totalPages, stepSize, isZoomed, onPageChange]);

  // Double-tap to toggle zoom (1x <-> 2.2x)
  const handleDoubleTap = useCallback((clientX: number, clientY: number) => {
    setZoomScale((prev) => {
      if (prev > 1.2) {
        setPanOffset({ x: 0, y: 0 });
        return 1;
      }
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const cx = clientX - rect.left - rect.width / 2;
        const cy = clientY - rect.top - rect.height / 2;
        setPanOffset({ x: -cx * 0.8, y: -cy * 0.8 });
      }
      return 2.2;
    });
  }, []);

  // Pinch-to-zoom scaling
  const handlePinchZoom = useCallback((scaleDelta: number) => {
    setZoomScale((prev) => {
      const next = Math.min(3.5, Math.max(1, prev * (1 + (scaleDelta - 1) * 0.5)));
      if (next <= 1.05) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // 3-Zone Touch Gestures (Left 30% | Center 40% | Right 30%)
  useSwipeGestures(containerRef, {
    onSwipeLeft: () => (isRtl ? prevPage() : nextPage()),
    onSwipeRight: () => (isRtl ? nextPage() : prevPage()),
    onTapLeft: () => (isRtl ? nextPage() : prevPage()),
    onTapRight: () => (isRtl ? prevPage() : nextPage()),
    onTapCenter: onToggleHUD,
    onDoubleTap: handleDoubleTap,
    onPinchZoom: handlePinchZoom,
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        if (isRtl) prevPage();
        else nextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (isRtl) nextPage();
        else prevPage();
      } else if (e.key === 'Escape') {
        onToggleHUD();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage, isRtl, onToggleHUD]);

  // Loading Screen
  if (initialLoading) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-stone-950 text-stone-300">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest text-stone-400">
          Mounting Comic Vault...
        </p>
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-stone-950 text-rose-400 p-6 text-center">
        <AlertTriangle className="w-12 h-12 mb-3" />
        <h3 className="font-bold text-lg text-white mb-1">Archive Read Error</h3>
        <p className="text-xs text-stone-400 max-w-md font-mono">{error}</p>
      </div>
    );
  }

  // Dual Page Spreads
  const isSoloCover = currentPage === 1;
  const page1Index = currentPage;
  const page2Index = isDualPageActive && !isSoloCover && currentPage + 1 <= totalPages ? currentPage + 1 : null;

  const page1Url = pageUrls[page1Index];
  const page2Url = page2Index ? pageUrls[page2Index] : null;

  return (
    <div
      ref={containerRef}
      className="relative h-[100dvh] w-full bg-[#0a0c10] overflow-hidden select-none touch-none overscroll-none flex items-center justify-center cursor-default"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Subtle Visual Edge Tap Indicator Feedback */}
      {tapFlash === 'left' && (
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-amber-500/20 to-transparent pointer-events-none transition-opacity duration-200 z-20" />
      )}
      {tapFlash === 'right' && (
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-amber-500/20 to-transparent pointer-events-none transition-opacity duration-200 z-20" />
      )}

      {/* Zoom / Page Display Container */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-100 ease-out"
        style={{
          transform: `scale(${zoomScale}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: 'center center',
        }}
      >
        {isDualPageActive && !isSoloCover && page2Url ? (
          /* Dual-Page Landscape Spread */
          <div className="w-full h-full flex items-center justify-center gap-1 max-w-full max-h-full px-2">
            {isRtl ? (
              <>
                {/* Manga RTL: Page 3 on Left, Page 2 on Right */}
                <div className="flex-1 h-full flex items-center justify-end overflow-hidden">
                  <img
                    src={page2Url}
                    alt={`Page ${page2Index}`}
                    className="max-h-full max-w-full object-contain shadow-2xl rounded-sm"
                    draggable={false}
                  />
                </div>
                <div className="flex-1 h-full flex items-center justify-start overflow-hidden">
                  <img
                    src={page1Url}
                    alt={`Page ${page1Index}`}
                    className="max-h-full max-w-full object-contain shadow-2xl rounded-sm"
                    draggable={false}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Western LTR: Page 2 on Left, Page 3 on Right */}
                <div className="flex-1 h-full flex items-center justify-end overflow-hidden">
                  <img
                    src={page1Url}
                    alt={`Page ${page1Index}`}
                    className="max-h-full max-w-full object-contain shadow-2xl rounded-sm"
                    draggable={false}
                  />
                </div>
                <div className="flex-1 h-full flex items-center justify-start overflow-hidden">
                  <img
                    src={page2Url}
                    alt={`Page ${page2Index}`}
                    className="max-h-full max-w-full object-contain shadow-2xl rounded-sm"
                    draggable={false}
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          /* Single Page (Portrait / Solo Cover) */
          <div className="w-full h-full flex items-center justify-center p-1 sm:p-2">
            {page1Url ? (
              <img
                src={page1Url}
                alt={`Page ${currentPage}`}
                className="max-h-full max-w-full object-contain shadow-2xl rounded-sm pointer-events-none"
                draggable={false}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-stone-500 font-mono text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                <span>Decoding Page {currentPage}...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Zoom Indicator Pill */}
      {isZoomed && (
        <div className="absolute top-4 right-4 z-30 bg-stone-900/90 text-amber-400 font-mono text-xs px-3 py-1.5 rounded-full border border-stone-700 shadow-xl flex items-center gap-1.5">
          <ZoomIn className="w-3.5 h-3.5" />
          <span>{Math.round(zoomScale * 100)}% (Double-tap to reset)</span>
        </div>
      )}
    </div>
  );
}
