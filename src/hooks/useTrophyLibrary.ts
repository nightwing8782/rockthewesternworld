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

      // Fetch Books (Increase limit to handle full library)
      const { data: booksData, error: booksError } = await supabase
        .from('trophy_books')
        .select('*')
        .limit(10000)
        .order('series', { ascending: true })
        .order('issue_number', { ascending: true });

      // Fetch Progress
      const { data: progressData } = await supabase
        .from('trophy_progress')
        .select('*')
        .limit(10000);

      const progMap = new Map<string, TrophyProgress>();
      if (progressData) {
        progressData.forEach((p: TrophyProgress) => {
          progMap.set(p.book_id, p);
        });
      }
      setProgressMap(progMap);

      if (!booksError && booksData) {
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
        setIngestionProgress((prev) => prev ? { ...prev, statusMessage: `Uploading ${file.name} to Cloudflare R2...` } : null);
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
        setIngestionProgress((prev) => prev ? { ...prev, statusMessage: `Indexing in Supabase catalog...` } : null);
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

  // 5. Delete Book
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

  // 6. Filtered and Sorted Books
  const filteredBooks = useMemo(() => {
    return books
      .filter((book) => {
        // Format Filter
        if (filter === 'cbz' && book.format !== 'cbz') return false;
        if (filter === 'epub' && book.format !== 'epub') return false;
        if (filter === 'pdf' && book.format !== 'pdf') return false;
        if (filter === 'offline' && !book.isOffline) return false;
        if (filter === 'in-progress' && (!book.progress || book.progress.completed || book.progress.percent_read === 0)) return false;
        if (filter === 'completed' && !book.progress?.completed) return false;

        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (book.title || '').toLowerCase().includes(q);
          const matchSeries = (book.series || '').toLowerCase().includes(q);
          const matchAuthor = (book.author || '').toLowerCase().includes(q);
          const matchTags = (book.tags || []).some((t) => t.toLowerCase().includes(q));
          return matchTitle || matchSeries || matchAuthor || matchTags;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'recently-read') {
          const aTime = a.progress?.last_read_at ? new Date(a.progress.last_read_at).getTime() : 0;
          const bTime = b.progress?.last_read_at ? new Date(b.progress.last_read_at).getTime() : 0;
          return bTime - aTime;
        }
        if (sortOption === 'title-asc') return (a.title || '').localeCompare(b.title || '');
        if (sortOption === 'progress-desc') {
          const aP = a.progress?.percent_read || 0;
          const bP = b.progress?.percent_read || 0;
          return bP - aP;
        }
        if (sortOption === 'issue-asc') return (a.issue_number || 1) - (b.issue_number || 1);
        // default: series-asc
        const seriesCompare = (a.series || '').localeCompare(b.series || '');
        if (seriesCompare !== 0) return seriesCompare;
        return (a.issue_number || 1) - (b.issue_number || 1);
      });
  }, [books, filter, searchQuery, sortOption]);

  // 7. Group Filtered Books into Series Stacks
  const seriesGroups = useMemo<SeriesGroup[]>(() => {
    const groupMap = new Map<string, TrophyBook[]>();

    filteredBooks.forEach((book) => {
      const sName = book.series?.trim() || 'Standalone';
      if (!groupMap.has(sName)) {
        groupMap.set(sName, []);
      }
      groupMap.get(sName)!.push(book);
    });

    const groups: SeriesGroup[] = [];

    groupMap.forEach((sBooks, seriesName) => {
      // Sort issues ascending
      sBooks.sort((a, b) => (a.issue_number || 1) - (b.issue_number || 1));
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
      });
    });

    // Sort series groups
    return groups.sort((a, b) => {
      if (sortOption === 'recently-read') return b.lastReadAt - a.lastReadAt;
      if (sortOption === 'series-asc') return a.seriesName.localeCompare(b.seriesName);
      if (sortOption === 'title-asc') return a.seriesName.localeCompare(b.seriesName);
      return a.seriesName.localeCompare(b.seriesName);
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
    toggleOffline,
    deleteBook,
    loadLibrary,
  };
}
