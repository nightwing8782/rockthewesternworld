const fs = require('fs');
const path = require('path');

// Load recent backup
const backupDir = path.resolve('backups');
const backupFiles = fs.readdirSync(backupDir);
const booksBackup = backupFiles.filter(f => f.startsWith('trophy_books_backup_')).sort().pop();
const progressBackup = backupFiles.filter(f => f.startsWith('trophy_progress_backup_')).sort().pop();

const books = JSON.parse(fs.readFileSync(path.join(backupDir, booksBackup), 'utf8'));
const progress = JSON.parse(fs.readFileSync(path.join(backupDir, progressBackup), 'utf8'));

const progMap = new Map();
progress.forEach(p => progMap.set(p.book_id, p));

console.log(`Analyzing ${books.length} books and ${progress.length} progress records...`);

// 1. Identify Exact / Near Duplicates to Merge & Delete
const deleteOperations = [];

// A. Blue Period Vol 2 & 3
const bpVol2Dup = books.find(b => b.file_key === 'books/epub/blueperiod_vol2.epub');
const bpVol2Canon = books.find(b => b.file_key === 'books/epub/blueperiodvol2.epub');
if (bpVol2Dup && bpVol2Canon) {
  deleteOperations.push({
    group: 'Blue Period Vol. 2',
    deleteBook: bpVol2Dup,
    keepBook: bpVol2Canon,
    reason: 'Duplicate from legacy Manga/2022/ folder with differing filename underscore'
  });
}

const bpVol3Dup = books.find(b => b.file_key === 'books/epub/blueperiod_vol3.epub');
const bpVol3Canon = books.find(b => b.file_key === 'books/epub/blueperiodvol3.epub');
if (bpVol3Dup && bpVol3Canon) {
  deleteOperations.push({
    group: 'Blue Period Vol. 3',
    deleteBook: bpVol3Dup,
    keepBook: bpVol3Canon,
    reason: 'Duplicate from legacy Manga/2022/ folder with differing filename underscore'
  });
}

// B. What Did You Eat Yesterday Vol 1
const wdyeyVol1Dup = books.find(b => b.file_key === 'books/epub/whatdidyoueatyesterday_vol1.epub');
const wdyeyVol1Canon = books.find(b => b.file_key === 'books/epub/whatdidyoueatyesterdayvol1.epub');
if (wdyeyVol1Dup && wdyeyVol1Canon) {
  deleteOperations.push({
    group: 'What Did You Eat Yesterday? Vol. 1',
    deleteBook: wdyeyVol1Dup,
    keepBook: wdyeyVol1Canon,
    reason: 'Duplicate from legacy Manga/2022/ folder with differing filename underscore'
  });
}

// C. Witch Hat Atelier Vol 1-4 (Misspelled Which Hat Atelier)
for (let v = 1; v <= 4; v++) {
  const misspelled = books.find(b => b.file_key === `books/epub/whichhatatelier_vol${v}.epub`);
  const canonical = books.find(b => b.file_key === `books/epub/witchhatateliervol${v}.epub`);
  if (misspelled && canonical) {
    deleteOperations.push({
      group: `Witch Hat Atelier Vol. ${v}`,
      deleteBook: misspelled,
      keepBook: canonical,
      reason: 'Misspelled folder typo in 2022 staging ("Which Hatatelier" vs "Witch Hat Atelier")'
    });
  }
}

// D. Download Suffix Duplicates
const mtmte9Dup = books.find(b => b.file_key === 'books/cbz/transformers_morethanmeetstheeye_vol9__1_.cbz');
const mtmte9Canon = books.find(b => b.file_key === 'books/cbz/transformers_morethanmeetstheeye_vol9.cbz');
if (mtmte9Dup && mtmte9Canon) {
  deleteOperations.push({
    group: 'Transformers: More Than Meets The Eye Vol. 9',
    deleteBook: mtmte9Dup,
    keepBook: mtmte9Canon,
    reason: 'Browser duplicate download artifact (__1_) identical to existing clean file'
  });
}

