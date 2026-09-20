process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

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

// Common dictionary for separating all-lowercase words
const KNOWN_WORDS = [
  // Manga & Anime
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
  'radiant', 'blame', 'biomega', 'sidonia',

  // Comic & Superhero terms
  'complete', 'peanuts', 'transformers', 'more', 'than', 'meets', 'eye', 'last', 'stand',
  'wreckers', 'all', 'hail', 'megatron', 'autocracy', 'monstrosity', 'primacy', 'sins',
  'requiem', 'robots', 'disguise', 'windblade', 'till', 'are', 'one', 'lost', 'light',
  'optimus', 'prime', 'unicron', 'shattered', 'glass', 'beast', 'wars', 'ironhide',
  'bumblebee', 'drift', 'kup', 'blurr', 'cliffjumper', 'wheeljack', 'origin', 'spotlight',
  'maximum', 'dinobots', 'heart', 'darkness', 'chaos', 'dark', 'cybertron', 'combiner',
  'titans', 'return', 'revolution', 'first', 'strike', 'infestation', 'incompetent', 'villain',
  'doctor', 'aphra', 'darth', 'vader', 'star', 'bounty', 'hunters', 'high', 'republic',
  'department', 'truth', 'something', 'is', 'killing', 'the', 'children', 'house', 'slaughter',
  'nice', 'lake', 'dracula', 'wynd', 'memetic', 'cognet', 'eugenic', 'over', 'garden',
  'wall', 'woods', 'bravest', 'warriors', 'lumberjanes', 'steven', 'universe', 'adventure',
  'time', 'regular', 'show', 'panelxpanel', 'panel', 'story', 'craft', 'anatomy', 'hero',
  'thousand', 'faces', 'save', 'cat', 'batman', 'superman', 'wonder', 'woman', 'spider',
  'avengers', 'xmen', 'mutants', 'flash', 'green', 'lantern', 'nightwing', 'daredevil',

  // General / Guides
  'cookbook', 'food', 'lab', 'serious', 'eats', 'baking', 'bread', 'salt', 'fat', 'acid', 'heat',
  'flour', 'water', 'yeast', 'dummies', 'writing', 'screenplay', 'screenwriting', 'guide',
  'secret', 'history', 'chronicles', 'chronicle', 'tales', 'legend', 'quest', 'magic', 'galaxy',
  'sun', 'sky', 'wind', 'fire', 'earth', 'stone', 'iron', 'steel', 'gold', 'silver', 'room',
  'street', 'road', 'path', 'door', 'gate', 'bridge', 'tower', 'castle', 'palace', 'temple',
  'school', 'academy', 'club', 'friend', 'friends', 'girl', 'boy', 'man', 'woman', 'child',
  'daughter', 'brother', 'sister', 'father', 'mother', 'family', 'master', 'teacher', 'student',
  'prince', 'princess', 'knight', 'soldier', 'warrior', 'captain', 'leader', 'boss', 'wizard',
  'ghost', 'spirit', 'angel', 'saint', 'wolf', 'fox', 'bear', 'lion', 'tiger', 'rabbit',
  'flower', 'tree', 'forest', 'mountain', 'river', 'ocean', 'island', 'garden', 'spring',
  'summer', 'autumn', 'winter', 'rain', 'snow', 'storm', 'cloud', 'thunder', 'lightning',
  'dream', 'nightmare', 'memory', 'hope', 'wish', 'fear', 'pain', 'joy', 'sorrow', 'truth',
  'peace', 'order', 'destiny', 'fate', 'promise', 'vow', 'curse', 'spell', 'power', 'force',
  'energy', 'soul', 'mind', 'body', 'sound', 'music', 'song', 'dance', 'game', 'play',
  'volume', 'issue', 'chapter', 'part', 'book', 'edition', 'version', 'special', 'annual'
];

KNOWN_WORDS.sort((a, b) => b.length - a.length);

