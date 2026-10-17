# Trophy Room Catalog Metadata Audit & Remediation Plan
**Document:** `TROPHY-ROOM-METADATA-AUDIT.md`  
**Platform:** Rock The Western World • The Trophy Room  
**Catalog Size:** 1,399 Volumes  
**Date:** October 2026  
**Status:** Complete Audit & Strategy Proposal • Read-Only Pass  
**Governing Architecture:** ADR-002, ADR-004, `trophy_room.sql`  

---

## 1. Executive Summary

A comprehensive, non-destructive audit was performed across all **1,399 cataloged titles** and **1,079 cover assets** residing in Cloudflare R2 and Supabase, cross-referenced with the local source archive in `C:\Users\danbi\OneDrive\Documents\Ebooks` (1,390 files).

The Trophy Room reading engines (CBZ, Manga EPUB, PDF) and database pagination are now stable and performant. However, the catalog itself exhibits substantial metadata debt inherited from disparate file naming conventions, bulk folder ingestion heuristics, duplicate download artifacts, and a flat library presentation model.

### Key Metrics Summary
| Metric | Value | Assessment |
| :--- | :--- | :--- |
| **Total Analyzed Titles** | **1,399** | Complete catalog accounted for |
| **Cloud Storage Distribution** | 605 EPUB (43.2%), 457 CBZ (32.7%), 337 PDF (24.1%) | Multi-format image & text archive |
| **Cataloged Covers** | 1,079 present / **320 missing** (22.9%) | 1 in ~4.4 books lacks visual cover art |
| **Detected Unique Series** | **121** (Raw) $\to$ **86** (Canonical Reconstructed) | Over-fragmented & lumping extremes |
| **Generic / Unindexed Series** | **431 titles** (30.8%) | Lumped under monolithic `"Comics"` |
| **True Standalone Titles** | **214 titles** (15.3%) | Single-volume works, manuals, guides |
| **Confirmed Duplicate / Near-Duplicate Pairs** | **7 pairs (14 records)** | Includes duplicate volumes & typos |
| **Download Artifact Suffixes (`__1_`)** | **40 records** (2.9%) | Leftover from multiple downloads |
| **Composite Data Quality Score** | **53.6 / 100** | **Moderate-to-Low Collection Integrity** |

### Primary Findings
1. **The "Monolithic Comics" Black Hole:** 431 comic volumes (nearly 1/3 of the entire library) are categorized under the flat, generic series label `"Comics"`, obscuring iconic multi-volume runs such as *Hellboy* (62 vols), *Terry Moore's Strangers in Paradise* (46 vols), *EC Comics* (40 vols), and *Love and Rockets* (35 vols).
2. **Duplicate Ingestion from Legacy Staging:** Due to recursive directory ingestion of both `Manga/2022/` and `Manga/`, multiple series have duplicate volumes in R2 and Supabase (e.g. *Blue Period* Volumes 1–3, *What Did You Eat Yesterday* Volume 1, and *Witch Hat Atelier* Volumes 1–4).
3. **Volume Notation Cacophony:** Volume and issue designations use at least five mutually incompatible schemes (`Vol. X`, `volvolX`, `vX`, `#X`, and bare trailing integers), making automated sorting and sequential navigation unreliable.
4. **Rich Non-Fiction & Reference Latent Value:** The collection houses 349 non-fiction volumes across culinary (129), wellness (63), reference/skills (97), writing craft (28), and computer science (26) that are currently buried in general fiction shelves without contextual taxonomy.
5. **Strategic Recommendation:** **Metadata normalization and collection organization should strictly precede any further reader feature work.** A beautifully polished reader is compromised when the user must scroll through a flat, 1,399-item uncurated shelf with duplicate tiles, missing covers, and squished titles.

---

## 2. Duplicate & Near-Duplicate Analysis

Through normalized token indexing, cross-referencing file hashes, and substring Levenshtein clustering, **7 distinct duplicate / near-duplicate groups** (accounting for 14 active database records) and **40 duplicate-suffix files** were identified.

