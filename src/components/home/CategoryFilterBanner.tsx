'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function CategoryFilterBanner() {
  const searchParams = useSearchParams();
  const filterCategory = searchParams.get('category');

  if (!filterCategory) return null;

  return (
    <div className="mb-8 p-3.5 bg-[#F2ECE1] border-l-4 border-[#1E40AF] flex items-center justify-between text-sm font-serif">
      <div>
        <span className="font-display uppercase tracking-widest text-[#B45309] font-bold mr-2 text-xs">
          FILTERED BY:
        </span>
        <span className="font-bold text-[#1C1917] italic">{filterCategory}</span>
      </div>
      <Link
        href="/"
        className="text-[#1E40AF] hover:underline font-display tracking-widest uppercase text-xs font-bold"
      >
        CLEAR FILTER ✕
      </Link>
    </div>
  );
}
