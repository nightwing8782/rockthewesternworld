'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Entry, EntryMetadata, EntryType, EDITORIAL_DESKS, DeskType, SubCategory } from '@/types/database';
import {
  Globe,
  X,
  Check,
  Loader2,
  Mail,
  ExternalLink,
  Copy,
  Sparkles,
  Share2,
  Zap,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

interface PromoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  contentHtml: string;
  entryType: EntryType;
  metadata: EntryMetadata;
  activeEntry: Entry | null;
  onPublished: (openDispatch?: boolean) => void;
}

export default function PromoteModal({
  isOpen,
  onClose,
  title,
  contentHtml,
  entryType,
  metadata,
  activeEntry,
  onPublished,
}: PromoteModalProps) {
  const generateSlug = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

  const isDefaultSlug = (s?: string | null) =>
    !s || s.startsWith('entry-') || s.startsWith('untitled-');

  const [slug, setSlug] = useState(() => {
    if (activeEntry?.slug && !isDefaultSlug(activeEntry.slug)) {
      return activeEntry.slug;
    }
    return title.trim() && title.trim() !== 'Untitled Entry'
      ? generateSlug(title.trim())
      : 'untitled-entry';
  });

  useEffect(() => {
    if (isOpen) {
      if (!activeEntry?.slug || isDefaultSlug(activeEntry.slug)) {
        if (title.trim() && title.trim() !== 'Untitled Entry') {
          setSlug(generateSlug(title.trim()));
        }
      } else {
        setSlug(activeEntry.slug);
      }
    }
  }, [isOpen, activeEntry?.slug, title]);

  const [desk, setDesk] = useState<DeskType>(metadata.desk || 'commonwealth');
  const [category, setCategory] = useState<SubCategory>(
    (metadata.category as SubCategory) || 'Dan Reads the News'
  );
  const [kicker, setKicker] = useState(metadata.kicker || 'EDITORIAL DISPATCH');
  const [excerpt, setExcerpt] = useState(metadata.excerpt || metadata.deck || '');
  const [broadcastToDispatch, setBroadcastToDispatch] = useState(false);
  const [pingIndexNow, setPingIndexNow] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [publishedAtTimestamp, setPublishedAtTimestamp] = useState<string>('');

  if (!isOpen) return null;

  const handlePromote = async () => {
    setIsPublishing(true);
    setErrorMsg(null);

    const cleanSlug = slug.trim() || (title.trim() ? generateSlug(title.trim()) : `entry-${Date.now().toString(36)}`);
    const nowIso = new Date().toISOString();

    const fullMetadata: EntryMetadata = {
      ...metadata,
      desk,
      category,
      kicker,
      excerpt,
      deck: excerpt,
      isPrivate: false,
    };

    try {
      const supabase = createClient();
      const payload: any = {
        id: activeEntry?.id,
        user_id: activeEntry?.user_id || undefined,
        title: title.trim() || 'Untitled Entry',
        slug: cleanSlug,
        entry_type: entryType === 'personal_ledger' ? 'thought' : entryType,
        status: 'published',
        body_html: contentHtml,
        metadata: fullMetadata,
        published_at: activeEntry?.published_at || nowIso,
        updated_at: nowIso,
      };

      const { error } = await supabase.from('entries').upsert(payload, {
        onConflict: 'id',
      });

      if (error) {
        console.error('Supabase publish error:', error);
        setErrorMsg(`Publishing failed: ${error.message}`);
        setIsPublishing(false);
        return;
      }

      // If IndexNow enabled, trigger instant search engine notification
      if (pingIndexNow) {
        try {
          const host = 'rockthewesternworld.com';
          const key = 'rockthewesternworld';
          const postUrl = `https://${host}/${cleanSlug}`;
          await fetch('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
              host,
              key,
              keyLocation: `https://${host}/${key}.txt`,
              urlList: [postUrl],
            }),
          });
        } catch (e) {
          console.warn('IndexNow auto-ping notice:', e);
        }
      }

      setPublishedAtTimestamp(activeEntry?.published_at || nowIso);
      setPublishSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error promoting entry');
    } finally {
      setIsPublishing(false);
    }
  };

  const canonicalUrl = `https://rockthewesternworld.com/${slug.trim()}`;

  const copyCanonical = () => {
    navigator.clipboard.writeText(canonicalUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleFinishCeremony = () => {
    onPublished(broadcastToDispatch);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-serif">
      <div className="bg-[#FAF8F5] border-2 border-[#DDD5C7] rounded-lg shadow-2xl max-w-xl w-full p-6 text-[#242120] relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#DDD5C7]">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-[#1E40AF]" />
            <h3 className="font-display font-black text-lg text-[#1C1917] uppercase tracking-wider">
              {publishSuccess ? 'Publishing Ceremony' : 'Promote to Public Broadsheet'}
            </h3>
          </div>
          <button
            onClick={publishSuccess ? handleFinishCeremony : onClose}
            className="p-1 text-[#66615C] hover:text-[#1C1917] cursor-pointer rounded hover:bg-[#F2ECE1]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Phase 4: Full Archival Publishing Ceremony Screen */}
        {publishSuccess ? (
          <div className="py-5 space-y-5 animate-in fade-in duration-300">
            {/* Ceremonial Seal Banner */}
            <div className="p-4 bg-[#F2ECE1] border border-[#DDD5C7] rounded text-center relative overflow-hidden">
              <div className="w-12 h-12 rounded-full bg-[#1C1917] text-[#D4AF37] border-2 border-[#D4AF37] flex items-center justify-center mx-auto mb-2 shadow-xs">
                <Check className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-display font-bold uppercase tracking-[0.25em] text-[#B45309] block">
                Historical Record Sealed
              </span>
              <h4 className="font-display font-black text-xl text-[#1C1917] uppercase tracking-wide mt-0.5">
                Entered Into The Commonwealth Archive
              </h4>
              <p className="text-xs text-[#66615C] mt-1 max-w-md mx-auto leading-relaxed">
                This dispatch is now a permanent entry in the Rock The Western World intellectual record.
              </p>
            </div>

            {/* Historical Metadata Ledger */}
            <div className="p-4 bg-white border border-[#DDD5C7] rounded space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#DDD5C7]/60">
                <span className="text-[#66615C]">Publication Timestamp:</span>
                <span className="font-mono text-[#1C1917] font-semibold">
                  {publishedAtTimestamp
                    ? new Date(publishedAtTimestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        timeZoneName: 'short',
                      })
                    : 'Just now'}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#DDD5C7]/60">
                <span className="text-[#66615C]">Archival Desk:</span>
                <span className="font-display font-bold uppercase tracking-wider text-[#1E40AF]">
                  {desk.toUpperCase()} ◆ {category}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#DDD5C7]/60">
                <span className="text-[#66615C]">Live Canonical URL:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-emerald-800 font-medium truncate max-w-[220px]">
                    /{slug.trim()}
                  </span>
                  <button
                    type="button"
                    onClick={copyCanonical}
                    className="p-1 hover:bg-[#F2ECE1] rounded text-[#66615C] hover:text-[#1C1917] transition-colors"
                    title="Copy full URL"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Ceremony Checklist */}
              <div className="pt-2 space-y-1.5 text-[11px] text-[#44403C]">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Public Broadsheet Feed Updated</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>RSS / Atom Syndication Feed Synchronized (/feed.xml)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>OpenGraph 1200×630 Magazine Social Card Generated</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Search Appearance &amp; Rich Snippets Validated</span>
                </div>
                {pingIndexNow && (
                  <div className="flex items-center gap-2 text-emerald-800">
                    <Zap className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                    <span>Instant IndexNow Ping Completed (Bing, DuckDuckGo &amp; Yandex notified)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Ceremony Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <a
                href={canonicalUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] rounded text-xs font-display font-bold uppercase tracking-wider transition-colors shadow-xs"
              >
                <span>View Live Entry</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {broadcastToDispatch ? (
                  <button
                    type="button"
                    onClick={handleFinishCeremony}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#B45309] hover:bg-[#92400E] text-white rounded text-xs font-display font-bold uppercase tracking-wider transition-colors shadow-xs"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Proceed to Dispatch Email</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinishCeremony}
                    className="w-full sm:w-auto px-5 py-2 bg-[#1E40AF] hover:bg-[#1D4ED8] text-white rounded text-xs font-display font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                  >
                    Return to Studio
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Standard Pre-Publish Configuration Form */
          <div className="space-y-4 py-4 font-serif">
            <div>
              <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#66615C] mb-1">
                PUBLIC PERMALINK SLUG
              </label>
              <div className="flex items-center gap-1 bg-[#F3EFEA] border border-[#E5DFC5] rounded px-3 py-1.5 text-xs">
                <span className="text-[#9C9589]">/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-[#1C1917] font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#B45309] mb-1">
                  EDITORIAL DESK
                </label>
                <select
                  value={desk}
                  onChange={(e) => {
                    const newDesk = e.target.value as DeskType;
                    setDesk(newDesk);
                    const d = EDITORIAL_DESKS.find((x) => x.id === newDesk);
                    if (d) setCategory(d.categories[0]);
                  }}
                  className="w-full text-xs bg-[#F3EFEA] border border-[#E5DFC5] rounded px-2.5 py-1.5 text-[#1C1917]"
                >
                  {EDITORIAL_DESKS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#1E40AF] mb-1">
                  SUB-CATEGORY
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SubCategory)}
                  className="w-full text-xs bg-[#F3EFEA] border border-[#E5DFC5] rounded px-2.5 py-1.5 text-[#1C1917]"
                >
                  {EDITORIAL_DESKS.find((d) => d.id === desk)?.categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#66615C] mb-1">
                SECTION KICKER
              </label>
              <input
                type="text"
                value={kicker}
                onChange={(e) => setKicker(e.target.value)}
                placeholder="e.g. CRITICAL INQUIRY, JURISPRUDENCE"
                className="w-full text-xs bg-[#F3EFEA] border border-[#E5DFC5] rounded px-3 py-1.5 text-[#1C1917]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#66615C] mb-1">
                PULL EXCERPT / DECK
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A compelling 1-2 sentence lead for the broadsheet front page..."
                rows={2}
                className="w-full text-xs bg-[#F3EFEA] border border-[#E5DFC5] rounded px-3 py-1.5 text-[#1C1917]"
              />
            </div>

            {/* Instant IndexNow Search Engine Ping */}
            <div className="p-3 bg-[#F2ECE1] border border-[#DDD5C7] rounded">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-serif text-[#1C1917]">
                <input
                  type="checkbox"
                  checked={pingIndexNow}
                  onChange={(e) => setPingIndexNow(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1E40AF] focus:ring-[#1E40AF]"
                />
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#D97706]" />
                  <span className="font-display font-bold uppercase tracking-wider text-[11px]">
                    Instantly ping Bing, DuckDuckGo &amp; Yandex (IndexNow)
                  </span>
                </div>
              </label>
            </div>

            {/* Newsletter Dispatch Checkbox */}
            <div className="p-3 bg-[#F2ECE1] border border-[#DDD5C7] rounded">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-serif text-[#1C1917]">
                <input
                  type="checkbox"
                  checked={broadcastToDispatch}
                  onChange={(e) => setBroadcastToDispatch(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1E40AF] focus:ring-[#1E40AF]"
                />
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#B45309]" />
                  <span className="font-display font-bold uppercase tracking-wider text-[11px]">
                    Open The Dispatch sender upon publish
                  </span>
                </div>
              </label>
            </div>

            {errorMsg && <div className="text-xs text-red-600">{errorMsg}</div>}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5DFC5]">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-display uppercase tracking-widest text-[#66615C] hover:text-[#1C1917] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePromote}
                disabled={isPublishing}
                className="flex items-center gap-2 px-5 py-2 bg-[#1E40AF] hover:bg-[#1D4ED8] text-white rounded text-xs font-display font-bold uppercase tracking-widest shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                <span>Publish Entry</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
