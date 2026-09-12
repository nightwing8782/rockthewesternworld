import { createClient } from '@/lib/supabase/client';

export interface ImageResult {
  id: string;
  title: string;
  url: string;
  thumbUrl: string;
  artist: string;
  category: string;
}

export const CURATED_ARCHIVE: ImageResult[] = [
  // The Jury by John Morgan
  {
    id: 'jury-1',
    title: 'The Jury (1861)',
    url: '/images/the-jury.jpg',
    thumbUrl: '/images/the-jury.jpg',
    artist: 'Painting by John Morgan (1823–1886)',
    category: 'potomac',
  },
  // Chicago & Architecture
  {
    id: 'chi-1',
    title: 'Chicago River & Marina City Towers at Twilight',
    url: '/images/chicago-river.jpg',
    thumbUrl: '/images/chicago-river.jpg',
    artist: 'Photo by Neal Kharawala',
    category: 'chicago',
  },
  {
    id: 'chi-2',
    title: 'Art Deco Facade & Chicago Architectural Geometry',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=500&auto=format&fit=crop&q=80',
    artist: 'Photo by Sawyer Bengtson',
    category: 'chicago',
  },
  {
    id: 'chi-3',
    title: 'Chicago Loop Elevated Train & Historical Shadows',
    url: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=500&auto=format&fit=crop&q=80',
    artist: 'Photo by Max Bender',
    category: 'chicago',
  },
  // Capitol & Potomac
  {
    id: 'cap-1',
    title: 'United States Capitol Dome Framed at Dusk',
    url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=500&auto=format&fit=crop&q=80',
    artist: 'Photo by Andy Feliciotti',
    category: 'potomac',
  },
  {
    id: 'cap-2',
    title: 'Supreme Court Classical Columns & Marble Facade',
    url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80',
    artist: 'Photo by Claire Anderson',
    category: 'potomac',
  },
  // Desert Sublime
  {
    id: 'des-1',
    title: 'American Western Desert Basin & Distant Mesa',
    url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500&auto=format&fit=crop&q=80',
    artist: 'Photo by Austin Schmid',
    category: 'desert',
  },
  {
    id: 'des-2',
    title: 'Open Highway Across the Mojave Wilderness',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=500&auto=format&fit=crop&q=80',
    artist: 'Photo by Jeremy Bishop',
    category: 'desert',
  },
  // Broadsheet & Typewriters
  {
    id: 'typ-1',
    title: 'Vintage Mechanical Typewriter & Fresh Heavy Stock',
    url: 'https://images.unsplash.com/photo-1526280760714-f9e8b06f3181?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1526280760714-f9e8b06f3181?w=500&auto=format&fit=crop&q=80',
    artist: 'Photo by Patrick Fore',
    category: 'broadsheet',
  },
  {
    id: 'typ-2',
    title: 'Historical Classical Library Stacks & Leather Folios',
    url: 'https://images.unsplash.com/photo-1507842229450-78212b4b455b?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1507842229450-78212b4b455b?w=500&auto=format&fit=crop&q=80',
    artist: 'Photo by Giammarco Boscaro',
    category: 'broadsheet',
  },
  // Jazz & Vinyl
  {
    id: 'jaz-1',
    title: 'Analog Vinyl Record Spinning on Turntable',
    url: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=500&auto=format&fit=crop&q=80',
    artist: 'Photo by Adrian Kister',
    category: 'jazz',
  },
  {
    id: 'jaz-2',
    title: 'Brass Trombone in Smoky Club Light',
    url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=500&auto=format&fit=crop&q=80',
    artist: 'Photo by Jens Thekkeveettil',
    category: 'jazz',
  },
  // Cinema & Noir
  {
    id: 'cin-1',
    title: 'Vintage Cinema Marquee Glowing in Night Mist',
    url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80',
    artist: 'Photo by Kilyan Sockalingum',
    category: 'cinema',
  },
  {
    id: 'cin-2',
    title: 'Shadow and Architectural Silhouettes in Noir Light',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80',
    artist: 'Photo by Joshua Fuller',
    category: 'cinema',
  },
];