function unSquishWords(text) {
  if (!text || typeof text !== 'string') return text;

  // 1. Remove file extensions and brackets
  let str = text
    .replace(/\.(cbz|cbr|epub|pdf|zip)$/i, '')
    .replace(/\[.*?\]/g, ' ')
    .replace(/\((?!19\d\d|20\d\d).*?\)/g, ' ')
    .replace(/[-_]+/g, ' ')
    .trim();

  // 2. Explicit known full phrases
  const explicitPhrases = [
    [/^asilentvoice/i, 'A Silent Voice'],
    [/^canonofyouth/i, 'Canon of Youth'],
    [/^atouchofthelovebug/i, 'A Touch of the Love Bug'],
    [/^attheclasspresidentsbeckandcall/i, "At the Class President's Beck and Call"],
    [/^thecompletepeanuts/i, 'The Complete Peanuts'],
    [/^thefoodlab/i, 'The Food Lab'],
    [/^goodnightpunpun/i, 'Goodnight Punpun'],
  ];

  for (const [pattern, replacement] of explicitPhrases) {
    if (pattern.test(str)) {
      str = str.replace(pattern, replacement);
      break;
    }
  }

  // 3. Split PascalCase / CamelCase
  str = str.replace(/([a-z])([A-Z])/g, '$1 $2');
  str = str.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');

  // 4. Token-by-token dynamic segmentation
  const tokens = str.split(/\s+/);
  const fixedTokens = tokens.map((token) => {
    if (token.length < 8 || /\s/.test(token)) return token;

    const lower = token.toLowerCase();

    if (lower.startsWith('canonofyouth')) return 'Canon of Youth' + token.slice(12);
    if (lower.startsWith('asilentvoice')) return 'A Silent Voice' + token.slice(12);
    if (lower.startsWith('atouchofthelovebug')) return 'A Touch of the Love Bug' + token.slice(18);
    if (lower.startsWith('attheclasspresidentsbeckandcall')) return "At the Class President's Beck and Call" + token.slice(31);
    if (lower.startsWith('thecompletepeanuts')) return 'The Complete Peanuts' + token.slice(18);

    let remainder = lower;
    const pieces = [];
    let matched = true;

    while (remainder.length > 0 && matched) {
      matched = false;
      if (remainder.startsWith('a') && remainder.length > 1 && !remainder.startsWith('an') && !remainder.startsWith('at') && !remainder.startsWith('as') && !remainder.startsWith('all')) {
        pieces.push('A');
        remainder = remainder.slice(1);
        matched = true;
        continue;
      }
      if (remainder.startsWith('at') && remainder.length > 2) {
        pieces.push('At');
        remainder = remainder.slice(2);
        matched = true;
        continue;
      }
      if (remainder.startsWith('of') && remainder.length > 2) {
        pieces.push('of');
        remainder = remainder.slice(2);
        matched = true;
        continue;
      }
      if (remainder.startsWith('in') && remainder.length > 2) {
        pieces.push('in');
        remainder = remainder.slice(2);
        matched = true;
        continue;
      }
      if (remainder.startsWith('to') && remainder.length > 2) {
        pieces.push('to');
        remainder = remainder.slice(2);
        matched = true;
        continue;
      }
      if (remainder.startsWith('the') && remainder.length > 3) {
        pieces.push('The');
        remainder = remainder.slice(3);
        matched = true;
        continue;
      }
      if (remainder.startsWith('and') && remainder.length > 3) {
        pieces.push('and');
        remainder = remainder.slice(3);
        matched = true;
        continue;
      }

      for (const kw of KNOWN_WORDS) {
        if (remainder.startsWith(kw)) {
          pieces.push(kw.charAt(0).toUpperCase() + kw.slice(1));
          remainder = remainder.slice(kw.length);
          matched = true;
          break;
        }
      }
    }

    if (!matched && remainder.length > 0) {
      pieces.push(remainder);
    }

    if (pieces.length > 1) {
      return pieces.join(' ');
    }

    return token;
  });

  str = fixedTokens.join(' ');

  // 5. Clean Title Casing
  const lowercase = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'of', 'in', 'with', 'vs', 'v'];
  str = str
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      const wLower = word.toLowerCase();
      if (index > 0 && lowercase.includes(wLower)) return wLower;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');

  // Format vol / issue markers
  str = str.replace(/\bv(\d+)\b/i, 'Vol. $1');
  str = str.replace(/\bvol\.?\s*(\d+)/i, 'Vol. $1');
  str = str.replace(/\b#\s*(\d+)/, '#$1');

  return str;
}

