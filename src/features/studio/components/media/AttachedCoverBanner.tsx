'use client';

import { useState, useMemo } from 'react';
import { EntryMetadata, TypographicOrnament, ImageFocalPoint } from '@/types/database';
import TypographicOrnamentView from './TypographicOrnaments';
import {
  Trash2,
  Edit3,
  Image as ImageIcon,
  BookOpen,
  Check,
  Eye,
  Smartphone,
  Monitor,
  Share2,
  Crosshair,
  Sparkles,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

interface AttachedCoverBannerProps {
  metadata: EntryMetadata;
  onMetadataChange: (newMeta: Partial<EntryMetadata>) => void;
  onOpenHubTab: (tab: 'upload' | 'url' | 'matcher' | 'library' | 'typographic') => void;
}

const FOCAL_POINTS: { label: string; x: number; y: number; name: string }[] = [
  { label: 'TL', x: 20, y: 20, name: 'Top Left' },
  { label: 'TC', x: 50, y: 20, name: 'Top Center' },
  { label: 'TR', x: 80, y: 20, name: 'Top Right' },
  { label: 'CL', x: 20, y: 50, name: 'Center Left' },
  { label: 'C', x: 50, y: 50, name: 'Center' },
  { label: 'CR', x: 80, y: 50, name: 'Center Right' },
  { label: 'BL', x: 20, y: 80, name: 'Bottom Left' },
  { label: 'BC', x: 50, y: 80, name: 'Bottom Center' },
  { label: 'BR', x: 80, y: 80, name: 'Bottom Right' },
];

export default function AttachedCoverBanner({
  metadata,
  onMetadataChange,
  onOpenHubTab,
}: AttachedCoverBannerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile' | 'social'>('desktop');

  const isTypographic = metadata.cover_type === 'typographic';
  const currentCover = metadata.cover_image_url || metadata.coverUrl;
  const currentTitle = metadata.credit_title || metadata.imageCaption || 'Feature Illustration';
  const currentCreator = metadata.credit_creator || metadata.imageCredit || 'Author Upload';
  const currentSource = metadata.credit_source;
  const currentLicense = metadata.credit_license;
  const currentAlt = metadata.alt_text || '';
  const currentFocal = metadata.focal_point || { x: 50, y: 50, label: 'Center' };

  // Calculate Cover Quality Score
  const quality = useMemo(() => {
    let score = 0;
    const tips: string[] = [];

    if (currentCover) {
      score += 25;
    } else {
      tips.push('Attach an image');
    }

    if (metadata.credit_title && metadata.credit_title.trim().length > 2) {
      score += 25;
    } else {
      tips.push('Add an artwork title');
    }

    if (metadata.credit_creator && (metadata.credit_license || metadata.credit_source)) {
      score += 25;
    } else {
      tips.push('Assign artist & license');
    }

    if (metadata.alt_text && metadata.alt_text.trim().length > 10) {
      score += 25;
    } else {
      tips.push('Add accessibility alt-text');
    }

    let badge = 'Needs Context';
    let badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
    if (score >= 100) {
      badge = 'Archival Grade';
      badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    } else if (score >= 75) {
      badge = 'High Quality';
      badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
    }

    return { score, tips, badge, badgeColor };
  }, [currentCover, metadata.credit_title, metadata.credit_creator, metadata.credit_license, metadata.credit_source, metadata.alt_text]);

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
      alt_text: undefined,
      focal_point: undefined,
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

  const handleSetFocalPoint = (pt: { x: number; y: number; name: string }) => {
    onMetadataChange({
      focal_point: { x: pt.x, y: pt.y, label: pt.name },
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
    const objectPos = `${currentFocal.x}% ${currentFocal.y}%`;

    return (
      <div className="border border-[#DDD5C7] bg-[#FAF8F5] rounded shadow-2xs overflow-hidden font-serif">
        {/* Banner Header */}
        <div className="p-4 bg-[#F2ECE1] border-b border-[#DDD5C7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative w-16 h-16 border border-[#DDD5C7] rounded shrink-0 overflow-hidden bg-stone-100 shadow-2xs">
              <img
                src={currentCover}
                alt={currentAlt || currentTitle}
                referrerPolicy="no-referrer"
                style={{ objectPosition: objectPos }}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-display font-bold uppercase tracking-wider text-[#1E40AF]">
                  FEATURE ARTWORK ATTACHED
                </span>
                <span className={`px-1.5 py-0.5 border rounded text-[9px] font-sans font-semibold ${quality.badgeColor}`}>
                  {quality.score}% · {quality.badge}
                </span>
                {currentLicense && (
                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-[9px] font-sans font-semibold">
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
              <span>{isEditing ? 'Close Curator' : 'Curate & Preview'}</span>
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

        {/* Phase 2: Interactive Curator & Multi-Device Preview Panel */}
        {isEditing && (
          <div className="p-4 sm:p-5 bg-[#FAF8F5] border-b border-[#DDD5C7] space-y-5 text-xs">
            {/* Top Toolbar: Multi-Device Preview Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DDD5C7]">
              <div>
                <span className="font-display font-bold uppercase tracking-wider text-xs text-[#1C1917] block">
                  Interactive Cross-Platform Preview
                </span>
                <span className="text-[11px] text-[#66615C]">
                  Evaluate focal framing across broadsheet, mobile feed, and social cards.
                </span>
              </div>

              <div className="inline-flex p-0.5 bg-[#F2ECE1] border border-[#DDD5C7] rounded">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-display font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    previewDevice === 'desktop' ? 'bg-[#1E40AF] text-white shadow-2xs' : 'text-[#66615C] hover:text-[#1C1917]'
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                  <span>Desktop (16:9)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-display font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    previewDevice === 'mobile' ? 'bg-[#1E40AF] text-white shadow-2xs' : 'text-[#66615C] hover:text-[#1C1917]'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Mobile Feed</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('social')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-display font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    previewDevice === 'social' ? 'bg-[#1E40AF] text-white shadow-2xs' : 'text-[#66615C] hover:text-[#1C1917]'
                  }`}
                >
                  <Share2 className="w-3 h-3" />
                  <span>Social Card</span>
                </button>
              </div>
            </div>

            {/* Live Framed Preview & Focal Grid Selector */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Device Frame Display */}
              <div className="md:col-span-8 flex flex-col items-center justify-center p-4 bg-[#F2ECE1]/50 border border-[#DDD5C7] rounded">
                {previewDevice === 'desktop' && (
                  <div className="w-full aspect-[16/9] max-h-[260px] overflow-hidden border border-[#DDD5C7] rounded bg-white shadow-sm relative group">
                    <img
                      src={currentCover}
                      alt={currentAlt}
                      style={{ objectPosition: objectPos }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-display uppercase tracking-widest px-2 py-0.5 rounded">
                      Broadsheet Hero (16:9) · Focal: {currentFocal.label || 'Center'}
                    </div>
                  </div>
                )}

                {previewDevice === 'mobile' && (
                  <div className="w-[180px] aspect-[4/5] overflow-hidden border-2 border-[#1C1917] rounded-lg bg-white shadow-md relative">
                    <img
                      src={currentCover}
                      alt={currentAlt}
                      style={{ objectPosition: objectPos }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 inset-x-2 bg-black/70 text-white text-[9px] font-serif text-center px-1 py-0.5 rounded">
                      Mobile Feed Card
                    </div>
                  </div>
                )}

                {previewDevice === 'social' && (
                  <div className="w-full aspect-[1200/630] max-h-[220px] overflow-hidden border-2 border-[#1C1917] rounded-md bg-[#161413] text-[#FAF8F5] relative shadow-md flex flex-col justify-between p-3 select-none">
                    <div className="flex justify-between items-center text-[10px] font-display uppercase tracking-wider text-[#D97706] pb-1 border-b border-white/10">
                      <span>Rock The Western World</span>
                      <span className="text-white/60">1200×630 OpenGraph</span>
                    </div>
                    <div className="my-auto">
                      <div className="text-[10px] font-display uppercase tracking-widest text-sky-400 font-bold mb-0.5">
                        DISPATCH
                      </div>
                      <div className="font-serif font-bold text-sm text-white line-clamp-1">
                        {metadata.credit_title || 'Feature Title'}
                      </div>
                    </div>
                    <div className="text-[9px] text-white/50 font-display">
                      rockthewesternworld.com
                    </div>
                  </div>
                )}
              </div>

              {/* Focal Point 3x3 Selector */}
              <div className="md:col-span-4 p-3 bg-white border border-[#DDD5C7] rounded space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-[#1C1917]">
                  <Crosshair className="w-3.5 h-3.5 text-[#1E40AF]" />
                  <span>Focal Point Selection</span>
                </div>
                <p className="text-[11px] text-[#66615C]">
                  Select the core subject so crops preserve it on all devices.
                </p>

                <div className="grid grid-cols-3 gap-1 w-full max-w-[150px] mx-auto py-1">
                  {FOCAL_POINTS.map((pt) => {
                    const isSelected = currentFocal.x === pt.x && currentFocal.y === pt.y;
                    return (
                      <button
                        key={pt.label}
                        type="button"
                        onClick={() => handleSetFocalPoint(pt)}
                        className={`aspect-square flex items-center justify-center rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#1E40AF] text-white ring-2 ring-[#1E40AF]/40'
                            : 'bg-[#F2ECE1] text-[#66615C] hover:bg-[#DDD5C7] hover:text-[#1C1917]'
                        }`}
                        title={pt.name}
                      >
                        {pt.label}
                      </button>
                    );
                  })}
                </div>
                <div className="text-center text-[10px] font-serif text-[#66615C]">
                  Active: <strong className="text-[#1C1917]">{currentFocal.label || 'Center'}</strong>
                </div>
              </div>
            </div>

            {/* Accessibility Alt-Text Guidance Input */}
            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-display uppercase tracking-wider font-bold text-blue-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                  <span>Accessibility Alt-Text (Screen Readers)</span>
                </label>
                <span className="text-[10px] text-blue-700 font-serif">
                  {currentAlt.length > 0 ? `${currentAlt.length} characters` : 'Recommended for SEO & a11y'}
                </span>
              </div>
              <input
                type="text"
                value={currentAlt}
                onChange={(e) => onMetadataChange({ alt_text: e.target.value })}
                placeholder="e.g. Kermit the Frog and Fozzie Bear driving a Studebaker across an open highway..."
                className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded text-xs text-[#1C1917] focus:outline-blue-600"
              />
              <p className="text-[11px] text-blue-800/80 font-serif leading-relaxed">
                Tip: Describe what someone who cannot see the image would need to understand its emotional or intellectual context. Avoid starting with <em>"Image of"</em> or <em>"Photo of"</em>.
              </p>
            </div>

            {/* Attribution Details Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#DDD5C7]">
              <div>
                <label className="block text-[10px] font-display uppercase tracking-wider font-bold text-[#66615C] mb-1">
                  Artwork / Subject Title
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

  // 3. ELEVATED EMPTY STATE (Phase 2)
  return (
    <div className="border border-[#DDD5C7] bg-[#FAF8F5] p-5 rounded shadow-2xs font-serif space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded border border-[#DDD5C7] bg-[#F2ECE1] flex items-center justify-center text-[#B45309] shrink-0 shadow-2xs">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#1C1917]">
                EDITORIAL MEDIA STUDIO
              </h4>
              <span className="px-1.5 py-0.5 bg-[#F2ECE1] border border-[#DDD5C7] rounded text-[9px] font-mono text-[#66615C]">
                No Artwork Attached
              </span>
            </div>
            <p className="text-xs text-[#66615C] max-w-lg leading-relaxed">
              Broadsheet stories with artwork earn lead feature positioning and vibrant social cards. Or choose Typographic Mode for intentional, image-free letterpress essays.
            </p>
          </div>
        </div>

        {/* Quick Action Stamp Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onOpenHubTab('upload')}
            className="px-3 py-1.5 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] text-xs font-display uppercase tracking-wider font-bold rounded transition-colors cursor-pointer shadow-2xs"
          >
            Upload Artwork
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

      {/* Recommended Aspect Ratios & Dimensions Guidance Banner */}
      <div className="pt-3 border-t border-[#DDD5C7]/70 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#78716C]">
        <span className="font-display font-bold uppercase tracking-widest text-[#1C1917] text-[10px]">
          Recommended Dimensions:
        </span>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="px-2 py-0.5 bg-white border border-[#DDD5C7] rounded">
            Broadsheet Lead: <strong className="text-[#1C1917]">16:9</strong> (1200×675)
          </span>
          <span className="px-2 py-0.5 bg-white border border-[#DDD5C7] rounded">
            Social Card: <strong className="text-[#1C1917]">1.91:1</strong> (1200×630)
          </span>
          <span className="px-2 py-0.5 bg-white border border-[#DDD5C7] rounded">
            Book / Comic Cover: <strong className="text-[#1C1917]">4:5</strong> (800×1000)
          </span>
        </div>
      </div>
    </div>
  );
}
