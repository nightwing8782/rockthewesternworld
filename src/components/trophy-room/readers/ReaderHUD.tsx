'use client';

import React from 'react';
import {
  ArrowLeft,
  Settings,
  Sun,
  Moon,
  Columns,
  Square,
  ZoomIn,
  ZoomOut,
  Sliders,
  Download,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { TrophyBook, ReaderSettings } from '@/types/trophy';

interface ReaderHUDProps {
  book: TrophyBook;
  visible: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
  onOpenSettings: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
  isOffline?: boolean;
  onToggleOffline?: () => void;
}

export default function ReaderHUD({
  book,
  visible,
  currentPage,
  totalPages,
  onPageChange,
  onClose,
  onOpenSettings,
  settings,
  onUpdateSettings,
  isOffline,
  onToggleOffline,
}: ReaderHUDProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const isRTL = settings.readingDirection === 'rtl';

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-50 flex flex-col justify-between transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Top Header Bar */}
      <header
        className={`pointer-events-auto bg-stone-950/90 backdrop-blur-md border-b border-stone-800/80 px-4 py-3 flex items-center justify-between transition-transform duration-300 ${
          visible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{
          paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
        }}
      >
        {/* Left: Back Button & Title */}
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full text-stone-300 hover:text-amber-400 hover:bg-stone-800/80 transition-colors focus:outline-none cursor-pointer"
            title="Return to Library"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="font-serif text-sm md:text-base font-bold text-stone-100 truncate tracking-wide">
              {book.title}
            </h1>
            <p className="text-[11px] font-mono text-stone-400 truncate uppercase tracking-widest">
              {book.series !== 'Standalone' ? `${book.series} • Issue #${book.issue_number}` : 'Standalone Edition'}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-1.5 md:space-x-3 shrink-0">
          {/* Offline indicator / button */}
          {onToggleOffline && (
            <button
              onClick={onToggleOffline}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                isOffline
                  ? 'border-emerald-700/60 bg-emerald-950/40 text-emerald-400'
                  : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:text-stone-200'
              }`}
              title={isOffline ? 'Downloaded to device' : 'Save for offline reading'}
            >
              {isOffline ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline font-mono text-[10px] tracking-wider uppercase">Offline</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline font-mono text-[10px] tracking-wider uppercase">Save</span>
                </>
              )}
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-stone-300 hover:text-amber-400 hover:bg-stone-800/80 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* Settings Modal Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-stone-300 hover:text-amber-400 hover:bg-stone-800/80 transition-colors cursor-pointer"
            title="Reader Display Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Bottom Scrubber & Progress Bar */}
      <footer
        className={`pointer-events-auto bg-stone-950/95 backdrop-blur-md border-t border-stone-800/80 px-4 py-3 sm:py-4 transition-transform duration-300 ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
        }}
      >
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Quick Toolbar (Direction, Dual Page, Amber Slider) */}
          <div className="flex items-center justify-between gap-4 text-xs">
            {/* Quick Layout Buttons */}
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <button
                onClick={() =>
                  onUpdateSettings({
                    readingDirection: settings.readingDirection === 'ltr' ? 'rtl' : 'ltr',
                  })
                }
                className="px-2.5 py-1 rounded bg-stone-900 border border-stone-800 text-stone-300 hover:border-amber-600/60 font-mono text-[11px] tracking-wider uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Switch Reading Direction (LTR Western vs RTL Manga)"
              >
                <span>{settings.readingDirection === 'rtl' ? '⛩️ RTL MANGA' : '🦸 LTR COMIC'}</span>
              </button>

              <button
                onClick={() => {
                  const currentMode = settings.pageSpreadMode || (settings.dualPageLandscape ? 'dual' : 'single');
                  const nextMode = currentMode === 'dual' ? 'single' : 'dual';
                  onUpdateSettings({
                    pageSpreadMode: nextMode,
                    dualPageLandscape: nextMode === 'dual',
                  });
                }}
                className={`px-2.5 py-1 rounded border font-mono text-[11px] tracking-wider uppercase flex items-center gap-1.5 transition-colors cursor-pointer ${
                  (settings.pageSpreadMode === 'dual' || (!settings.pageSpreadMode && settings.dualPageLandscape))
                    ? 'bg-amber-950/50 border-amber-600/60 text-amber-300'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
                title="Toggle 1-Page vs 2-Page Spread"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>
                  {(settings.pageSpreadMode === 'dual' || (!settings.pageSpreadMode && settings.dualPageLandscape))
                    ? '📖 2-Page'
                    : '📄 1-Page'}
                </span>
              </button>

              {book.format !== 'epub' && (
                <button
                  onClick={() => {
                    const fits = ['contain', 'width', 'height'] as const;
                    const nextIdx = (fits.indexOf(settings.fitMode || 'contain') + 1) % fits.length;
                    onUpdateSettings({ fitMode: fits[nextIdx] });
                  }}
                  className="hidden sm:flex px-2 py-1 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 font-mono text-[11px] tracking-wider uppercase items-center gap-1 transition-colors cursor-pointer"
                  title="Cycle image fit mode"
                >
                  <Square className="w-3 h-3" />
                  <span>Fit: {settings.fitMode || 'contain'}</span>
                </button>
              )}
            </div>

            {/* Amber Night Filter Quick Slider */}
            <div className="flex items-center space-x-2 max-w-[200px] w-full justify-end">
              <Sun className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <input
                type="range"
                min="0"
                max="75"
                value={settings.amberFilterPercent}
                onChange={(e) => onUpdateSettings({ amberFilterPercent: parseInt(e.target.value, 10) })}
                className="w-24 sm:w-32 h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                title={`Amber Night Filter: ${settings.amberFilterPercent}%`}
              />
              <Moon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            </div>
          </div>

          {/* Scrubber Slider & Jump */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onPageChange(isRTL ? currentPage + 1 : currentPage - 1)}
              disabled={isRTL ? currentPage >= totalPages : currentPage <= 1}
              className="p-1.5 rounded-md text-stone-300 hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min="1"
                max={Math.max(1, totalPages)}
                value={currentPage}
                onChange={(e) => onPageChange(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => onPageChange(isRTL ? currentPage - 1 : currentPage + 1)}
              disabled={isRTL ? currentPage <= 1 : currentPage >= totalPages}
              className="p-1.5 rounded-md text-stone-300 hover:bg-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="font-mono text-xs text-stone-300 shrink-0 min-w-[70px] text-right font-semibold tracking-wider">
              {currentPage} / {totalPages || 1}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
