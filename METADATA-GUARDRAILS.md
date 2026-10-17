# Trophy Room Metadata Guardrails & Ingestion Architecture
**Platform:** Rock The Western World • The Trophy Room  
**Document:** `METADATA-GUARDRAILS.md`  
**Status:** Approved Policy • Active Engineering Contract  
**Governing Documents:** ADR-002, ADR-004, `TROPHY-ROOM-METADATA-AUDIT.md`  

---

## 1. Purpose & Core Philosophy

### 1.1 Purpose
Prevent metadata debt and catalog entropy from re-entering the Trophy Room as new books and archives are added to the vault.

The goal of these guardrails is to ensure that every new title entering the collection is:
- **Properly named** (clean casing, un-squished words, no browser artifacts)
- **Properly classified** (canonical medium and taxonomy)
- **Properly grouped into a series** (deterministic series naming, never lumped)
- **Properly deduplicated** (SHA256 hash collision checks before database writes)
- **Properly covered** (100% visual cover art extraction)
- **Properly searchable** (authors, publishers, genres indexed)

This policy applies universally to all future imports regardless of entry vector:
- Browser-based manual uploads (Dropzone in `useTrophyLibrary.ts`)
- Bulk CLI imports (`bulk_ingest_trophy.js`)
- Cloudflare R2 bucket synchronization
- Local archive ingestion (`Ebooks/` folder sweeps)

---

### 1.2 Library Philosophy
> *The Trophy Room behaves like an elite private library and cultural archive, never a raw filesystem browser.*

Raw filenames and storage keys are allowed in Cloudflare R2 storage for filesystem compatibility. However, **users must only ever see canonical, curated metadata** in the UI and database.

**Example:**
- **Storage Key:** `books/epub/blueperiod_vol12.epub`
- **Display Title:** `Blue Period: Vol. 12`
- **Series:** `Blue Period`
- **Volume:** `12`
- **Medium:** `manga`
- **Reading Direction:** `rtl`

---

## 2. The Twelve Ingestion Guardrails

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GUARDRAIL INGESTION PIPELINE ARCHITECTURE                 │
│                                                                             │
│   [ Ingestion Stream ]                                                      │
│   (Upload / R2 Sync)                                                        │
│            │                                                                │
│            ▼                                                                │
│   [ G1: Import Staging ] ──── Compute SHA256 ────► [ G2: Hash Deduplication ] │
│            │                                                 │              │
│            │ Valid Hash                                      │ Collision    │
│            ▼                                                 ▼              │
│   [ G6: Embedded Metadata ] (OPF / ComicInfo)     [ Quarantine / Reject ]   │
│            │                                                                │
│            ▼                                                                │
│   [ G3 / G4: Title & Vol Normalization ] ("Vol. X", Artifact Stripping)    │
│            │                                                                │
│            ▼                                                                │
│   [ G5 / G8 / G9: Series, Medium & Direction ] (RTL Manga, LTR Comics)      │
│            │                                                                │
│            ▼                                                                │
│   [ G7: Cover Extraction ] (Extract & upload to covers/ if missing)         │
│            │                                                                │
│            ▼                                                                │
│   [ G10: Validation Gate ] (Confidence >= 80%?)                             │
│       ├── YES ──► Commit to Supabase Catalog & Production Shelves           │
│       └── NO  ──► Route to Import Review Queue                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Guardrail 1: Import Staging & Non-Direct Commits
New books must **never** be inserted directly into production catalog tables (`trophy_books`) upon upload.

Every incoming volume must traverse the sequential validation pipeline:
1. **Upload / Stream Reception**
2. **Checksum Generation & Hash Deduplication**
3. **Embedded Metadata Extraction**
4. **Display Title & Volume Normalization**
5. **Series Association & Medium Tagging**
6. **Cover Extraction & Dimension Validation**
7. **Quality Gate Verification**

Any volume failing validation or triggering ambiguity triggers is quarantined in the **Import Review Queue** for author review rather than polluting the active library.

---

### Guardrail 2: Cryptographic Duplicate Detection (SHA256)
Every incoming file must generate a **SHA256 checksum** prior to catalog insertion.

#### A. Exact Duplicate Check
- **Condition:** $\text{Incoming SHA256} \equiv \text{Existing SHA256}$
- **Action:** **REJECT IMPORT IMMEDIATELY.**
- **Log / User Notice:** *"Duplicate content already exists in the Trophy Room under key: `{existing_key}`."*

