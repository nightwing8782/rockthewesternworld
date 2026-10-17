# Phase 1 Remediation Plan: Preview & Change Manifest
**Document:** `PHASE1-PREVIEW.md`  
**Generated:** 2026-10-17T14:22:13.770Z  
**Database Backup Reference:** `trophy_books_backup_2026-10-17T14-19-06-932Z.json` (1399 books, 25 progress records)  
**Status:** **AWAITING USER REVIEW • ZERO WRITES EXECUTED**  

---

## 1. Executive Summary of Proposed Changes

This manifest details every database mutation scheduled for Phase 1 under the strict safeguards approved by the user:
- **Safeguard 1:** Execution authenticated exclusively via `SUPABASE_SERVICE_ROLE_KEY`.
- **Safeguard 2:** Full JSON backup created at `backups/trophy_books_backup_2026-10-17T14-19-06-932Z.json` before any mutation.
- **Safeguard 3:** All reading progress records mapped to merged/deleted records are preserved and transferred to the canonical record.
- **Safeguard 4:** No data changes will occur until this preview is formally accepted.

### Impact Overview
| Operation Category | Records Affected | Resulting Catalog State |
| :--- | :---: | :--- |
| **Duplicates Deleted / Merged** | **10 records** | Catalog size decreases from **1,399 $\to$ 1,389** unique titles |
| **Reading Progress Preserved** | **100% (25/25)** | Progress transferred to canonical record if duplicate was active |
| **Suffix Sanitization (`__1_`)** | **24 records** | Clean display titles without download artifacts |
| **Stuttered Title Repairs (`volvol`)** | **8 records** | Fixed *What Did You Eat Yesterday?* Vols 3–10 |
| **Series & Volume Standardizations** | **24 records** | Canonical *Blue Period*, *Judge Dredd*, *Condition Called Love* |

---

## 2. Itemized Duplicate Merges & Deletions (10 Records)

Each duplicate record below will be safely deleted from `trophy_books`. If the deleted record has associated reading progress in `trophy_progress`, that progress will be automatically merged into the canonical `keepBook` ID before deletion.

### 1. Blue Period Vol. 2
- **Reason:** Duplicate from legacy Manga/2022/ folder with differing filename underscore
- ❌ **RECORD TO DELETE:**
  - **Database UUID:** `f69be297-85b1-47df-a846-6e4710b0b950`
  - **File Key:** `books/epub/blueperiod_vol2.epub`
  - **Current Title:** "Blueperiod"
  - **Associated Progress:** *None (Safe to delete)*
- ✅ **CANONICAL RECORD TO KEEP:**
  - **Database UUID:** `a037520a-3573-49cd-96ad-e2f699a26b1e`
  - **File Key:** `books/epub/blueperiodvol2.epub`
  - **Current Title:** "Blueperiod"
  - **Existing Progress:** *None*

### 2. Blue Period Vol. 3
- **Reason:** Duplicate from legacy Manga/2022/ folder with differing filename underscore
- ❌ **RECORD TO DELETE:**
  - **Database UUID:** `b74484cd-c7bc-40f2-8824-cc7625110e2d`
  - **File Key:** `books/epub/blueperiod_vol3.epub`
  - **Current Title:** "Blueperiod"
  - **Associated Progress:** *None (Safe to delete)*
- ✅ **CANONICAL RECORD TO KEEP:**
  - **Database UUID:** `132dfbf5-ff14-4f1c-b784-8ed078c05e22`
  - **File Key:** `books/epub/blueperiodvol3.epub`
  - **Current Title:** "Blueperiod"
  - **Existing Progress:** *None*

### 3. What Did You Eat Yesterday? Vol. 1
- **Reason:** Duplicate from legacy Manga/2022/ folder with differing filename underscore
- ❌ **RECORD TO DELETE:**
  - **Database UUID:** `e4babb3c-6974-45a6-84b0-380f1e6cd4c2`
  - **File Key:** `books/epub/whatdidyoueatyesterday_vol1.epub`
  - **Current Title:** "Whatdidyoueatyesterday"
  - **Associated Progress:** *None (Safe to delete)*
