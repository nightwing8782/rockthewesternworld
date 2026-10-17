import JSZip from 'jszip';
import { TrophyBook } from '@/types/trophy';
import { isMangaBook, isComicBook } from '@/lib/trophy/sectorClassifier';
import { IMAGE_EXTENSIONS } from './epubImageExtractor';

/**
 * Checks whether a publication should be rendered using the native image spread engine (CbzReader)
 * rather than ePub.js reflowable text engine.
 *
 * Criteria:
 * 1. CBZ / CBR archive formats
 * 2. Medium explicitly set to 'manga' or 'comic'
 * 3. Title / series classifier matches known manga (e.g. Blue Period, A Condition Called Love, RTL)
 * 4. EPUB metadata specifies pre-paginated fixed layout
 * 5. EPUB spine / archive consists primarily of full-page images / SVGs
 */
export async function isImagePublication(fileBlob: Blob, book: TrophyBook): Promise<boolean> {
  // Format check
  if (book.format === 'cbz' || (book.format as any) === 'cbr') {
    return true;
  }

  // Fast path: Database metadata & sector classifier
  if (book.medium === 'manga' || book.medium === 'comic') {
    return true;
  }
  if (isMangaBook(book) || isComicBook(book)) {
    return true;
  }

  // Inspection check for EPUB files
  if (book.format === 'epub') {
    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(fileBlob);

      // Check OPF metadata
      let opfPath = '';
      const containerFile = loadedZip.file('META-INF/container.xml');
      if (containerFile) {
        const cXml = await containerFile.async('text');
        const match = cXml.match(/full-path\s*=\s*["']([^"']+)["']/i);
        if (match) opfPath = match[1].trim();
      }
      if (!opfPath) {
        const opfs = loadedZip.file(/\.opf$/i);
        if (opfs.length > 0) opfPath = opfs[0].name;
      }

      if (opfPath) {
        const opfFile = loadedZip.file(opfPath);
        if (opfFile) {
          const opfXml = await opfFile.async('text');
          const lowerXml = opfXml.toLowerCase();

          // Check fixed-layout / pre-paginated
          if (
            lowerXml.includes('pre-paginated') ||
            lowerXml.includes('rendition:layout-pre-paginated') ||
            lowerXml.includes('layout="pre-paginated"') ||
            lowerXml.includes('layout>pre-paginated') ||
            lowerXml.includes('comic') ||
            lowerXml.includes('manga')
          ) {
            return true;
          }

          // Count images vs text files
          const imageEntries = loadedZip.file(IMAGE_EXTENSIONS);
          const xhtmlEntries = loadedZip.file(/\.(xhtml|html|htm)$/i);

          // If the EPUB contains substantial images and images represent >= 60% of total pages, it's an image book
          if (imageEntries.length >= 8 && imageEntries.length >= xhtmlEntries.length * 0.6) {
            return true;
          }
        }
      }
    } catch (e) {
      console.warn('[detectPublicationType] Error inspecting EPUB archive:', e);
    }
  }

  return false;
}
