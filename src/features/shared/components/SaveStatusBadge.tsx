'use client';

import React from 'react';
import { Loader2, Check } from 'lucide-react';

export interface SaveStatusBadgeProps {
  status: 'saved' | 'saving' | 'unsaved';
  className?: string;
}

export function SaveStatusBadge({ status, className = '' }: SaveStatusBadgeProps) {
  return (
    <div
      className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono rounded bg-[#EAE4D7]/70 text-[#66615C] border border-[#DDD5C7]/60 ${className}`}
    >
      {status === 'saving' ? (
        <>
          <Loader2 className="w-3 h-3 text-amber-600 animate-spin" />
          <span className="text-amber-800 font-semibold">Auto-Saving...</span>
        </>
      ) : status === 'unsaved' ? (
        <>
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Unsaved edits</span>
        </>
      ) : (
        <>
          <Check className="w-3 h-3 text-emerald-600" />
          <span className="text-stone-600">Saved</span>
        </>
      )}
    </div>
  );
}
