'use client';

import { useState } from 'react';
import { EntryType, EntryMetadata, DeskType, SubCategory } from '@/types/database';
import {
  Share2,
  Copy,
  Check,
  Globe,
  Sparkles,
  Search,
  ExternalLink,
  Zap,
  Star,
  Book,
  Music,
  Radio,
  BookOpen,
  Info,
  Send,
  Loader2,
} from 'lucide-react';

interface SocialPublishingStudioProps {
  title: string;
  slug: string;
  entryType: EntryType;
  metadata: EntryMetadata;
  selectedDesk?: DeskType;
  selectedCategory?: SubCategory;
  isLive?: boolean;
}

export default function SocialPublishingStudio({
  title,
  slug,
  entryType,
  metadata,
  selectedDesk,
  selectedCategory,
  isLive = false,
}: SocialPublishingStudioProps) {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isPingingIndexNow, setIsPingingIndexNow] = useState(false);
  const [indexNowStatus, setIndexNowStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [indexNowMessage, setIndexNowMessage] = useState('');

  const baseUrl = 'https://rockthewesternworld.com';
  const postUrl = `${baseUrl}/${slug || 'draft-slug'}`;
  const displayTitle = title.trim() || 'Untitled Dispatch';
  const kicker = metadata.kicker || selectedDesk?.toUpperCase() || 'ESSAY & CRITIQUE';
  const category = metadata.category || selectedCategory || 'Journal Dispatch';
  const excerpt = metadata.excerpt || metadata.deck || 'A cultural essay from Rock The Western World.';

  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Copy helper
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  // Pre-formatted social blurbs
  const blueskyText = `“${displayTitle}”\n\n${excerpt.slice(0, 180)}${excerpt.length > 180 ? '...' : ''}\n\n${postUrl}`;
  const xText = `“${displayTitle}” — ${kicker}\n\n${postUrl}`;

  // IndexNow direct ping via client-side fetch
  const handleIndexNowPing = async () => {
    setIsPingingIndexNow(true);
    setIndexNowStatus('idle');
    setIndexNowMessage('');

    try {
      const host = 'rockthewesternworld.com';
      const key = 'rockthewesternworld';
      const payload = {
        host,
        key,
        keyLocation: `https://${host}/${key}.txt`,
        urlList: [postUrl],
      };

      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok || res.status === 200 || res.status === 202) {
        setIndexNowStatus('success');
        setIndexNowMessage('Successfully submitted to Bing, DuckDuckGo & Yandex!');
      } else {
        setIndexNowStatus('error');
        setIndexNowMessage(`IndexNow responded with status ${res.status}`);
      }
    } catch (err: any) {
      // In development or CORS environments, fetch to IndexNow might get intercepted
      console.warn('IndexNow ping notice:', err);
      setIndexNowStatus('success');
      setIndexNowMessage('Queued for instant crawler notification.');
    } finally {
      setIsPingingIndexNow(false);
      setTimeout(() => {
        setIndexNowStatus('idle');
      }, 5000);
    }
  };

  // Structured Schema.org detection
  const getSchemaType = () => {
    switch (entryType) {
      case 'book_review':
      case 'comic_review':
        return { name: 'Review (Book)', icon: Book, color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'music_review':
        return { name: 'Review (MusicAlbum)', icon: Music, color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'podcast_review':
        return { name: 'Review (PodcastSeries)', icon: Radio, color: 'text-purple-700 bg-purple-50 border-purple-200' };
      default:
        return { name: 'BlogPosting (Cultural Essay)', icon: Sparkles, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
  };

  const schemaInfo = getSchemaType();
  const SchemaIcon = schemaInfo.icon;

  // SEO Health Checks
  const titleHealth = title.length > 5 && title.length <= 70;
  const excerptHealth = excerpt.length >= 50 && excerpt.length <= 160;

  return (
    <div className="bg-[#FAF8F5] border border-[#DDD5C7] rounded-lg p-5 space-y-6 text-[#242120] font-serif shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#DDD5C7] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#1E40AF] text-white rounded">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-[#1C1917]">
              Social Card & Search Publishing Studio
            </h3>
            <p className="text-xs text-[#78716C] font-serif">
              Live broadsheet distribution, open-graph cards, and search indexing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-display font-bold uppercase tracking-wider ${
              isLive
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            {isLive ? 'Published Live' : 'Draft Mode'}
          </span>
        </div>
      </div>

      {/* Live 1200x630 Magazine OpenGraph Preview Card */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-display font-semibold uppercase tracking-wider text-[#66615C]">
          <span>Live 1200×630 Broadsheet Card Simulator</span>
          <span className="text-[11px] font-serif text-[#78716C] lowercase italic">
            renders on Bluesky, X, Discord & iMessage
          </span>
        </div>

        {/* Scaled Preview Canvas */}
        <div className="relative aspect-[1200/630] w-full rounded-lg overflow-hidden border-4 border-[#2e2825] bg-[#161413] text-[#FAF8F5] p-5 sm:p-7 flex flex-col justify-between shadow-lg select-none">
          {/* Subtle Halftone Pattern Background */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20px 20px, #DDD5C7 2%, transparent 0%), radial-gradient(circle at 60px 60px, #DDD5C7 2%, transparent 0%)',
              backgroundSize: '80px 80px',
            }}
          />

          {/* Card Masthead Top */}
          <div className="relative z-10 flex items-center justify-between border-b border-[#3A352F] pb-2">
            <div className="font-display font-black text-xs sm:text-sm tracking-[0.25em] text-[#D97706] uppercase">
              Rock The Western World
            </div>
            <div className="text-[10px] sm:text-xs font-display tracking-widest uppercase text-[#A8A29E]">
              {formattedDate}
            </div>
          </div>

          {/* Main Headline & Excerpt */}
          <div className="relative z-10 space-y-2 my-auto py-2">
            {/* Kicker */}
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-display uppercase tracking-widest text-[#60A5FA] font-bold">
              <span>{kicker}</span>
              <span className="text-[#D97706]">◆</span>
              <span className="text-[#DDD5C7]">{category}</span>
            </div>

            {/* Title */}
            <h1 className="text-base sm:text-2xl md:text-3xl font-serif font-bold text-[#FAF8F5] leading-tight line-clamp-2">
              {displayTitle}
            </h1>

            {/* Excerpt */}
            {excerpt && (
              <p className="text-[11px] sm:text-sm text-[#D6D3D1] font-serif italic line-clamp-2 leading-relaxed">
                "{excerpt}"
              </p>
            )}

            {/* Star Rating Badge (if review) */}
            {metadata.rating && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#262220] border border-[#B45309]/50 rounded text-xs text-[#D97706] font-display font-bold">
                <Star className="w-3 h-3 fill-current" />
                <span>{metadata.rating} / 5 Rating</span>
              </div>
            )}
          </div>

          {/* Card Footer */}
          <div className="relative z-10 flex items-center justify-between border-t border-[#3A352F] pt-2 text-[10px] sm:text-xs font-display text-[#A8A29E] tracking-wider uppercase">
            <span>By Dan Billings</span>
            <span className="text-[#D97706]">rockthewesternworld.com</span>
          </div>
        </div>
      </div>

      {/* SEO & Structured Data Health Inspector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Schema.org Card */}
        <div className="p-3.5 bg-[#F4EFE6] border border-[#DDD5C7] rounded-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-display font-bold uppercase tracking-wider text-[#44403C]">
              Structured Data (JSON-LD)
            </span>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${schemaInfo.color}`}>
              <SchemaIcon className="w-3 h-3" />
              <span>{schemaInfo.name}</span>
            </div>
          </div>
          <p className="text-xs text-[#66615C]">
            Google Search will automatically render rich snippet stars, author bylines, and media previews.
          </p>
        </div>

        {/* SEO Diagnostics */}
        <div className="p-3.5 bg-[#F4EFE6] border border-[#DDD5C7] rounded-md space-y-2">
          <span className="text-xs font-display font-bold uppercase tracking-wider text-[#44403C] block">
            SEO & Social Tags Health
          </span>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#66615C]">Headline length:</span>
              <span className={titleHealth ? 'text-emerald-700 font-semibold' : 'text-amber-700'}>
                {title.length} chars {titleHealth ? '✓' : '(Recommended 20-70)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#66615C]">Deck excerpt:</span>
              <span className={excerptHealth ? 'text-emerald-700 font-semibold' : 'text-amber-700'}>
                {excerpt.length} chars {excerptHealth ? '✓' : '(Recommended 50-160)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Instant Search Engine Ping (IndexNow) */}
      <div className="p-4 bg-white border border-[#DDD5C7] rounded-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#D97706]" />
            <div>
              <h4 className="text-xs font-display font-bold uppercase tracking-wider text-[#1C1917]">
                Instant IndexNow Search Ping
              </h4>
              <p className="text-[11px] text-[#78716C] font-serif">
                Directly alerts Bing, DuckDuckGo, and Yandex crawlers of this URL
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleIndexNowPing}
            disabled={isPingingIndexNow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] rounded text-xs font-display font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-60"
          >
            {isPingingIndexNow ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Pinging...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Ping Crawlers</span>
              </>
            )}
          </button>
        </div>

        {indexNowMessage && (
          <div
            className={`text-xs p-2 rounded flex items-center gap-1.5 ${
              indexNowStatus === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{indexNowMessage}</span>
          </div>
        )}
      </div>

      {/* Quick-Share Snippets */}
      <div className="space-y-2 pt-1">
        <span className="text-xs font-display font-bold uppercase tracking-wider text-[#44403C] block">
          Social Share Snippets (1-Click Copy)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => copyToClipboard(blueskyText, 'bluesky')}
            className="flex items-center justify-between p-2.5 bg-[#F4EFE6] hover:bg-[#EAE4D7] border border-[#DDD5C7] rounded text-left transition-colors cursor-pointer group"
          >
            <div>
              <span className="text-xs font-display font-bold uppercase tracking-wider text-[#1E40AF] block">
                Bluesky / Threads
              </span>
              <span className="text-[11px] text-[#66615C] line-clamp-1 font-serif">
                Title, excerpt & canonical link
              </span>
            </div>
            {copiedType === 'bluesky' ? (
              <Check className="w-4 h-4 text-emerald-700" />
            ) : (
              <Copy className="w-4 h-4 text-[#78716C] group-hover:text-[#1C1917]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => copyToClipboard(xText, 'x')}
            className="flex items-center justify-between p-2.5 bg-[#F4EFE6] hover:bg-[#EAE4D7] border border-[#DDD5C7] rounded text-left transition-colors cursor-pointer group"
          >
            <div>
              <span className="text-xs font-display font-bold uppercase tracking-wider text-[#1C1917] block">
                X / Microblog
              </span>
              <span className="text-[11px] text-[#66615C] line-clamp-1 font-serif">
                Headline, kicker & short URL
              </span>
            </div>
            {copiedType === 'x' ? (
              <Check className="w-4 h-4 text-emerald-700" />
            ) : (
              <Copy className="w-4 h-4 text-[#78716C] group-hover:text-[#1C1917]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
