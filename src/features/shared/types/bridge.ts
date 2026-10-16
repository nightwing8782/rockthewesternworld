export type SeedSourceField = 'working_thought' | 'bright_spot' | 'calibration';

export interface EssaySeedPayload {
  text: string;
  sourceDateKey: string;
  sourceField: SeedSourceField;
}

export interface ReadingDeckItem {
  bookId: string;
  title: string;
  series?: string;
  issueNumber?: number;
  format: 'cbz' | 'epub' | 'pdf';
  currentPage: number;
  totalPages: number;
  progressPercent: number;
  coverUrl?: string | null;
  lastReadAt?: string;
}

export interface ReviewBridgePayload {
  entryType: 'book_review' | 'comic_review';
  selectedDesk: 'gallery' | 'logbook';
  selectedCategory: string;
  title: string;
  metadata: Record<string, any>;
}
