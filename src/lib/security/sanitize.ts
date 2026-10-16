import DOMPurify from 'isomorphic-dompurify';

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

const ALLOWED_IFRAME_HOSTS = [
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
 * Validates whether an iframe src URL belongs to a verified embedding provider.
 */
function isAllowedIframeSrc(src: string): boolean {
  try {
    const url = new URL(src);
    return ALLOWED_IFRAME_HOSTS.some(
      (host) => url.hostname === host || url.hostname.endsWith('.' + host)
    );
  } catch {
    return false;
  }
}

/**
 * Configure DOMPurify hooks once (safe for both SSR and client execution).
 */
if (typeof DOMPurify.addHook === 'function') {
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    // Validate iframe elements against host allowlist
    if (data.tagName === 'iframe' && 'getAttribute' in node) {
      const el = node as Element;
      const src = el.getAttribute('src') || '';
      if (!isAllowedIframeSrc(src)) {
        if (typeof el.remove === 'function') {
          el.remove();
        } else if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      }
    }
  });

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Enforce noopener noreferrer on links with target="_blank"
    if (node.nodeName === 'A' && 'getAttribute' in node) {
      const el = node as Element;
      const href = el.getAttribute('href') || '';
      if (href.startsWith('http://') || href.startsWith('https://')) {
        el.setAttribute('rel', 'noopener noreferrer');
      }
    }
  });
}

/**
 * Sanitizes rich-text HTML against Stored XSS threats.
 */
export function sanitizeHtml(dirtyHtml: string | null | undefined): string {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ADD_ATTR: ['target'],
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM: false,
  });
}
