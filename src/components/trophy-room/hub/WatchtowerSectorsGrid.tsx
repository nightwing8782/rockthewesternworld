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
import { isMangaBook, isComicBook } from '@/lib/trophy/sectorClassifier';

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
    description: 'The Complete Peanuts, Transformers IDW Universe, Hellboy, B.P.R.D., and Indie Classics.',
  },
  {
    id: 'manga',
    sectorCode: 'SECTOR 02',
    name: 'Manga Sanctuary',
    subtitle: 'RTL Japanese Runs',
    accentBg: 'bg-[#FF6B81]',
    accentText: 'text-white',
    icon: '⛩️',
    description: 'The Drops of God, Space Brothers, Blue Period, Vinland Saga, and Japanese tankōbon series.',
  },
  {
    id: 'reference',
    sectorCode: 'SECTOR 03',
    name: '101 Reference Stacks',
    subtitle: 'Compendiums & Handbooks',
    accentBg: 'bg-[#2ED573]',
    accentText: 'text-[#111827]',
    icon: '🛠️',
    description: 'Adams Media 101 Guides, practical technical skills, data engineering, and fundamentals.',
  },
  {
    id: 'cookbook',
    sectorCode: 'SECTOR 04',
    name: 'The Culinary Vault',
    subtitle: 'Gastronomy & Technique',
    accentBg: 'bg-[#FFA502]',
    accentText: 'text-[#111827]',
    icon: '🍳',
    description: 'Williams-Sonoma Collection, The Food Lab, artisanal baking, and culinary masterclasses.',
  },
  {
    id: 'wellness',
    sectorCode: 'SECTOR 05',
    name: 'Wellness & Living',
    subtitle: 'Protocols & Mindset',
    accentBg: 'bg-[#1E90FF]',
    accentText: 'text-white',
    icon: '🧘',
    description: 'Dr. Faith Harper 5-Minute Therapy, mindfulness frameworks, and daily health routines.',
  },
  {
    id: 'novel',
    sectorCode: 'SECTOR 06',
    name: 'Novels & Prose',
    subtitle: 'Fiction & Longform',
    accentBg: 'bg-[#2F3542]',
    accentText: 'text-white',
    icon: '📜',
    description: 'Longform typographic literature, classic essays, and reflowable prose in EPUB format.',
  },
  {
    id: 'writing',
    sectorCode: 'SECTOR 07',
    name: 'Writing & Craft',
    subtitle: 'Dramaturgy & Story',
    accentBg: 'bg-[#ED4C67]',
    accentText: 'text-white',
    icon: '✍️',
    description: 'Screenwriting structure, novel writing masterclasses, and publication guides.',
  },
  {
    id: 'periodical',
    sectorCode: 'SECTOR 08',
    name: 'Periodicals & Essays',
    subtitle: 'PanelxPanel & Studies',
    accentBg: 'bg-[#A55EEA]',
    accentText: 'text-white',
    icon: '📰',
    description: 'PanelxPanel Magazine issues, comic craft essays, creator interviews, and sequential art theory.',
  },
  {
    id: 'favorites',
    sectorCode: 'SECTOR 09',
    name: 'Trophy Hall of Fame',
    subtitle: 'Starred Masterpieces',
    accentBg: 'bg-[#FFDE59]',
    accentText: 'text-[#111827]',
    icon: '⭐',
    description: 'Your personal starred reading list, completed series runs, and crown jewel titles.',
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

  const rotations = ['-rotate-6', '-rotate-3', 'rotate-0', 'rotate-3', 'rotate-6'];
  const rotation = rotations[index % rotations.length];
  const zIndices = ['z-10', 'z-20', 'z-30', 'z-40', 'z-50'];
  const zIndex = zIndices[index % zIndices.length];

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
  onSelectAll?: () => void;
}

