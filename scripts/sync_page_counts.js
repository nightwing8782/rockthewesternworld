process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');

const SOURCE_DIR = process.argv[2] || 'C:\\Users\\danbi\\OneDrive\\Documents\\Ebooks';
const CLI_EMAIL = process.argv[3] || process.env.SUPABASE_AUTH_EMAIL;
const CLI_PASSWORD = process.argv[4] || process.env.SUPABASE_AUTH_PASSWORD;

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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const IMG_EXTENSIONS = /\.(jpe?g|png|webp|avif|bmp|gif)$/i;

function getPdfPageCount(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    // Search for /Count <number> in PDF catalog / pages tree
    const text = data.toString('latin1');
    const matches = [...text.matchAll(/\/Type\s*\/Pages[\s\S]*?\/Count\s+(\d+)/g)];
    if (matches.length > 0) {
      const counts = matches.map((m) => parseInt(m[1], 10)).filter((n) => !isNaN(n));
      if (counts.length > 0) {
        return Math.max(...counts);
      }
    }
    // Fallback search for any /Count <number>
    const fallbackMatches = [...text.matchAll(/\/Count\s+(\d+)/g)];
    if (fallbackMatches.length > 0) {
      const counts = fallbackMatches.map((m) => parseInt(m[1], 10)).filter((n) => !isNaN(n) && n < 10000);
      if (counts.length > 0) {
        return Math.max(...counts);
      }
    }
  } catch (err) {}
  return null;
}

async function getZipPageCount(filePath, ext) {
  try {
    const fileData = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(fileData);

    if (ext === '.cbz' || ext === '.cbr' || ext === '.zip') {
      const imgCount = Object.keys(zip.files).filter(
        (fname) => !zip.files[fname].dir && IMG_EXTENSIONS.test(fname) && !fname.includes('__MACOSX')
      ).length;
      return imgCount > 0 ? imgCount : null;
    }

    if (ext === '.epub') {
      const htmlCount = Object.keys(zip.files).filter(
        (fname) => !zip.files[fname].dir && /\.(x?html?|xml)$/i.test(fname) && !fname.includes('toc')
      ).length;
      return htmlCount > 0 ? htmlCount : null;
    }
  } catch (err) {}
  return null;
}

function scanLocalDirectory(dir, map = new Map()) {
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        scanLocalDirectory(fullPath, map);
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        if (['.cbz', '.cbr', '.zip', '.epub', '.pdf'].includes(ext)) {
          map.set(item.name.toLowerCase(), {
            name: item.name,
            fullPath,
            ext,
          });
        }
      }
    }
  } catch (err) {}
  return map;
}

async function main() {
  console.log('====================================================');
  console.log(' 📄 TROPHY ROOM: Page Count Synchronization Engine');
  console.log('====================================================');

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('Using Supabase Service Role Key for admin bypass.');
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
    console.log(`✓ Authenticated successfully as user ID: ${authData.user.id}`);
  }

  console.log('1. Scanning local Ebooks files...');
  const localMap = scanLocalDirectory(SOURCE_DIR);
  console.log(`✓ Indexed ${localMap.size} local files.`);

  console.log('2. Fetching database records from Supabase...');
  const { data: dbBooks, error: fetchErr } = await supabase
    .from('trophy_books')
    .select('id, title, series, file_key, page_count')
    .limit(10000);

  if (fetchErr || !dbBooks) {
    console.error('Failed to query Supabase:', fetchErr);
    return;
  }

  console.log(`✓ Retrieved ${dbBooks.length} books. Calculating exact page counts...`);

  let updatedCount = 0;
  for (let i = 0; i < dbBooks.length; i++) {
    const book = dbBooks[i];
    const fileBaseName = path.basename(book.file_key || '');
    const cleanLookupName = fileBaseName.replace(/^books\/(cbz|epub|pdf)\//, '').toLowerCase();

    const localMatch = localMap.get(cleanLookupName) || localMap.get(path.parse(fileBaseName).base.toLowerCase());

    if (!localMatch) continue;

    let realPageCount = null;
    if (localMatch.ext === '.pdf') {
      realPageCount = getPdfPageCount(localMatch.fullPath);
    } else {
      realPageCount = await getZipPageCount(localMatch.fullPath, localMatch.ext);
    }

    if (realPageCount && realPageCount > 0 && realPageCount !== book.page_count) {
      const { error: updateErr } = await supabase
        .from('trophy_books')
        .update({ page_count: realPageCount })
        .eq('id', book.id);

      if (!updateErr) {
        updatedCount++;
        process.stdout.write(`[${i + 1}/${dbBooks.length}] ✓ "${book.title}" -> ${realPageCount} pages\n`);
      }
    }
  }

  console.log('====================================================');
  console.log('🎉 PAGE COUNT SYNC COMPLETE!');
  console.log(`• Total Books Checked: ${dbBooks.length}`);
  console.log(`• Real Page Counts Updated: ${updatedCount}`);
  console.log('====================================================');
}

main().catch(console.error);
