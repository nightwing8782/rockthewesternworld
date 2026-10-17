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

// Dictionary & helper functions for un-squishing
const KNOWN_WORDS = [
  'silent', 'voice', 'canon', 'youth', 'touch', 'love', 'bug', 'class', 'presidents', 'president',
  'beck', 'call', 'fullmetal', 'alchemist', 'chainsaw', 'punch', 'death', 'note', 'titan',
  'attack', 'shingeki', 'kyojin', 'tokyo', 'ghoul', 'berserk', 'hunter', 'bleach', 'naruto',
  'piece', 'dragon', 'ball', 'jujutsu', 'kaisen', 'demon', 'slayer', 'kimetsu', 'yaiba',
  'family', 'vinland', 'saga', 'slam', 'dunk', 'vagabond', 'monster', 'punpun', 'goodnight',
  'oyasumi', 'pluto', 'akira', 'evangelion', 'solanin', 'haikyuu', 'kuroko', 'basket', 'blue',
  'lock', 'period', 'giant', 'killing', 'space', 'brothers', 'planetes', 'inuyasha', 'ranma',
  'sailor', 'moon', 'cardcaptor', 'sakura', 'clamp', 'fruits', 'horimiya', 'kaguya', 'sama',
  'rent', 'girlfriend', 'quintessential', 'quintuplets', 'komi', 'cant', 'communicate', 'bocchi',
  'rock', 'frieren', 'dungeon', 'meshi', 'delicious', 'apothecary', 'diaries', 'witch', 'hat',
  'atelier', 'land', 'lustrous', 'houseki', 'kuni', 'abyss', 'dorohedoro', 'golden', 'kamuy',
  'kingdom', 'hellsing', 'trigun', 'gantz', 'claymore', 'souleater', 'fireforce', 'boruto',
  'parasyte', 'ajin', 'gintama', 'beastars', 'drstone', 'blackclover', 'fairytail', 'edenszero',
  'radiant', 'blame', 'biomega', 'sidonia', 'complete', 'peanuts', 'transformers', 'more',
  'than', 'meets', 'eye', 'last', 'stand', 'wreckers', 'all', 'hail', 'megatron', 'autocracy',
  'monstrosity', 'primacy', 'sins', 'requiem', 'robots', 'disguise', 'windblade', 'till',
  'are', 'one', 'lost', 'light', 'optimus', 'prime', 'unicron', 'shattered', 'glass', 'beast',
  'wars', 'ironhide', 'bumblebee', 'drift', 'kup', 'blurr', 'cliffjumper', 'wheeljack',
  'origin', 'spotlight', 'maximum', 'dinobots', 'heart', 'darkness', 'chaos', 'dark',
  'cybertron', 'combiner', 'titans', 'return', 'revolution', 'first', 'strike', 'infestation',
  'incompetent', 'villain', 'doctor', 'aphra', 'darth', 'vader', 'star', 'bounty', 'hunters',
  'high', 'republic', 'department', 'truth', 'something', 'is', 'killing', 'the', 'children',
  'house', 'slaughter', 'nice', 'lake', 'dracula', 'wynd', 'memetic', 'cognet', 'eugenic',
  'over', 'garden', 'wall', 'woods', 'bravest', 'warriors', 'lumberjanes', 'steven', 'universe',
  'adventure', 'time', 'regular', 'show', 'panelxpanel', 'panel', 'story', 'craft', 'anatomy',
  'hero', 'thousand', 'faces', 'save', 'cat', 'batman', 'superman', 'wonder', 'woman',
  'spider', 'avengers', 'xmen', 'mutants', 'flash', 'green', 'lantern', 'nightwing',
  'daredevil', 'cookbook', 'food', 'lab', 'serious', 'eats', 'baking', 'bread', 'salt', 'fat',
  'acid', 'heat', 'flour', 'water', 'yeast', 'dummies', 'writing', 'screenplay', 'screenwriting',
  'guide', 'secret', 'history', 'chronicles', 'chronicle', 'tales', 'legend', 'quest', 'magic',
  'galaxy', 'sun', 'sky', 'wind', 'fire', 'earth', 'stone', 'iron', 'steel', 'gold', 'silver',
  'room', 'street', 'road', 'path', 'door', 'gate', 'bridge', 'tower', 'castle', 'palace',
  'temple', 'school', 'academy', 'club', 'friend', 'friends', 'girl', 'boy', 'man', 'woman',
  'child', 'daughter', 'brother', 'sister', 'father', 'mother', 'family', 'master', 'teacher',
  'student', 'prince', 'princess', 'knight', 'soldier', 'warrior', 'captain', 'leader', 'boss',
  'wizard', 'ghost', 'spirit', 'angel', 'saint', 'wolf', 'fox', 'bear', 'lion', 'tiger',
  'rabbit', 'flower', 'tree', 'forest', 'mountain', 'river', 'ocean', 'island', 'garden',
  'spring', 'summer', 'autumn', 'winter', 'rain', 'snow', 'storm', 'cloud', 'thunder',
  'lightning', 'dream', 'nightmare', 'memory', 'hope', 'wish', 'fear', 'pain', 'joy',
  'sorrow', 'truth', 'peace', 'order', 'destiny', 'fate', 'promise', 'vow', 'curse', 'spell',
  'power', 'force', 'energy', 'soul', 'mind', 'body', 'sound', 'music', 'song', 'dance',
  'game', 'play', 'volume', 'issue', 'chapter', 'part', 'book', 'edition', 'version', 'special',
  'annual', 'seed', 'destruction', 'troll', 'witch', 'paradise', 'ever', 'after', 'real', 'life',
  'motor', 'girl', 'rogue', 'sun', 'living', 'mummy', 'deadly', 'beloved', 'plague', 'frogs',
  'hell', 'earth', 'drstork', 'eternity', 'jellyfish', 'sidonia', 'conversations'
];
KNOWN_WORDS.sort((a, b) => b.length - a.length);

