'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw, ArrowLeft, AlertTriangle } from 'lucide-react';

export default function JournalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Journal Studio Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-[#1C1917] font-reading">
      <div className="max-w-md w-full bg-[#FAF8F5] border-2 border-[#1C1917] p-8 shadow-[8px_8px_0px_0px_#1C1917] text-center space-y-5">
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-[#B45309]">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div>
          <div className="text-[10px] font-display uppercase tracking-[0.25em] text-[#B45309] font-bold mb-1">
            Studio Recovery
          </div>
          <h1 className="font-display font-black text-xl text-[#1C1917] uppercase tracking-wide">
            Drafting Atelier Notice
          </h1>
          <p className="text-xs font-serif text-[#57534E] mt-2 leading-relaxed">
            {error?.message || 'An issue occurred while loading the studio interface.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-4 py-2 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] rounded text-xs font-display uppercase tracking-wider font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reload Studio</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-4 py-2 bg-[#FAF8F5] hover:bg-[#EAE4D7] text-[#44403C] border border-[#DDD5C7] rounded text-xs font-display uppercase tracking-wider font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Broadsheet</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
