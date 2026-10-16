# HTML Render Surface Security Audit
**Project:** Rock The Western World  
**Date:** October 2026  
**Status:** Audit Completed • Pending Remediation  

---

## 1. Executive Summary

A comprehensive scan of the Rock The Western World codebase was conducted to identify every surface where raw HTML or external markup is rendered. The platform ingests content from two primary sources:
1. **Modern Editorial Studio / TipTap:** Dynamic author input stored in Supabase `public.entries.body_html`.
2. **Historical WordPress Archive:** 700+ imported historical essays and reviews in `public/archive/imported-entries.json`.

Without strict sanitization, any stored script, malicious attribute (`onerror`, `onload`), or cross-site script in historical or user content will execute in the reader's browser, leading to **Stored Cross-Site Scripting (Stored XSS)** and session token theft.

---

## 2. Inventory of HTML Render Surfaces

| File & Line Number | Component / Context | Content Rendered | Current Sanitization | Risk Severity |
| :--- | :--- | :--- | :--- | :--- |
| `src/app/[slug]/page.tsx:444` | Article Reader Body (`.prose-broadsheet`) | `entry.body_html` (Supabase + WP Archive) | **NONE** (`dangerouslySetInnerHTML`) | **CRITICAL** |
| `src/app/not-found.tsx:98` | 404 Fallback Reader | `body_html` fallback | **NONE** (`dangerouslySetInnerHTML`) | **HIGH** |
| `src/app/[slug]/page.tsx:243` | JSON-LD Structured Data Script | `JSON.stringify(jsonLd)` | Encoded via JSON.stringify | **LOW** (Injection via unescaped `</script>`) |
| `src/app/layout.tsx:67` | Root Periodical JSON-LD Script | `JSON.stringify(rootJsonLd)` | Encoded via JSON.stringify | **LOW** (Injection via unescaped `</script>`) |
| `src/components/article/CommentsSection.tsx:26` | Discussion Mount Container | Clears `innerHTML = ''` | Safe DOM reset | **INFORMATIONAL** |
| `src/lib/dispatch.ts:46-200` | Newsletter Dispatch Template | Generated HTML email | Plaintext interpolation | **MEDIUM** |

---

## 3. Analysis of Rendered Markup & Threat Vectors

### A. Article Reader (`src/app/[slug]/page.tsx`)
* **Vulnerability:** Line 444:
  ```tsx
  <div
    className="prose-broadsheet"
    dangerouslySetInnerHTML={{ __html: body_html || '' }}
  />
  ```
* **Threat Profile:**
  - **Script Execution:** `<script>alert(1)</script>` or `<img src=x onerror=alert(document.cookie)>` executes directly within the origin of `rockthewesternworld.com`.
  - **Credential & Session Theft:** Attacker can read active Supabase session tokens from cookies or `localStorage` and transmit them to an exfiltration server.
  - **Defacement & Phishing:** Malicious markup can inject fake login forms or misleading redirects.

### B. WordPress Archive Elements (`imported-entries.json`)
The static archive contains 27 distinct HTML tags:
`a, b, blockquote, br, cite, code, dd, div, dl, em, figcaption, figure, h1, h2, h3, h4, h5, i, iframe, img, li, ol, p, span, strong, sup, ul`.
* **Specific Embedded Iframe Providers:**
  - YouTube: `www.youtube.com`
  - Vimeo: `player.vimeo.com`
  - NPR: `www.npr.org`
  - The Atlantic: `www.theatlantic.com`
  - Facebook: `www.facebook.com`

Any unvetted `<iframe>` tags or arbitrary domains could hijack reader navigation or download malware if not restricted to verified embed providers.

---

## 4. Remediation Plan

1. Install `isomorphic-dompurify` (or `dompurify` + `@types/dompurify`) to enable deterministic server and client sanitization.
2. Create a centralized HTML sanitization utility: `src/lib/security/sanitize.ts`.
3. Wrap all `body_html` injections in `sanitizeHtml(...)` using the strict allowlist specified in `TIPTAP_ALLOWLIST.md`.
4. Enforce `target="_blank"` and `rel="noopener noreferrer"` on all external anchors.
5. Filter `iframe` elements strictly to approved video/audio providers (`youtube.com`, `player.vimeo.com`, `npr.org`).