- ✅ **CANONICAL RECORD TO KEEP:**
  - **Database UUID:** `541e6785-fe5d-43b4-a13e-02e81f552a0b`
  - **File Key:** `books/epub/whatdidyoueatyesterdayvol1.epub`
  - **Current Title:** "Whatdidyoueatyesterday"
  - **Existing Progress:** *None*

### 4. Witch Hat Atelier Vol. 1
- **Reason:** Misspelled folder typo in 2022 staging ("Which Hatatelier" vs "Witch Hat Atelier")
- ❌ **RECORD TO DELETE:**
  - **Database UUID:** `5a2f92c1-0586-40fd-9478-c5fefd906151`
  - **File Key:** `books/epub/whichhatatelier_vol1.epub`
  - **Current Title:** "Whichhatatelier"
  - **Associated Progress:** *None (Safe to delete)*
- ✅ **CANONICAL RECORD TO KEEP:**
  - **Database UUID:** `c30fa3e0-9fd6-4a77-9e05-a686fd354766`
  - **File Key:** `books/epub/witchhatateliervol1.epub`
  - **Current Title:** "Witch Hat Atelier"
  - **Existing Progress:** Page -1/-1 (0%)

### 5. Witch Hat Atelier Vol. 2
- **Reason:** Misspelled folder typo in 2022 staging ("Which Hatatelier" vs "Witch Hat Atelier")
- ❌ **RECORD TO DELETE:**
  - **Database UUID:** `bce1f61a-e753-445e-ba06-0de375de0308`
  - **File Key:** `books/epub/whichhatatelier_vol2.epub`
  - **Current Title:** "Whichhatatelier"
  - **Associated Progress:** *None (Safe to delete)*
- ✅ **CANONICAL RECORD TO KEEP:**
  - **Database UUID:** `28d07fbb-ff3d-422f-addc-752f79a30c80`
  - **File Key:** `books/epub/witchhatateliervol2.epub`
  - **Current Title:** "Witchhatatelier"
  - **Existing Progress:** *None*

### 6. Witch Hat Atelier Vol. 3
- **Reason:** Misspelled folder typo in 2022 staging ("Which Hatatelier" vs "Witch Hat Atelier")
- ❌ **RECORD TO DELETE:**
  - **Database UUID:** `c5c8709d-7c18-41e1-bbcf-c28bea40609e`
  - **File Key:** `books/epub/whichhatatelier_vol3.epub`
  - **Current Title:** "Whichhatatelier"
  - **Associated Progress:** *None (Safe to delete)*
- ✅ **CANONICAL RECORD TO KEEP:**
  - **Database UUID:** `3964c242-3c36-43c0-a4de-50e40d7f54da`
  - **File Key:** `books/epub/witchhatateliervol3.epub`
  - **Current Title:** "Witch Hat Atelier"
  - **Existing Progress:** *None*

### 7. Witch Hat Atelier Vol. 4
- **Reason:** Misspelled folder typo in 2022 staging ("Which Hatatelier" vs "Witch Hat Atelier")
- ❌ **RECORD TO DELETE:**
  - **Database UUID:** `1c6d65a6-0e93-4854-a4a6-5522ad7e456b`
  - **File Key:** `books/epub/whichhatatelier_vol4.epub`
  - **Current Title:** "Whichhatatelier"
  - **Associated Progress:** *None (Safe to delete)*
- ✅ **CANONICAL RECORD TO KEEP:**
  - **Database UUID:** `4bc07bc3-04a0-4027-9174-597234315a75`
  - **File Key:** `books/epub/witchhatateliervol4.epub`
  - **Current Title:** "Witchhatatelier"
  - **Existing Progress:** *None*

### 8. Transformers: More Than Meets The Eye Vol. 9
- **Reason:** Browser duplicate download artifact (__1_) identical to existing clean file
- ❌ **RECORD TO DELETE:**
  - **Database UUID:** `a95cdea4-7c80-4405-8925-57206534438d`
  - **File Key:** `books/cbz/transformers_morethanmeetstheeye_vol9__1_.cbz`
  - **Current Title:** "Transformers Morethanmeetstheeye Vol9 1"
  - **Associated Progress:** *None (Safe to delete)*