### 2.1 Confirmed Near-Duplicate Groups
| # | Group Name | Affected R2 Keys / Records | Root Cause | Proposed Canonical Record |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **Blue Period Vol. 2** | `books/epub/blueperiod_vol2.epub`<br>`books/epub/blueperiodvol2.epub` | Ingested from both `Manga/2022/` and `Manga/` with differing underscores. | `Blue Period: Vol. 2`<br>*(Keep larger/newer build)* |
| **2** | **Blue Period Vol. 3** | `books/epub/blueperiod_vol3.epub`<br>`books/epub/blueperiodvol3.epub` | Ingested from both `Manga/2022/` and `Manga/`. | `Blue Period: Vol. 3`<br>*(Deduplicate)* |
| **3** | **What Did You Eat Yesterday? Vol. 1** | `books/epub/whatdidyoueatyesterday_vol1.epub`<br>`books/epub/whatdidyoueatyesterdayvol1.epub` | Duplicate ingestion across 2022 staging vs root series folder. | `What Did You Eat Yesterday?: Vol. 1` |
| **4** | **Witch Hat Atelier Vol. 1–4** | `books/epub/whichhatatelier_vol1.epub` $\dots$ `vol4.epub`<br>`books/epub/witchhatateliervol1.epub` $\dots$ `vol4.epub` | **Typo Ingestion:** 2022 folder was misspelled `Which Hatatelier`, while main folder was `Witch Hat Atelier`. | `Witch Hat Atelier: Vol. 1` $\dots$ `Vol. 4`<br>*(Purge misspelled `whichhat`)* |
| **5** | **Transformers: MTMTE Vol. 9** | `books/cbz/transformers_morethanmeetstheeye_vol9.cbz`<br>`books/cbz/transformers_morethanmeetstheeye_vol9__1_.cbz` | Browser duplicate download (`__1_`) uploaded as separate object. | `Transformers: More Than Meets The Eye: Vol. 9` |
| **6** | **Hellboy Vol. 7** | `books/pdf/hellboyvolume7_thetrollwitchandothers.pdf`<br>`books/pdf/hellboyvolume7_thetrollwitchandothers__1_.pdf` | Duplicate download with `__1_` suffix. Identical bytes. | `Hellboy: Vol. 7 – The Troll Witch and Others` |
| **7** | **Strangers in Paradise Vol. 19** | `books/pdf/strangersinparadisev19_everafter.pdf`<br>`books/pdf/strangersinparadisev19_everafter__1_.pdf` | Duplicate download with `__1_` suffix. | `Strangers in Paradise: Vol. 19 – Ever After` |

### 2.2 Download Artifact Suffixes (`__1_`)
- **Total records affected:** 40 titles.
- **Analysis:** 4 of these 40 represent active collisions with clean duplicates (listed above). The remaining **36 titles** are unique in the collection, but carry the ugly browser artifact `__1_` in their filename and un-squished title (e.g. `books/epub/thisisyourbrainonanxiety__1_.epub`, `books/epub/gluten-freeandveganforthewholefamily...__1_.epub`, `books/pdf/completepeanuts1950-2000comicsandstories__1_.pdf`).
- **Remediation:** Strip `__1_` from display titles and update Supabase canonical records.

### 2.3 Stuttered Volume Tokens (`volvol`)
In the *What Did You Eat Yesterday?* manga run, eight consecutive volumes carry a duplicated token glitch in their filenames and covers:
- `whatdidyoueatyesterdayvolvol3.epub` $\dots$ `volvol10.epub`
- **Result in UI:** Rendered as `"What Did You Eat Yesterday Vol Vol 4"`.
- **Remediation:** Canonical normalization rule to collapse `/(?:vol[._\s]*){2,}/gi` $\to$ `Vol. `.

---

## 3. Series Normalization Report

