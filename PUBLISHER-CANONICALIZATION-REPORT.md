# PUBLISHER-CANONICALIZATION-REPORT.md

**Generated:** 2026-10-17  
**Catalog Scope:** 1,145 Credited Books Across 57 Distinct Publisher Strings  
**Status:** **AUDIT COMPLETE • CANONICALIZATION PLAN READY**

---

## 1. Executive Summary

An audit of all 57 distinct publisher entities currently recorded in Supabase `trophy_books.publisher` was performed.

### Quality Baseline:
- **Total Books with Publisher Metadata:** **1,145 / 1,389 (82.4%)**
- **Distinct Publisher Strings:** **57**
- **Entity Suffix Variants (`Inc.`, `LLC`, `Ltd.`):** **5 clusters (72 books affected)**
- **Imprint Duplication (`Kodansha` vs `Kodansha Comics`):** **1 cluster (265 books affected)**
- **Slash Co-Publishing Artifacts (`BOOM! Studios / Image`):** **2 clusters (41 books affected)**
- **Capitalization / Typo Variants (`Weldonowen` vs `Weldon Owen`):** **2 clusters (2 books affected)**

---

## 2. Itemized Anomaly Clusters & Normalization Mappings

### Cluster 1: Legal Entity Suffix Inconsistencies (`Inc.`, `LLC`, `Ltd.`)
Publishers should be recorded by their consumer-facing imprint name rather than their corporate incorporation suffix.

| Current Variant | Catalog Count | Canonical Name | Rationale |
| :--- | :---: | :--- | :--- |
| `No Starch Press, Inc.` | 9 | **No Starch Press** | Strip legal entity suffix |
| `No Starch Press` | 9 | **No Starch Press** | Already canonical |
| `Chronicle Books LLC` | 36 | **Chronicle Books** | Strip legal entity suffix |
| `Chronicle Books` | 2 | **Chronicle Books** | Already canonical |
| `Chronicle` | 1 | **Chronicle Books** | Normalize colloquial shorthand |
| `Microcosm Publishing LLC` | 1 | **Microcosm Publishing** | Strip legal entity suffix |
| `Microcosm Publishing` | 25 | **Microcosm Publishing** | Already canonical |
| `O'Reilly Media, Inc.` | 15 | **O'Reilly Media** | Strip legal entity suffix |
| `O'Reilly Media` | 3 | **O'Reilly Media** | Already canonical |
| `Vertical Inc.` | 7 | **Vertical** | Strip legal entity suffix |
| `Vertical` | 2 | **Vertical** | Already canonical |

---

### Cluster 2: Manga Imprint Segmentation (`Kodansha` vs `Kodansha Comics`)
In the current catalog, Kodansha titles are split across two separate labels:
- `Kodansha`: **181 volumes** (*The Drops of God*, *Space Brothers*, *Blue Period*, *Vinland Saga*, *What Did You Eat Yesterday?*)
- `Kodansha Comics`: **84 volumes** (*Witch Hat Atelier*, *A Condition Called Love*, *To Your Eternity*, *Kounodori*)

| Current Variant | Catalog Count | Recommended Action |
| :--- | :---: | :--- |
| `Kodansha Comics` | 84 | Normalize to **Kodansha** |
| `Kodansha` | 181 | Retain as **Kodansha** |

**Benefit:** Consolidates all 265 Kodansha manga volumes under a single, unified publisher filter in the Phase 4 shelf interface.

---

### Cluster 3: Slash Co-Publishing & Multi-Publisher Labels
Historical catalog artifacts where hybrid imprint strings were assigned during initial ingestion:

| Current Variant | Catalog Count | Affected Series | Canonical Recommendation |
| :--- | :---: | :--- | :--- |
| `BOOM! Studios / Image` | 25 | *James Tynion IV Works* | Split by specific imprint: *Something Is Killing the Children* $\to$ **BOOM! Studios**; *Department of Truth* $\to$ **Image Comics** |
| `DC Comics / Image` | 16 | *Astro City* | Normalize to **Image Comics** (current publishing home of Kurt Busiek's master series) |

---

### Cluster 4: Typographical & Formatting Variants

| Current Variant | Catalog Count | Canonical Name | Rationale |
| :--- | :---: | :--- | :--- |
| `Weldonowen` | 1 | **Weldon Owen** | Fix missing space |
| `Weldon Owen` | 30 | **Weldon Owen** | Already canonical |
| `Fair Winds` | 1 | **Fair Winds Press** | Add missing imprint noun |
| `Fair Winds Press` | 3 | **Fair Winds Press** | Already canonical |

---

## 3. Top 15 Post-Normalization Publisher Leaderboard

Following the recommended canonicalization pass, the publisher distribution simplifies into clean, standardized imprints:

| Rank | Canonical Publisher | Projected Volume Count | Primary Genres |
| :---: | :--- | :---: | :--- |
| **1** | **Kodansha** | **265** | Japanese Manga |
| **2** | **Dark Horse Comics** | **123** | Western Graphic Novels & Classic Manga |
| **3** | **Fantagraphics Books** | **102** | Independent Comics, Peanuts, EC Library |
| **4** | **IDW Publishing** | **95** | Transformers, Bloom County, Usagi Yojimbo |
| **5** | **Image Comics** | **69** | Massive-Verse, Black Science, Astro City, Autumnlands |
| **6** | **Adams Media** | **65** | The 101s Reference Series |
| **7** | **Chronicle Books** | **39** | Design, Culinary, Lifestyle |
| **8** | **Abstract Studios** | **40** | Terry Moore Graphic Novels |
| **9** | **Sasquatch Books** | **32** | Gastronomy, Local Guides |
| **10** | **Media Soft** | **31** | Digital Manga |
| **11** | **Weldon Owen** | **31** | Williams-Sonoma Culinary |
| **12** | **Microcosm Publishing** | **26** | Dr. Faith Harper Wellness Series |
| **13** | **Wiley** | **20** | For Dummies Technical & Lifestyle Guides |
| **14** | **PanelxPanel** | **20** | Comic Art & Criticism Periodicals |
| **15** | **No Starch Press** | **18** | Computer Science & Programming |

---

## 4. Recommended Remediation Plan

Execute a single automated SQL/Node migration consolidating these 5 variant clusters into canonical publisher values prior to Phase 4 shelf rendering.
