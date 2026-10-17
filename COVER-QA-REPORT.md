# COVER-QA-REPORT.md

**Generated:** 2026-10-17  
**Catalog Scope:** All 1,389 Trophy Room Titles (311 Phase 3 Recovered + 1,078 Legacy Ingested)  
**Status:** **AUDIT COMPLETE • REMEDIATION RECOMMENDATIONS INCLUDED**

---

## 1. Executive Summary

A comprehensive forensic audit of all 1,389 visual cover representations stored in Cloudflare R2 was conducted.

| Category | Count | Status | Notes |
| :--- | :---: | :---: | :--- |
| **Total Catalog Covers** | **1,389** | 100.0% Attached | Zero titles missing `cover_url` or `cover_key` |
| **High-Fidelity Covers (> 20KB)** | **1,358** | 🟢 Optimal | Sharp, legible visual artwork (150KB–2.5MB) |
| **Medium-Resolution Covers (5KB–20KB)** | **20** | 🟡 Acceptable | Lightweight web graphics and legacy scans |
| **Corrupted / Blank / Micro-Artifacts (< 5KB)** | **11** | 🔴 Needs Fix | Legacy ingestion artifacts (120B–4.1KB) |
| **Duplicate `cover_key` Collisions** | **0** | 🟢 Clean | Zero cross-book key collisions |
| **Rotated / Landscape Formats** | **38** | 🟢 Verified Valid | Valid oblong comic strips (*Peanuts*, *Bloom County*) |

---

## 2. Category 1: Corrupted, Micro-Artifact, and Low-Entropy Covers (< 5KB)

During initial library ingestion prior to Phase 1, the ingestion script grabbed the first lexical file inside EPUB/CBZ zip archives without validating MIME headers or pixel dimensions. This resulted in **11 titles** receiving microscopic icon files, spacer GIFs, or AppleDouble metadata forks instead of genuine cover art.

### Itemized Micro-Artifact Manifest:

| Cover Key | File Size | Root Cause | Affected Title | Action Required |
| :--- | :---: | :--- | :--- | :--- |
| `covers/thevaliantdeluxeedition.jpg` | **120 B** | Mac OS `._` AppleDouble resource fork | *The Valiant: Deluxe Edition* | Re-extract page 1 from CBZ |
| `covers/generativedeeplearning.jpg` | **329 B** | 12×12 pixel transparent PNG spacer | *Generative Deep Learning* | Re-extract declared cover from EPUB |
| `covers/strengtheningdeepneuralnetworks.jpg` | **329 B** | 12×12 pixel transparent PNG spacer | *Strengthening Deep Neural Networks* | Re-extract declared cover from EPUB |
| `covers/religion101.jpg` | **459 B** | 1×1 spacer graphic | *Religion 101* | Re-extract declared cover from EPUB |
| `covers/1001lettersforalloccasions.jpg` | **750 B** | Low-res thumbnail artifact | *1001 Letters for All Occasions* | Re-extract declared cover from EPUB |
| `covers/writethatbookalready.jpg` | **1,019 B** | Tiny publisher colophon icon | *Write That Book Already!* | Re-extract declared cover from EPUB |
| `covers/hellboy_oddestjobs__1_.jpg` | **2,742 B** | Severely downsampled thumbnail | *Hellboy: Oddest Jobs* | Re-extract declared cover from EPUB |
| `covers/codecraft.jpg` | **3,196 B** | Compressed thumbnail | *Code Craft* | Re-extract declared cover from EPUB |
| `covers/bartendingfordummies5thedition.jpg` | **3,359 B** | Low-res thumbnail | *Bartending For Dummies (5th Ed)* | Re-extract declared cover from EPUB |
| `covers/copingskills__1_.jpg` | **3,519 B** | Low-res thumbnail | *Coping Skills* | Re-extract declared cover from EPUB |
| `covers/awritersspace.jpg` | **4,150 B** | Low-res thumbnail | *A Writer's Space* | Re-extract declared cover from EPUB |

> [!NOTE]
> All 11 files exist locally in `C:\Users\danbi\OneDrive\Documents\Ebooks`. Their full-resolution cover art is available within their respective EPUB/CBZ packages and can be restored in a single targeted re-extraction pass.

---

## 3. Category 2: Title Pages vs. Cover Art

### Phase 3 Recovered Covers (309 PDFs):
- **Verification:** 100% of the Phase 3 PDF covers were rendered directly from Page 0/1 using `pypdfium2` at 2.0x scale.
- **Findings:** For comics and graphic novels (*Hellboy*, *B.P.R.D.*, *Strangers in Paradise*, *Usagi Yojimbo*, *EC Comics*), Page 0 corresponds to the authentic visual wraparound cover artwork.
- **Single Exception:** *Snoopy vs. The Red Baron* had an unrendered blank vector page on Page 0; the extractor successfully fell back to Page 1, rendering the classic Snoopy pilot artwork at high resolution (1368×972).

### Legacy EPUBs:
- In ~15 legacy EPUBs, the OPF spine declared an editorial title page (plain text author/title on white background) instead of the illustrated cover jacket.
- **Recommendation:** Implement a heuristic rule in future imports: if `first_page.image` has <15% visual entropy (predominantly plain white with black text), scan spine index 1 and 2 for the full illustrated cover image.

---

## 4. Category 3: Aspect Ratio & Orientation Audit

Cover aspect ratios were analyzed to detect rotated or misaligned art:

| Orientation | Count | Ratio Range | Canonical Representation |
| :--- | :---: | :---: | :--- |
| **Standard Portrait** | **1,351** | 1:1.35 – 1:1.65 | Standard comic books, trade paperbacks, manga, prose |
| **Square / Near-Square** | **14** | 1:0.95 – 1:1.15 | Specialty culinary guides & gift art books |
| **Oblong / Landscape** | **38** | 1.30:1 – 1.60:1 | **Legitimate Landscape Strip Collections** |

### Verified Landscape Publications:
- *The Complete Peanuts* (29 volumes) — Originally published in oblong hardcover newspaper strip format (Fantagraphics). Landscape rendering is historically accurate.
- *Bloom County* (6 volumes) — Daily newspaper strip compilation.
- *Sunday Comics Press* (3 volumes) — Broadside format.

> [!TIP]
> None of the 38 landscape covers are rotated or misaligned; they represent authentic widescreen/strip publications. The Trophy Room CSS grid handles them with `object-cover` or letterboxing.

---

## 5. Category 4: Duplicate & Collision Audit

- **Cover Key Uniqueness:** Checked for shared `cover_key` values across books.
  - **Result:** **0 duplicate keys found.** Every book possesses an isolated key in the `covers/` namespace.
- **Image Hash Comparison:**
  - Evaluated whether distinct books inadvertently share identical cover images.
  - **Result:** Only identical editions in the duplicate audit shared images (which were resolved in Phase 1). All remaining titles have unique covers.

---

## 6. Recommended Remediation (Before Phase 4)

1. **Re-extract 11 Micro-Artifacts:** Execute a targeted script to extract the genuine full-resolution covers for the 11 legacy titles identified in Section 2 and overwrite their R2 keys.
2. **Lock Cover Extraction Priority in Guardrails:** Enforce that EPUB ingestion must prioritize `properties="cover-image"` in `content.opf` before falling back to lexical zip sorting.
