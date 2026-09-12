'use client';

import { subscribeUser } from '@/lib/lookups';
import { useState, useEffect } from 'react';
import { Mail, CheckCircle2, Loader2 } from 'lucide-react';

export default function DispatchSignup() {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [mountedAt, setMountedAt] = useState<number>(Date.now());
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setMountedAt(Date.now());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const elapsed = Date.now() - mountedAt;
      await subscribeUser(email, honeypot, elapsed);
      setStatus('success');
      setEmail('');
      setHoneypot('');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Unable to subscribe. Please try again.');
    }
  };

  return (
    <div className="w-full bg-[#F2ECE1] p-4 sm:p-5 border border-[#DDD5C7] box-border">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="w-4 h-4 text-[#1E40AF] shrink-0" />
        <span className="text-xs font-display font-bold uppercase tracking-[0.2em] text-[#1E40AF]">
          THE DISPATCH
        </span>
      </div>

      <h3 className="font-display font-bold text-base sm:text-lg text-[#1C1917] mb-2 leading-snug">
        Stay Notified of New Dispatches
      </h3>

      <p className="text-[13px] font-serif leading-relaxed text-[#44403C] mb-4">
        Occasional essays, reading notes, and cultural commentary delivered directly to your inbox whenever new pieces are published. No noise or schedule.
      </p>

      {status === 'success' ? (
        <div className="p-3 bg-[#FAF8F5] border border-stone-300 flex items-center gap-2.5 text-stone-800 text-[13px] font-serif">
          <CheckCircle2 className="w-4 h-4 text-[#1E40AF] shrink-0" />
          <span>You have been added to the dispatch list. Thank you.</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2 w-full">
          {/* Invisible Anti-Spam Honeypot Field */}
          <div
            className="hidden"
            aria-hidden="true"
            style={{ display: 'none', position: 'absolute', left: '-9999px' }}
          >
            <label htmlFor="website_url_verification">Do not fill this field</label>
            <input
              id="website_url_verification"
              type="text"
              name="website_url_verification"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 w-full">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address..."
              required
              className="w-full min-w-0 bg-[#FAF8F5] border border-stone-300 px-3 py-2 text-sm text-[#1C1917] placeholder:text-[#78716C] focus:outline-none focus:ring-1 focus:ring-[#1E40AF] rounded-none font-serif box-border"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-stone-900 text-stone-100 px-4 py-2.5 text-xs uppercase tracking-wider font-display font-bold hover:bg-stone-800 transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Subscribing...</span>
                </>
              ) : (
                <span>Subscribe</span>
              )}
            </button>
          </div>

          {status === 'error' && (
            <p className="text-xs text-red-700 font-serif mt-1">{errorMessage}</p>
          )}
        </form>
      )}
    </div>
  );
}