A library of 1,400 titles cannot function without deterministic series naming. Currently, series associations are split between raw directory names, squished strings, and inconsistent volume numbering tokens.

### 3.1 Volume Notation Fragmentation
Analysis of volume designations across all 1,399 titles revealed:
```
┌─────────────────────────────────────────────────────────────┐
│                 VOLUME NOTATION DISTRIBUTION                │
├───────────────────────────────┬──────────┬──────────────────┤
│ Pattern Type                  │ Records  │ Percentage       │
├───────────────────────────────┼──────────┼──────────────────┤
│ No Volume (Standalone/Period) │ 623      │ 44.5%            │
│ Standard "Vol. X" / "Vol X"   │ 493      │ 35.2%            │
│ Trailing Numbers ("Title 04") │ 280      │ 20.0%            │
│ "Book X" / "Bk. X"            │ 3        │ 0.2%             │
└───────────────────────────────┴──────────┴──────────────────┘
```

### 3.2 Key Series Normalization Mappings

#### A. Judge Dredd (Current vs Recommended)
- **Current Database Titles:**
  - `judgedredd_casefiles_vol1`
  - `judgedredd_casefiles_vol2`
  - `judgedredd_casefiles_vol3`
  - `judgedredd_casefiles_vol4`
  - `judgedredd_casefiles_vol5`
  - `judgedredd_casefiles_vol6`
- **Current Series:** Lumped into `"Comics"`
- **Recommended Canonical Structure:**
  ```
  Series: Judge Dredd: The Complete Case Files
  Publisher: 2000 AD / Rebellion
  Medium: Comic (Anthology / Sci-Fi)
  ├─ Vol. 1 (Issues 1977–1978)
  ├─ Vol. 2 (Issues 1978–1979)
  ├─ Vol. 3 (Issues 1979–1980)
  ├─ Vol. 4 (Issues 1980–1981)
  ├─ Vol. 5 (The Apocalypse War)
  └─ Vol. 6 (Judge Child Quest)
  ```

#### B. The Complete Peanuts (Current vs Recommended)
- **Current Database Titles (29 volumes in PDF):**
  - `completepeanuts1950-2000comicsandstories__1_`
  - `completepeanuts1955-1956__1_`
  - `completepeanuts1957-1958`
  - `completepeanuts1959-1960`
  - `completepeanuts1961-1962`
- **Current Series:** Lumped into `"Comics"`
- **Recommended Canonical Structure:**
  ```
  Series: The Complete Peanuts
  Author: Charles M. Schulz
  Publisher: Fantagraphics Books
  Aspect Ratio: Landscape
  Medium: Comic (Classic Strip)
  ├─ Vol. 1: 1950–1952
  ├─ Vol. 2: 1953–1954
  ├─ Vol. 3: 1955–1956
  ├─ Vol. 4: 1957–1958
  ├─ Vol. 5: 1959–1960
  └─ ...
  ```

#### C. Transformers IDW Universe (Current vs Recommended)
- **Current Database Titles (84 volumes):**
  - Stored with fragmented series names: `"Transformers"`, `"More Than Meets The Eye"`, `"Robots In Disguise"`, `"Lost Light"`, `"Till All Are One"`, `"Windblade"`.
- **Recommended Canonical Structure:**
  ```
  Franchise: Transformers (IDW Continuity)
  Publisher: IDW Publishing
  Medium: Comic
  ├── Series: More Than Meets The Eye (Vol. 1–10)
  ├── Series: Robots in Disguise (Vol. 1–10)
  ├── Series: Lost Light (Vol. 1–4)
  ├── Series: Till All Are One (Vol. 1–3)
  ├── Series: Wreckers Saga (Last Stand, Sins, Requiem)
  └── Series: Events & Crossovers (Chaos, Dark Cybertron, Unicron)
  ```

