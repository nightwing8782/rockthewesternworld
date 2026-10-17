import JSZip from 'jszip';

export const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|svg|avif|bmp)$/i;

/**
 * Resolves a relative path against a base directory.
 * E.g. baseDir="OEBPS/xhtml", relPath="../images/p001.jpg" -> "OEBPS/images/p001.jpg"
 */
function resolveRelativePath(baseDir: string, relativePath: string): string {
  const combined = baseDir ? `${baseDir}/${relativePath}` : relativePath;
  const parts = combined.replace(/\\/g, '/').split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      stack.pop();
    } else {
      stack.push(part);
    }
  }
  return stack.join('/');
}

/**
 * Extracts all page image entries from an EPUB archive in exact publication spine reading order.
 */
export async function extractEpubImageEntries(
  zip: JSZip
): Promise<{ name: string; file: JSZip.JSZipObject }[]> {
  try {
    // 1. Locate rootfile OPF path from META-INF/container.xml
    let opfPath = '';
    const containerFile = zip.file('META-INF/container.xml');
    if (containerFile) {
      const containerXml = await containerFile.async('text');
      const match = containerXml.match(/full-path\s*=\s*["']([^"']+)["']/i);
      if (match) {
        opfPath = match[1].trim();
      }
    }

    // Fallback: search for any .opf file in archive
    if (!opfPath) {
      const opfFiles = zip.file(/\.opf$/i);
      if (opfFiles.length > 0) {
        opfPath = opfFiles[0].name;
      }
    }

    if (opfPath) {
      const opfFile = zip.file(opfPath);
      if (opfFile) {
        const opfXml = await opfFile.async('text');
        const parser = new DOMParser();
        const opfDoc = parser.parseFromString(opfXml, 'application/xml');

        const lastSlash = opfPath.lastIndexOf('/');
        const opfDir = lastSlash >= 0 ? opfPath.substring(0, lastSlash) : '';

        // Map manifest: id -> { href, mediaType }
        const manifestMap = new Map<string, { href: string; mediaType: string }>();
        const itemNodes = opfDoc.querySelectorAll('manifest > item');
        itemNodes.forEach((node) => {
          const id = node.getAttribute('id');
          const href = node.getAttribute('href');
          const mediaType = (node.getAttribute('media-type') || '').toLowerCase();
          if (id && href) {
            const cleanHref = href.split('?')[0].split('#')[0];
            manifestMap.set(id, { href: cleanHref, mediaType });
          }
        });

        // Walk spine in exact publication reading order
        const itemrefs = opfDoc.querySelectorAll('spine > itemref');
        const spineEntries: { name: string; file: JSZip.JSZipObject }[] = [];

        for (let i = 0; i < itemrefs.length; i++) {
          const idref = itemrefs[i].getAttribute('idref');
          if (!idref || !manifestMap.has(idref)) continue;

          const item = manifestMap.get(idref)!;
          const fullPath = resolveRelativePath(opfDir, item.href);

          // Direct image item in spine
          if (item.mediaType.startsWith('image/')) {
            const file = zip.file(fullPath);
            if (file) {
              spineEntries.push({ name: fullPath, file });
              continue;
            }
          }

          // XHTML page wrapping an image/SVG
          const xhtmlFile = zip.file(fullPath);
          if (xhtmlFile) {
            const xhtmlText = await xhtmlFile.async('text');
            const xhtmlDoc = parser.parseFromString(xhtmlText, 'application/xhtml+xml');
            const lastXhtmlSlash = fullPath.lastIndexOf('/');
            const xhtmlDir = lastXhtmlSlash >= 0 ? fullPath.substring(0, lastXhtmlSlash) : '';

            // Look for SVG image: <image xlink:href="..."> or <image href="...">
            let imgSrc = '';
            const svgImg = xhtmlDoc.querySelector('svg image, image');
            if (svgImg) {
              imgSrc = svgImg.getAttribute('xlink:href') || svgImg.getAttribute('href') || '';
            }
            if (!imgSrc) {
              const htmlImg = xhtmlDoc.querySelector('img');
              if (htmlImg) {
                imgSrc = htmlImg.getAttribute('src') || '';
              }
            }

            if (imgSrc) {
              const cleanSrc = imgSrc.split('?')[0].split('#')[0];
              const fullImgPath = resolveRelativePath(xhtmlDir, cleanSrc);
              const imgFile = zip.file(fullImgPath);
              if (imgFile) {
                spineEntries.push({ name: fullImgPath, file: imgFile });
              }
            }
          }
        }

        if (spineEntries.length > 0) {
          return spineEntries;
        }
      }
    }
  } catch (err) {
    console.warn('[extractEpubImageEntries] Error parsing EPUB manifest/spine:', err);
  }

  // Fallback: collect all image files naturally sorted
  const imageEntries: { name: string; file: JSZip.JSZipObject }[] = [];
  zip.forEach((relativePath, file) => {
    const filename = relativePath.split('/').pop() || '';
    if (
      !file.dir &&
      IMAGE_EXTENSIONS.test(relativePath) &&
      !relativePath.includes('__MACOSX') &&
      !filename.startsWith('.') &&
      !filename.toLowerCase().includes('thumbs.db')
    ) {
      imageEntries.push({ name: relativePath, file });
    }
  });

  imageEntries.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );

  return imageEntries;
}