export async function lookupImages(theme: string = '', query: string = ''): Promise<ImageResult[]> {
  let results = CURATED_ARCHIVE;
  if (theme) {
    results = results.filter((i) => i.category === theme);
  }
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (i) => i.title.toLowerCase().includes(q) || i.artist.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
    );
  }
  return results.length > 0 ? results : CURATED_ARCHIVE.slice(0, 6);
}

// 1. Books Search with Dual Open Library + Google Books
export async function lookupBooks(query: string) {
  if (!query.trim()) return [];
  const results: any[] = [];
  const seenTitles = new Set<string>();

  // A. Try Open Library First (No 429 rate limit issues)
  try {
    const url = 'https://openlibrary.org/search.json?q=' + encodeURIComponent(query.trim()) + '&limit=10';
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      const docs = data.docs || [];
      docs.forEach((doc: any) => {
        const title = doc.title || 'Untitled Book';
        const key = title.toLowerCase();
        if (!seenTitles.has(key)) {
          seenTitles.add(key);
          const isbn = doc.isbn ? doc.isbn[0] : null;
          const coverId = doc.cover_i;
          let coverUrl = null;
          if (coverId) coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
          else if (isbn) coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;

          results.push({
            id: doc.key || `ol-${Math.random()}`,
            title,
            author: doc.author_name ? doc.author_name.join(', ') : 'Unknown Author',
            publisher: doc.publisher ? doc.publisher[0] : '',
            year: doc.first_publish_year || (doc.publish_year ? doc.publish_year[0] : ''),
            isbn: isbn || '',
            pageCount: doc.number_of_pages_median || '',
            coverUrl,
            description: '',
          });
        }
      });
    }
  } catch (e) {
    console.warn('Open Library books error:', e);
  }

  // B. Fallback / Supplement with Google Books
  if (results.length < 5) {
    try {
      const url = 'https://www.googleapis.com/books/v1/volumes?q=' + encodeURIComponent(query.trim()) + '&maxResults=10';
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        items.forEach((item: any) => {
          const info = item.volumeInfo || {};
          const title = info.title || 'Untitled Volume';
          const key = title.toLowerCase();
          if (!seenTitles.has(key)) {
            seenTitles.add(key);
            const isbn13 = info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier;
            const isbn10 = info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier;
            const cover = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null;
            const cleanCover = cover ? cover.replace('http://', 'https://') : null;

            results.push({
              id: item.id,
              title,
              subtitle: info.subtitle || null,
              author: info.authors ? info.authors.join(', ') : 'Unknown Author',
              publisher: info.publisher || '',
              year: info.publishedDate ? info.publishedDate.substring(0, 4) : '',
              isbn: isbn13 || isbn10 || '',
              pageCount: info.pageCount || '',
              coverUrl: cleanCover,
              description: info.description || '',
            });
          }
        });
      }
    } catch (e) {
      console.warn('Google Books fallback warning:', e);
    }
  }

  return results;
}

