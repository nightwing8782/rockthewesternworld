'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import { AlertTriangle, Loader2 } from 'lucide-react';
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
  const [pageUrls, setPageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const createdObjectUrlsRef = useRef<string[]>([]);

  // Cleanup object URLs on unmount
  const cleanupUrls = useCallback(() => {
    createdObjectUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {}
    });
    createdObjectUrlsRef.current = [];
  }, []);

  useEffect(() => {
    return () => cleanupUrls();
  }, [cleanupUrls]);

  // Unpack ZIP/CBZ
  useEffect(() => {
    let isCancelled = false;

    async function unpackCbz() {
      setLoading(true);
      setError(null);
      cleanupUrls();

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

        // Natural alphanumeric sort
        imageEntries.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        );

        const extractedUrls: string[] = [];
        for (let i = 0; i < imageEntries.length; i++) {
          if (isCancelled) return;
          const arrayBuffer = await imageEntries[i].file.async('arraybuffer');
          const mime = getMimeType(imageEntries[i].name);
          const blob = new Blob([arrayBuffer], { type: mime });
          const url = URL.createObjectURL(blob);
          extractedUrls.push(url);
        }

        if (!isCancelled) {
          createdObjectUrlsRef.current = extractedUrls;
          setPageUrls(extractedUrls);
          setLoading(false);
          const initialPage = Math.min(Math.max(1, currentPage), extractedUrls.length);
          onPageChange(initialPage, extractedUrls.length);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Failed to read CBZ file.');
          setLoading(false);
        }
      }
    }

    unpackCbz();

    return () => {
      isCancelled = true;
    };
  }, [fileBlob]);

  const totalPages = pageUrls.length;
  const isRtl = settings.readingDirection === 'rtl';

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1, totalPages);
    }
  }, [currentPage, totalPages, onPageChange]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1, totalPages);
    }
  }, [currentPage, totalPages, onPageChange]);

  // Touch Swipe
  useSwipeGestures(containerRef, {
    onSwipeLeft: () => (isRtl ? prevPage() : nextPage()),
    onSwipeRight: () => (isRtl ? nextPage() : prevPage()),
    onTapCenter: onToggleHUD,
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRtl, nextPage, prevPage]);

  // Wheel Page Turning (locked view, no document scroll)
  const lastWheelTimeRef = useRef<number>(0);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelTimeRef.current < 250) return; // Debounce 250ms

      if (e.deltaY > 20 || e.deltaX > 20) {
        lastWheelTimeRef.current = now;
        if (isRtl) prevPage();
        else nextPage();
      } else if (e.deltaY < -20 || e.deltaX < -20) {
        lastWheelTimeRef.current = now;
        if (isRtl) nextPage();
        else prevPage();
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [nextPage, prevPage, isRtl]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-3 text-stone-300">
        <Loader2 className="w-8 h-8 animate-spin text-[#B45309]" />
        <p className="text-xs font-display uppercase tracking-widest">Unpacking comic pages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-3 p-6 text-red-400">
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <p className="text-sm font-serif text-center max-w-md">{error}</p>
      </div>
    );
  }

  const currentImageUrl = pageUrls[currentPage - 1];

  return (
    <div
      ref={containerRef}
      className="flex-1 relative w-full h-full flex items-center justify-center select-none overflow-hidden touch-none p-2 sm:p-4"
      style={{
        transform: settings.zoomLevel !== 100 ? `scale(${settings.zoomLevel / 100})` : undefined,
      }}
    >
      {/* Click Zones for Page Flip */}
      <div
        className="absolute top-0 bottom-0 left-0 w-1/4 z-10 cursor-w-resize"
        onClick={() => (isRtl ? nextPage() : prevPage())}
        title={isRtl ? 'Next Page' : 'Previous Page'}
      />
      <div
        className="absolute top-0 bottom-0 right-0 w-1/4 z-10 cursor-e-resize"
        onClick={() => (isRtl ? prevPage() : nextPage())}
        title={isRtl ? 'Previous Page' : 'Next Page'}
      />
      <div
        className="absolute top-0 bottom-0 left-1/4 right-1/4 z-10 cursor-pointer"
        onClick={onToggleHUD}
      />

      {/* Comic Page Image */}
      {currentImageUrl && (
        <img
          src={currentImageUrl}
          alt={`Page ${currentPage} of ${totalPages}`}
          className={`max-w-[96vw] max-h-[96vh] object-contain pointer-events-none transition-all duration-150 shadow-[0_20px_60px_rgba(0,0,0,0.85)] ${
            settings.fitMode === 'width'
              ? 'w-full max-h-[96vh] object-contain'
              : settings.fitMode === 'height'
              ? 'h-[96vh] max-w-[96vw] object-contain'
              : 'max-h-[96vh] max-w-[96vw] object-contain'
          }`}
          loading="eager"
        />
      )}
    </div>
  );
}
