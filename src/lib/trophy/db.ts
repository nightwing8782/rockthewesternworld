import Dexie, { type EntityTable } from 'dexie';
import { TrophyBook, TrophyProgress } from '@/types/trophy';

export interface LocalBookCache {
  id: string;
  coverBlob?: Blob | null;
  cachedAt: number;
}

export interface LocalProgressCache extends TrophyProgress {
  syncedToCloud: boolean;
}

export class TrophyRoomDexie extends Dexie {
  bookCache!: EntityTable<LocalBookCache, 'id'>;
  localProgress!: EntityTable<LocalProgressCache, 'book_id'>;

  constructor() {
    super('TrophyRoomDB');
    this.version(1).stores({
      bookCache: 'id, cachedAt',
      localProgress: 'book_id, user_id, last_read_at, syncedToCloud',
    });
  }
}

export const trophyDb = new TrophyRoomDexie();
