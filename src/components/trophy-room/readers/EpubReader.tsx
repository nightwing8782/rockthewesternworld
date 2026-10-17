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
  currentPage,
  onPageChange,
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
  const lastReportedPageRef = useRef<number | null>(null);

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

  // React to external currentPage changes (from HUD slider or arrows)
  useEffect(() => {
    if (!bookRef.current || !renditionRef.current || !currentPage) return;
    if (lastReportedPageRef.current === currentPage) {
      return;
    }

    const currentLoc = renditionRef.current.location;
    const currentIdx = currentLoc?.start?.index;
    const targetIdx = Math.max(0, currentPage - 1);

    if (currentIdx !== undefined && currentIdx === targetIdx) {
      return;
    }

    try {
      const spine = (bookRef.current.spine as any);
      const spineItems = spine?.spineItems || (spine?.get ? null : []);
      const spineItem = spine?.get ? spine.get(targetIdx) : spineItems?.[targetIdx];

      if (spineItem) {
        const target = spineItem.cfi || spineItem.href || targetIdx;
        lastReportedPageRef.current = currentPage;
        renditionRef.current.display(target as any).catch((err: any) => {
          console.warn('[EpubReader] Error jumping to target page:', targetIdx, err);
        });
      }
    } catch (e) {
      console.warn('[EpubReader] Failed to navigate to currentPage:', currentPage, e);
    }
  }, [currentPage]);

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
          (settings.pageSpreadMode !== 'single' && (window.innerWidth > window.innerHeight || window.innerWidth >= 768));

        const rendition = book.renderTo(viewerRef.current!, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          layout: fixedLayout ? 'pre-paginated' : 'reflowable',
          spread: isDual ? 'auto' : 'none',
          minSpreadWidth: 600,
        } as any);

        if (!fixedLayout && typeof (rendition as any).direction === 'function') {
          (rendition as any).direction(isRtl ? 'rtl' : 'ltr');
        }
        renditionRef.current = rendition;

        // Hook contents.fit to provide pixel-perfect centering and scaling without conflicting transforms
        rendition.hooks.content.register((contents: any) => {
          if (!fixedLayout) return;

          contents.fit = function (width: number, height: number, section: any) {
            let vWidth = 0;
            let vHeight = 0;

            const viewport = this.viewport();
            if (viewport && viewport.width && viewport.height) {
              vWidth = parseInt(viewport.width, 10);
              vHeight = parseInt(viewport.height, 10);
            }

            const doc = this.document;
            if ((!vWidth || !vHeight) && doc) {
              const meta = doc.querySelector('meta[name="viewport"]');
              if (meta && meta.hasAttribute('content')) {
                const c = meta.getAttribute('content') || '';
                const wm = c.match(/width\s*=\s*([^,]*)/);
                const hm = c.match(/height\s*=\s*([^,]*)/);
                if (wm) vWidth = parseFloat(wm[1]);
                if (hm) vHeight = parseFloat(hm[1]);
              }
            }

            if ((!vWidth || !vHeight) && doc) {
              const svg = doc.querySelector('svg');
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
                if (!vWidth || !vHeight) {
                  vWidth = parseFloat(svg.getAttribute('width') || '0');
                  vHeight = parseFloat(svg.getAttribute('height') || '0');
                }
              }
              const img = doc.querySelector('img, image');
              if ((!vWidth || !vHeight) && img) {
                vWidth = (img as any).naturalWidth || parseFloat(img.getAttribute('width') || '0');
                vHeight = (img as any).naturalHeight || parseFloat(img.getAttribute('height') || '0');
              }
            }

            if (!vWidth || !vHeight || isNaN(vWidth) || isNaN(vHeight)) {
              vWidth = width;
              vHeight = height;
            }

            const widthScale = width / vWidth;
            const heightScale = height / vHeight;
            const scale = Math.min(widthScale, heightScale);

            const scaledW = vWidth * scale;
            const scaledH = vHeight * scale;

            const offsetX = Math.max(0, (width - scaledW) / 2);
            const offsetY = Math.max(0, (height - scaledH) / 2);

            this.layoutStyle('paginated');
            this.width(vWidth);
            this.height(vHeight);
            this.overflow('hidden');

            this.css('transform-origin', 'top left');
            this.css('transform', `translate(${offsetX}px, ${offsetY}px) scale(${scale})`);
            this.css('margin', '0');
            this.css('padding', '0');
            this.css('background-color', '#0a0c10');

            if (doc && doc.body) {
              doc.body.style.setProperty('margin', '0', 'important');
              doc.body.style.setProperty('padding', '0', 'important');
              doc.body.style.setProperty('overflow', 'hidden', 'important');
              doc.body.style.setProperty('background', '#0a0c10', 'important');
              doc.body.style.setProperty('width', `${vWidth}px`, 'important');
              doc.body.style.setProperty('height', `${vHeight}px`, 'important');
              doc.body.style.setProperty('transform', 'none', 'important');
            }

            if (doc) {
              const svg = doc.querySelector('svg');
              if (svg) {
                if (!svg.getAttribute('viewBox') && vWidth > 0 && vHeight > 0) {
                  svg.setAttribute('viewBox', `0 0 ${vWidth} ${vHeight}`);
                }
                svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                svg.style.setProperty('width', '100%', 'important');
                svg.style.setProperty('height', '100%', 'important');
                svg.style.setProperty('max-width', '100%', 'important');
                svg.style.setProperty('max-height', '100%', 'important');
                svg.style.setProperty('display', 'block', 'important');
                svg.style.setProperty('margin', 'auto', 'important');
              }
              const img = doc.querySelector('img');
              if (img) {
                img.style.setProperty('width', '100%', 'important');
                img.style.setProperty('height', '100%', 'important');
                img.style.setProperty('object-fit', 'contain', 'important');
                img.style.setProperty('display', 'block', 'important');
                img.style.setProperty('margin', 'auto', 'important');
              }
            }
          };
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
          lastReportedPageRef.current = currentSpinePage;
          onProgressUpdate(percent, currentCfi, currentSpinePage, totalSpineItems);
        }

        // Relocated listener: updates on every turn
        rendition.on('relocated', (location: any) => {
          if (isCancelled) return;
          const currentCfi = location.start?.cfi || '';
          const spineIdx = typeof location.start?.index === 'number' ? location.start.index : 0;
          const currentSpinePage = Math.max(1, spineIdx + 1);

          let percent = Math.min(100, Math.round((currentSpinePage / totalSpineItems) * 100));
          let pageNum = currentSpinePage;
          let totalPages = totalSpineItems;

          // If locations are available (e.g. for text books), refine the percentage and page count
          if (!fixedLayout && book.locations.length() > 0) {
            const locNum = book.locations.locationFromCfi(currentCfi);
            const genPage = typeof locNum === 'number' ? locNum : Number(locNum);
            const genTotal = (book.locations as any).total || book.locations.length();
            if (genPage && genTotal > 0) {
              pageNum = genPage;
              totalPages = genTotal;
              percent = Math.round(book.locations.percentageFromCfi(currentCfi) * 100);
            }
          }

          lastReportedPageRef.current = pageNum;
          onProgressUpdate(percent, currentCfi, pageNum, totalPages);
        });

        // Intercept clicks inside the rendition iframe with absolute client coordinates
        rendition.on('click', (e: MouseEvent) => {
          const target = e.target as HTMLElement | null;
          if (target?.closest('a, button, input, select, textarea')) return;

          const doc = target?.ownerDocument || e.view?.document;
          const iframe = (doc?.defaultView?.frameElement as HTMLIFrameElement) || null;
          const iframeRect = iframe?.getBoundingClientRect();
          const absoluteX = iframeRect ? iframeRect.left + e.clientX : e.clientX;

          const containerRect = viewerRef.current?.getBoundingClientRect();
          const relX = containerRect ? absoluteX - containerRect.left : absoluteX;
          const totalW = viewerRef.current?.clientWidth || window.innerWidth;

          const leftBoundary = totalW * 0.30;
          const rightBoundary = totalW * 0.70;

          if (relX < leftBoundary) {
            if (isRtl) nextPage();
            else prevPage();
          } else if (relX > rightBoundary) {
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

        // Non-blocking background generation of granular text locations (reflowable text only)
        if (!fixedLayout) {
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
                  lastReportedPageRef.current = genPage;
                  onProgressUpdate(percent, currentCfi, genPage, genTotal);
                }
              }
            })
            .catch((e) => {
              console.warn('[EpubReader] Optional locations generation skipped:', e);
            });
        }

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
        (settings.pageSpreadMode !== 'single' && (window.innerWidth > window.innerHeight || window.innerWidth >= 768));
      try {
        renditionRef.current.spread(isDual ? 'auto' : 'none');
        if (renditionRef.current.location?.start?.cfi) {
          renditionRef.current.display(renditionRef.current.location.start.cfi);
        }
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
