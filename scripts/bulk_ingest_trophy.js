require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');
const JSZip = require('jszip');

// CLI Arguments
const SOURCE_DIR = process.argv[2] || 'C:\\Users\\danbi\\OneDrive\\Documents\\Ebooks';
const CLI_EMAIL = process.argv[3] || process.env.SUPABASE_AUTH_EMAIL;
const CLI_PASSWORD = process.argv[4] || process.env.SUPABASE_AUTH_PASSWORD;

// R2 Client
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || 'trophy-room';

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function promptInput(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Helpers
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.cbz' || ext === '.zip') return 'application/vnd.comicbook+zip';
  if (ext === '.cbr') return 'application/vnd.comicbook-rar';
  if (ext === '.epub') return 'application/epub+zip';
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}

function parseFilenameHeuristics(filename, parentFolder) {
  let name = filename.replace(/\.(cbz|cbr|zip|epub|pdf)$/i, '');
  name = name.replace(/\[.*?\]/g, ' ').replace(/\((?!19\d\d|20\d\d).*?\)/g, ' ').trim();

  let issueNumber = 1;
  const issueMatch = name.match(/#(\d+(?:\.\d+)?)/) || name.match(/\bv(?:ol)?\.?\s*(\d+)/i) || name.match(/\s(\d{1,4})(?:\s|$)/);
  if (issueMatch && issueMatch[1]) {
    const parsed = parseFloat(issueMatch[1]);
    if (!isNaN(parsed) && parsed < 2000) {
      issueNumber = parsed;
    }
  }

  let series = 'Standalone';
  if (parentFolder && parentFolder !== 'Ebooks' && parentFolder !== 'Comics') {
    series = parentFolder.replace(/^Comics[\/\\]/i, '').trim();
  } else if (name.includes(' - ')) {
    series = name.split(' - ')[0].trim();
  } else if (name.includes('#')) {
    series = name.split('#')[0].trim();
  }

  const cleanTitle = name.replace(/[-_]+/g, ' ').trim();
  return { cleanTitle, series, issueNumber };
}

async function extractCoverFromZip(filePath) {
  try {
    const fileData = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(fileData);

    const imgExtensions = /\.(jpe?g|png|webp|gif|bmp)$/i;
    const imgFiles = Object.keys(zip.files).filter((fname) => !zip.files[fname].dir && imgExtensions.test(fname));

    if (imgFiles.length > 0) {
      imgFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
      const firstImg = zip.files[imgFiles[0]];
      const buffer = await firstImg.async('nodebuffer');
      const mime = getMimeType(imgFiles[0]);
      return { buffer, mime };
    }
  } catch (err) {}
  return null;
}

function scanDirectory(dir, fileList = []) {
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        scanDirectory(fullPath, fileList);
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        if (['.cbz', '.cbr', '.zip', '.epub', '.pdf'].includes(ext)) {
          const stats = fs.statSync(fullPath);
          const relPath = path.relative(SOURCE_DIR, fullPath);
          const parentFolder = path.dirname(relPath);
          fileList.push({
            name: item.name,
            fullPath,
            ext,
            size: stats.size,
            relPath,
            parentFolder,
          });
        }
      }
    }
  } catch (err) {
    console.error('Scan error in', dir, err.message);
  }
  return fileList;
}

