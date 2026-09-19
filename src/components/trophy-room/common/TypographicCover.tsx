'use client';

import React from 'react';
import { BookFormat } from '@/types/trophy';
import { BookOpen, FileText, Sparkles } from 'lucide-react';

interface TypographicCoverProps {
  title: string;
  series?: string;
  issueNumber?: number;
  author?: string | null;
  format: BookFormat;
  className?: string;
}

export default function TypographicCover({
  title,
  series,
  issueNumber,
  author,
  format,
  className = '',
}: TypographicCoverProps) {
  // Select stylized gradient palette based on format
  const palette =
    format === 'cbz'
      ? 'from-amber-950 via-stone-900 to-stone-950 border-amber-600/40 text-amber-200'
      : format === 'epub'
      ? 'from-emerald-950 via-stone-900 to-stone-950 border-emerald-600/40 text-emerald-200'
      : 'from-sky-950 via-stone-900 to-stone-950 border-sky-600/40 text-sky-200';

  return (
    <div
      className={`relative aspect-[2/3] w-full bg-gradient-to-b ${palette} border-2 rounded p-4 flex flex-col justify-between shadow-xl overflow-hidden select-none ${className}`}
    >
      {/* Decorative Art Deco Corner Accents */}
      <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l border-amber-400/50" />
      <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r border-amber-400/50" />
      <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b border-l border-amber-400/50" />
      <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r border-amber-400/50" />

      {/* Subtle Grain Overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none" />

      {/* Top Header: Series / Format */}
      <div className="relative z-10 space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest opacity-80">
          <span>{format.toUpperCase()}</span>
          {issueNumber ? <span>#{issueNumber}</span> : <Sparkles className="w-3 h-3" />}
        </div>
        {series && series !== 'Standalone' && (
          <p className="font-sans text-[11px] font-semibold tracking-wider uppercase text-amber-400/90 line-clamp-1">
            {series}
          </p>
        )}
      </div>

      {/* Middle: Title */}
      <div className="relative z-10 my-auto text-center px-1">
        <h3 className="font-serif text-sm sm:text-base font-bold leading-tight tracking-wide line-clamp-4 drop-shadow-md">
          {title}
        </h3>
        <div className="w-8 h-[1px] bg-amber-500/50 mx-auto my-2" />
      </div>

      {/* Bottom: Author / Footer */}
      <div className="relative z-10 text-center">
        {author ? (
          <p className="font-serif italic text-[11px] opacity-75 line-clamp-1">by {author}</p>
        ) : (
          <p className="font-mono text-[9px] uppercase tracking-widest opacity-50">Private Vault Edition</p>
        )}
      </div>
    </div>
  );
}
