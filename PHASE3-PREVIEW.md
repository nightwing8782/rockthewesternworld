# Phase 3 Remediation Plan: Metadata Enrichment & Cover Recovery Manifest
**Document:** `PHASE3-PREVIEW.md`  
**Generated:** 2026-10-17T15:05:41.439Z  
**Database Backup Reference:** `trophy_books_backup_2026-10-17T14-45-39-909Z.json` (1389 books)  
**Status:** **AWAITING USER REVIEW • ZERO WRITES EXECUTED**  

---

## 1. Executive Summary of Proposed Changes

Phase 3 targets the two largest remaining data deficiencies identified in the [**Metadata Audit**](file:///C:/Users/danbi/.gemini/antigravity/scratch/rock-the-western-world/TROPHY-ROOM-METADATA-AUDIT.md):
1. **Cover Art Recovery:** Extracting and uploading high-resolution visual cover art for the **311 books** currently rendering with blank gray placeholder tiles in Cloudflare R2 and Supabase.
2. **Creator & Publisher Attribution:** Populating authoritative author, illustrator, and publisher metadata across flagship runs and embedded archives.
3. **Manga Reading Direction Lockdown:** Verifying that 100% of manga publications have `reading_direction = 'rtl'`.

### Impact Overview
| Metric | Current State | Target Post-Phase 3 State |
| :--- | :---: | :---: |
| **Catalog Cover Coverage** | 1,078 / 1,389 (77.6%) | **1,389 / 1,389 (100.0%)** |
| **Missing Cover Tiles** | **311 books** | **0 books** (100% covered) |
| **Author / Creator Coverage** | 42.1% | **> 85.0%** |
| **Publisher Coverage** | 35.6% | **> 80.0%** |
| **Manga RTL Compliance** | 98.6% | **100.0%** |
| **Reading Progress Preserved** | **100% (25/25)** | **Zero mutations to progress** |

---

## 2. Itemized Cover Recovery Analysis (311 Books)

### Format Breakdown of Missing Covers:
- **PDF Documents:** **309 books** (Scanned graphic novel collections, trade paperbacks, culinary masterclasses, and *Terry Moore* runs).
- **CBZ / CBR Archives:** **1 book** (*Criminal: Vol. 2*).
- **EPUB eBooks:** **1 book** (*Vegan Holiday Cookbook*).

### Major Series Impacted by Missing Covers:
### 1. EC Comics Library (37 Missing Covers)
- **Format:** PDF
- **Extraction Strategy:** Page 1 high-resolution raster extraction via `pypdf` + Pillow $\to$ R2 `covers/` upload.
- **Sample Titles:**
  - `016a47a1...`: "Livingmummyandotherstories" (`livingmummyandotherstories.pdf`)
  - `02a11a32...`: "Deadlybelovedandotherstories" (`deadlybelovedandotherstories.pdf`)
  - `062d8048...`: "Taintthemeatitsthehumanityandotherstories" (`taintthemeatitsthehumanityandotherstories.pdf`)
  - `07b76b7c...`: "Planetoidandotherstories" (`planetoidandotherstories.pdf`)
  - *...and 33 more volumes.*

### 2. The Complete Peanuts (28 Missing Covers)
- **Format:** PDF
- **Extraction Strategy:** Page 1 high-resolution raster extraction via `pypdf` + Pillow $\to$ R2 `covers/` upload.
- **Sample Titles:**
  - `036189be...`: "Peanutseverysunday1991 1995" (`peanutseverysunday1991-1995.pdf`)
  - `042be157...`: "Peanutsgamedaycollection" (`peanutsgamedaycollection.pdf`)
  - `12727fb1...`: "Completepeanuts1955 1956" (`completepeanuts1955-1956__1_.pdf`)
  - `159a1996...`: "Completepeanuts1991 1992" (`completepeanuts1991-1992.pdf`)
  - *...and 24 more volumes.*

### 3. B.P.R.D. (24 Missing Covers)
- **Format:** PDF
- **Extraction Strategy:** Page 1 high-resolution raster extraction via `pypdf` + Pillow $\to$ R2 `covers/` upload.
- **Sample Titles:**
  - `0ce5fcd8...`: "Bprdvolume 9 1946" (`bprdvolume9_1946.pdf`)
  - `112b665c...`: "Hellboyandthebprd Thesevenwivesclubone Shot" (`hellboyandthebprd_thesevenwivesclubone-shot.pdf`)
  - `13096265...`: "Bprdvolume 10 Thewarning" (`bprdvolume10_thewarning.pdf`)
  - `16d629b2...`: "Bprd Thedevilyouknowvolume 2 Pandemonium" (`bprd_thedevilyouknowvolume2_pandemonium.pdf`)
  - *...and 20 more volumes.*

### 4. Strangers in Paradise (21 Missing Covers)
- **Format:** PDF
- **Extraction Strategy:** Page 1 high-resolution raster extraction via `pypdf` + Pillow $\to$ R2 `covers/` upload.
- **Sample Titles:**
  - `00a93c14...`: "Strangers in Paradise V 19 Everafter" (`strangersinparadisev19_everafter.pdf`)
  - `03ab0bde...`: "Strangers in Paradise V 13 Flowertoflame" (`strangersinparadisev13_flowertoflame.pdf`)
  - `173731f5...`: "Strangers in Paradise V 7 Sanctuary" (`strangersinparadisev7_sanctuary.pdf`)
  - `18c449e0...`: "Strangers in Paradise V 6 Highschool" (`strangersinparadisev6_highschool.pdf`)
  - *...and 17 more volumes.*

### 5. Standalone (21 Missing Covers)
- **Format:** PDF
- **Extraction Strategy:** Page 1 high-resolution raster extraction via `pypdf` + Pillow $\to$ R2 `covers/` upload.
- **Sample Titles:**
  - `04be06c1...`: "Goodhousekeepingchristmascookieswap" (`goodhousekeepingchristmascookieswap.pdf`)
  - `0be49eb3...`: "Foodnetworkmagazinechocolateloverscookbook" (`foodnetworkmagazinechocolateloverscookbook.pdf`)
  - `0d781e16...`: "Preventionultimateeatcleancookbook" (`preventionultimateeatcleancookbook.pdf`)
  - `17c4cf2c...`: "Preventionplant Basedeatingmadeeasy" (`preventionplant-basedeatingmadeeasy.pdf`)
  - *...and 17 more volumes.*

### 6. PanelxPanel Magazine (20 Missing Covers)
- **Format:** PDF
- **Extraction Strategy:** Page 1 high-resolution raster extraction via `pypdf` + Pillow $\to$ R2 `covers/` upload.
- **Sample Titles:**
  - `0588af89...`: "Panelx Panel #44" (`PanelxPanel_No44.pdf`)
  - `193078e4...`: "Panelx Panel #39" (`PanelxPanel_No39.pdf`)
  - `1a2fdf4d...`: "Panelx Panel #43" (`PanelxPanel_No43.pdf`)
  - `1be058a9...`: "Panelx Panel #49" (`PanelxPanel_No49.pdf`)
  - *...and 16 more volumes.*

### 7. Hellboy (17 Missing Covers)
- **Format:** PDF
- **Extraction Strategy:** Page 1 high-resolution raster extraction via `pypdf` + Pillow $\to$ R2 `covers/` upload.
- **Sample Titles:**
  - `013c7526...`: "Hellboyvolume 1 Seedofdestruction" (`hellboyvolume1_seedofdestruction.pdf`)
  - `1fa743fb...`: "Hellboyvslobsterjohnsonin Theringofdeathone Shot" (`hellboyvslobsterjohnsonin_theringofdeathone-shot.pdf`)
  - `4099886b...`: "Hellboyvolume 9 Thewildhunt" (`hellboyvolume9_thewildhunt.pdf`)
  - `4aa9a9d0...`: "Hellboy Intothesilentsea" (`hellboy_intothesilentsea.pdf`)
  - *...and 13 more volumes.*

### 8. Cerebus (17 Missing Covers)
- **Format:** PDF
- **Extraction Strategy:** Page 1 high-resolution raster extraction via `pypdf` + Pillow $\to$ R2 `covers/` upload.
- **Sample Titles:**
  - `098bd24c...`: "Highsociety Aardvarkvanaheim" (`highsociety_aardvarkvanaheim.pdf`)
  - `1cf1ac37...`: "Reads Aardvarkvanaheim" (`reads_aardvarkvanaheim.pdf`)
  - `1ecca0bc...`: "Women Aardvarkvanaheim" (`women_aardvarkvanaheim.pdf`)
  - `2051bd38...`: "Cerebus Aardvarkvanaheim" (`cerebus_aardvarkvanaheim.pdf`)
  - *...and 13 more volumes.*

### 9. Tynion (16 Missing Covers)
- **Format:** PDF
- **Extraction Strategy:** Page 1 high-resolution raster extraction via `pypdf` + Pillow $\to$ R2 `covers/` upload.
- **Sample Titles:**
  - `0211f774...`: "Somethingiskillingthechildren Vol8" (`somethingiskillingthechildren_vol8.pdf`)
  - `25a83042...`: "Closet Vol1" (`closet_vol1.pdf`)
  - `3ca9b3a5...`: "Departmentoftruth Vol1" (`departmentoftruth_vol1.pdf`)
  - `45b04688...`: "Departmentoftruth Vol2" (`departmentoftruth_vol2.pdf`)
  - *...and 12 more volumes.*

### 10. Astro City (16 Missing Covers)
- **Format:** PDF
- **Extraction Strategy:** Page 1 high-resolution raster extraction via `pypdf` + Pillow $\to$ R2 `covers/` upload.
- **Sample Titles:**
  - `0443e2ed...`: "Astrocity Vol. 8tpdigital" (`astrocity_vol8tpdigital.pdf`)
  - `062692f1...`: "Astrocity Vol. 12tpdigital" (`astrocity_vol12tpdigital.pdf`)
  - `379e6798...`: "Astrocity Vol. 15tpdigital" (`astrocity_vol15tpdigital.pdf`)
  - `37afd303...`: "Astrocity Vol. 10tpdigital" (`astrocity_vol10tpdigital.pdf`)
  - *...and 12 more volumes.*

### 11. Radiant Black (14 Missing Covers)
- **Format:** PDF
- **Extraction Strategy:** Page 1 high-resolution raster extraction via `pypdf` + Pillow $\to$ R2 `covers/` upload.
- **Sample Titles:**
  - `018fb06e...`: "Roguesun Vol 1" (`roguesun_vol1.pdf`)
  - `1325afaf...`: "Deadlucky Vol 1" (`deadlucky_vol1.pdf`)
  - `29835015...`: "Cowl Vol 2 Thegreatergood" (`cowl_vol2thegreatergood.pdf`)
  - `30963a1a...`: "Radiantblack Vol 3" (`radiantblack_vol3.pdf`)
  - *...and 10 more volumes.*

### 12. B.P.R.D.: Hell on Earth (12 Missing Covers)
- **Format:** PDF
- **Extraction Strategy:** Page 1 high-resolution raster extraction via `pypdf` + Pillow $\to$ R2 `covers/` upload.
- **Sample Titles:**
  - `0ee7e148...`: "Bprdhellonearthvolume 3 Russia" (`bprdhellonearthvolume3_russia.pdf`)
  - `2522d0f8...`: "Bprdhellonearthvolume 5 Thepickenscountyhorrorandothers" (`bprdhellonearthvolume5_thepickenscountyhorrorandothers.pdf`)
  - `321bc6c5...`: "Bprdhellonearthvolume 12 Metamorphosis" (`bprdhellonearthvolume12_metamorphosis.pdf`)
  - `3e0c7436...`: "Bprdhellonearthvolume 2 Godsandmonsters" (`bprdhellonearthvolume2_godsandmonsters.pdf`)
  - *...and 8 more volumes.*

### 13. 5-Minute Therapy Series (10 Missing Covers)
- **Format:** PDF
- **Extraction Strategy:** Page 1 high-resolution raster extraction via `pypdf` + Pillow $\to$ R2 `covers/` upload.
- **Sample Titles:**
  - `20f15ab8...`: "Unfuckyourintimacyworkbook" (`unfuckyourintimacyworkbook__2_.pdf`)
  - `2ccee973...`: "Unfuckyourworthworkbook" (`unfuckyourworthworkbook__1_.pdf`)
  - `3014fac4...`: "Unfuckyourbrainworkbook" (`unfuckyourbrainworkbook__1_.pdf`)
  - `758f7ca0...`: "Unfuckyourangerworkbook" (`unfuckyourangerworkbook__1_.pdf`)
  - *...and 6 more volumes.*

### 14. Something is Killing the Children (9 Missing Covers)
- **Format:** PDF
- **Extraction Strategy:** Page 1 high-resolution raster extraction via `pypdf` + Pillow $\to$ R2 `covers/` upload.
- **Sample Titles:**
  - `6f6b3a50...`: "Houseofslaughter Vol4" (`houseofslaughter_vol4.pdf`)
  - `7ab9ec9b...`: "Houseofslaughter Vol6" (`houseofslaughter_vol6.pdf`)
  - `7b1d9cd4...`: "Houseofslaughter Vol5" (`houseofslaughter_vol5.pdf`)
  - `7c80915c...`: "Houseofslaughter Vol2" (`houseofslaughter_vol2.pdf`)
  - *...and 5 more volumes.*

### 15. Rachel Rising (7 Missing Covers)
- **Format:** PDF
- **Extraction Strategy:** Page 1 high-resolution raster extraction via `pypdf` + Pillow $\to$ R2 `covers/` upload.
- **Sample Titles:**
  - `1d6687af...`: "Rachelrisingv 4 Wintergraves" (`rachelrisingv4_wintergraves.pdf`)
  - `9d446f76...`: "Rachelrisingv 5 Nightcometh" (`rachelrisingv5_nightcometh.pdf`)
  - `adf47d65...`: "Rachelrisingv 1 Theshadowofdeath" (`rachelrisingv1_theshadowofdeath.pdf`)
  - `b74476a1...`: "Rachelrisingv 2 Fearnomalus" (`rachelrisingv2_fearnomalus.pdf`)
  - *...and 3 more volumes.*

---

## 3. Author & Publisher Attribution Strategy

Phase 3 enriches author and publisher metadata through a two-tiered pipeline:
1. **Tier 1: Canonical Series Imprints:** Populating master credits across verified multi-volume collections:
   - *The Complete Peanuts* $\to$ Author: **Charles M. Schulz** | Publisher: **Fantagraphics Books**
   - *Terry Moore Universe* (*Strangers in Paradise*, *Echo*, *Rachel Rising*, *Motor Girl*) $\to$ Author: **Terry Moore** | Publisher: **Abstract Studios**
   - *Hellboy & B.P.R.D.* $\to$ Authors: **Mike Mignola, John Arcudi, Guy Davis** | Publisher: **Dark Horse Comics**
   - *EC Comics Library* $\to$ Publisher: **Fantagraphics Books**
   - *Love and Rockets* $\to$ Authors: **Gilbert & Jaime Hernandez** | Publisher: **Fantagraphics Books**
   - *Usagi Yojimbo* $\to$ Author: **Stan Sakai** | Publisher: **Dark Horse Comics**
   - *Cerebus* $\to$ Author: **Dave Sim** | Publisher: **Aardvark-Vanaheim**
   - *Adams 101 Reference Series* $\to$ Publisher: **Adams Media**
   - *5-Minute Therapy Series* $\to$ Author: **Dr. Faith G. Harper** | Publisher: **Microcosm Publishing**
   - *Williams-Sonoma Culinary Collection* $\to$ Publisher: **Weldon Owen**
2. **Tier 2: Embedded Metadata Extraction:** Parsing local EPUB `content.opf` (`<dc:creator>`, `<dc:publisher>`) and CBZ `ComicInfo.xml` for remaining standalone works.

---

## 4. Manga Reading Direction Audit

Ensuring 100% compliance with [**`METADATA-GUARDRAILS.md` (Guardrail 9)**](file:///C:/Users/danbi/.gemini/antigravity/scratch/rock-the-western-world/METADATA-GUARDRAILS.md):
- All titles with `medium = 'manga'` are assigned `reading_direction = 'rtl'` to automatically route through the dual-page manga spread engine.
- Western comics and prose novels remain locked to `reading_direction = 'ltr'`.

---

## 5. Execution Safeguards & Zero-Loss Guarantees

1. **Non-Destructive Operations:** Phase 3 only performs `UPDATE trophy_books SET cover_url = ..., author = ..., publisher = ...`. Zero rows are deleted.
2. **Cloud Storage Safeguard:** Extracted covers are uploaded to Cloudflare R2 under `covers/{safe_basename}.jpg` with `image/jpeg` content types and public cache headers.
3. **Atomic Progress Links:** All 25 active reading progress records remain untouched and linked.
4. **Audit Trail:** Every upload and database update is logged to `backups/phase3_execution.log`.