#### B. Probable Duplicate / Variant Check
- **Condition:** $\text{Same Series} \land \text{Same Volume} \land \text{Different SHA256}$
- **Action:** **QUARANTINE FOR REVIEW.**
- **Rationale:** Identifies revised translations, digital vs print remasters, or corrupted uploads (e.g. *Blue Period: Vol. 4* vs *Blue Period: Vol. 4 (Digital Remaster)*). Human decision required before cataloging.

---

### Guardrail 3: Filename & Title Sanitization
Remove all filesystem and download artifacts before display metadata is generated:
- Download iteration counters: `__1_`, `__2_`, `(1)`, `(2)`, `_1.`, `_2.`
- Filesystem copy markers: `copy`, `copy 2`, `[Digital]`, `(webrip)`
- Stuttered volume tokens: `volvol` $\to$ `Vol. `

**Example:**
- **Raw File:** `transformers_morethanmeetstheeye_vol9__1_.cbz`
- **Storage Key:** `books/cbz/transformers_morethanmeetstheeye_vol9__1_.cbz` (Preserved in storage)
- **Canonical Title:** `Transformers: More Than Meets The Eye: Vol. 9`
- **Canonical Series:** `Transformers: More Than Meets The Eye`
- **Volume Number:** `9`

---

### Guardrail 4: Canonical Volume Rules
The **only approved volume syntax** in the Trophy Room is:
$$\text{Vol. } X \quad (X \in \mathbb{N} \lor X \in \mathbb{R}^+)$$

All variations must be converted at ingestion:
| Raw Ingestion Variation | Approved Canonical Output |
| :--- | :--- |
| `Vol 1`, `Vol.1`, `volume 1`, `Volume1` | **`Vol. 1`** |
| `v1`, `v01`, `V. 01`, `v.1` | **`Vol. 1`** |
| `Book 1`, `Bk 1`, `Bk. 1` | **`Vol. 1`** |
| `#1`, `No. 1`, `Issue 1` | **`#1`** (for single periodical comic issues) |
| `VolVol 3` (glitch artifact) | **`Vol. 3`** |

---

### Guardrail 5: Series Normalization
Every title admitted to the collection must belong to one of three structural categories:
1. **Canonical Series:** Dedicated multi-volume run (e.g. *Hellboy*, *Judge Dredd: The Complete Case Files*, *Blue Period*).
2. **Standalone:** Single-volume monograph, novel, or guide.
3. **Periodical:** Ongoing serialized magazine or theoretical journal (e.g. *PanelxPanel Magazine*).

#### Strictly Prohibited Series Values:
The following generic placeholders are **strictly forbidden** as series values in `trophy_books`:
- ❌ `Comics`
- ❌ `Manga`
- ❌ `Books`
- ❌ `Novels`
- ❌ `Miscellaneous`
- ❌ `Unknown`
- ❌ `.` or empty string `""`

---

### Guardrail 6: Embedded Metadata Priority
Metadata extraction must prioritize author/publisher-embedded structured files over heuristic filename guessing:

#### A. EPUB Priority
1. `content.opf` $\to$ `<dc:title>`
2. `<dc:creator>` (Author attribution)
3. `<dc:publisher>`
4. `<dc:language>`
5. `<meta property="belongs-to-collection">` (Series metadata)
6. *Fallback:* Filename heuristics

#### B. CBZ Priority
1. `ComicInfo.xml` $\to$ `<Series>`, `<Title>`, `<Number>`, `<Volume>`
2. `<Writer>` & `<Penciller>`
3. `<Publisher>`
4. *Fallback:* Filename heuristics

#### C. PDF Priority
1. Embedded document dictionary metadata (`Title`, `Author`, `Subject`)
2. *Fallback:* Filename heuristics

---

### Guardrail 7: 100% Cover Coverage Preservation
Every imported title must be provisioned with high-resolution visual cover art before appearing on public shelves.

#### Cover Extraction Hierarchy:
- **EPUB:** Extract declared `<meta name="cover">` / `<item properties="cover-image">` $\to$ Fallback to first image in spine $\to$ Upload to `covers/{safe_name}.jpg`.
- **CBZ:** Extract `cover.jpg` / `cover.png` $\to$ Fallback to natural-sorted first page entry $\to$ Upload to `covers/{safe_name}.jpg`.
- **PDF:** Render page 1 canvas thumbnail $\to$ Upload to `covers/{safe_name}.jpg`.

