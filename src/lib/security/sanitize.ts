import sanitize from 'sanitize-html';

export const ALLOWED_TAGS = [
  // Typography & Headings
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'span', 'div',
  'strong', 'b', 'em', 'i', 's', 'strike', 'del',
  'sup', 'sub', 'small',
  'blockquote', 'cite', 'hr', 'br',
  'code', 'pre',
  // Lists & Definitions
  'ul', 'ol', 'li',
  'dl', 'dt', 'dd',
  // Media & Figures
  'figure', 'figcaption',
  'img', 'iframe',
  // Hyperlinks
  'a',
  // Tables
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

export const ALLOWED_ATTR = [
  'class', 'id', 'title', 'dir', 'lang',
  'href', 'target', 'rel',
  'src', 'alt', 'width', 'height', 'loading',
  'allow', 'allowfullscreen', 'frameborder',
  'colspan', 'rowspan', 'scope', 'align', 'cite',
];

export const ALLOWED_IFRAME_HOSTS = [
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
  'vimeo.com',
  'www.npr.org',
  'npr.org',
  'www.theatlantic.com',
  'theatlantic.com',
  'open.spotify.com',
  'bandcamp.com',
  'giscus.app',
  'cusdis.com',
];

/**
 * Sanitizes rich-text HTML against Stored XSS threats.
 * Native SSR-safe string tokenizer (htmlparser2) with zero DOM/jsdom dependencies.
 */
export function sanitizeHtml(dirtyHtml: string | null | undefined): string {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') {
    return '';
  }

  return sanitize(dirtyHtml, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      '*': ALLOWED_ATTR,
    },
    allowedIframeHostnames: ALLOWED_IFRAME_HOSTS,
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data', 'blob'],
    },
    transformTags: {
      a: (tagName, attribs) => {
        const isExternal =
          attribs.href &&
          (attribs.href.startsWith('http://') || attribs.href.startsWith('https://'));
        return {
          tagName: 'a',
          attribs: {
            ...attribs,
            ...(isExternal ? { rel: 'noopener noreferrer' } : {}),
          },
        };
      },
    },
  });
}
