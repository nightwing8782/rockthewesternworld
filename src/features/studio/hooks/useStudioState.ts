'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Entry,
  EntryType,
  EntryStatus,
  EntryMetadata,
  DeskType,
  SubCategory,
  EDITORIAL_DESKS,
} from '@/types/database';

function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function safeTimestamp(dateStr?: string | null): number {
  if (!dateStr) return 0;
  try {
    const d = new Date(dateStr);
    const t = d.getTime();
    return isNaN(t) ? 0 : t;
  } catch {
    return 0;
  }
}

export interface UseStudioStateProps {
  userId: string | null;
}

export function useStudioState({ userId }: UseStudioStateProps) {
  // Archive Lists
  const [draftEntries, setDraftEntries] = useState<Entry[]>([]);
  const [publishedEntries, setPublishedEntries] = useState<Entry[]>([]);
  const [editorialTab, setEditorialTab] = useState<'drafts' | 'published' | 'all'>('drafts');
  const [searchFilter, setSearchFilter] = useState('');

  // Active Document State
  const [activeEntry, setActiveEntry] = useState<Entry | null>(null);
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [entryType, setEntryType] = useState<EntryType>('essay');
  const [entryStatus, setEntryStatus] = useState<EntryStatus>('draft');
  const [selectedDesk, setSelectedDesk] = useState<DeskType>('commonwealth');
  const [selectedCategory, setSelectedCategory] = useState<SubCategory>('Dan Reads the News');
  const [metadata, setMetadata] = useState<EntryMetadata>({});
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Modals State
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  // State synchronization ref for flushDraft and auto-save
  const stateRef = useRef({
    activeEntry,
    title,
    contentHtml,
    metadata,
    entryType,
    entryStatus,
    selectedDesk,
    selectedCategory,
    saveStatus,
    userId,
  });

  useEffect(() => {
    stateRef.current = {
      activeEntry,
      title,
      contentHtml,
      metadata,
      entryType,
      entryStatus,
      selectedDesk,
      selectedCategory,
      saveStatus,
      userId,
    };
  }, [
    activeEntry,
    title,
    contentHtml,
    metadata,
    entryType,
    entryStatus,
    selectedDesk,
    selectedCategory,
    saveStatus,
    userId,
  ]);

  // Synchronous Flush Draft helper
  const flushDraft = useCallback(() => {
    const cur = stateRef.current;
    if (!cur.activeEntry || cur.saveStatus !== 'unsaved') return;

    const mergedMeta: EntryMetadata = {
      ...cur.metadata,
      desk: cur.selectedDesk,
      category: cur.selectedCategory,
      isPrivate: false,
    };

    const finalTitle = cur.title.trim() || 'Untitled Entry';
    const validId = isValidUUID(cur.activeEntry.id) ? cur.activeEntry.id : generateUUID();
    const cleanUserId = isValidUUID(cur.userId) ? (cur.userId as string) : (isValidUUID(cur.activeEntry.user_id) ? cur.activeEntry.user_id : '');
    const entrySlug = cur.activeEntry.slug && !cur.activeEntry.slug.startsWith('entry-')
      ? cur.activeEntry.slug
      : (finalTitle
          ? `${finalTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${validId.slice(0, 8)}`
          : `entry-${validId.slice(0, 8)}`);

    const updated: Entry = {
      ...cur.activeEntry,
      id: validId,
      user_id: cleanUserId,
      title: finalTitle,
      slug: entrySlug,
      body_html: cur.contentHtml,
      entry_type: cur.entryType,
      status: cur.entryStatus,
      metadata: mergedMeta,
      updated_at: new Date().toISOString(),
    };

    // Save to LocalStorage cache immediately
    try {
      const savedLocal = localStorage.getItem('rww_local_entries');
      let parsed: Entry[] = savedLocal ? JSON.parse(savedLocal) : [];
      const idx = parsed.findIndex((e) => e.id === updated.id);
      if (idx >= 0) {
        parsed[idx] = updated;
      } else {
        parsed = [updated, ...parsed];
      }
      localStorage.setItem('rww_local_entries', JSON.stringify(parsed));
    } catch {}

    // Async Supabase sync
    try {
      const supabase = createClient();
      const payload: any = {
        id: updated.id,
        title: updated.title,
        slug: updated.slug,
        entry_type: updated.entry_type,
        status: updated.status,
        body_html: updated.body_html,
        metadata: updated.metadata,
        published_at: updated.status === 'published' ? (updated.published_at || new Date().toISOString()) : null,
        updated_at: updated.updated_at,
        created_at: updated.created_at || new Date().toISOString(),
      };
      if (cleanUserId) payload.user_id = cleanUserId;
      supabase.from('entries').upsert(payload, { onConflict: 'id' }).then(() => {});
    } catch {}
  }, []);

  // Save current draft
  const saveCurrentDraft = useCallback(
    async (overrides?: Partial<EntryMetadata>) => {
      if (!activeEntry) return;

      setSaveStatus('saving');

      const mergedMeta: EntryMetadata = {
        ...metadata,
        ...(overrides || {}),
        desk: selectedDesk,
        category: selectedCategory,
        isPrivate: false,
      };

      const finalTitle = title.trim() || activeEntry.title || 'Untitled Entry';
      const validId = isValidUUID(activeEntry.id) ? activeEntry.id : generateUUID();
      const cleanUserId = isValidUUID(userId) ? (userId as string) : (isValidUUID(activeEntry.user_id) ? activeEntry.user_id : '');
      const entrySlug = activeEntry.slug && !activeEntry.slug.startsWith('entry-')
        ? activeEntry.slug
        : (finalTitle
            ? `${finalTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${validId.slice(0, 8)}`
            : `entry-${validId.slice(0, 8)}`);

      const updated: Entry = {
        ...activeEntry,
        id: validId,
        user_id: cleanUserId,
        title: finalTitle,
        slug: entrySlug,
        body_html: contentHtml,
        entry_type: entryType,
        status: entryStatus,
        metadata: mergedMeta,
        updated_at: new Date().toISOString(),
      };

      setActiveEntry(updated);
      setMetadata(mergedMeta);
      if (!title.trim()) {
        setTitle(finalTitle);
      }

      // Save to Supabase Cloud
      try {
        const supabase = createClient();
        const payload: any = {
          id: updated.id,
          title: updated.title,
          slug: updated.slug,
          entry_type: updated.entry_type,
          status: updated.status,
          body_html: updated.body_html,
          metadata: updated.metadata,
          published_at: updated.status === 'published' ? (updated.published_at || new Date().toISOString()) : null,
          updated_at: updated.updated_at,
          created_at: updated.created_at || new Date().toISOString(),
        };
        if (cleanUserId) payload.user_id = cleanUserId;

        const { error: upsertError } = await supabase.from('entries').upsert(payload, { onConflict: 'id' });
        if (upsertError) {
          console.error('Supabase save error:', upsertError);
        }
      } catch (e) {
        console.error('Failed to sync entry to Supabase:', e);
      }

      // Update state lists
      if (updated.status === 'published') {
        setPublishedEntries((prev) => [updated, ...prev.filter((e) => e.id !== updated.id && e.slug !== updated.slug)]);
        setDraftEntries((prev) => prev.filter((e) => e.id !== updated.id));
      } else {
        setDraftEntries((prev) => [updated, ...prev.filter((e) => e.id !== updated.id)]);
        setPublishedEntries((prev) => prev.filter((e) => e.id !== updated.id));
      }

      // Save to LocalStorage cache
      try {
        const savedLocal = localStorage.getItem('rww_local_entries');
        let parsed: Entry[] = savedLocal ? JSON.parse(savedLocal) : [];
        const idx = parsed.findIndex((e) => e.id === updated.id);
        if (idx >= 0) {
          parsed[idx] = updated;
        } else {
          parsed = [updated, ...parsed];
        }
        localStorage.setItem('rww_local_entries', JSON.stringify(parsed));
      } catch {}

      setTimeout(() => setSaveStatus('saved'), 350);
    },
    [activeEntry, contentHtml, entryStatus, entryType, metadata, selectedCategory, selectedDesk, title, userId]
  );

  // Debounced Auto-Save (1500ms)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedSnapshotRef = useRef<string>('');

  useEffect(() => {
    if (!activeEntry || !userId) return;

    const currentSnapshot = JSON.stringify({
      id: activeEntry.id,
      title,
      contentHtml,
      metadata,
      entryType,
      entryStatus,
      selectedDesk,
      selectedCategory,
    });

    if (lastSavedSnapshotRef.current === '') {
      lastSavedSnapshotRef.current = currentSnapshot;
      return;
    }

    if (currentSnapshot === lastSavedSnapshotRef.current) {
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setSaveStatus('unsaved');

    try {
      localStorage.setItem(`rww_snapshot_${activeEntry.id}`, currentSnapshot);
    } catch {}

    autoSaveTimerRef.current = setTimeout(() => {
      saveCurrentDraft();
      lastSavedSnapshotRef.current = currentSnapshot;
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [activeEntry?.id, title, contentHtml, metadata, entryType, entryStatus, selectedDesk, selectedCategory, userId, saveCurrentDraft]);

  // Select an entry from list
  const selectEntry = useCallback(
    (entry: Entry) => {
      flushDraft();
      setActiveEntry(entry);
      setTitle(entry.title || '');
      setContentHtml(entry.body_html || '');
      setEntryType(entry.entry_type || 'essay');
      setEntryStatus(entry.status || 'draft');
      const desk = entry.metadata?.desk || 'commonwealth';
      const cat = (entry.metadata?.category as SubCategory) || 'Dan Reads the News';
      setSelectedDesk(desk);
      setSelectedCategory(cat);
      setMetadata(entry.metadata || { desk, category: cat, isPrivate: false });
      setSaveStatus('saved');
    },
    [flushDraft]
  );

  // Create fresh document
  const createNewDocument = useCallback(
    (type: EntryType = 'essay') => {
      flushDraft();

      const freshMetadata: EntryMetadata = {
        desk: 'commonwealth',
        category: 'Dan Reads the News',
        isPrivate: false,
      };

      const newDoc: Entry = {
        id: generateUUID(),
        user_id: isValidUUID(userId) ? (userId as string) : '',
        entry_type: type,
        status: 'draft',
        title: '',
        slug: null,
        body_json: null,
        body_html: '',
        metadata: freshMetadata,
        published_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setActiveEntry(newDoc);
      setTitle('');
      setContentHtml('');
      setEntryType(type);
      setEntryStatus('draft');
      setSelectedDesk('commonwealth');
      setSelectedCategory('Dan Reads the News');
      setMetadata(freshMetadata);
      setDraftEntries((prev) => [newDoc, ...prev]);
      setEditorialTab('drafts');
      setSaveStatus('unsaved');
    },
    [flushDraft, userId]
  );

  // Load drafts and published entries from cache and Cloud
  useEffect(() => {
    if (!userId) return;

    // Load Local Cache
    const savedLocal = localStorage.getItem('rww_local_entries');
    let parsedLocal: Entry[] = [];
    if (savedLocal) {
      try {
        const rawLocal: any[] = JSON.parse(savedLocal);
        parsedLocal = rawLocal
          .filter((item) => item.status !== 'private_log' && item.status !== 'private' && !item.metadata?.isPrivate)
          .map((item) => ({
            ...item,
            id: isValidUUID(item.id) ? item.id : generateUUID(),
            status: item.status || 'draft',
            entry_type: item.entry_type || 'essay',
            slug: item.slug || `entry-${item.id.slice(0, 8)}`,
            metadata: { ...(item.metadata || {}), isPrivate: false },
          }));
        setDraftEntries(parsedLocal.filter((e) => e.status === 'draft'));
        setPublishedEntries(parsedLocal.filter((e) => e.status === 'published'));
        if (parsedLocal.length > 0) {
          selectEntry(parsedLocal[0]);
        } else {
          createNewDocument('essay');
        }
      } catch {}
    } else {
      createNewDocument('essay');
    }

    // Fetch cloud sync
    const supabase = createClient();
    supabase
      .from('entries')
      .select('*')
      .neq('status', 'private_log')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          const cloudDrafts = data.filter((e: any) => e.status === 'draft').map((item: any) => ({
            ...item,
            metadata: { ...(item.metadata || {}), isPrivate: false },
          }));
          const cloudPublished = data.filter((e: any) => e.status === 'published').map((item: any) => ({
            ...item,
            metadata: { ...(item.metadata || {}), isPrivate: false },
          }));

          setDraftEntries(cloudDrafts);
          setPublishedEntries(cloudPublished);

          if (!activeEntry || !activeEntry.id) {
            if (cloudDrafts.length > 0) selectEntry(cloudDrafts[0]);
            else if (cloudPublished.length > 0) selectEntry(cloudPublished[0]);
          }
        }
      });
  }, [userId]);

  const handleDeskChange = useCallback((deskId: DeskType) => {
    setSelectedDesk(deskId);
    const desk = EDITORIAL_DESKS.find((d) => d.id === deskId);
    if (desk && desk.categories.length > 0) {
      setSelectedCategory(desk.categories[0]);
      setMetadata((prev) => ({ ...prev, desk: deskId, category: desk.categories[0] }));
    }
  }, []);

  const handleTypeChange = useCallback((newType: EntryType) => {
    setEntryType(newType);
    setSaveStatus('unsaved');
  }, []);

  const handleSetEditorialStatus = useCallback(
    (newStatus: 'draft' | 'published') => {
      if (newStatus === 'published' && entryStatus !== 'published') {
        setIsPromoteOpen(true);
        return;
      }
      setEntryStatus(newStatus);
      setMetadata((prev) => ({ ...prev, isPrivate: false }));
      setSaveStatus('unsaved');
      if (activeEntry) {
        setActiveEntry((prev) =>
          prev ? { ...prev, status: newStatus, metadata: { ...prev.metadata, isPrivate: false } } : null
        );
      }
    },
    [activeEntry, entryStatus]
  );

  const handleUnpublishToDraft = useCallback(async () => {
    if (!activeEntry) return;
    const confirm = window.confirm(
      `Unpublish "${activeEntry.title || 'Untitled'}"?\n\nThis will remove it from the public broadsheet and move it to your private Drafts.`
    );
    if (!confirm) return;

    setSaveStatus('saving');

    const updated: Entry = {
      ...activeEntry,
      status: 'draft',
      metadata: { ...metadata, isPrivate: false },
      updated_at: new Date().toISOString(),
    };

    setActiveEntry(updated);
    setEntryStatus('draft');

    try {
      const supabase = createClient();
      await supabase
        .from('entries')
        .update({ status: 'draft', updated_at: updated.updated_at })
        .match({ id: activeEntry.id });
    } catch {}

    setPublishedEntries((prev) => prev.filter((p) => p.id !== activeEntry.id && p.slug !== activeEntry.slug));
    setDraftEntries((prev) => [updated, ...prev.filter((d) => d.id !== activeEntry.id)]);

    try {
      const savedLocal = localStorage.getItem('rww_local_entries');
      let parsed: Entry[] = savedLocal ? JSON.parse(savedLocal) : [];
      parsed = [updated, ...parsed.filter((p) => p.id !== activeEntry.id)];
      localStorage.setItem('rww_local_entries', JSON.stringify(parsed));
    } catch {}

    setEditorialTab('drafts');
    setSaveStatus('saved');
  }, [activeEntry, metadata]);

  const handleDeleteEntry = useCallback(
    async (entryToDelete: Entry) => {
      const isLive = entryToDelete.status === 'published';
      const itemTitle = entryToDelete.title || 'Untitled Draft';

      const promptMessage = isLive
        ? `Permanently delete live published piece "${itemTitle}"?\n\nThis will remove it from the live broadsheet and database.`
        : `Permanently delete draft "${itemTitle}"? This cannot be undone.`;

      const confirmed = window.confirm(promptMessage);
      if (!confirmed) return;

      try {
        const supabase = createClient();
        if (entryToDelete.id && isValidUUID(entryToDelete.id)) {
          await supabase.from('entries').delete().eq('id', entryToDelete.id);
        }
        if (entryToDelete.slug) {
          await supabase.from('entries').delete().eq('slug', entryToDelete.slug);
        }
      } catch {}

      try {
        const savedLocal = localStorage.getItem('rww_local_entries');
        if (savedLocal) {
          const parsed: Entry[] = JSON.parse(savedLocal);
          const filtered = parsed.filter(
            (p) => p.id !== entryToDelete.id && p.slug !== entryToDelete.slug
          );
          localStorage.setItem('rww_local_entries', JSON.stringify(filtered));
        }
      } catch {}

      setDraftEntries((prev) => prev.filter((d) => d.id !== entryToDelete.id && d.slug !== entryToDelete.slug));
      setPublishedEntries((prev) => prev.filter((p) => p.id !== entryToDelete.id && p.slug !== entryToDelete.slug));

      if (activeEntry?.id === entryToDelete.id || activeEntry?.slug === entryToDelete.slug) {
        const remaining = draftEntries.filter((e) => e.id !== entryToDelete.id && e.slug !== entryToDelete.slug);
        if (remaining.length > 0) selectEntry(remaining[0]);
        else createNewDocument('essay');
      }
    },
    [activeEntry?.id, activeEntry?.slug, createNewDocument, draftEntries, selectEntry]
  );

  const handleApplyTemplate = useCallback(
    (templateHtml: string) => {
      if (!contentHtml.trim() || window.confirm('Apply review structure to canvas? (Existing text will remain beneath).')) {
        setContentHtml((prev) => templateHtml + (prev ? `<hr/>` + prev : ''));
        setSaveStatus('unsaved');
      }
    },
    [contentHtml]
  );

  const handlePublishComplete = useCallback((publishedItem: Entry) => {
    setActiveEntry(publishedItem);
    setEntryStatus('published');
    setPublishedEntries((prev) => [publishedItem, ...prev.filter((p) => p.slug !== publishedItem.slug)]);
    setDraftEntries((prev) => prev.filter((d) => d.id !== publishedItem.id));
    setEditorialTab('published');
  }, []);

  return {
    draftEntries,
    setDraftEntries,
    publishedEntries,
    setPublishedEntries,
    editorialTab,
    setEditorialTab,
    searchFilter,
    setSearchFilter,
    activeEntry,
    setActiveEntry,
    title,
    setTitle,
    contentHtml,
    setContentHtml,
    entryType,
    setEntryType,
    entryStatus,
    setEntryStatus,
    selectedDesk,
    setSelectedDesk,
    selectedCategory,
    setSelectedCategory,
    metadata,
    setMetadata,
    saveStatus,
    setSaveStatus,
    isPromoteOpen,
    setIsPromoteOpen,
    isDispatchOpen,
    setIsDispatchOpen,
    isAnalyticsOpen,
    setIsAnalyticsOpen,
    saveCurrentDraft,
    flushDraft,
    selectEntry,
    createNewDocument,
    handleDeleteEntry,
    handleUnpublishToDraft,
    handleDeskChange,
    handleTypeChange,
    handleSetEditorialStatus,
    handleApplyTemplate,
    handlePublishComplete,
  };
}
