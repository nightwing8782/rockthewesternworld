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
  bookMedium?: string;
}

export default function EpubReader({
  fileBlob,
  initialCfi,
  onProgressUpdate,
  onToggleHUD,
  settings,
  bookMedium,
}: EpubReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const bookRef = useRef<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFixedLayout, setIsFixedLayout] = useState(false);

  const isRtl = settings.readingDirection === 'rtl';

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

  // Load EPUB
  useEffect(() => {
    let isCancelled = false;

    async function initEpub() {
      if (!viewerRef.current || !fileBlob) return;
      setLoading(true);
      setError(null);

      try {
        const arrayBuffer = await fileBlob.arrayBuffer();
        if (isCancelled) return;

        const book = ePub(arrayBuffer);
        bookRef.current = book;

        await book.ready;
        if (isCancelled) return;

        // Detect fixed-layout manga / pre-paginated books
        const metadataLayout = ((book as any).package?.metadata as any)?.layout;
        const hasPrePaginatedSpine = (book.spine as any)?.spineItems?.some((item: any) =>
          item.properties?.includes('rendition:layout-pre-paginated') ||
          item.properties?.includes('pre-paginated')
        );
        const isManga = bookMedium === 'manga' || bookMedium === 'comic';
        const fixedLayout = isManga || metadataLayout === 'pre-paginated' || hasPrePaginatedSpine;
        setIsFixedLayout(fixedLayout);

        // Ensure viewer container has computed dimensions before rendering
        if (viewerRef.current && (viewerRef.current.clientWidth === 0 || viewerRef.current.clientHeight === 0)) {
          await new Promise((r) => requestAnimationFrame(r));
        }

        const isDual =
          settings.pageSpreadMode === 'dual' ||
          (settings.pageSpreadMode !== 'single' && settings.dualPageLandscape);

        const rendition = book.renderTo(viewerRef.current!, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          layout: fixedLayout ? 'pre-paginated' : 'reflowable',
          spread: isDual ? 'auto' : 'none',
        } as any);

        if (!fixedLayout && typeof (rendition as any).direction === 'function') {
          (rendition as any).direction(isRtl ? 'rtl' : 'ltr');
        }
        renditionRef.current = rendition;

        // Dynamically compute and scale fixed-layout manga pages to fit and center in the viewport
        rendition.hooks.content.register((contents: any) => {
          if (!fixedLayout) return;

          const doc = contents.document;
          if (!doc) return;

          let vWidth = 0;
          let vHeight = 0;
          const metaViewport = doc.querySelector('meta[name="viewport"]');
          if (metaViewport && metaViewport.hasAttribute('content')) {
            const contentStr = metaViewport.getAttribute('content') || '';
            const wMatch = contentStr.match(/width\s*=\s*([^,]*)/);
            const hMatch = contentStr.match(/height\s*=\s*([^,]*)/);
            if (wMatch) vWidth = parseFloat(wMatch[1]);
            if (hMatch) vHeight = parseFloat(hMatch[1]);
          }

          if (!vWidth || !vHeight) {
            const svg = doc.querySelector('svg');
            const img = doc.querySelector('img, image');
            if (svg) {
              if (svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width > 0) {
                vWidth = svg.viewBox.baseVal.width;
                vHeight = svg.viewBox.baseVal.height;
              } else {
                const vb = svg.getAttribute('viewBox')?.split(/\s+|,/);
                if (vb && vb.length >= 4) {
                  vWidth = parseFloat(vb[2]);
                  vHeight = parseFloat(vb[3]);
                }
              }
            }
            if ((!vWidth || !vHeight) && img) {
              vWidth = img.naturalWidth || parseFloat(img.getAttribute('width') || '0');
              vHeight = img.naturalHeight || parseFloat(img.getAttribute('height') || '0');
            }
          }

          const containerW = viewerRef.current?.clientWidth || window.innerWidth;
          const containerH = viewerRef.current?.clientHeight || window.innerHeight;

          if (vWidth > 0 && vHeight > 0 && containerW > 0 && containerH > 0) {
            const scale = Math.min(containerW / vWidth, containerH / vHeight);
            const scaledW = vWidth * scale;
            const scaledH = vHeight * scale;
            const offsetX = Math.max(0, (containerW - scaledW) / 2);
            const offsetY = Math.max(0, (containerH - scaledH) / 2);

            const body = doc.body;
            if (body) {
              body.style.setProperty('width', `${vWidth}px`, 'important');
              body.style.setProperty('height', `${vHeight}px`, 'important');
              body.style.setProperty('transform-origin', 'top left', 'important');
              body.style.setProperty('transform', `translate(${offsetX}px, ${offsetY}px) scale(${scale})`, 'important');
              body.style.setProperty('overflow', 'hidden', 'important');
              body.style.setProperty('margin', '0', 'important');
              body.style.setProperty('padding', '0', 'important');
            }
          }
        });

        // Apply theme & font settings (with fixed layout protection)
        applyTheme(rendition, settings, fixedLayout);

        // Display initial location with defensive fallback to book start
        try {
          if (initialCfi) {
            await rendition.display(initialCfi);
          } else {
            await rendition.display();
          }
        } catch (dispErr) {
          console.warn('[EpubReader] Failed initial CFI display, falling back to beginning:', dispErr);
          await rendition.display();
        }

        if (isCancelled) return;

        // Deterministic spine count for instant reliable page indexing
        const totalSpineItems =
          (book.spine as any)?.spineItems?.length || (book.spine as any)?.length || 1;

        // Emit initial progress if rendition location is already resolved
        if (rendition.location) {
          const loc = rendition.location;
          const currentCfi = loc.start?.cfi || '';
          const spineIdx = typeof loc.start?.index === 'number' ? loc.start.index : 0;
          const currentSpinePage = Math.max(1, spineIdx + 1);
          const percent = Math.min(100, Math.round((currentSpinePage / totalSpineItems) * 100));
          onProgressUpdate(percent, currentCfi, currentSpinePage, totalSpineItems);
        }

        // Relocated listener: updates on every turn
        rendition.on('relocated', (location: any) => {
          if (isCancelled) return;
          const currentCfi = location.start?.cfi || '';
          const spineIdx = typeof location.start?.index === 'number' ? location.start.index : 0;
          const currentSpinePage = Math.max(1, spineIdx + 1);

          let percent = Math.min(100, Math.round((currentSpinePage / totalSpineItems) * 100));
          let currentPage = currentSpinePage;
          let totalPages = totalSpineItems;

          // If locations are available (e.g. for text books), refine the percentage and page count
          if (book.locations.length() > 0) {
            const locNum = book.locations.locationFromCfi(currentCfi);
            const genPage = typeof locNum === 'number' ? locNum : Number(locNum);
            const genTotal = (book.locations as any).total || book.locations.length();
            if (genPage && genTotal > 0) {
              currentPage = genPage;
              totalPages = genTotal;
              percent = Math.round(book.locations.percentageFromCfi(currentCfi) * 100);
            }
          }

          onProgressUpdate(percent, currentCfi, currentPage, totalPages);
        });

        // Intercept clicks inside the rendition iframe (resolves Issue 1)
        rendition.on('click', (e: MouseEvent) => {
          const width = window.innerWidth;
          const x = e.clientX;
          const leftBoundary = width * 0.30;
          const rightBoundary = width * 0.70;

          if (x < leftBoundary) {
            if (isRtl) nextPage();
            else prevPage();
          } else if (x > rightBoundary) {
            if (isRtl) prevPage();
            else nextPage();
          } else {
            onToggleHUD();
          }
        });

        // Forward keyboard navigation from within the iframe
        rendition.on('keydown', (e: KeyboardEvent) => {
          if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
            e.preventDefault();
            if (isRtl) prevPage();
            else nextPage();
          } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            e.preventDefault();
            if (isRtl) nextPage();
            else prevPage();
          } else if (e.key === 'Escape' || e.key === 'h' || e.key === 'm') {
            e.preventDefault();
            onToggleHUD();
          }
        });

        // Non-blocking background generation of granular text locations
        book.locations
          .generate(1024)
          .then(() => {
            if (!isCancelled && rendition.location) {
              const loc = rendition.location;
              const currentCfi = loc.start?.cfi || '';
              const locNum = book.locations.locationFromCfi(currentCfi);
              const genPage = typeof locNum === 'number' ? locNum : Number(locNum);
              const genTotal = (book.locations as any).total || book.locations.length();
              if (genPage && genTotal > 0) {
                const percent = Math.round(book.locations.percentageFromCfi(currentCfi) * 100);
                onProgressUpdate(percent, currentCfi, genPage, genTotal);
              }
            }
          })
          .catch((e) => {
            console.warn('[EpubReader] Optional locations generation skipped:', e);
          });

        setLoading(false);
      } catch (err: any) {
        if (!isCancelled) {
          console.error('[EpubReader] Error initializing EPUB:', err);
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
  const applyTheme = (rendition: Rendition, s: ReaderSettings, fixed: boolean) => {
    if (fixed) {
      // Fixed-layout manga: Dark background, zero margins/padding (size handled dynamically by scaler)
      rendition.themes.default({
        'html, body': {
          background: '#0a0c10 !important',
          color: '#ffffff !important',
          margin: '0 !important',
          padding: '0 !important',
        },
        'svg, img, image': {
          'max-width': '100% !important',
          'max-height': '100% !important',
          'object-fit': 'contain !important',
          display: 'block !important',
        },
      });
      return;
    }

    const isDirRtl = s.readingDirection === 'rtl';
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
        direction: isDirRtl ? 'rtl !important' : 'ltr !important',
      },
      p: {
        'margin-bottom': '1.1em !important',
        'text-align': isDirRtl ? 'right !important' : 'justify !important',
      },
      a: {
        color: '#1E40AF !important',
      },
      img: {
        'max-width': '100% !important',
        'max-height': '100% !important',
        'object-fit': 'contain !important',
      },
    });
  };

  useEffect(() => {
    if (renditionRef.current) {
      applyTheme(renditionRef.current, settings, isFixedLayout);
      if (!isFixedLayout && typeof (renditionRef.current as any).direction === 'function') {
        (renditionRef.current as any).direction(settings.readingDirection === 'rtl' ? 'rtl' : 'ltr');
      }
    }
  }, [settings.epubTheme, settings.fontSize, settings.fontFamily, settings.readingDirection, isFixedLayout]);

  useEffect(() => {
    if (renditionRef.current) {
      const isDual =
        settings.pageSpreadMode === 'dual' ||
        (settings.pageSpreadMode !== 'single' && settings.dualPageLandscape);
      try {
        renditionRef.current.spread(isDual ? 'auto' : 'none');
      } catch (e) {}
    }
  }, [settings.pageSpreadMode, settings.dualPageLandscape]);

  // Window resize handler for dynamic rendition scaling
  useEffect(() => {
    const handleResize = () => {
      if (renditionRef.current && viewerRef.current) {
        const w = viewerRef.current.clientWidth;
        const h = viewerRef.current.clientHeight;
        if (w > 0 && h > 0) {
          try {
            renditionRef.current.resize(w, h);
          } catch (e) {}
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Keyboard navigation on outer window
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
      } else if (e.key === 'Escape' || e.key === 'h' || e.key === 'm') {
        e.preventDefault();
        onToggleHUD();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage, isRtl, onToggleHUD]);

  // Touch & Click Swipe
  useSwipeGestures(viewerRef, {
    onSwipeLeft: () => (isRtl ? prevPage() : nextPage()),
    onSwipeRight: () => (isRtl ? nextPage() : prevPage()),
    onTapLeft: () => (isRtl ? nextPage() : prevPage()),
    onTapRight: () => (isRtl ? prevPage() : nextPage()),
    onTapCenter: onToggleHUD,
  });

  return (
    <div
      className={`flex-1 relative w-full h-full flex flex-col items-center justify-center overflow-hidden ${
        isFixedLayout ? 'bg-[#0a0c10]' : ''
      }`}
    >
      {loading && (
        <div
          className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 ${
            isFixedLayout ? 'bg-[#0a0c10] text-stone-300' : 'bg-[#FAF8F5]/90 text-stone-700'
          }`}
        >
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-xs font-mono uppercase tracking-widest text-stone-400">
            {isFixedLayout ? 'Mounting Manga Vault...' : 'Formatting book typography...'}
          </p>
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
        className={`w-full h-full mx-auto flex-1 cursor-pointer select-none ${
          isFixedLayout ? 'max-w-none bg-[#0a0c10]' : 'max-w-4xl'
        }`}
      />
    </div>
  );
}
