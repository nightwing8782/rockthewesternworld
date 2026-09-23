'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, Loader2, ZoomIn } from 'lucide-react';
import { useSwipeGestures } from '@/hooks/useSwipeGestures';
import { ReaderSettings } from '@/types/trophy';

interface PdfReaderProps {
  fileBlob: Blob;
  currentPage: number;
  onPageChange: (page: number, totalPages: number) => void;
  onToggleHUD: () => void;
  settings: ReaderSettings;
}

let cachedWorkerBlobUrl: string | null = null;

async function getResilientWorkerSrc(version: string): Promise<string> {
  if (cachedWorkerBlobUrl) return cachedWorkerBlobUrl;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  try {
    const res = await fetch(`${origin}/pdfjs/pdf.worker.min.mjs`);
    if (res.ok) {
      const code = await res.text();
      const blob = new Blob([code], { type: 'text/javascript' });
      cachedWorkerBlobUrl = URL.createObjectURL(blob);
      return cachedWorkerBlobUrl;
    }
  } catch (err) {
    console.warn('[PdfReader] Local worker blob resolution failed, using CDN fallback:', err);
  }
  return `https://unpkg.com/pdfjs-dist@${version || '6.3.289'}/build/pdf.worker.min.mjs`;
}

export default function PdfReader({
  fileBlob,
  currentPage,
  onPageChange,
  onToggleHUD,
  settings,
}: PdfReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef1 = useRef<HTMLCanvasElement>(null);
  const canvasRef2 = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tap feedback & Zoom State
  const [tapFlash, setTapFlash] = useState<'left' | 'right' | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isZoomed = zoomScale > 1.05;

  // Window size tracking
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

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;

    async function loadPdf() {
      if (!fileBlob) return;
      setLoading(true);
      setError(null);

      try {
        const pdfjsLib = await import('pdfjs-dist');
        const workerSrc = await getResilientWorkerSrc(pdfjsLib.version);
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const arrayBuffer = await fileBlob.arrayBuffer();
        const doc = await pdfjsLib.getDocument({
          data: arrayBuffer,
          cMapUrl: `${origin}/pdfjs/cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `${origin}/pdfjs/standard_fonts/`,
          wasmUrl: `${origin}/pdfjs/wasm/`,
          enableXfa: true,
          useSystemFonts: true,
        }).promise;

        if (isCancelled) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        onPageChange(Math.min(Math.max(1, currentPage), doc.numPages), doc.numPages);
      } catch (err: any) {
        console.error('[PdfReader] Error loading PDF:', err);
        if (!isCancelled) {
          setError(err.message || 'Failed to parse PDF document.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadPdf();
    return () => {
      isCancelled = true;
    };
  }, [fileBlob]);

  // Determine if dual page is active
  const isLandscape = windowSize.width > windowSize.height && windowSize.width >= 768;
  const isDualPage = settings.dualPageLandscape && isLandscape;
  const page1 = currentPage;
  const page2 = isDualPage && page1 + 1 <= numPages ? page1 + 1 : null;

  const renderTask1Ref = useRef<any>(null);
  const renderTask2Ref = useRef<any>(null);

  // Render Page(s) on Canvas with High-DPI Retina Resolution
  const renderCurrentPages = useCallback(async () => {
    if (!pdfDoc || !containerRef.current) return;
    setRendering(true);

    if (renderTask1Ref.current) {
      try {
        renderTask1Ref.current.cancel();
      } catch (e) {}
      renderTask1Ref.current = null;
    }
    if (renderTask2Ref.current) {
      try {
        renderTask2Ref.current.cancel();
      } catch (e) {}
      renderTask2Ref.current = null;
    }

    try {
      const containerWidth = containerRef.current.clientWidth || window.innerWidth;
      const containerHeight = containerRef.current.clientHeight || window.innerHeight;

      const availableWidth = Math.max(300, containerWidth - 24);
      const availableHeight = Math.max(300, containerHeight - 24);

      const targetWidth = isDualPage ? availableWidth / 2 - 8 : availableWidth;
      const targetHeight = availableHeight;

      const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 3) : 1;

      // Render First Page
      const p1 = await pdfDoc.getPage(page1);
      const vp1Unscaled = p1.getViewport({ scale: 1.0 });

      let scale1 = 1.0;
      if (settings.fitMode === 'width') {
        scale1 = (targetWidth / vp1Unscaled.width) * (settings.zoomLevel / 100);
      } else if (settings.fitMode === 'height') {
        scale1 = (targetHeight / vp1Unscaled.height) * (settings.zoomLevel / 100);
      } else {
        scale1 = Math.min(targetWidth / vp1Unscaled.width, targetHeight / vp1Unscaled.height) * (settings.zoomLevel / 100);
      }

      const scaledScale1 = Math.max(0.2, scale1) * dpr;
      const vp1 = p1.getViewport({ scale: scaledScale1 });
      const c1 = canvasRef1.current;
      if (c1) {
        c1.width = Math.floor(vp1.width);
        c1.height = Math.floor(vp1.height);
        c1.style.width = `${Math.floor(vp1.width / dpr)}px`;
        c1.style.height = `${Math.floor(vp1.height / dpr)}px`;

        const ctx1 = c1.getContext('2d');
        if (ctx1) {
          ctx1.fillStyle = '#ffffff';
          ctx1.fillRect(0, 0, c1.width, c1.height);

          const renderTask = (p1 as any).render({
            canvasContext: ctx1,
            viewport: vp1,
            canvas: c1,
          });
          renderTask1Ref.current = renderTask;
          await renderTask.promise;
        }
      }

      // Render Second Page if dual-mode active
      if (page2 && canvasRef2.current) {
        const p2 = await pdfDoc.getPage(page2);
        const vp2Unscaled = p2.getViewport({ scale: 1.0 });

        let scale2 = 1.0;
        if (settings.fitMode === 'width') {
          scale2 = (targetWidth / vp2Unscaled.width) * (settings.zoomLevel / 100);
        } else if (settings.fitMode === 'height') {
          scale2 = (targetHeight / vp2Unscaled.height) * (settings.zoomLevel / 100);
        } else {
          scale2 = Math.min(targetWidth / vp2Unscaled.width, targetHeight / vp2Unscaled.height) * (settings.zoomLevel / 100);
        }

        const scaledScale2 = Math.max(0.2, scale2) * dpr;
        const vp2 = p2.getViewport({ scale: scaledScale2 });
        const c2 = canvasRef2.current;
        c2.width = Math.floor(vp2.width);
        c2.height = Math.floor(vp2.height);
        c2.style.width = `${Math.floor(vp2.width / dpr)}px`;
        c2.style.height = `${Math.floor(vp2.height / dpr)}px`;

        const ctx2 = c2.getContext('2d');
        if (ctx2) {
          ctx2.fillStyle = '#ffffff';
          ctx2.fillRect(0, 0, c2.width, c2.height);

          const renderTask = (p2 as any).render({
            canvasContext: ctx2,
            viewport: vp2,
            canvas: c2,
          });
          renderTask2Ref.current = renderTask;
          await renderTask.promise;
        }
      }
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.warn('[PdfReader] Render error:', err);
      }
    } finally {
      setRendering(false);
    }
  }, [pdfDoc, page1, page2, isDualPage, settings.fitMode, settings.zoomLevel]);

  useEffect(() => {
    renderCurrentPages();
  }, [renderCurrentPages]);

  // Navigation handlers
  const step = isDualPage ? 2 : 1;
  const isRTL = settings.readingDirection === 'rtl';

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
    if (currentPage + step <= numPages) {
      triggerTapFlash('right');
      onPageChange(currentPage + step, numPages);
    } else if (currentPage < numPages) {
      triggerTapFlash('right');
      onPageChange(numPages, numPages);
    }
  }, [currentPage, step, numPages, isZoomed, onPageChange]);

  const prevPage = useCallback(() => {
    if (isZoomed) {
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
      return;
    }
    if (currentPage - step >= 1) {
      triggerTapFlash('left');
      onPageChange(currentPage - step, numPages);
    } else if (currentPage > 1) {
      triggerTapFlash('left');
      onPageChange(1, numPages);
    }
  }, [currentPage, step, numPages, isZoomed, onPageChange]);

  // Double-tap zoom toggle
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

  // Pinch zoom
  const handlePinchZoom = useCallback((scaleDelta: number) => {
    setZoomScale((prev) => {
      const next = Math.min(3.5, Math.max(1, prev * (1 + (scaleDelta - 1) * 0.5)));
      if (next <= 1.05) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // 3-Zone Touch Gestures (Left 30% | Center 40% | Right 30%)
  useSwipeGestures(containerRef, {
    onSwipeLeft: () => (isRTL ? prevPage() : nextPage()),
    onSwipeRight: () => (isRTL ? nextPage() : prevPage()),
    onTapLeft: () => (isRTL ? nextPage() : prevPage()),
    onTapRight: () => (isRTL ? prevPage() : nextPage()),
    onTapCenter: onToggleHUD,
    onDoubleTap: handleDoubleTap,
    onPinchZoom: handlePinchZoom,
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        if (isRTL) prevPage();
        else nextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (isRTL) nextPage();
        else prevPage();
      } else if (e.key === 'Home') {
        e.preventDefault();
        onPageChange(1, numPages);
      } else if (e.key === 'End') {
        e.preventDefault();
        onPageChange(numPages, numPages);
      } else if (e.key === 'Escape') {
        onToggleHUD();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage, onPageChange, numPages, isRTL, onToggleHUD]);

  // Wheel Page Turning
  const lastWheelTimeRef = useRef<number>(0);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelTimeRef.current < 250) return;

      if (e.deltaY > 20 || e.deltaX > 20) {
        lastWheelTimeRef.current = now;
        if (isRTL) prevPage();
        else nextPage();
      } else if (e.deltaY < -20 || e.deltaX < -20) {
        lastWheelTimeRef.current = now;
        if (isRTL) nextPage();
        else prevPage();
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [nextPage, prevPage, isRTL]);

  if (loading) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-stone-950 text-stone-300">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest text-stone-400">Loading Document Pages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-stone-950 text-rose-400 p-6 text-center">
        <AlertTriangle className="w-12 h-12 mb-3 text-rose-500" />
        <h3 className="font-serif text-lg font-bold text-white mb-2">Error Opening PDF</h3>
        <p className="text-sm font-sans max-w-md text-stone-400">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-[100dvh] w-full flex items-center justify-center overflow-hidden bg-[#0a0a0c] select-none touch-none overscroll-none p-2 sm:p-4 cursor-default"
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

      <div
        className={`flex items-center justify-center max-w-full max-h-full transition-opacity duration-150 ${
          rendering ? 'opacity-90' : 'opacity-100'
        } ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-4 sm:gap-6`}
        style={{
          transform: `scale(${zoomScale}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: 'center center',
          transition: 'transform 0.12s ease-out',
        }}
      >
        <div className="relative bg-white shadow-[0_20px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10 rounded-sm overflow-hidden flex items-center justify-center">
          <canvas
            ref={canvasRef1}
            className="block max-w-[96vw] max-h-[96vh] object-contain"
          />
        </div>

        {isDualPage && page2 && (
          <div className="relative bg-white shadow-[0_20px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10 rounded-sm overflow-hidden flex items-center justify-center">
            <canvas
              ref={canvasRef2}
              className="block max-w-[96vw] max-h-[96vh] object-contain"
            />
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
