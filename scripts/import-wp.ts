import fs from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

interface WpCategory {
  '#text'?: string;
  '@_domain'?: string;
  '@_nicename'?: string;
  __cdata?: string;
  [key: string]: any;
}

interface ImportedEntry {
  id: string;
  user_id?: string;
  entry_type: string;
  status: string;
  title: string;
  slug: string;
  body_html: string;
  body_json: any;
  metadata: {
    categories: string[];
    tags: string[];
    original_wp_id?: string;
    imported_at: string;
    category: string;
    desk: 'commonwealth' | 'gallery' | 'logbook';
    kicker: string;
    excerpt: string;
    coverUrl?: string;
    rating?: number;
    [key: string]: any;
  };
  published_at: string;
  created_at: string;
  updated_at: string;
}

function mapCategoryToDesk(categories: string[]): {
  desk: 'commonwealth' | 'gallery' | 'logbook';
  subCat: string;
  kicker: string;
  entry_type: string;
} {
  const allCatText = categories.join(' ').toLowerCase();

  // 1. Logbook
  if (allCatText.includes('literal corner')) {
    return { desk: 'logbook', subCat: 'A Literal Corner', kicker: 'NON-FICTION & READING', entry_type: 'book_review' };
  }
  if (allCatText.includes('foray into fiction')) {
    return { desk: 'logbook', subCat: 'A Foray into Fiction', kicker: 'FICTION & LITERATURE', entry_type: 'book_review' };
  }
  if (allCatText.includes('listen, my friends') || allCatText.includes('listen') || allCatText.includes('music')) {
    return { desk: 'logbook', subCat: 'Listen, My Friends', kicker: 'RECORD LOG & SOUND', entry_type: 'music_review' };
  }
  if (allCatText.includes('either sadness or euphoria') || allCatText.includes('melbourne')) {
    return { desk: 'logbook', subCat: 'Either Sadness or Euphoria', kicker: 'PERSONAL REFLECTION', entry_type: 'essay' };
  }

  // 2. Gallery
  if (allCatText.includes('off the comic rack') || allCatText.includes('comic')) {
    return { desk: 'gallery', subCat: 'Off the Comic Rack', kicker: 'GRAPHIC NOVELS & COMICS', entry_type: 'comic_review' };
  }
  if (allCatText.includes('broadway baby') || allCatText.includes('broadway') || allCatText.includes('theater')) {
    return { desk: 'gallery', subCat: 'Broadway Baby', kicker: 'THEATRICAL DISPATCH', entry_type: 'thought' };
  }
  if (allCatText.includes('the multiplex') || allCatText.includes('multiplex') || allCatText.includes('movie') || allCatText.includes('film')) {
    return { desk: 'gallery', subCat: 'The Multiplex', kicker: 'CINEMA REVIEW', entry_type: 'thought' };
  }
  if (allCatText.includes('the happy medium') || allCatText.includes('happy medium') || allCatText.includes('television')) {
    return { desk: 'gallery', subCat: 'The Happy Medium', kicker: 'TELEVISION & MEDIA', entry_type: 'thought' };
  }

  // 3. Commonwealth
  if (allCatText.includes('wading into the potomac') || allCatText.includes('potomac') || allCatText.includes('democratic faith')) {
    return { desk: 'commonwealth', subCat: 'Wading into the Potomac', kicker: 'CONSTITUTIONAL & CIVIC', entry_type: 'essay' };
  }
  if (allCatText.includes('dan reads the news') || allCatText.includes('reads the news')) {
    return { desk: 'commonwealth', subCat: 'Dan Reads the News', kicker: 'CURRENT AFFAIRS', entry_type: 'essay' };
  }

  // Default to Commonwealth Dan Reads the News
  return { desk: 'commonwealth', subCat: 'Dan Reads the News', kicker: 'CURRENT AFFAIRS', entry_type: 'essay' };
}

// Helper to extract first image from HTML as thumbnail
function extractFirstImage(html: string): string | undefined {
  const imgMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(html);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }
  return undefined;
}

