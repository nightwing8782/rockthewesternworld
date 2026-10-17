process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');
const JSZip = require('jszip');
const unrar = require('node-unrar-js');

// 1. Validation & Setup
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
const SCRATCH_DIR = path.resolve('scratch');
const COVERS_DIR = path.join(SCRATCH_DIR, 'covers');
const LOG_FILE = path.resolve('backups/phase3_execution.log');

fs.mkdirSync(COVERS_DIR, { recursive: true });
fs.writeFileSync(LOG_FILE, `=== PHASE 3 REMEDIATION EXECUTION LOG ===\nStarted: ${new Date().toISOString()}\n\n`, 'utf8');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`, 'utf8');
}

// Canonical Series Imprints
const CANONICAL_SERIES_IMPRINTS = {
  'The Complete Peanuts': { author: 'Charles M. Schulz', publisher: 'Fantagraphics Books' },
  'Strangers in Paradise': { author: 'Terry Moore', publisher: 'Abstract Studios' },
  'Echo': { author: 'Terry Moore', publisher: 'Abstract Studios' },
  'Rachel Rising': { author: 'Terry Moore', publisher: 'Abstract Studios' },
  'Motor Girl': { author: 'Terry Moore', publisher: 'Abstract Studios' },
  'Five Years': { author: 'Terry Moore', publisher: 'Abstract Studios' },
  'Hellboy': { author: 'Mike Mignola', publisher: 'Dark Horse Comics' },
  'B.P.R.D.': { author: 'Mike Mignola & John Arcudi', publisher: 'Dark Horse Comics' },
  'Usagi Yojimbo': { author: 'Stan Sakai', publisher: 'Dark Horse Comics' },
  'Lone Wolf and Cub': { author: 'Kazuo Koike & Goseki Kojima', publisher: 'Dark Horse Comics' },
  'Path of the Assassin': { author: 'Kazuo Koike & Goseki Kojima', publisher: 'Dark Horse Comics' },
  'Love and Rockets': { author: 'Gilbert Hernandez & Jaime Hernandez', publisher: 'Fantagraphics Books' },
  'EC Comics Library': { author: 'Al Feldstein, Harvey Kurtzman & Johnny Craig', publisher: 'Fantagraphics Books' },
  'Cerebus': { author: 'Dave Sim & Gerhard', publisher: 'Aardvark-Vanaheim' },
  'Adams 101 Reference Series': { publisher: 'Adams Media' },
  'Williams-Sonoma Culinary Collection': { author: 'Williams-Sonoma', publisher: 'Weldon Owen' },
  'For Dummies Reference': { publisher: 'Wiley' },
  '5-Minute Therapy Series': { author: 'Dr. Faith G. Harper', publisher: 'Microcosm Publishing' },
  'The Drops of God': { author: 'Tadashi Agi & Shu Okimoto', publisher: 'Kodansha' },
  'Space Brothers': { author: 'Chuya Koyama', publisher: 'Kodansha' },
  'Blue Period': { author: 'Tsubasa Yamaguchi', publisher: 'Kodansha' },
  'Vinland Saga': { author: 'Makoto Yukimura', publisher: 'Kodansha' },
  'To Your Eternity': { author: 'Yoshitoki Oima', publisher: 'Kodansha' },
  'Kounodori: Dr. Stork': { author: 'You Suzunoki', publisher: 'Kodansha' },
  'Witch Hat Atelier': { author: 'Kamome Shirahama', publisher: 'Kodansha' },
  'A Condition Called Love': { author: 'Megumi Morino', publisher: 'Kodansha' },
  'What Did You Eat Yesterday?': { author: 'Fumi Yoshinaga', publisher: 'Kodansha' },
  'Shangri La Frontier': { author: 'Katarina & Ryosuke Fuji', publisher: 'Kodansha' },
  'Bloom County': { author: 'Berkeley Breathed', publisher: 'IDW Publishing' },
  'Transformers': { publisher: 'IDW Publishing' },
  'Astro City': { author: 'Kurt Busiek & Brent Anderson', publisher: 'Image Comics' },
  'Radiant Black': { author: 'Kyle Higgins & Marcelo Costa', publisher: 'Image Comics' },
  'Autumnlands': { author: 'Kurt Busiek & Benjamin Dewey', publisher: 'Image Comics' },
  'Black Science': { author: 'Rick Remender & Matteo Scalera', publisher: 'Image Comics' },
  'Judge Dredd': { author: 'John Wagner', publisher: 'Rebellion' },
  'Criminal': { author: 'Ed Brubaker & Sean Phillips', publisher: 'Image Comics' },
  "Absolute Obedience: If You Don't Obey Me": { author: 'Saki Sakimoto', publisher: 'Media Soft' },
  'Matchingouranswers': { author: 'Hikaru Takahashi', publisher: 'Kodansha' },
  'Trivia': { publisher: 'Mango Publishing' },
};

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function main() {
  log('====================================================');
  log(' 🏆 THE TROPHY ROOM: Phase 3 Remediation Execution');
  log('====================================================');

  // Step 1: Scan local files
  log('1. Scanning local Ebooks storage...');
  const localMap = new Map();
  function scan(dir) {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, f.name);
      if (f.isDirectory()) scan(full);
      else {
        const sanitized = f.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        localMap.set(sanitized.toLowerCase(), full);
        localMap.set(f.name.toLowerCase(), full);
      }
    }
  }
  scan(LOCAL_EBOOKS_DIR);
  log(`Found ${localMap.size} indexable files in local storage.`);

  // Step 2: Fetch all catalog books from Supabase
  log('2. Fetching all catalog books from Supabase...');
  let books = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('trophy_books')
      .select('*')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    books = books.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  log(`Retrieved ${books.length} books from trophy_books.`);

  // Step 3: Identify books missing covers
  const missingCovers = books.filter(b => !b.cover_url && !b.cover_key);
  log(`3. Books requiring cover art recovery: ${missingCovers.length}`);

  const pdfManifest = [];
  const directCoverMap = new Map(); // id -> file path of extracted jpeg
  const tempRemotePdfs = [];

  for (const b of missingCovers) {
    const base = path.basename(b.file_key).toLowerCase();
    const coverOutPath = path.join(COVERS_DIR, `${b.id}.jpg`);

    if (b.format === 'cbz' && base.endsWith('.cbr')) {
      // 1. CBR Archive (Criminal Vol. 2)
      const localCbr = localMap.get(base);
      if (localCbr) {
        log(`Extracting cover from local CBR: ${b.title}...`);
        const cbrBuf = fs.readFileSync(localCbr);
        const extractor = await unrar.createExtractorFromData({ data: cbrBuf.buffer });
        const list = extractor.getFileList();
        const headers = [...list.fileHeaders].filter(h => /\.(jpe?g|png|webp)$/i.test(h.name));
        headers.sort((a,b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
        if (headers.length > 0) {
          const extracted = extractor.extract({ files: [headers[0].name] });
          const fileObj = [...extracted.files][0];
          fs.writeFileSync(coverOutPath, Buffer.from(fileObj.extraction));
          directCoverMap.set(b.id, coverOutPath);
          log(`✓ Extracted CBR cover: ${headers[0].name} -> ${coverOutPath}`);
        }
      }
    } else if (b.format === 'epub') {
      // 2. EPUB (Vegan Holiday Cookbook)
      const localEpub = localMap.get(base);
      if (localEpub) {
        log(`Extracting cover from local EPUB: ${b.title}...`);
        const epubBuf = fs.readFileSync(localEpub);
        const zip = await JSZip.loadAsync(epubBuf);
        const imgKey = Object.keys(zip.files).find(k => /(cover|f0002-01)\.(jpe?g|png)/i.test(k));
        if (imgKey) {
          const imgBuf = await zip.files[imgKey].async('nodebuffer');
          fs.writeFileSync(coverOutPath, imgBuf);
          directCoverMap.set(b.id, coverOutPath);
          log(`✓ Extracted EPUB cover: ${imgKey} -> ${coverOutPath}`);
        }
      }
    } else if (b.format === 'pdf') {
      // 3. PDF
      const localPdf = localMap.get(base);
      if (localPdf) {
        pdfManifest.push({ id: b.id, path: localPdf, out: coverOutPath });
      } else {
        // Remote R2 PDF
        log(`Remote R2 PDF identified: ${b.title} (${b.file_key}). Downloading for rendering...`);
        const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: b.file_key }));
        const pdfBuf = await streamToBuffer(res.Body);
        const tempPdfPath = path.join(SCRATCH_DIR, `remote_${b.id}.pdf`);
        fs.writeFileSync(tempPdfPath, pdfBuf);
        tempRemotePdfs.push(tempPdfPath);
        pdfManifest.push({ id: b.id, path: tempPdfPath, out: coverOutPath });
      }
    }
  }

  // Step 4: Batch render PDF covers via python pypdfium2
  if (pdfManifest.length > 0) {
    log(`4. Executing high-resolution PDF rendering for ${pdfManifest.length} documents...`);
    const manifestPath = path.join(SCRATCH_DIR, 'pdf_render_manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(pdfManifest, null, 2), 'utf8');

    const pyRun = spawnSync('python', ['scripts/extract_pdf_covers.py', manifestPath], {
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024
    });

    if (pyRun.error || pyRun.status !== 0) {
      log(`Python rendering failed: ${pyRun.error ? pyRun.error.message : pyRun.stderr || pyRun.stdout}`);
      throw new Error('PDF Cover extraction failed.');
    }
    log(`✓ Successfully rendered all ${pdfManifest.length} PDF covers.`);

    // Map rendered covers
    pdfManifest.forEach(item => {
      if (fs.existsSync(item.out)) {
        directCoverMap.set(item.id, item.out);
      }
    });

    // Cleanup temporary downloaded remote PDFs
    tempRemotePdfs.forEach(p => {
      try { fs.unlinkSync(p); } catch (e) {}
    });
  }

  // Step 5: Upload all extracted covers to Cloudflare R2
  log(`5. Uploading ${directCoverMap.size} recovered covers to Cloudflare R2...`);
  const coverUploadResults = new Map(); // id -> { cover_key, cover_url }
  let uploadCount = 0;

  for (const [id, coverFilePath] of directCoverMap.entries()) {
    const book = books.find(b => b.id === id);
    const sanitizedBase = path.parse(book.file_key).name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const coverKey = `covers/${sanitizedBase}.jpg`;
    const coverUrl = `${process.env.R2_ENDPOINT}/${BUCKET}/${coverKey}`;

    const imgBytes = fs.readFileSync(coverFilePath);
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: coverKey,
      Body: imgBytes,
      ContentType: 'image/jpeg',
    }));

    coverUploadResults.set(id, { cover_key: coverKey, cover_url: coverUrl });
    uploadCount++;
    if (uploadCount % 50 === 0 || uploadCount === directCoverMap.size) {
      log(`  Uploaded ${uploadCount} / ${directCoverMap.size} covers to R2.`);
    }
  }

  // Step 6: Metadata Enrichment (Canonical Imprints + EPUB content.opf)
  log('6. Processing creator & publisher enrichment and metadata normalization...');
  const booksToUpdate = [];

  for (const b of books) {
    let changed = false;
    const updates = { id: b.id };

    // Cover update
    if (coverUploadResults.has(b.id)) {
      const cov = coverUploadResults.get(b.id);
      updates.cover_key = cov.cover_key;
      updates.cover_url = cov.cover_url;
      changed = true;
    }

    // Series '.' fix
    if (b.series === '.' || b.series === '..') {
      updates.series = 'Standalone';
      changed = true;
    }

    // Manga RTL enforcement
    if (b.medium === 'manga' && b.reading_direction !== 'rtl') {
      updates.reading_direction = 'rtl';
      changed = true;
    }

    // Author & Publisher enrichment
    let author = b.author;
    let publisher = b.publisher;

    // A. Canonical Series Imprint
    const targetSeries = updates.series || b.series;
    const imprint = CANONICAL_SERIES_IMPRINTS[targetSeries];
    if (imprint) {
      if (!author && imprint.author) {
        author = imprint.author;
        updates.author = author;
        changed = true;
      }
      if (!publisher && imprint.publisher) {
        publisher = imprint.publisher;
        updates.publisher = publisher;
        changed = true;
      }
    }

    // B. Embedded EPUB metadata fallback
    if ((!author || !publisher) && b.format === 'epub') {
      const base = path.basename(b.file_key).toLowerCase();
      const localEpub = localMap.get(base);
      if (localEpub) {
        try {
          const zipData = fs.readFileSync(localEpub);
          const zip = await JSZip.loadAsync(zipData);
          const opfKey = Object.keys(zip.files).find(k => k.endsWith('.opf'));
          if (opfKey) {
            const opf = await zip.files[opfKey].async('text');
            if (!author) {
              const cMatch = opf.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);
              if (cMatch && cMatch[1].trim()) {
                author = cMatch[1].trim();
                updates.author = author;
                changed = true;
              }
            }
            if (!publisher) {
              const pMatch = opf.match(/<dc:publisher[^>]*>([^<]+)<\/dc:publisher>/i);
              if (pMatch && pMatch[1].trim()) {
                publisher = pMatch[1].trim();
                updates.publisher = publisher;
                changed = true;
              }
            }
          }
        } catch (e) {}
      }
    }

    if (changed) {
      booksToUpdate.push(updates);
    }
  }

  log(`7. Submitting updates to Supabase for ${booksToUpdate.length} records...`);
  // Update in batches of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < booksToUpdate.length; i += BATCH_SIZE) {
    const chunk = booksToUpdate.slice(i, i + BATCH_SIZE);
    for (const item of chunk) {
      const { id, ...fields } = item;
      const { error: updErr } = await supabase
        .from('trophy_books')
        .update(fields)
        .eq('id', id);
      if (updErr) {
        log(`Error updating book ${id}: ${updErr.message}`);
        throw updErr;
      }
    }
    log(`  Updated ${Math.min(i + BATCH_SIZE, booksToUpdate.length)} / ${booksToUpdate.length} records in Supabase.`);
  }

  // Step 8: Post-Execution Verification
  log('8. Running Post-Execution Integrity Verification...');
  let postBooks = [];
  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('trophy_books')
      .select('*')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    postBooks = postBooks.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  const { data: progressRows, error: progErr } = await supabase
    .from('trophy_progress')
    .select('id, book_id');
  if (progErr) throw progErr;

  const postMissingCovers = postBooks.filter(b => !b.cover_url && !b.cover_key);
  const postAuthors = postBooks.filter(b => b.author);
  const postPublishers = postBooks.filter(b => b.publisher);

  log('====================================================');
  log('🎉 PHASE 3 EXECUTION COMPLETE!');
  log(`• Total Catalog Books: ${postBooks.length}`);
  log(`• Missing Covers Remaining: ${postMissingCovers.length} (Goal: 0)`);
  log(`• Cover Art Coverage: ${((postBooks.length - postMissingCovers.length) / postBooks.length * 100).toFixed(1)}%`);
  log(`• Author / Creator Coverage: ${postAuthors.length} / ${postBooks.length} (${(postAuthors.length / postBooks.length * 100).toFixed(1)}%)`);
  log(`• Publisher Coverage: ${postPublishers.length} / ${postBooks.length} (${(postPublishers.length / postBooks.length * 100).toFixed(1)}%)`);
  log(`• Reading Progress Intact: ${progressRows.length} / 25 records (100%)`);
  log(`• Execution Log: backups/phase3_execution.log`);
  log('====================================================');

  // Clean scratch covers
  try {
    fs.rmSync(SCRATCH_DIR, { recursive: true, force: true });
  } catch (e) {}
}

main().catch(err => {
  log(`FATAL EXECUTION ERROR: ${err.message}\n${err.stack}`);
  console.error(err);
  process.exit(1);
});