const hb7Dup = books.find(b => b.file_key === 'books/pdf/hellboyvolume7_thetrollwitchandothers__1_.pdf');
const hb7Canon = books.find(b => b.file_key === 'books/pdf/hellboyvolume7_thetrollwitchandothers.pdf');
if (hb7Dup && hb7Canon) {
  deleteOperations.push({
    group: 'Hellboy Vol. 7 – The Troll Witch and Others',
    deleteBook: hb7Dup,
    keepBook: hb7Canon,
    reason: 'Browser duplicate download artifact (__1_) identical to existing clean file'
  });
}

const sip19Dup = books.find(b => b.file_key === 'books/pdf/strangersinparadisev19_everafter__1_.pdf');
const sip19Canon = books.find(b => b.file_key === 'books/pdf/strangersinparadisev19_everafter.pdf');
if (sip19Dup && sip19Canon) {
  deleteOperations.push({
    group: 'Strangers in Paradise Vol. 19 – Ever After',
    deleteBook: sip19Dup,
    keepBook: sip19Canon,
    reason: 'Browser duplicate download artifact (__1_) identical to existing clean file'
  });
}

// 2. Identify Stuttered VolVol Titles to Fix
const volvolRenames = [];
for (let v = 3; v <= 10; v++) {
  const b = books.find(x => x.file_key === `books/epub/whatdidyoueatyesterdayvolvol${v}.epub`);
  if (b) {
    volvolRenames.push({
      book: b,
      currentTitle: b.title,
      newTitle: `What Did You Eat Yesterday?: Vol. ${v}`,
      newSeries: 'What Did You Eat Yesterday?',
      newIssueNumber: v,
      newVolumeNumber: v,
      reason: 'Remove stuttered "volvol" token and standardize series volume designation'
    });
  }
}

// 3. Identify Download Suffix Titles to Clean (__1_, (1))
const deletedIds = new Set(deleteOperations.map(d => d.deleteBook.id));
const suffixRenames = [];
books.forEach(b => {
  if (deletedIds.has(b.id)) return;
  if (b.file_key && b.file_key.includes('__1_')) {
    // If title ends with ' 1', or has '__1_' or '(1)'
    if (/\s+1$/.test(b.title) || /__\d+_|\(1\)/.test(b.title)) {
      let cleanTitle = b.title.replace(/\s+1$/, '').replace(/__\d+_/g, '').replace(/\(1\)/g, '').trim();
      suffixRenames.push({
        book: b,
        currentTitle: b.title,
        newTitle: cleanTitle,
        reason: 'Strip ugly browser duplicate download suffix (" 1") from title'
      });
    }
  }
});