- ✅ **CANONICAL RECORD TO KEEP:**
  - **Database UUID:** `ccde4667-de86-4e77-b94b-1915c7b40414`
  - **File Key:** `books/cbz/transformers_morethanmeetstheeye_vol9.cbz`
  - **Current Title:** "Transformers Morethanmeetstheeye Vol9"
  - **Existing Progress:** *None*

### 9. Hellboy Vol. 7 – The Troll Witch and Others
- **Reason:** Browser duplicate download artifact (__1_) identical to existing clean file
- ❌ **RECORD TO DELETE:**
  - **Database UUID:** `d4fb0f63-abf5-4ab8-9c1a-5a5f0de5205a`
  - **File Key:** `books/pdf/hellboyvolume7_thetrollwitchandothers__1_.pdf`
  - **Current Title:** "hellboyvolume7 thetrollwitchandothers"
  - **Associated Progress:** *None (Safe to delete)*
- ✅ **CANONICAL RECORD TO KEEP:**
  - **Database UUID:** `b06eea28-419e-476b-bfd4-adcc07267e0a`
  - **File Key:** `books/pdf/hellboyvolume7_thetrollwitchandothers.pdf`
  - **Current Title:** "hellboyvolume7 thetrollwitchandothers"
  - **Existing Progress:** *None*

### 10. Strangers in Paradise Vol. 19 – Ever After
- **Reason:** Browser duplicate download artifact (__1_) identical to existing clean file
- ❌ **RECORD TO DELETE:**
  - **Database UUID:** `953293aa-56b5-4a0e-8e52-39e16c5e3806`
  - **File Key:** `books/pdf/strangersinparadisev19_everafter__1_.pdf`
  - **Current Title:** "strangersinparadisev19 everafter"
  - **Associated Progress:** *None (Safe to delete)*
- ✅ **CANONICAL RECORD TO KEEP:**
  - **Database UUID:** `00a93c14-63fa-4901-a7b3-7b41203d0ee6`
  - **File Key:** `books/pdf/strangersinparadisev19_everafter.pdf`
  - **Current Title:** "strangersinparadisev19 everafter"
  - **Existing Progress:** *None*

---

## 3. Stuttered Volume Title Repairs (8 Records)

Repairing consecutive volumes in *What Did You Eat Yesterday?* where the filename and title carried the doubled `volvol` glitch:

| UUID | Current Title | Proposed Canonical Title | New Series | Vol # |
| :--- | :--- | :--- | :--- | :-: |
| `0b824038...` | "Whatdidyoueatyesterdayvol" | **"What Did You Eat Yesterday?: Vol. 3"** | What Did You Eat Yesterday? | 3 |
| `a7b86c1d...` | "Whatdidyoueatyesterdayvol" | **"What Did You Eat Yesterday?: Vol. 4"** | What Did You Eat Yesterday? | 4 |
| `4df8be6f...` | "Whatdidyoueatyesterdayvol" | **"What Did You Eat Yesterday?: Vol. 5"** | What Did You Eat Yesterday? | 5 |
| `fe1bb473...` | "Whatdidyoueatyesterdayvol" | **"What Did You Eat Yesterday?: Vol. 6"** | What Did You Eat Yesterday? | 6 |
| `cbb6407f...` | "Whatdidyoueatyesterdayvol" | **"What Did You Eat Yesterday?: Vol. 7"** | What Did You Eat Yesterday? | 7 |
| `5a828c45...` | "Whatdidyoueatyesterdayvol" | **"What Did You Eat Yesterday?: Vol. 8"** | What Did You Eat Yesterday? | 8 |
| `61c2b5e2...` | "Whatdidyoueatyesterdayvol" | **"What Did You Eat Yesterday?: Vol. 9"** | What Did You Eat Yesterday? | 9 |
| `d85c053f...` | "Whatdidyoueatyesterdayvol" | **"What Did You Eat Yesterday?: Vol. 10"** | What Did You Eat Yesterday? | 10 |

---

## 4. Download Suffix Artifact Sanitizations (24 Records)

Removing browser download artifacts (`__1_`, `__2_`, `(1)`) from display titles for unique books:

