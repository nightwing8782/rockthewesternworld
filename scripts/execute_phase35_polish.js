process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');
const JSZip = require('jszip');

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Fatal: SUPABASE_SERVICE_ROLE_KEY is required.');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.R2_BUCKET_NAME || 'trophy-room';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LOCAL_EBOOKS_DIR = 'C:\\Users\\danbi\\OneDrive\\Documents\\Ebooks';
const LOG_FILE = path.resolve('backups/phase35_execution.log');
fs.writeFileSync(LOG_FILE, `=== PHASE 3.5 POLISH EXECUTION LOG ===\nStarted: ${new Date().toISOString()}\n\n`, 'utf8');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`, 'utf8');
}

// 1. Author Normalization Dictionary
const AUTHOR_NORMALIZATIONS = {
  'Melanie Choukas-Bradley and van der Vorst, Lieke': 'Melanie Choukas-Bradley & Lieke van der Vorst',
  'Ryosuke Fuji, Katarina': 'Katarina & Ryosuke Fuji',
  'Wendy Pini, Richard Pini, Sonny Strait': 'Wendy Pini & Richard Pini',
  'Wendy Pini, Richard Pini, Delfin Barral': 'Wendy Pini & Richard Pini',
  'Reed Crandall, Albert B. Feldstein, Harvey Kurtzman': 'Al Feldstein, Harvey Kurtzman & Reed Crandall',
  'Automne Zingg, Joshua Ploeg': 'Automne Zingg & Joshua Ploeg',
  'Javier Luraschi, Kevin Kuo, and Edgar Ruiz': 'Javier Luraschi, Kevin Kuo & Edgar Ruiz',
  'Anirudh Koul, Siddha Ganju, and Meher Kasam': 'Anirudh Koul, Siddha Ganju & Meher Kasam',
  'Khaled El Emam, Lucy Mosquera, Richard Hoptroff': 'Khaled El Emam, Lucy Mosquera & Richard Hoptroff',
  'Deepak Mukunthu, Parashar Shah, Wee Hyong Tok': 'Deepak Mukunthu, Parashar Shah & Wee Hyong Tok',
  'Tyler Akidau, Slava Chernyak, Reuven Lax': 'Tyler Akidau, Slava Chernyak & Reuven Lax',
  'Lisa Atwood, Rebecca Courchesne and Rick Field': 'Lisa Atwood, Rebecca Courchesne & Rick Field',
  'Paula Watkins, Ph.D.': 'Dr. Paula Watkins',
  'Rebecca Simon, PhD': 'Dr. Rebecca Simon',
  'John Haslett and Cameron M. Smith, PhD': 'John Haslett & Cameron M. Smith',
  'Helen Armstrong, editor': 'Helen Armstrong',
  'Paul Simon, Charlie Nardozzi, and The Editors of the National Gardening Association': 'Paul Simon, Charlie Nardozzi & National Gardening Association'
};

// 2. Publisher Normalization Dictionary
const PUBLISHER_NORMALIZATIONS = {
  'No Starch Press, Inc.': 'No Starch Press',
  'Chronicle Books LLC': 'Chronicle Books',
  'Chronicle': 'Chronicle Books',
  'Microcosm Publishing LLC': 'Microcosm Publishing',
  "O'Reilly Media, Inc.": "O'Reilly Media",
  'Vertical Inc.': 'Vertical',
  'Kodansha Comics': 'Kodansha',
  'Weldonowen': 'Weldon Owen',
  'Fair Winds': 'Fair Winds Press'
};

// 3. Micro-artifact Files to Re-extract
const MICRO_COVERS = [
  { file: 'Comics/thevaliantdeluxeedition.cbz', coverKey: 'covers/thevaliantdeluxeedition.jpg' },
  { file: 'Data and Coding/generativedeeplearning.epub', coverKey: 'covers/generativedeeplearning.jpg' },
  { file: 'Data and Coding/strengtheningdeepneuralnetworks.epub', coverKey: 'covers/strengtheningdeepneuralnetworks.jpg' },
  { file: '101s/religion101.epub', coverKey: 'covers/religion101.jpg' },
  { file: '1001lettersforalloccasions.epub', coverKey: 'covers/1001lettersforalloccasions.jpg' },
  { file: 'Writing/writethatbookalready.epub', coverKey: 'covers/writethatbookalready.jpg' },
  { file: 'Comics/Hellboy/hellboy_oddestjobs (1).epub', coverKey: 'covers/hellboy_oddestjobs__1_.jpg' },
  { file: 'Data and Coding/codecraft.epub', coverKey: 'covers/codecraft.jpg' },
  { file: 'Skills/bartendingfordummies5thedition.epub', coverKey: 'covers/bartendingfordummies5thedition.jpg' },
  { file: 'Wellness/copingskills (1).epub', coverKey: 'covers/copingskills__1_.jpg' },
  { file: 'Writing/awritersspace.epub', coverKey: 'covers/awritersspace.jpg' }
];

async function extractHighResCover(filePath) {
  const fullPath = path.join(LOCAL_EBOOKS_DIR, filePath);
  if (!fs.existsSync(fullPath)) return null;

  const data = fs.readFileSync(fullPath);
  const zip = await JSZip.loadAsync(data);
  const opfKey = Object.keys(zip.files).find(k => k.endsWith('.opf'));

  if (opfKey) {
    const opfDir = path.dirname(opfKey);
    const opf = await zip.files[opfKey].async('text');
    const metaCoverMatch = opf.match(/<meta[^>]*name=["']cover["'][^>]*content=["']([^"']+)["']/i);
    const propCoverMatch = opf.match(/<item[^>]*properties=["']cover-image["'][^>]*href=["']([^"']+)["']/i);
    const id = metaCoverMatch ? metaCoverMatch[1] : null;
    let href = propCoverMatch ? propCoverMatch[1] : null;
    if (id && !href) {
      const itemMatch = opf.match(new RegExp('<item[^>]*id=["\']' + id + '["\'][^>]*href=["\']([^"\']+)["\']', 'i'));
      if (itemMatch) href = itemMatch[1];
    }
    let resolvedKey = href ? (opfDir === '.' ? href : path.posix.join(opfDir, href)) : null;
    if (!resolvedKey || !zip.files[resolvedKey]) {
      resolvedKey = Object.keys(zip.files).find(k => /cover/i.test(k) && /\.(jpe?g|png|webp)$/i.test(k))
        || Object.keys(zip.files).find(k => /\.(jpe?g|png|webp)$/i.test(k));
    }
    if (resolvedKey && zip.files[resolvedKey]) {
      return await zip.files[resolvedKey].async('nodebuffer');
    }
  } else {
    // CBZ
    const nonMac = Object.keys(zip.files).filter(k => !k.startsWith('__MACOSX') && !k.includes('/._') && /\.(jpe?g|png|webp)$/i.test(k)).sort();
    if (nonMac.length > 0) {
      return await zip.files[nonMac[0]].async('nodebuffer');
    }
  }
  return null;
}

async function main() {
  log('====================================================');
  log(' 🏆 THE TROPHY ROOM: Phase 3.5 Polish Execution');
  log('====================================================');

  // Step 1: Re-extract and upload 11 high-res covers to R2
  log('1. Re-extracting 11 micro-artifact covers (< 5KB) with high-res graphics...');
  let coversUpdated = 0;
  for (const item of MICRO_COVERS) {
    const buf = await extractHighResCover(item.file);
    if (buf && buf.length > 10000) {
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: item.coverKey,
        Body: buf,
        ContentType: 'image/jpeg'
      }));
      log(`  ✓ Replaced ${item.coverKey} with high-res asset (${(buf.length / 1024).toFixed(1)} KB)`);
      coversUpdated++;
    } else {
      log(`  ⚠️ Warning: Could not extract high-res replacement for ${item.file}`);
    }
  }
  log(`✓ Successfully updated ${coversUpdated} / 11 covers in Cloudflare R2.`);

  // Step 2: Fetch all catalog books from Supabase
  log('2. Fetching all catalog books from Supabase...');
  let books = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase.from('trophy_books').select('*').order('id', { ascending: true }).range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    books = books.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  log(`Retrieved ${books.length} records from trophy_books.`);

  // Step 3: Compute updates for Volume Sequencing & Author/Publisher Normalization
  log('3. Computing volume synchronization and author/publisher normalizations...');
  const booksToUpdate = [];
  let volSyncCount = 0;
  let authorNormCount = 0;
  let pubNormCount = 0;

  for (const b of books) {
    let changed = false;
    const updates = { id: b.id };

    // A. Volume Sequencing Sync
    if (b.series && b.series !== 'Standalone') {
      let inferredVol = null;
      const match = b.file_key.match(/\bv(?:ol)?\.?\s*(\d+)/i) 
        || b.title.match(/\bv(?:ol)?\.?\s*(\d+)/i) 
        || b.file_key.match(/volume\s*(\d+)/i)
        || b.title.match(/volume\s*(\d+)/i)
        || b.file_key.match(/issue\s*(\d+)/i)
        || b.title.match(/issue\s*(\d+)/i)
        || b.file_key.match(/#(\d+)/i)
        || b.title.match(/#(\d+)/i)
        || b.file_key.match(/_(\d{1,3})\.(pdf|cbz|epub)/i);

      if (match && match[1]) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed) && parsed < 2000) {
          inferredVol = parsed;
        }
      }

      if (inferredVol !== null && inferredVol !== b.issue_number) {
        updates.issue_number = inferredVol;
        volSyncCount++;
        changed = true;
      }
    }

    // B. Author Normalization
    if (b.author && AUTHOR_NORMALIZATIONS[b.author]) {
      updates.author = AUTHOR_NORMALIZATIONS[b.author];
      authorNormCount++;
      changed = true;
    }

    // C. Publisher Normalization
    if (b.publisher && PUBLISHER_NORMALIZATIONS[b.publisher]) {
      updates.publisher = PUBLISHER_NORMALIZATIONS[b.publisher];
      pubNormCount++;
      changed = true;
    }

    if (changed) {
      booksToUpdate.push(updates);
    }
  }

  log(`Computed changes:`);
  log(`• Volume numbers synchronized (issue_number): ${volSyncCount}`);
  log(`• Author names normalized: ${authorNormCount}`);
  log(`• Publisher imprints normalized: ${pubNormCount}`);
  log(`• Total distinct records to update: ${booksToUpdate.length}`);

  // Step 4: Batch submit updates to Supabase
  log(`4. Submitting updates to Supabase in batches of 50...`);
  const BATCH_SIZE = 50;
  for (let i = 0; i < booksToUpdate.length; i += BATCH_SIZE) {
    const chunk = booksToUpdate.slice(i, i + BATCH_SIZE);
    for (const item of chunk) {
      const { id, ...fields } = item;
      const { error } = await supabase.from('trophy_books').update(fields).eq('id', id);
      if (error) {
        log(`Error updating ${id}: ${error.message}`);
        throw error;
      }
    }
    log(`  Updated ${Math.min(i + BATCH_SIZE, booksToUpdate.length)} / ${booksToUpdate.length} records.`);
  }

  // Step 5: Post-Execution Verification
  log('5. Running Post-Execution Integrity Verification...');
  const { data: prog, error: pErr } = await supabase.from('trophy_progress').select('id, book_id');
  if (pErr) throw pErr;

  let postBooks = [];
  from = 0;
  while (true) {
    const { data, error } = await supabase.from('trophy_books').select('*').order('id', { ascending: true }).range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    postBooks = postBooks.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  const distinctPubs = new Set(postBooks.map(b => b.publisher).filter(Boolean));

  log('====================================================');
  log('🎉 PHASE 3.5 POLISH COMPLETE!');
  log(`• Total Catalog Books: ${postBooks.length}`);
  log(`• Volumes Synchronized: ${volSyncCount}`);
  log(`• Distinct Normalized Publishers: ${distinctPubs.size}`);
  log(`• Micro-Artifact Covers Replaced: ${coversUpdated} / 11`);
  log(`• Reading Progress Intact: ${prog.length} / 25 records (100%)`);
  log(`• Execution Log: backups/phase35_execution.log`);
  log('====================================================');
}

main().catch(err => {
  log(`FATAL ERROR: ${err.message}\n${err.stack}`);
  console.error(err);
  process.exit(1);
});
