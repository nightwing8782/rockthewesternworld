# Phase 2 Catalog Anomaly & Edge-Case Verification Report
**Document:** `PHASE2-ANOMALY-REPORT.md`  
**Generated:** 2026-10-17T14:40:38.874Z  
**Database Backup Reference:** `trophy_books_backup_2026-10-17T14-31-50-878Z.json` (1389 books)  
**Status:** **ANOMALY AUDIT COMPLETE • RECOMMENDATIONS STAGED**  

---

## 1. Executive Summary

This report performs a deep inspection across the five critical areas mandated prior to Phase 2 execution:
1. **Cookbook Medium Integrity:** Audit of all 128 books currently tagged with `medium = 'cookbook'`.
2. **Single-Volume Series Audit:** Investigation into the 97 series that currently contain only 1 volume.
3. **Echo Series Verification:** Verification of Terry Moore's sci-fi series.
4. **Black Science Verification:** Resolution of the critical misclassification bug where Image Comics' *Black Science* was cataloged as a cookbook.
5. **Adams 101 Reference Verification:** Verification of the 38-volume Adams Media reference library.

---

## 2. Audit of Proposed Series with `medium = 'cookbook'`

Total books currently marked `medium = 'cookbook'` in database: **128 books**.

### ⚠️ Critical Misclassifications Discovered:
The following **8 non-culinary titles** were erroneously marked as `cookbook` by legacy heuristic scripts:

| UUID | Current Title | File Key | Actual Genre & Author | Required Correction |
| :--- | :--- | :--- | :--- | :--- |
| `c2c70302...` | "Blackscience Vol1" | `books/cbz/BlackScience_vol1.cbz` | Sci-Fi Comic by Rick Remender (Image) | `medium = 'comic'`, `series = 'Black Science'` |
| `b2c107da...` | "Blackscience Vol2" | `books/cbz/blackscience_vol2.cbz` | Sci-Fi Comic by Rick Remender (Image) | `medium = 'comic'`, `series = 'Black Science'` |
| `f235e373...` | "Blackscience Vol3" | `books/cbz/blackscience_vol3.cbz` | Sci-Fi Comic by Rick Remender (Image) | `medium = 'comic'`, `series = 'Black Science'` |
| `3e35c450...` | "Blackscience Vol4" | `books/cbz/blackscience_vol4.cbz` | Sci-Fi Comic by Rick Remender (Image) | `medium = 'comic'`, `series = 'Black Science'` |
| `d40a616c...` | "Blackscience Vol5" | `books/cbz/blackscience_vol5.cbz` | Sci-Fi Comic by Rick Remender (Image) | `medium = 'comic'`, `series = 'Black Science'` |
| `30467770...` | "Bloodshotreborn Vol1" | `books/cbz/bloodshotreborn_vol1.cbz` | Superhero Comic by Jeff Lemire (Valiant) | `medium = 'comic'`, `series = 'Bloodshot Reborn'` |
| `6a80df3e...` | "Cpluspluscrashcourse" | `books/epub/cpluspluscrashcourse.epub` | C++ Programming by Josh Lospinoso | `medium = 'reference'`, `series = 'Standalone'` |
| `ee70725a...` | "Sweetintruder" | `books/cbz/sweetintruder.cbz` | Indie Comic | `medium = 'comic'`, `series = 'Standalone'` |

### ✅ Legitimate Cookbook Holdings (120 Books):
All remaining 120 titles are verified culinary masterworks:
- **Williams-Sonoma Masterclasses (22 volumes):** *Burger Night*, *Chicken Night*, *Pasta Night*, *Pizza Night*, *Taco Night*, *Rustic Italian*, *Rustic Spanish*, *Salad of the Day*, *School Night*, *Grill School*, *Gluten-Free Baking*, etc.
- **Iconic Culinary Guides:** *The Food Lab* (J. Kenji López-Alt), *Flour Water Salt Yeast* (Ken Forkish), *Salt Fat Acid Heat* (Samin Nosrat), *American Sfoglino*, *Modernist Bread*.
- **Healthy & Plant-Based Collections:** *The Vegan Athlete*, *What Vegans Eat*, *Delish Mediterranean Diet*, *Williams-Sonoma Weeknight Vegetarian*.

---

## 3. Audit of Proposed Series with Only 1 Volume

