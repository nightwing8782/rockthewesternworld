'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

export interface StudioAuthGateProps {
  loading?: boolean;
  error?: string | null;
  isSubmitting?: boolean;
  onSignIn: (email: string, pass: string) => Promise<boolean>;
}

export function StudioAuthGate({
  loading = false,
  error = null,
  isSubmitting = false,
  onSignIn,
}: StudioAuthGateProps) {
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="text-xs font-display uppercase tracking-[0.25em] text-[#B45309] font-bold animate-pulse flex items-center gap-2">
          <Lock className="w-4 h-4" />
          <span>Verifying Press Credentials...</span>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSignIn(authEmail, authPassword);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 selection:bg-[#1E40AF] selection:text-white">
      <div className="max-w-md w-full bg-[#FAF8F5] border-2 border-[#1C1917] p-8 shadow-[8px_8px_0px_0px_#1C1917] relative">
        <div className="border-b-2 border-[#1C1917] pb-4 mb-6 text-center">
          <div className="text-[10px] font-display uppercase tracking-[0.25em] text-[#B45309] font-bold mb-1">
            Confidential Atelier
          </div>
          <h1 className="font-display font-black text-2xl tracking-wider text-[#1C1917] uppercase">
            Rock The Western World
          </h1>
          <div className="text-[11px] font-serif italic text-[#66615C] mt-1">
            Editorial Studio • Authorized Access Only
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-serif">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#1C1917] mb-1">
              Author Email
            </label>
            <input
              type="email"
              required
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="editor@rockthewesternworld.com"
              className="w-full text-xs font-serif bg-white border border-[#E5DFC5] rounded px-3 py-2 text-[#1C1917] focus:outline-[#1E40AF]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#1C1917] mb-1">
              Studio Password
            </label>
            <input
              type="password"
              required
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full text-xs font-serif bg-white border border-[#E5DFC5] rounded px-3 py-2 text-[#1C1917] focus:outline-[#1E40AF]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] text-xs font-display uppercase tracking-widest font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Verifying...' : 'Unlock Studio'}</span>
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-[#E5DFC5] text-center text-[11px] font-serif">
          <Link
            href="/"
            className="text-[#66615C] hover:text-[#1E40AF] hover:underline"
          >
            ← Return to Public Broadsheet
          </Link>
        </div>
      </div>
    </div>
  );
}