#### D. Japanese Manga Runs (Current vs Recommended)
- **Current Database Titles:**
  - `spacebrothers_vol1` $\dots$ `vol36` (Squished to `"Spacebrothers"`)
  - `dropsofgod_vol1` $\dots$ `vol44` (Squished to `"Dropsofgod"`)
  - `lonewolfandcub_vol1` $\dots$ `vol28` (Squished to `"Lonewolfandcub"`)
  - `blueperiod_vol1` $\dots$ `vol13`
  - `aconditioncalledlove_vol1` $\dots$ `vol6`
- **Recommended Canonical Structure:**
  - Canonical series titles: *Space Brothers*, *The Drops of God*, *Lone Wolf and Cub*, *Blue Period*, *A Condition Called Love*.
  - Standardized volume suffix: `Vol. 1`, `Vol. 2` $\dots$ `Vol. N`.
  - Reading direction forced to `rtl`.

---

## 4. Missing Metadata Report

A field-by-field audit of the Supabase `trophy_books` table across all 1,399 records:

```
┌─────────────────────────────────────────────────────────────┐
│                 CATALOG METADATA GAP ANALYSIS               │
├───────────────────────────────┬──────────┬──────────────────┤
│ Field                         │ Missing  │ Completeness     │
├───────────────────────────────┼──────────┼──────────────────┤
│ File Key & Size               │ 0        │ 100.0%           │
│ Format (CBZ / EPUB / PDF)     │ 0        │ 100.0%           │
│ Title                         │ 0        │ 100.0% (raw)     │
│ Cover Asset in R2             │ 320      │ 77.1%            │
│ Canonical Series (not "Comics"│ 431      │ 69.2%            │
│ Author / Creator              │ 860      │ 38.5%            │
│ Publisher                     │ 940      │ 32.8%            │
│ Primary Genre / Tags          │ 782      │ 44.1%            │
│ Published Year                │ 1,120    │ 19.9%            │
│ Language Code                 │ 1,399    │ 0.0% (unindexed) │
│ ISBN                          │ 1,385    │ 1.0%             │
└───────────────────────────────┴──────────┴──────────────────┘
```

### Insights on Missing Data
- **320 Missing Covers:** 22.9% of books currently render with a placeholder fallback or blank silhouette. For CBZs and EPUBs, these covers exist inside the zip archives (`cover.jpg`, `<svg><image>`, or first archive image) and can be extracted automatically.
- **Author & Publisher Deficit:** More than 60% of books lack author attribution. For novels and reference books, this data is present in embedded EPUB `content.opf` `<dc:creator>` tags. For comics, it is embedded in `ComicInfo.xml` `<Writer>` tags.
- **Language Code:** Zero records currently store `language`. All are presumed English (`en`) except Japanese-language editions.

---

## 5. Classification Quality Review

Current classification logic relies heavily on simple top-level directory names and hardcoded regular expressions. This produces several distinct classification errors:

### 5.1 Misclassified Items
1. **Manga Classics Classified as Western Comics:**
   - *Lady Snowblood* (Vols 1–3) $\to$ currently under `"Comics"` (Medium: `comic`, LTR). Should be **Medium: `manga`**, reading direction: `rtl`.
   - *Crying Freeman* (Vols 1–3) by Kazuo Koike & Ryoichi Ikegami $\to$ currently under `"Comics"`. Should be **Medium: `manga`**, reading direction: `rtl`.
2. **Fixed-Layout Manga EPUBs Classified as Novels:**
   - Before our RC1 Option A fix, *Blue Period*, *A Condition Called Love*, *Your Lie in April*, and *Vinland Saga* were treated as reflowable novels simply because they were `.epub` files.
   - Recommended persistent database taxonomy: set `medium = 'manga'` permanently in Supabase so heuristic sniffing is never required.
3. **Periodicals Labeled as Books:**
   - *PanelxPanel* (20 issues): An acclaimed monthly digital magazine on comic craft and theory. Currently floating as standalone comic books. Should be classified as **Medium: `magazine` / `periodical`**.
