'use client';

import { useState, useEffect } from 'react';
import { EntryMetadata } from '@/types/database';
import {
  ImageIcon,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  Trash2,
  ExternalLink,
  Sparkles,
  Loader2,
  Library,
  Landmark,
  Layers,
  Link2,
} from 'lucide-react';

interface OpenAccessImageGalleryProps {
  metadata: EntryMetadata;
  onMetadataChange: (newMeta: Partial<EntryMetadata>) => void;
}

interface ImageItem {
  id: string;
  url: string;
  thumbUrl: string;
  title: string;
  creator: string;
  source: string;
  sourceUrl?: string;
  license?: string;
  category?: string;
}

const CURATED_ARCHIVE: ImageItem[] = [
  {
    id: 'cur-1',
    title: 'Chicago River & Marina City Towers at Twilight',
    url: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=500&auto=format&fit=crop&q=80',
    creator: 'Sawyer Bengtson',
    source: 'Unsplash Archive',
    sourceUrl: 'https://unsplash.com',
    license: 'Unsplash Free License',
    category: 'architecture',
  },
  {
    id: 'cur-2',
    title: 'Art Deco Facade & Chicago Architectural Geometry',
    url: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=500&auto=format&fit=crop&q=80',
    creator: 'Pedro Lastra',
    source: 'Unsplash Archive',
    sourceUrl: 'https://unsplash.com',
    license: 'Unsplash Free License',
    category: 'architecture',
  },
  {
    id: 'cur-3',
    title: 'Vintage Typewriter with Classical Mechanical Typography',
    url: 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=500&auto=format&fit=crop&q=80',
    creator: 'Florian Klauer',
    source: 'Unsplash Archive',
    sourceUrl: 'https://unsplash.com',
    license: 'Unsplash Free License',
    category: 'broadsheet',
  },
  {
    id: 'cur-4',
    title: 'Warm Acoustic Jazz Club in Low Light Atmosphere',
    url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=500&auto=format&fit=crop&q=80',
    creator: 'Jens Thekkeveettil',
    source: 'Unsplash Archive',
    sourceUrl: 'https://unsplash.com',
    license: 'Unsplash Free License',
    category: 'jazz',
  },
  {
    id: 'cur-5',
    title: 'Vintage Cinema Marquee Glowing in Night Mist',
    url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80',
    creator: 'Kilyan Sockalingum',
    source: 'Unsplash Archive',
    sourceUrl: 'https://unsplash.com',
    license: 'Unsplash Free License',
    category: 'cinema',
  },
  {
    id: 'cur-6',
    title: 'Sublime Desert Horizon & Red Rock Canyon Shadows',
    url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500&auto=format&fit=crop&q=80',
    creator: 'Leio McLaren',
    source: 'Unsplash Archive',
    sourceUrl: 'https://unsplash.com',
    license: 'Unsplash Free License',
    category: 'desert',
  },
];

function cleanHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').trim();
}

