import JSZip from 'jszip';
import { BookFormat, ReadingDirection } from '@/types/trophy';

export interface ExtractedInfo {
  title: string;
  series: string;
  issueNumber: number;
  author?: string;
  description?: string;
  readingDirection: ReadingDirection;
  pageCount: number;
  coverBlob?: Blob | null;
}

/**
 * Detect format from filename
 */
export function detectFormat(fileName: string): BookFormat {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'epub') return 'epub';
  if (ext === 'pdf') return 'pdf';
  return 'cbz';
}

/**
 * Un-squish PascalCase and compressed title strings
 */
export function unSquishWords(text: string): string {
  if (!text || typeof text !== 'string') return text;

  // 1. Strip extensions and brackets
  let str = text
    .replace(/\.(cbz|cbr|epub|pdf|zip)$/i, '')
    .replace(/\[.*?\]/g, ' ')
    .replace(/\((?!19\d\d|20\d\d).*?\)/g, ' ')
    .replace(/[-_]+/g, ' ')
    .trim();

  // 2. Split PascalCase / CamelCase (e.g. ASilentVoice -> A Silent Voice)
  str = str.replace(/([a-z])([A-Z])/g, '$1 $2');
  str = str.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');

  // 3. Clean common squished lowercase phrases
  const explicitPhrases: [RegExp, string][] = [
    [/^asilentvoice/i, 'A Silent Voice'],
    [/^atouchofthelovebug/i, 'A Touch of the Love Bug'],
    [/^attheclasspresidentsbeckandcall/i, "At the Class President's Beck and Call"],
    [/^thecompletepeanuts/i, 'The Complete Peanuts'],
  ];

  for (const [pattern, replacement] of explicitPhrases) {
    if (pattern.test(str)) {
      str = str.replace(pattern, replacement);
      break;
    }
  }

  // 4. Format to clean Title Case
  const lowercase = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'of', 'in', 'with', 'vs'];
  str = str
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      const wLower = word.toLowerCase();
      if (index > 0 && lowercase.includes(wLower)) return wLower;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');

  return str;
}

/**
 * Clean filename into structured Series, Issue Number, and Title
 */