async function main() {
  console.log('====================================================');
  console.log(' 🏆 THE TROPHY ROOM: Desktop Bulk Ingestion Engine');
  console.log('====================================================');
  console.log(`Source Folder: ${SOURCE_DIR}`);
  console.log(`Target R2 Bucket: ${BUCKET}`);
  console.log('----------------------------------------------------');

  // Step 1: Authenticate with Supabase
  let activeUserId = null;

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('Using Supabase Service Role Key for admin bypass.');
    activeUserId = 'c582259c-8171-4e05-b69d-a91ba1270333';
  } else {
    let email = CLI_EMAIL;
    let password = CLI_PASSWORD;

    if (!email) {
      email = await promptInput('Enter your Studio Email: ');
    }
    if (!password) {
      password = await promptInput('Enter your Studio Password: ');
    }

    console.log(`Authenticating as ${email}...`);
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authErr) {
      console.error('Authentication failed:', authErr.message);
      process.exit(1);
    }

    activeUserId = authData.user.id;
    console.log(`✓ Authenticated successfully as user ID: ${activeUserId}`);
  }

  console.log('----------------------------------------------------');
  console.log('1. Scanning local storage...');
  const files = scanDirectory(SOURCE_DIR);
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  const totalGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(2);
  console.log(`Found ${files.length} items (${totalGB} GB).`);

  console.log('2. Fetching existing database catalog for deduplication...');
  let existingBooks = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error: dbErr } = await supabase
      .from('trophy_books')
      .select('file_key, title, series, issue_number')
      .range(from, from + pageSize - 1);

    if (dbErr) {
      console.error('Warning: could not query existing books:', dbErr.message);
      break;
    }
    if (!data || data.length === 0) break;
    existingBooks = existingBooks.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  const existingKeySet = new Set((existingBooks || []).map((b) => b.file_key));
  console.log(`Already cataloged in Supabase: ${existingKeySet.size} books.`);

  console.log('3. Starting parallel upload & indexing...');
  console.log('----------------------------------------------------');

  let uploadedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  let uploadedBytes = 0;
  const startTime = Date.now();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const format = file.ext === '.epub' ? 'epub' : file.ext === '.pdf' ? 'pdf' : 'cbz';
    const fileKey = `books/${format}/${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    if (existingKeySet.has(fileKey)) {
      skippedCount++;
      continue;
    }

    const { cleanTitle, series, issueNumber } = parseFilenameHeuristics(file.name, file.parentFolder);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);

    process.stdout.write(
      `[${i + 1}/${files.length}] Uploading "${cleanTitle.slice(0, 35)}" (${series}, #${issueNumber}, ${sizeMB} MB)... `
    );

    try {
      // Step A: Extract Cover if CBZ/ZIP/EPUB
      let coverKey = null;
      let coverUrl = null;

      // Calculate actual page count
      let realPageCount = 100;
      if (format === 'cbz') {
        const cover = await extractCoverFromZip(file.fullPath);
        if (cover) {
          coverKey = `covers/${path.parse(file.name).name.replace(/[^a-zA-Z0-9._-]/g, '_')}.jpg`;
          await s3.send(
            new PutObjectCommand({
              Bucket: BUCKET,
              Key: coverKey,
              Body: cover.buffer,
              ContentType: cover.mime || 'image/jpeg',
            })
          );
          coverUrl = `${process.env.R2_ENDPOINT}/${BUCKET}/${coverKey}`;
          if (cover.pageCount) realPageCount = cover.pageCount;
        }
      }

      // Step B: Upload main file to Cloudflare R2
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: fileKey,
          Body: fs.readFileSync(file.fullPath),
          ContentType: getMimeType(file.name),
        })
      );

      // Step C: Insert into Supabase trophy_books
      const bookRecord = {
        user_id: activeUserId,
        title: cleanTitle,
        series: series,
        issue_number: issueNumber,
        format: format,
        file_key: fileKey,
        file_size: file.size,
        cover_key: coverKey,
        cover_url: coverUrl,
        author: null,
        description: null,
        reading_direction: 'ltr',
        page_count: realPageCount,
        tags: [format.toUpperCase(), series !== 'Standalone' ? 'Series' : 'Single'],
      };

      const { error: insertErr } = await supabase.from('trophy_books').insert(bookRecord);
      if (insertErr) {
        throw insertErr;
      }

      uploadedCount++;
      uploadedBytes += file.size;
      existingKeySet.add(fileKey);
      console.log('✓ DONE');
    } catch (err) {
      errorCount++;
      console.log('✗ ERROR:', err.message);
    }
  }

  const durationSec = Math.round((Date.now() - startTime) / 1000);
  const uploadedGB = (uploadedBytes / (1024 * 1024 * 1024)).toFixed(2);

  console.log('====================================================');
  console.log('🎉 INGESTION COMPLETE!');
  console.log(`• Total Processed: ${files.length} books`);
  console.log(`• Newly Uploaded: ${uploadedCount} books (${uploadedGB} GB)`);
  console.log(`• Already Existed (Skipped): ${skippedCount}`);
  console.log(`• Failed: ${errorCount}`);
  console.log(`• Time Elapsed: ${durationSec}s`);
  console.log('====================================================');
}

main().catch(console.error);
