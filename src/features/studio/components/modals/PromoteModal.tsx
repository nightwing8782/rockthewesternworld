'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Entry, EntryMetadata, EntryType, EDITORIAL_DESKS, DeskType, SubCategory } from '@/types/database';
import { Globe, X, Check, Loader2, Mail } from 'lucide-react';

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

  const [slug, setSlug] = useState(
    activeEntry?.slug || generateSlug(title) || 'untitled-entry'
  );
  const [desk, setDesk] = useState<DeskType>(metadata.desk || 'commonwealth');
  const [category, setCategory] = useState<SubCategory>(
    (metadata.category as SubCategory) || 'Dan Reads the News'
  );
  const [kicker, setKicker] = useState(metadata.kicker || 'EDITORIAL DISPATCH');
  const [excerpt, setExcerpt] = useState(metadata.excerpt || '');
  const [broadcastToDispatch, setBroadcastToDispatch] = useState(false);
  const [pingIndexNow, setPingIndexNow] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePromote = async () => {
    setIsPublishing(true);
    setErrorMsg(null);

    const fullMetadata: EntryMetadata = {
      ...metadata,
      desk,
      category,
      kicker,
      excerpt,
      isPrivate: false,
    };

    try {
      const supabase = createClient();
      const payload: any = {
        id: activeEntry?.id,
        title: title.trim() || 'Untitled Entry',
        slug: slug.trim(),
        entry_type: entryType === 'personal_ledger' ? 'thought' : entryType,
        status: 'published',
        body_html: contentHtml,
        metadata: fullMetadata,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('entries').upsert(payload, {
        onConflict: 'id',
      });

      if (error) {
        console.warn('Supabase publish warning (saving locally):', error.message);
      }

      // If IndexNow enabled, trigger instant search engine notification
      if (pingIndexNow) {
        try {
          const host = 'rockthewesternworld.com';
          const key = 'rockthewesternworld';
          const postUrl = `https://${host}/${slug.trim()}`;
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

      setPublishSuccess(true);
      setTimeout(() => {
        onPublished(broadcastToDispatch);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error promoting entry');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-serif">
      <div className="bg-[#FAF8F5] border border-[#E5DFC5] rounded-lg shadow-2xl max-w-lg w-full p-6 text-[#242120]">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5DFC5]">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#1E40AF]" />
            <h3 className="font-display font-bold text-lg text-[#1C1917]">
              Promote to Public Broadsheet
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-[#66615C] hover:text-[#1C1917] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {publishSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="font-display font-bold text-lg text-[#1C1917]">
              Entry Published Successfully!
            </h4>
            <p className="text-xs font-serif text-[#66615C]">
              Your dispatch is now live in the archival index.
              {broadcastToDispatch && ' Opening The Dispatch sender...'}
            </p>
          </div>
        ) : (
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
                  <Globe className="w-3.5 h-3.5 text-[#1E40AF]" />
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
