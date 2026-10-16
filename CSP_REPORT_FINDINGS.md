# CSP Report Findings & Enforcement Readiness Assessment
**Project:** Rock The Western World  
**Date:** October 2026  
**Policy Status:** Deployed in `Content-Security-Policy-Report-Only` Mode  
**Audit Scope:** Full platform analysis across Broadsheet, Trophy Room, and Ledger  

---

## 1. Executive Summary

A Content Security Policy (CSP) was deployed to [`next.config.ts`](file:///C:/Users/danbi/.gemini/antigravity/scratch/rock-the-western-world/next.config.ts) in **`Report-Only` mode** (`Content-Security-Policy-Report-Only`). This enables passive detection of potential policy violations without blocking browser network requests, breaking legacy content, or disrupting active reader workflows.

This audit report inventories all observed and anticipated CSP violations, details the affected platform features and severity levels, presents remediation plans for each, and delivers a formal readiness recommendation regarding active enforcement mode.

---

## 2. Inventory of Observed Violations

### Finding 1: Historical WordPress Archive External Image CDNs
* **Directive:** `img-src`
* **Source URLs / Domains:**
  - `i0.wp.com`, `i1.wp.com`, `i2.wp.com` (WordPress Jetpack Photon CDN)
  - `farm1.staticflickr.com` through `farm8.staticflickr.com`, `live.staticflickr.com` (Flickr)
  - `upload.wikimedia.org` (Wikimedia Commons)
  - `images-na.ssl-images-amazon.com` (Amazon Book/Product Covers)
  - `img.washingtonpost.com`, `media.dcentertainment.com`, `bloximages.newyork1.vip.townnews.com`
* **Affected Feature:** Historical Article Reader (`src/app/[slug]/page.tsx`) rendering 700+ articles from `public/archive/imported-entries.json`.
* **Severity:** **MEDIUM** (Broken image placeholders and visual degradation across historical articles under active enforcement).
* **Remediation Plan:**
  1. *Immediate:* Expand `img-src` to permit `https:` or explicitly add `*.wp.com`, `*.staticflickr.com`, `upload.wikimedia.org`, `*.ssl-images-amazon.com`.
  2. *Permanent (Sprint Technical Debt):* Ingest legacy images into Cloudflare R2 storage via a background migration script and rewrite legacy URLs to use the primary CDN.

---

### Finding 2: Next.js Client-Side Hydration & Inline JSON-LD Scripts
* **Directive:** `script-src`
* **Source URLs / Pattern:**
  - Inline `<script>` blocks in `src/app/layout.tsx:65` (Periodical Schema.org metadata)
  - Inline `<script>` blocks in `src/app/[slug]/page.tsx:242` (Article Schema.org metadata)
  - Next.js Turbopack hydration bootstrap scripts
* **Affected Feature:** Client-side React interactivity, search engine structured data, and page hydration across all pages.
* **Severity:** **CRITICAL** (Enforcing strict CSP without `'unsafe-inline'` or a dynamic cryptographic nonce completely breaks client-side React execution, disabling all interactive modals, navigation, and reader settings).
* **Remediation Plan:**
  - Maintain `'unsafe-inline'` in `script-src` for Report-Only mode.
  - Prior to blocking enforcement, implement a Next.js `middleware.ts` that generates a cryptographically random, per-request nonce (`crypto.randomUUID()`), injects it into the CSP header, and passes it to Next.js `<Script nonce={nonce}>` tags.

---

### Finding 3: Dynamic Reader Discussion Scripts (Giscus & Cusdis)
* **Directive:** `script-src`, `frame-src`, `connect-src`, `style-src`
* **Source URLs:**
  - `https://giscus.app` (Script loader, discussions iframe, theme stylesheets)
  - `https://cusdis.com` (Script loader, comments iframe, API endpoint)
* **Affected Feature:** Reader Discussion & Comments module on all article pages (`src/components/article/CommentsSection.tsx`).
* **Severity:** **HIGH** (If unconfigured, discussion embeds fail to mount or connect to backend discussion threads).
* **Remediation Plan:**
  - Verified and included in the current policy:
    - `script-src`: `https://giscus.app https://cusdis.com`
    - `frame-src`: `https://giscus.app https://cusdis.com`
    - `connect-src`: `https://giscus.app https://cusdis.com`
    - `style-src`: `https://giscus.app`

---

### Finding 4: PDF.js Worker Fallback Dependency
* **Directive:** `worker-src`, `script-src`
* **Source URLs:**
  - Local origin: `/pdfjs/pdf.worker.min.mjs` (via `blob:` URL)
  - Fallback CDN: `https://unpkg.com/pdfjs-dist@6.3.289/build/pdf.worker.min.mjs`
* **Affected Feature:** In-browser PDF Reader in The Trophy Room (`src/components/trophy-room/readers/PdfReader.tsx`).
* **Severity:** **MEDIUM** (If local `/pdfjs/` worker script resolution fails, PDF rendering aborts if `unpkg.com` is not permitted).
* **Remediation Plan:**
  - Add `https://unpkg.com` to `script-src` and `worker-src` as an approved fallback origin.
  - Verify that `public/pdfjs/pdf.worker.min.mjs` is served with the correct `application/javascript` MIME type in production.

---

### Finding 5: Daily Ledger Wikipedia "On This Day" API Calls
* **Directive:** `connect-src`
* **Source URLs:**
  - Primary: `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/...`
  - Fallback: `https://en.wikipedia.org/api/rest_v1/feed/onthisday/...`
* **Affected Feature:** The Daily Ledger historical event card (`src/components/journal/ledger/DailyLedgerView.tsx`).
* **Severity:** **LOW** (Historical events card renders blank error state if network call is rejected).
* **Remediation Plan:**
  - Verified and included in the current policy:
    - `connect-src`: `https://api.wikimedia.org https://en.wikipedia.org`

---

## 3. Violation Summary Matrix

| Source / Domain | Directive | Affected Feature | Severity | Remediation Status |
| :--- | :--- | :--- | :--- | :--- |
| `*.wp.com`, `*.staticflickr.com` | `img-src` | WP Archive Articles | **MEDIUM** | Allowed in Report-Only; migration to R2 scheduled |
| Inline React Hydration | `script-src` | App-wide interactivity | **CRITICAL** | Requires `'unsafe-inline'` or Next.js middleware nonce |
| `https://giscus.app` | `script/frame/connect` | Reader Comments | **HIGH** | Whitelisted in policy |
| `https://cusdis.com` | `script/frame/connect` | Reader Comments | **HIGH** | Whitelisted in policy |
| `https://unpkg.com` | `worker-src / script-src` | PDF Reader in Trophy | **MEDIUM** | Whitelist `unpkg.com` fallback |
| `https://api.wikimedia.org` | `connect-src` | Daily Ledger History | **LOW** | Whitelisted in policy |
| `https://cloud.umami.is` | `script/connect/frame` | Web Analytics | **LOW** | Whitelisted in policy |

---

## 4. Enforcement Readiness Recommendation

### Verdict: **NOT READY FOR ACTIVE BLOCKING ENFORCEMENT**

### Justification:
1. **Hydration Fragility:** Transitioning `Content-Security-Policy-Report-Only` to an enforcing `Content-Security-Policy` header without first implementing a cryptographic nonce system in Next.js Middleware will block inline scripts and break client-side React hydration.
2. **Historical Asset Protection:** The 700+ articles in the historical WordPress archive reference images across dozens of third-party domains (`*.wp.com`, `*.staticflickr.com`, etc.). Strict enforcement would immediately produce broken image placeholders for historical reading.
3. **Architectural Sequencing:** Per the implementation charter, the immediate architectural priority is **Phase 2: Domain Separation (Splitting Ledger and Editorial Studio)** and technical debt reduction.

### Strategic Recommendation:
* **Maintain `Content-Security-Policy-Report-Only` throughout Phase 2 and Phase 3.**
* Address asset migration and middleware nonce generation in Phase 4 before toggling to active blocking mode.
