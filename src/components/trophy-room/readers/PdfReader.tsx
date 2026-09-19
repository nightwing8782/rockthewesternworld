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
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        }

        const arrayBuffer = await fileBlob.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

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

  // Render Page(s) on Canvas
  const renderCurrentPages = useCallback(async () => {
    if (!pdfDoc || !containerRef.current) return;
    setRendering(true);

    try {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      const targetWidth = isDualPage ? containerWidth / 2 - 16 : containerWidth;
      const targetHeight = containerHeight;

      // Render First Page
      const p1 = await pdfDoc.getPage(page1);
      const vp1Unscaled = p1.getViewport({ scale: 1.0 });

      let scale1 = 1.0;
      if (settings.fitMode === 'width') {
        scale1 = (targetWidth / vp1Unscaled.width) * (settings.zoomLevel / 100);
      } else if (settings.fitMode === 'height') {
        scale1 = (targetHeight / vp1Unscaled.height) * (settings.zoomLevel / 100);
      } else {
        // contain
        scale1 = Math.min(targetWidth / vp1Unscaled.width, targetHeight / vp1Unscaled.height) * (settings.zoomLevel / 100);
      }

      const vp1 = p1.getViewport({ scale: Math.max(0.4, scale1) });
      const c1 = canvasRef1.current;
      if (c1) {
        c1.width = vp1.width;
        c1.height = vp1.height;
        const ctx1 = c1.getContext('2d');
        if (ctx1) {
          await (p1 as any).render({ canvasContext: ctx1, viewport: vp1, canvas: c1 } as any).promise;
        }
      }

      // Render Second Page if dual-mode
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

        const vp2 = p2.getViewport({ scale: Math.max(0.4, scale2) });
        const c2 = canvasRef2.current;
        c2.width = vp2.width;
        c2.height = vp2.height;
        const ctx2 = c2.getContext('2d');
        if (ctx2) {
          await (p2 as any).render({ canvasContext: ctx2, viewport: vp2, canvas: c2 } as any).promise;
        }
      }
    } catch (err) {
      console.warn('[PdfReader] Render error:', err);
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
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black/95 select-none cursor-pointer"
    >
      <div
        className={`flex items-center justify-center max-w-full max-h-full transition-opacity duration-150 ${
          rendering ? 'opacity-80' : 'opacity-100'
        } ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-4 p-2`}
      >
        <canvas
          ref={canvasRef1}
          className="shadow-2xl rounded-sm max-w-full max-h-[96vh] object-contain"
        />
        {isDualPage && page2 && (
          <canvas
            ref={canvasRef2}
            className="shadow-2xl rounded-sm max-w-full max-h-[96vh] object-contain"
          />
        )}
      </div>

      {/* Subtle Page Indicator on Hover/Tap */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-mono tracking-wider text-stone-300 border border-stone-800/80 pointer-events-none opacity-40 hover:opacity-100 transition-opacity">
        Page {currentPage} {isDualPage && page2 ? `-${page2}` : ''} / {numPages}
      </div>
    </div>
  );
}
