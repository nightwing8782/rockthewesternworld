'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import ePub, { type Book, type Rendition } from 'epubjs';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useSwipeGestures } from '@/hooks/useSwipeGestures';
import { ReaderSettings } from '@/types/trophy';

interface EpubReaderProps {
  fileBlob: Blob;
  initialCfi?: string | null;
  currentPage?: number;
  onPageChange?: (page: number, totalPages: number) => void;
  onProgressUpdate: (percent: number, cfi: string, page: number, totalPages: number) => void;
  onToggleHUD: () => void;
  settings: ReaderSettings;
}

export default function EpubReader({
  fileBlob,
  initialCfi,
  onProgressUpdate,
  onToggleHUD,
  settings,
}: EpubReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const bookRef = useRef<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load EPUB
  useEffect(() => {
    let isCancelled = false;

    async function initEpub() {
      if (!viewerRef.current || !fileBlob) return;
      setLoading(true);
      setError(null);

      try {
        const arrayBuffer = await fileBlob.arrayBuffer();
        const book = ePub(arrayBuffer);
        bookRef.current = book;

        await book.ready;

        if (isCancelled) return;

        // Render to viewer container
        const rendition = book.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: settings.dualPageLandscape ? 'auto' : 'none',
        });
        renditionRef.current = rendition;

        // Apply theme & font settings
        applyTheme(rendition, settings);

        // Display initial location or beginning
        await rendition.display(initialCfi || undefined);

        // Generate locations for percentage calculation
        book.locations.generate(1024).then(() => {
          if (!isCancelled && rendition.location) {
            const loc = rendition.location;
            const currentCfi = loc.start.cfi;
            const percent = book.locations.percentageFromCfi(currentCfi) * 100;
            const locNum = book.locations.locationFromCfi(currentCfi);
            const currentPage = typeof locNum === 'number' ? locNum : Number(locNum) || 1;
            const totalPages = (book.locations as any).total || book.locations.length() || 100;
            onProgressUpdate(Math.round(percent), currentCfi, currentPage, totalPages);
          }
        });

        // Relocated listener
        rendition.on('relocated', (location: any) => {
          if (isCancelled) return;
          const currentCfi = location.start.cfi;
          let percent = 0;
          let currentPage = 1;
          const totalPages = (book.locations as any).total || book.locations.length() || 100;

          if (book.locations.length() > 0) {
            percent = book.locations.percentageFromCfi(currentCfi) * 100;
            const locNum = book.locations.locationFromCfi(currentCfi);
            currentPage = typeof locNum === 'number' ? locNum : Number(locNum) || 1;
          }

          onProgressUpdate(Math.round(percent), currentCfi, currentPage, totalPages);
        });

        setLoading(false);
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Failed to load EPUB book.');
          setLoading(false);
        }
      }
    }

    initEpub();

    return () => {
      isCancelled = true;
      if (renditionRef.current) {
        try {
          renditionRef.current.destroy();
        } catch (e) {}
      }
      if (bookRef.current) {
        try {
          bookRef.current.destroy();
        } catch (e) {}
      }
    };
  }, [fileBlob]);

  // Apply Theme & Font updates
  const applyTheme = (rendition: Rendition, s: ReaderSettings) => {
    const themeBg = s.epubTheme === 'dark' ? '#1C1917' : s.epubTheme === 'sepia' ? '#F4ECD8' : '#FAF8F5';
    const themeFg = s.epubTheme === 'dark' ? '#E7E5E4' : s.epubTheme === 'sepia' ? '#443A2B' : '#1C1917';
    const fontFamily = s.fontFamily === 'sans' ? 'system-ui, sans-serif' : 'Cormorant Garamond, Georgia, serif';

    rendition.themes.default({
      body: {
        background: `${themeBg} !important`,
        color: `${themeFg} !important`,
        'font-family': `${fontFamily} !important`,
        'font-size': `${s.fontSize}% !important`,
        'line-height': '1.65 !important',
        padding: '0 24px !important',
      },
      p: {
        'margin-bottom': '1.1em !important',
        'text-align': 'justify !important',
      },
      a: {
        color: '#1E40AF !important',
      },
    });
  };

  useEffect(() => {
    if (renditionRef.current) {
      applyTheme(renditionRef.current, settings);
    }
  }, [settings.epubTheme, settings.fontSize, settings.fontFamily]);

  const nextPage = useCallback(() => {
    if (renditionRef.current) {
      renditionRef.current.next();
    }
  }, []);

  const prevPage = useCallback(() => {
    if (renditionRef.current) {
      renditionRef.current.prev();
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        nextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage]);

  // Touch Swipe
  useSwipeGestures(viewerRef, {
    onSwipeLeft: nextPage,
    onSwipeRight: prevPage,
    onTapCenter: onToggleHUD,
  });

  return (
    <div className="flex-1 relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#FAF8F5]/90 gap-3 text-stone-700">
          <Loader2 className="w-8 h-8 animate-spin text-[#B45309]" />
          <p className="text-xs font-display uppercase tracking-widest">Formatting book typography...</p>
        </div>
      )}

      {error && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-red-500 gap-3">
          <AlertTriangle className="w-8 h-8" />
          <p className="text-sm font-serif text-center max-w-md">{error}</p>
        </div>
      )}

      {/* EPUB Render Viewer Container */}
      <div
        ref={viewerRef}
        className="w-full h-full max-w-4xl mx-auto flex-1 cursor-pointer select-none"
      />
    </div>
  );
}
