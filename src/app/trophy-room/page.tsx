'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import ShelfView from '@/components/trophy-room/shelf/ShelfView';
import { Trophy, Lock, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TrophyRoomPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.user) {
          setUser(data.session.user);
        }
        setAuthLoading(false);
      }).catch(() => {
        setAuthLoading(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
        setAuthLoading(false);
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } catch (err) {
      setAuthLoading(false);
    }
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword,
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Invalid credentials.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-paper-texture flex flex-col items-center justify-center space-y-4 text-[#111827]">
        <div className="w-16 h-16 rounded-2xl bg-[#FFDE59] border-3 border-[#111827] flex items-center justify-center shadow-[4px_4px_0_#111827] transform -rotate-3">
          <Loader2 className="w-9 h-9 animate-spin text-[#111827]" />
        </div>
        <p className="font-black text-sm uppercase tracking-widest text-[#111827]">
          Entering The Trophy Room...
        </p>
      </div>
    );
  }

  // Not authenticated: Show Pop-Art Vault Login
  if (!user) {
    return (
      <div className="min-h-screen bg-paper-texture text-[#111827] flex flex-col justify-between p-6 selection:bg-[#FFDE59]">
        <div className="max-w-md mx-auto my-auto w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-3xl bg-[#FFDE59] border-4 border-[#111827] flex items-center justify-center shadow-[6px_6px_0_#111827] mx-auto mb-4 transform -rotate-3 hover:rotate-0 transition-transform">
              <Trophy className="w-10 h-10 text-[#111827] fill-[#FF4757]" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-wider text-[#111827] drop-shadow-[2px_2px_0_#FFDE59] mb-1">
              THE TROPHY ROOM
            </h1>
            <p className="font-bold text-xs uppercase tracking-widest text-slate-600">
              Private Comic & eBook Vault
            </p>
          </div>

          <form
            onSubmit={handleAuthSubmit}
            className="bg-white border-4 border-[#111827] rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0_#111827] space-y-5"
          >
            {authError && (
              <div className="p-3 rounded-xl bg-rose-100 border-2 border-[#FF4757] text-[#FF4757] font-bold text-xs">
                {authError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
                Author Email
              </label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border-3 border-[#111827] rounded-xl text-sm font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FFDE59] shadow-[2px_2px_0_#111827]"
                placeholder="editor@rockthewesternworld.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
                Studio Password
              </label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border-3 border-[#111827] rounded-xl text-sm font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FFDE59] shadow-[2px_2px_0_#111827]"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isAuthSubmitting}
              className="w-full py-3.5 bg-[#FFDE59] hover:bg-[#ffcf21] disabled:opacity-50 text-[#111827] font-black text-sm uppercase tracking-widest rounded-xl border-3 border-[#111827] shadow-[4px_4px_0_#111827] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isAuthSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Lock className="w-5 h-5 stroke-[2.5]" />
              )}
              Unlock Reading Vault
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-slate-600 hover:text-black text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              Return to Broadsheet
            </Link>
          </div>
        </div>

        <footer className="text-center font-bold text-xs uppercase tracking-widest text-slate-500 py-4">
          Rock the Western World • The Stacks
        </footer>
      </div>
    );
  }

  // Authenticated: Render Trophy Room Shelf
  return <ShelfView user={user} />;
}
