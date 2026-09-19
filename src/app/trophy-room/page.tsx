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
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center space-y-4 text-stone-300">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <p className="font-mono text-xs uppercase tracking-widest text-stone-400">
          Entering The Trophy Room...
        </p>
      </div>
    );
  }

  // Not authenticated: Show Private Reading Vault Login
  if (!user) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between p-6">
        <div className="max-w-md mx-auto my-auto w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-amber-950/40 border border-amber-600/40 flex items-center justify-center text-amber-400 mx-auto mb-4 shadow-lg">
              <Trophy className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-3xl font-black uppercase tracking-tight text-stone-100 mb-2">
              The Trophy Room
            </h1>
            <p className="font-sans text-xs text-stone-400 uppercase tracking-widest">
              Private Library & Reading Suite
            </p>
          </div>

          <form
            onSubmit={handleAuthSubmit}
            className="bg-stone-900/90 border border-stone-800 rounded-xl p-6 sm:p-8 shadow-2xl space-y-5"
          >
            {authError && (
              <div className="p-3 rounded bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                {authError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-widest text-stone-400">
                Editorial Key (Email)
              </label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-lg text-sm text-stone-200 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="editor@rockthewesternworld.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-widest text-stone-400">
                Passphrase
              </label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-lg text-sm text-stone-200 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isAuthSubmitting}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs font-mono uppercase tracking-widest rounded-lg shadow-lg hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              {isAuthSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              Unlock Reading Vault
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-stone-500 hover:text-stone-300 text-xs font-mono uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Public Broadsheet
            </Link>
          </div>
        </div>

        <footer className="text-center font-mono text-[10px] uppercase tracking-widest text-stone-600 py-4">
          Rock the Western World • Digital Private Atelier
        </footer>
      </div>
    );
  }

  // Authenticated: Render Trophy Room Shelf
  return <ShelfView user={user} />;
}