An audit of the current database catalog identified **97 series names that contain exactly 1 volume**. Under [**`METADATA-GUARDRAILS.md` (Guardrail 5)**](file:///C:/Users/danbi/.gemini/antigravity/scratch/rock-the-western-world/METADATA-GUARDRAILS.md), a single book must not constitute a series unless it is part of an ongoing multi-volume run.

### Root Causes & Remediation:

#### Category A: Volume Number Baked into the Series String (42 Series)
In these cases, legacy ingestion concatenated the volume number into the series name, splitting a single unified series into dozens of 1-book "series":
- `Astrocity Vol. 8tpdigital` $	o$ Merge into **`series = 'Astro City'`**, `volume_number = 8`
- `Astrocity Vol. 12tpdigital` $	o$ Merge into **`series = 'Astro City'`**, `volume_number = 12`
- `usagiyojimbosagavolume4secondedition` $	o$ Merge into **`series = 'Usagi Yojimbo'`**, `volume_number = 4`
- `spaceusagi_deathandhonor` $	o$ Merge into **`series = 'Usagi Yojimbo'`**
- `Slainebookofinvasions1` $	o$ Merge into **`series = 'Sláine'`**, `volume_number = 1`
- `Judge Dredd` (1 stray volume) $	o$ Merge into **`series = 'Judge Dredd: The Complete Case Files'`**

#### Category B: True Standalone One-Shots & Monographs (55 Series)
Single-volume novels, non-fiction books, and manga one-shots that were given their own title as a series name:
- Examples: *Anime Impact* (anime history book), *Day Trading 101*, *Perl One-Liners*, *At the Class President's Beck and Call* (manga one-shot), *A Touch of the Love Bug* (manga one-shot).
- **Remediation:** Set **`series = 'Standalone'`** while preserving their clean canonical title and medium.

---

## 4. Verification of *Echo* by Terry Moore

- **Creator:** Terry Moore (Abstract Studios)
- **Publication Form:** 6 Trade Paperbacks collecting the complete 30-issue sci-fi run.
- **Physical Format in Collection:** 6 PDF editions in `books/pdf/`.
- **Integrity Check:**
  1. `books/pdf/echov1_moonlake.pdf` $	o$ *Echo: Vol. 1 – Moon Lake*
  2. `books/pdf/echov2_atomicdreams.pdf` $	o$ *Echo: Vol. 2 – Atomic Dreams*
  3. `books/pdf/echov3_desertrun.pdf` $	o$ *Echo: Vol. 3 – Desert Run*
  4. `books/pdf/echov4_collider.pdf` $	o$ *Echo: Vol. 4 – Collider*
  5. `books/pdf/echov5_blackhole.pdf` $	o$ *Echo: Vol. 5 – Black Hole*
  6. `books/pdf/echov6_thelastday.pdf` $	o$ *Echo: Vol. 6 – The Last Day*
- **Canonical Metadata:**
  - **Series:** `Echo`
  - **Franchise:** `Terry Moore Universe`
  - **Medium:** `comic`
  - **Reading Direction:** `ltr`
  - **Author:** `Terry Moore`
  - **Publisher:** `Abstract Studios`
  - **Status:** ✅ **100% VERIFIED AND ACCURATELY STRUCTURED**

---

## 5. Verification of *Black Science* by Rick Remender

- **Creators:** Rick Remender (Writer) & Matteo Scalera (Artist)
- **Publisher:** Image Comics
- **Genre:** Dimension-hopping Science Fiction
- **Physical Format in Collection:** 5 CBZ archives in `books/cbz/`.
- **Integrity Check:**
  1. `books/cbz/BlackScience_vol1.cbz` $	o$ *Black Science: Vol. 1 – How to Fall Forever*
  2. `books/cbz/blackscience_vol2.cbz` $	o$ *Black Science: Vol. 2 – Welcome, Nowhere*
  3. `books/cbz/blackscience_vol3.cbz` $	o$ *Black Science: Vol. 3 – Vanishing Pattern*
  4. `books/cbz/blackscience_vol4.cbz` $	o$ *Black Science: Vol. 4 – Godworld*
  5. `books/cbz/blackscience_vol5.cbz` $	o$ *Black Science: Vol. 5 – True Atonement*
- **The Bug:** Erroneously flagged with `medium = 'cookbook'` in legacy ingestion.
- **Canonical Metadata Correction:**
  - **Series:** `Black Science`
  - **Medium:** `comic` (replaces erroneous `cookbook`)
  - **Reading Direction:** `ltr`
  - **Author:** `Rick Remender`
  - **Publisher:** `Image Comics`
  - **Status:** ✅ **FIX STAGED FOR EXECUTION IN PHASE 2**

---

## 6. Verification of *Adams 101 Reference Series*

- **Publisher:** Adams Media (Imprint of Simon & Schuster)
- **Category:** Educational & Academic Primers
- **Physical Format in Collection:** 38 EPUB editions in `books/epub/`.
- **Holdings Sample:**
  - *US History 101*, *World History 101*, *American Government 101*, *Economics 101*, *Philosophy 101*, *Psychology 101*, *Anatomy 101*, *Astronomy 101*, *Mythology 101*, *Personal Finance 101*, *Management 101*, *Weather 101*, etc.
- **Canonical Metadata:**
  - **Series:** `Adams 101 Reference Series`
  - **Medium:** `reference`
  - **Reading Direction:** `ltr`
  - **Publisher:** `Adams Media`
  - **Title Normalization:** Un-squish compound titles (e.g. `Americangovernment101` $	o$ `American Government 101`).
  - **Status:** ✅ **100% VERIFIED AND ACCURATELY STRUCTURED**

---

## 7. Final Recommendations for Phase 2 Execution Script

1. **Include Cookbook Cleansing:** In addition to series updates, fix the 8 misclassified non-cookbooks (*Black Science* 1–5, *Bloodshot Reborn*, *C++ Crash Course*, *Sweet Intruder*) by switching them to `comic` or `reference`.
2. **Consolidate 1-Volume Series:**
   - Unify the 42 fragmented volumes (*Astro City*, *Usagi Yojimbo*, *Sláine*) into their parent series.
   - Demote the 55 true one-shots to `series = 'Standalone'`.
3. **Execute Zero-Deletion Updates:** Keep all 1,389 records and 25 progress rows preserved.
