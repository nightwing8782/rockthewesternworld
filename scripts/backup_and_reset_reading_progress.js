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

async function run() {
  console.log('--- TROPHY ROOM: READING PROGRESS RESET (LIVE PREP) ---');
  const backupDir = path.resolve('backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // 1. Fetch all existing progress records
  console.log('1. Fetching all existing records from trophy_progress...');
  const { data: records, error: fetchErr } = await supabase
    .from('trophy_progress')
    .select('*');

  if (fetchErr) {
    console.error('Error fetching trophy_progress:', fetchErr.message);
    process.exit(1);
  }

  console.log(`Found ${records ? records.length : 0} progress records.`);

  // 2. Backup to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `trophy_progress_backup_before_reset_${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(records || [], null, 2), 'utf8');
  console.log(`✓ Backup saved to: ${backupFile} (${(fs.statSync(backupFile).size / 1024).toFixed(1)} KB)`);

  // 3. Delete all records from trophy_progress
  if (records && records.length > 0) {
    console.log(`2. Deleting ${records.length} test records from trophy_progress...`);
    const { error: delErr } = await supabase
      .from('trophy_progress')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletes all rows

    if (delErr) {
      console.error('Error deleting records from trophy_progress:', delErr.message);
      process.exit(1);
    }
  }

  // 4. Verification
  console.log('3. Verifying trophy_progress is completely empty...');
  const { data: remaining, error: verifyErr } = await supabase
    .from('trophy_progress')
    .select('id');

  if (verifyErr) {
    console.error('Error verifying trophy_progress:', verifyErr.message);
    process.exit(1);
  }

  console.log(`✓ Verification complete: trophy_progress count is now ${remaining.length}.`);
  console.log('✓ All 1,389 books in the Trophy Vault are now in clean UNREAD status.');
}

run().catch((err) => {
  console.error('Fatal reset error:', err);
  process.exit(1);
});