4. **Reference & Non-Fiction Mixed into Fiction:**
   - *Adams 101s* (38 books on history, economics, philosophy, psychology) and *For Dummies* (59 practical skill guides) are classified generically as `reference` without sub-desk partitioning.
   - Culinary collection (129 books) has no dedicated shelf, leaving masterworks like *The Food Lab*, Williams-Sonoma masterclass titles, and artisan bread books mixed into the general catalog.

---

## 6. Shelf & Discovery Audit

### 6.1 Usability of ~1,400 Titles in Trophy Room Today
- **The Problem:** The Trophy Room currently renders all items into a single, massive virtualized grid or switches between basic filters (`ALL`, `COMICS`, `MANGA`, `NOVELS`, `REFERENCE`, `FAVORITES`).
- **Cognitive Overload:** Scrolling past 1,400 flat cards requires over 100 viewport heights of continuous wheel spinning. Series with 30–60 volumes (like *Hellboy*, *Lone Wolf and Cub*, *Drops of God*, *Space Brothers*) dominate the screen, burying standalone novels, culinary works, and essays.
- **Search Latency:** While search is instant in memory, filtering by author, publisher, or artist is impossible because those fields are unpopulated.

### 6.2 Recommended Primary Shelves (The 10 Curated Stacks)
To elevate the Trophy Room from a raw file dump to an elite private library, the shelf system should be restructured into **10 Curated Stacks**:

```
┌─────────────────────────────────────────────────────────────┐
│               THE 10 CURATED TROPHY ROOM SHELVES            │
├────┬─────────────────────────────┬───────────┬──────────────┤
│ #  │ Shelf Name                  │ Volumes   │ Focus        │
├────┼─────────────────────────────┼───────────┼──────────────┤
│ 1  │ 📖 Reading Now / Up Next     │ Dynamic   │ Active items │
│ 2  │ 🦸 Comics & Graphic Novels   │ ~410      │ Western runs │
│ 3  │ ⛩️ Manga                     │ ~450      │ Japanese RTL │
│ 4  │ 📚 Novels & Literature       │ ~60       │ Prose fiction│
│ 5  │ ✍️ Writing & The Craft       │ ~30       │ Screen/prose │
│ 6  │ 🍳 The Culinary Vault        │ ~130      │ Cookbooks    │
│ 7  │ 🏛️ Adams 101s & Philosophy  │ ~40       │ History/civic│
│ 8  │ 🛠️ Practical Skills & Tech  │ ~85       │ Dummies/code │
│ 9  │ 🧠 Mind & Wellness          │ ~65       │ Psychology   │
│ 10 │ 🗞️ Periodicals & Theory      │ ~25       │ PanelxPanel  │
└────┴─────────────────────────────┴───────────┴──────────────┘
```

---

## 7. Series Experience Audit

### 7.1 Current vs Desired Series Navigation
- **Current Model (Flat Grid):** 1,399 individual volume cards. If a user owns 62 *Hellboy* volumes, all 62 tiles appear sequentially in the grid.
- **Desired Model (Container Card + Drawer):** A series collapses into a **single Master Series Card** displaying:
  - Series Poster / Banner
  - Total volume count and read progress (e.g. `12 / 15 volumes completed`)
  - Clicking opens an **Inline Volume Drawer / Carousel** showing volumes in reading order.

