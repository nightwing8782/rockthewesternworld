'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Entry, EntryMetadata, EntryStatus } from '@/types/database';
import {
  LedgerHorizon,
  CompassMetadata,
  MonthlyMetadata,
  WeeklyMetadata,
  DailyLedgerMetadata,
} from '@/types/journal';
import {
  formatDateKey,
  formatMonthKey,
  formatWeekKey,
  getAdjacentMonth,
  getAdjacentWeek,
  getDaysInMonth,
  getWeekDates,
  getMonthLabel,
  getWeekLabel,
  aggregateMonthlyHabitHeatmap,
  aggregateMonthlyWins,
  aggregateWeeklyWins,
  getDaySlug,
  getWeekSlug,
  getMonthSlug,
  getCompassSlug,
} from '@/lib/journal/dateMath';

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

export interface UseLedgerStateProps {
  userId: string | null;
}

export function useLedgerState({ userId }: UseLedgerStateProps) {
  const [ledgerHorizon, setLedgerHorizon] = useState<LedgerHorizon>('daily');
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => formatDateKey(new Date()));
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>(() => formatWeekKey(new Date()));
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => formatMonthKey(new Date()));
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());

  const [privateEntries, setPrivateEntries] = useState<Entry[]>([]);
  const [activeEntry, setActiveEntry] = useState<Entry | null>(null);
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [metadata, setMetadata] = useState<EntryMetadata>({});
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [ledgerFeedback, setLedgerFeedback] = useState<string | null>(null);

  // Restore saved horizon preference
  useEffect(() => {
    try {
      const savedHorizon = localStorage.getItem('rww_ledger_horizon') as LedgerHorizon;
      if (savedHorizon && ['daily', 'weekly', 'monthly', 'compass'].includes(savedHorizon)) {
        setLedgerHorizon(savedHorizon);
      }
    } catch {}
  }, []);

  // Synchronization ref for flushDraft and auto-save
  const stateRef = useRef({
    activeEntry,
    title,
    contentHtml,
    metadata,
    saveStatus,
    userId,
    ledgerHorizon,
    selectedDateKey,
    selectedWeekKey,
    selectedMonthKey,
    selectedYear,
  });

  useEffect(() => {
    stateRef.current = {
      activeEntry,
      title,
      contentHtml,
      metadata,
      saveStatus,
      userId,
      ledgerHorizon,
      selectedDateKey,
      selectedWeekKey,
      selectedMonthKey,
      selectedYear,
    };
  }, [
    activeEntry,
    title,
    contentHtml,
    metadata,
    saveStatus,
    userId,
    ledgerHorizon,
    selectedDateKey,
    selectedWeekKey,
    selectedMonthKey,
    selectedYear,
  ]);

  // Synchronous flush draft
  const flushCurrentDraft = useCallback(() => {
    const cur = stateRef.current;
    if (!cur.activeEntry || cur.saveStatus !== 'unsaved') return;

    const mergedMeta: EntryMetadata = {
      ...cur.metadata,
      isPrivate: true,
    };

    const formattedToday = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const defaultTitle = `Daily Ledger · ${formattedToday}`;
    const finalTitle = cur.title.trim() || defaultTitle;
    const validId = isValidUUID(cur.activeEntry.id) ? cur.activeEntry.id : generateUUID();
    const cleanUserId: string = isValidUUID(cur.userId) ? (cur.userId as string) : (isValidUUID(cur.activeEntry.user_id) ? cur.activeEntry.user_id : '');
    const entrySlug = cur.activeEntry.slug || `entry-${validId.slice(0, 8)}`;

    const updated: Entry = {
      ...cur.activeEntry,
      id: validId,
      user_id: cleanUserId,
      title: finalTitle,
      slug: entrySlug,
      body_html: cur.contentHtml,
      entry_type: 'personal_ledger',
      status: 'private',
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
        entry_type: 'thought',
        status: 'private_log',
        body_html: updated.body_html,
        metadata: updated.metadata,
        published_at: null,
        updated_at: updated.updated_at,
        created_at: updated.created_at || new Date().toISOString(),
      };
      if (cleanUserId) payload.user_id = cleanUserId;
      supabase.from('entries').upsert(payload, { onConflict: 'id' }).then(() => {});
    } catch {}
  }, []);

  // Save current ledger draft
  const saveCurrentLedger = useCallback(
    async (overrides?: Partial<EntryMetadata>, titleOverride?: string) => {
      if (!activeEntry) return;

      setSaveStatus('saving');

      const mergedMeta: EntryMetadata = {
        ...metadata,
        ...(overrides || {}),
        isPrivate: true,
      };

      const finalTitle = (titleOverride || title).trim() || activeEntry.title || 'Daily Ledger';
      const validId = isValidUUID(activeEntry.id) ? activeEntry.id : generateUUID();
      const cleanUserId: string = isValidUUID(userId) ? (userId as string) : (isValidUUID(activeEntry.user_id) ? activeEntry.user_id : '');
      const entrySlug = activeEntry.slug || `entry-${validId.slice(0, 8)}`;

      const updated: Entry = {
        ...activeEntry,
        id: validId,
        user_id: cleanUserId,
        title: finalTitle,
        slug: entrySlug,
        body_html: contentHtml,
        entry_type: 'personal_ledger',
        status: 'private',
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
          entry_type: 'thought',
          status: 'private_log',
          body_html: updated.body_html,
          metadata: updated.metadata,
          published_at: null,
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

      // Update state list
      setPrivateEntries((prev) => [updated, ...prev.filter((e) => e.id !== updated.id)]);

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
    [activeEntry, contentHtml, metadata, title, userId]
  );

  // Debounced auto-save (1500ms)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedSnapshotRef = useRef<string>('');

  useEffect(() => {
    if (!activeEntry || !userId) return;

    const currentSnapshot = JSON.stringify({
      id: activeEntry.id,
      title,
      contentHtml,
      metadata,
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
      saveCurrentLedger();
      lastSavedSnapshotRef.current = currentSnapshot;
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [activeEntry?.id, title, contentHtml, metadata, userId, saveCurrentLedger]);

  // Select an entry
  const selectEntry = useCallback(
    (entry: Entry) => {
      flushCurrentDraft();
      setActiveEntry(entry);
      setTitle(entry.title || '');
      setContentHtml(entry.body_html || '');
      setMetadata(entry.metadata || { isPrivate: true });
      setSaveStatus('saved');
    },
    [flushCurrentDraft]
  );

  // Load document for horizon
  const loadHorizonDocument = useCallback(
    (
      targetHorizon: LedgerHorizon,
      dateKey: string,
      weekKey: string,
      monthKey: string,
      year: number,
      entriesPool: Entry[] = privateEntries
    ) => {
      flushCurrentDraft();

      let targetSlug = '';
      let match: Entry | undefined;

      if (targetHorizon === 'compass') {
        targetSlug = getCompassSlug(year);
        match = entriesPool.find(
          (e) =>
            e.slug === targetSlug ||
            (e.metadata?.horizon === 'compass' && e.metadata?.year === year)
        );
        if (match) {
          selectEntry(match);
        } else {
          const freshCompassMeta: CompassMetadata = {
            horizon: 'compass',
            year,
            coreValues: [
              { value: '', whyImportant: '', howEmbodiedNow: '', actionableSteps: '' },
              { value: '', whyImportant: '', howEmbodiedNow: '', actionableSteps: '' },
              { value: '', whyImportant: '', howEmbodiedNow: '', actionableSteps: '' },
            ],
            roadmap: { lifetime: [], threeYears: [], oneYear: [], threeMonths: [] },
            annualGamechanger: { goal: '', vision: '', whyMatters: '' },
          };
          const newDoc: Entry = {
            id: generateUUID(),
            user_id: isValidUUID(userId) ? (userId as string) : '',
            entry_type: 'personal_ledger',
            status: 'private',
            title: `${year} Compass & Roadmap`,
            slug: targetSlug,
            body_json: null,
            body_html: '',
            metadata: freshCompassMeta as any,
            published_at: null,
            created_at: `${year}-01-01T00:00:00.000Z`,
            updated_at: new Date().toISOString(),
          };
          selectEntry(newDoc);
        }
      } else if (targetHorizon === 'monthly') {
        targetSlug = getMonthSlug(monthKey);
        match = entriesPool.find(
          (e) =>
            e.slug === targetSlug ||
            (e.metadata?.horizon === 'monthly' && e.metadata?.monthKey === monthKey)
        );
        if (match) {
          selectEntry(match);
        } else {
          const [y, m] = monthKey.split('-').map(Number);
          const mLabel = getMonthLabel(y, m);
          const freshMonthlyMeta: MonthlyMetadata = {
            horizon: 'monthly',
            monthKey,
            monthFocus: '',
            gamechanger: { title: '', targetDate: '', whyWin: '', challenges: '', subtasks: [] },
            quads: { peopleToSee: [], placesToGo: [], thingsToLearn: [] },
            projects: { personal: [], work: [] },
            reflection: {
              rating: 8,
              accomplishments: '',
              lessons: '',
              memorableMoments: '',
              focusesNextMonth: '',
              domains: { mental: 4, physical: 4, finances: 4, passions: 4, relationships: 4, selfCare: 4 },
            },
          };
          const newDoc: Entry = {
            id: generateUUID(),
            user_id: isValidUUID(userId) ? (userId as string) : '',
            entry_type: 'personal_ledger',
            status: 'private',
            title: `${mLabel} · Horizon Focus`,
            slug: targetSlug,
            body_json: null,
            body_html: '',
            metadata: freshMonthlyMeta as any,
            published_at: null,
            created_at: `${monthKey}-01T00:00:00.000Z`,
            updated_at: new Date().toISOString(),
          };
          selectEntry(newDoc);
        }
      } else if (targetHorizon === 'weekly') {
        targetSlug = getWeekSlug(weekKey);
        match = entriesPool.find(
          (e) =>
            e.slug === targetSlug ||
            (e.metadata?.horizon === 'weekly' && e.metadata?.weekKey === weekKey)
        );
        if (match) {
          selectEntry(match);
        } else {
          const wLabel = getWeekLabel(weekKey);
          const freshWeeklyMeta: WeeklyMetadata = {
            horizon: 'weekly',
            weekKey,
            monthKey,
            weekFocus: '',
            goodThings: [],
            tasks: { personal: [], work: [] },
            infiniteSpace: '',
          };
          const newDoc: Entry = {
            id: generateUUID(),
            user_id: isValidUUID(userId) ? (userId as string) : '',
            entry_type: 'personal_ledger',
            status: 'private',
            title: `${wLabel} · Weekly Rhythm`,
            slug: targetSlug,
            body_json: null,
            body_html: '',
            metadata: freshWeeklyMeta as any,
            published_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          selectEntry(newDoc);
        }
      } else {
        // Daily Ledger
        targetSlug = getDaySlug(dateKey);
        match = entriesPool.find((e) => {
          if (e.slug === targetSlug) return true;
          if (e.metadata?.dateKey === dateKey) return true;
          if (e.created_at) {
            const dKey = formatDateKey(new Date(e.created_at));
            return dKey === dateKey;
          }
          return false;
        });

        if (match) {
          selectEntry(match);
        } else {
          const targetD = new Date(dateKey + 'T12:00:00');
          const formattedD = !isNaN(targetD.getTime())
            ? targetD.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : dateKey;
          const freshDailyMeta: DailyLedgerMetadata = {
            entry_type: 'personal_ledger',
            horizon: 'daily',
            dateKey,
            weekKey,
            monthKey,
            todayFocus: '',
            gamechangerStep: '',
            todayLearned: '',
            dayInOneWord: '',
            mood: 0,
            energy: null,
            habits: {},
            triad: { bright_spot: '', calibration: '', working_thought: '' },
          };
          const newDoc: Entry = {
            id: generateUUID(),
            user_id: isValidUUID(userId) ? (userId as string) : '',
            entry_type: 'personal_ledger',
            status: 'private',
            title: `Daily Ledger · ${formattedD}`,
            slug: targetSlug,
            body_json: null,
            body_html: '',
            metadata: freshDailyMeta as any,
            published_at: null,
            created_at: new Date(dateKey + 'T12:00:00').toISOString(),
            updated_at: new Date().toISOString(),
          };
          selectEntry(newDoc);
        }
      }
    },
    [userId, selectEntry, flushCurrentDraft, privateEntries]
  );

  // Period Navigation
  const handleHorizonChange = useCallback(
    (nextHorizon: LedgerHorizon) => {
      setLedgerHorizon(nextHorizon);
      try {
        localStorage.setItem('rww_ledger_horizon', nextHorizon);
      } catch {}
      loadHorizonDocument(nextHorizon, selectedDateKey, selectedWeekKey, selectedMonthKey, selectedYear);
    },
    [loadHorizonDocument, selectedDateKey, selectedMonthKey, selectedWeekKey, selectedYear]
  );

  const handlePrevPeriod = useCallback(() => {
    if (ledgerHorizon === 'compass') {
      const nextY = selectedYear - 1;
      setSelectedYear(nextY);
      loadHorizonDocument('compass', selectedDateKey, selectedWeekKey, selectedMonthKey, nextY);
    } else if (ledgerHorizon === 'monthly') {
      const nextM = getAdjacentMonth(selectedMonthKey, -1);
      setSelectedMonthKey(nextM);
      const [y] = nextM.split('-').map(Number);
      setSelectedYear(y);
      loadHorizonDocument('monthly', selectedDateKey, selectedWeekKey, nextM, y);
    } else if (ledgerHorizon === 'weekly') {
      const nextW = getAdjacentWeek(selectedWeekKey, -1);
      setSelectedWeekKey(nextW);
      loadHorizonDocument('weekly', selectedDateKey, nextW, selectedMonthKey, selectedYear);
    } else {
      const cur = new Date(selectedDateKey + 'T12:00:00');
      cur.setDate(cur.getDate() - 1);
      const nextD = formatDateKey(cur);
      const nextW = formatWeekKey(cur);
      const nextM = formatMonthKey(cur);
      const nextY = cur.getFullYear();
      setSelectedDateKey(nextD);
      setSelectedWeekKey(nextW);
      setSelectedMonthKey(nextM);
      setSelectedYear(nextY);
      loadHorizonDocument('daily', nextD, nextW, nextM, nextY);
    }
  }, [ledgerHorizon, loadHorizonDocument, selectedDateKey, selectedMonthKey, selectedWeekKey, selectedYear]);

  const handleNextPeriod = useCallback(() => {
    if (ledgerHorizon === 'compass') {
      const nextY = selectedYear + 1;
      setSelectedYear(nextY);
      loadHorizonDocument('compass', selectedDateKey, selectedWeekKey, selectedMonthKey, nextY);
    } else if (ledgerHorizon === 'monthly') {
      const nextM = getAdjacentMonth(selectedMonthKey, 1);
      setSelectedMonthKey(nextM);
      const [y] = nextM.split('-').map(Number);
      setSelectedYear(y);
      loadHorizonDocument('monthly', selectedDateKey, selectedWeekKey, nextM, y);
    } else if (ledgerHorizon === 'weekly') {
      const nextW = getAdjacentWeek(selectedWeekKey, 1);
      setSelectedWeekKey(nextW);
      loadHorizonDocument('weekly', selectedDateKey, nextW, selectedMonthKey, selectedYear);
    } else {
      const cur = new Date(selectedDateKey + 'T12:00:00');
      cur.setDate(cur.getDate() + 1);
      const nextD = formatDateKey(cur);
      const nextW = formatWeekKey(cur);
      const nextM = formatMonthKey(cur);
      const nextY = cur.getFullYear();
      setSelectedDateKey(nextD);
      setSelectedWeekKey(nextW);
      setSelectedMonthKey(nextM);
      setSelectedYear(nextY);
      loadHorizonDocument('daily', nextD, nextW, nextM, nextY);
    }
  }, [ledgerHorizon, loadHorizonDocument, selectedDateKey, selectedMonthKey, selectedWeekKey, selectedYear]);

  const handleSnapCurrent = useCallback(() => {
    const now = new Date();
    const dKey = formatDateKey(now);
    const wKey = formatWeekKey(now);
    const mKey = formatMonthKey(now);
    const yKey = now.getFullYear();
    setSelectedDateKey(dKey);
    setSelectedWeekKey(wKey);
    setSelectedMonthKey(mKey);
    setSelectedYear(yKey);
    loadHorizonDocument(ledgerHorizon, dKey, wKey, mKey, yKey);
  }, [ledgerHorizon, loadHorizonDocument]);

  const handleJumpToDaily = useCallback(
    (targetDateKey: string) => {
      const targetDate = new Date(targetDateKey + 'T12:00:00');
      if (!isNaN(targetDate.getTime())) {
        setSelectedDateKey(targetDateKey);
        setSelectedWeekKey(formatWeekKey(targetDate));
        setSelectedMonthKey(formatMonthKey(targetDate));
        setSelectedYear(targetDate.getFullYear());
        setLedgerHorizon('daily');
        loadHorizonDocument('daily', targetDateKey, formatWeekKey(targetDate), formatMonthKey(targetDate), targetDate.getFullYear());
      }
    },
    [loadHorizonDocument]
  );

  const handleToggleDailyHabitFromWeek = useCallback(
    (targetDateKey: string, habitId: string) => {
      const targetSlug = getDaySlug(targetDateKey);
      const existing = privateEntries.find(
        (e) => e.slug === targetSlug || e.metadata?.dateKey === targetDateKey
      );

      let updatedEntry: Entry;
      if (existing) {
        const existingHabits = existing.metadata?.habits || existing.metadata?.ledger?.habits || {};
        const newHabits = { ...existingHabits, [habitId]: !existingHabits[habitId] };
        updatedEntry = {
          ...existing,
          metadata: {
            ...existing.metadata,
            habits: newHabits,
          },
          updated_at: new Date().toISOString(),
        };
      } else {
        const targetD = new Date(targetDateKey + 'T12:00:00');
        const formattedD = targetD.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const freshMeta: DailyLedgerMetadata = {
          entry_type: 'personal_ledger',
          horizon: 'daily',
          dateKey: targetDateKey,
          habits: { [habitId]: true },
          triad: { bright_spot: '', calibration: '', working_thought: '' },
          energy: null,
        };
        updatedEntry = {
          id: generateUUID(),
          user_id: isValidUUID(userId) ? (userId as string) : '',
          entry_type: 'personal_ledger',
          status: 'private',
          title: `Daily Ledger · ${formattedD}`,
          slug: targetSlug,
          body_json: null,
          body_html: '',
          metadata: freshMeta as any,
          published_at: null,
          created_at: new Date(targetDateKey + 'T12:00:00').toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      setPrivateEntries((prev) => [updatedEntry, ...prev.filter((e) => e.id !== updatedEntry.id && e.slug !== updatedEntry.slug)]);

      try {
        const savedLocal = localStorage.getItem('rww_local_entries');
        let parsed: Entry[] = savedLocal ? JSON.parse(savedLocal) : [];
        parsed = [updatedEntry, ...parsed.filter((p) => p.id !== updatedEntry.id && p.slug !== updatedEntry.slug)];
        localStorage.setItem('rww_local_entries', JSON.stringify(parsed));
      } catch {}

      try {
        const supabase = createClient();
        supabase.from('entries').upsert({
          id: updatedEntry.id,
          title: updatedEntry.title,
          slug: updatedEntry.slug,
          entry_type: 'thought',
          status: 'private_log',
          body_html: updatedEntry.body_html || '',
          metadata: updatedEntry.metadata,
          created_at: updatedEntry.created_at,
          updated_at: updatedEntry.updated_at,
          user_id: isValidUUID(userId) ? userId : null,
        }, { onConflict: 'id' }).then(() => {});
      } catch {}
    },
    [privateEntries, userId]
  );

  // Load entries from Cloud & LocalStorage
  useEffect(() => {
    if (!userId) return;

    const savedLocal = localStorage.getItem('rww_local_entries');
    let parsedLocal: Entry[] = [];
    if (savedLocal) {
      try {
        const rawLocal: any[] = JSON.parse(savedLocal);
        parsedLocal = rawLocal
          .filter((item) => item.status === 'private_log' || item.status === 'private' || item.metadata?.isPrivate)
          .map((item) => ({
            ...item,
            id: isValidUUID(item.id) ? item.id : generateUUID(),
            status: 'private' as EntryStatus,
            entry_type: 'personal_ledger',
            slug: item.slug || `entry-${item.id.slice(0, 8)}`,
            metadata: { ...(item.metadata || {}), isPrivate: true },
          }));
        setPrivateEntries(parsedLocal);
      } catch {}
    }

    // Load initial document from cache or defaults
    loadHorizonDocument(ledgerHorizon, selectedDateKey, selectedWeekKey, selectedMonthKey, selectedYear, parsedLocal);

    // Fetch cloud sync
    const supabase = createClient();
    supabase
      .from('entries')
      .select('*')
      .eq('status', 'private_log')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          const cloudItems: Entry[] = data.map((item: any) => ({
            ...item,
            status: 'private',
            entry_type: 'personal_ledger',
            metadata: { ...(item.metadata || {}), isPrivate: true },
          }));

          const mergedMap = new Map<string, Entry>();
          parsedLocal.forEach((item) => mergedMap.set(item.id, item));
          cloudItems.forEach((item) => {
            const local = mergedMap.get(item.id);
            if (!local || new Date(item.updated_at) >= new Date(local.updated_at)) {
              mergedMap.set(item.id, item);
            }
          });

          const finalMerged = Array.from(mergedMap.values());
          setPrivateEntries(finalMerged);
          loadHorizonDocument(ledgerHorizon, selectedDateKey, selectedWeekKey, selectedMonthKey, selectedYear, finalMerged);
        }
      });
  }, [userId]);

  const handleRecordDailyCheckIn = useCallback(async () => {
    const formattedDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const defaultTitle = title.trim() || `Daily Ledger · ${formattedDate}`;
    if (!title.trim()) {
      setTitle(defaultTitle);
    }
    const updatedMeta = { ...metadata, isPrivate: true };
    setMetadata(updatedMeta);
    await saveCurrentLedger(updatedMeta, defaultTitle);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLedgerFeedback(`Check-in recorded at ${timeStr}`);
    setTimeout(() => {
      setLedgerFeedback(null);
    }, 3500);
  }, [metadata, saveCurrentLedger, title]);

  const handleInsertLedgerIntoBody = useCallback(() => {
    const energyLabel = metadata.energy || 'Unspecified';
    const habits = metadata.habits || {};
    const triad = metadata.triad || { bright_spot: '', calibration: '', working_thought: '' };
    const dateFormatted = selectedDateKey;

    const ledgerHtml = `<blockquote><p><strong>Daily Ledger · ${dateFormatted}</strong><br/><em>Energy:</em> ${energyLabel}<br/><em>Practices:</em> Movement [${habits.movement ? '✓' : ' '}] · Reading [${habits.reading ? '✓' : ' '}] · Writing [${habits.writing ? '✓' : ' '}] · Unplug [${habits.unplug ? '✓' : ' '}]</p><p><strong>+ Bright Spot:</strong> ${triad.bright_spot || '—'}<br/><strong>△ Calibration:</strong> ${triad.calibration || '—'}<br/><strong>• Working Thought:</strong> ${triad.working_thought || '—'}</p></blockquote><p></p>`;

    setContentHtml((prev) => ledgerHtml + prev);
    setSaveStatus('unsaved');
  }, [metadata.energy, metadata.habits, metadata.triad, selectedDateKey]);

  const handleInsertPrompt = useCallback((prompt: string) => {
    setContentHtml((prev) => prev + `<p><em>${prompt}</em></p><p></p>`);
    setSaveStatus('unsaved');
  }, []);

  const handleDeleteEntry = useCallback(
    async (entryToDelete: Entry) => {
      const confirmed = window.confirm(`Delete this ledger entry from your private archive?`);
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

      setPrivateEntries((prev) => prev.filter((p) => p.id !== entryToDelete.id && p.slug !== entryToDelete.slug));

      if (activeEntry?.id === entryToDelete.id || activeEntry?.slug === entryToDelete.slug) {
        loadHorizonDocument(ledgerHorizon, selectedDateKey, selectedWeekKey, selectedMonthKey, selectedYear);
      }
    },
    [activeEntry?.id, activeEntry?.slug, ledgerHorizon, loadHorizonDocument, selectedDateKey, selectedMonthKey, selectedWeekKey, selectedYear]
  );

  // Aggregations
  const selectedMonthParsed = useMemo(() => {
    const [y, m] = selectedMonthKey.split('-').map(Number);
    return { year: y || new Date().getFullYear(), month: m || new Date().getMonth() + 1 };
  }, [selectedMonthKey]);

  const activeMonthlyEntry = useMemo(() => {
    return privateEntries.find(
      (e) =>
        e.slug === getMonthSlug(selectedMonthKey) ||
        (e.metadata?.horizon === 'monthly' && e.metadata?.monthKey === selectedMonthKey)
    );
  }, [privateEntries, selectedMonthKey]);

  const activeWeeklyEntry = useMemo(() => {
    return privateEntries.find(
      (e) =>
        e.slug === getWeekSlug(selectedWeekKey) ||
        (e.metadata?.horizon === 'weekly' && e.metadata?.weekKey === selectedWeekKey)
    );
  }, [privateEntries, selectedWeekKey]);

  const parentGamechangerTitle = activeMonthlyEntry?.metadata?.gamechanger?.title || activeMonthlyEntry?.metadata?.monthFocus;
  const parentGamechangerTarget = activeMonthlyEntry?.metadata?.gamechanger?.targetDate;
  const parentWeekFocus = activeWeeklyEntry?.metadata?.weekFocus;

  const monthlyHabitHeatmap = useMemo(() => {
    return aggregateMonthlyHabitHeatmap(privateEntries, selectedMonthParsed.year, selectedMonthParsed.month);
  }, [privateEntries, selectedMonthParsed]);

  const monthlyWins = useMemo(() => {
    return aggregateMonthlyWins(privateEntries, selectedMonthKey);
  }, [privateEntries, selectedMonthKey]);

  const weekDates = useMemo(() => {
    return getWeekDates(selectedWeekKey);
  }, [selectedWeekKey]);

  const weeklyWins = useMemo(() => {
    return aggregateWeeklyWins(privateEntries, selectedWeekKey);
  }, [privateEntries, selectedWeekKey]);

  const weeklyHabitMatrix = useMemo(() => {
    const matrix: { [habitId: string]: { [dateKey: string]: boolean } } = {
      movement: {},
      reading: {},
      writing: {},
      unplug: {},
    };

    weekDates.forEach((d) => {
      const match = privateEntries.find((e) => {
        if (e.slug === getDaySlug(d.dateKey)) return true;
        if (e.metadata?.dateKey === d.dateKey) return true;
        if (e.created_at) {
          return formatDateKey(new Date(e.created_at)) === d.dateKey;
        }
        return false;
      });

      if (match) {
        const habits = match.metadata?.habits || match.metadata?.ledger?.habits || {};
        ['movement', 'reading', 'writing', 'unplug'].forEach((h) => {
          if (habits[h]) matrix[h][d.dateKey] = true;
        });
      }
    });

    return matrix;
  }, [privateEntries, weekDates]);

  const monthlyGoalProgress = useMemo(() => {
    const subtasks = activeMonthlyEntry?.metadata?.gamechanger?.subtasks || [];
    if (subtasks.length === 0) return 0;
    const done = subtasks.filter((s: any) => s.done).length;
    return Math.round((done / subtasks.length) * 100);
  }, [activeMonthlyEntry]);

  return {
    ledgerHorizon,
    setLedgerHorizon,
    selectedDateKey,
    selectedWeekKey,
    selectedMonthKey,
    selectedYear,
    setSelectedDateKey,
    setSelectedWeekKey,
    setSelectedMonthKey,
    setSelectedYear,
    handleHorizonChange,
    handlePrevPeriod,
    handleNextPeriod,
    handleSnapCurrent,
    handleJumpToDaily,
    handleToggleDailyHabitFromWeek,
    loadHorizonDocument,
    activeEntry,
    title,
    setTitle,
    contentHtml,
    setContentHtml,
    metadata,
    setMetadata,
    saveStatus,
    setSaveStatus,
    ledgerFeedback,
    privateEntries,
    saveCurrentLedger,
    handleRecordDailyCheckIn,
    handleInsertLedgerIntoBody,
    handleInsertPrompt,
    handleDeleteEntry,
    selectEntry,
    flushCurrentDraft,
    flushDraft: flushCurrentDraft,
    selectedMonthParsed,
    activeMonthlyEntry,
    activeWeeklyEntry,
    parentGamechangerTitle,
    parentGamechangerTarget,
    parentWeekFocus,
    monthlyHabitHeatmap,
    monthlyWins,
    weekDates,
    weeklyWins,
    weeklyHabitMatrix,
    monthlyGoalProgress,
  };
}