const MANGA_REGEX = /silent\s*voice|canon\s*of\s*youth|touch\s*of\s*the\s*love\s*bug|president.*beck.*call|fullmetal|chainsaw|punpun|tokyo\s*ghoul|berserk|my\s*hero|one\s*piece|naruto|bleach|jujutsu|demon\s*slayer|attack\s*on\s*titan|haikyuu|slam\s*dunk|vagabond|death\s*note|spy\s*x\s*family|frieren|dungeon\s*meshi|apothecary|vinland|bocchi|kaguya|horimiya|komi|dorohedoro|golden\s*kamuy|kingdom|blue\s*lock|dragon\s*ball|hunter\s*x\s*hunter|sailor\s*moon|inuyasha|ranma|evangelion|akira|ghost\s*in\s*the\s*shell|parasyte|gintama|beastars|dr\s*stone|black\s*clover|fairy\s*tail|fire\s*force|soul\s*eater|claymore|hellsing|trigun|gantz|blame|land\s*of\s*the\s*lustrous|witch\s*hat\s*atelier/i;

async function run() {
  console.log('========================================================');
  console.log(' 🛠️ TROPHY ROOM: Title & Series Un-Squisher Tool');
  console.log('========================================================\n');

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    let email = process.env.SUPABASE_AUTH_EMAIL || 'danbillingsster@gmail.com';
    let password = process.env.SUPABASE_AUTH_PASSWORD;

    if (!password) {
      password = await promptInput(`Enter password for Supabase (${email}): `);
    }

    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    if (authErr) {
      console.error('❌ Supabase Login failed:', authErr.message);
      process.exit(1);
    }
    console.log('✓ Authenticated with Supabase.\n');
  }

  console.log('Fetching all books from trophy_books table...');
  let books = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('trophy_books')
      .select('id, title, series, issue_number, volume_number, medium, file_key')
      .range(from, from + pageSize - 1);

    if (error || !data || data.length === 0) break;
    books = books.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(`Found ${books.length} total books in vault.\n`);

  let updateCount = 0;

  for (const book of books) {
    const origTitle = book.title || '';
    const origSeries = book.series || '';
    const origMedium = book.medium || 'comic';

    const newTitle = unSquishWords(origTitle);
    const newSeries = origSeries && origSeries !== 'Standalone' ? unSquishWords(origSeries) : origSeries;

    // Check if medium should be set to manga
    let newMedium = origMedium;
    if (origMedium === 'comic' && (MANGA_REGEX.test(newTitle) || MANGA_REGEX.test(newSeries))) {
      newMedium = 'manga';
    }

    const titleChanged = newTitle !== origTitle;
    const seriesChanged = newSeries !== origSeries;
    const mediumChanged = newMedium !== origMedium;

    if (titleChanged || seriesChanged || mediumChanged) {
      updateCount++;
      console.log(`[${updateCount}] Repairing:`);
      if (titleChanged) console.log(`   Title:  "${origTitle}" -> "${newTitle}"`);
      if (seriesChanged) console.log(`   Series: "${origSeries}" -> "${newSeries}"`);
      if (mediumChanged) console.log(`   Medium: "${origMedium}" -> "${newMedium}"`);

      const payload = {};
      if (titleChanged) payload.title = newTitle;
      if (seriesChanged) payload.series = newSeries;
      if (mediumChanged) payload.medium = newMedium;

      const { error: upErr } = await supabase
        .from('trophy_books')
        .update(payload)
        .eq('id', book.id);

      if (upErr) {
        console.warn(`   ⚠️ Error updating book ID ${book.id}:`, upErr.message);
      }
    }
  }

  console.log(`\n========================================================`);
  console.log(`✨ Successfully cleaned and un-squished ${updateCount} titles/series/mediums!`);
  console.log(`========================================================\n`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