function unSquish(text) {
  if (!text || typeof text !== 'string') return text;
  let str = text
    .replace(/\.(cbz|cbr|epub|pdf|zip)$/i, '')
    .replace(/\[.*?\]/g, ' ')
    .replace(/\((?!19\d\d|20\d\d).*?\)/g, ' ')
    .replace(/[-_]+/g, ' ')
    .trim();

  // Explicit known multi-word compounds
  const explicit = [
    [/^asilentvoice/i, 'A Silent Voice'],
    [/^canonofyouth/i, 'Canon of Youth'],
    [/^atouchofthelovebug/i, 'A Touch of the Love Bug'],
    [/^attheclasspresidentsbeckandcall/i, "At the Class President's Beck and Call"],
    [/^thecompletepeanuts/i, 'The Complete Peanuts'],
    [/^thefoodlab/i, 'The Food Lab'],
    [/^goodnightpunpun/i, 'Goodnight Punpun'],
    [/^blueperiod/i, 'Blue Period'],
    [/^aconditioncalledlove/i, 'A Condition Called Love'],
    [/^spacebrothers/i, 'Space Brothers'],
    [/^dropsofgod/i, 'The Drops of God'],
    [/^lonewolfandcub/i, 'Lone Wolf and Cub'],
    [/^judgedredd/i, 'Judge Dredd'],
    [/^strangersinparadise/i, 'Strangers in Paradise'],
    [/^motorgirl/i, 'Motor Girl'],
    [/^witchhatatelier/i, 'Witch Hat Atelier'],
    [/^whichhatatelier/i, 'Witch Hat Atelier'],
    [/^whatdidyoueatyesterday/i, 'What Did You Eat Yesterday?'],
  ];

  for (const [p, r] of explicit) {
    if (p.test(str)) {
      str = str.replace(p, r + ' ');
      break;
    }
  }

  // CamelCase & Number splitting
  str = str.replace(/([a-z])([A-Z])/g, '$1 $2');
  str = str.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
  str = str.replace(/([a-zA-Z])(\d)/g, '$1 $2');
  str = str.replace(/(\d)([a-zA-Z])/g, '$1 $2');

  return str.replace(/\s+/g, ' ').trim();
}

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
    .join(' ');
}

