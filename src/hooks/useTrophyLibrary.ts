'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { trophyDb } from '@/lib/trophy/db';
import { saveBookToOpfs, getBookFromOpfs, isBookInOpfs, deleteBookFromOpfs } from '@/lib/trophy/opfs';
import { extractBookInfo, detectFormat } from '@/lib/trophy/metadataExtractor';
import { getPresignedUploadUrl, getPresignedDownloadUrl } from '@/lib/trophy/s3';
import {
  TrophyBook,
  TrophyProgress,
  SeriesGroup,
  FilterCategory,
  SortOption,
  IngestionProgressState,
  ReaderSettings,
} from '@/types/trophy';

export function useTrophyLibrary(user: any) {
  const [books, setBooks] = useState<TrophyBook[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, TrophyProgress>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [sortOption, setSortOption] = useState<SortOption>('recently-read');
  const [searchQuery, setSearchQuery] = useState('');
  const [ingestionProgress, setIngestionProgress] = useState<IngestionProgressState | null>(null);

  // Reader Settings State
  const [settings, setSettings] = useState<ReaderSettings>({
    readingDirection: 'ltr',
    dualPageLandscape: false,
    fitMode: 'contain',
    amberFilterPercent: 0,
    fontSize: 100,
    fontFamily: 'serif',
    epubTheme: 'sepia',
    zoomLevel: 100,
  });

  // Load Settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rww_trophy_settings');
      if (saved) {
        setSettings((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (e) {}
  }, []);

  const updateSettings = useCallback((newSettings: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('rww_trophy_settings', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // 1. Fetch Books and Reading Progress from Supabase
  const loadLibrary = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();

      // Fetch All Books via Pagination
      let booksData: any[] = [];
      let bookFrom = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('trophy_books')
          .select('*')
          .range(bookFrom, bookFrom + pageSize - 1)
          .order('series', { ascending: true })
          .order('issue_number', { ascending: true });

        if (error || !data || data.length === 0) break;
        booksData = booksData.concat(data);
        if (data.length < pageSize) break;
        bookFrom += pageSize;
      }

      // Fetch All Progress via Pagination
      let progressData: any[] = [];
      let progFrom = 0;
      while (true) {
        const { data, error } = await supabase
          .from('trophy_progress')
          .select('*')
          .range(progFrom, progFrom + pageSize - 1);

        if (error || !data || data.length === 0) break;
        progressData = progressData.concat(data);
        if (data.length < pageSize) break;
        progFrom += pageSize;
      }

      const progMap = new Map<string, TrophyProgress>();
      if (progressData) {
        progressData.forEach((p: TrophyProgress) => {
          progMap.set(p.book_id, p);
        });
      }
      setProgressMap(progMap);

      if (booksData && booksData.length > 0) {
        // Check offline status for each book
        const hydrated: TrophyBook[] = await Promise.all(
          booksData.map(async (book: any) => {
            const isOffline = await isBookInOpfs(book.id);
            const prog = progMap.get(book.id) || null;
            return {
              ...book,
              isOffline,
              progress: prog,
            };
          })
        );
        setBooks(hydrated);
      }
    } catch (err) {
      console.error('[Trophy Library] Error loading library:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  // 2. Ingest New Book / Comic into Cloudflare R2 + Supabase + OPFS
  const ingestFiles = async (files: FileList | File[]) => {
    if (!user) return;
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const format = detectFormat(file.name);

      setIngestionProgress({
        isIngesting: true,
        currentFileIndex: i + 1,
        totalFiles: fileArray.length,
        currentFileName: file.name,
        statusMessage: `Extracting cover and metadata (${i + 1}/${fileArray.length})...`,
      });

      try {
        // Step A: Extract cover & metadata in browser
        const extracted = await extractBookInfo(file);

        // Step B: Get presigned upload URL for the main file
        setIngestionProgress((prev: any) => prev ? { ...prev, statusMessage: `Uploading ${file.name} to Cloudflare R2...` } : null);
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileKey = `books/${format}/${cleanFileName}`;
        const contentType = file.type || 'application/octet-stream';
        const uploadUrl = await getPresignedUploadUrl(fileKey, contentType, 3600);

        // Step C: Upload directly to Cloudflare R2
        await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': contentType },
          body: file,
        });

        // Step D: If cover was extracted, upload cover to R2
        let coverKey: string | null = null;
        let coverUrl: string | null = null;
        if (extracted.coverBlob) {
          try {
            coverKey = `covers/${cleanFileName}.jpg`;
            const coverUploadUrl = await getPresignedUploadUrl(coverKey, 'image/jpeg', 3600);
            await fetch(coverUploadUrl, {
              method: 'PUT',
              headers: { 'Content-Type': 'image/jpeg' },
              body: extracted.coverBlob,
            });

            // Generate direct stream URL for cover
            coverUrl = await getPresignedDownloadUrl(coverKey, 86400 * 7);
          } catch (e) {
            console.warn('Cover upload to R2 warning:', e);
          }
        }

        // Step E: Insert into Supabase trophy_books
        setIngestionProgress((prev: any) => prev ? { ...prev, statusMessage: `Indexing in Supabase catalog...` } : null);
        const supabase = createClient();
        const newBookRecord = {
          user_id: user.id,
          title: extracted.title,
          series: extracted.series,
          issue_number: extracted.issueNumber,
          format,
          file_key: fileKey,
          file_size: file.size,
          cover_key: coverKey,
          cover_url: coverUrl,
          author: extracted.author || null,
          description: extracted.description || null,
          reading_direction: extracted.readingDirection || 'ltr',
          page_count: extracted.pageCount || 1,
          tags: [format.toUpperCase(), extracted.series !== 'Standalone' ? 'Series' : 'Single'],
        };

        const { data: inserted, error: insertError } = await supabase
          .from('trophy_books')
          .insert(newBookRecord)
          .select()
          .single();

        if (insertError) throw insertError;

        // Step F: Save copy into local OPFS for offline reading
        if (inserted?.id) {
          await saveBookToOpfs(inserted.id, file);
        }
      } catch (err: any) {
        console.error(`Error ingesting ${file.name}:`, err);
      }
    }

    setIngestionProgress(null);
    await loadLibrary();
  };

  // 3. Update Reading Progress (Bookmarks & Last Read)
  const updateProgress = useCallback(async (
    bookId: string,
    lastPage: number,
    totalPages: number,
    currentCfi?: string | null
  ) => {
    if (!user) return;
    const percentRead = totalPages > 0 ? Math.min(100, Math.round((lastPage / totalPages) * 100)) : 0;
    const isCompleted = percentRead >= 98;
    const nowIso = new Date().toISOString();

    const progData: TrophyProgress = {
      book_id: bookId,
      user_id: user.id,
      last_page: lastPage,
      total_pages: totalPages,
      percent_read: percentRead,
      current_cfi: currentCfi || null,
      completed: isCompleted,
      last_read_at: nowIso,
    };

    // Optimistic UI update
    setProgressMap((prev) => {
      const next = new Map(prev);
      next.set(bookId, progData);
      return next;
    });
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, progress: progData } : b))
    );

    // Save to Supabase
    try {
      const supabase = createClient();
      await supabase.from('trophy_progress').upsert(progData, {
        onConflict: 'book_id,user_id',
      });
    } catch (err) {
      console.warn('Error saving reading progress to cloud:', err);
    }
  }, [user]);

  // 4. Toggle Offline Download in OPFS
  const toggleOffline = async (book: TrophyBook): Promise<boolean> => {
    const isCurrentlyOffline = await isBookInOpfs(book.id);

    if (isCurrentlyOffline) {
      await deleteBookFromOpfs(book.id);
      setBooks((prev) =>
        prev.map((b) => (b.id === book.id ? { ...b, isOffline: false } : b))
      );
      return false;
    } else {
      // Stream from R2 to store in OPFS
      try {
        let streamUrl: string | null = null;
        try {
          streamUrl = await getPresignedDownloadUrl(book.file_key, 86400);
        } catch (s3Err) {
          const streamRes = await fetch('/api/trophy/stream-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileKey: book.file_key }),
          });
          const streamData = await streamRes.json();
          streamUrl = streamData.streamUrl;
        }

        if (!streamUrl) throw new Error('Could not obtain download stream URL');

        const fileRes = await fetch(streamUrl);
        const blob = await fileRes.blob();
        await saveBookToOpfs(book.id, blob);

        setBooks((prev) =>
          prev.map((b) => (b.id === book.id ? { ...b, isOffline: true } : b))
        );
        return true;
      } catch (err) {
        console.error('Failed to download book for offline:', err);
        return false;
      }
    }
  };

  // 5. Update Book Metadata with Optimistic UI updates
  const updateBookMetadata = async (
    bookId: string,
    updates: Partial<TrophyBook>,
    applyToEntireSeries: boolean = false
  ) => {
    if (!user) return;
    const currentBook = books.find((b) => b.id === bookId);
    if (!currentBook) return;

    // Optimistic UI update for instant shelf responsiveness
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === bookId) {
          return { ...b, ...updates };
        }
        if (applyToEntireSeries && updates.series && b.series === currentBook.series) {
          return {
            ...b,
            series: updates.series,
            ...(updates.author ? { author: updates.author } : {}),
          };
        }
        return b;
      })
    );

    // Save changes to Supabase
    try {
      const supabase = createClient();
      const dbPayload: any = {};
      if (updates.title !== undefined) dbPayload.title = updates.title;
      if (updates.series !== undefined) dbPayload.series = updates.series;
      if (updates.issue_number !== undefined) dbPayload.issue_number = updates.issue_number;
      if (updates.author !== undefined) dbPayload.author = updates.author;
      if (updates.description !== undefined) dbPayload.description = updates.description;
      if (updates.reading_direction !== undefined) dbPayload.reading_direction = updates.reading_direction;
      if (updates.page_count !== undefined) dbPayload.page_count = updates.page_count;
      if (updates.cover_url !== undefined) dbPayload.cover_url = updates.cover_url;
      if (updates.medium !== undefined) dbPayload.medium = updates.medium;
      if (updates.genres !== undefined) dbPayload.genres = updates.genres;
      if (updates.volume_number !== undefined) dbPayload.volume_number = updates.volume_number;
      if (updates.franchise !== undefined) dbPayload.franchise = updates.franchise;
      if (updates.illustrator !== undefined) dbPayload.illustrator = updates.illustrator;
      if (updates.publisher !== undefined) dbPayload.publisher = updates.publisher;
      if (updates.published_year !== undefined) dbPayload.published_year = updates.published_year;
      if (updates.isbn !== undefined) dbPayload.isbn = updates.isbn;
      if (updates.is_favorite !== undefined) dbPayload.is_favorite = updates.is_favorite;
      if (updates.rating !== undefined) dbPayload.rating = updates.rating;
      if (updates.story_arc !== undefined) dbPayload.story_arc = updates.story_arc;
      if (updates.collections !== undefined) dbPayload.collections = updates.collections;
      if (updates.aspect_ratio !== undefined) dbPayload.aspect_ratio = updates.aspect_ratio;

      if (applyToEntireSeries && updates.series && currentBook.series) {
        await supabase
          .from('trophy_books')
          .update({
            series: updates.series,
            ...(updates.author ? { author: updates.author } : {}),
            ...(updates.publisher ? { publisher: updates.publisher } : {}),
            ...(updates.franchise ? { franchise: updates.franchise } : {}),
            ...(updates.medium ? { medium: updates.medium } : {}),
          })
          .eq('series', currentBook.series);
      }

      const { error: updateErr } = await supabase
        .from('trophy_books')
        .update(dbPayload)
        .eq('id', bookId);

      if (updateErr) throw updateErr;
    } catch (err) {
      console.error('Failed to save metadata updates to Supabase:', err);
      // Rollback on network failure
      await loadLibrary();
    }
  };

  // 6. Delete Book
  const deleteBook = async (book: TrophyBook) => {
    if (!user) return;
    const confirm = window.confirm(`Delete "${book.title}" from The Trophy Room?`);
    if (!confirm) return;

    try {
      const supabase = createClient();
      await supabase.from('trophy_books').delete().eq('id', book.id);
      await deleteBookFromOpfs(book.id);
      setBooks((prev) => prev.filter((b) => b.id !== book.id));
    } catch (err) {
      console.error('Error deleting book:', err);
    }
  };

  // 7. Filtered and Sorted Books
  const filteredBooks = useMemo(() => {
    return books
      .filter((book) => {
        // Medium & Category Filter
        if (filter === 'comic') {
          const isComic = book.medium === 'comic' || book.format === 'cbz' || (book.tags || []).includes('comic');
          if (!isComic) return false;
        }
        if (filter === 'manga') {
          const isManga = book.medium === 'manga' || (book.tags || []).includes('manga');
          if (!isManga) return false;
        }
        if (filter === 'cookbook') {
          const isCookbook = book.medium === 'cookbook' || (book.tags || []).includes('cookbook');
          if (!isCookbook) return false;
        }
        if (filter === 'reference') {
          const isRef = book.medium === 'reference' || (book.tags || []).includes('reference');
          if (!isRef) return false;
        }
        if (filter === 'wellness') {
          const isWellness = book.medium === 'wellness' || (book.tags || []).includes('wellness');
          if (!isWellness) return false;
        }
        if (filter === 'magazine') {
          const isMag = book.medium === 'magazine' || (book.tags || []).includes('magazine');
          if (!isMag) return false;
        }
        if (filter === 'favorites' && !book.is_favorite) return false;

        // Raw Format Filter
        if (filter === 'cbz' && book.format !== 'cbz') return false;
        if (filter === 'epub' && book.format !== 'epub') return false;
        if (filter === 'pdf' && book.format !== 'pdf') return false;
        if (filter === 'offline' && !book.isOffline) return false;
        if (filter === 'in-progress' && (!book.progress || book.progress.completed || book.progress.percent_read === 0)) return false;
        if (filter === 'completed' && !book.progress?.completed) return false;

        // Search Filter
        if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = String(book.title || '').toLowerCase().includes(q);
          const matchSeries = String(book.series || '').toLowerCase().includes(q);
          const matchAuthor = String(book.author || '').toLowerCase().includes(q);
          const matchPublisher = String(book.publisher || '').toLowerCase().includes(q);
          const matchFranchise = String(book.franchise || '').toLowerCase().includes(q);
          const matchTags = Array.isArray(book.tags)
            ? book.tags.some((t) => typeof t === 'string' && t.toLowerCase().includes(q))
            : false;
          return matchTitle || matchSeries || matchAuthor || matchPublisher || matchFranchise || matchTags;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'recently-read') {
          const aTime = a.progress?.last_read_at ? new Date(a.progress.last_read_at).getTime() : 0;
          const bTime = b.progress?.last_read_at ? new Date(b.progress.last_read_at).getTime() : 0;
          return bTime - aTime;
        }
        if (sortOption === 'title-asc') return String(a.title || '').localeCompare(String(b.title || ''));
        if (sortOption === 'progress-desc') {
          const aP = a.progress?.percent_read || 0;
          const bP = b.progress?.percent_read || 0;
          return bP - aP;
        }
        if (sortOption === 'issue-asc') return (Number(a.issue_number) || 1) - (Number(b.issue_number) || 1);
        // default: series-asc
        const seriesCompare = String(a.series || '').localeCompare(String(b.series || ''));
        if (seriesCompare !== 0) return seriesCompare;
        return (Number(a.issue_number) || 1) - (Number(b.issue_number) || 1);
      });
  }, [books, filter, searchQuery, sortOption]);

  // 7. Group Filtered Books into Series Stacks
  const seriesGroups = useMemo<SeriesGroup[]>(() => {
    const groupMap = new Map<string, TrophyBook[]>();

    filteredBooks.forEach((book) => {
      const sName = (book.series && typeof book.series === 'string' ? book.series.trim() : '') || 'Standalone';
      if (!groupMap.has(sName)) {
        groupMap.set(sName, []);
      }
      groupMap.get(sName)!.push(book);
    });

    const groups: SeriesGroup[] = [];

    groupMap.forEach((sBooks, seriesName) => {
      // Sort issues ascending
      sBooks.sort((a, b) => (Number(a.issue_number) || 1) - (Number(b.issue_number) || 1));
      const totalIssues = sBooks.length;
      const completedIssues = sBooks.filter((b) => b.progress?.completed).length;

      // Primary cover from issue 1 or first available that has cover_url
      const coverBook = sBooks.find((b) => b.cover_url) || sBooks[0];
      const formats = Array.from(new Set(sBooks.map((b) => b.format)));

      // Find latest read time
      let lastReadAt = 0;
      sBooks.forEach((b) => {
        if (b.progress?.last_read_at) {
          const t = new Date(b.progress.last_read_at).getTime();
          if (t > lastReadAt) lastReadAt = t;
        }
      });

      groups.push({
        seriesName,
        books: sBooks,
        totalIssues,
        completedIssues,
        coverUrl: coverBook?.cover_url || null,
        formats,
        lastReadAt,
        medium: sBooks[0]?.medium,
        publisher: sBooks[0]?.publisher,
        franchise: sBooks[0]?.franchise,
      });
    });

    // Sort series groups
    return groups.sort((a, b) => {
      if (sortOption === 'recently-read') return b.lastReadAt - a.lastReadAt;
      if (sortOption === 'series-asc') return String(a.seriesName || '').localeCompare(String(b.seriesName || ''));
      if (sortOption === 'title-asc') return String(a.seriesName || '').localeCompare(String(b.seriesName || ''));
      return String(a.seriesName || '').localeCompare(String(b.seriesName || ''));
    });
  }, [filteredBooks, sortOption]);

  return {
    books,
    filteredBooks,
    seriesGroups,
    isLoading,
    filter,
    setFilter,
    sortOption,
    setSortOption,
    searchQuery,
    setSearchQuery,
    ingestionProgress,
    settings,
    updateSettings,
    ingestFiles,
    updateProgress,
    updateBookMetadata,
    toggleOffline,
    deleteBook,
    loadLibrary,
  };
}
