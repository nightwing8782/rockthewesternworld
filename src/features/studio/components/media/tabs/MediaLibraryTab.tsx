'use client';

import { useState, useEffect } from 'react';
import { EntryMetadata, EditorialMedia, MediaSourceType } from '@/types/database';
import { getEditorialMediaList, getMediaUsage } from '@/lib/media/libraryService';
import {
  Search,
  Check,
  ImageIcon,
  Loader2,
  Filter,
  Tag,
  BookOpen,
  Film,
  Layers,
  Sparkles,
} from 'lucide-react';

interface MediaLibraryTabProps {
  metadata: EntryMetadata;
  onMetadataChange: (newMeta: Partial<EntryMetadata>) => void;
  onOpenUpload: () => void;
}

const CATEGORY_PILLS = [
  'All',
  'Americana',
  'Literature',
  'Journalism',
  'History',
  'Politics',
  'Jazz',
  'Cinema',
  'Architecture',
  'Woodcuts',
  'Fine Art',
  'General',
];

export default function MediaLibraryTab({
  metadata,
  onMetadataChange,
  onOpenUpload,
}: MediaLibraryTabProps) {
  const [assets, setAssets] = useState<EditorialMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSourceType, setSelectedSourceType] = useState<MediaSourceType | ''>('');
  const [usageMap, setUsageMap] = useState<Record<string, number>>({});

  const loadAssets = async () => {
    setIsLoading(true);
    try {
      const res = await getEditorialMediaList({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        sourceType: selectedSourceType || undefined,
        searchQuery: searchQuery || undefined,
        limit: 36,
      });

      setAssets(res.assets);

      // Fetch usage counts asynchronously
      res.assets.forEach(async (asset) => {
        if (asset.id) {
          const usage = await getMediaUsage(asset.id);
          setUsageMap((prev) => ({ ...prev, [asset.id]: usage.count }));
        }
      });
    } catch (e) {
      console.warn('Failed to load media library:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAssets();
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedCategory, selectedSourceType, searchQuery]);

  const handleSelectAsset = (asset: EditorialMedia) => {
    onMetadataChange({
      cover_type: 'hero_artwork',
      coverUrl: asset.image_url,
      cover_image_url: asset.image_url,
      credit_title: asset.title,
      credit_creator: asset.creator || 'Archive',
      credit_source: asset.source,
      credit_source_url: asset.source_url || undefined,
      credit_license: asset.license,
      imageCaption: asset.title,
      imageCredit: asset.creator || asset.source,
      editorial_media_id: asset.id,
    });
  };

  const getSourceBadge = (type: MediaSourceType) => {
    switch (type) {
      case 'upload':
        return <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-sans font-semibold rounded">Upload</span>;
      case 'review_cover':
        return <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-sans font-semibold rounded">Review Cover</span>;
      case 'public_domain':
        return <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-sans font-semibold rounded">Public Domain</span>;
      case 'url_import':
      default:
        return <span className="px-1.5 py-0.5 bg-stone-100 text-stone-700 text-[9px] font-sans font-semibold rounded">URL Import</span>;
    }
  };

  return (
    <div className="space-y-4 font-serif">
      {/* SEARCH & FILTERS */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search media library by title, artist, tags..."
            className="w-full pl-9 pr-3 py-2 bg-[#F3EFEA] border border-[#DDD5C7] rounded text-xs text-[#1C1917] placeholder:text-[#78716C] focus:outline-[#1E40AF]"
          />
        </div>

        {/* Source Type Filter */}
        <select
          value={selectedSourceType}
          onChange={(e) => setSelectedSourceType(e.target.value as any)}
          className="px-2.5 py-2 bg-[#F3EFEA] border border-[#DDD5C7] rounded text-xs text-[#1C1917] font-sans focus:outline-[#1E40AF]"
        >
          <option value="">All Sources</option>
          <option value="upload">Direct Uploads</option>
          <option value="review_cover">Review Covers</option>
          <option value="public_domain">Public Domain</option>
          <option value="url_import">URL Imports</option>
        </select>
      </div>

      {/* CATEGORY PILLS */}
      <div className="flex flex-wrap items-center gap-1.5">
        {CATEGORY_PILLS.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-2 py-1 text-[11px] font-display uppercase tracking-wider font-bold rounded transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#1C1917] text-[#FAF8F5]'
                : 'bg-[#FAF8F5] text-[#44403C] border border-[#DDD5C7] hover:bg-[#EAE4D7]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ASSET GRID */}
      {isLoading ? (
        <div className="py-16 text-center text-[#78716C] flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#1E40AF]" />
          <span className="text-xs">Loading media archive...</span>
        </div>
      ) : assets.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {assets.map((asset) => {
            const isCurrentlySelected =
              metadata.coverUrl === asset.image_url ||
              metadata.cover_image_url === asset.image_url ||
              metadata.editorial_media_id === asset.id;
            const articleCount = usageMap[asset.id] || 0;

            return (
              <div
                key={asset.id}
                onClick={() => handleSelectAsset(asset)}
                className={`group relative border rounded overflow-hidden cursor-pointer transition-all bg-[#F2ECE1] flex flex-col shadow-2xs ${
                  isCurrentlySelected
                    ? 'border-[#1E40AF] ring-2 ring-[#1E40AF]'
                    : 'border-[#DDD5C7] hover:border-[#1E40AF]'
                }`}
              >
                <div className="aspect-video w-full overflow-hidden bg-stone-200 relative">
                  <img
                    src={asset.thumbnail_url || asset.image_url}
                    alt={asset.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 bg-[#1C1917]/90 text-white text-[10px] font-display font-bold uppercase tracking-wider px-2 py-1 rounded shadow-xs transition-opacity">
                      {isCurrentlySelected ? 'Selected' : 'Use Artwork'}
                    </span>
                  </div>
                  {isCurrentlySelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#1E40AF] text-white rounded-full flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="p-2 text-left flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      {getSourceBadge(asset.source_type)}
                      {articleCount > 0 && (
                        <span className="text-[9px] text-[#78716C] font-mono">
                          Used in {articleCount} {articleCount === 1 ? 'article' : 'articles'}
                        </span>
                      )}
                    </div>
                    <h5 className="font-display font-bold text-xs text-[#1C1917] line-clamp-1 leading-snug">
                      {asset.title}
                    </h5>
                  </div>
                  <p className="text-[10px] text-[#66615C] mt-1 truncate">
                    {asset.creator ? `By ${asset.creator}` : asset.source}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center border-2 border-dashed border-[#DDD5C7] rounded-lg bg-[#FAF8F5] p-6">
          <div className="w-10 h-10 mx-auto rounded-full bg-[#F2ECE1] border border-[#DDD5C7] flex items-center justify-center text-[#78716C] mb-2.5">
            <ImageIcon className="w-5 h-5" />
          </div>
          <h4 className="font-display font-bold text-sm text-[#1C1917] uppercase tracking-wider mb-1">
            No Media Assets in Library Yet
          </h4>
          <p className="text-xs text-[#66615C] max-w-sm mx-auto mb-3">
            Every image you upload or import can be saved directly into your permanent media archive.
          </p>
          <button
            type="button"
            onClick={onOpenUpload}
            className="px-3 py-1.5 bg-[#1C1917] hover:bg-[#1E40AF] text-white text-xs font-display uppercase tracking-wider font-bold rounded transition-colors cursor-pointer"
          >
            Upload Your First Image
          </button>
        </div>
      )}
    </div>
  );
}