async function main() {
  console.log('====================================================');
  console.log('Rock The Western World • WordPress Archive Importer');
  console.log('====================================================');

  const xmlFilename = 'rockthewesternworld.WordPress.2026-09-12.xml';
  const xmlFilePath = path.join(process.cwd(), xmlFilename);

  if (!fs.existsSync(xmlFilePath)) {
    console.error(`XML file not found at: ${xmlFilePath}`);
    return;
  }

  console.log(`Reading XML file: ${xmlFilePath}`);
  const xmlContent = fs.readFileSync(xmlFilePath, 'utf8');

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    cdataPropName: '__cdata',
  });

  const parsed = parser.parse(xmlContent);
  const items = parsed?.rss?.channel?.item || [];
  const itemList = Array.isArray(items) ? items : [items];
  console.log(`Found ${itemList.length} total raw items in XML channel.`);

  const archiveDir = path.join(process.cwd(), 'public', 'archive');
  fs.mkdirSync(archiveDir, { recursive: true });

  const importedEntries: ImportedEntry[] = [];
  let skippedCount = 0;

  for (let idx = 0; idx < itemList.length; idx++) {
    const item = itemList[idx];
    const status = item['wp:status']?.__cdata || item['wp:status'] || '';
    const postType = item['wp:post_type']?.__cdata || item['wp:post_type'] || 'post';

    if (status !== 'publish' || (postType !== 'post' && postType !== 'essay')) {
      skippedCount++;
      continue;
    }

    const rawTitle = item.title?.__cdata || item.title || 'Untitled Post';
    const title = String(rawTitle).trim();

    let slug = item['wp:post_name']?.__cdata || item['wp:post_name'] || '';
    if (!slug) {
      slug = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
    }

    const wpId = String(item['wp:post_id']?.__cdata || item['wp:post_id'] || idx);

    const rawDate = item['wp:post_date_gmt']?.__cdata || item['wp:post_date_gmt'] || item['wp:post_date'] || item.pubDate;
    let publishedAt = new Date().toISOString();
    try {
      if (rawDate && rawDate !== '0000-00-00 00:00:00') {
        publishedAt = new Date(rawDate).toISOString();
      }
    } catch {
      publishedAt = new Date().toISOString();
    }

    let rawHtml = item['content:encoded']?.__cdata || item['content:encoded'] || '';
    if (typeof rawHtml !== 'string') {
      rawHtml = String(rawHtml || '');
    }

    const categories: string[] = [];
    const tags: string[] = [];
    if (item.category) {
      const catList: WpCategory[] = Array.isArray(item.category) ? item.category : [item.category];
      for (const cat of catList) {
        const catName = cat['#text'] || cat['__cdata'] || (typeof cat === 'string' ? cat : '');
        const domain = cat['@_domain'] || 'category';
        if (catName) {
          if (domain === 'post_tag' || domain === 'tag') {
            tags.push(String(catName).trim());
          } else {
            categories.push(String(catName).trim());
          }
        }
      }
    }

    const { desk, subCat, kicker, entry_type } = mapCategoryToDesk(categories);
    const coverUrl = extractFirstImage(rawHtml);

    // Clean plain text excerpt
    const plainText = rawHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const excerpt = plainText.substring(0, 220) + (plainText.length > 220 ? '...' : '');

    const entry: ImportedEntry = {
      id: `wp-${wpId}`,
      title,
      slug,
      status: 'published',
      entry_type,
      body_html: rawHtml,
      body_json: null,
      metadata: {
        categories,
        tags,
        category: subCat,
        desk,
        kicker,
        excerpt,
        coverUrl,
        original_wp_id: wpId,
        imported_at: new Date().toISOString(),
      },
      published_at: publishedAt,
      created_at: publishedAt,
      updated_at: new Date().toISOString(),
    };

    importedEntries.push(entry);
  }

  // Sort newest first
  importedEntries.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

  console.log(`\nProcessed ${importedEntries.length} published posts (skipped ${skippedCount} drafts/attachments/pages).`);

  // Desk breakdown count
  const commonwealthCount = importedEntries.filter((e) => e.metadata.desk === 'commonwealth').length;
  const galleryCount = importedEntries.filter((e) => e.metadata.desk === 'gallery').length;
  const logbookCount = importedEntries.filter((e) => e.metadata.desk === 'logbook').length;

  console.log(`\nDesk Breakdown:`);
  console.log(`  • The Commonwealth: ${commonwealthCount} posts`);
  console.log(`  • The Gallery:      ${galleryCount} posts`);
  console.log(`  • The Logbook:      ${logbookCount} posts`);

  // Save JSON archive
  const jsonBackupPath = path.join(archiveDir, 'imported-entries.json');
  fs.writeFileSync(jsonBackupPath, JSON.stringify(importedEntries, null, 2), 'utf8');
  console.log(`\nSaved complete JSON archive to: ${jsonBackupPath}`);

  // Supabase Sync if configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder-url')) {
    console.log(`\nConnecting to Supabase at: ${supabaseUrl}`);
    const supabase = createClient(supabaseUrl, supabaseKey);

    const batchSize = 50;
    let insertedTotal = 0;

    for (let i = 0; i < importedEntries.length; i += batchSize) {
      const batch = importedEntries.slice(i, i + batchSize);
      const { data, error } = await supabase.from('entries').upsert(batch, { onConflict: 'slug' });

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error.message);
      } else {
        insertedTotal += batch.length;
        console.log(`  Successfully inserted batch ${i / batchSize + 1} (${insertedTotal}/${importedEntries.length})`);
      }
    }
    console.log(`\nDone! Synced ${insertedTotal} posts to Supabase.`);
  } else {
    console.log('\n[INFO] Supabase credentials not configured. Local archive is active.');
  }
}

main().catch(console.error);