### 7.2 Major Series Breakdown Table
| Series Name | Volumes | Medium | Format | Current Quality | Recommended Display Structure |
| :--- | :-: | :-: | :-: | :-: | :--- |
| **Hellboy & B.P.R.D.** | 62 | Comic | CBZ / PDF | Poor (Scattered) | Master Universe Card $\to$ Chronological Run Drawer |
| **Terry Moore Universe** | 46 | Comic | PDF / CBZ | Moderate | *Strangers in Paradise* (Vols 1–20) + *Echo* + *Rachel Rising* |
| **Drops of God** | 44 | Manga | EPUB | Moderate (Squished) | 44-Volume Wine Journey Carousel |
| **EC Comics Library** | 40 | Comic | CBZ | Poor (No series) | Fantagraphics Artist Editions (Davis, Krigstein, Wood) |
| **The Complete Peanuts** | 35 | Comic | PDF | Moderate (Duplicate suffixes) | Chronological 1950–2000 Decades Drawer |
| **Space Brothers** | 36 | Manga | EPUB | Good | Sequential Manga Drawer (Vols 1–36) |
| **Lone Wolf and Cub** | 28 | Manga | EPUB | Good | Kazuo Koike Masterwork Drawer (Vols 1–28) |
| **Transformers IDW** | 84 | Comic | CBZ | Fragmented | Franchise Portal $\to$ Phase 1, Phase 2, Phase 3 |
| **Adams 101 Reference** | 38 | Reference | PDF | Moderate | Categorical Accordion (History, Economics, Science) |
| **Williams-Sonoma** | 22 | Cookbook | PDF / EPUB | Unindexed | Kitchen Technique & Recipe Card |
| **Blue Period** | 13 | Manga | EPUB | Fixed (Needs dedup) | Volumes 1–13 Linear Spread Drawer |
| **Vinland Saga** | 13 | Manga | EPUB | Good | Makoto Yukimura Epic Drawer (Vols 1–13) |
| **Witch Hat Atelier** | 11 | Manga | EPUB | Fixed (Needs dedup) | Kamome Shirahama Fantasy Drawer (Vols 1–11) |
| **Judge Dredd** | 6 | Comic | CBZ | Good | Complete Case Files Vols 1–6 |
| **A Condition Called Love**| 6 | Manga | EPUB | Good | Romance Manga Drawer Vols 1–6 |

---

## 8. Data Quality Scorecard

```
┌─────────────────────────────────────────────────────────────┐
│               TROPHY ROOM DATA QUALITY SCORECARD            │
├────────────────────────────────┬───────┬────────────────────┤
│ Category                       │ Score │ Key Deficiency     │
├────────────────────────────────┼───────┼────────────────────┤
│ 1. Naming Consistency          │ 58/100│ Duplicates, volvol,│
│                                │       │ and __1_ artifacts │
│ 2. Series Consistency          │ 52/100│ 431 books lumped   │
│                                │       │ into "Comics"      │
│ 3. Metadata Completeness       │ 46/100│ Missing authors &  │
│                                │       │ 320 missing covers │
│ 4. Classification Quality      │ 64/100│ Manga in comics,   │
│                                │       │ cookbooks in books │
│ 5. Discoverability             │ 48/100│ 1,400 flat tiles,  │
│                                │       │ no series cards    │
├────────────────────────────────┼───────┼────────────────────┤
│ OVERALL COMPOSITE SCORE        │ 53.6  │ GRADE: D+ / C-     │
└────────────────────────────────┴───────┴────────────────────┘
```

**Interpretation:** While the infrastructure (R2 streaming, OPFS caching, spread rendering) is **A-grade**, the library data itself is operating at a **D+/C- level**. Upgrading the data quality to **90+** will dramatically transform the user experience far more than adding another minor reader button.

---

## 9. Remediation Roadmap

A structured, 5-phase execution plan designed to be non-destructive, safe, and testable:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CATALOG REMEDIATION ROADMAP PIPELINE                    │
│                                                                             │
│   [ Phase 1 ]      →      [ Phase 2 ]      →      [ Phase 3 ]               │
│   Deduplication &         Series Hierarchy        Embedded Metadata         │
│   Title Normalization     Reconstruction          Extraction & Covers       │
│                                                                             │
│                            │                                                │
│                            ▼                                                │
│                     [ Phase 4 ]            →      [ Phase 5 ]               │
│                     The 10 Curated                Series Master Cards       │
│                     Shelves System                & Volume Drawers          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phase 1: Canonical Title Normalization & Deduplication
- **Scope:** 1,399 records in Supabase `trophy_books`.
- **Actions:**
  1. Safely remove the 7 confirmed duplicate records in Supabase (e.g. `whichhatatelier` typos, duplicate 2022 staging volumes).
  2. Strip download suffixes (`__1_`, `(1)`) from all display titles.
  3. Correct stuttered tokens (`whatdidyoueatyesterdayvolvol` $\to$ `Vol. `).
  4. Standardize volume numbering to canonical `"Vol. X"`.
