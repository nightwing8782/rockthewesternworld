'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
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
  try {
    const res = await fetch('/pdfjs/pdf.worker.min.mjs');
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

        const arrayBuffer = await fileBlob.arrayBuffer();
        const doc = await pdfjsLib.getDocument({
          data: arrayBuffer,
          cMapUrl: '/pdfjs/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: '/pdfjs/standard_fonts/',
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
  const isDualPage = settings.dualPageLandscape && typeof window !== 'undefined' && window.innerWidth > 900;
  const page1 = currentPage;
  const page2 = isDualPage && page1 + 1 <= numPages ? page1 + 1 : null;

  const renderTask1Ref = useRef<any>(null);
  const renderTask2Ref = useRef<any>(null);

  // Render Page(s) on Canvas with High-DPI Retina Resolution
  const renderCurrentPages = useCallback(async () => {
    if (!pdfDoc || !containerRef.current) return;
    setRendering(true);

    // Cancel any previous in-flight render tasks to avoid collisions
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

      // Deduct padding
      const availableWidth = Math.max(300, containerWidth - 32);
      const availableHeight = Math.max(300, containerHeight - 32);

      const targetWidth = isDualPage ? availableWidth / 2 - 12 : availableWidth;
      const targetHeight = availableHeight;

      // Device Pixel Ratio for crystal-clear Retina rendering (e.g. 2x on MacBook / iPad, 3x on mobile)
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
        // contain (default)
        scale1 = Math.min(targetWidth / vp1Unscaled.width, targetHeight / vp1Unscaled.height) * (settings.zoomLevel / 100);
      }

      const vp1 = p1.getViewport({ scale: Math.max(0.2, scale1) });
      const c1 = canvasRef1.current;
      if (c1) {
        // Set actual pixel dimensions to DPR scaled resolution
        c1.width = Math.floor(vp1.width * dpr);
        c1.height = Math.floor(vp1.height * dpr);

        // Set CSS display dimensions to logical points
        c1.style.width = `${Math.floor(vp1.width)}px`;
        c1.style.height = `${Math.floor(vp1.height)}px`;

        const ctx1 = c1.getContext('2d', { alpha: false });
        if (ctx1) {
          ctx1.imageSmoothingEnabled = true;
          ctx1.imageSmoothingQuality = 'high';
          ctx1.fillStyle = '#ffffff';
          ctx1.fillRect(0, 0, c1.width, c1.height);

          const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null;
          const renderTask = (p1 as any).render({
            canvasContext: ctx1,
            viewport: vp1,
            transform: transform || undefined,
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

        const vp2 = p2.getViewport({ scale: Math.max(0.2, scale2) });
        const c2 = canvasRef2.current;
        c2.width = Math.floor(vp2.width * dpr);
        c2.height = Math.floor(vp2.height * dpr);
        c2.style.width = `${Math.floor(vp2.width)}px`;
        c2.style.height = `${Math.floor(vp2.height)}px`;

        const ctx2 = c2.getContext('2d', { alpha: false });
        if (ctx2) {
          ctx2.imageSmoothingEnabled = true;
          ctx2.imageSmoothingQuality = 'high';
          ctx2.fillStyle = '#ffffff';
          ctx2.fillRect(0, 0, c2.width, c2.height);

          const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null;
          const renderTask = (p2 as any).render({
            canvasContext: ctx2,
            viewport: vp2,
            transform: transform || undefined,
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

  // Window Resize
  useEffect(() => {
    const handleResize = () => {
      renderCurrentPages();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderCurrentPages]);

  // Navigation handlers
  const step = isDualPage ? 2 : 1;
  const isRTL = settings.readingDirection === 'rtl';

  const nextPage = useCallback(() => {
    if (currentPage + step <= numPages) {
      onPageChange(currentPage + step, numPages);
    } else if (currentPage < numPages) {
      onPageChange(numPages, numPages);
    }
  }, [currentPage, step, numPages, onPageChange]);

  const prevPage = useCallback(() => {
    if (currentPage - step >= 1) {
      onPageChange(currentPage - step, numPages);
    } else if (currentPage > 1) {
      onPageChange(1, numPages);
    }
  }, [currentPage, step, numPages, onPageChange]);

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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage, onPageChange, numPages, isRTL]);

  // Touch Swipe
  useSwipeGestures(containerRef, {
    onSwipeLeft: isRTL ? prevPage : nextPage,
    onSwipeRight: isRTL ? nextPage : prevPage,
    onTapCenter: onToggleHUD,
  });

  // Tap zones: left 25% prev, right 25% next, center 50% toggle HUD
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width * 0.25) {
      if (isRTL) nextPage();
      else prevPage();
    } else if (x > width * 0.75) {
      if (isRTL) prevPage();
      else nextPage();
    } else {
      onToggleHUD();
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black/95 text-stone-300">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest text-stone-400">Loading Document Pages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black text-rose-400 p-6 text-center">
        <AlertTriangle className="w-12 h-12 mb-3 text-rose-500" />
        <h3 className="font-serif text-lg font-bold text-white mb-2">Error Opening PDF</h3>
        <p className="text-sm font-sans max-w-md text-stone-400">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="relative w-full h-full flex items-center justify-center overflow-auto bg-[#0a0a0c] select-none cursor-pointer p-2 sm:p-4"
    >
      <div
        className={`flex items-center justify-center max-w-full max-h-full transition-opacity duration-150 ${
          rendering ? 'opacity-90' : 'opacity-100'
        } ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-4 sm:gap-6`}
        style={{
          transform: settings.zoomLevel !== 100 ? `scale(${settings.zoomLevel / 100})` : undefined,
          transformOrigin: 'center center',
          transition: 'transform 0.15s ease-out',
        }}
      >
        <div className="relative bg-white shadow-[0_20px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10 rounded-sm overflow-hidden flex items-center justify-center">
          <canvas
            ref={canvasRef1}
            className="block max-w-full max-h-[95vh] object-contain"
          />
        </div>

        {isDualPage && page2 && (
          <div className="relative bg-white shadow-[0_20px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10 rounded-sm overflow-hidden flex items-center justify-center">
            <canvas
              ref={canvasRef2}
              className="block max-w-full max-h-[95vh] object-contain"
            />
          </div>
        )}
      </div>

      {/* Subtle Page Indicator on Hover/Tap */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-mono tracking-wider text-stone-300 border border-stone-800/80 pointer-events-none opacity-40 hover:opacity-100 transition-opacity">
        Page {currentPage} {isDualPage && page2 ? `-${page2}` : ''} / {numPages}
      </div>
    </div>
  );
}
