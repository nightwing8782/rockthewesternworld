# AUTHOR-CANONICALIZATION-REPORT.md

**Generated:** 2026-10-17  
**Catalog Scope:** 1,117 Credited Books Across 325 Distinct Author Strings  
**Status:** **AUDIT COMPLETE • CANONICALIZATION PLAN READY**

---

## 1. Executive Summary

An audit of all 325 distinct creator strings currently stored in Supabase `trophy_books.author` was conducted.

### Quality Baseline:
- **Total Books with Author Metadata:** **1,117 / 1,389 (80.4%)**
- **Distinct Author Strings:** **325**
- **Case Discrepancies (`Mike Mignola` vs `mike mignola`):** **0** (All title-cased)
- **Inverted Names (`Last, First`):** **18 strings**
- **Academic / Credential Suffixes (`PhD`, `Ph.D.`):** **3 strings**
- **Editorial Suffixes (`, editor`):** **2 strings**
- **Multi-Creator Conjunction Inconsistencies (`&` vs `and` vs `,`):** **24 strings**

---

## 2. Itemized Anomaly Categories

### Category A: Inverted Name Syntax (`Last, First`)
Certain EPUB `content.opf` `<dc:creator>` tags store creators in bibliographic library format (`Last, First`) rather than natural display format.

| Current Author String | Affected Titles | Root Cause | Proposed Canonical Creator |
| :--- | :---: | :--- | :--- |
| `Melanie Choukas-Bradley and van der Vorst, Lieke` | 1 | EPUB OPF inverted co-author | **Melanie Choukas-Bradley & Lieke van der Vorst** |
| `Ryosuke Fuji, Katarina` | 1 | Reversed artist/writer order | **Katarina & Ryosuke Fuji** |
| `Wendy Pini, Richard Pini, Sonny Strait` | 1 | Comma concatenation | **Wendy Pini & Richard Pini (art by Sonny Strait)** |
| `Wendy Pini, Richard Pini, Delfin Barral` | 1 | Comma concatenation | **Wendy Pini & Richard Pini (art by Delfin Barral)** |
| `Reed Crandall, Albert B. Feldstein, Harvey Kurtzman` | 1 | Full formal given name | **Al Feldstein, Harvey Kurtzman & Reed Crandall** |
| `Automne Zingg, Joshua Ploeg` | 1 | Unjoined co-authors | **Automne Zingg & Joshua Ploeg** |
| `Javier Luraschi, Kevin Kuo, and Edgar Ruiz` | 1 | Serial comma with `and` | **Javier Luraschi, Kevin Kuo & Edgar Ruiz** |
| `Anirudh Koul, Siddha Ganju, and Meher Kasam` | 1 | Serial comma with `and` | **Anirudh Koul, Siddha Ganju & Meher Kasam** |
| `Khaled El Emam, Lucy Mosquera, Richard Hoptroff` | 1 | Serial comma without `and` | **Khaled El Emam, Lucy Mosquera & Richard Hoptroff** |
| `Deepak Mukunthu, Parashar Shah, Wee Hyong Tok` | 1 | Serial comma without `and` | **Deepak Mukunthu, Parashar Shah & Wee Hyong Tok** |
| `Tyler Akidau, Slava Chernyak, Reuven Lax` | 1 | Serial comma without `and` | **Tyler Akidau, Slava Chernyak & Reuven Lax** |
| `Lisa Atwood, Rebecca Courchesne and Rick Field` | 1 | Mixed comma and `and` | **Lisa Atwood, Rebecca Courchesne & Rick Field** |

---

### Category B: Credential & Academic Suffixes (`PhD`, `Ph.D.`)
Author strings containing post-nominal degrees that clutter display cards:

| Current Author String | Affected Titles | Proposed Canonical Creator |
| :--- | :---: | :--- |
| `Paula Watkins, Ph.D.` | 1 | **Dr. Paula Watkins** |
| `Rebecca Simon, PhD` | 1 | **Dr. Rebecca Simon** |
| `John Haslett and Cameron M. Smith, PhD` | 1 | **John Haslett & Cameron M. Smith** |

---

### Category C: Editorial Role Suffixes
Artifacts where production roles are embedded into the author column:

| Current Author String | Affected Titles | Proposed Canonical Creator |
| :--- | :---: | :--- |
| `Helen Armstrong, editor` | 1 | **Helen Armstrong** |
| `Paul Simon, Charlie Nardozzi, and The Editors of the National Gardening Association` | 1 | **Paul Simon, Charlie Nardozzi & National Gardening Association** |

---

### Category D: Flagship Series Conjunction Standardization
Ensuring flagship series consistently use ampersands (`&`) for dual-creator runs:

| Canonical Series | Current Pattern | Standardized Canonical String |
| :--- | :--- | :--- |
| *Love and Rockets* | `Gilbert Hernandez & Jaime Hernandez` | **Gilbert Hernandez & Jaime Hernandez** |
| *Lone Wolf and Cub* | `Kazuo Koike & Goseki Kojima` | **Kazuo Koike & Goseki Kojima** |
| *Path of the Assassin* | `Kazuo Koike & Goseki Kojima` | **Kazuo Koike & Goseki Kojima** |
| *The Drops of God* | `Tadashi Agi & Shu Okimoto` | **Tadashi Agi & Shu Okimoto** |
| *Astro City* | `Kurt Busiek & Brent Anderson` | **Kurt Busiek & Brent Anderson** |
| *Autumnlands* | `Kurt Busiek & Benjamin Dewey` | **Kurt Busiek & Benjamin Dewey** |
| *Radiant Black* | `Kyle Higgins & Marcelo Costa` | **Kyle Higgins & Marcelo Costa** |
| *Black Science* | `Rick Remender & Matteo Scalera` | **Rick Remender & Matteo Scalera** |
| *Criminal* | `Ed Brubaker & Sean Phillips` | **Ed Brubaker & Sean Phillips** |
| *Shangri-La Frontier* | `Katarina & Ryosuke Fuji` | **Katarina & Ryosuke Fuji** |
| *Cerebus* | `Dave Sim & Gerhard` | **Dave Sim & Gerhard** |

---

## 3. Recommended Remediation Plan

Execute a non-destructive batch update normalizing the 18 inverted strings, 3 academic suffixes, and 2 editorial artifacts into their canonical display representations before launching Phase 4 discovery filters.
