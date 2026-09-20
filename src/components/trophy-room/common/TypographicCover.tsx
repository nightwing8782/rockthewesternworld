'use client';

import React from 'react';
import { BookOpen, FileText, Bookmark, Sparkles } from 'lucide-react';
import { BookFormat } from '@/types/trophy';

interface TypographicCoverProps {
  title: string;
  series?: string;
  issueNumber?: number;
  format: BookFormat;
  author?: string | null;
  className?: string;
}

export default function TypographicCover({
  title,
  series,
  issueNumber = 1,
  format,
  author,
  className = '',
}: TypographicCoverProps) {
  // Determine color theme based on format with resilient fallback
  const normalizedFormat = String(format || 'cbz').toLowerCase();
  const themeMap: Record<string, { bg: string; accentBg: string; accentText: string; badge: string; icon: React.ReactNode }> = {
    cbz: {
      bg: 'bg-[#FF4757]',
      accentBg: 'bg-[#FFDE59]',
      accentText: 'text-[#111827]',
      badge: 'CBZ COMIC',
      icon: <BookOpen className="w-3.5 h-3.5 text-[#111827]" />,
    },
    cbr: {
      bg: 'bg-[#FF4757]',
      accentBg: 'bg-[#FFDE59]',
      accentText: 'text-[#111827]',
      badge: 'CBR COMIC',
      icon: <BookOpen className="w-3.5 h-3.5 text-[#111827]" />,
    },
    epub: {
      bg: 'bg-[#2ED573]',
      accentBg: 'bg-[#111827]',
      accentText: 'text-[#2ED573]',
      badge: 'EPUB EBOOK',
      icon: <FileText className="w-3.5 h-3.5 text-[#2ED573]" />,
    },
    pdf: {
      bg: 'bg-[#3742fa]',
      accentBg: 'bg-[#FFDE59]',
      accentText: 'text-[#111827]',
      badge: 'PDF DOCUMENT',
      icon: <Bookmark className="w-3.5 h-3.5 text-[#111827]" />,
    },
  };

  const theme = themeMap[normalizedFormat] || {
    bg: 'bg-slate-800',
    accentBg: 'bg-[#FFDE59]',
    accentText: 'text-[#111827]',
    badge: (normalizedFormat || 'BOOK').toUpperCase(),
    icon: <BookOpen className="w-3.5 h-3.5 text-[#111827]" />,
  };

  return (
    <div
      className={`relative w-full h-full ${theme.bg} p-4 flex flex-col justify-between select-none overflow-hidden ${className}`}
    >
      {/* Halftone / Ben-Day Dot Pattern */}
      <div className="absolute inset-0 bg-halftone opacity-25 pointer-events-none" />

      {/* Decorative vintage comic border inset */}
      <div className="absolute inset-2 border-2 border-black/30 rounded-lg pointer-events-none" />

      {/* Top Banner: Series & Format Pill */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span className="comic-stamp text-[9px] px-1.5 py-0.5 rounded bg-black/80 text-white font-sans uppercase tracking-widest block truncate">
            {series || 'STANDALONE'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span
            className={`comic-stamp text-[9px] px-1.5 py-0.5 rounded ${theme.accentBg} ${theme.accentText} flex items-center gap-1 shadow-[1px_1px_0_#000]`}
          >
            {theme.icon}
            <span>#{issueNumber}</span>
          </span>
        </div>
      </div>

      {/* Center: Hero Typography */}
      <div className="relative z-10 my-auto py-2 text-center">
        <div className="inline-block p-1.5 bg-black/15 rounded-lg transform -rotate-1 max-w-full">
          <h2
            className="text-base sm:text-lg font-black font-sans tracking-wider text-white uppercase line-clamp-3 leading-tight drop-shadow-[2px_2px_0_#000]"
            title={title}
          >
            {title}
          </h2>
        </div>

        {author && (
          <p className="text-[10px] font-sans font-bold text-white/90 mt-1.5 truncate">
            BY {author.toUpperCase()}
          </p>
        )}
      </div>

      {/* Bottom: Format Stamp & Graphic Accent */}
      <div className="relative z-10 flex items-center justify-between pt-2 border-t-2 border-black/20">
        <span className="text-[9px] font-black font-sans uppercase tracking-wider text-black/70 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          TROPHY ROOM
        </span>

        <span className="comic-stamp text-[9px] px-1.5 py-0.2 rounded bg-white text-[#111827] shadow-[1px_1px_0_#000]">
          {theme.badge}
        </span>
      </div>
    </div>
  );
}
