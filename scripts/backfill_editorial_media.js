/**
 * Editorial Media Asset Library - Backfill Script
 * 
 * Usage:
 *   node scripts/backfill_editorial_media.js             # Runs dry-run preview (safe, no changes)
 *   node scripts/backfill_editorial_media.js --execute   # Ingests and persists to Supabase DB
 *   node scripts/backfill_editorial_media.js --limit=10  # Previews or executes only 10 items
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CLI flags
const isExecute = process.argv.includes('--execute');
const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

function sanitizeUrl(url) {
  if (!url) return '';
  let clean = url.trim();
  // Strip Wikia/Fandom CDN thumbnail transformation strings
  if (clean.includes('wikia.nocookie.net') || clean.includes('fandom.com')) {
    clean = clean.replace(/\/revision\/latest\/scale-to-width-down\/\d+.*$/, '/revision/latest');
    clean = clean.replace(/\/revision\/latest\?.*$/, '/revision/latest');
  }
  return clean;
}

function classifySourceType(url, entry) {
  const lower = url.toLowerCase();
  if (lower.includes('wp-content') || lower.startsWith('/images/') || lower.startsWith('images/')) {
    return 'upload';
  }
  if (
    lower.includes('wikimedia.org') ||
    lower.includes('wikipedia.org') ||
    lower.includes('metmuseum.org') ||
    lower.includes('loc.gov') ||
    lower.includes('nga.gov')
  ) {
    return 'public_domain';
  }
  if (
    lower.includes('amazon') ||
    lower.includes('comic') ||
    lower.includes('discogs') ||
    lower.includes('goodreads') ||
    lower.includes('wikia') ||
    lower.includes('fandom') ||
    lower.includes('dcentertainment') ||
    lower.includes('simonandschuster') ||
    entry?.entry_type === 'book_review' ||
    entry?.entry_type === 'comic_review' ||
    entry?.entry_type === 'album_review'
  ) {
    return 'review_cover';
  }
  return 'url_import';
}

function inferMimeType(url) {
  const lower = url.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  return 'image/jpeg';
}

function extractStoragePath(url, entrySlug) {
  try {
    const parsed = new URL(url);
    const basename = path.basename(parsed.pathname) || 'cover.jpg';
    return `archive/${entrySlug || 'general'}/${basename}`;
  } catch (e) {
    const basename = path.basename(url) || 'cover.jpg';
    return `archive/${entrySlug || 'general'}/${basename}`;
  }
}

async function verifyTables() {
  const { error } = await supabase.from('editorial_media').select('id').limit(1);
  if (error && error.code === 'PGRST205') {
    console.error('\n⚠️  Supabase tables not found in schema cache!');
    console.error('Please run the migration SQL before executing the backfill:');
    console.error('  File: supabase/migrations/20261020_editorial_media_library.sql');
    const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
    console.error('\nYou can copy and paste the SQL file into the Supabase Dashboard SQL Editor at:');
    console.error(`  https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
    return false;
  }
  return true;
}

async function runBackfill() {
  console.log('=====================================================');
  console.log('   EDITORIAL MEDIA LIBRARY - ARCHIVE BACKFILL TOOL   ');
  console.log('=====================================================');
  console.log(`Mode:    ${isExecute ? '🚀 EXECUTE (Persisting to DB)' : '🔍 DRY-RUN (Preview Only)'}`);
  if (limit !== Infinity) console.log(`Limit:   First ${limit} items`);
  console.log(`Supabase URL: ${supabaseUrl}\n`);

  if (isExecute) {
    const tablesReady = await verifyTables();
    if (!tablesReady) {
      process.exit(1);
    }
  }

  // 1. Load active Supabase entries
  console.log('1. Loading entries from Supabase database...');
  const { data: dbEntries, error: dbError } = await supabase
    .from('entries')
    .select('id, title, slug, entry_type, metadata');

  if (dbError) {
    console.warn(`  ⚠️ Could not query Supabase entries: ${dbError.message}`);
  } else {
    console.log(`  Found ${dbEntries?.length || 0} entries in Supabase.`);
  }

  // 2. Load historical archive entries (JSON)
  console.log('2. Loading historical archive entries from public/archive/imported-entries.json...');
  const archivePath = path.resolve('public', 'archive', 'imported-entries.json');
  let archiveEntries = [];
  if (fs.existsSync(archivePath)) {
    try {
      archiveEntries = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
      console.log(`  Found ${archiveEntries.length} entries in imported-entries.json.`);
    } catch (err) {
      console.warn(`  ⚠️ Failed to parse archive JSON: ${err.message}`);
    }
  } else {
    console.log('  Notice: No archive file found at public/archive/imported-entries.json');
  }

  // 3. Aggregate all candidate entries
  const allEntries = [...(dbEntries || []), ...archiveEntries];
  console.log(`\nTotal pooled entries to inspect: ${allEntries.length}`);

  // Deduplication map: key = sanitized cover URL
  const uniqueMediaMap = new Map();
  // Links map: list of { entryId, isSupabaseEntry, mediaUrl, entryTitle }
  const mediaLinks = [];

  for (const entry of allEntries) {
    const rawUrl = entry.metadata?.coverUrl || entry.metadata?.cover_image_url || entry.coverUrl;
    if (!rawUrl || typeof rawUrl !== 'string') continue;

    const cleanUrl = sanitizeUrl(rawUrl);
    if (!cleanUrl) continue;
    // Discard extinct WordPress upload URLs
    if (cleanUrl.includes('rockthewesternworld.com/wp-content/uploads/')) continue;

    // Is this entry a native Supabase entry with UUID id?
    const isSupabaseUuid = typeof entry.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entry.id);

    mediaLinks.push({
      entryId: entry.id,
      entrySlug: entry.slug,
      isSupabaseUuid,
      mediaUrl: cleanUrl,
      entryTitle: entry.title
    });

    if (!uniqueMediaMap.has(cleanUrl)) {
      const sourceType = classifySourceType(cleanUrl, entry);
      const title = entry.metadata?.credit_title || 
                    entry.metadata?.imageCaption || 
                    (entry.title ? `${entry.title} (Cover Art)` : 'Archived Editorial Media');
      
      const category = entry.metadata?.category || 'General';
      const creator = entry.metadata?.credit_creator || entry.metadata?.imageCredit || null;
      const source = entry.metadata?.credit_source || (sourceType === 'upload' ? 'WordPress Archive' : 'Web Archive');
      const license = entry.metadata?.credit_license || 'Author Provided / Fair Use';
      const attributionText = entry.metadata?.imageCredit || entry.metadata?.imageCaption || null;
      
      const tags = Array.isArray(entry.metadata?.tags) ? [...entry.metadata.tags] : [];
      if (entry.slug && !tags.includes(entry.slug)) {
        tags.push(entry.slug);
      }

      uniqueMediaMap.set(cleanUrl, {
        title: title.slice(0, 200),
        description: `Cover artwork associated with "${entry.title || 'Editorial Entry'}" (${entry.slug || 'archive'})`,
        image_url: cleanUrl,
        thumbnail_url: cleanUrl,
        storage_path: extractStoragePath(cleanUrl, entry.slug),
        mime_type: inferMimeType(cleanUrl),
        source_type: sourceType,
        creator: creator ? String(creator).slice(0, 150) : null,
        source: String(source).slice(0, 100),
        source_url: cleanUrl,
        license: String(license).slice(0, 100),
        attribution_text: attributionText ? String(attributionText).slice(0, 250) : null,
        category: String(category).slice(0, 100),
        tags: tags.map(t => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 15),
        moods: [],
        is_favorite: false
      });
    }
  }

  const uniqueMediaList = Array.from(uniqueMediaMap.values());
  console.log(`\nExtraction Summary:`);
  console.log(`  • Found unique cover media assets: ${uniqueMediaList.length}`);
  console.log(`  • Found entry-to-media associations: ${mediaLinks.length}`);
  console.log(`  • Associations with native Supabase UUIDs: ${mediaLinks.filter(l => l.isSupabaseUuid).length}`);

  // Breakdown by source type
  const breakdown = {};
  uniqueMediaList.forEach(m => {
    breakdown[m.source_type] = (breakdown[m.source_type] || 0) + 1;
  });
  console.log('\nAsset Source Type Breakdown:');
  Object.entries(breakdown).forEach(([k, v]) => console.log(`  • ${k}: ${v}`));

  // Slice if limit requested
  const itemsToProcess = uniqueMediaList.slice(0, limit);

  if (!isExecute) {
    console.log('\n--- SAMPLE PREVIEW (DRY-RUN) ---');
    itemsToProcess.slice(0, 5).forEach((item, idx) => {
      console.log(`\n[#${idx + 1}] ${item.title}`);
      console.log(`  Source Type:  ${item.source_type}`);
      console.log(`  Category:     ${item.category}`);
      console.log(`  Image URL:    ${item.image_url}`);
      console.log(`  Attribution:  ${item.attribution_text || '(none)'}`);
      console.log(`  Tags:         [${item.tags.join(', ')}]`);
    });

    console.log('\n=====================================================');
    console.log('🔍 DRY-RUN COMPLETE. No database rows were modified.');
    console.log('To insert these records into Supabase, run:');
    console.log('  node scripts/backfill_editorial_media.js --execute');
    console.log('=====================================================\n');
    return;
  }

  // EXECUTION MODE
  console.log(`\nChecking existing media records in public.editorial_media...`);
  const { data: existingRows } = await supabase
    .from('editorial_media')
    .select('id, image_url');

  const urlToIdMap = new Map((existingRows || []).map(r => [r.image_url, r.id]));
  console.log(`  Found ${urlToIdMap.size} existing media assets already in DB.`);

  const newItemsToInsert = itemsToProcess.filter(item => !urlToIdMap.has(item.image_url));
  console.log(`  New media records to insert: ${newItemsToInsert.length}`);

  let insertedMediaCount = 0;
  const BATCH_SIZE = 50;
  for (let i = 0; i < newItemsToInsert.length; i += BATCH_SIZE) {
    const batch = newItemsToInsert.slice(i, i + BATCH_SIZE);
    
    const { data, error } = await supabase
      .from('editorial_media')
      .insert(batch)
      .select('id, image_url');

    if (error) {
      console.error(`  ❌ Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
      // Fallback: try individual inserts to isolate problematic rows
      for (const item of batch) {
        const { data: singleData, error: singleError } = await supabase
          .from('editorial_media')
          .insert(item)
          .select('id, image_url')
          .single();
        if (!singleError && singleData) {
          urlToIdMap.set(singleData.image_url, singleData.id);
          insertedMediaCount++;
        }
      }
    } else if (data) {
      data.forEach(row => urlToIdMap.set(row.image_url, row.id));
      insertedMediaCount += data.length;
      console.log(`  ✓ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${insertedMediaCount}/${newItemsToInsert.length})`);
    }
  }

  console.log(`\nFinished inserting editorial_media. Active media IDs mapped: ${urlToIdMap.size}`);

  // Link Supabase entries via entry_media
  console.log('\nLinking native Supabase entries via public.entry_media junction...');
  const junctionRows = [];
  const entriesToUpdate = [];

  for (const link of mediaLinks) {
    if (!link.isSupabaseUuid) continue;
    const mediaId = urlToIdMap.get(link.mediaUrl);
    if (!mediaId) continue;

    junctionRows.push({
      entry_id: link.entryId,
      media_id: mediaId,
      role: 'cover'
    });

    entriesToUpdate.push({
      entryId: link.entryId,
      mediaId
    });
  }

  if (junctionRows.length > 0) {
    const { data: jData, error: jError } = await supabase
      .from('entry_media')
      .upsert(junctionRows, { onConflict: 'entry_id, media_id, role' });

    if (jError) {
      console.warn(`  ⚠️ Warning linking entry_media: ${jError.message}`);
    } else {
      console.log(`  ✓ Successfully linked ${junctionRows.length} entry_media relationships.`);
    }

    // Update entry metadata with editorial_media_id and cover_type='artwork'
    console.log('Updating entry metadata with editorial_media_id...');
    let metadataUpdated = 0;
    for (const update of entriesToUpdate) {
      const { data: curEntry } = await supabase
        .from('entries')
        .select('metadata')
        .eq('id', update.entryId)
        .single();

      if (curEntry) {
        const updatedMetadata = {
          ...(curEntry.metadata || {}),
          editorial_media_id: update.mediaId,
          cover_type: 'artwork'
        };
        const { error: upErr } = await supabase
          .from('entries')
          .update({ metadata: updatedMetadata })
          .eq('id', update.entryId);

        if (!upErr) metadataUpdated++;
      }
    }
    console.log(`  ✓ Updated metadata for ${metadataUpdated} Supabase entries.`);
  } else {
    console.log('  Notice: No native Supabase UUID entries required junction updates.');
  }

  console.log('\n=====================================================');
  console.log('🎉 BACKFILL EXECUTION COMPLETE');
  console.log(`   Editorial Media Assets Created: ${insertedMediaCount}`);
  console.log(`   Entry-Media Junctions Linked:   ${junctionRows.length}`);
  console.log('=====================================================\n');
}

runBackfill().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
