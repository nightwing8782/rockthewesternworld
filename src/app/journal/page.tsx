'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import TipTapEditor from '@/components/journal/TipTapEditor';
import ReviewCraftPanel from '@/components/journal/ReviewCraftPanel';
import ReflectionPromptBar from '@/components/journal/ReflectionPromptBar';
import EditorialPhotographyAccordion from '@/components/journal/EditorialPhotographyAccordion';
import DailyPersonalLedger from '@/components/journal/DailyPersonalLedger';
import PromoteModal from '@/components/journal/PromoteModal';
import AnalyticsModal from '@/components/journal/AnalyticsModal';
import DispatchModal from '@/components/journal/DispatchModal';
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
  Copy,
  Shield,
  Feather,
  Book,
  BookOpen,
  Music,
  Radio,
  FileEdit,
  ExternalLink,
  RotateCcw,
  Archive,
  Mail,
  ArrowDownToLine,
  Sparkles,
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

  // Top-Level Studio Workspace: 'ledger' (Personal Private Atelier) vs 'editorial' (Broadsheet Publishing)
  const [workspaceMode, setWorkspaceMode] = useState<'ledger' | 'editorial'>('ledger');

  // Drawer / Sidebar Collapse State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

  // Helper to create a fresh document
  const createNewDocument = useCallback((type: EntryType = 'essay', isPrivate = false) => {
    const formattedToday = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const defaultTitle = isPrivate || type === 'personal_ledger' ? `Daily Ledger · ${formattedToday}` : '';
    
    const newDoc: Entry = {
      id: generateUUID(),
      user_id: isValidUUID(user?.id) ? user.id : null,
      entry_type: type,
      status: isPrivate ? 'private' : 'draft',
      title: defaultTitle,
      slug: null,
      body_json: null,
      body_html: '',
      metadata: {
        desk: 'commonwealth',
        category: 'Dan Reads the News',
        isPrivate,
      },
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
    setMetadata({ desk: 'commonwealth', category: 'Dan Reads the News', isPrivate });
    setSaveStatus('saved');
  }, [user]);

  // Select an entry from list
  const selectEntry = useCallback((entry: Entry) => {
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
  }, []);

  // Switch Top-level Workspace Mode
  // Switch Top-level Workspace Mode
  const switchWorkspaceMode = (mode: 'ledger' | 'editorial') => {
    setWorkspaceMode(mode);
    try {
      localStorage.setItem('rww_studio_workspace_mode', mode);
    } catch (e) {}

    if (mode === 'ledger') {
      // Find today's ledger entry
      const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const existingLedger = privateEntries.find((e) => {
        if (!e.created_at) return false;
        const d = new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return d === todayStr || (e.title && e.title.includes(todayStr));
      });

      if (existingLedger) {
        selectEntry(existingLedger);
      } else {
        createNewDocument('personal_ledger', true);
      }
    } else {
      // Find latest working draft only (do not auto-open published broadsheet pieces)
      const latestDraft = draftEntries[0];
      if (latestDraft) {
        selectEntry(latestDraft);
      } else {
        createNewDocument('essay', false);
      }
    }
  };

  // Load Drafts, Published, and Private entries with Cross-Device Cloud Sync
  useEffect(() => {
    if (!user) return;

    // 1. Local Cache Load + Non-UUID Auto-Migration + Database Mapping
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

        // Upload any local entries to Supabase using schema-valid fields
        const supabase = createClient();
        parsedLocal.forEach(async (item) => {
          try {
            const isPriv = item.status === 'private' || item.metadata?.isPrivate;
            const payload: any = {
              id: item.id,
              title: item.title || 'Untitled Entry',
              slug: item.slug || `entry-${item.id.slice(0, 8)}`,
              entry_type: isPriv ? 'thought' : (item.entry_type || 'essay'),
              status: isPriv ? 'private_log' : (item.status || 'draft'),
              body_html: item.body_html || '',
              metadata: item.metadata || {},
              published_at: item.status === 'published' ? (item.published_at || new Date().toISOString()) : null,
              created_at: item.created_at || new Date().toISOString(),
              updated_at: item.updated_at || new Date().toISOString(),
            };
            if (isValidUUID(user?.id)) payload.user_id = user.id;
            await supabase.from('entries').upsert(payload, { onConflict: 'id' });
          } catch (err) {}
        });
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

        // Combine published entries (Supabase cloud records override static JSON)
        const publishedMap = new Map<string, Entry>();

        // 1. Add historical archive posts first
        historical.forEach((item, idx) => {
          const key = item.slug || item.id || `wp-${idx}`;
          const isPublished = item.status ? item.status === 'published' : true;
          if (isPublished) {
            publishedMap.set(key, {
              ...item,
              id: item.id || key,
              status: 'published',
            });
          }
        });

        // 2. Override with published posts from Supabase cloud
        const pubFromCloud = normalizedCloud.filter((e) => e.status === 'published');
        pubFromCloud.forEach((item) => {
          const key = item.slug || item.id;
          if (key) {
            publishedMap.set(key, item);
          }
        });

        const mergedPublished = Array.from(publishedMap.values()).sort((a, b) =>
          (safeTimestamp(b.published_at) || safeTimestamp(b.created_at)) - (safeTimestamp(a.published_at) || safeTimestamp(a.created_at))
        );

        const priv = normalizedCloud.filter((e) => e.status === 'private');
        const drafts = normalizedCloud.filter((e) => e.status === 'draft');

        setPublishedEntries(mergedPublished);

        setPrivateEntries((prev) => {
          const map = new Map<string, Entry>();
          priv.forEach((p) => map.set(p.id || p.slug || '', p));
          prev.forEach((p) => {
            const key = p.id || p.slug || '';
            if (!map.has(key)) map.set(key, p);
          });
          return Array.from(map.values()).sort((a, b) => 
            safeTimestamp(b.created_at) - safeTimestamp(a.created_at)
          );
        });

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

        // Update local storage cache with unified list
        try {
          const savedLocal = localStorage.getItem('rww_local_entries');
          const localList: Entry[] = savedLocal ? JSON.parse(savedLocal) : [];
          const combinedMap = new Map<string, Entry>();
          normalizedCloud.forEach((e: Entry) => {
            const k = e.id || e.slug || '';
            if (k) combinedMap.set(k, e);
          });
          localList.forEach((e: Entry) => {
            const k = e.id || e.slug || '';
            if (k && !combinedMap.has(k)) combinedMap.set(k, e);
          });
          localStorage.setItem('rww_local_entries', JSON.stringify(Array.from(combinedMap.values())));
        } catch (e) {}

        // Auto-select based on active workspace mode
        const savedMode = (localStorage.getItem('rww_studio_workspace_mode') || 'ledger') as 'ledger' | 'editorial';
        if (savedMode === 'ledger') {
          const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const todayLedger = priv.find((e) => {
            if (!e.created_at) return false;
            const d = new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            return d === todayStr || (e.title && e.title.includes(todayStr));
          });

          if (todayLedger) {
            selectEntry(todayLedger);
          } else {
            createNewDocument('personal_ledger', true);
          }
        } else {
          // In Editorial mode: select latest working draft if one exists, otherwise start with a fresh blank piece
          const latestDraft = drafts[0];
          if (latestDraft) {
            selectEntry(latestDraft);
          } else {
            createNewDocument('essay', false);
          }
        }
      } catch (e) {}
    };

    loadAllStudioEntries();
  }, [user, createNewDocument, selectEntry]);

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

  // Switch Status between Draft and Live in Editorial mode
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

  // Unpublish a live piece back to Draft
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

  // Insert Reflection Prompt as Blockquote into Editor
  const handleInsertReflectionPrompt = (promptText: string) => {
    const quoteHtml = `<blockquote><p><em>"${promptText}"</em></p></blockquote><p></p>`;
    setContentHtml((prev) => quoteHtml + prev);
    setSaveStatus('unsaved');
  };

  // Insert Formatted Daily Ledger into Editor Body
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

  // Explicitly Record / Save Daily Check-in with feedback
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

  // Apply Review Template
  const handleApplyTemplate = (templateHtml: string) => {
    if (!contentHtml.trim() || window.confirm('Apply review structure to canvas? (Existing text will remain beneath).')) {
      setContentHtml((prev) => templateHtml + (prev ? `<hr/>` + prev : ''));
      setSaveStatus('unsaved');
    }
  };

  // Save Current Entry to Supabase and LocalStorage
  const saveCurrentDraft = async (explicitMeta?: Partial<EntryMetadata>, explicitTitle?: string) => {
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
    const defaultTitle = isPrivate ? `Daily Ledger · ${formattedToday}` : 'Untitled Entry';
    const finalTitle = (explicitTitle !== undefined ? explicitTitle : title).trim() || defaultTitle;
    const updatedStatus: EntryStatus = isPrivate ? 'private' : entryStatus;

    const validId = isValidUUID(activeEntry.id) ? activeEntry.id : generateUUID();
    const cleanUserId = isValidUUID(user?.id) ? user.id : (isValidUUID(activeEntry.user_id) ? activeEntry.user_id : null);
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

  // Delete Entry Handler
  const handleDeleteEntry = async (entryToDelete: Entry) => {
    const isLive = entryToDelete.status === 'published';
    const isLedger = entryToDelete.status === 'private';
    const itemTitle = entryToDelete.title || (isLedger ? 'Daily Ledger' : 'Untitled Draft');

    const promptMessage = isLive
      ? `Permanently delete live published piece "${itemTitle}"?\n\nThis will remove it from the live broadsheet and database.`
      : isLedger
      ? `Delete this daily ledger entry from your private archive?`
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
        const remaining = privateEntries.filter((e) => e.id !== entryToDelete.id && e.slug !== entryToDelete.slug);
        if (remaining.length > 0) selectEntry(remaining[0]);
        else createNewDocument('personal_ledger', true);
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
                title="Personal Private Atelier (Habits, Reflections, Daily Ledger)"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Daily Ledger</span>
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

                {/* Primary Save Button */}
                <button
                  onClick={() => saveCurrentDraft()}
                  className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] rounded text-[11px] sm:text-xs font-display uppercase tracking-widest font-bold transition-colors cursor-pointer shadow-xs shrink-0"
                >
                  <Save className="w-3.5 h-3.5 text-[#E5DFC5]" />
                  <span>{isLiveActive ? 'Update Live' : 'Save Draft'}</span>
                </button>

                {/* Promote Button */}
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

                {/* Dispatch Broadcast */}
                <button
                  onClick={() => setIsDispatchOpen(true)}
                  className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[#44403C] hover:text-[#1E40AF] hover:bg-[#F2ECE1] transition-colors text-xs font-display uppercase tracking-wider font-bold cursor-pointer shrink-0"
                  title="Broadcast Newsletter to Subscribers"
                >
                  <Mail className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>The Dispatch</span>
                </button>
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
              <div>
                <button
                  onClick={() => createNewDocument('personal_ledger', true)}
                  className="w-full py-2.5 px-3 bg-[#B45309] hover:bg-[#92400E] text-[#FAF8F5] rounded text-xs font-display uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ New Daily Ledger</span>
                </button>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => createNewDocument('essay', false)}
                  className="w-full py-2.5 px-3 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] rounded text-xs font-display uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ New Broadsheet Draft</span>
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
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Ledger Archive</span>
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

            {/* Document List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[calc(100vh-280px)]">
              {visibleSidebarList.length > 0 ? (
                visibleSidebarList.map((entry, idx) => {
                  const isActive = activeEntry?.slug === entry.slug || activeEntry?.id === entry.id;

                  if (workspaceMode === 'ledger') {
                    const entryDate = entry.created_at || entry.published_at;
                    const formattedDate = formatDateSafe(entryDate, 'Recent Entry', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    const energyVal = entry.metadata?.energy || entry.metadata?.ledger?.energy;
                    const brightSpot = entry.metadata?.triad?.bright_spot || entry.metadata?.ledger?.triad?.bright_spot;
                    const habitsObj = entry.metadata?.habits || entry.metadata?.ledger?.habits || {};
                    const doneHabitsCount = Object.values(habitsObj).filter(Boolean).length;

                    const renderEnergyBadge = (energy?: string | null) => {
                      switch (energy) {
                        case 'high_focused':
                          return <span className="text-[8px] font-display uppercase tracking-wider text-amber-950 bg-amber-200/90 px-1.5 py-0.5 rounded font-bold">⚡ Focused</span>;
                        case 'high_scattered':
                          return <span className="text-[8px] font-display uppercase tracking-wider text-orange-950 bg-orange-200/90 px-1.5 py-0.5 rounded font-bold">🌀 Scattered</span>;
                        case 'low_reflective':
                          return <span className="text-[8px] font-display uppercase tracking-wider text-blue-950 bg-blue-200/90 px-1.5 py-0.5 rounded font-bold">🌱 Reflective</span>;
                        case 'low_depleted':
                          return <span className="text-[8px] font-display uppercase tracking-wider text-stone-900 bg-stone-200/90 px-1.5 py-0.5 rounded font-bold">🔋 Depleted</span>;
                        default:
                          return (
                            <span className="text-[8px] font-display uppercase tracking-wider text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                              <Shield className="w-2.5 h-2.5" />
                              <span>Ledger</span>
                            </span>
                          );
                      }
                    };

                    return (
                      <div
                        key={entry.id || entry.slug || `entry-${idx}`}
                        onClick={() => selectEntry(entry)}
                        className={`group p-2.5 rounded cursor-pointer transition-colors border relative ${
                          isActive
                            ? 'bg-[#F3EFEA] border-[#B45309] shadow-xs'
                            : 'border-transparent hover:bg-[#F3EFEA]/60 text-[#66615C]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-display uppercase tracking-wider font-bold text-[#1C1917]">
                            {formattedDate}
                          </span>
                          <div className="flex items-center gap-1">
                            {doneHabitsCount > 0 && (
                              <span className="text-[8px] font-display uppercase tracking-wider text-emerald-900 bg-emerald-100/90 border border-emerald-300/80 px-1.5 py-0.5 rounded font-bold">
                                ✓ {doneHabitsCount}/4
                              </span>
                            )}
                            {renderEnergyBadge(energyVal)}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEntry(entry);
                              }}
                              className="p-1 text-stone-400 hover:text-red-700 active:text-red-800 transition-colors cursor-pointer"
                              title="Delete this entry"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <h4 className="font-display font-semibold text-xs text-[#1C1917] line-clamp-1 pr-4">
                          {entry.title || `Check-in · ${formattedDate}`}
                        </h4>

                        {brightSpot ? (
                          <p className="line-clamp-1 italic text-xs text-stone-500 mt-1">
                            ✦ {brightSpot}
                          </p>
                        ) : (
                          <p className="line-clamp-1 italic text-xs text-stone-400 mt-1">
                            {entry.body_html?.replace(/<[^>]*>/g, '').trim() || 'No reflection recorded.'}
                          </p>
                        )}
                      </div>
                    );
                  }

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
        <main className="flex-1 max-w-[680px] mx-auto w-full pb-48 px-1 sm:px-0">
          {/* ========================================================= */}
          {/* WORKSPACE MODE 1: DAILY PERSONAL LEDGER */}
          {/* ========================================================= */}
          {workspaceMode === 'ledger' && (
            <div className="space-y-6">
              {/* Daily Personal Ledger Interactive Module */}
              <div className="space-y-2.5">
                <DailyPersonalLedger
                  metadata={metadata}
                  entries={allStudioEntries}
                  onUpdateMetadata={(newMeta) => {
                    setMetadata((prev) => ({ ...prev, ...newMeta }));
                    saveCurrentDraft(newMeta);
                  }}
                  onSelectMemory={(memoryEntry) => selectEntry(memoryEntry)}
                />

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    {ledgerFeedback ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded text-[11px] font-display uppercase tracking-wider font-bold shadow-2xs">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{ledgerFeedback}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-serif text-[#78716C] italic">
                        Autosaved to confidential cloud archive
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleInsertLedgerIntoBody}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#EAE4D7] text-[#44403C] hover:text-[#1C1917] border border-[#DDD5C7] rounded text-[11px] font-display uppercase tracking-wider font-bold transition-colors cursor-pointer shadow-2xs"
                      title="Insert formatted ledger summary into journal body"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5 text-[#B45309]" />
                      <span>Insert into Journal</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRecordDailyCheckIn}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#B45309] hover:bg-[#92400E] active:bg-[#78350F] text-[#FAF8F5] rounded text-[11px] font-display uppercase tracking-wider font-bold transition-colors cursor-pointer shadow-xs"
                      title="Save habits, energy, and reflection notes to your private ledger"
                    >
                      <Save className="w-3.5 h-3.5 text-[#FAF8F5]" />
                      <span>Record Daily Check-in</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Reflection Prompts Bar */}
              <ReflectionPromptBar
                onInsertPrompt={handleInsertReflectionPrompt}
              />

              {/* Journal Headline */}
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setSaveStatus('unsaved');
                }}
                placeholder="Daily Ledger Title / Date..."
                className="w-full font-display font-black text-2xl sm:text-3xl text-[#1C1917] placeholder:text-[#9C9589] bg-transparent border-none outline-none py-2 tracking-tight"
              />

              {/* Private Reading/Writing Canvas */}
              <TipTapEditor
                initialContent={contentHtml}
                placeholder="Private, confidential notes, working thoughts, and observations..."
                onChange={({ html }) => {
                  setContentHtml(html);
                  setSaveStatus('unsaved');
                }}
              />
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
                  if (!title.trim()) {
                    setTitle(suggested);
                    setSaveStatus('unsaved');
                  }
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
                className="w-full font-display font-black text-2xl sm:text-4xl text-[#1C1917] placeholder:text-[#9C9589] bg-transparent border-none outline-none py-3 mb-2 tracking-tight"
              />

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
