'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  BookOpen,
  Compass,
  Star,
  Flame,
} from 'lucide-react';
import { TrophyBook, FilterCategory } from '@/types/trophy';
import { resolveCoverUrl } from '@/lib/trophy/coverResolver';

interface SectorDef {
  id: FilterCategory;
  sectorCode: string;
  name: string;
  subtitle: string;
  accentBg: string;
  accentText: string;
  icon: string;
  description: string;
}

const SECTORS: SectorDef[] = [
  {
    id: 'comic',
    sectorCode: 'SECTOR 01',
    name: 'Comic Archives',
    subtitle: 'Graphic Novels & Runs',
    accentBg: 'bg-[#FF4757]',
    accentText: 'text-white',
    icon: '🦸',
    description: 'The Complete Peanuts, Transformers IDW Universe, James Tynion IV & Indie Classics.',
  },
  {
    id: 'manga',
    sectorCode: 'SECTOR 02',
    name: 'Manga Sanctuary',
    subtitle: 'RTL Japanese Runs',
    accentBg: 'bg-[#FF6B81]',
    accentText: 'text-white',
    icon: '⛩️',
    description: 'A Silent Voice, Shonen, Seinen, and Japanese tankōbon series with native RTL navigation.',
  },
  {
    id: 'cookbook',
    sectorCode: 'SECTOR 03',
    name: 'The Culinary Vault',
    subtitle: 'Gastronomy & Technique',
    accentBg: 'bg-[#FFA502]',
    accentText: 'text-[#111827]',
    icon: '🍳',
    description: 'The Food Lab, Serious Eats guides, artisanal baking, and culinary masterclasses.',
  },
  {
    id: 'reference',
    sectorCode: 'SECTOR 04',
    name: '101 Reference Stacks',
    subtitle: 'Compendiums & Handbooks',
    accentBg: 'bg-[#2ED573]',
    accentText: 'text-[#111827]',
    icon: '🛠️',
    description: 'Adams Media 101 Guides, practical technical skills, data science, and fundamentals.',
  },
  {
    id: 'wellness',
    sectorCode: 'SECTOR 05',
    name: 'Wellness & Habits',
    subtitle: 'Protocols & Mindset',
    accentBg: 'bg-[#1E90FF]',
    accentText: 'text-white',
    icon: '🧘',
    description: 'Mindfulness frameworks, psychology, health science, and daily habit routines.',
  },
  {
    id: 'magazine',
    sectorCode: 'SECTOR 06',
    name: 'Periodicals & Essays',
    subtitle: 'PanelxPanel & Studies',
    accentBg: 'bg-[#A55EEA]',
    accentText: 'text-white',
    icon: '📰',
    description: 'PanelxPanel Magazine issues, comic craft essays, creator interviews, and theory.',
  },
  {
    id: 'favorites',
    sectorCode: 'SECTOR 07',
    name: 'Trophy Hall of Fame',
    subtitle: 'Starred Masterpieces',
    accentBg: 'bg-[#FFDE59]',
    accentText: 'text-[#111827]',
    icon: '⭐',
    description: 'Your personal starred reading list, completed series runs, and crown jewel titles.',
  },
  {
    id: 'epub',
    sectorCode: 'SECTOR 08',
    name: 'Prose & Literature',
    subtitle: 'Novels & Fiction',
    accentBg: 'bg-[#2F3542]',
    accentText: 'text-white',
    icon: '📖',
    description: 'Longform fiction, classic essays, and typographic prose in reflowable EPUB format.',
  },
];

interface MiniCoverProps {
  book: TrophyBook;
  index: number;
  accentBg: string;
}

