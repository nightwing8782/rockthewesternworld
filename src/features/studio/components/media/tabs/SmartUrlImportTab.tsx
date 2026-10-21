'use client';

import { useState } from 'react';
import { EntryMetadata } from '@/types/database';
import {
  validateAndInspectImageUrl,
  ingestExternalUrlToSelfStorage,
  ImportedUrlResult,
} from '@/lib/media/urlImporter';
import { saveMediaAsset } from '@/lib/media/libraryService';
import {
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DownloadCloud,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface SmartUrlImportTabProps {
  metadata: EntryMetadata;
  onMetadataChange: (newMeta: Partial<EntryMetadata>) => void;
  onAssetSaved?: () => void;
}

const CATEGORY_SUGGESTIONS = [
  'Americana',
  'Literature',
  'Journalism',
  'History',
  'Politics',
  'Jazz',
  'Cinema',
  'Architecture',
  'General',
];

export default function SmartUrlImportTab({
  metadata,
  onMetadataChange,
  onAssetSaved,
}: SmartUrlImportTabProps) {
  const [rawUrl, setRawUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<ImportedUrlResult | null>(null);

  // Editable attribution fields after inspection
  const [title, setTitle] = useState('');
  const [creator, setCreator] = useState('');
  const [source, setSource] = useState('');
  const [license, setLicense] = useState('');
  const [category, setCategory] = useState(metadata.category || 'General');

  const handleValidateUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawUrl.trim()) return;

    setIsValidating(true);
    setInspectionResult(null);

    try {
      const result = await validateAndInspectImageUrl(rawUrl);
      setInspectionResult(result);

      if (result.isValid) {
        setTitle(result.suggestedTitle);
        setCreator(result.suggestedCreator || 'Unknown');
        setSource(result.suggestedSource);
        setLicense(result.suggestedLicense);
      }
    } catch (err: any) {
      setInspectionResult({
        cleanUrl: rawUrl,
        originalUrl: rawUrl,
        isValid: false,
        suggestedTitle: 'Image',
        suggestedSource: 'Web Archive',
        suggestedLicense: 'Author Provided',
        error: err.message || 'Validation failed.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Option 1: Bind Clean Normalized URL directly as external citation
  const handleApplyCleanUrl = async () => {
    if (!inspectionResult || !inspectionResult.isValid) return;

    const savedMedia = await saveMediaAsset({
      title: title.trim() || inspectionResult.suggestedTitle,
      imageUrl: inspectionResult.cleanUrl,
      thumbnailUrl: inspectionResult.cleanUrl,
      storagePath: 'external-citation',
      width: inspectionResult.width,
      height: inspectionResult.height,
      sourceType: 'url_import',
      creator: creator.trim() || inspectionResult.suggestedCreator,
      source: source.trim() || inspectionResult.suggestedSource,
      sourceUrl: inspectionResult.cleanUrl,
      license: license.trim() || inspectionResult.suggestedLicense,
      category: category.trim() || 'General',
    });

    onMetadataChange({
      cover_type: 'hero_artwork',
      coverUrl: inspectionResult.cleanUrl,
      cover_image_url: inspectionResult.cleanUrl,
      credit_title: title.trim() || inspectionResult.suggestedTitle,
      credit_creator: creator.trim() || inspectionResult.suggestedCreator,
      credit_source: source.trim() || inspectionResult.suggestedSource,
      credit_source_url: inspectionResult.cleanUrl,
      credit_license: license.trim() || inspectionResult.suggestedLicense,
      imageCaption: title.trim() || inspectionResult.suggestedTitle,
      imageCredit: creator.trim() || inspectionResult.suggestedCreator,
      editorial_media_id: savedMedia?.id,
    });

    if (onAssetSaved) onAssetSaved();
    setRawUrl('');
    setInspectionResult(null);
  };

  // Option 2: Ingest & Permanently Self-Host in Supabase Storage
  const handleIngestToSelfStorage = async () => {
    if (!inspectionResult || !inspectionResult.isValid) return;

    setIsIngesting(true);
    try {
      const { permanentUrl, sha256Hash, width, height } =
        await ingestExternalUrlToSelfStorage(inspectionResult.cleanUrl, title || 'imported-art');

      const savedMedia = await saveMediaAsset({
        title: title.trim() || inspectionResult.suggestedTitle,
        imageUrl: permanentUrl,
        thumbnailUrl: permanentUrl,
        storagePath: 'editorial-media',
        sha256Hash,
        width,
        height,
        sourceType: 'upload',
        creator: creator.trim() || inspectionResult.suggestedCreator,
        source: source.trim() || inspectionResult.suggestedSource,
        sourceUrl: inspectionResult.originalUrl,
        license: license.trim() || inspectionResult.suggestedLicense,
        category: category.trim() || 'General',
      });

      onMetadataChange({
        cover_type: 'hero_artwork',
        coverUrl: permanentUrl,
        cover_image_url: permanentUrl,
        credit_title: title.trim() || inspectionResult.suggestedTitle,
        credit_creator: creator.trim() || inspectionResult.suggestedCreator,
        credit_source: source.trim() || inspectionResult.suggestedSource,
        credit_source_url: inspectionResult.originalUrl,
        credit_license: license.trim() || inspectionResult.suggestedLicense,
        imageCaption: title.trim() || inspectionResult.suggestedTitle,
        imageCredit: creator.trim() || inspectionResult.suggestedCreator,
        editorial_media_id: savedMedia?.id,
      });

      if (onAssetSaved) onAssetSaved();
      setRawUrl('');
      setInspectionResult(null);
    } catch (err: any) {
      alert(`Ingestion failed: ${err.message}. You can still use the direct citation button.`);
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="space-y-4 font-serif">
      <form onSubmit={handleValidateUrl} className="flex gap-2">
        <div className="relative flex-1">
          <LinkIcon className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="url"
            value={rawUrl}
            onChange={(e) => setRawUrl(e.target.value)}
            placeholder="Paste direct image link (Wikia, Wikimedia, Substack, etc.)..."
            className="w-full pl-9 pr-3 py-2 bg-[#F3EFEA] border border-[#DDD5C7] rounded text-xs text-[#1C1917] placeholder:text-[#78716C] focus:outline-[#1E40AF]"
          />
        </div>
        <button
          type="submit"
          disabled={isValidating || !rawUrl.trim()}
          className="px-4 py-2 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] rounded text-xs font-display uppercase tracking-wider font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
        >
          {isValidating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5" />
          )}
          <span>Inspect &amp; Test URL</span>
        </button>
      </form>

      {/* INSPECTION RESULTS & PREVIEW */}
      {inspectionResult && (
        <div className="p-4 bg-[#FAF8F5] border border-[#DDD5C7] rounded space-y-4 shadow-xs">
          {inspectionResult.isValid ? (
            <>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="w-32 h-24 overflow-hidden border border-[#DDD5C7] rounded bg-[#F2ECE1] shrink-0">
                  <img
                    src={inspectionResult.cleanUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[9px] font-sans font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Image Verified ({inspectionResult.width} &times; {inspectionResult.height}px)
                    </span>
                    {inspectionResult.cleanUrl !== inspectionResult.originalUrl && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 rounded text-[9px] font-sans">
                        Hotlink Tracking Stripped
                      </span>
                    )}
                  </div>
                  <h4 className="font-display font-bold text-sm text-[#1C1917] truncate">
                    {title || inspectionResult.suggestedTitle}
                  </h4>
                  <p className="text-xs text-[#66615C]">
                    Clean URL ready for direct citation or permanent ingestion.
                  </p>
                </div>
              </div>

              {/* Attribution Edit Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-[#DDD5C7]">
                <div>
                  <label className="block text-[10px] font-display uppercase tracking-wider font-bold text-[#66615C] mb-1">
                    Artwork Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#DDD5C7] rounded text-xs text-[#1C1917]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-display uppercase tracking-wider font-bold text-[#66615C] mb-1">
                    Artist / Photographer
                  </label>
                  <input
                    type="text"
                    value={creator}
                    onChange={(e) => setCreator(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#DDD5C7] rounded text-xs text-[#1C1917]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-display uppercase tracking-wider font-bold text-[#66615C] mb-1">
                    Source Archive / Domain
                  </label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#DDD5C7] rounded text-xs text-[#1C1917]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-display uppercase tracking-wider font-bold text-[#66615C] mb-1">
                    Category (Free-Text)
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#DDD5C7] rounded text-xs text-[#1C1917]"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#DDD5C7]">
                <span className="text-[11px] text-[#78716C]">
                  Self-hosting permanently protects your piece against dead links.
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApplyCleanUrl}
                    className="px-3 py-1.5 bg-white hover:bg-[#F2ECE1] border border-[#DDD5C7] text-[#1C1917] rounded text-xs font-display uppercase tracking-wider font-bold transition-colors cursor-pointer"
                  >
                    Use as Clean Citation
                  </button>
                  <button
                    type="button"
                    disabled={isIngesting}
                    onClick={handleIngestToSelfStorage}
                    className="px-4 py-1.5 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] rounded text-xs font-display uppercase tracking-wider font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {isIngesting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Ingesting...</span>
                      </>
                    ) : (
                      <>
                        <DownloadCloud className="w-3.5 h-3.5" />
                        <span>Self-Host in Library</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{inspectionResult.error || 'Image validation failed.'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
