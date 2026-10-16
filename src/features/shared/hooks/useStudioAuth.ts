'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface UseStudioAuthReturn {
  user: any;
  loading: boolean;
  authError: string | null;
  isSubmitting: boolean;
  signIn: (email: string, pass: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export function useStudioAuth(): UseStudioAuthReturn {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.user) {
          setUser(data.session.user);
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } catch {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, pass: string): Promise<boolean> => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });
      if (error) throw error;
      if (data?.user) {
        setUser(data.user);
        return true;
      }
      return false;
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify author credentials.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
  }, []);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  return {
    user,
    loading,
    authError,
    isSubmitting,
    signIn,
    signOut,
    clearError,
  };
}
