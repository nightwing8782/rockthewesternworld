'use client';

import { useState } from 'react';
import { EntryMetadata } from '@/types/database';
import { ImageResult } from '@/lib/lookups';
import {
  ImageIcon,
  ChevronDown,
  ChevronUp,
  Search,
  Link2,
  Check,
  Trash2,
} from 'lucide-react';

interface EditorialPhotographyAccordionProps {
  metadata: EntryMetadata;
  onMetadataChange: (newMeta: Partial<EntryMetadata>) => void;
}

const THEME_TAGS = [
  { id: '', label: 'All Curated' },
  { id: 'chicago', label: 'Chicago Architecture' },
  { id: 'potomac', label: 'Capitol & Potomac' },
  { id: 'desert', label: 'Desert Sublime' },
  { id: 'broadsheet', label: 'Typewriters & Books' },
  { id: 'jazz', label: 'Jazz & Vinyl' },
  { id: 'cinema', label: 'Cinema & Noir' },
];

export default function EditorialPhotographyAccordion({
  metadata,
  onMetadataChange,
}: EditorialPhotographyAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const allImages = lookupImagesSync(activeTheme, searchQuery);

  const handleSelectImage = (img: ImageResult) => {
    onMetadataChange({
      coverUrl: img.url,
      imageCaption: img.title,
      imageCredit: img.artist,
    });
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    onMetadataChange({
      coverUrl: customUrl.trim(),
      imageCaption: metadata.imageCaption || 'Feature Illustration',
      imageCredit: metadata.imageCredit || 'Provided by Author',
    });
    setCustomUrl('');
    setShowCustomInput(false);
  };

  const handleRemoveImage = () => {
    onMetadataChange({
      coverUrl: undefined,
      imageCaption: undefined,
      imageCredit: undefined,
    });
  };

  return (
    <div className="mt-8 border border-[#DDD5C7] bg-[#F2ECE1] rounded shadow-xs overflow-hidden">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-[#F2ECE1] hover:bg-[#EAE4D7] flex items-center justify-between transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <ImageIcon className="w-4 h-4 text-[#B45309]" />
          <span className="text-xs font-display font-bold uppercase tracking-wider text-[#1C1917]">
            Editorial Photography &amp; Cover Art
          </span>
          {metadata.coverUrl && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-display uppercase tracking-wider font-semibold">
              <Check className="w-3 h-3" />
              <span>Image Attached</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {metadata.coverUrl && (
            <img
              src={metadata.coverUrl}
              alt=""
              className="w-8 h-6 object-cover border border-[#DDD5C7] rounded"
            />
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-[#66615C]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#66615C]" />
          )}
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-4 bg-[#FAF8F5] border-t border-[#DDD5C7] space-y-4 font-serif">
          {/* Active Attached Image Card */}
          {metadata.coverUrl ? (
            <div className="p-3 bg-[#F2ECE1] border border-[#DDD5C7] rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={metadata.coverUrl}
                  alt={metadata.imageCaption || ''}
                  className="w-16 h-12 object-cover border border-[#DDD5C7] rounded shrink-0 shadow-2xs"
                />
                <div className="min-w-0">
                  <div className="text-xs font-display font-bold text-[#1C1917] truncate">
                    {metadata.imageCaption || 'Attached Feature Artwork'}
                  </div>
                  <div className="text-[11px] text-[#66615C] italic truncate">
                    {metadata.imageCredit || 'Author Selection'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveImage}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-stone-500 hover:text-red-700 hover:bg-[#FAF8F5] border border-stone-300 rounded transition-colors shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Artwork</span>
              </button>
            </div>
          ) : (
            <p className="text-xs italic text-[#66615C]">
              Attach a high-resolution painting, historical photograph, or architectural study to accompany this piece.
            </p>
          )}

          {/* Theme Filters */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {THEME_TAGS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTheme(t.id)}
                className={`px-2.5 py-1 rounded text-[10px] font-display uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                  activeTheme === t.id
                    ? 'bg-[#1C1917] text-[#FAF8F5] shadow-2xs'
                    : 'bg-[#F2ECE1] text-[#66615C] hover:text-[#1C1917] hover:bg-[#EAE4D7]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search & Custom URL Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-[#9C9589] absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter curated archive by name, artist, or city..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#DDD5C7] rounded text-xs text-[#1C1917] placeholder:text-[#9C9589] focus:outline-[#1E40AF]"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F2ECE1] hover:bg-[#EAE4D7] text-[#1C1917] text-xs font-display uppercase tracking-wider font-bold rounded border border-[#DDD5C7] transition-colors shrink-0 cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Custom URL</span>
            </button>
          </div>

          {/* Custom URL Input Box */}
          {showCustomInput && (
            <div className="p-3 bg-[#F2ECE1] border border-[#DDD5C7] rounded flex items-center gap-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Paste direct HTTPS image URL..."
                className="flex-1 px-3 py-1.5 bg-white border border-[#DDD5C7] rounded text-xs text-[#1C1917] focus:outline-[#1E40AF]"
              />
              <button
                type="button"
                onClick={handleApplyCustomUrl}
                className="px-3 py-1.5 bg-[#1E40AF] text-white rounded text-xs font-display uppercase tracking-wider font-bold hover:bg-[#1D4ED8] transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>
          )}

          {/* Curated Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
            {allImages.map((item) => {
              const isSelected = metadata.coverUrl === item.url;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectImage(item)}
                  className={`group cursor-pointer rounded border overflow-hidden transition-all ${
                    isSelected
                      ? 'border-[#1E40AF] ring-2 ring-[#1E40AF]/30 shadow-xs'
                      : 'border-[#DDD5C7] hover:border-[#1C1917]'
                  }`}
                >
                  <div className="aspect-video relative overflow-hidden bg-stone-200">
                    <img
                      src={item.thumbUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-[#1E40AF] text-white rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-[#FAF8F5]">
                    <div className="text-[11px] font-display font-bold text-[#1C1917] truncate">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-[#66615C] truncate italic">
                      {item.artist}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Caption & Credit Inputs */}
          {metadata.coverUrl && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#DDD5C7]">
              <div>
                <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
                  Image Caption / Title
                </label>
                <input
                  type="text"
                  value={metadata.imageCaption || ''}
                  onChange={(e) => onMetadataChange({ imageCaption: e.target.value })}
                  placeholder="e.g. Marina City at Twilight"
                  className="w-full text-xs font-serif bg-white border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#44403C] mb-1">
                  Artist / Photographic Credit
                </label>
                <input
                  type="text"
                  value={metadata.imageCredit || ''}
                  onChange={(e) => onMetadataChange({ imageCredit: e.target.value })}
                  placeholder="e.g. Photo by Neal Kharawala"
                  className="w-full text-xs font-serif bg-white border border-[#DDD5C7] rounded px-2.5 py-1.5 text-[#1C1917]"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function lookupImagesSync(theme: string, query: string): ImageResult[] {
  const archive: ImageResult[] = [
    {
      id: 'jury-1',
      title: 'The Jury (1861)',
      url: '/images/the-jury.jpg',
      thumbUrl: '/images/the-jury.jpg',
      artist: 'Painting by John Morgan (1823–1886)',
      category: 'potomac',
    },
    {
      id: 'chi-1',
      title: 'Chicago River & Marina City Towers at Twilight',
      url: '/images/chicago-river.jpg',
      thumbUrl: '/images/chicago-river.jpg',
      artist: 'Photo by Neal Kharawala',
      category: 'chicago',
    },
    {
      id: 'chi-2',
      title: 'Art Deco Facade & Chicago Architectural Geometry',
      url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1600&auto=format&fit=crop&q=80',
      thumbUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=500&auto=format&fit=crop&q=80',
      artist: 'Photo by Sawyer Bengtson',
      category: 'chicago',
    },
    {
      id: 'chi-3',
      title: 'Chicago Loop Elevated Train & Historical Shadows',
      url: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1600&auto=format&fit=crop&q=80',
      thumbUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=500&auto=format&fit=crop&q=80',
      artist: 'Photo by Max Bender',
      category: 'chicago',
    },
    {
      id: 'cap-1',
      title: 'United States Capitol Dome Framed at Dusk',
      url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1600&auto=format&fit=crop&q=80',
      thumbUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=500&auto=format&fit=crop&q=80',
      artist: 'Photo by Andy Feliciotti',
      category: 'potomac',
    },
    {
      id: 'cap-2',
      title: 'Supreme Court Classical Columns & Marble Facade',
      url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600&auto=format&fit=crop&q=80',
      thumbUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80',
      artist: 'Photo by Claire Anderson',
      category: 'potomac',
    },
    {
      id: 'des-1',
      title: 'American Western Desert Basin & Distant Mesa',
      url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&auto=format&fit=crop&q=80',
      thumbUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500&auto=format&fit=crop&q=80',
      artist: 'Photo by Austin Schmid',
      category: 'desert',
    },
    {
      id: 'des-2',
      title: 'Open Highway Across the Mojave Wilderness',
      url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1600&auto=format&fit=crop&q=80',
      thumbUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=500&auto=format&fit=crop&q=80',
      artist: 'Photo by Jeremy Bishop',
      category: 'desert',
    },
    {
      id: 'typ-1',
      title: 'Vintage Mechanical Typewriter & Fresh Heavy Stock',
      url: 'https://images.unsplash.com/photo-1526280760714-f9e8b06f3181?w=1600&auto=format&fit=crop&q=80',
      thumbUrl: 'https://images.unsplash.com/photo-1526280760714-f9e8b06f3181?w=500&auto=format&fit=crop&q=80',
      artist: 'Photo by Patrick Fore',
      category: 'broadsheet',
    },
    {
      id: 'typ-2',
      title: 'Historical Classical Library Stacks & Leather Folios',
      url: 'https://images.unsplash.com/photo-1507842229450-78212b4b455b?w=1600&auto=format&fit=crop&q=80',
      thumbUrl: 'https://images.unsplash.com/photo-1507842229450-78212b4b455b?w=500&auto=format&fit=crop&q=80',
      artist: 'Photo by Giammarco Boscaro',
      category: 'broadsheet',
    },
    {
      id: 'jaz-1',
      title: 'Analog Vinyl Record Spinning on Turntable',
      url: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=1600&auto=format&fit=crop&q=80',
      thumbUrl: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=500&auto=format&fit=crop&q=80',
      artist: 'Photo by Adrian Kister',
      category: 'jazz',
    },
    {
      id: 'jaz-2',
      title: 'Brass Trombone in Smoky Club Light',
      url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1600&auto=format&fit=crop&q=80',
      thumbUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=500&auto=format&fit=crop&q=80',
      artist: 'Photo by Jens Thekkeveettil',
      category: 'jazz',
    },
    {
      id: 'cin-1',
      title: 'Vintage Cinema Marquee Glowing in Night Mist',
      url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80',
      thumbUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80',
      artist: 'Photo by Kilyan Sockalingum',
      category: 'cinema',
    },
    {
      id: 'cin-2',
      title: 'Shadow and Architectural Silhouettes in Noir Light',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80',
      thumbUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80',
      artist: 'Photo by Joshua Fuller',
      category: 'cinema',
    },
  ];

  let res = archive;
  if (theme) res = res.filter((i) => i.category === theme);
  if (query) {
    const q = query.toLowerCase();
    res = res.filter(
      (i) => i.title.toLowerCase().includes(q) || i.artist.toLowerCase().includes(q)
    );
  }
  return res;
}
