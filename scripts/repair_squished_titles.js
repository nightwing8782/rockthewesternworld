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
  'silent', 'voice', 'touch', 'love', 'bug', 'class', 'presidents', 'president',
  'beck', 'call', 'complete', 'peanuts', 'transformers', 'more', 'than', 'meets',
  'eye', 'last', 'stand', 'wreckers', 'all', 'hail', 'megatron', 'autocracy',
  'monstrosity', 'primacy', 'sins', 'requiem', 'robots', 'disguise', 'windblade',
  'till', 'are', 'one', 'lost', 'light', 'optimus', 'prime', 'unicron', 'shattered',
  'glass', 'beast', 'wars', 'ironhide', 'bumblebee', 'drift', 'kup', 'blurr',
  'cliffjumper', 'wheeljack', 'origin', 'spotlight', 'maximum', 'dinobots', 'heart',
  'darkness', 'death', 'chaos', 'dark', 'cybertron', 'combiner', 'titans', 'return',
  'revolution', 'first', 'strike', 'infestation', 'incompetent', 'villain', 'doctor',
  'aphra', 'darth', 'vader', 'star', 'bounty', 'hunters', 'high', 'republic',
  'department', 'truth', 'something', 'is', 'killing', 'the', 'children', 'house',
  'slaughter', 'nice', 'lake', 'dracula', 'wynd', 'memetic', 'cognet', 'eugenic',
  'over', 'garden', 'wall', 'woods', 'bravest', 'warriors', 'lumberjanes', 'steven',
  'universe', 'adventure', 'time', 'regular', 'show', 'cookbook', 'food', 'lab',
  'serious', 'eats', 'baking', 'bread', 'salt', 'fat', 'acid', 'heat', 'flour',
  'water', 'yeast', 'adams', 'dummies', 'writing', 'screenplay', 'screenwriting',
  'panelxpanel', 'panel', 'story', 'craft', 'anatomy', 'hero', 'thousand', 'faces',
  'save', 'cat', 'into', 'from', 'with', 'about', 'under', 'after', 'before',
  'between', 'through', 'during', 'without', 'again', 'further', 'then', 'once',
  'here', 'there', 'when', 'where', 'why', 'how', 'each', 'every', 'other',
  'such', 'only', 'own', 'same', 'than', 'too', 'very', 'can', 'will', 'just',
  'should', 'now', 'vol', 'volume', 'issue', 'chapter', 'part', 'book', 'edition'
];

// Sort known words by length descending so longer words match first
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

  // 2. Split PascalCase / CamelCase (e.g. ASilentVoice -> A Silent Voice, TheCompletePeanuts -> The Complete Peanuts)
  str = str.replace(/([a-z])([A-Z])/g, '$1 $2');
  str = str.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');

  // 3. For single words that are suspiciously long (> 10 chars) and contain no spaces, attempt dictionary segmentation
  const tokens = str.split(/\s+/);
  const fixedTokens = tokens.map((token) => {
    // If token is already mixed case with spaces or short, leave it
    if (token.length < 9 || /\s/.test(token)) return token;

    // Check if token is all lowercase or all uppercase
    const lower = token.toLowerCase();
    
    // Explicit known titles
    if (lower.startsWith('asilentvoice')) return 'A Silent Voice' + token.slice(12);
    if (lower.startsWith('atouchofthelovebug')) return 'A Touch of the Love Bug' + token.slice(18);
    if (lower.startsWith('attheclasspresidentsbeckandcall')) return "At the Class President's Beck and Call" + token.slice(31);
    if (lower.startsWith('thecompletepeanuts')) return 'The Complete Peanuts' + token.slice(18);

    // Dynamic greedy segmentation
    let remainder = lower;
    const pieces = [];
    let matched = true;

    while (remainder.length > 0 && matched) {
      matched = false;
      // Check single letter words (a, i)
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
        pieces.push('Of');
        remainder = remainder.slice(2);
        matched = true;
        continue;
      }
      if (remainder.startsWith('in') && remainder.length > 2) {
        pieces.push('In');
        remainder = remainder.slice(2);
        matched = true;
        continue;
      }
      if (remainder.startsWith('to') && remainder.length > 2) {
        pieces.push('To');
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
        pieces.push('And');
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

  // 4. Format to clean Title Case
  const lowercase = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'of', 'in', 'with', 'vs'];
  str = str
    .split(' ')
    .filter(Boolean)
    .map((word, index) => {
      const wLower = word.toLowerCase();
      if (index > 0 && lowercase.includes(wLower)) return wLower;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');

  // Clean trailing artifacts like "v01" -> "Vol. 1"
  str = str.replace(/\bv(\d+)\b/i, 'Vol. $1');
  str = str.replace(/\bvol\.?\s*(\d+)/i, 'Vol. $1');
  str = str.replace(/\b#\s*(\d+)/, '#$1');

  return str;
}

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

    const newTitle = unSquishWords(origTitle);
    const newSeries = origSeries && origSeries !== 'Standalone' ? unSquishWords(origSeries) : origSeries;

    const titleChanged = newTitle !== origTitle;
    const seriesChanged = newSeries !== origSeries;

    if (titleChanged || seriesChanged) {
      updateCount++;
      console.log(`[${updateCount}] Repairing:`);
      if (titleChanged) console.log(`   Title:  "${origTitle}" -> "${newTitle}"`);
      if (seriesChanged) console.log(`   Series: "${origSeries}" -> "${newSeries}"`);

      const payload = {};
      if (titleChanged) payload.title = newTitle;
      if (seriesChanged) payload.series = newSeries;

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
  console.log(`✨ Successfully cleaned and un-squished ${updateCount} titles/series!`);
  console.log(`========================================================\n`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
