export type DeskType = 'commonwealth' | 'gallery' | 'logbook';

export type SubCategory =
  // The Commonwealth
  | 'Dan Reads the News'
  | 'Wading into the Potomac'
  // The Gallery
  | 'Off the Comic Rack'
  | 'Broadway Baby'
  | 'The Multiplex'
  | 'The Happy Medium'
  // The Logbook
  | 'A Literal Corner'
  | 'A Foray into Fiction'
  | 'Listen, My Friends'
  | 'Either Sadness or Euphoria';

export interface DeskDefinition {
  id: DeskType;
  title: string;
  tagline: string;
  categories: SubCategory[];
}

export const EDITORIAL_DESKS: DeskDefinition[] = [
  {
    id: 'commonwealth',
    title: 'THE COMMONWEALTH',
    tagline: 'Constitutional, legal, and current affairs analysis',
    categories: ['Dan Reads the News', 'Wading into the Potomac'],
  },
  {
    id: 'gallery',
    title: 'THE GALLERY',
    tagline: 'Comics, cinema, stage, and popular arts',
    categories: [
      'Off the Comic Rack',
      'Broadway Baby',
      'The Multiplex',
      'The Happy Medium',
    ],
  },
  {
    id: 'logbook',
    title: 'THE LOGBOOK',
    tagline: 'Literature, recorded music, and personal dispatches',
    categories: [
      'A Literal Corner',
      'A Foray into Fiction',
      'Listen, My Friends',
      'Either Sadness or Euphoria',
    ],
  },
];

export type EntryType =
  | 'essay'
  | 'thought'
  | 'book_review'
  | 'comic_review'
  | 'music_review'
  | 'podcast_review';

export type EntryStatus = 'draft' | 'published' | 'archived';

export interface BookMetadata {
  title?: string;
  author?: string;
  year?: number | string;
  isbn?: string;
  coverUrl?: string;
  rating?: number;
  openLibraryKey?: string;
}

export interface ComicMetadata {
  series?: string;
  issueNumber?: string;
  writer?: string;
  artist?: string;
  publisher?: string;
  year?: number | string;
  coverUrl?: string;
  rating?: number;
}

export interface MusicMetadata {
  title?: string;
  artist?: string;
  year?: number | string;
  label?: string;
  coverUrl?: string;
  rating?: number;
  musicBrainzId?: string;
}

export interface PodcastMetadata {
  podcastName?: string;
  episodeTitle?: string;
  creator?: string;
  episodeNumber?: string;
  feedUrl?: string;
  artworkUrl?: string;
  rating?: number;
}

export interface EntryMetadata extends BookMetadata, ComicMetadata, MusicMetadata, PodcastMetadata {
  desk?: DeskType;
  category?: SubCategory | string;
  kicker?: string;
  excerpt?: string;
  deck?: string;
  tags?: string[];
  imageCaption?: string;
  imageCredit?: string;
  readingTime?: string;
  categories?: string[];
}

export interface Entry {
  id: string;
  user_id: string;
  entry_type: EntryType;
  status: EntryStatus;
  title: string | null;
  slug: string | null;
  body_json: any | null;
  body_html: string | null;
  metadata: EntryMetadata;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}
