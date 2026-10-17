# SHELF-TAXONOMY-PREVIEW.md

**Generated:** 2026-10-17  
**Catalog Scope:** All 1,389 Titles in Trophy Room Production Database  
**Status:** **AWAITING USER REVIEW • ZERO WRITES EXECUTED**

---

## 1. Executive Summary & Architecture

Phase 4 transitions the Trophy Room from a flat catalog into a structured, curated digital library organized into:
- **8 Curated Primary Shelves** (100% metadata-derived; every book mapped to exactly one primary shelf; total = 1,389 books).
- **3 Smart Dynamic Shelves** (computed dynamically from active user reading progress, timestamps, and acquisition history).

### Core Architectural Guarantees:
1. **Metadata-Derived Routing:** Shelf allocation is strictly derived from the canonical `medium` field populated and audited in Phases 2 and 3. Zero manual hardcoded ID mapping.
2. **Mutually Exclusive & Collectively Exhaustive:** Every single book belongs to **exactly one primary shelf**. Zero orphaned titles. Total sum = **1,389 books**.
3. **Manga Automatic RTL Routing:** All 436 titles with `medium = 'manga'` route to the **Manga Sanctuary** and open in the dual-page RTL spread engine.
4. **Reading Progress Preservation:** All 25 existing user reading progress records are preserved with 100% fidelity.

---

## 2. Primary Curated Shelves (1,389 Books Total)

| Shelf ID | Shelf Name | Primary Medium | Total Books | Unique Series | Standalones | Top Imprints / Publishers |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| **01** | **Comics Archives** | `comic` | **565** | 76 | 26 | Fantagraphics, Dark Horse, IDW, Image, Rebellion |
| **02** | **Manga Sanctuary** | `manga` | **436** | 87 | 0 | Kodansha, Dark Horse, Media Soft |
| **03** | **Reference & The 101s** | `reference` | **128** | 2 | 69 | Adams Media, Wiley, No Starch Press, O'Reilly |
| **04** | **The Culinary Vault** | `cookbook` | **116** | 1 | 94 | Weldon Owen, Chronicle Books, Ten Speed Press |
| **05** | **Wellness & Living** | `wellness` | **60** | 1 | 40 | Microcosm Publishing, Fair Winds Press |
| **06** | **Novels & Prose** | `novel` | **36** | 7 | 14 | Vintage, Penguin, Independent Presses |
| **07** | **Writing & Craft** | `writing` | **28** | 0 | 28 | Writer's Digest, Chronicle Books, Adams Media |
| **08** | **Periodicals & Essays** | `periodical` | **20** | 1 | 0 | PanelxPanel (Hassan Otsmane-Elhaou) |
| **TOTAL** | **All Primary Shelves** | — | **1,389** | **175** | **271** | **100% of Catalog Assigned** |

---

## 3. Top Series & Collection Examples by Primary Shelf

### Shelf 01: Comics Archives (565 Books)
*Western graphic novels, creator-owned trades, indie masterworks, and newspaper strip collections.*
- **EC Comics Library** (38 volumes) — *Al Feldstein, Harvey Kurtzman, Johnny Craig* (Fantagraphics)
- **Love and Rockets** (35 volumes) — *Gilbert & Jaime Hernandez* (Fantagraphics)
- **Transformers** (34 volumes) — *Simon Furman, James Roberts* (IDW Publishing)
- **The Complete Peanuts** (29 volumes) — *Charles M. Schulz* (Fantagraphics)
- **B.P.R.D.** (24 volumes) — *Mike Mignola & John Arcudi* (Dark Horse Comics)
- **Hellboy** (22 volumes) — *Mike Mignola* (Dark Horse Comics)
- **Strangers in Paradise** (21 volumes) — *Terry Moore* (Abstract Studios)
- **Usagi Yojimbo** (19 volumes) — *Stan Sakai* (Dark Horse Comics)
- **Cerebus** (17 volumes) — *Dave Sim & Gerhard* (Aardvark-Vanaheim)
- **Astro City** (16 volumes) — *Kurt Busiek & Brent Anderson* (Image Comics)
- **James Tynion IV Works** (16 volumes) — *Something Is Killing the Children*, *Department of Truth*
- **Bloom County** (12 volumes) — *Berkeley Breathed* (IDW Publishing)

---

### Shelf 02: Manga Sanctuary (436 Books)
*Japanese tankōbon runs and serialized manga with native Right-to-Left (RTL) reading navigation.*
- **The Drops of God** (44 volumes) — *Tadashi Agi & Shu Okimoto* (Kodansha)
- **Space Brothers** (36 volumes) — *Chuya Koyama* (Kodansha)
- **Absolute Obedience: If You Don't Obey Me** (31 volumes) — *Saki Sakimoto* (Media Soft)
- **Lone Wolf and Cub** (28 volumes) — *Kazuo Koike & Goseki Kojima* (Dark Horse Comics)
- **Kounodori: Dr. Stork** (15 volumes) — *You Suzunoki* (Kodansha)
- **Path of the Assassin** (15 volumes) — *Kazuo Koike & Goseki Kojima* (Dark Horse Comics)
- **Blue Period** (13 volumes) — *Tsubasa Yamaguchi* (Kodansha)
- **Vinland Saga** (13 volumes) — *Makoto Yukimura* (Kodansha)
- **To Your Eternity** (13 volumes) — *Yoshitoki Oima* (Kodansha)
- **Witch Hat Atelier** (12 volumes) — *Kamome Shirahama* (Kodansha)
- **Shangri-La Frontier** (11 volumes) — *Katarina & Ryosuke Fuji* (Kodansha)
- **Matching Our Answers** (11 volumes) — *Hikaru Takahashi* (Kodansha)
- **What Did You Eat Yesterday?** (10 volumes) — *Fumi Yoshinaga* (Kodansha)
- **A Condition Called Love** (9 volumes) — *Megumi Morino* (Kodansha)

