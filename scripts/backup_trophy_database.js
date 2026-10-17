process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Fatal: SUPABASE_SERVICE_ROLE_KEY is required.');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runBackup() {
  console.log('--- TROPHY ROOM: PRE-MUTATION DATABASE BACKUP ---');
  const backupDir = path.resolve('backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // 1. Backup trophy_books
  console.log('1. Fetching all records from trophy_books...');
  let books = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('trophy_books')
      .select('*')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error fetching trophy_books:', error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    books = books.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  console.log(`✓ Retrieved ${books.length} records from trophy_books.`);

  // 2. Backup trophy_progress
  console.log('2. Fetching all records from trophy_progress...');
  let progress = [];
  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('trophy_progress')
      .select('*')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error fetching trophy_progress:', error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    progress = progress.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  console.log(`✓ Retrieved ${progress.length} records from trophy_progress.`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const booksBackupFile = path.join(backupDir, `trophy_books_backup_${timestamp}.json`);
  const progressBackupFile = path.join(backupDir, `trophy_progress_backup_${timestamp}.json`);

  fs.writeFileSync(booksBackupFile, JSON.stringify(books, null, 2), 'utf8');
  fs.writeFileSync(progressBackupFile, JSON.stringify(progress, null, 2), 'utf8');

  console.log(`\n✓ Backups successfully written:`);
  console.log(`  - ${booksBackupFile} (${(fs.statSync(booksBackupFile).size / 1024).toFixed(1)} KB)`);
  console.log(`  - ${progressBackupFile} (${(fs.statSync(progressBackupFile).size / 1024).toFixed(1)} KB)`);
}

runBackup().catch((err) => {
  console.error('Fatal backup error:', err);
  process.exit(1);
});
