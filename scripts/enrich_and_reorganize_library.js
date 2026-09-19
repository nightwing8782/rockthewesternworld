process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');
const JSZip = require('jszip');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');

const readline = require('readline');

const SOURCE_DIR = process.argv[2] || 'C:\\Users\\danbi\\OneDrive\\Documents\\Ebooks';
const CLI_EMAIL = process.argv[3] || process.env.SUPABASE_AUTH_EMAIL;
const CLI_PASSWORD = process.argv[4] || process.env.SUPABASE_AUTH_PASSWORD;
const BUCKET = process.env.R2_BUCKET_NAME || 'trophy-room';

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

// R2 S3 Client
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Supabase Client
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
      if (index > 0 && lowercase.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace(/^([a-z])/, (m) => m.toUpperCase());
}

function cleanFilenameHeuristics(filename, parentFolder) {
  let name = filename.replace(/\.(cbz|cbr|zip|epub|pdf)$/i, '');
  // Remove brackets and noise like (2014) (Digital) (Zone-Empire)
  name = name.replace(/\[.*?\]/g, ' ').replace(/\((?!19\d\d|20\d\d).*?\)/g, ' ').trim();

  let issueNumber = 1;
  const issueMatch =
    name.match(/\bvol(?:ume)?\.?\s*(\d+(?:\.\d+)?)/i) ||
    name.match(/\bv(\d+(?:\.\d+)?)\b/i) ||
    name.match(/#\s*(\d+(?:\.\d+)?)/) ||
    name.match(/\b(?:issue|bk|book)\.?\s*(\d+)/i) ||
    name.match(/(?:^|\s)(\d{1,3})(?:\s*[-_:]|\s*$)/);

  if (issueMatch && issueMatch[1]) {
    const parsed = parseFloat(issueMatch[1]);
    if (!isNaN(parsed) && parsed < 1900) {
      issueNumber = parsed;
    }
  }

  let series = 'Standalone';
  if (parentFolder && parentFolder !== '.' && parentFolder !== 'Ebooks' && parentFolder !== 'Comics') {
    series = parentFolder.replace(/^Comics[\/\\]/i, '').trim();
  } else if (name.includes(' - ')) {
    series = name.split(' - ')[0].trim();
  } else if (name.includes('#')) {
    series = name.split('#')[0].trim();
  } else {
    // Try to detect series prefix (e.g. "Pretty Deadly Vol 1" -> "Pretty Deadly")
    const volPrefix = name.match(/^(.+?)\s*(?:[-_:]|\bv(?:ol)?\.?\s*\d+|\b#\s*\d+)/i);
    if (volPrefix && volPrefix[1] && volPrefix[1].trim().length > 2) {
      series = volPrefix[1].trim();
    }
  }

  if (series !== 'Standalone') {
    series = toTitleCase(series.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim());
  }

  const cleanTitle = toTitleCase(name.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim());
  return { cleanTitle, series, issueNumber };
}

async function extractMetadataFromZip(filePath) {
  try {
    const fileData = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(fileData);
    let comicInfo = null;
    let epubMeta = null;
    let coverBuffer = null;
    let coverMime = 'image/jpeg';

    // 1. Look for ComicInfo.xml
    const comicInfoFile = zip.file(/ComicInfo\.xml$/i)[0];
    if (comicInfoFile) {
      try {
        const xmlText = await comicInfoFile.async('text');
        const parsed = xmlParser.parse(xmlText);
        if (parsed?.ComicInfo) {
          comicInfo = parsed.ComicInfo;
        }
      } catch (e) {}
    }

    // 2. Look for EPUB content.opf
    const opfFile = zip.file(/\.opf$/i)[0];
    if (opfFile) {
      try {
        const opfText = await opfFile.async('text');
        const parsed = xmlParser.parse(opfText);
        const metadata = parsed?.package?.metadata;
        if (metadata) {
          epubMeta = {
            title: metadata['dc:title'],
            creator: metadata['dc:creator'],
            description: metadata['dc:description'],
            publisher: metadata['dc:publisher'],
            date: metadata['dc:date'],
          };
        }
      } catch (e) {}
    }

    // 3. Extract first cover image
    const imgExtensions = /\.(jpe?g|png|webp)$/i;
    const imgFiles = Object.keys(zip.files).filter((f) => !zip.files[f].dir && imgExtensions.test(f));
    if (imgFiles.length > 0) {
      imgFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
      const firstImg = zip.files[imgFiles[0]];
      coverBuffer = await firstImg.async('nodebuffer');
      const ext = path.extname(imgFiles[0]).toLowerCase();
      if (ext === '.png') coverMime = 'image/png';
      else if (ext === '.webp') coverMime = 'image/webp';
    }

    return { comicInfo, epubMeta, coverBuffer, coverMime };
  } catch (err) {
    return null;
  }
}

async function fetchOpenLibraryMetadata(query) {
  try {
    const cleanQ = encodeURIComponent(query.replace(/[^a-zA-Z0-9\s]/g, ' ').trim());
    const res = await fetch(`https://openlibrary.org/search.json?q=${cleanQ}&limit=1`, {
      headers: { 'User-Agent': 'RockTheWesternWorld-TrophyRoom/1.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.docs && data.docs.length > 0) {
      const doc = data.docs[0];
      return {
        title: doc.title || null,
        author: doc.author_name ? doc.author_name[0] : null,
        firstPublishYear: doc.first_publish_year || null,
        coverId: doc.cover_i || null,
        publisher: doc.publisher ? doc.publisher[0] : null,
      };
    }
  } catch (e) {}
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
          const relPath = path.relative(SOURCE_DIR, fullPath);
          const parentFolder = path.dirname(relPath);
          map.set(item.name.toLowerCase(), {
            name: item.name,
            fullPath,
            ext,
            parentFolder,
          });
        }
      }
    }
  } catch (err) {}
  return map;
}

async function main() {
  console.log('====================================================');
  console.log(' 🏆 TROPHY ROOM: Comprehensive Metadata Enrichment');
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

  console.log('1. Scanning local Ebooks storage for embedded files...');
  const localFileMap = scanLocalDirectory(SOURCE_DIR);
  console.log(`✓ Indexed ${localFileMap.size} local files.`);

  console.log('2. Fetching database catalog from Supabase...');
  const { data: dbBooks, error: fetchErr } = await supabase
    .from('trophy_books')
    .select('*')
    .limit(10000);

  if (fetchErr || !dbBooks) {
    console.error('Failed to query Supabase:', fetchErr);
    return;
  }

  console.log(`✓ Retrieved ${dbBooks.length} books from Supabase catalog.`);
  console.log('3. Starting metadata extraction, organization & enrichment...');
  console.log('----------------------------------------------------');

  let updatedCount = 0;
  let coversExtractedCount = 0;

  for (let i = 0; i < dbBooks.length; i++) {
    const book = dbBooks[i];
    const fileBaseName = path.basename(book.file_key || '');
    const cleanLookupName = fileBaseName.replace(/^books\/(cbz|epub|pdf)\//, '').toLowerCase();

    // Match local file if present
    const localMatch = localFileMap.get(cleanLookupName) || localFileMap.get(path.parse(fileBaseName).base.toLowerCase());

    let newTitle = book.title;
    let newSeries = book.series;
    let newIssueNumber = book.issue_number;
    let newAuthor = book.author;
    let newDescription = book.description;
    let newCoverKey = book.cover_key;
    let newPageCount = book.page_count;

    // A. Apply clean filename heuristics
    const heuristics = cleanFilenameHeuristics(localMatch ? localMatch.name : fileBaseName, localMatch ? localMatch.parentFolder : '');
    newTitle = heuristics.cleanTitle;
    newSeries = heuristics.series;
    newIssueNumber = heuristics.issueNumber;

    // B. Check local embedded metadata (ComicInfo.xml / content.opf)
    if (localMatch && (localMatch.ext === '.cbz' || localMatch.ext === '.epub')) {
      const embedded = await extractMetadataFromZip(localMatch.fullPath);
      if (embedded) {
        // ComicInfo.xml
        if (embedded.comicInfo) {
          const ci = embedded.comicInfo;
          if (ci.Series) newSeries = toTitleCase(ci.Series.toString());
          if (ci.Title) newTitle = toTitleCase(ci.Title.toString());
          if (ci.Number) {
            const num = parseFloat(ci.Number);
            if (!isNaN(num)) newIssueNumber = num;
          }
          if (ci.Writer) newAuthor = ci.Writer.toString();
          if (ci.Summary) newDescription = ci.Summary.toString();
          if (ci.PageCount) {
            const pc = parseInt(ci.PageCount, 10);
            if (!isNaN(pc)) newPageCount = pc;
          }
        }

        // EPUB OPF
        if (embedded.epubMeta) {
          const em = embedded.epubMeta;
          if (em.title) newTitle = toTitleCase(em.title.toString());
          if (em.creator) newAuthor = em.creator.toString();
          if (em.description) newDescription = em.description.toString();
        }

        // Upload Cover if missing
        if (!newCoverKey && embedded.coverBuffer) {
          try {
            const safeCoverName = path.parse(localMatch.name).name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const targetCoverKey = `covers/${safeCoverName}.jpg`;

            await s3.send(
              new PutObjectCommand({
                Bucket: BUCKET,
                Key: targetCoverKey,
                Body: embedded.coverBuffer,
                ContentType: embedded.coverMime || 'image/jpeg',
              })
            );

            newCoverKey = targetCoverKey;
            coversExtractedCount++;
          } catch (e) {
            console.warn('Cover upload warning:', e.message);
          }
        }
      }
    }

    // C. Query Open Library if author or description is missing
    if (!newAuthor && (book.format === 'epub' || newSeries === 'Standalone')) {
      const ol = await fetchOpenLibraryMetadata(newTitle);
      if (ol && ol.author) {
        newAuthor = ol.author;
      }
    }

    // D. Update Supabase record
    const hasChanges =
      newTitle !== book.title ||
      newSeries !== book.series ||
      newIssueNumber !== book.issue_number ||
      newAuthor !== book.author ||
      newDescription !== book.description ||
      newCoverKey !== book.cover_key ||
      newPageCount !== book.page_count;

    if (hasChanges) {
      const { error: updateErr } = await supabase
        .from('trophy_books')
        .update({
          title: newTitle,
          series: newSeries,
          issue_number: newIssueNumber,
          author: newAuthor,
          description: newDescription,
          cover_key: newCoverKey,
          page_count: newPageCount || 100,
          tags: [book.format.toUpperCase(), newSeries !== 'Standalone' ? 'Series' : 'Single'],
        })
        .eq('id', book.id);

      if (!updateErr) {
        updatedCount++;
        process.stdout.write(`[${i + 1}/${dbBooks.length}] ✓ "${newTitle}" (${newSeries}, #${newIssueNumber})\n`);
      } else {
        process.stdout.write(`[${i + 1}/${dbBooks.length}] ✗ Error updating: ${updateErr.message}\n`);
      }
    } else {
      process.stdout.write(`[${i + 1}/${dbBooks.length}] - "${newTitle}" (Up to date)\n`);
    }
  }

  console.log('====================================================');
  console.log('🎉 METADATA ENRICHMENT COMPLETE!');
  console.log(`• Total Books Checked: ${dbBooks.length}`);
  console.log(`• Books Updated & Reorganized: ${updatedCount}`);
  console.log(`• New Covers Extracted & Uploaded: ${coversExtractedCount}`);
  console.log('====================================================');
}

main().catch(console.error);
