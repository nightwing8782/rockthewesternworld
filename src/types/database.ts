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

import type { DailyLedgerMetadata } from './journal';
export * from './journal';

export type EntryType =
  | 'essay'
  | 'thought'
  | 'book_review'
  | 'comic_review'
  | 'music_review'
  | 'podcast_review'
  | 'personal_ledger';

export type EntryStatus = 'draft' | 'published' | 'archived' | 'private';

export interface BookMetadata {
  title?: string;
  author?: string;
  translator?: string;
  publisher?: string;
  year?: number | string;
  isbn?: string;
  pageCount?: number | string;
  page_count?: number | string;
  pacing?: 'Slow Burn' | 'Deliberate' | 'Page-Turner' | string;
  pullQuote?: string;
  proseRating?: number;
  narrativeRating?: number;
  rating?: number;
  coverUrl?: string;
  cover_image_url?: string;
  openLibraryKey?: string;
}

export interface ComicMetadata {
  series?: string;
  issueNumber?: string;
  writer?: string;
  artist?: string;
  inker?: string;
  colorist?: string;
  letterer?: string;
  publisher?: string;
  year?: number | string;
  issue_count?: number | string;
  comic_vine_id?: number | string;
  accessibility?: 'Accessible Standalone' | 'Jumping-on Point' | 'Requires Prior Context' | string;
  prevReviewLink?: string;
  nextReviewLink?: string;
  storyRating?: number;
  artRating?: number;
  rating?: number;
  coverUrl?: string;
  cover_image_url?: string;
}

export interface MusicMetadata {
  title?: string;
  artist?: string;
  label?: string;
  year?: number | string;
  format?: 'Vinyl' | 'Digital' | 'CD' | string;
  essentialTracks?: string;
  sonicNeighbors?: string;
  songwritingRating?: number;
  productionRating?: number;
  rating?: number;
  coverUrl?: string;
  musicBrainzId?: string;
}

export interface PodcastMetadata {
  podcastName?: string;
  episodeTitle?: string;
  creator?: string;
  network?: string;
  style?: 'Narrative' | 'Interview' | 'Panel' | string;
  startingEpisode?: string;
  averageRuntime?: string;
  episodeNumber?: string;
  feedUrl?: string;
  artworkUrl?: string;
  researchRating?: number;
  audioCraftRating?: number;
  rating?: number;
}

export type MediaSourceType = 'upload' | 'public_domain' | 'review_cover' | 'url_import';
export type CoverType = 'hero_artwork' | 'artwork' | 'typographic';
export type TypographicOrnament = 'broadsheet_crest' | 'century_monogram' | 'woodcut_fleuron' | 'minimal_dropcap';

export interface EditorialMedia {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  image_url: string;
  thumbnail_url: string;
  storage_path: string;
  sha256_hash?: string;
  width?: number;
  height?: number;
  file_size_bytes?: number;
  mime_type: string;
  source_type: MediaSourceType;
  creator?: string;
  source: string;
  source_url?: string;
  license: string;
  attribution_text?: string;
  category: string;
  tags: string[];
  moods: string[];
  is_favorite: boolean;
  usage_count?: number;
  created_at: string;
  updated_at: string;
}

export interface EntryMedia {
  id: string;
  entry_id: string;
  media_id: string;
  role: 'cover' | 'inline' | 'social_card';
  created_at: string;
}

export type RelationshipType =
  | 'builds_upon'
  | 'referenced_by'
  | 'contradicts'
  | 'continues_from'
  | 'companion';

export type IdeaStage =
  | 'reflection'
  | 'reading_note'
  | 'draft'
  | 'editorial';

export interface RelatedWorkLink {
  id: string;
  title: string;
  slug: string;
  relationship: RelationshipType;
  entry_type?: EntryType;
}

export interface IdeaLineage {
  stage: IdeaStage;
  parent_id?: string;
  parent_title?: string;
  evolution_note?: string;
}

export interface ImageFocalPoint {
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
  label?: string; // e.g. "top", "center", "bottom"
}

export interface EntryMetadata extends BookMetadata, ComicMetadata, MusicMetadata, PodcastMetadata, Partial<DailyLedgerMetadata> {
  desk?: DeskType;
  category?: SubCategory | string;
  kicker?: string;
  excerpt?: string;
  deck?: string;
  tags?: string[];
  themes?: string[];
  related_works?: RelatedWorkLink[];
  idea_lineage?: IdeaLineage;
  focal_point?: ImageFocalPoint;
  alt_text?: string;
  trophy_room_item_id?: string;
  trophy_room_item_title?: string;
  used_in_essay_id?: string;
  used_in_essay_title?: string;
  cover_type?: CoverType;
  editorial_media_id?: string;
  typographic_ornament?: TypographicOrnament;
  imageCaption?: string;
  imageCredit?: string;
  cover_image_url?: string;
  credit_creator?: string;
  credit_title?: string;
  credit_source?: string;
  credit_source_url?: string;
  credit_license?: string;
  readingTime?: string;
  categories?: string[];
  isPrivate?: boolean;
  reflectionPrompt?: string;
  [key: string]: any;
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
