'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  BookOpen,
  MoreVertical,
  Download,
  CheckCircle2,
  Trash2,
  Edit3,
  Check,
} from 'lucide-react';
import { TrophyBook } from '@/types/trophy';
import TypographicCover from '../common/TypographicCover';

interface BookCardProps {
  book: TrophyBook;
  onOpen: (book: TrophyBook) => void;
  onEditMetadata?: (book: TrophyBook) => void;
  onToggleOffline?: (book: TrophyBook) => void;
  onDelete?: (book: TrophyBook) => void;
}

export default function BookCard({
  book,
  onOpen,
  onEditMetadata,
  onToggleOffline,
  onDelete,
}: BookCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [imgError, setImgError] = useState(false);

  const percentRead = book.progress?.percent_read || 0;
  const isCompleted = book.progress?.completed;

  // Format badge colors
  const formatBadgeColors = {
    cbz: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    epub: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    pdf: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  }[book.format];

  return (
    <div className="group relative flex flex-col w-full text-left transition-all duration-300">
      {/* Cover Container */}
      <div
        onClick={() => onOpen(book)}
        className="relative aspect-[2/3] w-full rounded-md overflow-hidden bg-stone-900 border border-stone-800 shadow-md group-hover:shadow-2xl group-hover:border-amber-500/60 group-hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      >
        {book.cover_url && !imgError ? (
          <img
            src={book.cover_url}
            alt={book.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <TypographicCover
            title={book.title}
            series={book.series}
            issueNumber={book.issue_number}
            author={book.author}
            format={book.format}
          />
        )}

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider border backdrop-blur-md shadow ${formatBadgeColors}`}
          >
            {book.format}
          </span>

          {book.isOffline && (
            <span
              className="p-1 rounded-full bg-emerald-950/80 border border-emerald-600/60 text-emerald-400 backdrop-blur-md shadow"
              title="Saved on device"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        {/* Hover Overlay with Read Button */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 pointer-events-none">
          <div className="flex items-center justify-between text-xs text-stone-200">
            <span className="font-serif font-bold flex items-center gap-1.5 text-amber-400 drop-shadow">
              <BookOpen className="w-4 h-4" />
              {percentRead > 0 ? (isCompleted ? 'Re-read' : 'Continue') : 'Read Now'}
            </span>
            {book.page_count > 0 && (
              <span className="font-mono text-[10px] text-stone-400">
                {book.page_count} pgs
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar along bottom edge */}
        {percentRead > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-stone-950/80">
            <div
              className={`h-full transition-all duration-300 ${
                isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${percentRead}%` }}
            />
          </div>
        )}
      </div>

      {/* Book Metadata Below Cover */}
      <div className="mt-2.5 flex items-start justify-between gap-2 px-0.5">
        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onOpen(book)}>
          <h4 className="font-serif text-sm font-semibold text-stone-200 group-hover:text-amber-400 transition-colors line-clamp-1 leading-snug">
            {book.title}
          </h4>
          <p className="font-mono text-[11px] text-stone-500 line-clamp-1">
            {book.series !== 'Standalone' ? `${book.series} #${book.issue_number}` : book.author || 'Standalone'}
          </p>
        </div>

        {/* Context Menu Trigger */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded text-stone-500 hover:text-stone-300 hover:bg-stone-800 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Context Dropdown Menu */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute right-0 bottom-full mb-1 w-44 bg-stone-900 border border-stone-800 rounded-lg shadow-2xl py-1 z-30 text-xs font-sans">
                {onToggleOffline && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onToggleOffline(book);
                    }}
                    className="w-full px-3 py-2 text-left text-stone-300 hover:bg-stone-800 hover:text-amber-400 flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {book.isOffline ? 'Remove Offline Cache' : 'Save for Offline'}
                  </button>
                )}

                {onEditMetadata && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onEditMetadata(book);
                    }}
                    className="w-full px-3 py-2 text-left text-stone-300 hover:bg-stone-800 hover:text-amber-400 flex items-center gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Metadata
                  </button>
                )}

                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDelete(book);
                    }}
                    className="w-full px-3 py-2 text-left text-rose-400 hover:bg-stone-800 flex items-center gap-2 border-t border-stone-800 mt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Issue
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