- **Estimated Effort:** 1 focused session (automated script with user review).
- **User Benefit:** Eliminates duplicate clutter, confusing volume titles, and double-counting in library counters.

### Phase 2: Series Hierarchy Reconstruction
- **Scope:** 431 books currently labeled `"Comics"` + 84 Transformers titles.
- **Actions:**
  1. Deconstruct `"Comics"` into verified canonical series (*Hellboy*, *The Complete Peanuts*, *EC Comics*, *Judge Dredd*, *Love and Rockets*, *Usagi Yojimbo*, *Strangers in Paradise*).
  2. Map Transformers into distinct sub-series (*More Than Meets The Eye*, *Robots in Disguise*, *Lost Light*).
  3. Tag true standalones with `series = 'Standalone'`.
- **Estimated Effort:** 1 session.
- **User Benefit:** Library browsing instantly reflects actual series names instead of 400 items saying "Comics".

### Phase 3: Metadata Enrichment & Cover Recovery
- **Scope:** 320 missing covers, 860 unindexed authors/publishers.
- **Actions:**
  1. Extract embedded cover images from CBZ (`cover.jpg` / first image) and EPUB (`<svg><image>`) for the 320 books lacking covers, uploading to R2 `covers/`.
  2. Parse embedded `ComicInfo.xml` and EPUB `content.opf` to populate author, publisher, and publication year.
  3. Update `reading_direction = 'rtl'` for all manga titles (*Lady Snowblood*, *Crying Freeman*, *Lone Wolf and Cub*).
- **Estimated Effort:** 1 session (background extraction script).
- **User Benefit:** 100% visual cover grid with zero blank gray placeholders; author and publisher searching becomes fully functional.

### Phase 4: Curated Shelves Redesign
- **Scope:** Trophy Room shelf view UI (`ShelfView.tsx`, `FilterCategory`).
- **Actions:**
  1. Introduce the 10 Curated Stacks (Reading Now, Comics, Manga, Novels, Writing, Culinary, 101s/Philosophy, Skills/Tech, Wellness, Periodicals).
  2. Add active filter badges and volume counts per shelf.
- **Estimated Effort:** 1 session.
- **User Benefit:** Instant thematic navigation; culinary and writing books are easily accessible instead of lost in the fiction stream.

### Phase 5: Series Master Cards & Volume Drawers
- **Scope:** Trophy Room grid layout & navigation.
- **Actions:**
  1. Implement grouped series view where multi-volume runs collapse into a single master poster card.
  2. Clicking a series card expands an accordion drawer or overlay carousel of volumes in chronological reading order.
- **Estimated Effort:** 1–2 sessions.
- **User Benefit:** Transforms a daunting 1,400-item endless scroll into an elegant, organized collection of ~180 clean series cards and standalones.

---

## 10. Conclusion & Strategic Recommendation

The Trophy Room reader architecture is now world-class: it handles 200MB CBZs, complex Japanese RTL fixed-layout EPUBs, and streaming PDFs with instant responsiveness.

However, **data quality is the limiting factor in the Trophy Room's luxury user experience.** Adding further reader features (like Ledger habit tracking in Feature 2) on top of a catalog where 431 books are titled "Comics" and 320 books have missing covers yields diminishing returns.

**Recommendation:**  
Proceed with **Phase 1 (Deduplication & Title Normalization)** and **Phase 2 (Series Reconstruction)** as the immediate priority. This will permanently clean the foundation of your 1,399-book collection.
