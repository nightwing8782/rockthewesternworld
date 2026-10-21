import { createClient } from '@/lib/supabase/client';
import { EditorialMedia, MediaSourceType } from '@/types/database';

export interface MediaFilterOptions {
  category?: string;
  sourceType?: MediaSourceType;
  searchQuery?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'title' | 'usage';
}

export interface SaveMediaInput {
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  storagePath: string;
  sha256Hash?: string;
  width?: number;
  height?: number;
  fileSizeBytes?: number;
  mimeType?: string;
  sourceType: MediaSourceType;
  creator?: string;
  source: string;
  sourceUrl?: string;
  license: string;
  attributionText?: string;
  category?: string;
  tags?: string[];
  moods?: string[];
}

/**
 * Queries the Editorial Media library with flexible free-text category and keyword search
 */
export async function getEditorialMediaList(options: MediaFilterOptions = {}): Promise<{
  assets: EditorialMedia[];
  total: number;
}> {
  try {
    const supabase = createClient();
    let query = supabase.from('editorial_media').select('*', { count: 'exact' });

    if (options.category && options.category.toLowerCase() !== 'all') {
      query = query.ilike('category', `%${options.category}%`);
    }

    if (options.sourceType) {
      query = query.eq('source_type', options.sourceType);
    }

    if (options.searchQuery && options.searchQuery.trim()) {
      const q = options.searchQuery.trim();
      query = query.or(
        `title.ilike.%${q}%,creator.ilike.%${q}%,source.ilike.%${q}%,category.ilike.%${q}%`
      );
    }

    const sortColumn = options.sortBy === 'title' ? 'title' : 'created_at';
    const ascending = options.sortBy === 'title';
    query = query.order(sortColumn, { ascending });

    if (options.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, count, error } = await query;

    if (error) {
      console.warn('[LibraryService] Query warning (table may not be migrated yet):', error.message);
      return { assets: [], total: 0 };
    }

    return {
      assets: (data as EditorialMedia[]) || [],
      total: count || 0,
    };
  } catch (e) {
    console.warn('[LibraryService] Failed to fetch media list:', e);
    return { assets: [], total: 0 };
  }
}

/**
 * Saves a new or imported asset into the permanent editorial_media table
 */
export async function saveMediaAsset(input: SaveMediaInput): Promise<EditorialMedia | null> {
  try {
    const supabase = createClient();

    // Check duplicate by sha256_hash if present
    if (input.sha256Hash) {
      const { data: existing } = await supabase
        .from('editorial_media')
        .select('*')
        .eq('sha256_hash', input.sha256Hash)
        .limit(1)
        .maybeSingle();

      if (existing) {
        return existing as EditorialMedia;
      }
    }

    const newRecord = {
      title: input.title.trim() || 'Untitled Artwork',
      description: input.description?.trim() || null,
      image_url: input.imageUrl,
      thumbnail_url: input.thumbnailUrl || input.imageUrl,
      storage_path: input.storagePath,
      sha256_hash: input.sha256Hash || null,
      width: input.width || null,
      height: input.height || null,
      file_size_bytes: input.fileSizeBytes || null,
      mime_type: input.mimeType || 'image/webp',
      source_type: input.sourceType,
      creator: input.creator?.trim() || null,
      source: input.source?.trim() || 'Editorial Studio',
      source_url: input.sourceUrl?.trim() || null,
      license: input.license?.trim() || 'Author Provided',
      attribution_text: input.attributionText?.trim() || null,
      category: input.category?.trim() || 'General',
      tags: input.tags || [],
      moods: input.moods || [],
      is_favorite: false,
    };

    const { data, error } = await supabase
      .from('editorial_media')
      .insert(newRecord)
      .select('*')
      .single();

    if (error) {
      console.warn('[LibraryService] Insert warning:', error.message);
      return null;
    }

    return data as EditorialMedia;
  } catch (e) {
    console.warn('[LibraryService] Failed to save media asset:', e);
    return null;
  }
}

/**
 * Links an entry to a media asset in the entry_media junction table
 */
export async function linkEntryToMedia(
  entryId: string,
  mediaId: string,
  role: 'cover' | 'inline' | 'social_card' = 'cover'
): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from('entry_media').upsert(
      {
        entry_id: entryId,
        media_id: mediaId,
        role,
      },
      { onConflict: 'entry_id,media_id,role' }
    );

    return !error;
  } catch (e) {
    console.warn('[LibraryService] Link entry_media warning:', e);
    return false;
  }
}

/**
 * Unlinks an entry from a media asset
 */
export async function unlinkEntryFromMedia(
  entryId: string,
  role: 'cover' | 'inline' | 'social_card' = 'cover'
): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('entry_media')
      .delete()
      .eq('entry_id', entryId)
      .eq('role', role);

    return !error;
  } catch (e) {
    console.warn('[LibraryService] Unlink entry_media warning:', e);
    return false;
  }
}

/**
 * Fetches usage count and referring articles for a given media asset
 */
export async function getMediaUsage(mediaId: string): Promise<{
  count: number;
  entries: { id: string; title: string; slug: string; role: string }[];
}> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('entry_media')
      .select('role, entries(id, title, slug)')
      .eq('media_id', mediaId);

    if (error || !data) return { count: 0, entries: [] };

    const entries = data.map((d: any) => ({
      id: d.entries?.id || '',
      title: d.entries?.title || 'Untitled Entry',
      slug: d.entries?.slug || '',
      role: d.role,
    }));

    return {
      count: entries.length,
      entries,
    };
  } catch (e) {
    return { count: 0, entries: [] };
  }
}

// Aliases for seamless developer ergonomics
export const saveToEditorialMedia = saveMediaAsset;
export const linkEntryMedia = linkEntryToMedia;