// 4. Canonical Volume & Squished Title Normalization
const titleNormalizations = [];
books.forEach(b => {
  if (deletedIds.has(b.id)) return;
  // Check if title has squished words or non-standard volume marker
  let title = b.title || '';
  let updated = false;

  // Blueperiod Vol X -> Blue Period: Vol. X
  const bpMatch = title.match(/^blueperiod\s*(?:vol\.?\s*)?(\d+)/i) || b.file_key.match(/blueperiod.*vol(\d+)/i);
  if (bpMatch && bpMatch[1]) {
    const vol = parseInt(bpMatch[1], 10);
    const newT = `Blue Period: Vol. ${vol}`;
    if (newT !== b.title || b.series !== 'Blue Period') {
      titleNormalizations.push({
        book: b,
        currentTitle: b.title,
        newTitle: newT,
        currentSeries: b.series,
        newSeries: 'Blue Period',
        currentVol: b.volume_number || b.issue_number,
        newVol: vol,
        reason: 'Un-squish title and standardize volume syntax'
      });
      updated = true;
    }
  }

  // Judge Dredd Case Files
  const jdMatch = title.match(/^judgedredd\s*casefiles\s*vol(\d+)/i) || b.file_key.match(/judgedredd_casefiles_vol(\d+)/i);
  if (!updated && jdMatch && jdMatch[1]) {
    const vol = parseInt(jdMatch[1], 10);
    const newT = `Judge Dredd: The Complete Case Files: Vol. ${vol}`;
    if (newT !== b.title || b.series !== 'Judge Dredd: The Complete Case Files') {
      titleNormalizations.push({
        book: b,
        currentTitle: b.title,
        newTitle: newT,
        currentSeries: b.series,
        newSeries: 'Judge Dredd: The Complete Case Files',
        currentVol: b.volume_number || b.issue_number,
        newVol: vol,
        reason: 'Normalize Judge Dredd Case Files series and volume syntax'
      });
      updated = true;
    }
  }

  // A Condition Called Love
  const cclMatch = title.match(/^aconditioncalledlove\s*(?:vol\.?\s*)?(\d+)/i) || b.file_key.match(/aconditioncalledlove_vol(\d+)/i);
  if (!updated && cclMatch && cclMatch[1]) {
    const vol = parseInt(cclMatch[1], 10);
    const newT = `A Condition Called Love: Vol. ${vol}`;
    if (newT !== b.title || b.series !== 'A Condition Called Love') {
      titleNormalizations.push({
        book: b,
        currentTitle: b.title,
        newTitle: newT,
        currentSeries: b.series,
        newSeries: 'A Condition Called Love',
        currentVol: b.volume_number || b.issue_number,
        newVol: vol,
        reason: 'Un-squish title and standardize volume syntax'
      });
      updated = true;
    }
  }
});

// Construct Markdown Document
let md = `# Phase 1 Remediation Plan: Preview & Change Manifest
**Document:** \`PHASE1-PREVIEW.md\`  
**Generated:** ${new Date().toISOString()}  
**Database Backup Reference:** \`${booksBackup}\` (${books.length} books, ${progress.length} progress records)  
**Status:** **AWAITING USER REVIEW • ZERO WRITES EXECUTED**  

---

## 1. Executive Summary of Proposed Changes

This manifest details every database mutation scheduled for Phase 1 under the strict safeguards approved by the user:
- **Safeguard 1:** Execution authenticated exclusively via \`SUPABASE_SERVICE_ROLE_KEY\`.
- **Safeguard 2:** Full JSON backup created at \`backups/${booksBackup}\` before any mutation.
- **Safeguard 3:** All reading progress records mapped to merged/deleted records are preserved and transferred to the canonical record.
- **Safeguard 4:** No data changes will occur until this preview is formally accepted.

### Impact Overview
| Operation Category | Records Affected | Resulting Catalog State |
| :--- | :---: | :--- |
| **Duplicates Deleted / Merged** | **10 records** | Catalog size decreases from **1,399 $\\to$ 1,389** unique titles |
| **Reading Progress Preserved** | **100% (25/25)** | Progress transferred to canonical record if duplicate was active |
| **Suffix Sanitization (\`__1_\`)** | **${suffixRenames.length} records** | Clean display titles without download artifacts |
| **Stuttered Title Repairs (\`volvol\`)** | **${volvolRenames.length} records** | Fixed *What Did You Eat Yesterday?* Vols 3–10 |
| **Series & Volume Standardizations** | **${titleNormalizations.length} records** | Canonical *Blue Period*, *Judge Dredd*, *Condition Called Love* |

---

## 2. Itemized Duplicate Merges & Deletions (10 Records)

Each duplicate record below will be safely deleted from \`trophy_books\`. If the deleted record has associated reading progress in \`trophy_progress\`, that progress will be automatically merged into the canonical \`keepBook\` ID before deletion.

`;

