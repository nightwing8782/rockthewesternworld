export type BookFormat = 'cbz' | 'epub' | 'pdf';
export type ReadingDirection = 'ltr' | 'rtl';
export type ShelfViewMode = 'stacked' | 'grid' | 'list';
export type BookMedium =
  | 'comic'
  | 'manga'
  | 'novel'
  | 'cookbook'
  | 'reference'
  | 'magazine'
  | 'wellness'
  | 'writing'
  | 'artbook'
  | 'other';

export type FilterCategory =
  | 'all'
  | 'comic'
  | 'manga'
  | 'cookbook'
  | 'reference'
  | 'wellness'
  | 'magazine'
  | 'cbz'
  | 'epub'
  | 'pdf'
  | 'offline'
  | 'in-progress'
  | 'completed'
  | 'favorites';

export type SortOption =
  | 'series-asc'
  | 'title-asc'
  | 'recently-read'
  | 'progress-desc'
  | 'issue-asc'
  | 'year-desc'
  | 'rating-desc';

export interface TrophyBook {
  id: string;
  user_id?: string | null;
  title: string;
  series: string;
  issue_number: number;
  format: BookFormat;
  file_key: string;
  file_size: number;
  cover_key?: string | null;
  cover_url?: string | null;
  coverBlob?: Blob | null; // Cached thumbnail in IndexedDB
  author?: string | null;
  description?: string | null;
  reading_direction: ReadingDirection;
  page_count: number;
  tags: string[];
  // Rich Taxonomy & Metadata Extension
  medium?: BookMedium | string;
  genres?: string[];
  volume_number?: number | null;
  franchise?: string | null;
  illustrator?: string | null;
  publisher?: string | null;
  published_year?: string | null;
  isbn?: string | null;
  is_favorite?: boolean;
  rating?: number | null;
  story_arc?: string | null;
  collections?: string[];
  primary_color?: string | null;
  aspect_ratio?: 'portrait' | 'landscape' | string;
  created_at?: string;
  updated_at?: string;
  // Dynamic client fields
  isOffline?: boolean;
  progress?: TrophyProgress | null;
}

export interface TrophyProgress {
  id?: string;
  book_id: string;
  user_id?: string | null;
  last_page: number;
  total_pages: number;
  percent_read: number;
  current_cfi?: string | null;
  completed: boolean;
  last_read_at: string;
  reading_time_seconds?: number;
}

export type GroupByMode =
  | 'series'
  | 'collection'
  | 'medium'
  | 'publisher'
  | 'franchise'
  | 'author';

export interface SeriesGroup {
  seriesName: string;
  books: TrophyBook[];
  totalIssues: number;
  completedIssues: number;
  coverUrl?: string | null;
  coverBlob?: Blob | null;
  formats: BookFormat[];
  lastReadAt: number;
  medium?: BookMedium | string;
  publisher?: string | null;
  franchise?: string | null;
  groupByType?: GroupByMode;
  stackBadge?: string;
}

export interface ReaderSettings {
  readingDirection: ReadingDirection;
  dualPageLandscape: boolean;
  fitMode: 'contain' | 'width' | 'height';
  amberFilterPercent: number; // 0 to 100
  fontSize: number; // For EPUB (e.g. 100%)
  zoomLevel: number; // For Comic/PDF (e.g. 100%)
  theme?: 'light' | 'sepia' | 'dark' | 'black';
  epubTheme?: 'light' | 'sepia' | 'dark' | 'black';
  fontFamily?: 'serif' | 'sans' | 'mono';
}

export interface IngestionProgressState {
  isIngesting: boolean;
  currentFileIndex: number;
  totalFiles: number;
  currentFileName: string;
  statusMessage?: string;
}