export default function WatchtowerSectorsGrid({
  books,
  onSelectSector,
}: WatchtowerSectorsGridProps) {
  // Count items per sector
  const getSectorStats = (filterId: FilterCategory) => {
    const matching = books.filter((book) => {
      if (filterId === 'comic') {
        return isComicBook(book);
      }
      if (filterId === 'manga') {
        return isMangaBook(book);
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
      if (filterId === 'novel') {
        return book.medium === 'novel' || (book.tags || []).includes('novel');
      }
      if (filterId === 'writing') {
        return book.medium === 'writing' || (book.tags || []).includes('writing');
      }
      if (filterId === 'periodical' || filterId === 'magazine') {
        return (
          book.medium === 'periodical' ||
          book.medium === 'magazine' ||
          (book.tags || []).includes('periodical') ||
          (book.tags || []).includes('magazine')
        );
      }
      if (filterId === 'favorites') {
        return !!book.is_favorite || (book.tags || []).includes('favorite');
      }
      if (filterId === 'epub') {
        return book.format === 'epub';
      }
      return true;
    });

    const total = matching.length;
    const completed = matching.filter((b) => b.progress?.completed).length;
    const sampleBooks = matching.slice(0, 3);

    return { total, completed, sampleBooks };
  };

  const primarySectors = SECTORS.slice(0, 8);
  const hallOfFameStats = getSectorStats('favorites');
  const hofPercentDone =
    hallOfFameStats.total > 0
      ? Math.round((hallOfFameStats.completed / hallOfFameStats.total) * 100)
      : 0;
  const hofSamples = books
    .filter((b) => !!b.is_favorite || (b.tags || []).includes('favorite'))
    .slice(0, 5);

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
      </div>

      {/* Primary Sectors Balanced 2x4 Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {primarySectors.map((sector) => {
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

      {/* Sector 09: Trophy Hall of Fame - Dedicated Full-Width Horizontal Vault Card */}
      <div
        onClick={() => onSelectSector('favorites')}
        className="group relative w-full bg-gradient-to-r from-[#FFDE59] via-[#FFE885] to-[#FFDE59] border-4 border-[#111827] rounded-3xl p-6 sm:p-7 shadow-[6px_6px_0_#111827] hover:shadow-[9px_9px_0_#111827] hover:-translate-y-1 transition-all duration-150 cursor-pointer overflow-hidden text-left"
      >
        {/* Pop Dot Halftone Background Accents */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-12 top-2 text-7xl opacity-10 select-none pointer-events-none font-hero hidden sm:block">
          TROPHY
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left Column: Sector Badge, Icon, Title & Narrative */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="comic-stamp text-[10px] sm:text-xs px-2.5 py-0.5 rounded bg-[#111827] text-[#FFDE59] font-black uppercase tracking-wider border border-[#111827] shadow-[2px_2px_0_#111827]">
                SECTOR 09 • SPECIAL ARCHIVE
              </span>
              <span className="comic-stamp text-[10px] sm:text-xs px-2.5 py-0.5 rounded bg-white text-[#111827] font-black uppercase tracking-wider border border-[#111827] shadow-[2px_2px_0_#111827] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#FFA502] fill-[#FFA502]" />
                CROWN JEWELS
              </span>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#111827] text-[#FFDE59] border-3 border-[#111827] flex items-center justify-center shadow-[3px_3px_0_white] text-2xl shrink-0 group-hover:scale-105 transition-transform">
                🏆
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black font-space uppercase tracking-wider text-[#111827] group-hover:text-black leading-tight">
                  Trophy Hall of Fame
                </h3>
                <p className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide mt-0.5">
                  Starred Masterpieces & Curated Vault Apex
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-bold text-slate-800 max-w-2xl leading-relaxed">
              Your personal starred reading list, completed series runs, and crown jewel titles. Curate your top recommendations and all-time favorites into one apex showcase.
            </p>

            {/* Progress Mini Bar */}
            <div className="max-w-md pt-1 space-y-1">
              <div className="flex justify-between text-[11px] font-mono font-bold text-slate-800">
                <span>Vault Completion</span>
                <span>
                  {hallOfFameStats.completed} of {hallOfFameStats.total} Read ({hofPercentDone}%)
                </span>
              </div>
              <div className="w-full bg-white/80 h-2.5 rounded-full border border-[#111827] overflow-hidden shadow-inner">
                <div
                  className="h-full bg-[#2ED573] transition-all duration-300"
                  style={{ width: `${hofPercentDone}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Covers Preview + Vault Access Button */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between w-full lg:w-auto gap-5 shrink-0 pt-2 lg:pt-0 border-t-2 border-[#111827]/10 lg:border-t-0">
            {/* Mini Preview Covers Stack */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3 overflow-visible py-2 px-2">
                {hofSamples.length > 0 ? (
                  hofSamples.map((book, i) => (
                    <MiniSectorCover
                      key={book.id || i}
                      book={book}
                      index={i}
                      accentBg="bg-[#FFDE59]"
                    />
                  ))
                ) : (
                  <div className="flex items-center gap-2 bg-white/90 px-3 py-2 rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#111827]">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-black uppercase text-[#111827]">
                      Star titles to feature here
                    </span>
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="text-2xl font-black font-mono text-[#111827] leading-none">
                  {hallOfFameStats.total}
                </div>
                <div className="text-[10px] font-bold text-slate-800 uppercase tracking-wide mt-0.5">
                  {hallOfFameStats.total === 1 ? 'Masterpiece' : 'Masterpieces'}
                </div>
              </div>
            </div>

            {/* Primary Button */}
            <button
              type="button"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#111827] text-[#FFDE59] group-hover:bg-black group-hover:text-white font-black text-xs sm:text-sm uppercase tracking-wider border-3 border-[#111827] shadow-[3px_3px_0_white] flex items-center justify-center gap-2 transition-all active:translate-x-0.5 active:translate-y-0.5 whitespace-nowrap"
            >
              <span>Enter Hall of Fame Vault</span>
              <ArrowRight className="w-4 h-4 stroke-[3] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