function MiniSectorCover({ book, index, accentBg }: MiniCoverProps) {
  const [src, setSrc] = useState<string | null>(book.cover_url || null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    if (book.cover_key || book.cover_url) {
      resolveCoverUrl(book).then((url) => {
        if (active && url) {
          setSrc(url);
          setHasError(false);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [book.cover_key, book.cover_url]);

  const rotation = index === 0 ? '-rotate-6' : index === 1 ? 'rotate-0' : 'rotate-6';
  const zIndex = index === 0 ? 'z-10' : index === 1 ? 'z-20' : 'z-30';

  if (src && !hasError) {
    return (
      <div
        className={`relative inline-block w-10 h-14 rounded-md border-2 border-[#111827] bg-slate-900 shadow-[2px_2px_0_#111827] overflow-hidden transform group-hover:rotate-0 transition-transform duration-200 ${rotation} ${zIndex}`}
      >
        <img
          src={src}
          alt=""
          onError={() => setHasError(true)}
          className="w-full h-full object-cover select-none"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </div>
    );
  }

  // Stylish stylized fallback mini book
  return (
    <div
      className={`relative inline-block w-10 h-14 rounded-md border-2 border-[#111827] shadow-[2px_2px_0_#111827] p-1 flex flex-col justify-between overflow-hidden transform group-hover:rotate-0 transition-transform duration-200 select-none ${rotation} ${zIndex} ${
        index === 0
          ? 'bg-[#111827] text-white'
          : index === 1
          ? `${accentBg} text-[#111827]`
          : 'bg-white text-[#111827]'
      }`}
    >
      <div className="text-[7px] font-black uppercase font-mono tracking-tighter truncate opacity-80">
        {book.format?.toUpperCase() || 'VOL'}
      </div>
      <div className="flex justify-center items-center my-auto">
        <BookOpen className="w-3.5 h-3.5 opacity-70" />
      </div>
      <div className="text-[6px] font-black uppercase tracking-tighter truncate text-center">
        {book.series && book.series !== 'Standalone' ? book.series.slice(0, 8) : book.title?.slice(0, 8)}
      </div>
    </div>
  );
}

interface WatchtowerSectorsGridProps {
  books: TrophyBook[];
  onSelectSector: (sector: FilterCategory) => void;
  onSelectAll: () => void;
}

export default function WatchtowerSectorsGrid({
  books,
  onSelectSector,
  onSelectAll,
}: WatchtowerSectorsGridProps) {
  // Count items per sector
  const getSectorStats = (filterId: FilterCategory) => {
    const matching = books.filter((book) => {
      if (filterId === 'comic') {
        return book.medium === 'comic' || book.format === 'cbz' || (book.tags || []).includes('comic');
      }
      if (filterId === 'manga') {
        return book.medium === 'manga' || (book.tags || []).includes('manga');
      }
      if (filterId === 'cookbook') {
        return book.medium === 'cookbook' || (book.tags || []).includes('cookbook');
      }
      if (filterId === 'reference') {
        return book.medium === 'reference' || (book.tags || []).includes('reference');
      }
      if (filterId === 'wellness') {
        return book.medium === 'wellness' || (book.tags || []).includes('wellness');
      }
      if (filterId === 'magazine') {
        return book.medium === 'magazine' || (book.tags || []).includes('magazine');
      }
      if (filterId === 'favorites') {
        return !!book.is_favorite;
      }
      if (filterId === 'epub') {
        return book.format === 'epub' || book.medium === 'novel';
      }
      return true;
    });

    const total = matching.length;
    const completed = matching.filter((b) => b.progress?.completed).length;
    const sampleBooks = matching.slice(0, 3);

    return { total, completed, sampleBooks };
  };

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-[#FFDE59] rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#111827]">
            <Compass className="w-4 h-4 text-[#111827]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-hero tracking-wider uppercase text-[#111827] drop-shadow-[1px_1px_0_#FFDE59]">
              WATCHTOWER VAULT SECTORS
            </h2>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest font-comic">
              Choose a department to explore curated shelves and runs
            </p>
          </div>
        </div>

        <button
          onClick={onSelectAll}
          className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-[#111827] font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#111827] transition-all cursor-pointer active:scale-95"
        >
          <span>Browse All ({books.length})</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>

      {/* Sectors 2x4 Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {SECTORS.map((sector) => {
          const stats = getSectorStats(sector.id);
          const percentDone = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

          return (
            <div
              key={sector.id}
              onClick={() => onSelectSector(sector.id)}
              className="group relative bg-white border-4 border-[#111827] rounded-3xl p-5 shadow-[6px_6px_0_#111827] hover:shadow-[9px_9px_0_#111827] hover:-translate-y-1.5 transition-all duration-150 cursor-pointer flex flex-col justify-between overflow-hidden text-left"
            >
              {/* Halftone Top Bar */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`comic-stamp text-[9px] px-2 py-0.5 rounded ${sector.accentBg} ${sector.accentText} border border-[#111827] shadow-[1px_1px_0_#111827]`}>
                    {sector.sectorCode}
                  </span>

                  <span className="text-2xl">{sector.icon}</span>
                </div>

                <h3 className="text-lg font-black font-space uppercase tracking-wider text-[#111827] group-hover:text-[#FF4757] transition-colors leading-tight">
                  {sector.name}
                </h3>

                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">
                  {sector.subtitle}
                </p>

                <p className="text-xs font-bold text-slate-600 mt-2 line-clamp-2 leading-snug">
                  {sector.description}
                </p>
              </div>

              {/* Middle: Stack Sample Previews */}
              <div className="my-4 pt-3 border-t-2 border-slate-100 flex items-center justify-between">
                <div className="flex -space-x-3 overflow-visible py-1 px-1">
                  {stats.sampleBooks.length > 0 ? (
                    stats.sampleBooks.map((book, i) => (
                      <MiniSectorCover
                        key={book.id || i}
                        book={book}
                        index={i}
                        accentBg={sector.accentBg}
                      />
                    ))
                  ) : (
                    <div className="w-10 h-14 bg-slate-100 rounded-md border-2 border-[#111827] flex items-center justify-center text-slate-400 shadow-[2px_2px_0_#111827]">
                      <BookOpen className="w-4 h-4 opacity-50" />
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-base font-black font-mono text-[#111827]">
                    {stats.total}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">
                    {stats.total === 1 ? 'Volume' : 'Volumes'}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500">
                  <span>Progress</span>
                  <span>{stats.completed}/{stats.total} Read</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full border border-[#111827] overflow-hidden">
                  <div
                    className="h-full bg-[#2ED573] transition-all duration-300"
                    style={{ width: `${percentDone}%` }}
                  />
                </div>
              </div>

              {/* Bottom Access Button */}
              <button
                type="button"
                className={`mt-4 w-full py-2.5 rounded-xl border-2 border-[#111827] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-[2px_2px_0_#111827] ${
                  sector.accentBg === 'bg-[#FFDE59]'
                    ? 'bg-[#FFDE59] text-[#111827] group-hover:bg-[#ffd629]'
                    : `${sector.accentBg} ${sector.accentText} group-hover:opacity-90`
                }`}
              >
                <span>Access Sector</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Full Vault Broadside Button */}
      <div className="pt-4 text-center">
        <button
          onClick={onSelectAll}
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#111827] hover:bg-slate-800 text-white font-black text-sm uppercase tracking-widest rounded-2xl border-3 border-[#111827] shadow-[4px_4px_0_#FF4757] active:scale-95 transition-all cursor-pointer"
        >
          <Layers className="w-4 h-4 text-[#FFDE59]" />
          <span>Browse Complete Vault Catalog ({books.length} Items)</span>
          <ArrowRight className="w-4 h-4 text-[#FFDE59]" />
        </button>
      </div>
    </section>
  );
}
