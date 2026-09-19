'use client';

import React from 'react';
import { X, Sun, Moon, Type, Layout, Eye, SlidersHorizontal } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border-4 border-[#111827] rounded-3xl shadow-[8px_8px_0_#111827] max-w-lg w-full overflow-hidden text-[#111827]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-4 border-[#111827] bg-[#FFDE59]">
          <h2 className="text-xl font-black uppercase tracking-wide text-[#111827] flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 stroke-[2.5]" />
            Reader Display Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white border-2 border-[#111827] text-[#111827] hover:bg-[#FF4757] hover:text-white shadow-[2px_2px_0_#111827] transition-colors"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto bg-paper-texture">
          {/* Amber Night Filter */}
          <div className="space-y-2 bg-white p-4 rounded-2xl border-2 border-[#111827] shadow-[3px_3px_0_#111827]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-[#111827] flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#FF4757]" />
                Amber Night Filter (Blue Light)
              </label>
              <span className="comic-stamp text-[10px] px-2 py-0.5 rounded bg-[#FFDE59] text-[#111827]">
                {settings.amberFilterPercent}%
              </span>
            </div>
            <div className="flex items-center space-x-3 pt-1">
              <Sun className="w-4 h-4 text-slate-500" />
              <input
                type="range"
                min="0"
                max="75"
                value={settings.amberFilterPercent}
                onChange={(e) => onUpdateSettings({ amberFilterPercent: parseInt(e.target.value, 10) })}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#FF4757] border border-[#111827]"
              />
              <Moon className="w-4 h-4 text-[#FF4757]" />
            </div>
          </div>

          {/* Reading Direction */}
          <div className="space-y-2 bg-white p-4 rounded-2xl border-2 border-[#111827] shadow-[3px_3px_0_#111827]">
            <label className="text-xs font-black uppercase tracking-wider text-[#111827] flex items-center gap-1.5">
              <Layout className="w-4 h-4 text-[#2ED573]" />
              Default Reading Direction
            </label>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => onUpdateSettings({ readingDirection: 'ltr' })}
                className={`py-2 px-3 rounded-xl border-2 border-[#111827] text-xs font-black uppercase tracking-wider transition-all ${
                  settings.readingDirection === 'ltr'
                    ? 'bg-[#111827] text-[#FFDE59] shadow-[2px_2px_0_#FF4757]'
                    : 'bg-white text-slate-700 hover:bg-slate-100 shadow-[2px_2px_0_#111827]'
                }`}
              >
                Left to Right (Western)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ readingDirection: 'rtl' })}
                className={`py-2 px-3 rounded-xl border-2 border-[#111827] text-xs font-black uppercase tracking-wider transition-all ${
                  settings.readingDirection === 'rtl'
                    ? 'bg-[#111827] text-[#FFDE59] shadow-[2px_2px_0_#FF4757]'
                    : 'bg-white text-slate-700 hover:bg-slate-100 shadow-[2px_2px_0_#111827]'
                }`}
              >
                Right to Left (Manga)
              </button>
            </div>
          </div>

          {/* Dual Page Mode (Comics / PDFs) */}
          {format !== 'epub' && (
            <div className="space-y-2 bg-white p-4 rounded-2xl border-2 border-[#111827] shadow-[3px_3px_0_#111827]">
              <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
                Landscape Display Spread
              </label>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ dualPageLandscape: false })}
                  className={`py-2 px-3 rounded-xl border-2 border-[#111827] text-xs font-black uppercase tracking-wider transition-all ${
                    !settings.dualPageLandscape
                      ? 'bg-[#111827] text-[#FFDE59] shadow-[2px_2px_0_#FF4757]'
                      : 'bg-white text-slate-700 hover:bg-slate-100 shadow-[2px_2px_0_#111827]'
                  }`}
                >
                  Single Page
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ dualPageLandscape: true })}
                  className={`py-2 px-3 rounded-xl border-2 border-[#111827] text-xs font-black uppercase tracking-wider transition-all ${
                    settings.dualPageLandscape
                      ? 'bg-[#111827] text-[#FFDE59] shadow-[2px_2px_0_#FF4757]'
                      : 'bg-white text-slate-700 hover:bg-slate-100 shadow-[2px_2px_0_#111827]'
                  }`}
                >
                  2-Page Spread
                </button>
              </div>
            </div>
          )}

          {/* Fit Mode */}
          {format !== 'epub' && (
            <div className="space-y-2 bg-white p-4 rounded-2xl border-2 border-[#111827] shadow-[3px_3px_0_#111827]">
              <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
                Image Fit Mode
              </label>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {(['contain', 'width', 'height'] as const).map((fit) => (
                  <button
                    key={fit}
                    type="button"
                    onClick={() => onUpdateSettings({ fitMode: fit })}
                    className={`py-2 px-2 rounded-xl border-2 border-[#111827] text-xs font-black uppercase tracking-wider transition-all ${
                      settings.fitMode === fit
                        ? 'bg-[#111827] text-[#FFDE59] shadow-[2px_2px_0_#FF4757]'
                        : 'bg-white text-slate-700 hover:bg-slate-100 shadow-[2px_2px_0_#111827]'
                    }`}
                  >
                    {fit}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* EPUB Typography */}
          {format === 'epub' && (
            <>
              <div className="space-y-2 bg-white p-4 rounded-2xl border-2 border-[#111827] shadow-[3px_3px_0_#111827]">
                <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
                  EPUB Reading Theme
                </label>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {(['sepia', 'light', 'dark'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onUpdateSettings({ epubTheme: t })}
                      className={`py-2 px-2 rounded-xl border-2 border-[#111827] text-xs font-black uppercase tracking-wider transition-all ${
                        settings.epubTheme === t
                          ? 'bg-[#111827] text-[#FFDE59] shadow-[2px_2px_0_#FF4757]'
                          : 'bg-white text-slate-700 hover:bg-slate-100 shadow-[2px_2px_0_#111827]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 bg-white p-4 rounded-2xl border-2 border-[#111827] shadow-[3px_3px_0_#111827]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
                    Font Scale
                  </label>
                  <span className="comic-stamp text-[10px] px-2 py-0.5 rounded bg-[#FFDE59] text-[#111827]">
                    {settings.fontSize}%
                  </span>
                </div>
                <input
                  type="range"
                  min="75"
                  max="180"
                  step="5"
                  value={settings.fontSize}
                  onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value, 10) })}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#FF4757] border border-[#111827]"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-3 border-[#111827] bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#2ED573] hover:bg-[#26af5f] text-[#111827] font-black text-xs uppercase tracking-wider rounded-xl border-3 border-[#111827] shadow-[3px_3px_0_#111827] active:scale-95 transition-all"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
