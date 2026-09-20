import { TrophyBook, FilterCategory } from '@/types/trophy';

const KNOWN_MANGA_PATTERNS = [
  /silent\s*voice/i,
  /canon\s*of\s*youth/i,
  /canonofyouth/i,
  /touch\s*of\s*the\s*love\s*bug/i,
  /president.*beck.*call/i,
  /fullmetal/i,
  /chainsaw\s*man/i,
  /punpun/i,
  /tokyo\s*ghoul/i,
  /berserk/i,
  /my\s*hero/i,
  /one\s*piece/i,
  /naruto/i,
  /bleach/i,
  /jujutsu/i,
  /demon\s*slayer/i,
  /kimetsu/i,
  /attack\s*on\s*titan/i,
  /shingeki/i,
  /haikyuu/i,
  /slam\s*dunk/i,
  /vagabond/i,
  /monster\s*v/i,
  /death\s*note/i,
  /spy\s*x\s*family/i,
  /frieren/i,
  /dungeon\s*meshi/i,
  /delicious\s*in\s*dungeon/i,
  /apothecary\s*diaries/i,
  /vinland\s*saga/i,
  /bocchi/i,
  /kaguya/i,
  /horimiya/i,
  /komi/i,
  /dorohedoro/i,
  /golden\s*kamuy/i,
  /kingdom/i,
  /blue\s*lock/i,
  /blue\s*period/i,
  /dragon\s*ball/i,
  /hunter\s*x\s*hunter/i,
  /sailor\s*moon/i,
  /inuyasha/i,
  /ranma/i,
  /evangelion/i,
  /akira/i,
  /ghost\s*in\s*the\s*shell/i,
  /parasyte/i,
  /gintama/i,
  /beastars/i,
  /dr\s*stone/i,
  /black\s*clover/i,
  /fairy\s*tail/i,
  /fire\s*force/i,
  /soul\s*eater/i,
  /claymore/i,
  /hellsing/i,
  /trigun/i,
  /gantz/i,
  /blame/i,
  /land\s*of\s*the\s*lustrous/i,
  /witch\s*hat\s*atelier/i,
  /shonen/i,
  /seinen/i,
  /shojo/i,
  /josei/i,
  /manga/i,
];

/**
 * Checks whether a book belongs to Manga Sanctuary.
 * Independent grouping: Manga covers Japanese RTL series, tankobon runs, or tagged manga.
 */
export function isMangaBook(book: Partial<TrophyBook>): boolean {
  if (book.medium === 'manga') return true;
  if (Array.isArray(book.tags) && book.tags.some((t) => typeof t === 'string' && t.toLowerCase() === 'manga')) return true;
  if (book.reading_direction === 'rtl') return true;

  const title = String(book.title || '');
  const series = String(book.series || '');
  const publisher = String(book.publisher || '');

  if (KNOWN_MANGA_PATTERNS.some((p) => p.test(title) || p.test(series))) {
    return true;
  }

  const mangaPublishers = ['kodansha', 'shueisha', 'viz', 'yen press', 'square enix', 'hakusensha', 'seven seas', 'tokyopop'];
  if (mangaPublishers.some((pub) => publisher.toLowerCase().includes(pub))) {
    return true;
  }

  return false;
}

/**
 * Checks whether a book belongs to Comic Archives.
 * Independent grouping: Western comics, floppies, graphic novels.
 * Explicitly excludes Manga, Cookbooks, Reference, Wellness, Magazines, and Novels.
 */
export function isComicBook(book: Partial<TrophyBook>): boolean {
  // Exclude all other specific mediums first
  if (isMangaBook(book)) return false;
  if (book.medium === 'cookbook' || (book.tags || []).includes('cookbook')) return false;
  if (book.medium === 'reference' || (book.tags || []).includes('reference')) return false;
  if (book.medium === 'wellness' || (book.tags || []).includes('wellness')) return false;
  if (book.medium === 'magazine' || (book.tags || []).includes('magazine')) return false;
  if (book.medium === 'novel' || book.format === 'epub') return false;

  return (
    book.medium === 'comic' ||
    book.format === 'cbz' ||
    (book.format as any) === 'cbr' ||
    (Array.isArray(book.tags) && book.tags.some((t) => typeof t === 'string' && t.toLowerCase() === 'comic'))
  );
}

/**
 * Categorize a book into its primary Watchtower Sector
 */
export function getBookSector(book: Partial<TrophyBook>): FilterCategory {
  if (isMangaBook(book)) return 'manga';
  if (book.medium === 'cookbook' || (book.tags || []).includes('cookbook')) return 'cookbook';
  if (book.medium === 'reference' || (book.tags || []).includes('reference')) return 'reference';
  if (book.medium === 'wellness' || (book.tags || []).includes('wellness')) return 'wellness';
  if (book.medium === 'magazine' || (book.tags || []).includes('magazine')) return 'magazine';
  if (book.format === 'epub' || book.medium === 'novel' || (book.tags || []).includes('novel')) return 'epub';
  return 'comic';
}