// 2. High-Accuracy Comic & Graphic Novel Lookup (Open Library + Google Books)
export async function lookupComics(query: string) {
  if (!query.trim()) return [];
  const results: any[] = [];
  const seenTitles = new Set<string>();

  // A. Primary: Open Library Search (Comprehensive comics, graphic novels, manga, creator indexing)
  try {
    const url = 'https://openlibrary.org/search.json?q=' + encodeURIComponent(query.trim()) + '&limit=12';
    const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
    if (res.ok) {
      const data = await res.json();
      const docs = data.docs || [];
      docs.forEach((doc: any) => {
        const title = doc.title || 'Untitled Comic';
        const key = title.toLowerCase();
        if (!seenTitles.has(key)) {
          seenTitles.add(key);
          const isbn = doc.isbn ? doc.isbn[0] : null;
          const coverId = doc.cover_i;
          let coverUrl = null;
          if (coverId) coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
          else if (isbn) coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;

          const authors = doc.author_name || [];
          const writer = authors.length > 0 ? authors[0] : 'Unknown Writer';
          const artist = authors.length > 1 ? authors[1] : '';

          results.push({
            id: doc.key || `ol-${Math.random()}`,
            series: title,
            writer,
            artist,
            publisher: doc.publisher ? doc.publisher[0] : '',
            year: doc.first_publish_year || (doc.publish_year ? doc.publish_year[0] : ''),
            coverUrl,
            description: '',
          });
        }
      });
    }
  } catch (e) {
    console.warn('Comic Open Library lookup warning:', e);
  }

  // B. Secondary: Google Books clean query
  try {
    const url = 'https://www.googleapis.com/books/v1/volumes?q=' + encodeURIComponent(query.trim()) + '&maxResults=8';
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      const items = data.items || [];
      items.forEach((item: any) => {
        const info = item.volumeInfo || {};
        const title = info.title || 'Untitled Comic';
        const key = title.toLowerCase();
        if (!seenTitles.has(key)) {
          seenTitles.add(key);
          const cover = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null;
          const cleanCover = cover ? cover.replace('http://', 'https://') : null;
          const authors = info.authors || [];

          results.push({
            id: item.id,
            series: title,
            writer: authors.length > 0 ? authors[0] : 'Unknown Writer',
            artist: authors.length > 1 ? authors[1] : '',
            publisher: info.publisher || '',
            year: info.publishedDate ? info.publishedDate.substring(0, 4) : '',
            coverUrl: cleanCover,
            description: info.description || '',
          });
        }
      });
    }
  } catch (e) {
    console.warn('Comic Google Books lookup warning:', e);
  }

  return results;
}

// 3. iTunes Search API for Records / Music Albums
export async function lookupMusic(query: string) {
  if (!query.trim()) return [];
  try {
    const url = 'https://itunes.apple.com/search?term=' + encodeURIComponent(query) + '&entity=album&limit=10';
    const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
    if (res.ok) {
      const data = await res.json();
      const items = data.results || [];
      return items.map((item: any) => {
        let artwork = item.artworkUrl100 || null;
        if (artwork) {
          artwork = artwork.replace('100x100bb', '600x600bb');
        }
        return {
          id: String(item.collectionId),
          title: item.collectionName || 'Untitled Album',
          artist: item.artistName || 'Unknown Artist',
          year: item.releaseDate ? item.releaseDate.substring(0, 4) : '',
          label: item.copyright || item.primaryGenreName || '',
          coverUrl: artwork,
          genre: item.primaryGenreName || '',
          trackCount: item.trackCount || null,
        };
      });
    }
  } catch (e) {
    console.warn('iTunes Music API lookup warning:', e);
  }
  return [];
}

// 4. iTunes Podcast Search API for Podcasts
export async function lookupPodcasts(query: string) {
  if (!query.trim()) return [];
  try {
    const url = 'https://itunes.apple.com/search?term=' + encodeURIComponent(query) + '&entity=podcast&limit=10';
    const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
    if (res.ok) {
      const data = await res.json();
      const items = data.results || [];
      return items.map((item: any) => ({
        id: String(item.collectionId || item.trackId),
        podcastName: item.collectionName || item.trackName || 'Untitled Podcast',
        creator: item.artistName || 'Unknown Host / Studio',
        network: item.artistName || '',
        artworkUrl: item.artworkUrl600 || item.artworkUrl100 || null,
        feedUrl: item.feedUrl || '',
        primaryGenre: item.primaryGenreName || '',
      }));
    }
  } catch (e) {
    console.warn('iTunes Podcast API lookup warning:', e);
  }
  return [];
}

export async function subscribeUser(email: string) {
  try {
    const supabase = createClient();
    await supabase.from('subscribers').upsert(
      { email: email.trim().toLowerCase(), created_at: new Date().toISOString() },
      { onConflict: 'email' }
    );
  } catch (e) {}
  return { success: true, message: 'Subscribed to The Dispatch' };
}
