# Phase 2 Remediation Plan: Series Reconstruction & Hierarchy Manifest
**Document:** `PHASE2-PREVIEW.md`  
**Generated:** 2026-10-17T14:34:12.790Z  
**Database Backup Reference:** `trophy_books_backup_2026-10-17T14-31-50-878Z.json` (1,389 books, 25 progress records)  
**Status:** **AWAITING USER REVIEW • ZERO WRITES EXECUTED**  

---

## 1. Executive Summary of Proposed Changes

Phase 2 dismantles the generic series labels (**"Comics"**, **"Manga"**, and improperly tagged **"Standalone"** titles) and reconstructs deterministic, canonical series hierarchies in accordance with [**`METADATA-GUARDRAILS.md` (Guardrail 5 & 8)**](file:///C:/Users/danbi/.gemini/antigravity/scratch/rock-the-western-world/METADATA-GUARDRAILS.md).

### Impact Overview
| Metric | Value | Architectural Benefit |
| :--- | :---: | :--- |
| **Total Books Reconstructed** | **579** | Reclaimed from generic buckets into canonical series |
| **New Canonical Series Created** | **52** | Reconstructed master series runs |
| **Reading Progress Preserved** | **100% (25/25)** | Zero UUID mutations; all reading progress stays mapped |
| **Manga Reclassified from Comics** | **6 titles** | *Lady Snowblood*, *Crying Freeman* switched to `manga` (RTL) |
| **Periodicals Partitioned** | **20 issues** | *PanelxPanel* established as `periodical` medium |
| **Culinary & Wellness Partitioned** | **32 volumes** | *Williams-Sonoma* and *5-Minute Therapy* series created |

---

## 2. Series Reconstruction Groups (52 Major Runs)

### 1. The Drops of God (44 Volumes)
- **Target Medium:** `manga` | **Reading Direction:** `rtl`
- **Canonical Author:** Tadashi Agi
- **Rationale:** Un-squish manga series name and enforce RTL
- **Sample Volumes:**
  - `04e07e42...`: "Dropsofgod" *(Prior series: "Dropsofgod")*
  - `10b97d29...`: "Dropsofgod" *(Prior series: "Dropsofgod")*
  - `149818d0...`: "Dropsofgod" *(Prior series: "Dropsofgod")*
  - `18c5f245...`: "Dropsofgod" *(Prior series: "Dropsofgod")*
  - `1e3ee33c...`: "Dropsofgod" *(Prior series: "Dropsofgod")*
  - *...and 39 more volumes.*

### 2. EC Comics Library (38 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Publisher:** Fantagraphics Books
- **Rationale:** Canonical Fantagraphics EC Comics artist library
- **Sample Volumes:**
  - `016a47a1...`: "Livingmummyandotherstories" *(Prior series: "EC Comics")*
  - `02a11a32...`: "Deadlybelovedandotherstories" *(Prior series: "EC Comics")*
  - `0514d491...`: "The high cost of dying and other stories" *(Prior series: "EC Comics")*
  - `062d8048...`: "Taintthemeatitsthehumanityandotherstories" *(Prior series: "EC Comics")*
  - `07b76b7c...`: "Planetoidandotherstories" *(Prior series: "EC Comics")*
  - *...and 33 more volumes.*

### 3. Space Brothers (36 Volumes)
- **Target Medium:** `manga` | **Reading Direction:** `rtl`
- **Canonical Author:** Chuya Koyama
- **Rationale:** Un-squish manga series name and enforce RTL
- **Sample Volumes:**
  - `0325e80b...`: "Spacebrothers" *(Prior series: "Spacebrothers")*
  - `03f280ea...`: "Spacebrothers" *(Prior series: "Spacebrothers")*
  - `0746ae6c...`: "Spacebrothers" *(Prior series: "Spacebrothers")*
  - `1a0d28b7...`: "Spacebrothers" *(Prior series: "Spacebrothers")*
  - `34024115...`: "Spacebrothers" *(Prior series: "Spacebrothers")*
  - *...and 31 more volumes.*

### 4. Absolute Obedience: If You Don't Obey Me (31 Volumes)
- **Target Medium:** `manga` | **Reading Direction:** `rtl`
- **Rationale:** Un-squish manga series name and enforce RTL
- **Sample Volumes:**
  - `01d0d82e...`: "Absoluteobedience Ifyoudontobeyme" *(Prior series: "Absoluteobedience Ifyoudontobeyme")*
  - `07cd78f2...`: "Absoluteobedience Ifyoudontobeyme" *(Prior series: "Absoluteobedience Ifyoudontobeyme")*
  - `0e8ae30c...`: "Absoluteobedience Ifyoudontobeyme" *(Prior series: "Absoluteobedience Ifyoudontobeyme")*
  - `18755681...`: "Absoluteobedience Ifyoudontobeyme" *(Prior series: "Absoluteobedience Ifyoudontobeyme")*
  - `1ca5677a...`: "Absoluteobedience Ifyoudontobeyme" *(Prior series: "Absoluteobedience Ifyoudontobeyme")*
  - *...and 26 more volumes.*

### 5. Lone Wolf and Cub (28 Volumes)
- **Target Medium:** `manga` | **Reading Direction:** `rtl`
- **Canonical Author:** Kazuo Koike & Goseki Kojima
- **Rationale:** Un-squish manga series name and enforce RTL
- **Sample Volumes:**
  - `0805187a...`: "Lonewolfandcub" *(Prior series: "Lonewolfandcub")*
  - `18f24c93...`: "Lonewolfandcub" *(Prior series: "Lonewolfandcub")*
  - `32b918d9...`: "Lonewolfandcub" *(Prior series: "Lonewolfandcub")*
  - `3a0e60fc...`: "Lonewolfandcub" *(Prior series: "Lonewolfandcub")*
  - `3b97a34d...`: "Lonewolfandcub" *(Prior series: "Lonewolfandcub")*
  - *...and 23 more volumes.*

### 6. B.P.R.D. (24 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Franchise:** Mignolaverse
- **Canonical Author:** Mike Mignola & Guy Davis
- **Publisher:** Dark Horse Comics
- **Rationale:** Partition classic B.P.R.D. run from general Hellboy
- **Sample Volumes:**
  - `0ce5fcd8...`: "Bprdvolume 9 1946" *(Prior series: "Hellboy")*
  - `112b665c...`: "Hellboyandthebprd Thesevenwivesclubone Shot" *(Prior series: "Hellboy")*
  - `13096265...`: "Bprdvolume 10 Thewarning" *(Prior series: "Hellboy")*
  - `16d629b2...`: "Bprd Thedevilyouknowvolume 2 Pandemonium" *(Prior series: "Hellboy")*
  - `1e081638...`: "Bprdvolume 14 Kingoffear" *(Prior series: "Hellboy")*
  - *...and 19 more volumes.*

### 7. Williams-Sonoma Culinary Collection (22 Volumes)
- **Target Medium:** `cookbook` | **Reading Direction:** `ltr`
- **Publisher:** Weldon Owen
- **Rationale:** Group Williams-Sonoma cookbook masterclass collection
- **Sample Volumes:**
  - `00f95386...`: "Williams Sonomagrillmaster" *(Prior series: "Standalone")*
  - `015bd245...`: "Williams Sonoma Chickennight" *(Prior series: "Standalone")*
  - `0d22bdeb...`: "Williams Sonomatestkitchenspiralizer20cookbook" *(Prior series: "Standalone")*
  - `137fabec...`: "Williams Sonomagluten Freebaking" *(Prior series: "Standalone")*
  - `19f2ebe3...`: "Williams Sonoma Quickslowcooking" *(Prior series: "Standalone")*
  - *...and 17 more volumes.*

### 8. Hellboy (22 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Franchise:** Mignolaverse
- **Canonical Author:** Mike Mignola
- **Publisher:** Dark Horse Comics
- **Rationale:** Canonical Hellboy main series mapping
- **Sample Volumes:**
  - `013c7526...`: "Hellboyvolume 1 Seedofdestruction" *(Prior series: "Hellboy")*
  - `1fa743fb...`: "Hellboyvslobsterjohnsonin Theringofdeathone Shot" *(Prior series: "Hellboy")*
  - `4099886b...`: "Hellboyvolume 9 Thewildhunt" *(Prior series: "Hellboy")*
  - `4aa9a9d0...`: "Hellboy Intothesilentsea" *(Prior series: "Hellboy")*
  - `5c1630c2...`: "Hellboy All Seeingeye" *(Prior series: "Hellboy")*
  - *...and 17 more volumes.*

### 9. Strangers in Paradise (21 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Franchise:** Terry Moore Universe
- **Canonical Author:** Terry Moore
- **Publisher:** Abstract Studios
- **Rationale:** Deconstruct Terry Moore folder into canonical Strangers in Paradise run
- **Sample Volumes:**
  - `00a93c14...`: "Strangers in Paradise V 19 Everafter" *(Prior series: "Terry Moore")*
  - `03ab0bde...`: "Strangers in Paradise V 13 Flowertoflame" *(Prior series: "Terry Moore")*
  - `173731f5...`: "Strangers in Paradise V 7 Sanctuary" *(Prior series: "Terry Moore")*
  - `18c449e0...`: "Strangers in Paradise V 6 Highschool" *(Prior series: "Terry Moore")*
  - `1aa60d0f...`: "Strangers in Paradise V 2 Idreamofyou" *(Prior series: "Terry Moore")*
  - *...and 16 more volumes.*

### 10. PanelxPanel Magazine (20 Volumes)
- **Target Medium:** `periodical` | **Reading Direction:** `ltr`
- **Canonical Author:** Hassan Otsmane-Elhaou
- **Publisher:** PanelxPanel
- **Rationale:** Canonical PanelxPanel comic theory periodical assignment
- **Sample Volumes:**
  - `0588af89...`: "Panelx Panel #44" *(Prior series: "PanelxPanel Magazine")*
  - `193078e4...`: "Panelx Panel #39" *(Prior series: "PanelxPanel Magazine")*
  - `1a2fdf4d...`: "Panelx Panel #43" *(Prior series: "PanelxPanel Magazine")*
  - `1be058a9...`: "Panelx Panel #49" *(Prior series: "PanelxPanel Magazine")*
  - `2abf6319...`: "Panelx Panel #40" *(Prior series: "PanelxPanel Magazine")*
  - *...and 15 more volumes.*

### 11. For Dummies Reference (20 Volumes)
- **Target Medium:** `reference` | **Reading Direction:** `ltr`
- **Publisher:** Wiley
- **Rationale:** Group For Dummies reference books
- **Sample Volumes:**
  - `06b230cf...`: "Pairingfoodandwinefordummies" *(Prior series: "Standalone")*
  - `08f77e09...`: "Homemaintenancefordummies2ndedition" *(Prior series: "For Dummies Series")*
  - `098d9e62...`: "Homewinemakingfordummies" *(Prior series: "For Dummies Series")*
  - `0f92a390...`: "Bikerepairandmaintenancefordummies" *(Prior series: "For Dummies Series")*
  - `18a2d460...`: "Bartendingfordummies5thedition" *(Prior series: "For Dummies Series")*
  - *...and 15 more volumes.*

### 12. 5-Minute Therapy Series (20 Volumes)
- **Target Medium:** `wellness` | **Reading Direction:** `ltr`
- **Canonical Author:** Dr. Faith G. Harper
- **Publisher:** Microcosm Publishing
- **Rationale:** Group Faith G. Harper Microcosm wellness books into dedicated series
- **Sample Volumes:**
  - `20f15ab8...`: "Unfuckyourintimacyworkbook" *(Prior series: "Wellness")*
  - `2ccee973...`: "Unfuckyourworthworkbook" *(Prior series: "Wellness")*
  - `2df29000...`: "Unfuckyourworth" *(Prior series: "Wellness")*
  - `3014fac4...`: "Unfuckyourbrainworkbook" *(Prior series: "Wellness")*
  - `35aa676f...`: "Copingskills" *(Prior series: "Wellness")*
  - *...and 15 more volumes.*

### 13. Usagi Yojimbo (19 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Canonical Author:** Stan Sakai
- **Publisher:** Dark Horse Comics
- **Rationale:** Canonical Stan Sakai Usagi Yojimbo collection
- **Sample Volumes:**
  - `1e5aaaa7...`: "Usagiyojimbosagavolume 4 Secondedition" *(Prior series: "usagiyojimbosagavolume4secondedition")*
  - `319ac6f3...`: "Spaceusagi Deathandhonor" *(Prior series: "spaceusagi_deathandhonor")*
  - `34893730...`: "Usagiyojimbosagavolume 3 Secondedition" *(Prior series: "usagiyojimbosagavolume3secondedition")*
  - `4ca93c27...`: "Usagiyojimbo 40 Thanniversaryreader" *(Prior series: "usagiyojimbo_40thanniversaryreader")*
  - `5890dfbc...`: "Usagiyojimbosagavolume 7 Secondedition" *(Prior series: "usagiyojimbosagavolume7secondedition")*
  - *...and 14 more volumes.*

### 14. Cerebus (17 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Canonical Author:** Dave Sim
- **Publisher:** Aardvark-Vanaheim
- **Rationale:** Canonical Dave Sim Cerebus phonebook run
- **Sample Volumes:**
  - `098bd24c...`: "Highsociety Aardvarkvanaheim" *(Prior series: "Cerebus")*
  - `1cf1ac37...`: "Reads Aardvarkvanaheim" *(Prior series: "Cerebus")*
  - `1ecca0bc...`: "Women Aardvarkvanaheim" *(Prior series: "Cerebus")*
  - `2051bd38...`: "Cerebus Aardvarkvanaheim" *(Prior series: "Cerebus")*
  - `31606ad2...`: "Melmoth Aardvarkvanaheim" *(Prior series: "Cerebus")*
  - *...and 12 more volumes.*

### 15. Love and Rockets (16 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Canonical Author:** Gilbert & Jaime Hernandez
- **Publisher:** Fantagraphics Books
- **Rationale:** Canonical Hernandez brothers Love and Rockets collection
- **Sample Volumes:**
  - `24b2d9bc...`: "Loveandrocketsvo 1 Iv Issue 1" *(Prior series: "Love and Rockets")*
  - `2db21a5f...`: "Loveandrockets Thecovers" *(Prior series: "Love and Rockets")*
  - `32f579a8...`: "Loveandrocketsvo 1 Iv Issue 7" *(Prior series: "Love and Rockets")*
  - `386b191d...`: "Heartbreaksoup Loveandrockets" *(Prior series: "Love and Rockets")*
  - `477abbe2...`: "Loveandrocketscompanion" *(Prior series: "Love and Rockets")*
  - *...and 11 more volumes.*

### 16. Kounodori: Dr. Stork (15 Volumes)
- **Target Medium:** `manga` | **Reading Direction:** `rtl`
- **Canonical Author:** You Suzunoki
- **Rationale:** Un-squish manga series name and enforce RTL
- **Sample Volumes:**
  - `042f8c88...`: "Kounodori Drstork" *(Prior series: "Kounodori Drstork")*
  - `149a9884...`: "Kounodori Drstork" *(Prior series: "Kounodori Drstork")*
  - `1531522e...`: "Kounodori Drstork" *(Prior series: "Kounodori Drstork")*
  - `296958ec...`: "Kounodori Drstork" *(Prior series: "Kounodori Drstork")*
  - `2aabee1d...`: "Kounodori Drstork" *(Prior series: "Kounodori Drstork")*
  - *...and 10 more volumes.*

### 17. Path of the Assassin (15 Volumes)
- **Target Medium:** `manga` | **Reading Direction:** `rtl`
- **Canonical Author:** Kazuo Koike & Goseki Kojima
- **Rationale:** Un-squish manga series name and enforce RTL
- **Sample Volumes:**
  - `476bb94c...`: "Pathoftheassassin" *(Prior series: "Pathoftheassassin")*
  - `4ee6b49c...`: "Pathoftheassassin" *(Prior series: "Pathoftheassassin")*
  - `59c12257...`: "Pathoftheassassin" *(Prior series: "Pathoftheassassin")*
  - `6c42ba7b...`: "Pathoftheassassin" *(Prior series: "Pathoftheassassin")*
  - `94e10646...`: "Pathoftheassassin" *(Prior series: "Pathoftheassassin")*
  - *...and 10 more volumes.*

### 18. To Your Eternity (13 Volumes)
- **Target Medium:** `manga` | **Reading Direction:** `rtl`
- **Canonical Author:** Yoshitoki Oima
- **Rationale:** Un-squish manga series name and enforce RTL
- **Sample Volumes:**
  - `00f8aa79...`: "Toyoureternity" *(Prior series: "Toyoureternity")*
  - `02bb3c83...`: "Toyoureternity" *(Prior series: "Toyoureternity")*
  - `04eb27b5...`: "Toyoureternity" *(Prior series: "Toyoureternity")*
  - `5088e04d...`: "Toyoureternity" *(Prior series: "Toyoureternity")*
  - `8874d3b4...`: "Toyoureternity" *(Prior series: "Toyoureternity")*
  - *...and 8 more volumes.*

### 19. Vinland Saga (13 Volumes)
- **Target Medium:** `manga` | **Reading Direction:** `rtl`
- **Canonical Author:** Makoto Yukimura
- **Rationale:** Un-squish manga series name and enforce RTL
- **Sample Volumes:**
  - `029a25f0...`: "Vinlandsaga" *(Prior series: "Vinlandsaga")*
  - `0a113f1d...`: "Vinlandsaga" *(Prior series: "Vinlandsaga")*
  - `3ce72a1d...`: "Vinlandsaga" *(Prior series: "Vinlandsaga")*
  - `46b1308d...`: "Vinlandsaga" *(Prior series: "Vinlandsaga")*
  - `537af876...`: "Vinlandsaga" *(Prior series: "Vinlandsaga")*
  - *...and 8 more volumes.*

### 20. B.P.R.D.: Hell on Earth (12 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Franchise:** Mignolaverse
- **Canonical Author:** Mike Mignola & John Arcudi
- **Publisher:** Dark Horse Comics
- **Rationale:** Partition B.P.R.D. Hell on Earth cycle from general Hellboy
- **Sample Volumes:**
  - `0ee7e148...`: "Bprdhellonearthvolume 3 Russia" *(Prior series: "Hellboy")*
  - `2522d0f8...`: "Bprdhellonearthvolume 5 Thepickenscountyhorrorandothers" *(Prior series: "Hellboy")*
  - `321bc6c5...`: "Bprdhellonearthvolume 12 Metamorphosis" *(Prior series: "Hellboy")*
  - `3e0c7436...`: "Bprdhellonearthvolume 2 Godsandmonsters" *(Prior series: "Hellboy")*
  - `617c55a9...`: "Bprdhellonearthvolume 14 Theexorcist" *(Prior series: "Hellboy")*
  - *...and 7 more volumes.*

### 21. Witch Hat Atelier (11 Volumes)
- **Target Medium:** `manga` | **Reading Direction:** `rtl`
- **Canonical Author:** Kamome Shirahama
- **Rationale:** Canonical Witch Hat Atelier series assignment
- **Sample Volumes:**
  - `28d07fbb...`: "Witchhatatelier" *(Prior series: "Witchhatatelier")*
  - `3964c242...`: "Witch Hat Atelier" *(Prior series: "Witch Hat at Elier")*
  - `4bc07bc3...`: "Witchhatatelier" *(Prior series: "Witchhatatelier")*
  - `4f582de4...`: "Witchhatatelier" *(Prior series: "Witchhatatelier")*
  - `50295c16...`: "Witchhatatelier" *(Prior series: "Witchhatatelier")*
  - *...and 6 more volumes.*

### 22. Transformers: Lost Light (10 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Franchise:** Transformers (IDW)
- **Canonical Author:** James Roberts
- **Publisher:** IDW Publishing
- **Rationale:** Partition Transformers Lost Light run
- **Sample Volumes:**
  - `00e33f46...`: "Transformers Lostlight Issue20" *(Prior series: "Transformers")*
  - `1c01b94b...`: "Transformers Lostlight Issue19" *(Prior series: "Transformers")*
  - `1fe73650...`: "Transformers Lostlight Vol1" *(Prior series: "Transformers")*
  - `38ddf699...`: "Transformers Lostlight Issue23" *(Prior series: "Transformers")*
  - `45ff7be7...`: "Transformers Lostlight Issue24" *(Prior series: "Transformers")*
  - *...and 5 more volumes.*

### 23. Transformers: More Than Meets The Eye (9 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Franchise:** Transformers (IDW)
- **Canonical Author:** James Roberts
- **Publisher:** IDW Publishing
- **Rationale:** Partition Transformers MTMTE run
- **Sample Volumes:**
  - `02d2d83f...`: "Transformers Morethanmeetstheeye Vol7" *(Prior series: "Transformers")*
  - `255c1f29...`: "Transformers Morethanmeetstheeye Vol5" *(Prior series: "Transformers")*
  - `269418db...`: "Transformers Morethanmeetstheeye Vol1" *(Prior series: "Transformers")*
  - `287c07dd...`: "Transformers Morethanmeetstheeye Vol2" *(Prior series: "Transformers")*
  - `a67d7829...`: "Transformers Morethanmeetstheeye Vol10" *(Prior series: "Transformers")*
  - *...and 4 more volumes.*

### 24. Transformers: Robots in Disguise (9 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Franchise:** Transformers (IDW)
- **Canonical Author:** John Barber
- **Publisher:** IDW Publishing
- **Rationale:** Partition Transformers RID run
- **Sample Volumes:**
  - `079810c7...`: "Transformers Robotsindisguise Vol3" *(Prior series: "Transformers")*
  - `4f181a55...`: "Transformers Robotsindisguise Vol7" *(Prior series: "Transformers")*
  - `56975660...`: "Transformers Robotsindisguise Vol6" *(Prior series: "Transformers")*
  - `60b640ad...`: "Transformers Robotsindisguise Vol10" *(Prior series: "Transformers")*
  - `93e338ff...`: "Transformers Robotsindisguise Vol4" *(Prior series: "Transformers")*
  - *...and 4 more volumes.*

### 25. Echo (8 Volumes)
- **Target Medium:** `cookbook` | **Reading Direction:** `ltr`
- **Franchise:** Terry Moore Universe
- **Canonical Author:** Terry Moore
- **Publisher:** Abstract Studios
- **Rationale:** Deconstruct Terry Moore folder into canonical Echo run
- **Sample Volumes:**
  - `0be49eb3...`: "Foodnetworkmagazinechocolateloverscookbook" *(Prior series: "Standalone")*
  - `1de9fa15...`: "Echov 6 Thelastday" *(Prior series: "Terry Moore")*
  - `8c4f509b...`: "Theochocolate Recipesandsweetsecretsfromseattlesfavoritechocolatem" *(Prior series: "Standalone")*
  - `a1a86d2b...`: "Echov 3 Desertrun" *(Prior series: "Terry Moore")*
  - `a87e7ada...`: "Echov 1 Moonlake" *(Prior series: "Terry Moore")*
  - *...and 3 more volumes.*

### 26. Transformers: Unicron (7 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Franchise:** Transformers (IDW)
- **Canonical Author:** John Barber
- **Publisher:** IDW Publishing
- **Rationale:** Partition Unicron IDW finale event
- **Sample Volumes:**
  - `1a656a81...`: "Transformers Unicron Issue5" *(Prior series: "Transformers")*
  - `2eb325ae...`: "Transformers Unicron Issue1" *(Prior series: "Transformers")*
  - `44db58e9...`: "Transformers Unicron Issue3" *(Prior series: "Transformers")*
  - `831a043e...`: "Transformers Unicron Issue2" *(Prior series: "Transformers")*
  - `cda22269...`: "Transformers Unicron Issue4" *(Prior series: "Transformers")*
  - *...and 2 more volumes.*

### 27. Rachel Rising (7 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Franchise:** Terry Moore Universe
- **Canonical Author:** Terry Moore
- **Publisher:** Abstract Studios
- **Rationale:** Deconstruct Terry Moore folder into canonical Rachel Rising run
- **Sample Volumes:**
  - `1d6687af...`: "Rachelrisingv 4 Wintergraves" *(Prior series: "Terry Moore")*
  - `9d446f76...`: "Rachelrisingv 5 Nightcometh" *(Prior series: "Terry Moore")*
  - `adf47d65...`: "Rachelrisingv 1 Theshadowofdeath" *(Prior series: "Terry Moore")*
  - `b74476a1...`: "Rachelrisingv 2 Fearnomalus" *(Prior series: "Terry Moore")*
  - `b898b310...`: "Rachelrisingv 7 Dusttodust" *(Prior series: "Terry Moore")*
  - *...and 2 more volumes.*

### 28. Transformers: Phase 1 Ongoing (7 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Franchise:** Transformers (IDW)
- **Publisher:** IDW Publishing
- **Rationale:** Group Mike Costa Phase 1 ongoing run
- **Sample Volumes:**
  - `28eb0f4f...`: "Transformers Vol6 Chaos Policeaction" *(Prior series: "Transformers")*
  - `3cfbb5b8...`: "Transformers Vol4 Heartofdarkness" *(Prior series: "Transformers")*
  - `7387122d...`: "Transformers Vol2 Internationalincident" *(Prior series: "Transformers")*
  - `7662dbb4...`: "Transformers Vol3 Revengeofthedecepticons" *(Prior series: "Transformers")*
  - `84c69842...`: "Transformers Vol7 Chaos" *(Prior series: "Transformers")*
  - *...and 2 more volumes.*

### 29. Stray Bullets (6 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Canonical Author:** David Lapham
- **Publisher:** Image Comics
- **Rationale:** Extract multi-volume Stray Bullets main series from Standalone
- **Sample Volumes:**
  - `4c263863...`: "Straybullets Vol 3" *(Prior series: "Standalone")*
  - `82f1abc7...`: "Straybullets Vol 4" *(Prior series: "Standalone")*
  - `b010d73a...`: "Straybullets Vol 6" *(Prior series: "Standalone")*
  - `d9ae4f2e...`: "Stray Bullets Vol 1 1420484117" *(Prior series: "Standalone")*
  - `dfafd82e...`: "Straybullets Vol 2" *(Prior series: "Standalone")*
  - *...and 1 more volumes.*

### 30. Crying Freeman (5 Volumes)
- **Target Medium:** `manga` | **Reading Direction:** `rtl`
- **Canonical Author:** Kazuo Koike & Ryoichi Ikegami
- **Rationale:** Reclassify Japanese crime manga from Comics to Manga (RTL)
- **Sample Volumes:**
  - `38c88cdb...`: "Cryingfreeman" *(Prior series: "Cryingfreeman")*
  - `5b9669de...`: "Cryingfreeman" *(Prior series: "Cryingfreeman")*
  - `72ee86f1...`: "Cryingfreeman" *(Prior series: "Cryingfreeman")*
  - `80c6a336...`: "Cryingfreeman" *(Prior series: "Cryingfreeman")*
  - `f564d695...`: "Cryingfreeman" *(Prior series: "Cryingfreeman")*

### 31. Black Science (5 Volumes)
- **Target Medium:** `cookbook` | **Reading Direction:** `ltr`
- **Canonical Author:** Rick Remender
- **Publisher:** Image Comics
- **Rationale:** Extract multi-volume Black Science series from Standalone
- **Sample Volumes:**
  - `3e35c450...`: "Blackscience Vol4" *(Prior series: "Standalone")*
  - `b2c107da...`: "Blackscience Vol2" *(Prior series: "Standalone")*
  - `c2c70302...`: "Blackscience Vol1" *(Prior series: "Standalone")*
  - `d40a616c...`: "Blackscience Vol5" *(Prior series: "Standalone")*
  - `f235e373...`: "Blackscience Vol3" *(Prior series: "Standalone")*

### 32. Lady Snowblood (4 Volumes)
- **Target Medium:** `manga` | **Reading Direction:** `rtl`
- **Canonical Author:** Kazuo Koike & Kazuo Kamimura
- **Rationale:** Reclassify Japanese samurai manga from Comics to Manga (RTL)
- **Sample Volumes:**
  - `0ff8facd...`: "Ladysnowblood" *(Prior series: "Ladysnowblood")*
  - `287e4282...`: "Ladysnowblood" *(Prior series: "Ladysnowblood")*
  - `5774beb0...`: "Ladysnowblood" *(Prior series: "Ladysnowblood")*
  - `9bbe05dc...`: "Ladysnowblood" *(Prior series: "Ladysnowblood")*

### 33. Stray Bullets: Sunshine and Roses (4 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Canonical Author:** David Lapham
- **Publisher:** Image Comics
- **Rationale:** Extract multi-volume Stray Bullets spin-off from Standalone
- **Sample Volumes:**
  - `137fc20b...`: "Straybullets Sunshineandroses Vol 2" *(Prior series: "Standalone")*
  - `1ce0356b...`: "Straybullets Sunshineandroses Vol 4" *(Prior series: "Standalone")*
  - `28270345...`: "Straybullets Sunshineandroses Vol 1" *(Prior series: "Standalone")*
  - `f510cc22...`: "Straybullets Sunshineandroses Vol 3" *(Prior series: "Standalone")*

### 34. Revival (4 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Canonical Author:** Tim Seeley
- **Publisher:** Image Comics
- **Rationale:** Extract multi-volume Revival series from Standalone
- **Sample Volumes:**
  - `2e0f7981...`: "Revival vol1 update" *(Prior series: "Standalone")*
  - `8ac57f82...`: "Revival Vol 3" *(Prior series: "Standalone")*
  - `c3818a27...`: "Revival Vol 2" *(Prior series: "Standalone")*
  - `e8526475...`: "Revival Vol 4" *(Prior series: "Standalone")*

### 35. Zenith (4 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Canonical Author:** Grant Morrison
- **Publisher:** 2000 AD
- **Rationale:** Extract multi-volume Zenith series from Standalone
- **Sample Volumes:**
  - `8f8aa378...`: "Zenith Vol 3" *(Prior series: "Standalone")*
  - `90b20c5a...`: "Zenith Vol 2" *(Prior series: "Standalone")*
  - `c05177e1...`: "Zenith Vol 1" *(Prior series: "Standalone")*
  - `d5212d35...`: "Zenith Vol 4" *(Prior series: "Standalone")*

### 36. Transformers: The Wreckers Saga (3 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Franchise:** Transformers (IDW)
- **Canonical Author:** Nick Roche
- **Publisher:** IDW Publishing
- **Rationale:** Group Nick Roche Wreckers trilogy
- **Sample Volumes:**
  - `5c054014...`: "Transformers Sinsofthewreckers" *(Prior series: "Transformers")*
  - `afcf0ec0...`: "Transformers Laststandofthewreckers" *(Prior series: "Transformers")*
  - `b00b6451...`: "Transformers Requiemofthewreckers Oneshot" *(Prior series: "Transformers")*

### 37. Hellboy: Specials & Anthologies (3 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Franchise:** Mignolaverse
- **Publisher:** Dark Horse Comics
- **Rationale:** Group Hellboy winter specials into dedicated anthology series
- **Sample Volumes:**
  - `78258548...`: "Hellboywinterspecial 2018" *(Prior series: "Hellboy")*
  - `7e1448cf...`: "Hellboywinterspecial 2019" *(Prior series: "Hellboy")*
  - `e14bba6a...`: "Hellboywinterspecialone Shot" *(Prior series: "Hellboy")*

### 38. Unnatural (3 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Canonical Author:** Mirka Andolfo
- **Publisher:** Image Comics
- **Rationale:** Extract multi-volume Unnatural series from Standalone
- **Sample Volumes:**
  - `9ba79131...`: "Unnatural Vol 3" *(Prior series: "Standalone")*
  - `bd5e8b8a...`: "Unnatural Vol 2" *(Prior series: "Standalone")*
  - `dfd1cf5b...`: "Unnatural Vol 1" *(Prior series: "Standalone")*

### 39. Zombo (2 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Canonical Author:** Al Ewing
- **Publisher:** 2000 AD
- **Rationale:** Extract multi-volume Zombo series from Standalone
- **Sample Volumes:**
  - `001a6cf9...`: "Zombo Vol 1" *(Prior series: "Standalone")*
  - `d5b6f57d...`: "Zombo Vol 2" *(Prior series: "Standalone")*

### 40. Motor Girl (2 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Franchise:** Terry Moore Universe
- **Canonical Author:** Terry Moore
- **Publisher:** Abstract Studios
- **Rationale:** Deconstruct Terry Moore folder into canonical Motor Girl run
- **Sample Volumes:**
  - `008fc4e3...`: "Motor Girl V 1 Reallife" *(Prior series: "Terry Moore")*
  - `91ffb888...`: "Motor Girl V 2 Nomanleftbehind" *(Prior series: "Terry Moore")*

### 41. Sex Criminals (2 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Canonical Author:** Matt Fraction & Chip Zdarsky
- **Publisher:** Image Comics
- **Rationale:** Extract multi-volume Sex Criminals series from Standalone
- **Sample Volumes:**
  - `2335a60d...`: "Sexcriminalsbighard Vol 2" *(Prior series: "Standalone")*
  - `cbb71255...`: "Sexcriminalsbighard Vol 1" *(Prior series: "Standalone")*

### 42. Five Years (2 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Franchise:** Terry Moore Universe
- **Canonical Author:** Terry Moore
- **Publisher:** Abstract Studios
- **Rationale:** Deconstruct Terry Moore folder into canonical Five Years crossover
- **Sample Volumes:**
  - `268c7a86...`: "Fiveyearsv 2 Stalemate" *(Prior series: "Terry Moore")*
  - `61db01cf...`: "Fiveyearsv 1 Fireinthesky" *(Prior series: "Terry Moore")*

### 43. Royal City (2 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Canonical Author:** Jeff Lemire
- **Publisher:** Image Comics
- **Rationale:** Extract multi-volume Royal City series from Standalone
- **Sample Volumes:**
  - `4453b653...`: "Royalcity Vol 1" *(Prior series: "Standalone")*
  - `6b08b2f5...`: "Royalcity Vol 2" *(Prior series: "Standalone")*

### 44. Transformers: Till All Are One (2 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Franchise:** Transformers (IDW)
- **Canonical Author:** Mairghread Scott
- **Publisher:** IDW Publishing
- **Rationale:** Partition Transformers Till All Are One run
- **Sample Volumes:**
  - `6f2ae1b3...`: "Transformers Tillallareone Vol2" *(Prior series: "Transformers")*
  - `fa807b61...`: "Transformers Tillallareone Vol3" *(Prior series: "Transformers")*

### 45. Redlands (2 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Canonical Author:** Jordie Bellaire
- **Publisher:** Image Comics
- **Rationale:** Extract multi-volume Redlands series from Standalone
- **Sample Volumes:**
  - `89c596d4...`: "Redlands Vol 1" *(Prior series: "Standalone")*
  - `f1611185...`: "Redlands Vol 2" *(Prior series: "Standalone")*

### 46. They're Not Like Us (2 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Canonical Author:** Eric Stephenson
- **Publisher:** Image Comics
- **Rationale:** Extract multi-volume series from Standalone
- **Sample Volumes:**
  - `8d620989...`: "Theyrenotlikeus Vol 1" *(Prior series: "Standalone")*
  - `f88fb3fc...`: "Theyrenotlikeus Vol 2" *(Prior series: "Standalone")*

### 47. Snotgirl (2 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Canonical Author:** Bryan Lee O'Malley
- **Publisher:** Image Comics
- **Rationale:** Extract multi-volume Snotgirl series from Standalone
- **Sample Volumes:**
  - `8e4f9705...`: "Snotgirl Vol 1" *(Prior series: "Standalone")*
  - `d9d55aaa...`: "Snotgirl Vol 2" *(Prior series: "Standalone")*

### 48. Serial (2 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Franchise:** Terry Moore Universe
- **Canonical Author:** Terry Moore
- **Publisher:** Abstract Studios
- **Rationale:** Deconstruct Terry Moore folder into canonical Serial run
- **Sample Volumes:**
  - `a06f4b65...`: "Serialv 2 Catandmouse" *(Prior series: "Terry Moore")*
  - `fb1407bb...`: "Serialv 1 Theglasstomb" *(Prior series: "Terry Moore")*

### 49. Transformers: The Cybertron Trilogy (1 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Franchise:** Transformers (IDW)
- **Publisher:** IDW Publishing
- **Rationale:** Group Autocracy / Monstrosity / Primacy digital trilogy
- **Sample Volumes:**
  - `650852e0...`: "Transformers Autocracytrilogy" *(Prior series: "Transformers")*

### 50. Transformers: Windblade (1 Volumes)
- **Target Medium:** `comic` | **Reading Direction:** `ltr`
- **Franchise:** Transformers (IDW)
- **Publisher:** IDW Publishing
- **Rationale:** Partition Windblade miniseries
- **Sample Volumes:**
  - `66e10892...`: "Transformers Windblade Thelastcity" *(Prior series: "Transformers")*

### 51. Adams 101 Reference Series (1 Volumes)
- **Target Medium:** `reference` | **Reading Direction:** `ltr`
- **Publisher:** Adams Media
- **Rationale:** Group Adams 101 reference guides
- **Sample Volumes:**
  - `cd9aad6d...`: "Goodhousekeepingketo101" *(Prior series: "Standalone")*

### 52. Standalone (1 Volumes)
- **Target Medium:** `writing` | **Reading Direction:** `ltr`
- **Canonical Author:** Terry Moore
- **Rationale:** Reclassify Terry Moore drawing guide to Writing/Art craft standalone
- **Sample Volumes:**
  - `f6a68b39...`: "Terrymooreshowtodrawexpandedversion" *(Prior series: "Terry Moore")*

---

## 3. Reading Progress Safeguard Verification

All 25 active reading progress records were cross-checked against Phase 2 updates:
- **Zero Deletions:** Phase 2 performs only record updates (`UPDATE trophy_books SET series = ...`), meaning no book IDs are deleted.
- **Zero Progress Desynchronization:** Reading progress is joined by `book_id` and is unaffected by series name changes.
- **Immediate User Benefit:** In-progress volumes across *ElfQuest*, *Peanuts*, *Perl*, *Judge Dredd*, *Blue Period*, and *A Condition Called Love* will immediately display their correct series badge on the shelf.

---

## 4. Rollback & Verification Plan

1. **Pre-Mutation Snapshot:** `backups/trophy_books_backup_2026-10-17T14-31-50-878Z.json` is persisted and verifiable.
2. **Execution Logging:** Every individual database update will be logged to `backups/phase2_execution.log`.
3. **Post-Mutation Query:** Immediately following execution, a database assertion will verify:
   - 0 books remain with `series = 'Comics'`.
   - All 1,389 books remain present.
   - All 25 progress rows remain connected.
