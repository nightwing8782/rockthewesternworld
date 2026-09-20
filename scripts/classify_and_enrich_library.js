process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');
const JSZip = require('jszip');
const { XMLParser } = require('fast-xml-parser');

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

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

function toTitleCase(str) {
  if (!str) return '';
  const lowercase = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'of', 'in', 'with', 'vs'];
  return str
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index > 0 && lowercase.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace(/^([a-z])/, (m) => m.toUpperCase());
}

function scanLocalDirectory(dir, rootDir, map = new Map()) {
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        scanLocalDirectory(fullPath, rootDir, map);
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        if (['.cbz', '.cbr', '.zip', '.epub', '.pdf'].includes(ext)) {
          const relPath = path.relative(rootDir, fullPath);
          const topFolder = relPath.split(path.sep)[0];
          const subFolder = relPath.split(path.sep).length > 2 ? relPath.split(path.sep)[1] : null;

          map.set(item.name.toLowerCase(), {
            name: item.name,
            fullPath,
            ext,
            relPath,
            topFolder,
            subFolder,
          });
        }
      }
    }
  } catch (err) {}
  return map;
}

function classifyBook(book, localMatch) {
  const topFolder = localMatch ? localMatch.topFolder : '';
  const subFolder = localMatch ? localMatch.subFolder : '';
  const filename = localMatch ? localMatch.name : path.basename(book.file_key || '');
  const cleanBase = filename.replace(/\.(cbz|cbr|epub|pdf|zip)$/i, '');
  const lowerName = cleanBase.toLowerCase();

  let medium = 'comic';
  let genres = [];
  let series = book.series || 'Standalone';
  let title = book.title;
  let author = book.author;
  let publisher = book.publisher || null;
  let franchise = book.franchise || null;
  let volumeNumber = book.volume_number || null;
  let issueNumber = book.issue_number || 1;
  let readingDirection = book.reading_direction || 'ltr';
  let aspectRatio = 'portrait';

  // 1. Extract Volume / Issue Number
  const volMatch =
    cleanBase.match(/\bvol(?:ume)?\.?\s*(\d+(?:\.\d+)?)/i) ||
    cleanBase.match(/\bv(\d+(?:\.\d+)?)\b/i) ||
    cleanBase.match(/#\s*(\d+(?:\.\d+)?)/) ||
    cleanBase.match(/\b(?:issue|bk|book)\.?\s*(\d+)/i) ||
    cleanBase.match(/(?:^|\s|_)(\d{1,3})(?:\s*[-_:]|\s*$)/);

  if (volMatch && volMatch[1]) {
    const parsedNum = parseFloat(volMatch[1]);
    if (!isNaN(parsedNum) && parsedNum < 1900) {
      volumeNumber = parsedNum;
      issueNumber = parsedNum;
    }
  }

  // 2. Folder-Driven Taxonomy
  if (topFolder === 'Manga' || lowerName.includes('manga')) {
    medium = 'manga';
    readingDirection = 'rtl';
    genres = ['Manga', 'Japanese'];

    // Group manga runs into series
    const mangaSeriesPrefix = cleanBase.replace(/_?vol(?:ume)?\s*\d+.*$/i, '').replace(/_?v\d+.*$/i, '').replace(/[-_]+/g, ' ').trim();
    if (mangaSeriesPrefix.length > 2) {
      series = toTitleCase(mangaSeriesPrefix);
    }
    title = `${series}${volumeNumber ? ` Vol. ${volumeNumber}` : ''}`;
  } else if (topFolder === 'Cook Books' || lowerName.includes('cookbook') || lowerName.includes('recipe')) {
    medium = 'cookbook';
    genres = ['Culinary', 'Recipes', 'Food & Drink'];
    series = 'Standalone';
    title = toTitleCase(cleanBase.replace(/[-_]+/g, ' ').trim());
  } else if (topFolder === 'Transformers' || lowerName.includes('transformer')) {
    medium = 'comic';
    franchise = 'Transformers Universe';
    publisher = 'IDW Publishing';
    genres = ['Sci-Fi', 'Mecha', 'Action'];
    series = subFolder ? toTitleCase(subFolder.replace(/[-_]+/g, ' ')) : 'Transformers';
    title = toTitleCase(cleanBase.replace(/[-_]+/g, ' ').trim());
  } else if (topFolder === 'Wellness') {
    medium = 'wellness';
    genres = ['Mindfulness', 'Health', 'Self-Help', 'Lifestyle'];
    series = 'Standalone';
    title = toTitleCase(cleanBase.replace(/[-_]+/g, ' ').trim());
  } else if (topFolder === 'Skills') {
    medium = 'reference';
    genres = ['Practical Skills', 'How-To', 'Technical Guides'];
    series = lowerName.includes('dummies') ? 'For Dummies Series' : 'Standalone';
    title = toTitleCase(cleanBase.replace(/[-_]+/g, ' ').trim());
  } else if (topFolder === '101s' || lowerName.endsWith('101')) {
    medium = 'reference';
    series = 'Adams 101 Reference Series';
    publisher = 'Adams Media';
    genres = ['Reference', 'Education', 'Comprehensive Guides'];
    title = toTitleCase(cleanBase.replace(/[-_]+/g, ' ').trim());
  } else if (topFolder === 'Writing') {
    medium = 'writing';
    genres = ['Writing', 'Screenwriting', 'Creative Craft'];
    series = 'Standalone';
    title = toTitleCase(cleanBase.replace(/[-_]+/g, ' ').trim());
  } else if (topFolder === 'Data and Coding') {
    medium = 'reference';
    genres = ['Programming', 'Computer Science', 'Data Science', 'Technology'];
    series = 'Standalone';
    title = toTitleCase(cleanBase.replace(/[-_]+/g, ' ').trim());
  } else if (topFolder === 'Tynion' || lowerName.includes('slaughter') || lowerName.includes('department of truth')) {
    medium = 'comic';
    author = 'James Tynion IV';
    publisher = 'BOOM! Studios / Image';
    genres = ['Horror', 'Indie Comics', 'Dark Fantasy'];
    if (lowerName.includes('slaughter')) series = 'Something is Killing the Children';
    title = toTitleCase(cleanBase.replace(/[-_]+/g, ' ').trim());
  } else if (topFolder === 'PanelxPanel' || lowerName.includes('panelxpanel')) {
    medium = 'magazine';
    series = 'PanelxPanel Magazine';
    publisher = 'PanelxPanel';
    genres = ['Comic Theory', 'Essays', 'Interviews', 'Periodicals'];
    const issueMatch = cleanBase.match(/No\.?\s*(\d+)/i) || cleanBase.match(/(\d+)/);
    if (issueMatch) {
      issueNumber = parseInt(issueMatch[1], 10);
      volumeNumber = issueNumber;
    }
    title = `PanelxPanel #${issueNumber}`;
  } else if (lowerName.includes('peanuts')) {
    medium = 'comic';
    series = 'The Complete Peanuts';
    publisher = 'Fantagraphics Books';
    author = 'Charles M. Schulz';
    aspectRatio = 'landscape';
    genres = ['Classic Comic Strips', 'Humor', 'Americana'];
    title = toTitleCase(cleanBase.replace(/[-_]+/g, ' ').trim());
  } else if (book.format === 'epub') {
    medium = 'novel';
    genres = ['Literature', 'Fiction & Essays'];
    title = toTitleCase(cleanBase.replace(/[-_]+/g, ' ').trim());
  }

  return {
    title,
    series,
    medium,
    genres,
    volume_number: volumeNumber,
    issue_number: issueNumber,
    author,
    publisher,
    franchise,
    reading_direction: readingDirection,
    aspect_ratio: aspectRatio,
  };
}

async function main() {
  console.log('====================================================');
  console.log(' 🏷️ TROPHY ROOM: Comprehensive Catalog Classifier');
  console.log('====================================================\n');

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('Using Supabase Service Role Key...');
  } else {
    let email = CLI_EMAIL || 'danbillingsster@gmail.com';
    let password = CLI_PASSWORD;
    if (!password) {
      password = await promptInput(`Enter Studio Password for ${email}: `);
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
    console.log(`✓ Authenticated successfully.`);
  }

  console.log('1. Scanning local directory hierarchy...');
  const localMap = scanLocalDirectory(SOURCE_DIR, SOURCE_DIR);
  console.log(`✓ Indexed ${localMap.size} local files with folder paths.`);

  console.log('2. Fetching all books from Supabase...');
  let dbBooks = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('trophy_books')
      .select('*')
      .range(from, from + pageSize - 1);
    if (error || !data || data.length === 0) break;
    dbBooks = dbBooks.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  console.log(`✓ Retrieved ${dbBooks.length} records from Supabase.`);

  console.log('3. Classifying and updating library metadata...');
  let updatedCount = 0;

  for (let i = 0; i < dbBooks.length; i++) {
    const book = dbBooks[i];
    const fileBaseName = path.basename(book.file_key || '');
    const cleanLookupName = fileBaseName.replace(/^books\/(cbz|epub|pdf)\//, '').toLowerCase();
    const localMatch = localMap.get(cleanLookupName) || localMap.get(path.parse(fileBaseName).base.toLowerCase());

    const classified = classifyBook(book, localMatch);

    const updatePayload = {
      title: classified.title,
      series: classified.series,
      issue_number: classified.issue_number,
      reading_direction: classified.reading_direction,
      tags: Array.from(new Set([...(book.tags || []), classified.medium, ...(classified.genres || [])])),
    };

    // If schema columns exist, also assign them
    if (classified.medium) updatePayload.medium = classified.medium;
    if (classified.genres && classified.genres.length > 0) updatePayload.genres = classified.genres;
    if (classified.volume_number) updatePayload.volume_number = classified.volume_number;
    if (classified.author && !book.author) updatePayload.author = classified.author;
    if (classified.publisher) updatePayload.publisher = classified.publisher;
    if (classified.franchise) updatePayload.franchise = classified.franchise;
    if (classified.aspect_ratio) updatePayload.aspect_ratio = classified.aspect_ratio;

    const { error: updateErr } = await supabase
      .from('trophy_books')
      .update(updatePayload)
      .eq('id', book.id);

    if (!updateErr) {
      updatedCount++;
      if (updatedCount % 50 === 0 || updatedCount === dbBooks.length) {
        process.stdout.write(`[${updatedCount}/${dbBooks.length}] Classifying: "${classified.title}" [${classified.medium.toUpperCase()}] -> ${classified.series}\n`);
      }
    }
  }

  console.log('====================================================');
  console.log('🎉 CLASSIFICATION & ENRICHMENT COMPLETE!');
  console.log(`• Total Records Processed: ${dbBooks.length}`);
  console.log(`• Records Enriched & Updated: ${updatedCount}`);
  console.log('====================================================');
}

main().catch(console.error);
