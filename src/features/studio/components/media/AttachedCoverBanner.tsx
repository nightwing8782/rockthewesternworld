'use client';

import { useState } from 'react';
import { EntryMetadata, TypographicOrnament } from '@/types/database';
import TypographicOrnamentView from './TypographicOrnaments';
import { Trash2, Edit3, Image as ImageIcon, BookOpen, Check } from 'lucide-react';

interface AttachedCoverBannerProps {
  metadata: EntryMetadata;
  onMetadataChange: (newMeta: Partial<EntryMetadata>) => void;
  onOpenHubTab: (tab: 'upload' | 'url' | 'matcher' | 'library' | 'typographic') => void;
}

export default function AttachedCoverBanner({
  metadata,
  onMetadataChange,
  onOpenHubTab,
}: AttachedCoverBannerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const isTypographic = metadata.cover_type === 'typographic';
  const currentCover = metadata.cover_image_url || metadata.coverUrl;
  const currentTitle = metadata.credit_title || metadata.imageCaption || 'Feature Illustration';
  const currentCreator = metadata.credit_creator || metadata.imageCredit || 'Author Upload';
  const currentSource = metadata.credit_source;
  const currentLicense = metadata.credit_license;

  const handleRemoveCover = () => {
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
      editorial_media_id: undefined,
      cover_type: undefined,
    });
    setIsEditing(false);
  };

  const handleSwitchToTypographic = () => {
    onMetadataChange({
      cover_type: 'typographic',
      typographic_ornament: metadata.typographic_ornament || 'broadsheet_crest',
    });
  };

  const handleSwitchToArtwork = () => {
    onMetadataChange({
      cover_type: 'hero_artwork',
    });
  };

  // 1. TYPOGRAPHIC MODE ACTIVE
  if (isTypographic) {
    return (
      <div className="border border-[#DDD5C7] bg-[#F2ECE1] p-4 rounded shadow-2xs font-serif">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#DDD5C7] pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-[#B45309]" />
            <div>
              <span className="text-xs font-display font-bold uppercase tracking-wider text-[#B45309] block">
                TYPOGRAPHIC FEATURE ACTIVE
              </span>
              <span className="text-xs text-[#66615C]">
                Intentional broadsheet layout with classical letterpress ornamentation.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenHubTab('typographic')}
              className="px-2.5 py-1 text-xs font-display font-bold uppercase tracking-wider bg-[#FAF8F5] border border-[#DDD5C7] hover:bg-[#EAE4D7] transition-colors rounded cursor-pointer"
            >
              Change Ornament
            </button>
            <button
              type="button"
              onClick={handleSwitchToArtwork}
              className="px-2.5 py-1 text-xs font-display font-bold uppercase tracking-wider text-[#1E40AF] hover:underline cursor-pointer"
            >
              Switch to Artwork
            </button>
          </div>
        </div>

        {/* Live Ornament Preview */}
        <div className="bg-[#FAF8F5] border border-[#DDD5C7] rounded p-3">
          <TypographicOrnamentView ornament={metadata.typographic_ornament} />
        </div>
      </div>
    );
  }

  // 2. HERO ARTWORK ACTIVE
  if (currentCover) {
    return (
      <div className="border border-[#DDD5C7] bg-[#FAF8F5] rounded shadow-2xs overflow-hidden font-serif">
        <div className="p-4 bg-[#F2ECE1] border-b border-[#DDD5C7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <img
              src={currentCover}
              alt=""
              referrerPolicy="no-referrer"
              className="w-16 h-16 object-cover border border-[#DDD5C7] rounded shrink-0 bg-stone-100 shadow-2xs"
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
              <h4 className="font-display font-bold text-xs sm:text-sm text-[#1C1917] truncate max-w-md">
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
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#EAE4D7] border border-[#DDD5C7] text-[#1C1917] rounded text-[11px] font-display uppercase tracking-wider font-bold transition-colors cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isEditing ? 'Done Editing' : 'Edit Credit'}</span>
            </button>
            <button
              type="button"
              onClick={handleRemoveCover}
              className="p-1.5 bg-[#FAF8F5] hover:bg-red-50 border border-red-200 text-red-700 rounded transition-colors cursor-pointer"
              title="Remove Cover Image"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Inline Attribution Editor */}
        {isEditing && (
          <div className="p-4 bg-[#FAF8F5] border-b border-[#DDD5C7] space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-display uppercase tracking-wider font-bold text-[#66615C] mb-1">
                  Artwork Title
                </label>
                <input
                  type="text"
                  value={metadata.credit_title || ''}
                  onChange={(e) =>
                    onMetadataChange({
                      credit_title: e.target.value,
                      imageCaption: e.target.value,
                    })
                  }
                  placeholder="e.g. Marina City at Dusk"
                  className="w-full px-2.5 py-1.5 bg-white border border-[#DDD5C7] rounded text-xs text-[#1C1917]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-display uppercase tracking-wider font-bold text-[#66615C] mb-1">
                  Artist / Photographer
                </label>
                <input
                  type="text"
                  value={metadata.credit_creator || ''}
                  onChange={(e) =>
                    onMetadataChange({
                      credit_creator: e.target.value,
                      imageCredit: e.target.value,
                    })
                  }
                  placeholder="e.g. Neal Kharawala"
                  className="w-full px-2.5 py-1.5 bg-white border border-[#DDD5C7] rounded text-xs text-[#1C1917]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-display uppercase tracking-wider font-bold text-[#66615C] mb-1">
                  Source Archive / Host
                </label>
                <input
                  type="text"
                  value={metadata.credit_source || ''}
                  onChange={(e) => onMetadataChange({ credit_source: e.target.value })}
                  placeholder="e.g. Unsplash, Muppet Wiki, Custom Archive"
                  className="w-full px-2.5 py-1.5 bg-white border border-[#DDD5C7] rounded text-xs text-[#1C1917]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-display uppercase tracking-wider font-bold text-[#66615C] mb-1">
                  Rights &amp; License
                </label>
                <input
                  type="text"
                  value={metadata.credit_license || ''}
                  onChange={(e) => onMetadataChange({ credit_license: e.target.value })}
                  placeholder="e.g. Public Domain, CC-BY-SA, Fair Use Citation"
                  className="w-full px-2.5 py-1.5 bg-white border border-[#DDD5C7] rounded text-xs text-[#1C1917]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. EMPTY STATE / INVITE
  return (
    <div className="border border-[#DDD5C7] bg-[#FAF8F5] p-4 sm:p-5 rounded shadow-2xs font-serif flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded border border-[#DDD5C7] bg-[#F2ECE1] flex items-center justify-center text-[#78716C] shrink-0">
          <ImageIcon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#1C1917]">
            NO COVER ARTWORK SELECTED
          </h4>
          <p className="text-xs text-[#66615C]">
            Attach an image, reuse from your library, or enable Typographic Feature mode.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onOpenHubTab('upload')}
          className="px-3 py-1.5 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] text-xs font-display uppercase tracking-wider font-bold rounded transition-colors cursor-pointer"
        >
          Upload / Paste
        </button>
        <button
          type="button"
          onClick={() => onOpenHubTab('url')}
          className="px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#EAE4D7] border border-[#DDD5C7] text-[#1C1917] text-xs font-display uppercase tracking-wider font-bold rounded transition-colors cursor-pointer"
        >
          Import URL
        </button>
        <button
          type="button"
          onClick={() => onOpenHubTab('library')}
          className="px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#EAE4D7] border border-[#DDD5C7] text-[#1C1917] text-xs font-display uppercase tracking-wider font-bold rounded transition-colors cursor-pointer"
        >
          Media Library
        </button>
        <button
          type="button"
          onClick={handleSwitchToTypographic}
          className="px-2.5 py-1.5 bg-[#F2ECE1] hover:bg-[#EAE4D7] border border-[#DDD5C7] text-[#B45309] text-xs font-display uppercase tracking-wider font-bold rounded transition-colors cursor-pointer"
        >
          Typographic Mode
        </button>
      </div>
    </div>
  );
}
