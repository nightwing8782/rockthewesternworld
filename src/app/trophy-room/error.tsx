'use client';

import React, { useEffect } from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function TrophyRoomError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Trophy Room Route Error]:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-paper-texture flex flex-col items-center justify-center p-6 text-center text-[#111827]">
      <div className="max-w-xl w-full bg-white border-4 border-[#111827] rounded-3xl p-8 shadow-[8px_8px_0_#111827] space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-[#FF4757] border-3 border-[#111827] flex items-center justify-center mx-auto shadow-[4px_4px_0_#111827] text-white transform -rotate-3">
          <AlertOctagon className="w-9 h-9 stroke-[2.5]" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-[#111827]">
          Trophy Room Vault Alert
        </h2>

        <p className="text-xs font-bold text-slate-600 font-comic">
          An error occurred while rendering the library catalog or search filter.
        </p>

        {error && (
          <div className="p-3.5 bg-rose-50 border-2 border-[#FF4757] rounded-xl text-left overflow-x-auto text-[11px] font-mono text-rose-900 font-bold max-h-36">
            {error.message || error.toString()}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#FFDE59] hover:bg-[#ffd938] text-[#111827] font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#111827] shadow-[3px_3px_0_#111827] active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#111827] font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#111827] shadow-[3px_3px_0_#111827] transition-all"
          >
            <Home className="w-4 h-4 stroke-[2.5]" />
            <span>Return to Broadsheet</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
