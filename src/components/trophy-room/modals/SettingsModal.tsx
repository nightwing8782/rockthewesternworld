'use client';

import React from 'react';
import { X, Sun, Moon, Type, Layout, Eye } from 'lucide-react';
import { ReaderSettings, BookFormat } from '@/types/trophy';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
  format?: BookFormat;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  format,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950">
          <h2 className="font-serif text-lg font-bold tracking-wide text-amber-400">
            Reader Settings & Preferences
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 p-1 rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Amber Night Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-widest text-stone-400 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-amber-500" />
                Amber Night Filter
              </label>
              <span className="font-mono text-xs text-amber-400">{settings.amberFilterPercent}%</span>
            </div>
            <div className="flex items-center space-x-3">
              <Sun className="w-4 h-4 text-stone-500" />
              <input
                type="range"
                min="0"
                max="75"
                value={settings.amberFilterPercent}
                onChange={(e) => onUpdateSettings({ amberFilterPercent: parseInt(e.target.value, 10) })}
                className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <Moon className="w-4 h-4 text-amber-500" />
            </div>
          </div>

          {/* Reading Direction */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-widest text-stone-400 flex items-center gap-1.5">
              <Layout className="w-4 h-4 text-amber-500" />
              Reading Direction
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onUpdateSettings({ readingDirection: 'ltr' })}
                className={`py-2 px-3 rounded-lg border text-xs font-mono tracking-wider uppercase transition-colors ${
                  settings.readingDirection === 'ltr'
                    ? 'border-amber-600 bg-amber-950/40 text-amber-300 font-bold'
                    : 'border-stone-800 bg-stone-950 text-stone-400 hover:border-stone-700'
                }`}
              >
                Left to Right (Western)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ readingDirection: 'rtl' })}
                className={`py-2 px-3 rounded-lg border text-xs font-mono tracking-wider uppercase transition-colors ${
                  settings.readingDirection === 'rtl'
                    ? 'border-amber-600 bg-amber-950/40 text-amber-300 font-bold'
                    : 'border-stone-800 bg-stone-950 text-stone-400 hover:border-stone-700'
                }`}
              >
                Right to Left (Manga)
              </button>
            </div>
          </div>

          {/* Dual Page Mode (Comics / PDFs) */}
          {format !== 'epub' && (
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-stone-400">
                Landscape Display Spread
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ dualPageLandscape: false })}
                  className={`py-2 px-3 rounded-lg border text-xs font-mono tracking-wider uppercase transition-colors ${
                    !settings.dualPageLandscape
                      ? 'border-amber-600 bg-amber-950/40 text-amber-300 font-bold'
                      : 'border-stone-800 bg-stone-950 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  Single Page
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ dualPageLandscape: true })}
                  className={`py-2 px-3 rounded-lg border text-xs font-mono tracking-wider uppercase transition-colors ${
                    settings.dualPageLandscape
                      ? 'border-amber-600 bg-amber-950/40 text-amber-300 font-bold'
                      : 'border-stone-800 bg-stone-950 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  2-Page Spread
                </button>
              </div>
            </div>
          )}

          {/* Fit Mode (Comics / PDFs) */}
          {format !== 'epub' && (
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-stone-400">
                Scaling & Fit Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['contain', 'width', 'height'] as const).map((fit) => (
                  <button
                    key={fit}
                    type="button"
                    onClick={() => onUpdateSettings({ fitMode: fit })}
                    className={`py-2 px-2 rounded-lg border text-xs font-mono tracking-wider uppercase transition-colors ${
                      settings.fitMode === fit
                        ? 'border-amber-600 bg-amber-950/40 text-amber-300 font-bold'
                        : 'border-stone-800 bg-stone-950 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    {fit}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* EPUB Specific Preferences */}
          {format === 'epub' && (
            <>
              {/* EPUB Theme */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-stone-400">
                  Typography Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['sepia', 'light', 'dark'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onUpdateSettings({ epubTheme: t })}
                      className={`py-2 px-2 rounded-lg border text-xs font-mono tracking-wider uppercase transition-colors ${
                        settings.epubTheme === t
                          ? 'border-amber-600 bg-amber-950/40 text-amber-300 font-bold'
                          : 'border-stone-800 bg-stone-950 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-stone-400 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-amber-500" />
                  Typeface
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['serif', 'sans', 'comic'] as const).map((font) => (
                    <button
                      key={font}
                      type="button"
                      onClick={() => onUpdateSettings({ fontFamily: font })}
                      className={`py-2 px-2 rounded-lg border text-xs font-mono tracking-wider uppercase transition-colors ${
                        settings.fontFamily === font
                          ? 'border-amber-600 bg-amber-950/40 text-amber-300 font-bold'
                          : 'border-stone-800 bg-stone-950 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-widest text-stone-400">
                    Font Scale
                  </label>
                  <span className="font-mono text-xs text-amber-400">{settings.fontSize}%</span>
                </div>
                <input
                  type="range"
                  min="75"
                  max="180"
                  step="5"
                  value={settings.fontSize}
                  onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value, 10) })}
                  className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-800 bg-stone-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-widest rounded-lg transition-colors shadow-md"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