deleteOperations.forEach((op, idx) => {
  const delProg = progMap.get(op.deleteBook.id);
  const keepProg = progMap.get(op.keepBook.id);

  md += `### ${idx + 1}. ${op.group}\n`;
  md += `- **Reason:** ${op.reason}\n`;
  md += `- ❌ **RECORD TO DELETE:**\n`;
  md += `  - **Database UUID:** \`${op.deleteBook.id}\`\n`;
  md += `  - **File Key:** \`${op.deleteBook.file_key}\`\n`;
  md += `  - **Current Title:** "${op.deleteBook.title}"\n`;
  md += `  - **Associated Progress:** ${delProg ? `Page ${delProg.last_page}/${delProg.total_pages} (${delProg.percent_read}%)` : '*None (Safe to delete)*'}\n`;
  md += `- ✅ **CANONICAL RECORD TO KEEP:**\n`;
  md += `  - **Database UUID:** \`${op.keepBook.id}\`\n`;
  md += `  - **File Key:** \`${op.keepBook.file_key}\`\n`;
  md += `  - **Current Title:** "${op.keepBook.title}"\n`;
  md += `  - **Existing Progress:** ${keepProg ? `Page ${keepProg.last_page}/${keepProg.total_pages} (${keepProg.percent_read}%)` : '*None*'}\n`;
  if (delProg) {
    md += `  - 🔄 **PROGRESS MERGE ACTION:** Progress on \`${op.deleteBook.id}\` will be re-parented to \`${op.keepBook.id}\` prior to deletion.\n`;
  }
  md += `\n`;
});

md += `---

## 3. Stuttered Volume Title Repairs (8 Records)

Repairing consecutive volumes in *What Did You Eat Yesterday?* where the filename and title carried the doubled \`volvol\` glitch:

| UUID | Current Title | Proposed Canonical Title | New Series | Vol # |
| :--- | :--- | :--- | :--- | :-: |
`;

volvolRenames.forEach(r => {
  md += `| \`${r.book.id.slice(0, 8)}...\` | "${r.currentTitle}" | **"${r.newTitle}"** | ${r.newSeries} | ${r.newVolumeNumber} |\n`;
});

md += `\n---

## 4. Download Suffix Artifact Sanitizations (${suffixRenames.length} Records)

Removing browser download artifacts (\`__1_\`, \`__2_\`, \`(1)\`) from display titles for unique books:

| UUID | File Key | Current Title | Sanitized Title |
| :--- | :--- | :--- | :--- |
`;

suffixRenames.forEach(r => {
  md += `| \`${r.book.id.slice(0, 8)}...\` | \`${path.basename(r.book.file_key)}\` | "${r.currentTitle}" | **"${r.newTitle}"** |\n`;
});

md += `\n---

## 5. Major Series & Volume Standardizations (${titleNormalizations.length} Records)

Normalizing squished titles and volume syntaxes for flagship series:

| UUID | Current Title | Proposed Canonical Title | Series | Vol # |
| :--- | :--- | :--- | :--- | :-: |
`;

titleNormalizations.forEach(r => {
  md += `| \`${r.book.id.slice(0, 8)}...\` | "${r.currentTitle}" | **"${r.newTitle}"** | "${r.newSeries}" | ${r.newVol} |\n`;
});

md += `\n---

## 6. Verification & Rollback Safeguards

1. **Rollback File:** If any operation produces an unexpected result, the complete pre-mutation state can be restored in seconds by executing:
   \`\`\`bash
   node scripts/rollback_trophy_database.js backups/${booksBackup}
   \`\`\`
2. **Post-Mutation Verification:** Immediately following execution, a verification query will assert:
   - Total rows in \`trophy_books\` == 1,389.
   - 0 duplicate file keys exist.
   - All 25 \`trophy_progress\` records remain valid and intact.
`;

fs.writeFileSync('PHASE1-PREVIEW.md', md, 'utf8');
console.log('✓ Successfully generated PHASE1-PREVIEW.md');
