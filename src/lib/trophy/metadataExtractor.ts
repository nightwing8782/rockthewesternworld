import JSZip from 'jszip';
import { BookFormat, ReadingDirection } from '@/types/trophy';

export interface ExtractedInfo {
  title: string;
  series: string;
  issueNumber: number;
  author?: string;
  description?: string;
  readingDirection: ReadingDirection;
  pageCount: number;
  coverBlob?: Blob | null;
}

/**
 * Detect format from filename
 */
export function detectFormat(fileName: string): BookFormat {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'epub') return 'epub';
  if (ext === 'pdf') return 'pdf';
  return 'cbz';
}

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

/**
 * Un-squish PascalCase, CamelCase, and continuous lowercase run-on title strings
 */
export function unSquishWords(text: string): string {
  if (!text || typeof text !== 'string') return text;

  // 1. Strip extensions and brackets
  let str = text
    .replace(/\.(cbz|cbr|epub|pdf|zip)$/i, '')
    .replace(/\[.*?\]/g, ' ')
    .replace(/\((?!19\d\d|20\d\d).*?\)/g, ' ')
    .replace(/[-_]+/g, ' ')
    .trim();

  // 2. Explicit known full phrases
  const explicitPhrases: [RegExp, string][] = [
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

  // 3. Split PascalCase / CamelCase (e.g. ASilentVoice -> A Silent Voice, CanonOfYouth -> Canon Of Youth)
  str = str.replace(/([a-z])([A-Z])/g, '$1 $2');
  str = str.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');

  // 4. Token-by-token dynamic segmentation for long unspaced lowercase strings
  const tokens = str.split(/\s+/);
  const fixedTokens = tokens.map((token) => {
    if (token.length < 8 || /\s/.test(token)) return token;

    const lower = token.toLowerCase();

    // Check specific known starts
    if (lower.startsWith('canonofyouth')) return 'Canon of Youth' + token.slice(12);
    if (lower.startsWith('asilentvoice')) return 'A Silent Voice' + token.slice(12);
    if (lower.startsWith('atouchofthelovebug')) return 'A Touch of the Love Bug' + token.slice(18);
    if (lower.startsWith('attheclasspresidentsbeckandcall')) return "At the Class President's Beck and Call" + token.slice(31);
    if (lower.startsWith('thecompletepeanuts')) return 'The Complete Peanuts' + token.slice(18);

    let remainder = lower;
    const pieces: string[] = [];
    let matched = true;

    while (remainder.length > 0 && matched) {
      matched = false;

      // Small prepositions/articles
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

/**
 * Clean filename into structured Series, Issue Number, and Title
 */
export function parseFilenameHeuristics(filename: string): {
  cleanTitle: string;
  series: string;
  issueNumber: number;
} {
  // Strip file extension
  let name = filename.replace(/\.(cbz|cbr|zip|epub|pdf)$/i, '');

  // Strip scanner / release groups in brackets or parentheses like [Digital], (2021) (Zone-Empire)
  name = name.replace(/\[.*?\]/g, ' ').replace(/\((?!19\d\d|20\d\d).*?\)/g, ' ');

  // Extract issue number (e.g. #01, #12, v01, 001)
  let issueNumber = 1;
  const issueMatch = name.match(/#(\d+(?:\.\d+)?)/) || name.match(/\bv(?:ol)?\.?\s*(\d+)/i) || name.match(/\s(\d{1,4})(?:\s|$)/);
  if (issueMatch && issueMatch[1]) {
    const parsed = parseFloat(issueMatch[1]);
    if (!isNaN(parsed) && parsed < 2000) {
      issueNumber = parsed;
    }
  }

  // Split on hyphen or issue markers
  let series = name;
  if (name.includes(' - ')) {
    const parts = name.split(' - ');
    series = parts[0].trim();
  } else if (name.includes('#')) {
    series = name.split('#')[0].trim();
  }

  // Clean trailing punctuation
  series = unSquishWords(series.replace(/[-_#]+$/, '').trim());
  const cleanTitle = unSquishWords(name);

  return {
    cleanTitle: cleanTitle || filename,
    series: series || cleanTitle || 'Standalone',
    issueNumber: issueNumber || 1,
  };
}

/**
 * Extract cover & metadata from CBZ archive
 */
async function extractFromCbz(file: File | Blob, filename: string): Promise<ExtractedInfo> {
  const parsed = parseFilenameHeuristics(filename);
  let coverBlob: Blob | null = null;
  let pageCount = 0;
  let author: string | undefined;
  let description: string | undefined;
  let readingDirection: ReadingDirection = 'ltr';

  try {
    const zip = await JSZip.loadAsync(file);
    const imageExtensions = /\.(jpg|jpeg|png|webp|gif|bmp|avif)$/i;

    // Filter and sort image entries
    const imageEntries = Object.keys(zip.files)
      .filter((path) => imageExtensions.test(path) && !path.startsWith('__MACOSX/'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    pageCount = imageEntries.length;

    // Extract first image as cover
    if (imageEntries.length > 0) {
      const firstImage = zip.files[imageEntries[0]];
      const arrayBuffer = await firstImage.async('arraybuffer');
      const ext = imageEntries[0].split('.').pop()?.toLowerCase();
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      coverBlob = new Blob([arrayBuffer], { type: mime });
    }

    // Check for ComicInfo.xml
    const comicInfoKey = Object.keys(zip.files).find((k) => /comicinfo\.xml$/i.test(k));
    if (comicInfoKey) {
      const xmlText = await zip.files[comicInfoKey].async('text');
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'application/xml');

      const seriesTag = doc.querySelector('Series')?.textContent;
      const numberTag = doc.querySelector('Number')?.textContent;
      const writerTag = doc.querySelector('Writer')?.textContent;
      const summaryTag = doc.querySelector('Summary')?.textContent;
      const mangaTag = doc.querySelector('Manga')?.textContent;

      if (seriesTag) parsed.series = unSquishWords(seriesTag.trim());
      if (numberTag && !isNaN(parseFloat(numberTag))) parsed.issueNumber = parseFloat(numberTag);
      if (writerTag) author = writerTag.trim();
      if (summaryTag) description = summaryTag.trim();
      if (mangaTag && mangaTag.toLowerCase() === 'yesandrighttoleft') {
        readingDirection = 'rtl';
      }
    }
  } catch (err) {
    console.warn('[Extractor] Error reading CBZ:', err);
  }

  return {
    title: parsed.cleanTitle,
    series: parsed.series,
    issueNumber: parsed.issueNumber,
    author,
    description,
    readingDirection,
    pageCount,
    coverBlob,
  };
}

/**
 * Extract cover & metadata from EPUB
 */
async function extractFromEpub(file: File | Blob, filename: string): Promise<ExtractedInfo> {
  const parsed = parseFilenameHeuristics(filename);
  let coverBlob: Blob | null = null;
  let pageCount = 0;
  let author: string | undefined;
  let description: string | undefined;

  try {
    const zip = await JSZip.loadAsync(file);

    // Look for container.xml to locate rootfile (OPF)
    const containerFile = zip.file('META-INF/container.xml');
    if (containerFile) {
      const containerXml = await containerFile.async('text');
      const parser = new DOMParser();
      const doc = parser.parseFromString(containerXml, 'application/xml');
      const opfPath = doc.querySelector('rootfile')?.getAttribute('full-path');

      if (opfPath && zip.file(opfPath)) {
        const opfXml = await zip.file(opfPath)!.async('text');
        const opfDoc = parser.parseFromString(opfXml, 'application/xml');

        const titleTag = opfDoc.querySelector('title, dc\\:title')?.textContent;
        const creatorTag = opfDoc.querySelector('creator, dc\\:creator')?.textContent;
        const descTag = opfDoc.querySelector('description, dc\\:description')?.textContent;

        if (titleTag) parsed.cleanTitle = unSquishWords(titleTag.trim());
        if (creatorTag) author = creatorTag.trim();
        if (descTag) description = descTag.trim();

        // Try to locate cover image in manifest
        const coverItem = opfDoc.querySelector('item[properties~="cover-image"], item#cover-image, item#cover, item[id*="cover"]');
        if (coverItem) {
          const href = coverItem.getAttribute('href');
          if (href) {
            // Resolve relative path from opf folder
            const opfFolder = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
            const resolvedPath = opfFolder + href.replace(/^\.\//, '');
            const coverEntry = zip.file(resolvedPath) || zip.file(href);
            if (coverEntry) {
              const buf = await coverEntry.async('arraybuffer');
              const ext = href.split('.').pop()?.toLowerCase();
              const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
              coverBlob = new Blob([buf], { type: mime });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Extractor] Error reading EPUB:', err);
  }

  return {
    title: parsed.cleanTitle,
    series: parsed.series,
    issueNumber: parsed.issueNumber,
    author,
    description,
    readingDirection: 'ltr',
    pageCount: pageCount || 100,
    coverBlob,
  };
}

/**
 * Extract cover & metadata from PDF
 */
async function extractFromPdf(file: File | Blob, filename: string): Promise<ExtractedInfo> {
  const parsed = parseFilenameHeuristics(filename);
  let coverBlob: Blob | null = null;
  let pageCount = 0;

  return {
    title: parsed.cleanTitle,
    series: parsed.series,
    issueNumber: parsed.issueNumber,
    readingDirection: 'ltr',
    pageCount: pageCount || 50,
    coverBlob,
  };
}

/**
 * Universal Metadata Extractor
 */
export async function extractBookMetadata(
  file: File | Blob,
  filename: string,
  format?: BookFormat
): Promise<ExtractedInfo> {
  const detected = format || detectFormat(filename);

  switch (detected) {
    case 'epub':
      return extractFromEpub(file, filename);
    case 'pdf':
      return extractFromPdf(file, filename);
    case 'cbz':
    default:
      return extractFromCbz(file, filename);
  }
}

export async function extractBookInfo(file: File | Blob, filename?: string): Promise<ExtractedInfo> {
  const name = filename || (file instanceof File ? file.name : 'book');
  return extractBookMetadata(file, name);
}
