'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, ChevronDown } from 'lucide-react';
import { EDITORIAL_DESKS, DeskType } from '@/types/database';

interface MastheadProps {
  currentCategory?: string;
  activeDesk?: DeskType;
}

export default function Masthead({ currentCategory, activeDesk }: MastheadProps) {
  const [openDesk, setOpenDesk] = useState<string | null>(null);

  return (
    <header className="w-full bg-[#FAF8F5] border-b border-[#DDD5C7]">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12">
        {/* Top Utility Row */}
        <div className="flex items-center justify-between text-[13px] tracking-wider text-[#44403C] py-2.5 border-b border-[#DDD5C7]/70 font-medium">
          <Link
            href="/"
            className="hover:text-[#1C1917] transition-colors font-display tracking-[0.15em] uppercase text-xs font-bold"
          >
            Rock The Western World
          </Link>

          <div className="flex items-center space-x-5">
            <Link
              href="/trophy-room"
              className="flex items-center gap-1.5 text-[#44403C] hover:text-[#B45309] transition-colors tracking-[0.15em] uppercase text-xs font-bold"
              title="The Trophy Room (Reading Suite)"
            >
              <span>🏆 Trophy Room</span>
            </Link>

            <Link
              href="/journal"
              className="flex items-center gap-1.5 text-[#44403C] hover:text-[#1E40AF] transition-colors tracking-[0.15em] uppercase text-xs font-bold"
              title="Private Studio"
            >
              <Lock className="w-3.5 h-3.5 text-[#B45309]" />
              <span>Studio</span>
            </Link>
          </div>
        </div>

        {/* Title Block */}
        <div className="text-center py-6 sm:py-8">
          <Link href="/" className="inline-block group">
            <h1 className="font-display font-black text-2xl sm:text-5xl md:text-6xl text-[#1C1917] tracking-[0.06em] sm:tracking-[0.12em] uppercase transition-colors group-hover:text-[#1E40AF]">
              Rock The Western World
            </h1>
          </Link>
          <div className="mt-2 text-xs sm:text-sm font-display font-bold tracking-[0.2em] sm:tracking-[0.35em] uppercase text-[#B45309]">
            It's Either Sadness or Euphoria
          </div>
        </div>

        {/* The Three Desks Navigation (Symmetric Separators) */}
        <nav className="border-t border-[#DDD5C7] py-3 flex flex-wrap items-center justify-center text-xs sm:text-sm tracking-[0.14em] font-display font-bold uppercase text-[#1C1917]">
          {EDITORIAL_DESKS.map((desk, idx) => {
            const isOpen = openDesk === desk.id;
            const isCurrent = activeDesk === desk.id;

            return (
              <div key={desk.id} className="flex items-center">
                {idx > 0 && (
                  <span className="text-[#B45309] font-normal text-xs select-none px-2 sm:px-6">
                    ◆
                  </span>
                )}
                <div
                  className="relative group py-1"
                  onMouseEnter={() => setOpenDesk(desk.id)}
                  onMouseLeave={() => setOpenDesk(null)}
                >
                  <div className="flex items-center gap-1.5 cursor-pointer">
                    <span
                      className={`hover:text-[#1E40AF] transition-colors pb-0.5 ${
                        isCurrent ? 'text-[#1E40AF] border-b-2 border-[#1E40AF]' : ''
                      }`}
                    >
                      {desk.title}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#44403C] transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#1E40AF]' : ''
                      }`}
                    />
                  </div>

                  {/* Dropdown Tray / Flyout */}
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 w-64 sm:w-68 bg-[#FAF8F5] border border-[#DDD5C7] shadow-xl p-3 z-50 transition-all duration-150 ${
                      isOpen
                        ? 'opacity-100 visible translate-y-0'
                        : 'opacity-0 invisible -translate-y-1 pointer-events-none'
                    }`}
                  >
                    <div className="text-[11px] font-sans font-bold tracking-wider text-[#B45309] uppercase pb-1.5 mb-2 border-b border-[#DDD5C7]">
                      {desk.tagline}
                    </div>
                    <div className="flex flex-col gap-1 text-left">
                      {desk.categories.map((cat) => (
                        <Link
                          key={cat}
                          href={`/?category=${encodeURIComponent(cat)}`}
                          className={`text-[13px] normal-case font-serif tracking-normal py-1.5 px-2.5 rounded hover:bg-[#F2ECE1] hover:text-[#1E40AF] transition-colors ${
                            currentCategory === cat ? 'text-[#1E40AF] font-bold bg-[#F2ECE1]' : 'text-[#242120]'
                          }`}
                        >
                          {cat}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