| UUID | File Key | Current Title | Sanitized Title |
| :--- | :--- | :--- | :--- |
| `0c61fdc5...` | `thecourageparty__1_.epub` | "Thecourageparty 1" | **"Thecourageparty"** |
| `12727fb1...` | `completepeanuts1955-1956__1_.pdf` | "Completepeanuts1955 1956 1" | **"Completepeanuts1955 1956"** |
| `2d909692...` | `youareagreatandpowerfulwizard__1_.epub` | "Youareagreatandpowerfulwizard 1" | **"Youareagreatandpowerfulwizard"** |
| `2df29000...` | `unfuckyourworth__1_.epub` | "Unfuckyourworth 1" | **"Unfuckyourworth"** |
| `30b58630...` | `completepeanuts1950-2000comicsandstories__1_.pdf` | "Completepeanuts1950 2000comicsandstories 1" | **"Completepeanuts1950 2000comicsandstories"** |
| `35aa676f...` | `copingskills__1_.epub` | "Copingskills 1" | **"Copingskills"** |
| `3817a624...` | `unfuckyourintimacy__1_.epub` | "Unfuckyourintimacy 1" | **"Unfuckyourintimacy"** |
| `3c78ef43...` | `thisisyourbrainonanxiety__1_.epub` | "Thisisyourbrainonanxiety 1" | **"Thisisyourbrainonanxiety"** |
| `5c1630c2...` | `hellboy_all-seeingeye__1_.epub` | "Hellboy All Seeingeye 1" | **"Hellboy All Seeingeye"** |
| `60ad9172...` | `hellboy_emeraldhell__1_.epub` | "Hellboy Emeraldhell 1" | **"Hellboy Emeraldhell"** |
| `77093e8f...` | `thisisyourbrainondepression__1_.epub` | "Thisisyourbrainondepression 1" | **"Thisisyourbrainondepression"** |
| `79b30721...` | `unfuckyouranger__1_.epub` | "Unfuckyouranger 1" | **"Unfuckyouranger"** |
| `80069170...` | `fuckhappiness__1_.epub` | "Fuckhappiness 1" | **"Fuckhappiness"** |
| `8a294abc...` | `unfuckyouradulting__1_.epub` | "Unfuckyouradulting 1" | **"Unfuckyouradulting"** |
| `91a8cb13...` | `hellboy_anassortmentofhorrors__1_.epub` | "Hellboy Anassortmentofhorrors 1" | **"Hellboy Anassortmentofhorrors"** |
| `93c79649...` | `ifyourefreakingoutreadthis__1_.epub` | "Ifyourefreakingoutreadthis 1" | **"Ifyourefreakingoutreadthis"** |
| `a463be6a...` | `gluten-freeandveganforthewholefamily_nutritiousplant-basedmealsand__1_.epub` | "Gluten Freeandveganforthewholefamily Nutritiousplant Basedmealsand 1" | **"Gluten Freeandveganforthewholefamily Nutritiousplant Basedmealsand"** |
| `b0c1d780...` | `unfuckyourbrain__1_.epub` | "Unfuckyourbrain 1" | **"Unfuckyourbrain"** |
| `bc269ef9...` | `howtobeaccountable__1_.epub` | "Howtobeaccountable 1" | **"Howtobeaccountable"** |
| `d047b471...` | `hardcoreanxiety__1_.epub` | "Hardcoreanxiety 1" | **"Hardcoreanxiety"** |
| `ddd0c2d6...` | `hellboy_oddjobs__1_.epub` | "Hellboy Oddjobs 1" | **"Hellboy Oddjobs"** |
| `e8ef98e3...` | `whatveganseat_acookbookforeveryonewithover100deliciousrecipesrecom__1_.epub` | "Whatveganseat Acookbookforeveryonewithover100deliciousrecipesrecom 1" | **"Whatveganseat Acookbookforeveryonewithover100deliciousrecipesrecom"** |
| `ea5a86b3...` | `hellboy_oddestjobs__1_.epub` | "Hellboy Oddestjobs 1" | **"Hellboy Oddestjobs"** |
| `f477e083...` | `unfuckyourboundaries__1_.epub` | "Unfuckyourboundaries 1" | **"Unfuckyourboundaries"** |

---

## 5. Major Series & Volume Standardizations (24 Records)

Normalizing squished titles and volume syntaxes for flagship series:

| UUID | Current Title | Proposed Canonical Title | Series | Vol # |
| :--- | :--- | :--- | :--- | :-: |
| `132dfbf5...` | "Blueperiod" | **"Blue Period: Vol. 3"** | "Blue Period" | 3 |
| `174f29b0...` | "Blueperiod" | **"Blue Period: Vol. 10"** | "Blue Period" | 10 |
| `198d9e4a...` | "Aconditioncalledlove" | **"A Condition Called Love: Vol. 2"** | "A Condition Called Love" | 2 |
| `1a1d4402...` | "Blueperiod" | **"Blue Period: Vol. 5"** | "Blue Period" | 5 |
| `289cdf68...` | "judgedredd casefiles vol5" | **"Judge Dredd: The Complete Case Files: Vol. 5"** | "Judge Dredd: The Complete Case Files" | 5 |
| `29ac7279...` | "Blueperiod" | **"Blue Period: Vol. 1"** | "Blue Period" | 1 |
| `2bacf5fc...` | "Blueperiod" | **"Blue Period: Vol. 7"** | "Blue Period" | 7 |
| `312e56fa...` | "judgedredd casefiles vol3" | **"Judge Dredd: The Complete Case Files: Vol. 3"** | "Judge Dredd: The Complete Case Files" | 3 |
| `44a05942...` | "Blueperiod" | **"Blue Period: Vol. 13"** | "Blue Period" | 13 |
| `57c68f37...` | "judgedredd casefiles vol1" | **"Judge Dredd: The Complete Case Files: Vol. 1"** | "Judge Dredd: The Complete Case Files" | 1 |
| `71803c36...` | "Blueperiod" | **"Blue Period: Vol. 9"** | "Blue Period" | 9 |
| `89ae4392...` | "Blueperiod" | **"Blue Period: Vol. 4"** | "Blue Period" | 4 |
| `8ecf44bd...` | "Blueperiod" | **"Blue Period: Vol. 11"** | "Blue Period" | 11 |
| `93fa859b...` | "Aconditioncalledlove" | **"A Condition Called Love: Vol. 4"** | "A Condition Called Love" | 4 |
| `9db0c5df...` | "Aconditioncalledlove" | **"A Condition Called Love: Vol. 5"** | "A Condition Called Love" | 5 |
| `a037520a...` | "Blueperiod" | **"Blue Period: Vol. 2"** | "Blue Period" | 2 |
| `a30f3134...` | "Aconditioncalledlove" | **"A Condition Called Love: Vol. 3"** | "A Condition Called Love" | 3 |
| `ada25cec...` | "Blueperiod" | **"Blue Period: Vol. 12"** | "Blue Period" | 12 |
| `adf50cfa...` | "Blueperiod" | **"Blue Period: Vol. 6"** | "Blue Period" | 6 |
| `bfd55c81...` | "Aconditioncalledlove" | **"A Condition Called Love: Vol. 1"** | "A Condition Called Love" | 1 |
| `cb5e9dec...` | "judgedredd casefiles vol4" | **"Judge Dredd: The Complete Case Files: Vol. 4"** | "Judge Dredd: The Complete Case Files" | 4 |
| `d252919a...` | "Blueperiod" | **"Blue Period: Vol. 8"** | "Blue Period" | 8 |
| `d32f65a1...` | "judgedredd casefiles vol2" | **"Judge Dredd: The Complete Case Files: Vol. 2"** | "Judge Dredd: The Complete Case Files" | 2 |
| `f10d7c11...` | "Aconditioncalledlove" | **"A Condition Called Love: Vol. 6"** | "A Condition Called Love" | 6 |

---

## 6. Verification & Rollback Safeguards

1. **Rollback File:** If any operation produces an unexpected result, the complete pre-mutation state can be restored in seconds by executing:
   ```bash
   node scripts/rollback_trophy_database.js backups/trophy_books_backup_2026-10-17T14-19-06-932Z.json
   ```
2. **Post-Mutation Verification:** Immediately following execution, a verification query will assert:
   - Total rows in `trophy_books` == 1,389.
   - 0 duplicate file keys exist.
   - All 25 `trophy_progress` records remain valid and intact.
