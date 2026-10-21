'use client';

import { useState, useRef, useEffect } from 'react';
import { EntryMetadata } from '@/types/database';
import { uploadEditorialAsset, UploadedAssetResult } from '@/lib/media/storage';
import { saveMediaAsset } from '@/lib/media/libraryService';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Sparkles, Copy } from 'lucide-react';

interface DirectUploadTabProps {
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
  'Nature',
  'Woodcuts',
  'Fine Art',
  'General',
];

export default function DirectUploadTab({
  metadata,
  onMetadataChange,
  onAssetSaved,
}: DirectUploadTabProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Form fields after file drop/paste
  const [stagedFile, setStagedFile] = useState<File | Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [creator, setCreator] = useState('');
  const [source, setSource] = useState('Author Upload');
  const [license, setLicense] = useState('Author Provided / Fair Use');
  const [category, setCategory] = useState(metadata.category || 'General');
  const [tags, setTags] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Global Clipboard Paste Listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            handleProcessFile(file, 'Pasted Screenshot');
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleProcessFile = (file: File | Blob, defaultName?: string) => {
    setErrorMessage(null);
    setDuplicateWarning(null);

    // Validate size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('File size exceeds 15MB limit. Please choose a smaller image.');
      return;
    }

    setStagedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Auto-fill suggested title
    const rawName = (file as File).name || defaultName || 'Editorial Photograph';
    const cleanName = rawName.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
    setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Only image files (JPEG, PNG, WebP) are supported.');
        return;
      }
      handleProcessFile(file);
    }
  };

  const handleConfirmUpload = async () => {
    if (!stagedFile) return;

    setIsUploading(true);
    setUploadProgress('Compressing & calculating SHA-256 hash...');
    setErrorMessage(null);

    try {
      // 1. Upload to Supabase Storage with SHA-256 deduplication
      setUploadProgress('Uploading to Supabase Storage...');
      const uploadResult: UploadedAssetResult = await uploadEditorialAsset(
        stagedFile,
        title || 'editorial-asset'
      );

      if (uploadResult.isDuplicate) {
        setDuplicateWarning('Duplicate detected: This exact image already exists in your library. Reusing existing asset!');
      }

      // 2. Insert into editorial_media library
      setUploadProgress('Cataloging in Media Library...');
      const savedMedia = await saveMediaAsset({
        title: title.trim() || 'Editorial Artwork',
        imageUrl: uploadResult.imageUrl,
        thumbnailUrl: uploadResult.thumbnailUrl,
        storagePath: uploadResult.storagePath,
        sha256Hash: uploadResult.sha256Hash,
        width: uploadResult.width,
        height: uploadResult.height,
        fileSizeBytes: uploadResult.fileSizeBytes,
        mimeType: uploadResult.mimeType,
        sourceType: 'upload',
        creator: creator.trim() || 'Author Provided',
        source: source.trim() || 'Editorial Studio',
        license: license.trim() || 'Author Provided',
        category: category.trim() || 'General',
        tags: tags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
      });

      // 3. Bind to current article metadata
      onMetadataChange({
        cover_type: 'hero_artwork',
        coverUrl: uploadResult.imageUrl,
        cover_image_url: uploadResult.imageUrl,
        credit_title: title.trim() || 'Editorial Artwork',
        credit_creator: creator.trim() || 'Author Provided',
        credit_source: source.trim() || 'Editorial Studio',
        credit_license: license.trim() || 'Author Provided',
        imageCaption: title.trim(),
        imageCredit: creator.trim() || 'Author Provided',
        editorial_media_id: savedMedia?.id,
      });

      if (onAssetSaved) onAssetSaved();

      // Reset staging state
      setStagedFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="space-y-4 font-serif">
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {duplicateWarning && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{duplicateWarning}</span>
        </div>
      )}

      {/* DROPZONE */}
      {!stagedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-[#1E40AF] bg-[#F2ECE1]/80 scale-[1.01]'
              : 'border-[#DDD5C7] hover:border-[#1E40AF] bg-[#FAF8F5]'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleProcessFile(e.target.files[0]);
              }
            }}
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
          />

          <div className="w-12 h-12 mx-auto rounded-full bg-[#F2ECE1] border border-[#DDD5C7] flex items-center justify-center text-[#1E40AF] mb-3 shadow-2xs">
            <UploadCloud className="w-6 h-6" />
          </div>

          <h4 className="font-display font-bold text-sm text-[#1C1917] uppercase tracking-wider mb-1">
            Drop Image File Here, or Click to Browse
          </h4>
          <p className="text-xs text-[#66615C] max-w-sm mx-auto mb-3">
            PNG, JPEG, WebP up to 15MB. Automatically converted to high-quality WebP.
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F2ECE1] border border-[#DDD5C7] rounded text-[11px] font-sans text-[#78716C]">
            <Copy className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Or paste any screenshot directly with <strong>Ctrl+V</strong></span>
          </div>
        </div>
      ) : (
        /* STAGED IMAGE REVIEW & ATTRIBUTION FORM */
        <div className="p-4 bg-[#FAF8F5] border border-[#DDD5C7] rounded space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {previewUrl && (
              <div className="w-32 h-24 overflow-hidden border border-[#DDD5C7] rounded bg-[#F2ECE1] shrink-0">
                <img
                  src={previewUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-display uppercase tracking-widest font-bold text-[#1E40AF] block mb-1">
                Staged for Editorial Ingestion
              </span>
              <h4 className="font-display font-bold text-sm text-[#1C1917] truncate">
                {title || 'Untitled Image'}
              </h4>
              <p className="text-xs text-[#66615C]">
                Ready to be converted to WebP and saved in Supabase Storage.
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-[#DDD5C7]">
            <div>
              <label className="block text-[10px] font-display uppercase tracking-wider font-bold text-[#66615C] mb-1">
                Artwork Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Marina City at Sunset"
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
                placeholder="e.g. Neal Kharawala"
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
                placeholder="e.g. Americana, Literature, Jazz..."
                className="w-full px-2.5 py-1.5 bg-white border border-[#DDD5C7] rounded text-xs text-[#1C1917]"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {CATEGORY_SUGGESTIONS.slice(0, 5).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className="text-[9px] px-1.5 py-0.5 bg-[#F2ECE1] hover:bg-[#DDD5C7] text-[#44403C] rounded cursor-pointer"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-display uppercase tracking-wider font-bold text-[#66615C] mb-1">
                License / Rights
              </label>
              <input
                type="text"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                placeholder="e.g. Author Provided, Fair Use"
                className="w-full px-2.5 py-1.5 bg-white border border-[#DDD5C7] rounded text-xs text-[#1C1917]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DDD5C7]">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => {
                setStagedFile(null);
                setPreviewUrl(null);
              }}
              className="px-3 py-1.5 bg-white hover:bg-[#F2ECE1] border border-[#DDD5C7] text-[#1C1917] rounded text-xs font-display uppercase tracking-wider font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isUploading || !title.trim()}
              onClick={handleConfirmUpload}
              className="px-4 py-1.5 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] rounded text-xs font-display uppercase tracking-wider font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{uploadProgress || 'Uploading...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Attach &amp; Save to Library</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
