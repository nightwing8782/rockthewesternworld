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
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/The_Jury_by_John_Morgan.jpg',
    thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/The_Jury_by_John_Morgan.jpg/640px-The_Jury_by_John_Morgan.jpg',
    artist: 'Painting by John Morgan (1823–1886)',
    category: 'potomac',
  },
  // Chicago & Architecture
  {
    id: 'chi-1',
    title: 'Chicago River & Marina City Towers at Twilight',
    url: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=500&auto=format&fit=crop&q=80',
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
  {
    id: 'cap-3',
    title: 'Potomac River Mist & Historical Monument Silhouette',
    url: 'https://images.unsplash.com/photo-1501446529957-6226bd447c46?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1501446529957-6226bd447c46?w=500&auto=format&fit=crop&q=80',
    artist: 'Photo by Tim Mossholder',
    category: 'potomac',
  },
  // Desert & Frontier
  {
    id: 'des-1',
    title: 'High Desert Mineral Plateau & Red Evening Sunset',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=500&auto=format&fit=crop&q=80',
    artist: 'Photo by Patrick Hendry',
    category: 'desert',
  },
  {
    id: 'des-2',
    title: 'Solitary Desert Highway Crossing the Great Basin',
    url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500&auto=format&fit=crop&q=80',
    artist: 'Photo by Leio McLaren',
    category: 'desert',
  },
  // Broadsheet, Typewriters
  {
    id: 'typ-1',
    title: 'Vintage Mechanical Typewriter with Fresh Manuscript Paper',
    url: 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=500&auto=format&fit=crop&q=80',
    artist: 'Photo by Florian Klauer',
    category: 'broadsheet',
  },
  {
    id: 'typ-2',
    title: 'Archival Library Room & Bound Leather Volumes',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=500&auto=format&fit=crop&q=80',
    artist: 'Photo by Giammarco Boscaro',
    category: 'broadsheet',
  },
  // Jazz, Vinyl
  {
    id: 'jaz-1',
    title: 'Vinyl Record Spinning on Turntable Center Label',
    url: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=500&auto=format&fit=crop&q=80',
    artist: 'Photo by Travis Yewell',
    category: 'jazz',
  },
  {
    id: 'jaz-2',
    title: 'Atmospheric Jazz Club Stage & Upright Bass',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    artist: 'Photo by Gabriel Gurrola',
    category: 'jazz',
  },
  // Cinema
  {
    id: 'cin-1',
    title: 'Vintage Art Deco Cinema Marquee at Night',
    url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80',
    thumbUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80',
    artist: 'Photo by Felix Mooneeram',
    category: 'cinema',
  },
];

const FALLBACK_BOOKS = [
  {
    title: 'Dune',
    author: 'Frank Herbert',
    year: '1965',
    isbn: '9780441172719',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780441172719-M.jpg',
  },
  {
    title: 'Blood Meridian',
    author: 'Cormac McCarthy',
    year: '1985',
    isbn: '9780679728757',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780679728757-M.jpg',
  },
  {
    title: 'Gravity\'s Rainbow',
    author: 'Thomas Pynchon',
    year: '1973',
    isbn: '9780140188592',
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780140188592-M.jpg',
  },
];

const FALLBACK_MUSIC = [
  {
    id: 'mb-1',
    title: 'OK Computer',
    artist: 'Radiohead',
    year: '1997',
    coverUrl: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'mb-2',
    title: 'A Love Supreme',
    artist: 'John Coltrane',
    year: '1965',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
  },
];

const FALLBACK_PODCASTS = [
  {
    podcastName: 'Hardcore History',
    creator: 'Dan Carlin',
    artworkUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500&auto=format&fit=crop&q=80',
  },
  {
    podcastName: 'The Daily',
    creator: 'The New York Times',
    artworkUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=500&auto=format&fit=crop&q=80',
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

export async function lookupBooks(query: string) {
  if (!query.trim()) return FALLBACK_BOOKS;
  try {
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8`, {
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data = await res.json();
      const docs = data.docs || [];
      if (docs.length > 0) {
        return docs.map((doc: any) => {
          const isbn = doc.isbn ? doc.isbn[0] : null;
          const coverId = doc.cover_i;
          let coverUrl = null;
          if (coverId) coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
          else if (isbn) coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
          return {
            title: doc.title,
            author: doc.author_name ? doc.author_name.join(', ') : 'Unknown Author',
            year: doc.first_publish_year || (doc.publish_year ? doc.publish_year[0] : null),
            isbn: isbn || null,
            coverUrl,
          };
        });
      }
    }
  } catch (e) {}
  return FALLBACK_BOOKS.filter((b) => b.title.toLowerCase().includes(query.toLowerCase()));
}

export async function lookupMusic(query: string) {
  if (!query.trim()) return FALLBACK_MUSIC;
  try {
    const res = await fetch(`https://musicbrainz.org/ws/2/release?query=${encodeURIComponent(query)}&fmt=json&limit=8`, {
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data = await res.json();
      const releases = data.releases || [];
      if (releases.length > 0) {
        return releases.map((rel: any) => ({
          id: rel.id,
          title: rel.title,
          artist: rel['artist-credit'] ? rel['artist-credit'].map((a: any) => a.name).join('') : 'Unknown Artist',
          year: rel.date ? rel.date.substring(0, 4) : null,
          coverUrl: `https://coverartarchive.org/release/${rel.id}/front-250`,
        }));
      }
    }
  } catch (e) {}
  return FALLBACK_MUSIC.filter((m) => m.title.toLowerCase().includes(query.toLowerCase()));
}

export async function lookupPodcasts(query: string) {
  if (!query.trim()) return FALLBACK_PODCASTS;
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=podcast&limit=8`, {
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data = await res.json();
      const results = data.results || [];
      if (results.length > 0) {
        return results.map((item: any) => ({
          podcastName: item.collectionName || item.trackName,
          creator: item.artistName,
          artworkUrl: item.artworkUrl600 || item.artworkUrl100,
        }));
      }
    }
  } catch (e) {}
  return FALLBACK_PODCASTS.filter((p) => p.podcastName.toLowerCase().includes(query.toLowerCase()));
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
