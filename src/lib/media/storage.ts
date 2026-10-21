import { createClient } from '@/lib/supabase/client';
import { EditorialMedia } from '@/types/database';

export interface UploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export interface UploadedAssetResult {
  imageUrl: string;
  thumbnailUrl: string;
  storagePath: string;
  sha256Hash: string;
  width: number;
  height: number;
  fileSizeBytes: number;
  mimeType: string;
  isDuplicate?: boolean;
  existingAsset?: EditorialMedia;
}

/**
 * Computes SHA-256 hex digest of a File or Blob in the browser
 */
export async function computeSha256(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Resizes an image file to broadsheet web-optimized specifications
 * Keeps aspect ratio intact, caps max dimension to 2000px, outputs high-quality WebP.
 */
export async function optimizeImage(
  file: File | Blob,
  options: UploadOptions = {}
): Promise<{ blob: Blob; width: number; height: number; mimeType: string }> {
  const { maxWidth = 2000, maxHeight = 2000, quality = 0.88 } = options;

  return new Promise((resolve, reject) => {
    // If running in SSR or environment without window/Image
    if (typeof window === 'undefined') {
      return resolve({
        blob: file,
        width: 1200,
        height: 800,
        mimeType: file.type || 'image/webp',
      });
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      // Calculate constrained dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve({ blob: file, width: img.width, height: img.height, mimeType: file.type || 'image/webp' });
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to WebP format if supported, fallback to image/jpeg
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve({ blob: file, width, height, mimeType: file.type || 'image/jpeg' });
          }
          resolve({
            blob,
            width,
            height,
            mimeType: 'image/webp',
          });
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to decode image file.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Checks if an asset with the given SHA-256 hash already exists in editorial_media
 */
export async function checkDuplicateMedia(sha256Hash: string): Promise<EditorialMedia | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('editorial_media')
      .select('*')
      .eq('sha256_hash', sha256Hash)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data as EditorialMedia;
    }
  } catch (e) {
    console.warn('[Storage] Duplicate check warning:', e);
  }
  return null;
}

/**
 * Ingests an image (File or Blob) into Supabase Storage 'editorial-media' bucket
 * Checks for SHA-256 duplicate first. If unique, compresses to WebP and uploads.
 */
export async function uploadEditorialAsset(
  rawFile: File | Blob,
  customFilename?: string
): Promise<UploadedAssetResult> {
  // 1. Calculate SHA-256 hash on raw file
  const hash = await computeSha256(rawFile);

  // 2. Duplicate Detection: Check if asset already exists in library
  const existing = await checkDuplicateMedia(hash);
  if (existing) {
    return {
      imageUrl: existing.image_url,
      thumbnailUrl: existing.thumbnail_url || existing.image_url,
      storagePath: existing.storage_path,
      sha256Hash: hash,
      width: existing.width || 1200,
      height: existing.height || 800,
      fileSizeBytes: existing.file_size_bytes || rawFile.size,
      mimeType: existing.mime_type,
      isDuplicate: true,
      existingAsset: existing,
    };
  }

  // 3. Optimize image (convert to WebP, resize if massive)
  const { blob: optimizedBlob, width, height, mimeType } = await optimizeImage(rawFile);

  // 4. Determine clean unique storage path in 'editorial-media' bucket
  const yearMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-10"
  const fileId = crypto.randomUUID().slice(0, 8);
  const cleanBase = (customFilename || 'artwork')
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-');
  const storagePath = `${yearMonth}/${cleanBase}-${fileId}.webp`;

  // 5. Upload to Supabase Storage
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from('editorial-media')
    .upload(storagePath, optimizedBlob, {
      contentType: mimeType,
      upsert: true,
      cacheControl: '31536000', // 1 year cache
    });

  if (error) {
    throw new Error(`Upload to Supabase Storage failed: ${error.message}`);
  }

  // 6. Get Public URL
  const { data: urlData } = supabase.storage
    .from('editorial-media')
    .getPublicUrl(data.path);

  const publicUrl = urlData.publicUrl;

  return {
    imageUrl: publicUrl,
    thumbnailUrl: publicUrl,
    storagePath: data.path,
    sha256Hash: hash,
    width,
    height,
    fileSizeBytes: optimizedBlob.size,
    mimeType,
    isDuplicate: false,
  };
}
