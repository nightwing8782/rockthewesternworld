'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  EntryType,
  Entry,
  EntryMetadata,
  EDITORIAL_DESKS,
  SubCategory,
  DeskType,
  EntryStatus,
} from '@/types/database';
import {
  LedgerHorizon,
  CompassMetadata,
  MonthlyMetadata,
  WeeklyMetadata,
  DailyLedgerMetadata,
  PersonalLedgerMetadata,
} from '@/types/journal';
import {
  formatDateKey,
  formatMonthKey,
  formatWeekKey,
  getISOWeekNumber,
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

import TipTapEditor from '@/components/journal/TipTapEditor';
import ReviewCraftPanel from '@/components/journal/ReviewCraftPanel';
import ReflectionPromptBar from '@/components/journal/ReflectionPromptBar';
import EditorialPhotographyAccordion from '@/components/journal/EditorialPhotographyAccordion';
import DailyPersonalLedger from '@/components/journal/DailyPersonalLedger';
import LedgerHorizonNav from '@/components/journal/ledger/LedgerHorizonNav';
import LedgerHierarchyTree from '@/components/journal/ledger/LedgerHierarchyTree';
import CompassRoadmapView from '@/components/journal/ledger/CompassRoadmapView';
import MonthlyHorizonView from '@/components/journal/ledger/MonthlyHorizonView';
import WeeklyRhythmView from '@/components/journal/ledger/WeeklyRhythmView';
import DailyLedgerView from '@/components/journal/ledger/DailyLedgerView';
import PromoteModal from '@/components/journal/PromoteModal';
import AnalyticsModal from '@/components/journal/AnalyticsModal';
import DispatchModal from '@/components/journal/DispatchModal';
import SocialPublishingStudio from '@/components/journal/SocialPublishingStudio';
import Link from 'next/link';
import {
  Lock,
  ArrowLeft,
  Save,
  Globe,
  Plus,
  Trash2,
  Maximize2,
  Minimize2,
  BarChart3,
  Search,
  CheckCircle,
  PanelLeftClose,
  PanelLeftOpen,
  MoreVertical,
  Shield,
  Feather,
  Book,
  BookOpen,
  Music,
  Radio,
  FileEdit,
  ExternalLink,
  Sun,
  RotateCcw,
  Mail,
  Loader2,
  Check,
  Calendar,
  Target,
  Sparkles,
  Compass,
} from 'lucide-react';

const EDITORIAL_ENTRY_TYPES: { type: EntryType; label: string; icon: any }[] = [
  { type: 'essay', label: 'Essay', icon: Feather },
  { type: 'thought', label: 'Reflection / Note', icon: FileEdit },
  { type: 'book_review', label: 'Book Log', icon: Book },
  { type: 'comic_review', label: 'Comic Review', icon: BookOpen },
  { type: 'music_review', label: 'Record Log', icon: Music },
  { type: 'podcast_review', label: 'Podcast Log', icon: Radio },
];

function formatDateSafe(
  dateStr?: string | null,
  fallback = 'Recent Entry',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateStr) return fallback;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString('en-US', options || { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return fallback;
  }
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

export default function JournalStudioPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // Top-Level Studio Workspace: 'ledger' (Personal Passion Planner Atelier) vs 'editorial' (Broadsheet Publishing)
  const [workspaceMode, setWorkspaceMode] = useState<'ledger' | 'editorial'>('ledger');

  // Drawer / Sidebar Collapse State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Four Temporal Horizons State
  const [ledgerHorizon, setLedgerHorizon] = useState<LedgerHorizon>('daily');
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => formatDateKey(new Date()));
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>(() => formatWeekKey(new Date()));
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => formatMonthKey(new Date()));
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());

  // Archive Lists
  const [draftEntries, setDraftEntries] = useState<Entry[]>([]);
  const [publishedEntries, setPublishedEntries] = useState<Entry[]>([]);
  const [privateEntries, setPrivateEntries] = useState<Entry[]>([]);
  const [editorialTab, setEditorialTab] = useState<'drafts' | 'published' | 'all'>('drafts');
  const [searchFilter, setSearchFilter] = useState('');

  // Active Document State
  const [activeEntry, setActiveEntry] = useState<Entry | null>(null);
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [entryType, setEntryType] = useState<EntryType>('personal_ledger');
  const [entryStatus, setEntryStatus] = useState<EntryStatus>('private');
  const [selectedDesk, setSelectedDesk] = useState<DeskType>('commonwealth');
  const [selectedCategory, setSelectedCategory] = useState<SubCategory>('Dan Reads the News');
  const [metadata, setMetadata] = useState<EntryMetadata>({});
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [ledgerFeedback, setLedgerFeedback] = useState<string | null>(null);

  // Load Saved Sidebar State & Workspace Mode from LocalStorage
  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem('rww_studio_sidebar_collapsed');
      if (savedCollapsed !== null) {
        setIsSidebarOpen(savedCollapsed !== 'true');
      }
      const savedMode = localStorage.getItem('rww_studio_workspace_mode');
      if (savedMode === 'ledger' || savedMode === 'editorial') {
        setWorkspaceMode(savedMode);
      }
      const savedHorizon = localStorage.getItem('rww_ledger_horizon') as LedgerHorizon;
      if (savedHorizon && ['daily', 'weekly', 'monthly', 'compass'].includes(savedHorizon)) {
        setLedgerHorizon(savedHorizon);
      }
    } catch (e) {}
  }, []);

  // State synchronization ref for click-away protection & auto-save
  const stateRef = useRef({
    activeEntry,
    title,
    contentHtml,
    metadata,
    entryType,
    entryStatus,
    selectedDesk,
    selectedCategory,
    workspaceMode,
    saveStatus,
    user,
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
      entryType,
      entryStatus,
      selectedDesk,
      selectedCategory,
      workspaceMode,
      saveStatus,
      user,
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
    entryType,
    entryStatus,
    selectedDesk,
    selectedCategory,
    workspaceMode,
    saveStatus,
    user,
    ledgerHorizon,
    selectedDateKey,
    selectedWeekKey,
    selectedMonthKey,
    selectedYear,
  ]);

  // Synchronous Flush Draft helper (guarantees zero data loss on click-away / mode switch)
  const flushCurrentDraft = useCallback(() => {
    const cur = stateRef.current;
    if (!cur.activeEntry || cur.saveStatus !== 'unsaved') return;

    const isPrivate = cur.workspaceMode === 'ledger' || cur.entryStatus === 'private' || cur.metadata.isPrivate;
    const mergedMeta: EntryMetadata = {
      ...cur.metadata,
      desk: cur.selectedDesk,
      category: cur.selectedCategory,
      isPrivate,
    };

    const formattedToday = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const defaultTitle = isPrivate ? `Daily Ledger · ${formattedToday}` : 'Untitled Entry';
    const finalTitle = cur.title.trim() || defaultTitle;
    const updatedStatus: EntryStatus = isPrivate ? 'private' : cur.entryStatus;

    const validId = isValidUUID(cur.activeEntry.id) ? cur.activeEntry.id : generateUUID();
    const cleanUserId = isValidUUID(cur.user?.id) ? cur.user.id : (isValidUUID(cur.activeEntry.user_id) ? cur.activeEntry.user_id : null);
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
      entry_type: isPrivate ? 'personal_ledger' : cur.entryType,
      status: updatedStatus,
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
    } catch (e) {}

    // Async Supabase sync
    try {
      const supabase = createClient();
      const supabaseStatus = isPrivate ? 'private_log' : updated.status;
      const supabaseEntryType = (isPrivate || updated.entry_type === 'personal_ledger') ? 'thought' : updated.entry_type;
      const payload: any = {
        id: updated.id,
        title: updated.title,
        slug: updated.slug,
        entry_type: supabaseEntryType,
        status: supabaseStatus,
        body_html: updated.body_html,
        metadata: updated.metadata,
        published_at: updated.status === 'published' ? (updated.published_at || new Date().toISOString()) : null,
        updated_at: updated.updated_at,
        created_at: updated.created_at || new Date().toISOString(),
      };
      if (cleanUserId) payload.user_id = cleanUserId;
      supabase.from('entries').upsert(payload, { onConflict: 'id' }).then(() => {});
    } catch (e) {}
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('rww_studio_sidebar_collapsed', String(!next));
      } catch (e) {}
      return next;
    });
  };

  // Load Supabase Session
  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.user) {
          setUser(data.session.user);
        }
        setAuthLoading(false);
      }).catch(() => {
        setAuthLoading(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } catch (e) {
      setAuthLoading(false);
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthSubmitting(true);
    setAuthError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword,
      });
      if (error) throw error;
      if (data?.user) setUser(data.user);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify author credentials.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
  };

  // Select an entry from list
  const selectEntry = useCallback((entry: Entry) => {
    flushCurrentDraft();
    setActiveEntry(entry);
    setTitle(entry.title || '');
    setContentHtml(entry.body_html || '');
    setEntryType(entry.entry_type || (entry.status === 'private' ? 'personal_ledger' : 'essay'));
    setEntryStatus(entry.status || 'draft');
    const desk = entry.metadata?.desk || 'commonwealth';
    const cat = (entry.metadata?.category as SubCategory) || 'Dan Reads the News';
    setSelectedDesk(desk);
    setSelectedCategory(cat);
    setMetadata(entry.metadata || { desk, category: cat, isPrivate: entry.status === 'private' });
    setSaveStatus('saved');
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      setIsSidebarOpen(false);
    }
  }, [flushCurrentDraft]);

  // Helper to create a fresh document
  const createNewDocument = useCallback((type: EntryType = 'essay', isPrivate = false) => {
    flushCurrentDraft();
    const formattedToday = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const defaultTitle = isPrivate || type === 'personal_ledger' ? `Daily Ledger · ${formattedToday}` : '';
    
    const freshMetadata: EntryMetadata = {
      desk: 'commonwealth',
      category: 'Dan Reads the News',
      isPrivate,
      horizon: 'daily',
      dateKey: formatDateKey(new Date()),
      habits: {},
      triad: { bright_spot: '', calibration: '', working_thought: '' },
      energy: null as any,
    };

    const newDoc: Entry = {
      id: generateUUID(),
      user_id: isValidUUID(user?.id) ? user.id : null,
      entry_type: type,
      status: isPrivate ? 'private' : 'draft',
      title: defaultTitle,
      slug: isPrivate ? getDaySlug(formatDateKey(new Date())) : null,
      body_json: null,
      body_html: '',
      metadata: freshMetadata,
      published_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setActiveEntry(newDoc);
    setTitle(defaultTitle);
    setContentHtml('');
    setEntryType(type);
    setEntryStatus(isPrivate ? 'private' : 'draft');
    setSelectedDesk('commonwealth');
    setSelectedCategory('Dan Reads the News');
    setMetadata(freshMetadata);
    setSaveStatus('saved');
    if (!isPrivate) {
      setEditorialTab('drafts');
    }
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      setIsSidebarOpen(false);
    }
  }, [user, flushCurrentDraft]);

  // Save Current Entry to Supabase and LocalStorage
  const saveCurrentDraft = async (explicitMeta?: Partial<EntryMetadata> | Record<string, any>, explicitTitle?: string) => {
    if (!activeEntry) return;
    setSaveStatus('saving');

    const isPrivate = workspaceMode === 'ledger' || entryStatus === 'private' || metadata.isPrivate;
    const mergedMeta: EntryMetadata = {
      ...metadata,
      ...(explicitMeta || {}),
      desk: selectedDesk,
      category: selectedCategory,
      isPrivate,
    };

    const formattedToday = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const defaultTitle = isPrivate ? (activeEntry.title || `Daily Ledger · ${formattedToday}`) : 'Untitled Entry';
    const finalTitle = (explicitTitle !== undefined ? explicitTitle : title).trim() || defaultTitle;
    const updatedStatus: EntryStatus = isPrivate ? 'private' : entryStatus;

    const validId = isValidUUID(activeEntry.id) ? activeEntry.id : generateUUID();
    const cleanUserId = isValidUUID(user?.id) ? user.id : (isValidUUID(activeEntry.user_id) ? activeEntry.user_id : null);
    
    // Compute appropriate slug for horizon or editorial piece
    let entrySlug = activeEntry.slug;
    if (!entrySlug || entrySlug.startsWith('entry-')) {
      if (isPrivate) {
        if (mergedMeta.horizon === 'compass') entrySlug = getCompassSlug(Number(mergedMeta.year) || selectedYear);
        else if (mergedMeta.horizon === 'monthly') entrySlug = getMonthSlug(String(mergedMeta.monthKey || selectedMonthKey));
        else if (mergedMeta.horizon === 'weekly') entrySlug = getWeekSlug(String(mergedMeta.weekKey || selectedWeekKey));
        else entrySlug = getDaySlug(String(mergedMeta.dateKey || selectedDateKey));
      } else {
        entrySlug = finalTitle
          ? `${finalTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${validId.slice(0, 8)}`
          : `entry-${validId.slice(0, 8)}`;
      }
    }

    const updated: Entry = {
      ...activeEntry,
      id: validId,
      user_id: cleanUserId,
      title: finalTitle,
      slug: entrySlug,
      body_html: contentHtml,
      entry_type: isPrivate ? 'personal_ledger' : entryType,
      status: updatedStatus,
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
      const supabaseStatus = isPrivate ? 'private_log' : updated.status;
      const supabaseEntryType = (isPrivate || updated.entry_type === 'personal_ledger') ? 'thought' : updated.entry_type;

      const payload: any = {
        id: updated.id,
        title: updated.title,
        slug: updated.slug,
        entry_type: supabaseEntryType,
        status: supabaseStatus,
        body_html: updated.body_html,
        metadata: updated.metadata,
        published_at: updated.status === 'published' ? (updated.published_at || new Date().toISOString()) : null,
        updated_at: updated.updated_at,
        created_at: updated.created_at || new Date().toISOString(),
      };
      if (cleanUserId) {
        payload.user_id = cleanUserId;
      }

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
      setPrivateEntries((prev) => prev.filter((e) => e.id !== updated.id));
    } else if (updated.status === 'private') {
      setPrivateEntries((prev) => [updated, ...prev.filter((e) => e.id !== updated.id)]);
      setDraftEntries((prev) => prev.filter((e) => e.id !== updated.id));
      setPublishedEntries((prev) => prev.filter((e) => e.id !== updated.id));
    } else if (updated.status === 'draft') {
      setDraftEntries((prev) => [updated, ...prev.filter((e) => e.id !== updated.id)]);
      setPrivateEntries((prev) => prev.filter((e) => e.id !== updated.id));
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
    } catch (e) {}

    setTimeout(() => setSaveStatus('saved'), 350);
  };

  // Real-Time Debounced Auto-Save Draft (1500ms after last keystroke)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedSnapshotRef = useRef<string>('');

  useEffect(() => {
    if (!activeEntry || !user) return;

    const currentSnapshot = JSON.stringify({
      id: activeEntry.id,
      title,
      contentHtml,
      metadata,
      entryType,
      entryStatus,
      selectedDesk,
      selectedCategory,
      workspaceMode,
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
    } catch (e) {}

    autoSaveTimerRef.current = setTimeout(() => {
      saveCurrentDraft();
      lastSavedSnapshotRef.current = currentSnapshot;
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [activeEntry?.id, title, contentHtml, metadata, entryType, entryStatus, selectedDesk, selectedCategory, workspaceMode, user]);

  // Load Document for Specific Horizon and Period Key
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
            user_id: isValidUUID(user?.id) ? user.id : null,
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
            user_id: isValidUUID(user?.id) ? user.id : null,
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
            user_id: isValidUUID(user?.id) ? user.id : null,
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
            user_id: isValidUUID(user?.id) ? user.id : null,
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
    [user, selectEntry, flushCurrentDraft, privateEntries]
  );

  // Switch Top-level Workspace Mode
  const switchWorkspaceMode = (mode: 'ledger' | 'editorial') => {
    flushCurrentDraft();
    setWorkspaceMode(mode);
    try {
      localStorage.setItem('rww_studio_workspace_mode', mode);
    } catch (e) {}

    if (mode === 'ledger') {
      loadHorizonDocument(ledgerHorizon, selectedDateKey, selectedWeekKey, selectedMonthKey, selectedYear);
    } else {
      const latestDraft = draftEntries[0];
      if (latestDraft) {
        selectEntry(latestDraft);
      } else {
        createNewDocument('essay', false);
      }
    }
  };

  // Change Active Horizon (Daily, Weekly, Monthly, Compass)
  const handleHorizonChange = (nextHorizon: LedgerHorizon) => {
    setLedgerHorizon(nextHorizon);
    try {
      localStorage.setItem('rww_ledger_horizon', nextHorizon);
    } catch (e) {}
    loadHorizonDocument(nextHorizon, selectedDateKey, selectedWeekKey, selectedMonthKey, selectedYear);
  };

  // Horizon Period Navigation (Prev / Next)
  const handlePrevPeriod = () => {
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
      // Daily
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
  };

  const handleNextPeriod = () => {
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
      // Daily
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
  };

  // Snap to Current Today / Week / Month / Year
  const handleSnapCurrent = () => {
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
  };

  // Jump directly to Daily from Heatmap / Weekly matrix
  const handleJumpToDaily = (targetDateKey: string) => {
    const targetDate = new Date(targetDateKey + 'T12:00:00');
    if (!isNaN(targetDate.getTime())) {
      setSelectedDateKey(targetDateKey);
      setSelectedWeekKey(formatWeekKey(targetDate));
      setSelectedMonthKey(formatMonthKey(targetDate));
      setSelectedYear(targetDate.getFullYear());
      setLedgerHorizon('daily');
      loadHorizonDocument('daily', targetDateKey, formatWeekKey(targetDate), formatMonthKey(targetDate), targetDate.getFullYear());
    }
  };

  // Direct toggle of daily habit from Weekly Rhythm matrix
  const handleToggleDailyHabitFromWeek = (targetDateKey: string, habitId: string) => {
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
        user_id: isValidUUID(user?.id) ? user.id : null,
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

    // Update Private Entries List
    setPrivateEntries((prev) => [updatedEntry, ...prev.filter((e) => e.id !== updatedEntry.id && e.slug !== updatedEntry.slug)]);

    // Save to LocalStorage & Supabase
    try {
      const savedLocal = localStorage.getItem('rww_local_entries');
      let parsed: Entry[] = savedLocal ? JSON.parse(savedLocal) : [];
      parsed = [updatedEntry, ...parsed.filter((p) => p.id !== updatedEntry.id && p.slug !== updatedEntry.slug)];
      localStorage.setItem('rww_local_entries', JSON.stringify(parsed));
    } catch (e) {}

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
        user_id: isValidUUID(user?.id) ? user.id : null,
      }, { onConflict: 'id' }).then(() => {});
    } catch (e) {}
  };

  // Load Drafts, Published, and Private entries with Cross-Device Cloud Sync
  useEffect(() => {
    if (!user) return;

    // 1. Local Cache Load + Auto-Migration
    const savedLocal = localStorage.getItem('rww_local_entries');
    let parsedLocal: Entry[] = [];
    if (savedLocal) {
      try {
        const rawLocal: any[] = JSON.parse(savedLocal);
        let hasMigrated = false;
        parsedLocal = rawLocal.map((item) => {
          const isPriv = item.status === 'private_log' || item.status === 'private' || item.metadata?.isPrivate;
          let id = item.id;
          if (!isValidUUID(id)) {
            hasMigrated = true;
            id = generateUUID();
          }
          return {
            ...item,
            id,
            status: isPriv ? 'private' : (item.status || 'draft'),
            entry_type: (isPriv || item.entry_type === 'personal_ledger') ? 'personal_ledger' : (item.entry_type || 'essay'),
            slug: item.slug || `entry-${id.slice(0, 8)}`,
            user_id: isValidUUID(user?.id) ? user.id : (isValidUUID(item.user_id) ? item.user_id : null),
            metadata: {
              ...(item.metadata || {}),
              isPrivate: isPriv,
            },
          };
        });

        if (hasMigrated) {
          localStorage.setItem('rww_local_entries', JSON.stringify(parsedLocal));
        }

        const drafts = parsedLocal.filter((e) => e.status === 'draft');
        const privates = parsedLocal.filter((e) => e.status === 'private');
        setDraftEntries(drafts);
        setPrivateEntries(privates);
      } catch (e) {}
    }

    // 2. Fetch WordPress Historical Archive + Supabase Cloud Entries
    const loadAllStudioEntries = async () => {
      let historical: Entry[] = [];
      try {
        const res = await fetch('/archive/imported-entries.json');
        if (res.ok) {
          historical = await res.json();
        }
      } catch (e) {}

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('entries')
          .select('*')
          .order('created_at', { ascending: false });

        const normalizedCloud: Entry[] = (!error && data)
          ? data.map((e: any) => {
              const isPriv = e.status === 'private_log' || e.status === 'private' || e.metadata?.isPrivate;
              return {
                ...e,
                status: isPriv ? 'private' : e.status,
                entry_type: (isPriv || e.entry_type === 'personal_ledger') ? 'personal_ledger' : e.entry_type,
                metadata: {
                  ...e.metadata,
                  isPrivate: isPriv,
                },
              };
            })
          : [];

        const publishedMap = new Map<string, Entry>();
        historical.forEach((item, idx) => {
          const key = item.slug || item.id || `wp-${idx}`;
          const isPublished = item.status ? item.status === 'published' : true;
          if (isPublished) {
            publishedMap.set(key, { ...item, id: item.id || key, status: 'published' });
          }
        });

        const pubFromCloud = normalizedCloud.filter((e) => e.status === 'published');
        pubFromCloud.forEach((item) => {
          const key = item.slug || item.id;
          if (key) publishedMap.set(key, item);
        });

        const mergedPublished = Array.from(publishedMap.values()).sort((a, b) =>
          (safeTimestamp(b.published_at) || safeTimestamp(b.created_at)) - (safeTimestamp(a.published_at) || safeTimestamp(a.created_at))
        );

        const priv = normalizedCloud.filter((e) => e.status === 'private');
        const drafts = normalizedCloud.filter((e) => e.status === 'draft');

        setPublishedEntries(mergedPublished);

        const mergedPrivatesMap = new Map<string, Entry>();
        priv.forEach((p) => mergedPrivatesMap.set(p.id || p.slug || '', p));
        parsedLocal.filter((p) => p.status === 'private').forEach((p) => {
          const k = p.id || p.slug || '';
          if (!mergedPrivatesMap.has(k)) mergedPrivatesMap.set(k, p);
        });
        const combinedPrivates = Array.from(mergedPrivatesMap.values()).sort((a, b) =>
          safeTimestamp(b.created_at) - safeTimestamp(a.created_at)
        );
        setPrivateEntries(combinedPrivates);

        setDraftEntries((prev) => {
          const map = new Map<string, Entry>();
          drafts.forEach((d) => map.set(d.id || d.slug || '', d));
          prev.forEach((d) => {
            const key = d.id || d.slug || '';
            if (!map.has(key)) map.set(key, d);
          });
          return Array.from(map.values()).sort((a, b) => 
            (safeTimestamp(b.updated_at) || safeTimestamp(b.created_at)) - (safeTimestamp(a.updated_at) || safeTimestamp(a.created_at))
          );
        });

        // Initial Horizon Document Selection
        const savedMode = (localStorage.getItem('rww_studio_workspace_mode') || 'ledger') as 'ledger' | 'editorial';
        const savedHorizon = (localStorage.getItem('rww_ledger_horizon') || 'daily') as LedgerHorizon;
        if (savedMode === 'ledger') {
          const now = new Date();
          loadHorizonDocument(
            savedHorizon,
            formatDateKey(now),
            formatWeekKey(now),
            formatMonthKey(now),
            now.getFullYear(),
            combinedPrivates
          );
        } else {
          const latestDraft = drafts[0];
          if (latestDraft) selectEntry(latestDraft);
          else createNewDocument('essay', false);
        }
      } catch (e) {}
    };

    loadAllStudioEntries();
  }, [user]);

  const handleDeskChange = (deskId: DeskType) => {
    setSelectedDesk(deskId);
    const desk = EDITORIAL_DESKS.find((d) => d.id === deskId);
    if (desk && desk.categories.length > 0) {
      setSelectedCategory(desk.categories[0]);
      setMetadata((prev) => ({ ...prev, desk: deskId, category: desk.categories[0] }));
    }
  };

  const handleTypeChange = (newType: EntryType) => {
    setEntryType(newType);
    setSaveStatus('unsaved');
  };

  const handleSetEditorialStatus = (newStatus: 'draft' | 'published') => {
    if (newStatus === 'published' && entryStatus !== 'published') {
      setIsPromoteOpen(true);
      return;
    }
    setEntryStatus(newStatus);
    setMetadata((prev) => ({ ...prev, isPrivate: false }));
    setSaveStatus('unsaved');
    if (activeEntry) {
      setActiveEntry((prev) => prev ? { ...prev, status: newStatus, metadata: { ...prev.metadata, isPrivate: false } } : null);
    }
  };

  const handleUnpublishToDraft = async () => {
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
    } catch (e) {}

    setPublishedEntries((prev) => prev.filter((p) => p.id !== activeEntry.id && p.slug !== activeEntry.slug));
    setDraftEntries((prev) => [updated, ...prev.filter((d) => d.id !== activeEntry.id)]);

    try {
      const savedLocal = localStorage.getItem('rww_local_entries');
      let parsed: Entry[] = savedLocal ? JSON.parse(savedLocal) : [];
      parsed = [updated, ...parsed.filter((p) => p.id !== activeEntry.id)];
      localStorage.setItem('rww_local_entries', JSON.stringify(parsed));
    } catch (e) {}

    setEditorialTab('drafts');
    setSaveStatus('saved');
  };

  const handleInsertReflectionPrompt = (promptText: string) => {
    const quoteHtml = `<blockquote><p><em>"${promptText}"</em></p></blockquote><p></p>`;
    setContentHtml((prev) => quoteHtml + prev);
    setSaveStatus('unsaved');
  };

  const handleInsertLedgerIntoBody = () => {
    const energyMap: Record<string, string> = {
      high_focused: 'High · Focused',
      high_scattered: 'High · Scattered',
      low_reflective: 'Low · Reflective',
      low_depleted: 'Low · Depleted',
    };
    const energyLabel = metadata?.energy ? (energyMap[metadata.energy] || metadata.energy) : '—';
    const habits = metadata?.habits || {};
    const triad = metadata?.triad || { bright_spot: '', calibration: '', working_thought: '' };
    
    const dateFormatted = formatDateSafe(activeEntry?.created_at, new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }), {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const ledgerHtml = `<blockquote><p><strong>Daily Ledger · ${dateFormatted}</strong><br/><em>Energy:</em> ${energyLabel}<br/><em>Practices:</em> Movement [${habits.movement ? '✓' : ' '}] · Reading [${habits.reading ? '✓' : ' '}] · Writing [${habits.writing ? '✓' : ' '}] · Unplug [${habits.unplug ? '✓' : ' '}]</p><p><strong>+ Bright Spot:</strong> ${triad.bright_spot || '—'}<br/><strong>△ Calibration:</strong> ${triad.calibration || '—'}<br/><strong>• Working Thought:</strong> ${triad.working_thought || '—'}</p></blockquote><p></p>`;

    setContentHtml((prev) => ledgerHtml + prev);
    setSaveStatus('unsaved');
  };

  const handleRecordDailyCheckIn = async () => {
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
    setEntryStatus('private');
    if (entryType !== 'personal_ledger') {
      setEntryType('personal_ledger');
    }
    await saveCurrentDraft(updatedMeta, defaultTitle);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLedgerFeedback(`Check-in recorded at ${timeStr}`);
    setTimeout(() => {
      setLedgerFeedback(null);
    }, 3500);
  };

  const handleApplyTemplate = (templateHtml: string) => {
    if (!contentHtml.trim() || window.confirm('Apply review structure to canvas? (Existing text will remain beneath).')) {
      setContentHtml((prev) => templateHtml + (prev ? `<hr/>` + prev : ''));
      setSaveStatus('unsaved');
    }
  };

  const handleDeleteEntry = async (entryToDelete: Entry) => {
    const isLive = entryToDelete.status === 'published';
    const isLedger = entryToDelete.status === 'private';
    const itemTitle = entryToDelete.title || (isLedger ? 'Daily Ledger' : 'Untitled Draft');

    const promptMessage = isLive
      ? `Permanently delete live published piece "${itemTitle}"?\n\nThis will remove it from the live broadsheet and database.`
      : isLedger
      ? `Delete this ledger entry from your private archive?`
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
    } catch (e) {}

    try {
      const savedLocal = localStorage.getItem('rww_local_entries');
      if (savedLocal) {
        const parsed: Entry[] = JSON.parse(savedLocal);
        const filtered = parsed.filter(
          (p) => p.id !== entryToDelete.id && p.slug !== entryToDelete.slug
        );
        localStorage.setItem('rww_local_entries', JSON.stringify(filtered));
      }
    } catch (e) {}

    setDraftEntries((prev) => prev.filter((d) => d.id !== entryToDelete.id && d.slug !== entryToDelete.slug));
    setPublishedEntries((prev) => prev.filter((p) => p.id !== entryToDelete.id && p.slug !== entryToDelete.slug));
    setPrivateEntries((prev) => prev.filter((p) => p.id !== entryToDelete.id && p.slug !== entryToDelete.slug));

    if (activeEntry?.id === entryToDelete.id || activeEntry?.slug === entryToDelete.slug) {
      if (workspaceMode === 'ledger') {
        loadHorizonDocument(ledgerHorizon, selectedDateKey, selectedWeekKey, selectedMonthKey, selectedYear);
      } else {
        const remaining = draftEntries.filter((e) => e.id !== entryToDelete.id && e.slug !== entryToDelete.slug);
        if (remaining.length > 0) selectEntry(remaining[0]);
        else createNewDocument('essay', false);
      }
    }
  };

  const allStudioEntries = useMemo(() => {
    return [...privateEntries, ...draftEntries, ...publishedEntries];
  }, [privateEntries, draftEntries, publishedEntries]);

  // Mode-Specific Filtered Sidebar List
  const visibleSidebarList = useMemo(() => {
    let list: Entry[] = [];
    if (workspaceMode === 'ledger') {
      list = privateEntries;
    } else {
      if (editorialTab === 'drafts') list = draftEntries;
      else if (editorialTab === 'published') list = publishedEntries;
      else list = [...draftEntries, ...publishedEntries];
    }

    if (!searchFilter.trim()) return list;
    const q = searchFilter.toLowerCase();
    return list.filter((item) => {
      const titleMatch = (item.title || '').toLowerCase().includes(q);
      const catMatch = (item.metadata?.category || '').toLowerCase().includes(q);
      const bodyMatch = (item.body_html || '').toLowerCase().includes(q);
      const brightMatch = (item.metadata?.triad?.bright_spot || item.metadata?.ledger?.triad?.bright_spot || '').toLowerCase().includes(q);
      const calibMatch = (item.metadata?.triad?.calibration || item.metadata?.ledger?.triad?.calibration || '').toLowerCase().includes(q);
      const thoughtMatch = (item.metadata?.triad?.working_thought || item.metadata?.ledger?.triad?.working_thought || '').toLowerCase().includes(q);
      return titleMatch || catMatch || bodyMatch || brightMatch || calibMatch || thoughtMatch;
    });
  }, [workspaceMode, editorialTab, privateEntries, draftEntries, publishedEntries, searchFilter]);

  // Two-Way Roll-Up Aggregations
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

  // Inherited North Star Cascades
  const parentGamechangerTitle = activeMonthlyEntry?.metadata?.gamechanger?.title || activeMonthlyEntry?.metadata?.monthFocus;
  const parentGamechangerTarget = activeMonthlyEntry?.metadata?.gamechanger?.targetDate;
  const parentWeekFocus = activeWeeklyEntry?.metadata?.weekFocus;

  // Monthly Aggregations
  const monthlyHabitHeatmap = useMemo(() => {
    return aggregateMonthlyHabitHeatmap(privateEntries, selectedMonthParsed.year, selectedMonthParsed.month);
  }, [privateEntries, selectedMonthParsed]);

  const monthlyWins = useMemo(() => {
    return aggregateMonthlyWins(privateEntries, selectedMonthKey);
  }, [privateEntries, selectedMonthKey]);

  // Weekly Aggregations
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

  // Monthly Subtask Goal Progress %
  const monthlyGoalProgress = useMemo(() => {
    const subtasks = activeMonthlyEntry?.metadata?.gamechanger?.subtasks || [];
    if (subtasks.length === 0) return 0;
    const done = subtasks.filter((s: any) => s.done).length;
    return Math.round((done / subtasks.length) * 100);
  }, [activeMonthlyEntry]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="text-xs font-display uppercase tracking-[0.25em] text-[#B45309] font-bold animate-pulse flex items-center gap-2">
          <Lock className="w-4 h-4" />
          <span>Verifying Press Credentials...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 selection:bg-[#1E40AF] selection:text-white">
        <div className="max-w-md w-full bg-[#FAF8F5] border-2 border-[#1C1917] p-8 shadow-[8px_8px_0px_0px_#1C1917] relative">
          <div className="border-b-2 border-[#1C1917] pb-4 mb-6 text-center">
            <div className="text-[10px] font-display uppercase tracking-[0.25em] text-[#B45309] font-bold mb-1">
              Confidential Atelier
            </div>
            <h1 className="font-display font-black text-2xl tracking-wider text-[#1C1917] uppercase">
              Rock The Western World
            </h1>
            <div className="text-[11px] font-serif italic text-[#66615C] mt-1">
              Editorial Studio • Authorized Access Only
            </div>
          </div>

          {authError && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-serif">
              {authError}
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#1C1917] mb-1">
                Author Email
              </label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="editor@rockthewesternworld.com"
                className="w-full text-xs font-serif bg-white border border-[#E5DFC5] rounded px-3 py-2 text-[#1C1917] focus:outline-[#1E40AF]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#1C1917] mb-1">
                Studio Password
              </label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-xs font-serif bg-white border border-[#E5DFC5] rounded px-3 py-2 text-[#1C1917] focus:outline-[#1E40AF]"
              />
            </div>

            <button
              type="submit"
              disabled={isAuthSubmitting}
              className="w-full py-2.5 px-4 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] text-xs font-display uppercase tracking-widest font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isAuthSubmitting ? 'Verifying...' : 'Unlock Studio'}</span>
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#E5DFC5] text-center text-[11px] font-serif">
            <Link
              href="/"
              className="text-[#66615C] hover:text-[#1E40AF] hover:underline"
            >
              ← Return to Public Broadsheet
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isLiveActive = workspaceMode === 'editorial' && entryStatus === 'published';

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#242120] flex flex-col font-reading selection:bg-[#1E40AF] selection:text-white relative">
      {/* Studio Top Header */}
      <header className="border-b border-[#E5DFC5] bg-[#FAF8F5]/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Navigation & Workspace Switcher */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {!isFocusMode && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-1.5 rounded hover:bg-[#EAE4D7] text-[#44403C] hover:text-[#1C1917] transition-colors cursor-pointer"
                title={isSidebarOpen ? 'Collapse Sidebar Drawer' : 'Expand Sidebar Drawer'}
              >
                {isSidebarOpen ? (
                  <PanelLeftClose className="w-4 h-4 text-[#B45309]" />
                ) : (
                  <PanelLeftOpen className="w-4 h-4 text-[#1E40AF]" />
                )}
              </button>
            )}

            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-[0.2em] text-[#66615C] hover:text-[#1E40AF] transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden md:inline">Broadsheet</span>
            </Link>

            <span className="text-[#DDD5C7] text-xs">|</span>

            {/* Top Workspace Mode Switcher */}
            <div className="flex items-center bg-[#EAE4D7] p-0.5 rounded text-[10px] sm:text-xs font-display uppercase tracking-wider font-bold">
              <button
                type="button"
                onClick={() => switchWorkspaceMode('ledger')}
                className={`px-2.5 sm:px-3 py-1 rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                  workspaceMode === 'ledger'
                    ? 'bg-[#B45309] text-white shadow-2xs'
                    : 'text-[#66615C] hover:text-[#1C1917]'
                }`}
                title="Personal Private Atelier (Passion Planner Horizons, Habits, Daily Ledger)"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Passion Ledger</span>
              </button>
              <button
                type="button"
                onClick={() => switchWorkspaceMode('editorial')}
                className={`px-2.5 sm:px-3 py-1 rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                  workspaceMode === 'editorial'
                    ? 'bg-[#1E40AF] text-white shadow-2xs'
                    : 'text-[#66615C] hover:text-[#1C1917]'
                }`}
                title="Broadsheet Publishing Suite (Essays, Reviews, Photography, Dispatches)"
              >
                <Feather className="w-3.5 h-3.5" />
                <span>Editorial CMS</span>
              </button>
            </div>
          </div>

          {/* Right: Mode-Specific Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Real-time Auto-Save Status Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono rounded bg-[#EAE4D7]/70 text-[#66615C] border border-[#DDD5C7]/60">
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-3 h-3 text-amber-600 animate-spin" />
                  <span className="text-amber-800 font-semibold">Auto-Saving...</span>
                </>
              ) : saveStatus === 'unsaved' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Unsaved edits</span>
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-stone-600">Saved</span>
                </>
              )}
            </div>

            {workspaceMode === 'ledger' ? (
              <>
                <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-serif text-[#78716C] italic mr-1">
                  <Shield className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>Confidential Cloud Notebook</span>
                </span>

                <button
                  onClick={() => saveCurrentDraft()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#B45309] hover:bg-[#92400E] text-[#FAF8F5] rounded text-[11px] sm:text-xs font-display uppercase tracking-widest font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5 text-[#FAF8F5]" />
                  <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Ledger'}</span>
                </button>
              </>
            ) : (
              <>
                {/* Editorial Status Switcher: Draft vs Live */}
                <div className="flex items-center bg-[#EAE4D7] p-0.5 rounded text-[10px] sm:text-[11px] font-display uppercase tracking-wider font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSetEditorialStatus('draft')}
                    className={`px-2 sm:px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      !isLiveActive
                        ? 'bg-[#FAF8F5] text-[#1C1917] shadow-xs'
                        : 'text-[#66615C] hover:text-[#1C1917]'
                    }`}
                  >
                    Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetEditorialStatus('published')}
                    className={`px-2 sm:px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                      isLiveActive
                        ? 'bg-emerald-100 text-emerald-900 shadow-xs'
                        : 'text-[#66615C] hover:text-[#1C1917]'
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    <span>Live</span>
                  </button>
                </div>

                <button
                  onClick={() => saveCurrentDraft()}
                  className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] rounded text-[11px] sm:text-xs font-display uppercase tracking-widest font-bold transition-colors cursor-pointer shadow-xs shrink-0"
                >
                  <Save className="w-3.5 h-3.5 text-[#E5DFC5]" />
                  <span>{isLiveActive ? 'Update Live' : 'Save Draft'}</span>
                </button>

                {!isLiveActive && (
                  <button
                    onClick={() => setIsPromoteOpen(true)}
                    className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-[#1E40AF] hover:bg-[#1D4ED8] text-white rounded text-[11px] sm:text-xs font-display uppercase tracking-widest font-bold transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Promote Live</span>
                    <span className="sm:hidden">Promote</span>
                  </button>
                )}
              </>
            )}

            {/* Overflow Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className="p-1.5 rounded hover:bg-[#EAE4D7] text-[#44403C] hover:text-[#1C1917] transition-colors cursor-pointer border border-[#DDD5C7] bg-[#FAF8F5]"
                title="More Studio Actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMoreMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMoreMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-52 bg-[#FAF8F5] border border-[#DDD5C7] shadow-xl rounded py-1 z-50 font-serif text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDispatchOpen(true);
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-[#F2ECE1] flex items-center gap-2 text-[#1C1917] cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#B45309]" />
                      <span>The Dispatch Broadcast</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAnalyticsOpen(true);
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-[#F2ECE1] flex items-center gap-2 text-[#1C1917] cursor-pointer"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-[#1E40AF]" />
                      <span>Umami Analytics</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsFocusMode(!isFocusMode);
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-[#F2ECE1] flex items-center gap-2 text-[#1C1917] cursor-pointer"
                    >
                      {isFocusMode ? <Minimize2 className="w-3.5 h-3.5 text-[#B45309]" /> : <Maximize2 className="w-3.5 h-3.5 text-[#1E40AF]" />}
                      <span>{isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}</span>
                    </button>

                    {isLiveActive && (
                      <button
                        type="button"
                        onClick={() => {
                          handleUnpublishToDraft();
                          setIsMoreMenuOpen(false);
                        }}
                        className="w-full px-3.5 py-2 text-left hover:bg-[#F2ECE1] flex items-center gap-2 text-amber-800 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Unpublish to Draft</span>
                      </button>
                    )}

                    {activeEntry && (
                      <button
                        type="button"
                        onClick={() => {
                          handleDeleteEntry(activeEntry);
                          setIsMoreMenuOpen(false);
                        }}
                        className="w-full px-3.5 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Current Entry</span>
                      </button>
                    )}

                    <div className="my-1 border-t border-[#DDD5C7]" />

                    <button
                      type="button"
                      onClick={() => {
                        handleSignOut();
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-[#F2ECE1] flex items-center gap-2 text-[#66615C] cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-[#B45309]" />
                      <span>Lock Studio / Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Studio Area */}
      <div className="max-w-7xl mx-auto px-3 sm:px-8 py-4 sm:py-6 w-full flex-1 flex gap-6 lg:gap-8">
        {/* Off-Canvas Backdrop for Mobile */}
        {!isFocusMode && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 xl:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Dedicated Workspace Sidebar */}
        {!isFocusMode && (
          <aside
            className={`shrink-0 flex flex-col gap-3.5 transition-all duration-200 bg-[#FAF8F5] ${
              isSidebarOpen
                ? 'fixed inset-y-0 left-0 z-50 w-80 shadow-2xl p-5 border-r border-[#E5DFC5] overflow-y-auto xl:sticky xl:top-16 xl:max-h-[calc(100vh-5rem)] xl:z-auto xl:w-72 xl:shadow-none xl:p-0 xl:pr-6'
                : 'w-0 opacity-0 pointer-events-none pr-0 -translate-x-full xl:translate-x-0'
            }`}
          >
            {/* Action Buttons based on Active Mode */}
            {workspaceMode === 'ledger' ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleSnapCurrent}
                  className="w-full py-2.5 px-3 bg-[#B45309] hover:bg-[#92400E] text-[#FAF8F5] rounded-xl text-xs font-display uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  <span>Today&apos;s Check-in</span>
                </button>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => createNewDocument('essay', false)}
                  className="w-full py-2.5 px-3 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] rounded-xl text-xs font-display uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Broadsheet Draft</span>
                </button>
              </div>
            )}

            {/* Sidebar Navigation Tabs (Editorial mode only) */}
            {workspaceMode === 'editorial' && (
              <div className="grid grid-cols-3 bg-[#EAE4D7] p-0.5 rounded text-[9px] font-display uppercase tracking-wider font-bold">
                <button
                  onClick={() => setEditorialTab('drafts')}
                  className={`py-1.5 rounded transition-colors text-center cursor-pointer ${
                    editorialTab === 'drafts'
                      ? 'bg-[#FAF8F5] text-stone-900 shadow-xs'
                      : 'text-[#66615C] hover:text-[#1C1917]'
                  }`}
                >
                  Drafts ({draftEntries.length})
                </button>
                <button
                  onClick={() => setEditorialTab('published')}
                  className={`py-1.5 rounded transition-colors text-center cursor-pointer ${
                    editorialTab === 'published'
                      ? 'bg-[#FAF8F5] text-[#1E40AF] shadow-xs'
                      : 'text-[#66615C] hover:text-[#1C1917]'
                  }`}
                >
                  Published ({publishedEntries.length})
                </button>
                <button
                  onClick={() => setEditorialTab('all')}
                  className={`py-1.5 rounded transition-colors text-center cursor-pointer ${
                    editorialTab === 'all'
                      ? 'bg-[#FAF8F5] text-[#1C1917] shadow-xs'
                      : 'text-[#66615C] hover:text-[#1C1917]'
                  }`}
                >
                  All ({draftEntries.length + publishedEntries.length})
                </button>
              </div>
            )}

            {/* Sidebar Title (Daily Ledger mode) */}
            {workspaceMode === 'ledger' && (
              <div className="flex items-center justify-between px-1 border-b border-[#E5DFC5] pb-2">
                <div className="flex items-center gap-1.5 text-[10px] font-display uppercase tracking-[0.2em] text-[#B45309] font-bold">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Horizon Timeline</span>
                </div>
                <span className="text-[10px] font-serif text-[#78716C] italic font-semibold">
                  {privateEntries.length} {privateEntries.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>
            )}

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#9C9589] absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder={
                  workspaceMode === 'ledger'
                    ? 'Search thoughts, bright spots, habits...'
                    : 'Search drafts, titles, desks...'
                }
                className="w-full pl-8 pr-2.5 py-1.5 bg-[#FAF8F5] border border-[#E5DFC5] rounded text-xs font-serif text-[#1C1917] placeholder:text-[#9C9589] focus:outline-[#1E40AF]"
              />
            </div>

            {/* Document Hierarchy Tree (Ledger) vs Cards (Editorial) */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[calc(100vh-280px)]">
              {workspaceMode === 'ledger' ? (
                <LedgerHierarchyTree
                  entries={privateEntries}
                  activeHorizon={ledgerHorizon}
                  selectedDateKey={selectedDateKey}
                  selectedWeekKey={selectedWeekKey}
                  selectedMonthKey={selectedMonthKey}
                  selectedYear={selectedYear}
                  searchFilter={searchFilter}
                  onSelectCompass={(year) => {
                    setSelectedYear(year);
                    setLedgerHorizon('compass');
                    loadHorizonDocument('compass', selectedDateKey, selectedWeekKey, selectedMonthKey, year);
                  }}
                  onSelectMonth={(mKey) => {
                    setSelectedMonthKey(mKey);
                    const [y] = mKey.split('-').map(Number);
                    setSelectedYear(y);
                    setLedgerHorizon('monthly');
                    loadHorizonDocument('monthly', selectedDateKey, selectedWeekKey, mKey, y);
                  }}
                  onSelectWeek={(wKey) => {
                    setSelectedWeekKey(wKey);
                    setLedgerHorizon('weekly');
                    loadHorizonDocument('weekly', selectedDateKey, wKey, selectedMonthKey, selectedYear);
                  }}
                  onSelectDay={(dKey, entry) => {
                    setSelectedDateKey(dKey);
                    setLedgerHorizon('daily');
                    if (entry) selectEntry(entry);
                    else loadHorizonDocument('daily', dKey, selectedWeekKey, selectedMonthKey, selectedYear);
                  }}
                  onDeleteEntry={handleDeleteEntry}
                />
              ) : visibleSidebarList.length > 0 ? (
                visibleSidebarList.map((entry, idx) => {
                  const isActive = activeEntry?.slug === entry.slug || activeEntry?.id === entry.id;

                  // Editorial mode card
                  return (
                    <div
                      key={entry.id || entry.slug || `entry-${idx}`}
                      onClick={() => selectEntry(entry)}
                      className={`group p-2.5 rounded cursor-pointer transition-colors border relative ${
                        isActive
                          ? 'bg-[#F3EFEA] border-[#1E40AF] shadow-xs'
                          : 'border-transparent hover:bg-[#F3EFEA]/60 text-[#66615C]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] font-display uppercase tracking-widest text-[#B45309] font-bold">
                          {entry.metadata?.category || entry.entry_type?.replace('_', ' ') || 'ESSAY'}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          {entry.status === 'published' ? (
                            <span className="text-[8px] font-display uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-1 py-0.2 rounded font-bold">
                              Live
                            </span>
                          ) : (
                            <span className="text-[8px] font-display uppercase tracking-wider text-stone-600 bg-stone-200/80 px-1 py-0.2 rounded font-bold">
                              Draft
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEntry(entry);
                            }}
                            className="p-1 text-stone-400 hover:text-red-700 active:text-red-800 transition-colors cursor-pointer"
                            title="Delete this draft"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-display font-semibold text-xs text-[#1C1917] line-clamp-1 pr-4">
                        {entry.title || 'Untitled Draft'}
                      </h4>

                      <p className="text-[10px] text-[#9C9589] mt-0.5 font-sans flex items-center justify-between">
                        <span>{entry.published_at ? formatDateSafe(entry.published_at) : 'Draft'}</span>
                        {entry.slug && <span className="font-mono text-[9px] text-stone-400">/{entry.slug.substring(0, 15)}...</span>}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs font-serif text-[#9C9589] italic">
                  {searchFilter ? 'No matching entries found.' : `No entries available.`}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Center Canvas */}
        <main
          className={`flex-1 mx-auto w-full pb-48 px-1 sm:px-0 transition-all ${
            workspaceMode === 'ledger' && ledgerHorizon !== 'daily'
              ? 'max-w-5xl'
              : 'max-w-[720px]'
          }`}
        >
          {/* ========================================================= */}
          {/* WORKSPACE MODE 1: PASSION PLANNER LEDGER (4 HORIZONS) */}
          {/* ========================================================= */}
          {workspaceMode === 'ledger' && (
            <div className="space-y-6">
              {/* Dynamic Horizon Navigation Bar */}
              <LedgerHorizonNav
                activeHorizon={ledgerHorizon}
                onHorizonChange={handleHorizonChange}
                selectedDateKey={selectedDateKey}
                selectedWeekKey={selectedWeekKey}
                selectedMonthKey={selectedMonthKey}
                selectedYear={selectedYear}
                onPrevPeriod={handlePrevPeriod}
                onNextPeriod={handleNextPeriod}
                onSnapCurrent={handleSnapCurrent}
                saveStatus={saveStatus}
                monthlyGoalProgress={monthlyGoalProgress}
              />

              {/* HORIZON VIEW 1: COMPASS & ANNUAL ROADMAP */}
              {ledgerHorizon === 'compass' && (
                <CompassRoadmapView
                  metadata={(metadata as unknown) as CompassMetadata}
                  year={selectedYear}
                  onUpdateMetadata={(newMeta) => {
                    setMetadata((prev) => ({ ...prev, ...newMeta }));
                    saveCurrentDraft(newMeta);
                  }}
                />
              )}

              {/* HORIZON VIEW 2: MONTHLY HORIZON */}
              {ledgerHorizon === 'monthly' && (
                <MonthlyHorizonView
                  metadata={(metadata as unknown) as MonthlyMetadata}
                  year={selectedMonthParsed.year}
                  month={selectedMonthParsed.month}
                  monthLabel={getMonthLabel(selectedMonthParsed.year, selectedMonthParsed.month)}
                  onUpdateMetadata={(newMeta) => {
                    setMetadata((prev) => ({ ...prev, ...newMeta }));
                    saveCurrentDraft(newMeta);
                  }}
                  habitHeatmap={monthlyHabitHeatmap}
                  monthlyWins={monthlyWins}
                  onSelectDate={handleJumpToDaily}
                />
              )}

              {/* HORIZON VIEW 3: WEEKLY RHYTHM */}
              {ledgerHorizon === 'weekly' && (
                <WeeklyRhythmView
                  metadata={(metadata as unknown) as WeeklyMetadata}
                  weekKey={selectedWeekKey}
                  weekLabel={getWeekLabel(selectedWeekKey)}
                  parentGamechangerTitle={parentGamechangerTitle}
                  parentGamechangerTarget={parentGamechangerTarget}
                  onUpdateMetadata={(newMeta) => {
                    setMetadata((prev) => ({ ...prev, ...newMeta }));
                    saveCurrentDraft(newMeta);
                  }}
                  weekDates={weekDates}
                  weeklyWins={weeklyWins}
                  weeklyHabitMatrix={weeklyHabitMatrix}
                  onSelectDate={handleJumpToDaily}
                  onToggleDailyHabit={handleToggleDailyHabitFromWeek}
                />
              )}

              {/* HORIZON VIEW 4: DAILY LEDGER */}
              {ledgerHorizon === 'daily' && (
                <DailyLedgerView
                  metadata={(metadata as unknown) as DailyLedgerMetadata}
                  dateKey={selectedDateKey}
                  formattedDate={formatDateSafe(activeEntry?.created_at, new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }), {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  entries={allStudioEntries}
                  parentGamechangerTitle={parentGamechangerTitle}
                  parentWeekFocus={parentWeekFocus}
                  onUpdateMetadata={(newMeta) => {
                    setMetadata((prev) => ({ ...prev, ...newMeta }));
                    saveCurrentDraft(newMeta);
                  }}
                  onSelectMemory={(memoryEntry) => selectEntry(memoryEntry)}
                  title={title}
                  onChangeTitle={(newTitle) => {
                    setTitle(newTitle);
                    setSaveStatus('unsaved');
                  }}
                  contentHtml={contentHtml}
                  onChangeContentHtml={(newHtml) => {
                    setContentHtml(newHtml);
                    setSaveStatus('unsaved');
                  }}
                  onInsertLedgerIntoBody={handleInsertLedgerIntoBody}
                  onRecordDailyCheckIn={handleRecordDailyCheckIn}
                  onInsertPrompt={handleInsertReflectionPrompt}
                  feedbackMessage={ledgerFeedback}
                />
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* WORKSPACE MODE 2: EDITORIAL BROADSHEET CMS */}
          {/* ========================================================= */}
          {workspaceMode === 'editorial' && (
            <div className="space-y-6">
              {/* Live Status Banner */}
              {isLiveActive && activeEntry?.slug && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 font-serif rounded">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Live on Public Broadsheet.</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/${activeEntry.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-[10px] font-display font-bold uppercase tracking-wider transition-colors"
                    >
                      <span>View Live</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setIsDispatchOpen(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] rounded text-[10px] font-display font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                    >
                      <Mail className="w-3 h-3 text-[#D4AF37]" />
                      <span>Dispatch Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleUnpublishToDraft}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FAF8F5] hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-[10px] font-display font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Unpublish</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Format & Desk Taxonomy Ribbon */}
              <div className="p-4 bg-[#F3EFEA] border border-[#E5DFC5] space-y-3 rounded">
                <div>
                  <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#1C1917] mb-1.5">
                    ENTRY FORMAT &amp; LENS
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {EDITORIAL_ENTRY_TYPES.map((fmt) => {
                      const Icon = fmt.icon;
                      const isSelected = entryType === fmt.type;
                      return (
                        <button
                          key={fmt.type}
                          type="button"
                          onClick={() => handleTypeChange(fmt.type)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-display uppercase tracking-wider font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#1E40AF] text-white shadow-2xs'
                              : 'bg-[#FAF8F5] text-[#66615C] hover:text-[#1C1917] hover:bg-[#EAE4D7] border border-[#E5DFC5]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{fmt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E5DFC5]">
                  <div>
                    <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#B45309] mb-1">
                      EDITORIAL DESK
                    </label>
                    <select
                      value={selectedDesk}
                      onChange={(e) => handleDeskChange(e.target.value as DeskType)}
                      className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#E5DFC5] rounded px-2.5 py-1.5 text-[#1C1917] focus:outline-[#1E40AF]"
                    >
                      {EDITORIAL_DESKS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#1E40AF] mb-1">
                      SUB-CATEGORY
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        const cat = e.target.value as SubCategory;
                        setSelectedCategory(cat);
                        setMetadata((prev) => ({ ...prev, category: cat }));
                        setSaveStatus('unsaved');
                      }}
                      className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#E5DFC5] rounded px-2.5 py-1.5 text-[#1C1917] focus:outline-[#1E40AF]"
                    >
                      {EDITORIAL_DESKS.find((d) => d.id === selectedDesk)?.categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Cultural Review Craft Panel (Books, Comics, Records, Podcasts) */}
              <ReviewCraftPanel
                entryType={entryType}
                metadata={metadata}
                onMetadataChange={(newMeta, shouldAutoSave) => {
                  setMetadata((prev) => ({ ...prev, ...newMeta }));
                  if (shouldAutoSave) {
                    saveCurrentDraft(newMeta);
                  } else {
                    setSaveStatus('unsaved');
                  }
                }}
                onApplyTemplate={handleApplyTemplate}
                onAutoTitle={(suggested) => {
                  setTitle(suggested);
                  setSaveStatus('unsaved');
                }}
              />

              {/* Headline Input */}
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setSaveStatus('unsaved');
                }}
                placeholder={
                  entryType.includes('review')
                    ? 'Review Headline...'
                    : 'Headline of the Entry...'
                }
                className="w-full font-display font-black text-2xl sm:text-4xl text-[#1C1917] placeholder:text-[#9C9589] bg-transparent border-none outline-none py-3 mb-1 tracking-tight"
              />

              {/* Editorial Deck / SEO Subtitle Input */}
              <div className="mb-3">
                <input
                  type="text"
                  value={metadata.deck || metadata.excerpt || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMetadata((prev) => ({ ...prev, deck: val, excerpt: val }));
                    setSaveStatus('unsaved');
                  }}
                  placeholder="Editorial Deck & SEO Excerpt (renders below headline on broadsheet and in search cards)..."
                  className="w-full font-serif italic text-sm sm:text-base text-[#57534E] placeholder:text-[#A8A29E] bg-transparent border-b border-[#E5DFC5] focus:border-[#1E40AF] outline-none pb-2 transition-colors"
                />
              </div>

              {/* Broadsheet Reading Canvas */}
              <TipTapEditor
                initialContent={contentHtml}
                placeholder="Write without restraint for the broadsheet..."
                onChange={({ html }) => {
                  setContentHtml(html);
                  setSaveStatus('unsaved');
                }}
              />

              {/* Editorial Photography Accordion */}
              <EditorialPhotographyAccordion
                metadata={metadata}
                onMetadataChange={(newMeta) => {
                  setMetadata((prev) => ({ ...prev, ...newMeta }));
                  setSaveStatus('unsaved');
                }}
              />

              {/* Social Card & Search Publishing Studio */}
              <div className="pt-2">
                <SocialPublishingStudio
                  title={title}
                  slug={activeEntry?.slug || ''}
                  entryType={entryType}
                  metadata={metadata}
                  selectedDesk={selectedDesk}
                  selectedCategory={selectedCategory}
                  isLive={isLiveActive}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Promote to Public Broadsheet Modal */}
      {isPromoteOpen && (
        <PromoteModal
          isOpen={isPromoteOpen}
          onClose={() => setIsPromoteOpen(false)}
          title={title}
          contentHtml={contentHtml}
          entryType={entryType}
          metadata={{ ...metadata, desk: selectedDesk, category: selectedCategory }}
          activeEntry={activeEntry}
          onPublished={(openDispatch) => {
            setIsPromoteOpen(false);
            if (openDispatch) {
              setIsDispatchOpen(true);
            }
            const publishedItem: Entry = {
              ...(activeEntry || {}),
              id: activeEntry?.id || generateUUID(),
              title: title.trim() || 'Untitled Entry',
              body_html: contentHtml,
              entry_type: entryType,
              status: 'published',
              metadata: { ...metadata, desk: selectedDesk, category: selectedCategory, isPrivate: false },
              published_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as Entry;

            setActiveEntry(publishedItem);
            setEntryStatus('published');
            setPublishedEntries((prev) => [publishedItem, ...prev.filter((p) => p.slug !== publishedItem.slug)]);
            setDraftEntries((prev) => prev.filter((d) => d.id !== activeEntry?.id));
            setEditorialTab('published');
          }}
        />
      )}

      {/* The Dispatch Broadcast Modal */}
      {isDispatchOpen && (
        <DispatchModal
          isOpen={isDispatchOpen}
          onClose={() => setIsDispatchOpen(false)}
          title={title}
          slug={activeEntry?.slug || (title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : 'untitled')}
          kicker={metadata.kicker || 'EDITORIAL DISPATCH'}
          excerpt={metadata.excerpt || ''}
          contentHtml={contentHtml}
          publishedAt={activeEntry?.published_at || undefined}
        />
      )}

      {/* Analytics Modal */}
      {isAnalyticsOpen && (
        <AnalyticsModal
          isOpen={isAnalyticsOpen}
          onClose={() => setIsAnalyticsOpen(false)}
        />
      )}
    </div>
  );
}