No book may render with a generic gray placeholder tile once ingestion is complete.

---

### Guardrail 8: Canonical Publication-Type Medium
Every title must be assigned a typed medium upon ingestion:

```typescript
export type TrophyMedium =
  | 'comic'       // Western comic books, trade paperbacks, graphic novels
  | 'manga'       // Japanese manga, manhua, manhwa (RTL spread engine)
  | 'novel'       // Reflowable prose literature, fiction, essays
  | 'cookbook'    // Culinary masterworks, recipes, food science
  | 'reference'   // Adams 101s, practical skills, coding, technical guides
  | 'writing'     // Screenwriting, narrative theory, prose craft
  | 'wellness'    // Cognitive health, mindfulness, psychology
  | 'periodical'; // Magazines, cultural journals, comic theory
```

---

### Guardrail 9: Automated Reading Direction Assignment
The reading engine direction must be assigned automatically at ingestion:

| Medium / Publication Class | Reading Direction | Engine Routing |
| :--- | :---: | :--- |
| **Manga** (*Blue Period*, *Vinland Saga*, *Lone Wolf and Cub*, etc.) | `rtl` | `CbzReader` (Image Spreads) |
| **Comics** (*Judge Dredd*, *Peanuts*, *Hellboy*, etc.) | `ltr` | `CbzReader` (Image Spreads) |
| **Reflowable Novels** | `ltr` | `EpubReader` (`ePub.js`) |
| **PDF Documents** | `ltr` | `PdfReader` (`pdf.js`) |

---

### Guardrail 10: Human Review Triggers & Quarantine
An incoming title must be automatically diverted to the **Import Review Queue** if any of the following triggers fire:
1. **Hash Mismatch with Existing Volume:** Incoming file matches series & volume of an existing title, but SHA256 checksum differs.
2. **Missing Title / Empty String:** Unable to determine a clean title.
3. **Missing Cover Art:** Extraction fails across all fallback strategies.
4. **Generic Series Ambiguity:** Book has multiple volumes but series cannot be identified beyond "Comics" or "Manga".
5. **Confidence Score < 80%:** Heuristic parser flags conflicting metadata between filename and embedded OPF/XML.

Quarantined books **never appear in production shelves** until approved by the author.

---

### Guardrail 11: Continuous Catalog Health Audit
Automated audit routines (`scripts/audit_catalog.js`) run periodically to monitor library health:
- Duplicate hash scans
- Duplicate title scans
- Orphaned reading progress pointers
- Missing cover asset checks (verifying 200 OK on R2 CDN)
- Missing author / publisher rates
- Broken file key references

Audit results are output to `backups/metadata_audit_report.json` and summarized in `backups/METADATA-HEALTH-DASHBOARD.md`.

---

### Guardrail 12: Target Data Quality Scorecard

Every future state of the catalog must meet or exceed these operational thresholds:

| Metric | Minimum Target | Phase 1 Baseline | Target Status |
| :--- | :---: | :---: | :---: |
| **Duplicate Rate** | **< 0.1%** | **0.0%** (10 deleted) | ✅ **Achieved** |
| **Cover Art Coverage** | **> 99.0%** | **77.1%** (320 missing) | ⏳ *Phase 3 Focus* |
| **Canonical Series Assignment** | **> 95.0%** | **69.2%** (431 in "Comics") | ⏳ *Phase 2 Focus* |
| **Author Coverage** | **> 90.0%** | **38.5%** | ⏳ *Phase 3 Focus* |
| **Publisher Coverage** | **> 90.0%** | **32.8%** | ⏳ *Phase 3 Focus* |
| **Canonical Volume Syntax** | **100.0%** | **94.2%** | ✅ **Phase 1 Shipped** |
| **Language Tag Coverage** | **> 95.0%** | **0.0%** | ⏳ *Phase 3 Focus* |

---

## 3. Implementation Verification & Enforcement

All ingestion scripts, client upload hooks, and synchronization jobs must import and enforce these rules before committing records to Supabase:
- **Client Upload:** `src/hooks/useTrophyLibrary.ts`
- **Metadata Parser:** `src/lib/trophy/metadataExtractor.ts`
- **Sector Classifier:** `src/lib/trophy/sectorClassifier.ts`
- **CLI Sync Tools:** `scripts/bulk_ingest_trophy.js`

*Any code modification introducing raw, unvalidated records into `trophy_books` violates this architectural standard.*