export default function OpenAccessImageGallery({
  metadata,
  onMetadataChange,
}: OpenAccessImageGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'wikimedia' | 'met' | 'custom'>('presets');

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ImageItem[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Custom input state
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customCreator, setCustomCreator] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [customLicense, setCustomLicense] = useState('');
  const [isEditingAttribution, setIsEditingAttribution] = useState(false);

  // Search Wikimedia Commons
  const searchWikimedia = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
        query.trim()
      )}&gsrlimit=12&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`;

      const res = await fetch(endpoint, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error('Wikimedia search failed.');

      const data = await res.json();
      const pages = data.query?.pages || {};
      const items: ImageItem[] = [];

      Object.values(pages).forEach((page: any) => {
        const info = page.imageinfo?.[0];
        if (!info || !info.url) return;

        // Filter out non-images (svg, tiff, pdf)
        const url = info.url;
        if (!/\.(jpe?g|png|webp)/i.test(url)) return;

        const ext = info.extmetadata || {};
        const titleRaw = ext.ObjectName?.value || page.title || 'Wikimedia Image';
        const cleanTitle = cleanHtml(titleRaw).replace(/^File:/i, '').replace(/\.[^.]+$/, '');
        const creatorRaw = ext.Artist?.value || ext.Author?.value || ext.Credit?.value || 'Unknown Artist';
        const cleanCreator = cleanHtml(creatorRaw).substring(0, 100);
        const license = ext.LicenseShortName?.value || ext.License?.value || 'Public Domain / Creative Commons';
        const descUrl = info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`;

        items.push({
          id: `wiki-${page.pageid}`,
          url: url,
          thumbUrl: url,
          title: cleanTitle || 'Historical Artwork / Document',
          creator: cleanCreator || 'Public Domain',
          source: 'Wikimedia Commons',
          sourceUrl: descUrl,
          license: license,
        });
      });

      setSearchResults(items);
      if (items.length === 0) {
        setSearchError('No public domain images found on Wikimedia for this query.');
      }
    } catch (e: any) {
      setSearchError(e.message || 'Failed to connect to Wikimedia Commons API.');
    } finally {
      setIsSearching(false);
    }
  };

  // Search The Met Museum Open Access
  const searchMetMuseum = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const searchUrl = `https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=${encodeURIComponent(
        query.trim()
      )}`;
      const res = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error('Met Museum search failed.');

      const data = await res.json();
      const objectIDs = (data.objectIDs || []).slice(0, 8);

      if (objectIDs.length === 0) {
        setSearchError('No open-access artworks found in The Met collection for this query.');
        setIsSearching(false);
        return;
      }

      // Fetch details in parallel
      const details = await Promise.allSettled(
        objectIDs.map((id: number) =>
          fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`, {
            signal: AbortSignal.timeout(4500),
          }).then((r) => r.json())
        )
      );

      const items: ImageItem[] = [];
      details.forEach((d) => {
        if (d.status === 'fulfilled' && d.value) {
          const obj = d.value;
          const imgUrl = obj.primaryImageSmall || obj.primaryImage;
          if (!imgUrl) return;

          items.push({
            id: `met-${obj.objectID}`,
            url: obj.primaryImage || imgUrl,
            thumbUrl: imgUrl,
            title: obj.title || 'Untitled Fine Art',
            creator: obj.artistDisplayName || obj.culture || 'Unknown Master',
            source: 'The Metropolitan Museum of Art',
            sourceUrl: obj.objectURL || 'https://www.metmuseum.org',
            license: obj.isPublicDomain ? 'Open Access (Public Domain / CC0)' : 'The Met Collection',
          });
        }
      });

      setSearchResults(items);
      if (items.length === 0) {
        setSearchError('No accessible images found for the selected artworks.');
      }
    } catch (e: any) {
      setSearchError(e.message || 'Failed to connect to The Met Museum API.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'wikimedia') {
      searchWikimedia(searchQuery);
    } else if (activeTab === 'met') {
      searchMetMuseum(searchQuery);
    }
  };

  // Select and Bind Automated Attribution
  const handleSelectImage = (item: ImageItem) => {
    onMetadataChange({
      coverUrl: item.url,
      cover_image_url: item.url,
      credit_title: item.title,
      credit_creator: item.creator,
      credit_source: item.source,
      credit_source_url: item.sourceUrl,
      credit_license: item.license,
      imageCaption: item.title,
      imageCredit: `${item.creator}${item.source ? ` • ${item.source}` : ''}`,
    });
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    if (!customUrl.trim()) return;
    onMetadataChange({
      coverUrl: customUrl.trim(),
      cover_image_url: customUrl.trim(),
      credit_title: customTitle.trim() || 'Feature Illustration',
      credit_creator: customCreator.trim() || 'Provided by Author',
      credit_source: customSource.trim() || 'Custom Archive',
      credit_license: customLicense.trim() || 'Author Provided',
      imageCaption: customTitle.trim() || 'Feature Illustration',
      imageCredit: customCreator.trim() || 'Author Provided',
    });
    setCustomUrl('');
    setCustomTitle('');
    setCustomCreator('');
    setCustomSource('');
    setCustomLicense('');
    setIsOpen(false);
  };

  const handleRemoveImage = () => {
    onMetadataChange({
      coverUrl: undefined,
      cover_image_url: undefined,
      credit_title: undefined,
      credit_creator: undefined,
      credit_source: undefined,
      credit_source_url: undefined,
      credit_license: undefined,
      imageCaption: undefined,
      imageCredit: undefined,
    });
  };

  const currentCover = metadata.cover_image_url || metadata.coverUrl;
  const currentTitle = metadata.credit_title || metadata.imageCaption || 'Untitled Work';
  const currentCreator = metadata.credit_creator || metadata.imageCredit || 'Unknown';
  const currentSource = metadata.credit_source;
  const currentLicense = metadata.credit_license;

  return (
    <div className="mt-8 border border-[#DDD5C7] bg-[#FAF8F5] rounded shadow-xs overflow-hidden font-serif">
      {/* Attached Image Card (Always visible if image is bound) */}
      {currentCover && (
        <div className="p-4 bg-[#F2ECE1] border-b border-[#DDD5C7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <img
              src={currentCover}
              alt=""
              className="w-16 h-16 object-cover border border-[#DDD5C7] rounded shrink-0 bg-stone-100"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-display font-bold uppercase tracking-wider text-[#1E40AF]">
                  COVER ARTWORK ATTACHED
                </span>
                {currentLicense && (
                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[9px] font-sans font-semibold">
                    {currentLicense}
                  </span>
                )}
              </div>
              <h4 className="font-display font-bold text-xs text-[#1C1917] truncate max-w-md">
                {currentTitle}
              </h4>
              <p className="text-[11px] text-[#66615C] truncate">
                By <span className="font-medium text-[#1C1917]">{currentCreator}</span>
                {currentSource && <span> &bull; via {currentSource}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setIsEditingAttribution(!isEditingAttribution)}
              className="px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#EAE4D7] border border-[#DDD5C7] text-[#1C1917] rounded text-[11px] font-display uppercase tracking-wider font-bold transition-colors cursor-pointer"
            >
              {isEditingAttribution ? 'Done Editing' : 'Edit Credit'}
            </button>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="p-1.5 bg-[#FAF8F5] hover:bg-red-50 border border-red-200 text-red-700 rounded transition-colors cursor-pointer"
              title="Remove Cover Image"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Inline Attribution Editor if user wants to tweak fields */}
      {currentCover && isEditingAttribution && (
        <div className="p-4 bg-[#FAF8F5] border-b border-[#DDD5C7] space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-display uppercase font-bold text-[#66615C] mb-1">
                Work Title
              </label>
              <input
                type="text"
                value={metadata.credit_title || metadata.imageCaption || ''}
                onChange={(e) =>
                  onMetadataChange({
                    credit_title: e.target.value,
                    imageCaption: e.target.value,
                  })
                }
                className="w-full text-xs font-serif bg-[#F3EFEA] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-display uppercase font-bold text-[#66615C] mb-1">
                Artist / Photographer
              </label>
              <input
                type="text"
                value={metadata.credit_creator || metadata.imageCredit || ''}
                onChange={(e) =>
                  onMetadataChange({
                    credit_creator: e.target.value,
                    imageCredit: e.target.value,
                  })
                }
                className="w-full text-xs font-serif bg-[#F3EFEA] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-display uppercase font-bold text-[#66615C] mb-1">
                Source Repository
              </label>
              <input
                type="text"
                value={metadata.credit_source || ''}
                onChange={(e) => onMetadataChange({ credit_source: e.target.value })}
                placeholder="e.g. Wikimedia Commons or The Met"
                className="w-full text-xs font-serif bg-[#F3EFEA] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-display uppercase font-bold text-[#66615C] mb-1">
                License
              </label>
              <input
                type="text"
                value={metadata.credit_license || ''}
                onChange={(e) => onMetadataChange({ credit_license: e.target.value })}
                placeholder="e.g. Public Domain / CC0 / CC BY-SA"
                className="w-full text-xs font-serif bg-[#F3EFEA] border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Accordion Toggle Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-[#F2ECE1] hover:bg-[#EAE4D7] flex items-center justify-between transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <ImageIcon className="w-4 h-4 text-[#B45309]" />
          <span className="text-xs font-display font-bold uppercase tracking-wider text-[#1C1917]">
            {currentCover ? 'Change Cover Image (Open Access Archives)' : 'Add Cover Image & Open Access Gallery'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-display uppercase text-[#66615C]">
          <span>{isOpen ? 'Hide Gallery' : 'Open Cultural Search'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expandable Gallery & Search Body */}
      {isOpen && (
        <div className="p-4 sm:p-5 bg-[#FAF8F5] space-y-4">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[#DDD5C7] pb-2 text-xs font-display uppercase tracking-wider font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-[#1C1917] text-[#FAF8F5] shadow-xs'
                  : 'text-[#66615C] hover:text-[#1C1917] hover:bg-[#F2ECE1]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Curated Presets</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('wikimedia')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'wikimedia'
                  ? 'bg-[#1E40AF] text-white shadow-xs'
                  : 'text-[#66615C] hover:text-[#1E40AF] hover:bg-[#F2ECE1]'
              }`}
            >
              <Library className="w-3.5 h-3.5" />
              <span>Wikimedia Commons</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('met')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'met'
                  ? 'bg-[#B45309] text-white shadow-xs'
                  : 'text-[#66615C] hover:text-[#B45309] hover:bg-[#F2ECE1]'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>The Met Museum</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-stone-700 text-white shadow-xs'
                  : 'text-[#66615C] hover:text-[#1C1917] hover:bg-[#F2ECE1]'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Custom URL</span>
            </button>
          </div>

          {/* TAB 1: CURATED PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {CURATED_ARCHIVE.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => handleSelectImage(img)}
                    className="group relative border border-[#DDD5C7] rounded overflow-hidden cursor-pointer hover:border-[#1E40AF] transition-all bg-[#F2ECE1] flex flex-col"
                  >
                    <div className="aspect-video w-full overflow-hidden bg-stone-200 relative">
                      <img
                        src={img.thumbUrl}
                        alt={img.title}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 bg-[#1C1917]/90 text-white text-[10px] font-display font-bold uppercase tracking-wider px-2 py-1 rounded shadow-xs transition-opacity">
                          Select Art
                        </span>
                      </div>
                    </div>
                    <div className="p-2 text-left flex-1 flex flex-col justify-between">
                      <h5 className="font-display font-bold text-[11px] text-[#1C1917] line-clamp-1 leading-snug">
                        {img.title}
                      </h5>
                      <p className="text-[10px] text-[#66615C] mt-0.5 truncate">
                        By {img.creator} &bull; {img.license}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2 & 3: WIKIMEDIA COMMONS & THE MET SEARCH */}
          {(activeTab === 'wikimedia' || activeTab === 'met') && (
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      activeTab === 'wikimedia'
                        ? 'Search Wikimedia Commons (e.g. Edward Hopper, Supreme Court, Roman Forum)...'
                        : 'Search The Met Open Access (e.g. Water Lilies, Classical Portrait, Goya)...'
                    }
                    className="w-full pl-9 pr-3 py-2 bg-[#F3EFEA] border border-[#DDD5C7] rounded text-xs text-[#1C1917] placeholder:text-[#78716C] focus:outline-[#1E40AF]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-4 py-2 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] rounded text-xs font-display uppercase tracking-wider font-bold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Search Archive</span>
                </button>
              </form>

              {searchError && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded text-xs italic">
                  {searchError}
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectImage(item)}
                      className="group relative border border-[#DDD5C7] rounded overflow-hidden cursor-pointer hover:border-[#1E40AF] transition-all bg-[#F2ECE1] flex flex-col shadow-2xs"
                    >
                      <div className="aspect-square w-full overflow-hidden bg-stone-200 relative">
                        <img
                          src={item.thumbUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 bg-[#1E40AF] text-white text-[10px] font-display font-bold uppercase tracking-wider px-2 py-1 rounded shadow-xs transition-opacity">
                            Use Artwork
                          </span>
                        </div>
                      </div>
                      <div className="p-2 text-left flex-1 flex flex-col justify-between">
                        <h5 className="font-display font-bold text-[11px] text-[#1C1917] line-clamp-1 leading-snug">
                          {item.title}
                        </h5>
                        <p className="text-[10px] text-[#66615C] mt-0.5 truncate">
                          {item.creator}
                        </p>
                        <span className="text-[9px] font-sans text-emerald-800 font-semibold truncate block mt-0.5">
                          {item.license || item.source}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CUSTOM URL */}
          {activeTab === 'custom' && (
            <div className="p-4 bg-[#F2ECE1] border border-[#DDD5C7] rounded space-y-3">
              <div>
                <label className="block text-[10px] font-display uppercase font-bold text-[#66615C] mb-1">
                  Direct Image URL (HTTPS)
                </label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/artwork.jpg"
                  className="w-full text-xs bg-white border border-[#DDD5C7] rounded px-3 py-2 text-[#1C1917] focus:outline-[#1E40AF]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-display uppercase font-bold text-[#66615C] mb-1">
                    Work Title
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Study of Light in Autumn"
                    className="w-full text-xs bg-white border border-[#DDD5C7] rounded px-3 py-2 text-[#1C1917]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-display uppercase font-bold text-[#66615C] mb-1">
                    Artist / Photographer
                  </label>
                  <input
                    type="text"
                    value={customCreator}
                    onChange={(e) => setCustomCreator(e.target.value)}
                    placeholder="e.g. Anonymous / Author"
                    className="w-full text-xs bg-white border border-[#DDD5C7] rounded px-3 py-2 text-[#1C1917]"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleApplyCustom}
                disabled={!customUrl.trim()}
                className="px-4 py-2 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] rounded text-xs font-display uppercase tracking-wider font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                Apply Custom Artwork
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
