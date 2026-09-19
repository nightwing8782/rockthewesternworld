import { getPresignedDownloadUrl } from './s3';

// In-memory cache for presigned cover URLs (7-day validity)
const coverUrlCache = new Map<string, string>();

/**
 * Resolves a usable display URL for a book's cover image.
 * 1. Checks if a public R2 URL (e.g. r2.dev or custom domain) is configured.
 * 2. Checks if cover_url is already a valid public or signed URL.
 * 3. Falls back to generating a presigned GET URL on the client using AWS SDK.
 */
export async function resolveCoverUrl(book: {
  cover_url?: string | null;
  cover_key?: string | null;
  file_key?: string | null;
}): Promise<string | null> {
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  // 1. If public R2 domain is configured (e.g. https://pub-xxx.r2.dev or https://trophy.yourdomain.com)
  if (publicBase && book.cover_key) {
    const cleanBase = publicBase.replace(/\/$/, '');
    const cleanKey = book.cover_key.replace(/^\//, '');
    return `${cleanBase}/${cleanKey}`;
  }

  // 2. If cover_url is already a signed URL with active token
  if (
    book.cover_url &&
    (book.cover_url.includes('X-Amz-Signature') ||
      book.cover_url.includes('r2.dev') ||
      book.cover_url.startsWith('blob:') ||
      book.cover_url.startsWith('data:'))
  ) {
    return book.cover_url;
  }

  // 3. If cover_key exists, generate a 7-day presigned download URL
  if (book.cover_key) {
    if (coverUrlCache.has(book.cover_key)) {
      return coverUrlCache.get(book.cover_key)!;
    }

    try {
      const signed = await getPresignedDownloadUrl(book.cover_key, 604800); // 7 days
      coverUrlCache.set(book.cover_key, signed);
      return signed;
    } catch (e) {
      console.warn('[CoverResolver] Failed to presign cover_key:', book.cover_key, e);
    }
  }

  return null;
}
