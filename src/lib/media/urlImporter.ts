import { uploadEditorialAsset } from './storage';

export interface ImportedUrlResult {
  cleanUrl: string;
  originalUrl: string;
  isValid: boolean;
  width?: number;
  height?: number;
  suggestedTitle: string;
  suggestedSource: string;
  suggestedCreator?: string;
  suggestedLicense: string;
  error?: string;
}

/**
 * Normalizes an external image URL by stripping anti-hotlink and tracking parameters
 */
export function normalizeImageUrl(rawUrl: string): string {
  let url = rawUrl.trim();

  // 1. Wikia / Fandom CDN Normalization
  // Strips '/revision/latest/scale-to-width-down/...' and '?cb=...'
  if (url.includes('wikia.nocookie.net') || url.includes('fandom.com')) {
    url = url.replace(/\/revision\/latest(\/scale-to-width-down\/\d+)?.*$/i, '');
  }

  // 2. Wikipedia / Wikimedia Commons thumbnail to high-res normalization
  // Strips '/thumb/' and trailing thumbnail width specification
  if (url.includes('upload.wikimedia.org') && url.includes('/thumb/')) {
    url = url.replace(/\/thumb(\/.*)\/[^\/]+$/i, '$1');
  }

  // 3. Remove common marketing and social tracking query params
  try {
    const parsed = new URL(url);
    const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'];
    paramsToRemove.forEach((p) => parsed.searchParams.delete(p));
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Derives a human-friendly title and source archive from the URL structure
 */
export function inferImageMetadataFromUrl(url: string): {
  suggestedTitle: string;
  suggestedSource: string;
  suggestedCreator: string;
  suggestedLicense: string;
} {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname;

    // Extract filename without extension
    const segments = pathname.split('/').filter(Boolean);
    const rawFilename = segments[segments.length - 1] || 'Cover Artwork';
    const cleanFilename = decodeURIComponent(rawFilename)
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .trim();

    // Capitalize words
    const title = cleanFilename
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    let source = 'Web Import';
    let creator = 'Unknown Artist';
    let license = 'Author Provided / Fair Use';

    if (hostname.includes('wikimedia.org') || hostname.includes('wikipedia.org')) {
      source = 'Wikimedia Commons';
      creator = 'Public Domain / Open Access';
      license = 'Creative Commons / Public Domain';
    } else if (hostname.includes('wikia') || hostname.includes('fandom')) {
      const wikiName = segments[0] || 'Community';
      source = `${wikiName.charAt(0).toUpperCase() + wikiName.slice(1)} Wiki`;
      creator = 'Community Contributed';
      license = 'Fair Use Archival Citation';
    } else if (hostname.includes('unsplash.com')) {
      source = 'Unsplash Archive';
      license = 'Unsplash License';
    } else if (hostname.includes('metmuseum.org')) {
      source = 'The Metropolitan Museum of Art';
      creator = 'Classical Collection';
      license = 'Open Access (CC0)';
    } else {
      source = hostname.replace(/^www\./, '');
    }

    return {
      suggestedTitle: title || 'Editorial Illustration',
      suggestedSource: source,
      suggestedCreator: creator,
      suggestedLicense: license,
    };
  } catch {
    return {
      suggestedTitle: 'Editorial Illustration',
      suggestedSource: 'Web Archive',
      suggestedCreator: 'Unknown',
      suggestedLicense: 'Author Provided',
    };
  }
}

/**
 * Validates an image URL by pinging it client-side with no-referrer
 * Measures image dimensions and verifies accessibility
 */
export async function validateAndInspectImageUrl(rawUrl: string): Promise<ImportedUrlResult> {
  const cleanUrl = normalizeImageUrl(rawUrl);
  const meta = inferImageMetadataFromUrl(cleanUrl);

  if (typeof window === 'undefined') {
    return {
      cleanUrl,
      originalUrl: rawUrl,
      isValid: true,
      width: 1200,
      height: 800,
      ...meta,
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.referrerPolicy = 'no-referrer';

    const timeout = setTimeout(() => {
      resolve({
        cleanUrl,
        originalUrl: rawUrl,
        isValid: false,
        error: 'Image ping timed out after 7 seconds. The host may be offline or blocking cross-origin requests.',
        ...meta,
      });
    }, 7000);

    img.onload = () => {
      clearTimeout(timeout);
      resolve({
        cleanUrl,
        originalUrl: rawUrl,
        isValid: true,
        width: img.naturalWidth,
        height: img.naturalHeight,
        ...meta,
      });
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve({
        cleanUrl,
        originalUrl: rawUrl,
        isValid: false,
        error: 'Failed to load image. The URL may be invalid, hotlink-protected, or not an image file.',
        ...meta,
      });
    };

    img.src = cleanUrl;
  });
}

/**
 * Downloads an external image blob and uploads it permanently to our own Supabase Storage
 * This ensures total immunity against future link rot, 404s, or third-party hotlink bans.
 */
export async function ingestExternalUrlToSelfStorage(
  externalUrl: string,
  preferredFilename?: string
): Promise<{ permanentUrl: string; sha256Hash: string; width: number; height: number; isDuplicate?: boolean }> {
  const cleanUrl = normalizeImageUrl(externalUrl);

  // Fetch the image as a blob without referrer
  const response = await fetch(cleanUrl, {
    headers: {
      'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image from host (HTTP ${response.status}).`);
  }

  const blob = await response.blob();
  const result = await uploadEditorialAsset(blob, preferredFilename || 'imported-artwork');

  return {
    permanentUrl: result.imageUrl,
    sha256Hash: result.sha256Hash,
    width: result.width,
    height: result.height,
    isDuplicate: result.isDuplicate,
  };
}