export function parseFilenameHeuristics(filename: string): {
  cleanTitle: string;
  series: string;
  issueNumber: number;
} {
  // Strip file extension
  let name = filename.replace(/\.(cbz|cbr|zip|epub|pdf)$/i, '');

  // Strip scanner / release groups in brackets or parentheses like [Digital], (2021) (Zone-Empire)
  name = name.replace(/\[.*?\]/g, ' ').replace(/\((?!19\d\d|20\d\d).*?\)/g, ' ');

  // Extract issue number (e.g. #01, #12, v01, 001)
  let issueNumber = 1;
  const issueMatch = name.match(/#(\d+(?:\.\d+)?)/) || name.match(/\bv(?:ol)?\.?\s*(\d+)/i) || name.match(/\s(\d{1,4})(?:\s|$)/);
  if (issueMatch && issueMatch[1]) {
    const parsed = parseFloat(issueMatch[1]);
    if (!isNaN(parsed) && parsed < 2000) {
      issueNumber = parsed;
    }
  }

  // Split on hyphen or issue markers
  let series = name;
  if (name.includes(' - ')) {
    const parts = name.split(' - ');
    series = parts[0].trim();
  } else if (name.includes('#')) {
    series = name.split('#')[0].trim();
  }

  // Clean trailing punctuation
  series = unSquishWords(series.replace(/[-_#]+$/, '').trim());
  const cleanTitle = unSquishWords(name);

  return {
    cleanTitle: cleanTitle || filename,
    series: series || cleanTitle || 'Standalone',
    issueNumber: issueNumber || 1,
  };
}

/**
 * Extract cover & metadata from CBZ archive
 */
async function extractFromCbz(file: File | Blob, filename: string): Promise<ExtractedInfo> {
  const parsed = parseFilenameHeuristics(filename);
  let coverBlob: Blob | null = null;
  let pageCount = 0;
  let author: string | undefined;
  let description: string | undefined;
  let readingDirection: ReadingDirection = 'ltr';

  try {
    const zip = await JSZip.loadAsync(file);
    const imageExtensions = /\.(jpg|jpeg|png|webp|gif|bmp|avif)$/i;

    // Filter and sort image entries
    const imageEntries = Object.keys(zip.files)
      .filter((path) => imageExtensions.test(path) && !path.startsWith('__MACOSX/'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    pageCount = imageEntries.length;

    // Extract first image as cover
    if (imageEntries.length > 0) {
      const firstImage = zip.files[imageEntries[0]];
      const arrayBuffer = await firstImage.async('arraybuffer');
      const ext = imageEntries[0].split('.').pop()?.toLowerCase();
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      coverBlob = new Blob([arrayBuffer], { type: mime });
    }

    // Check for ComicInfo.xml
    const comicInfoKey = Object.keys(zip.files).find((k) => /comicinfo\.xml$/i.test(k));
    if (comicInfoKey) {
      const xmlText = await zip.files[comicInfoKey].async('text');
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'application/xml');

      const seriesTag = doc.querySelector('Series')?.textContent;
      const numberTag = doc.querySelector('Number')?.textContent;
      const writerTag = doc.querySelector('Writer')?.textContent;
      const summaryTag = doc.querySelector('Summary')?.textContent;
      const mangaTag = doc.querySelector('Manga')?.textContent;

      if (seriesTag) parsed.series = seriesTag.trim();
      if (numberTag && !isNaN(parseFloat(numberTag))) parsed.issueNumber = parseFloat(numberTag);
      if (writerTag) author = writerTag.trim();
      if (summaryTag) description = summaryTag.trim();
      if (mangaTag && mangaTag.toLowerCase() === 'yesandrighttoleft') {
        readingDirection = 'rtl';
      }
    }
  } catch (err) {
    console.warn('[Extractor] Error reading CBZ:', err);
  }

  return {
    title: parsed.cleanTitle,
    series: parsed.series,
    issueNumber: parsed.issueNumber,
    author,
    description,
    readingDirection,
    pageCount,
    coverBlob,
  };
}

/**
 * Extract cover & metadata from EPUB
 */
async function extractFromEpub(file: File | Blob, filename: string): Promise<ExtractedInfo> {
  const parsed = parseFilenameHeuristics(filename);
  let coverBlob: Blob | null = null;
  let pageCount = 0;
  let author: string | undefined;
  let description: string | undefined;

  try {
    const zip = await JSZip.loadAsync(file);

    // Look for container.xml to locate rootfile (OPF)
    const containerFile = zip.file('META-INF/container.xml');
    if (containerFile) {
      const containerXml = await containerFile.async('text');
      const parser = new DOMParser();
      const doc = parser.parseFromString(containerXml, 'application/xml');
      const opfPath = doc.querySelector('rootfile')?.getAttribute('full-path');

      if (opfPath && zip.file(opfPath)) {
        const opfXml = await zip.file(opfPath)!.async('text');
        const opfDoc = parser.parseFromString(opfXml, 'application/xml');

        const titleTag = opfDoc.querySelector('title, dc\\:title')?.textContent;
        const creatorTag = opfDoc.querySelector('creator, dc\\:creator')?.textContent;
        const descTag = opfDoc.querySelector('description, dc\\:description')?.textContent;

        if (titleTag) parsed.cleanTitle = titleTag.trim();
        if (creatorTag) author = creatorTag.trim();
        if (descTag) description = descTag.trim();

        // Try to locate cover image in manifest
        const coverItem = opfDoc.querySelector('item[properties~="cover-image"], item#cover-image, item#cover, item[id*="cover"]');
        if (coverItem) {
          const href = coverItem.getAttribute('href');
          if (href) {
            // Resolve relative path from opf folder
            const opfFolder = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
            const resolvedPath = opfFolder + href.replace(/^\.\//, '');
            const coverEntry = zip.file(resolvedPath) || zip.file(href);
            if (coverEntry) {
              const buf = await coverEntry.async('arraybuffer');
              const ext = href.split('.').pop()?.toLowerCase();
              const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
              coverBlob = new Blob([buf], { type: mime });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Extractor] Error reading EPUB:', err);
  }

  return {
    title: parsed.cleanTitle,
    series: parsed.series,
    issueNumber: parsed.issueNumber,
    author,
    description,
    readingDirection: 'ltr',
    pageCount: pageCount || 100,
    coverBlob,
  };
}

/**
 * Extract cover & metadata from PDF
 */
async function extractFromPdf(file: File | Blob, filename: string): Promise<ExtractedInfo> {
  const parsed = parseFilenameHeuristics(filename);
  let coverBlob: Blob | null = null;
  let pageCount = 0;

  try {
    if (typeof window !== 'undefined') {
      const pdfjsLib = await import('pdfjs-dist');
      // Set worker
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      pageCount = pdf.numPages;

      // Render page 1 to canvas for thumbnail
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        await (page as any).render({ canvasContext: ctx, viewport, canvas } as any).promise;
        coverBlob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85)
        );
      }
    }
  } catch (err) {
    console.warn('[Extractor] Error reading PDF thumbnail:', err);
  }

  return {
    title: parsed.cleanTitle,
    series: parsed.series,
    issueNumber: parsed.issueNumber,
    readingDirection: 'ltr',
    pageCount: pageCount || 1,
    coverBlob,
  };
}

/**
 * Universal Ingestion Extractor
 */
export async function extractBookInfo(file: File, filename = file.name): Promise<ExtractedInfo> {
  const format = detectFormat(filename);
  if (format === 'cbz') return extractFromCbz(file, filename);
  if (format === 'epub') return extractFromEpub(file, filename);
  if (format === 'pdf') return extractFromPdf(file, filename);
  return extractFromCbz(file, filename);
}