---

### Shelf 03: Reference & The 101s (128 Books)
*Encyclopedic guides, foundational crash courses, practical technical skills, and data engineering.*
- **Adams 101 Reference Series** (39 volumes) — *Psychology 101*, *Astronomy 101*, *Economics 101*, *Philosophy 101*, *Mythology 101*, *Anatomy 101* (Adams Media)
- **For Dummies Reference** (20 volumes) — *Bartending*, *Guitar*, *Personal Finance*, *Woodworking*, *Spanish* (Wiley)
- **Computing & Data Engineering Standalones** (69 titles) — *Clojure for the Brave and True*, *Rust in Action*, *Designing Data-Intensive Applications*, *The Book of F#*, *Code Craft*, *Streaming Systems* (No Starch Press, O'Reilly)

---

### Shelf 04: The Culinary Vault (116 Books)
*Gastronomy, culinary techniques, artisanal baking, cocktail craft, and regional traditions.*
- **Williams-Sonoma Culinary Collection** (22 volumes) — *Baking*, *Grilling*, *Pasta*, *Soups*, *Rustic Italian*, *Mexican Favorites* (Weldon Owen)
- **Culinary Standalones** (94 titles) — *The Food Lab*, *Flour Water Salt Yeast*, *American Sfoglino*, *Salt Fat Acid Heat*, *Modernist Bread*, *Tartine Bread*, *The Bar Book*

---

### Shelf 05: Wellness & Living (60 Books)
*Psychology, habit systems, mindfulness protocols, cognitive behavioral therapy, and daily health.*
- **5-Minute Therapy Series** (20 volumes) — *Dr. Faith G. Harper* (Microcosm Publishing)
- **Wellness Standalones** (40 titles) — *Atomic Habits*, *Breath*, *Why We Sleep*, *The Body Keeps the Score*, *Coping Skills*

---

### Shelf 06: Novels & Prose (36 Books)
*Typographic literature, classic essays, and reflowable longform fiction.*
- **Fiction & Prose Standalones** (36 titles) — Reflowable EPUB fiction, historical narratives, literary translations, and collected essays.

---

### Shelf 07: Writing & Craft (28 Books)
*Dramaturgy, narrative structure, screenwriter masterclasses, and publication guides.*
- **Writing Craft Standalones** (28 titles) — *Save the Cat!*, *Story: Substance, Structure, Style*, *On Writing*, *The Anatomy of Story*, *Write That Book Already!*, *A Writer's Space*

---

### Shelf 08: Periodicals & Essays (20 Books)
*Serialized comic criticism, visual craft analysis, and sequential art journalism.*
- **PanelxPanel Magazine** (20 issues) — *Hassan Otsmane-Elhaou* (PanelxPanel)

---

## 4. Smart Dynamic Shelves

Smart shelves do not duplicate rows; they are dynamically computed views over active database state:

### Smart Shelf A: Reading Now (Active Progress)
- **Derivation Rule:** `trophy_progress.percent_read > 0 AND trophy_progress.completed = false`
- **Current Volume Count:** **24 books**
- **Sample Active Titles:**
  - *A Condition Called Love: Vol. 1* (5% read)
  - *Before My Heart's Broken* (7% read)
  - *A Tale of Two Meteors* (1% read)
  - *Strangers in Paradise: Vol. 1* (active session)

### Smart Shelf B: Continue Reading
- **Derivation Rule:** `ORDER BY trophy_progress.last_read_at DESC`
- **Current Volume Count:** **25 books** (All 25 preserved user progress records)
- **Features:** Surfaces cover tile, current page, total pages, and progress bar directly on the dashboard deck.

### Smart Shelf C: Recently Added
- **Derivation Rule:** `ORDER BY trophy_books.created_at DESC LIMIT 25`
- **Volume Count:** **25 titles**
- **Features:** Surfaces newly ingested titles for immediate discovery.

---

## 5. Success Criteria Verification Matrix

| Success Criterion | Target Metric | Status |
| :--- | :---: | :---: |
| **Every book assigned to exactly one primary shelf** | 1,389 / 1,389 (100.0%) | ✅ **VERIFIED** |
| **Reading Now generated from active progress** | 24 active books | ✅ **VERIFIED** |
| **Manga automatically routed via `medium = 'manga'`** | 436 books (RTL) | ✅ **VERIFIED** |
| **No orphaned titles** | 0 titles | ✅ **VERIFIED** |
| **Shelf counts total catalog count** | Exactly 1,389 | ✅ **VERIFIED** |
| **Zero impact on reading progress** | 25 / 25 preserved | ✅ **VERIFIED** |

---

## 6. Implementation Plan for Phase 4

Upon user approval:
1. **Frontend Sector Update:** Wire `SECTORS` and `getBookSector()` in [`WatchtowerSectorsGrid.tsx`](file:///C:/Users/danbi/.gemini/antigravity/scratch/rock-the-western-world/src/components/trophy-room/hub/WatchtowerSectorsGrid.tsx) and [`useTrophyLibrary.ts`](file:///C:/Users/danbi/.gemini/antigravity/scratch/rock-the-western-world/src/hooks/useTrophyLibrary.ts) to strictly reflect the 8 canonical primary shelves (`comic`, `manga`, `reference`, `cookbook`, `wellness`, `novel`, `writing`, `periodical`).
2. **Smart Shelf Deck:** Bind `ContinueReadingDeck.tsx` to the active `Reading Now` / `Continue Reading` queries.
3. **Generate Post-Execution Shelf Health Dashboard:** Create `SHELF-HEALTH-DASHBOARD.md` confirming live counts.
