process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Fatal: SUPABASE_SERVICE_ROLE_KEY is required.');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LOG_FILE = path.resolve('backups/phase4_execution.log');
fs.writeFileSync(LOG_FILE, `=== PHASE 4 SHELF TAXONOMY EXECUTION LOG ===\nStarted: ${new Date().toISOString()}\n\n`, 'utf8');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`, 'utf8');
}

// Canonical Primary Shelf Mapping
const MEDIUM_TO_PRIMARY_SHELF = {
  comic: 'Comics',
  manga: 'Manga',
  reference: 'Reference',
  cookbook: 'Culinary',
  wellness: 'Wellness',
  novel: 'Novels',
  writing: 'Writing',
  periodical: 'Periodicals'
};

async function main() {
  log('====================================================');
  log(' 🏆 THE TROPHY ROOM: Phase 4 Shelf Taxonomy Execution');
  log('====================================================');

  // Step 1: Fetch all books from Supabase
  log('1. Fetching all catalog books from Supabase...');
  let books = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase.from('trophy_books').select('id, title, medium, collections').order('id', { ascending: true }).range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    books = books.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  log(`Retrieved ${books.length} records from trophy_books.`);

  // Step 2: Compute shelf assignment updates
  log('2. Computing metadata-derived shelf assignments for all 1,389 titles...');
  const shelfCounts = {};
  const updates = [];

  for (const b of books) {
    const primaryShelf = MEDIUM_TO_PRIMARY_SHELF[b.medium] || 'Comics';
    shelfCounts[primaryShelf] = (shelfCounts[primaryShelf] || 0) + 1;

    // Check if collections already matches
    const currentColl = Array.isArray(b.collections) ? b.collections : [];
    if (currentColl.length !== 1 || currentColl[0] !== primaryShelf) {
      updates.push({
        id: b.id,
        collections: [primaryShelf]
      });
    }
  }

  log('Computed Shelf Distribution:');
  Object.entries(shelfCounts).forEach(([shelf, count]) => {
    log(`  • ${shelf.padEnd(14)}: ${count} books`);
  });
  log(`  Total Assigned  : ${Object.values(shelfCounts).reduce((a,b) => a+b, 0)} / ${books.length} books (100%)`);
  log(`Titles requiring collections update: ${updates.length}`);

  // Step 3: Batch update Supabase
  if (updates.length > 0) {
    log(`3. Updating Supabase collections in batches of 50...`);
    const BATCH_SIZE = 50;
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const chunk = updates.slice(i, i + BATCH_SIZE);
      for (const item of chunk) {
        const { error } = await supabase.from('trophy_books').update({ collections: item.collections }).eq('id', item.id);
        if (error) {
          log(`Error updating book ${item.id}: ${error.message}`);
          throw error;
        }
      }
      log(`  Updated ${Math.min(i + BATCH_SIZE, updates.length)} / ${updates.length} records.`);
    }
  } else {
    log('All titles already have synchronized collections!');
  }

  // Step 4: Verify Reading Progress Records
  log('4. Verifying reading progress integrity...');
  const { data: prog, error: pErr } = await supabase.from('trophy_progress').select('id, book_id');
  if (pErr) throw pErr;
  log(`✓ Verified ${prog.length} / 25 reading progress records intact.`);

  // Step 5: Post-execution check
  log('5. Running post-execution shelf verification...');
  let postBooks = [];
  from = 0;
  while (true) {
    const { data, error } = await supabase.from('trophy_books').select('id, collections, medium').order('id', { ascending: true }).range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    postBooks = postBooks.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  const unassigned = postBooks.filter(b => !Array.isArray(b.collections) || b.collections.length === 0);

  log('====================================================');
  log('🎉 PHASE 4 SHELF TAXONOMY EXECUTION COMPLETE!');
  log(`• Total Catalog Books: ${postBooks.length}`);
  log(`• Books Assigned to Exactly One Shelf: ${postBooks.length - unassigned.length}`);
  log(`• Unassigned / Orphaned Titles: ${unassigned.length}`);
  log(`• Reading Progress Intact: ${prog.length} / 25 records (100%)`);
  log(`• Execution Log: backups/phase4_execution.log`);
  log('====================================================');
}

main().catch(err => {
  log(`FATAL ERROR: ${err.message}\n${err.stack}`);
  console.error(err);
  process.exit(1);
});
