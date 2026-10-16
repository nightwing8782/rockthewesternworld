# TipTap & Broadsheet Content Sanitization Allowlist
**Project:** Rock The Western World  
**Date:** October 2026  
**Standard:** OWASP HTML Sanitization & Strict Tag Allowlists  

---

## 1. Permitted HTML Tags

Sanitization strips all tags **NOT** explicitly enumerated below:

### Typography & Headings
- `h1`, `h2`, `h3`, `h4`, `h5`, `h6`
- `p`, `span`, `div`
- `strong`, `b`, `em`, `i`, `s`, `strike`, `del`
- `sup`, `sub`, `small`
- `blockquote`, `cite`, `hr`, `br`
- `code`, `pre`

### Lists & Definitions
- `ul`, `ol`, `li`
- `dl`, `dt`, `dd`

### Media & Visuals
- `figure`, `figcaption`
- `img`
- `iframe` (Subject to domain allowlist restrictions below)

### Hyperlinks
- `a`

### Tables (Optional Structured Data)
- `table`, `thead`, `tbody`, `tr`, `th`, `td`

---

## 2. Permitted Attributes

Only safe, non-executable attributes are permitted. Any inline event handlers (`onclick`, `onerror`, `onload`, `onmouseover`) and `javascript:` URIs are strictly stripped.

| Tag | Allowed Attributes |
| :--- | :--- |
| **All Allowed Elements** | `class`, `id`, `title`, `dir`, `lang` |
| `a` | `href`, `title`, `target`, `rel` *(enforces `rel="noopener noreferrer"` for external targets)* |
| `img` | `src`, `alt`, `title`, `width`, `height`, `loading`, `class` |
| `iframe` | `src`, `width`, `height`, `allow`, `allowfullscreen`, `frameborder`, `title`, `loading` |
| `blockquote` | `cite`, `class` |
| `th`, `td` | `colspan`, `rowspan`, `scope`, `align` |

---

## 3. URI Protocol Allowlist

- Permitted protocols for `href` and `src`:
  - `http:`
  - `https:`
  - `mailto:`
  - `tel:`
  - Relative URIs (`/`, `./`, `#`)
- Explicitly Disallowed:
  - `javascript:`
  - `data:` (except safe image inline data for previews)
  - `vbscript:`

---

## 4. Iframe Host Allowlist

To protect against untrusted domain embedding, `<iframe>` elements are only permitted if `src` matches one of the following verified providers:

- YouTube: `https://www.youtube.com/embed/*`, `https://www.youtube-nocookie.com/embed/*`
- Vimeo: `https://player.vimeo.com/video/*`
- NPR: `https://www.npr.org/player/*`
- The Atlantic: `https://www.theatlantic.com/*`
- Spotify: `https://open.spotify.com/embed/*`
- Bandcamp: `https://bandcamp.com/EmbeddedPlayer/*`
- Giscus: `https://giscus.app/*`
- Cusdis: `https://cusdis.com/*`

All other `<iframe>` tags will be transformed to a safe external link or removed.