async function executePhase1() {
  const logFile = path.resolve('backups/phase1_execution.log');
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  function log(msg) {
    console.log(msg);
    logStream.write(`[${new Date().toISOString()}] ${msg}\n`);
  }

  log('====================================================');
  log('🚀 EXECUTING PHASE 1: CANONICAL NORMALIZATION');
  log('====================================================\n');

  // Step 1: Fetch Current Catalog & Progress from Supabase
  log('1. Loading current database records...');
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
  log(`✓ Loaded ${books.length} books from trophy_books.`);

  let progress = [];
  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('trophy_progress')
      .select('*')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    progress = progress.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  log(`✓ Loaded ${progress.length} progress records.\n`);

  const progMap = new Map();
  progress.forEach(p => progMap.set(p.book_id, p));

  // Step 2: Execute Deduplications & Merges (10 Target Records)
  log('2. Processing 10 duplicate deletions with progress merge protection...');
  const deleteKeys = [
    { del: 'books/epub/blueperiod_vol2.epub', keep: 'books/epub/blueperiodvol2.epub', label: 'Blue Period Vol. 2' },
    { del: 'books/epub/blueperiod_vol3.epub', keep: 'books/epub/blueperiodvol3.epub', label: 'Blue Period Vol. 3' },
    { del: 'books/epub/whatdidyoueatyesterday_vol1.epub', keep: 'books/epub/whatdidyoueatyesterdayvol1.epub', label: 'What Did You Eat Yesterday? Vol. 1' },
    { del: 'books/epub/whichhatatelier_vol1.epub', keep: 'books/epub/witchhatateliervol1.epub', label: 'Witch Hat Atelier Vol. 1' },
    { del: 'books/epub/whichhatatelier_vol2.epub', keep: 'books/epub/witchhatateliervol2.epub', label: 'Witch Hat Atelier Vol. 2' },
    { del: 'books/epub/whichhatatelier_vol3.epub', keep: 'books/epub/witchhatateliervol3.epub', label: 'Witch Hat Atelier Vol. 3' },
    { del: 'books/epub/whichhatatelier_vol4.epub', keep: 'books/epub/witchhatateliervol4.epub', label: 'Witch Hat Atelier Vol. 4' },
    { del: 'books/cbz/transformers_morethanmeetstheeye_vol9__1_.cbz', keep: 'books/cbz/transformers_morethanmeetstheeye_vol9.cbz', label: 'Transformers MTMTE Vol. 9' },
    { del: 'books/pdf/hellboyvolume7_thetrollwitchandothers__1_.pdf', keep: 'books/pdf/hellboyvolume7_thetrollwitchandothers.pdf', label: 'Hellboy Vol. 7' },
    { del: 'books/pdf/strangersinparadisev19_everafter__1_.pdf', keep: 'books/pdf/strangersinparadisev19_everafter.pdf', label: 'Strangers in Paradise Vol. 19' }
  ];

  let deletedCount = 0;
  for (const item of deleteKeys) {
    const delBook = books.find(b => b.file_key === item.del);
    const keepBook = books.find(b => b.file_key === item.keep);

    if (!delBook) {
      log(`  ⚠️ Notice: ${item.del} not found in database (already removed). Skipping.`);
      continue;
    }
    if (!keepBook) {
      log(`  ❌ Error: Canonical book ${item.keep} missing! Aborting deletion of ${item.del}.`);
      continue;
    }

    // Check progress on deletion candidate
    const delProg = progMap.get(delBook.id);
    const keepProg = progMap.get(keepBook.id);

    if (delProg) {
      log(`  🔄 Merging progress from ${delBook.id} to canonical ${keepBook.id} (Page: ${delProg.last_page}/${delProg.total_pages})...`);
      if (keepProg) {
        // Keep the one with highest last_page / percent
        if (delProg.percent_read > keepProg.percent_read) {
          await supabase
            .from('trophy_progress')
            .update({
              last_page: delProg.last_page,
              total_pages: delProg.total_pages,
              percent_read: delProg.percent_read,
              current_cfi: delProg.current_cfi,
              last_read_at: delProg.last_read_at,
            })
            .eq('id', keepProg.id);
        }
        await supabase.from('trophy_progress').delete().eq('id', delProg.id);
      } else {
        // Transfer progress row to keepBook
        await supabase
          .from('trophy_progress')
          .update({ book_id: keepBook.id })
          .eq('id', delProg.id);
      }
      log(`  ✓ Progress safely merged.`);
    }

    // Delete duplicate book from trophy_books
    const { error: delErr } = await supabase.from('trophy_books').delete().eq('id', delBook.id);
    if (delErr) {
      log(`  ❌ Failed to delete ${delBook.id}: ${delErr.message}`);
    } else {
      deletedCount++;
      log(`  ✓ Deleted [${item.label}] (UUID: ${delBook.id}, Key: ${delBook.file_key})`);
    }
  }
  log(`✓ Successfully completed ${deletedCount}/10 duplicate deletions.\n`);

  // Step 3: Title Normalization & Un-squishing
  log('3. Normalizing titles, stripping download artifacts, and un-squishing series...');
  // Reload remaining books
  books = books.filter(b => !deleteKeys.some(k => k.del === b.file_key));

  let updatedCount = 0;
  for (const b of books) {
    let title = b.title || '';
    let series = b.series || '';
    let volumeNumber = b.volume_number || b.issue_number || 1;
    let changed = false;

    // A. Fix Stuttered volvol in What Did You Eat Yesterday?
    const wdyeyMatch = b.file_key.match(/whatdidyoueatyesterdayvolvol(\d+)/i);
    if (wdyeyMatch) {
      const vol = parseInt(wdyeyMatch[1], 10);
      title = `What Did You Eat Yesterday?: Vol. ${vol}`;
      series = 'What Did You Eat Yesterday?';
      volumeNumber = vol;
      changed = true;
    }

    // B. Strip Download Suffix Artifacts (__1_, (1), trailing " 1")
    if (b.file_key && b.file_key.includes('__1_')) {
      if (/\s+1$/.test(title) || /__\d+_|\(1\)/.test(title)) {
        const cleaned = title.replace(/\s+1$/, '').replace(/__\d+_/g, '').replace(/\(1\)/g, '').trim();
        if (cleaned !== title) {
          title = cleaned;
          changed = true;
        }
      }
    }

    // C. Un-squish Blue Period
    const bpMatch = title.match(/^blueperiod\s*(?:vol\.?\s*)?(\d+)/i) || b.file_key.match(/blueperiod.*vol(\d+)/i);
    if (bpMatch && bpMatch[1]) {
      const vol = parseInt(bpMatch[1], 10);
      title = `Blue Period: Vol. ${vol}`;
      series = 'Blue Period';
      volumeNumber = vol;
      changed = true;
    }

    // D. Un-squish Judge Dredd Case Files
    const jdMatch = title.match(/^judgedredd\s*casefiles\s*vol(\d+)/i) || b.file_key.match(/judgedredd_casefiles_vol(\d+)/i);
    if (jdMatch && jdMatch[1]) {
      const vol = parseInt(jdMatch[1], 10);
      title = `Judge Dredd: The Complete Case Files: Vol. ${vol}`;
      series = 'Judge Dredd: The Complete Case Files';
      volumeNumber = vol;
      changed = true;
    }

    // E. Un-squish A Condition Called Love
    const cclMatch = title.match(/^aconditioncalledlove\s*(?:vol\.?\s*)?(\d+)/i) || b.file_key.match(/aconditioncalledlove_vol(\d+)/i);
    if (cclMatch && cclMatch[1]) {
      const vol = parseInt(cclMatch[1], 10);
      title = `A Condition Called Love: Vol. ${vol}`;
      series = 'A Condition Called Love';
      volumeNumber = vol;
      changed = true;
    }

    // F. General un-squish for squished lowercase titles
    if (!changed && (/^[a-z0-9\s_-]+$/.test(title) || /^[A-Z][a-z0-9]+[A-Z]/.test(title))) {
      const unsq = unSquish(title);
      const titleCased = toTitleCase(unsq);
      if (titleCased !== title) {
        title = titleCased;
        changed = true;
      }
    }

    if (changed && (title !== b.title || series !== b.series || volumeNumber !== b.volume_number)) {
      const payload = {
        title,
        updated_at: new Date().toISOString(),
      };
      if (series && series !== b.series) payload.series = series;
      if (volumeNumber && volumeNumber !== b.volume_number) {
        payload.volume_number = volumeNumber;
        payload.issue_number = volumeNumber;
      }

      const { error: upErr } = await supabase
        .from('trophy_books')
        .update(payload)
        .eq('id', b.id);

      if (upErr) {
        log(`  ❌ Error updating ${b.id}: ${upErr.message}`);
      } else {
        updatedCount++;
        log(`  [${updatedCount}] Updated: "${b.title}" -> "${title}"`);
      }
    }
  }

  log(`\n✓ Normalized and un-squished ${updatedCount} titles.\n`);

  // Step 4: Verification Queries
  log('4. Running post-mutation verification assertions...');
  const { count: finalBookCount } = await supabase
    .from('trophy_books')
    .select('*', { count: 'exact', head: true });

  const { count: finalProgCount } = await supabase
    .from('trophy_progress')
    .select('*', { count: 'exact', head: true });

  log(`====================================================`);
  log(`🎉 PHASE 1 EXECUTION COMPLETE`);
  log(`  - Final Book Count:     ${finalBookCount} (Expected: 1389)`);
  log(`  - Final Progress Count: ${finalProgCount} (Expected: 25)`);
  log(`  - Deleted Duplicates:   ${deletedCount}`);
  log(`  - Updated/Normalized:   ${updatedCount}`);
  log(`====================================================\n`);

  logStream.end();
}

executePhase1().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
