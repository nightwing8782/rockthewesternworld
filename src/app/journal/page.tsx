'use client';

import { useState, useEffect, useCallback } from 'react';
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

const ENTRY_TYPES: { type: EntryType; label: string; icon: any }[] = [
  { type: 'essay', label: 'Essay', icon: Feather },
  { type: 'thought', label: 'Reflection / Note', icon: FileEdit },
  { type: 'personal_ledger', label: 'Personal Ledger', icon: BookOpen },
  { type: 'book_review', label: 'Book Log', icon: Book },
  { type: 'comic_review', label: 'Comic Review', icon: BookOpen },
  { type: 'music_review', label: 'Record Log', icon: Music },
  { type: 'podcast_review', label: 'Podcast Log', icon: Radio },
];

export default function JournalStudioPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // Drawer / Sidebar Collapse State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Archive Lists
  const [draftEntries, setDraftEntries] = useState<Entry[]>([]);
  const [publishedEntries, setPublishedEntries] = useState<Entry[]>([]);
  const [privateEntries, setPrivateEntries] = useState<Entry[]>([]);
  const [historicalEntries, setHistoricalEntries] = useState<Entry[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'drafts' | 'private' | 'historical'>('drafts');
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
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [ledgerFeedback, setLedgerFeedback] = useState<string | null>(null);

  // Load Saved Sidebar State from LocalStorage
  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem('rww_studio_sidebar_collapsed');
      if (savedCollapsed !== null) {
        setIsSidebarOpen(savedCollapsed !== 'true');
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

  const createNewDraft = useCallback((type: EntryType = 'essay', isPrivate = false) => {
    const newDraft: Entry = {
      id: 'entry-' + Date.now(),
      user_id: user?.id || 'master-author',
      entry_type: type,
      status: isPrivate ? 'private' : 'draft',
      title: '',
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
    setActiveEntry(newDraft);
    setTitle('');
    setContentHtml('');
    setEntryType(type);
    setEntryStatus(isPrivate ? 'private' : 'draft');
    setSelectedDesk('commonwealth');
    setSelectedCategory('Dan Reads the News');
    setMetadata({ desk: 'commonwealth', category: 'Dan Reads the News', isPrivate });
    setSaveStatus('saved');
    setActiveTab(isPrivate ? 'private' : 'drafts');
  }, [user]);

  const selectEntry = (entry: Entry) => {
    setActiveEntry(entry);
    setTitle(entry.title || '');
    setContentHtml(entry.body_html || '');
    setEntryType(entry.entry_type || 'essay');
    setEntryStatus(entry.status || 'draft');
    const desk = entry.metadata?.desk || 'commonwealth';
    const cat = (entry.metadata?.category as SubCategory) || 'Dan Reads the News';
    setSelectedDesk(desk);
    setSelectedCategory(cat);
    setMetadata(entry.metadata || { desk, category: cat, isPrivate: entry.status === 'private' });
    setSaveStatus('saved');
  };

  // Load Drafts, Published, Private, and Historical Archive
  useEffect(() => {
    if (!user) return;

    // Load deleted archive slugs
    let deletedSlugs = new Set<string>();
    try {
      const stored = localStorage.getItem('rww_deleted_archive_slugs');
      if (stored) {
        deletedSlugs = new Set(JSON.parse(stored));
      }
    } catch (e) {}

    // 1. Local Drafts & Local Entries
    const savedLocal = localStorage.getItem('rww_local_entries');
    let parsedLocal: Entry[] = [];
    if (savedLocal) {
      try {
        parsedLocal = JSON.parse(savedLocal);
        const drafts = parsedLocal.filter((e) => e.status === 'draft');
        const privates = parsedLocal.filter((e) => e.status === 'private');
        setDraftEntries(drafts);
        setPrivateEntries(privates);
      } catch (e) {}
    }

    // 2. Fetch All Entries (Published, Private, Drafts) from Supabase
    try {
      const supabase = createClient();
      supabase
        .from('entries')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) {
            const pub = data.filter((e) => e.status === 'published') as Entry[];
            const priv = data.filter((e) => e.status === 'private') as Entry[];
            const drafts = data.filter((e) => e.status === 'draft') as Entry[];

            if (pub.length > 0) setPublishedEntries(pub);

            setPrivateEntries((prev) => {
              const map = new Map<string, Entry>();
              priv.forEach((p) => map.set(p.id || p.slug || '', p));
              prev.forEach((p) => {
                const key = p.id || p.slug || '';
                if (!map.has(key)) map.set(key, p);
              });
              return Array.from(map.values()).sort((a, b) => 
                new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
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
                new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime()
              );
            });

            // Update local storage cache with unified list
            try {
              const savedLocal = localStorage.getItem('rww_local_entries');
              const localList: Entry[] = savedLocal ? JSON.parse(savedLocal) : [];
              const combinedMap = new Map<string, Entry>();
              data.forEach((e: Entry) => {
                const k = e.id || e.slug || '';
                if (k) combinedMap.set(k, e);
              });
              localList.forEach((e: Entry) => {
                const k = e.id || e.slug || '';
                if (k && !combinedMap.has(k)) combinedMap.set(k, e);
              });
              localStorage.setItem('rww_local_entries', JSON.stringify(Array.from(combinedMap.values())));
            } catch (e) {}
          }
        });
    } catch (e) {}

    // 3. Fetch 341 WordPress Historical Archive (filtering out deleted)
    fetch('/archive/imported-entries.json')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          const valid = data.filter((item) => !deletedSlugs.has(item.slug || item.id));
          setHistoricalEntries(valid);
        }
      })
      .catch(() => {});

    if (parsedLocal.length > 0) {
      selectEntry(parsedLocal[0]);
    } else {
      createNewDraft();
    }
  }, [user, createNewDraft]);

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

  // Switch Status between Draft, Private, and Live
  const handleSetStatus = (newStatus: 'draft' | 'private' | 'published') => {
    if (newStatus === 'published' && entryStatus !== 'published') {
      setIsPromoteOpen(true);
      return;
    }

    setEntryStatus(newStatus);
    const isPriv = newStatus === 'private';
    setMetadata((prev) => ({ ...prev, isPrivate: isPriv }));
    setSaveStatus('unsaved');

    if (activeEntry) {
      setActiveEntry((prev) => prev ? { ...prev, status: newStatus, metadata: { ...prev.metadata, isPrivate: isPriv } } : null);
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

    // Update in Supabase
    try {
      const supabase = createClient();
      await supabase
        .from('entries')
        .update({ status: 'draft', updated_at: updated.updated_at })
        .match({ id: activeEntry.id });
    } catch (e) {}

    // Update lists
    setPublishedEntries((prev) => prev.filter((p) => p.id !== activeEntry.id && p.slug !== activeEntry.slug));
    setDraftEntries((prev) => [updated, ...prev.filter((d) => d.id !== activeEntry.id)]);

    // Update local storage
    try {
      const savedLocal = localStorage.getItem('rww_local_entries');
      let parsed: Entry[] = savedLocal ? JSON.parse(savedLocal) : [];
      parsed = [updated, ...parsed.filter((p) => p.id !== activeEntry.id)];
      localStorage.setItem('rww_local_entries', JSON.stringify(parsed));
    } catch (e) {}

    setActiveTab('drafts');
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
    
    const dateFormatted = activeEntry?.created_at
      ? new Date(activeEntry.created_at).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

    const ledgerHtml = `<blockquote><p><strong>Daily Ledger · ${dateFormatted}</strong><br/><em>Energy:</em> ${energyLabel}<br/><em>Practices:</em> Movement [${habits.movement ? '✓' : ' '}] · Reading [${habits.reading ? '✓' : ' '}] · Writing [${habits.writing ? '✓' : ' '}] · Unplug [${habits.unplug ? '✓' : ' '}]</p><p><strong>+ Bright Spot:</strong> ${triad.bright_spot || '—'}<br/><strong>△ Calibration:</strong> ${triad.calibration || '—'}<br/><strong>• Working Thought:</strong> ${triad.working_thought || '—'}</p></blockquote><p></p>`;

    setContentHtml((prev) => ledgerHtml + prev);
    setSaveStatus('unsaved');
  };

  // Explicitly Record / Save Daily Check-in with positive visual feedback
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

  // Save Current Entry (Local + Supabase)
  const saveCurrentDraft = async (explicitMeta?: Partial<EntryMetadata>, explicitTitle?: string) => {
    if (!activeEntry) return;
    setSaveStatus('saving');

    const mergedMeta: EntryMetadata = {
      ...metadata,
      ...(explicitMeta || {}),
      desk: selectedDesk,
      category: selectedCategory,
    };

    const defaultPrivateTitle = `Daily Ledger · ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    const finalTitle = (explicitTitle !== undefined ? explicitTitle : title).trim() || (mergedMeta.isPrivate || entryType === 'personal_ledger' ? defaultPrivateTitle : 'Untitled Entry');
    const updatedStatus = mergedMeta.isPrivate ? 'private' : entryStatus;
    mergedMeta.isPrivate = updatedStatus === 'private';

    const updated: Entry = {
      ...activeEntry,
      title: finalTitle,
      body_html: contentHtml,
      entry_type: entryType,
      status: updatedStatus,
      metadata: mergedMeta,
      updated_at: new Date().toISOString(),
    };

    setActiveEntry(updated);
    setMetadata(mergedMeta);
    if (!title.trim()) {
      setTitle(finalTitle);
    }

    // Save to Supabase
    try {
      const supabase = createClient();
      const payload: any = {
        id: updated.id,
        user_id: user?.id || updated.user_id || 'master-author',
        title: updated.title,
        slug: updated.slug || (updated.title ? updated.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : ('entry-' + Date.now())),
        entry_type: updated.entry_type,
        status: updated.status,
        body_html: updated.body_html,
        metadata: updated.metadata,
        published_at: updated.status === 'published' ? (updated.published_at || new Date().toISOString()) : null,
        updated_at: updated.updated_at,
        created_at: updated.created_at || new Date().toISOString(),
      };

      await supabase.from('entries').upsert(payload, { onConflict: 'id' });
    } catch (e) {}

    // Update in-memory state lists accurately
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

    // Save to LocalStorage
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

  // Comprehensive Delete Entry (Works on Drafts, Live, Private, and Archive)
  const handleDeleteEntry = async (entryToDelete: Entry) => {
    const isLive = entryToDelete.status === 'published';
    const isHistorical = activeTab === 'historical';
    const itemTitle = entryToDelete.title || 'Untitled Entry';

    const promptMessage = isLive
      ? `Permanently delete live published piece "${itemTitle}"?\n\nThis will remove it from the live broadsheet and database.`
      : isHistorical
      ? `Remove "${itemTitle}" from your historical archive view?`
      : `Permanently delete "${itemTitle}"? This cannot be undone.`;

    const confirmed = window.confirm(promptMessage);
    if (!confirmed) return;

    // 1. If in historical archive, add to deleted slugs
    if (isHistorical || entryToDelete.slug?.startsWith('wp-')) {
      const slugKey = entryToDelete.slug || entryToDelete.id;
      try {
        const stored = localStorage.getItem('rww_deleted_archive_slugs');
        let list: string[] = stored ? JSON.parse(stored) : [];
        list.push(slugKey);
        localStorage.setItem('rww_deleted_archive_slugs', JSON.stringify(list));
      } catch (e) {}
      setHistoricalEntries((prev) => prev.filter((h) => (h.slug || h.id) !== slugKey));
    }

    // 2. Delete from Supabase
    try {
      const supabase = createClient();
      if (entryToDelete.id) {
        await supabase.from('entries').delete().eq('id', entryToDelete.id);
      }
      if (entryToDelete.slug) {
        await supabase.from('entries').delete().eq('slug', entryToDelete.slug);
      }
    } catch (e) {}

    // 3. Delete from LocalStorage
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

    // 4. Update state lists
    setDraftEntries((prev) => prev.filter((d) => d.id !== entryToDelete.id && d.slug !== entryToDelete.slug));
    setPublishedEntries((prev) => prev.filter((p) => p.id !== entryToDelete.id && p.slug !== entryToDelete.slug));
    setPrivateEntries((prev) => prev.filter((p) => p.id !== entryToDelete.id && p.slug !== entryToDelete.slug));

    // 5. If active entry was deleted, select another or create new
    if (activeEntry?.id === entryToDelete.id || activeEntry?.slug === entryToDelete.slug) {
      const currentList = getVisibleList().filter((e) => e.id !== entryToDelete.id && e.slug !== entryToDelete.slug);
      if (currentList.length > 0) {
        selectEntry(currentList[0]);
      } else {
        createNewDraft();
      }
    }
  };

  // Helper to compile master combined entries
  const getAllEntriesList = useCallback(() => {
    const map = new Map<string, Entry>();
    [...publishedEntries, ...draftEntries, ...privateEntries, ...historicalEntries].forEach((e) => {
      const key = e.id || e.slug || '';
      if (key && !map.has(key)) map.set(key, e);
    });
    return Array.from(map.values()).sort((a, b) => 
      new Date(b.created_at || b.published_at || 0).getTime() - new Date(a.created_at || a.published_at || 0).getTime()
    );
  }, [publishedEntries, draftEntries, privateEntries, historicalEntries]);

  // Filter items based on active tab and search query (including Triad semantic search)
  const getVisibleList = () => {
    let list: Entry[] = [];
    if (activeTab === 'all') list = getAllEntriesList();
    else if (activeTab === 'published') list = publishedEntries;
    else if (activeTab === 'drafts') list = draftEntries;
    else if (activeTab === 'private') list = privateEntries;

    if (!searchFilter.trim()) return list;
    const q = searchFilter.toLowerCase();
    return list.filter((item) => {
      const titleMatch = (item.title || '').toLowerCase().includes(q);
      const slugMatch = (item.slug || '').toLowerCase().includes(q);
      const catMatch = (item.metadata?.category || '').toLowerCase().includes(q);
      const bodyMatch = (item.body_html || '').toLowerCase().includes(q);
      
      // Triad search matches for private ledger entries
      const brightMatch = (item.metadata?.triad?.bright_spot || item.metadata?.ledger?.triad?.bright_spot || '').toLowerCase().includes(q);
      const calibMatch = (item.metadata?.triad?.calibration || item.metadata?.ledger?.triad?.calibration || '').toLowerCase().includes(q);
      const thoughtMatch = (item.metadata?.triad?.working_thought || item.metadata?.ledger?.triad?.working_thought || '').toLowerCase().includes(q);

      return titleMatch || slugMatch || catMatch || bodyMatch || brightMatch || calibMatch || thoughtMatch;
    });
  };

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

  const isPrivateActive = entryStatus === 'private' || metadata.isPrivate;
  const isLiveActive = entryStatus === 'published' && !metadata.isPrivate;
  const visibleList = getVisibleList();

  return (
    <div className="min-h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#FAF8F5] text-[#242120] flex flex-col font-reading selection:bg-[#1E40AF] selection:text-white relative">
      {/* Studio Header */}
      <header className="border-b border-[#E5DFC5] bg-[#FAF8F5]/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Drawer Toggle Button [◧] */}
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
              <span className="hidden sm:inline">Public Broadsheet</span>
            </Link>

            <span className="text-[#B45309] text-xs">◆</span>

            <div className="flex items-center gap-1.5 text-xs font-display tracking-widest text-[#1C1917] uppercase font-bold">
              <Lock className="w-3 h-3 text-[#B45309]" />
              <span>DRAFTING ATELIER</span>
            </div>
          </div>

          {/* Interactive Status & Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Clear Status Segmented Switcher */}
            <div className="flex items-center bg-[#EAE4D7] p-0.5 rounded text-[10px] sm:text-[11px] font-display uppercase tracking-wider font-bold shrink-0">
              <button
                type="button"
                onClick={() => handleSetStatus('draft')}
                className={`px-2 sm:px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  !isPrivateActive && !isLiveActive
                    ? 'bg-[#FAF8F5] text-[#1C1917] shadow-xs'
                    : 'text-[#66615C] hover:text-[#1C1917]'
                }`}
                title="Mark as in-progress working draft"
              >
                Draft
              </button>
              <button
                type="button"
                onClick={() => handleSetStatus('private')}
                className={`px-2 sm:px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  isPrivateActive
                    ? 'bg-amber-100 text-amber-900 shadow-xs'
                    : 'text-[#66615C] hover:text-[#1C1917]'
                }`}
                title="Mark as private journal entry (shielded from public broadsheet)"
              >
                <Shield className="w-3 h-3" />
                <span>Private</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetStatus('published')}
                className={`px-2 sm:px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  isLiveActive
                    ? 'bg-emerald-100 text-emerald-900 shadow-xs'
                    : 'text-[#66615C] hover:text-[#1C1917]'
                }`}
                title="Publish to public broadsheet"
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
              <span className="hidden sm:inline">{isPrivateActive ? 'Save Private' : isLiveActive ? 'Update Live' : 'Save Draft'}</span>
              <span className="sm:hidden">Save</span>
            </button>

            {/* Promote Button (When in draft mode) */}
            {!isPrivateActive && !isLiveActive && (
              <button
                onClick={() => setIsPromoteOpen(true)}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-[#1E40AF] hover:bg-[#1D4ED8] text-white rounded text-[11px] sm:text-xs font-display uppercase tracking-widest font-bold transition-colors shadow-xs cursor-pointer shrink-0"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Promote Live</span>
                <span className="sm:hidden">Promote</span>
              </button>
            )}

            {/* Direct Dispatch Button (Visible on desktop) */}
            <button
              onClick={() => setIsDispatchOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[#44403C] hover:text-[#1E40AF] hover:bg-[#F2ECE1] transition-colors text-xs font-display uppercase tracking-wider font-bold cursor-pointer shrink-0"
              title="The Dispatch • Broadcast Newsletter to Subscribers"
            >
              <Mail className="w-3.5 h-3.5 text-[#B45309]" />
              <span>The Dispatch</span>
            </button>

            {/* Secondary Actions [•••] Overflow Dropdown Menu */}
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

      {/* Main Studio Area (Responsive Slide-over Drawer + Touch-Optimized Canvas) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-8 py-4 sm:py-6 w-full flex-1 flex gap-6 lg:gap-8 overflow-hidden">
        {/* Off-Canvas Backdrop for < 1180px */}
        {!isFocusMode && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 xl:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar Drawer (< 1180px Slide-Over Drawer; >= 1180px Inline Sidebar) */}
        {!isFocusMode && (
          <aside
            className={`shrink-0 flex flex-col gap-3.5 transition-all duration-200 bg-[#FAF8F5] ${
              isSidebarOpen
                ? 'fixed inset-y-0 left-0 z-50 w-80 shadow-2xl p-5 border-r border-[#E5DFC5] xl:static xl:z-auto xl:w-72 xl:shadow-none xl:p-0 xl:pr-6'
                : 'w-0 opacity-0 pointer-events-none pr-0 -translate-x-full xl:translate-x-0'
            }`}
          >
            {/* New Entry Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => createNewDraft('essay', false)}
                className="py-2 px-2.5 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] rounded text-[10px] font-display uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ New Draft</span>
              </button>
              <button
                onClick={() => createNewDraft('personal_ledger', true)}
                className="py-2 px-2.5 bg-[#B45309] hover:bg-[#92400E] text-[#FAF8F5] rounded text-[10px] font-display uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <BookOpen className="w-3 h-3" />
                <span>+ Daily Ledger</span>
              </button>
            </div>

            {/* Sidebar 4-Tab Navigation: All | Published | Drafts | Private / Ledger */}
            <div className="grid grid-cols-4 bg-[#EAE4D7] p-0.5 rounded text-[9px] font-display uppercase tracking-wider font-bold">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-1.5 rounded transition-colors text-center cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-[#FAF8F5] text-[#1C1917] shadow-xs'
                    : 'text-[#66615C] hover:text-[#1C1917]'
                }`}
                title="All Working & Archival Entries"
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('published')}
                className={`py-1.5 rounded transition-colors text-center cursor-pointer ${
                  activeTab === 'published'
                    ? 'bg-[#FAF8F5] text-[#1E40AF] shadow-xs'
                    : 'text-[#66615C] hover:text-[#1C1917]'
                }`}
                title="Live Published Pieces"
              >
                Published ({publishedEntries.length})
              </button>
              <button
                onClick={() => setActiveTab('drafts')}
                className={`py-1.5 rounded transition-colors text-center cursor-pointer ${
                  activeTab === 'drafts'
                    ? 'bg-[#FAF8F5] text-stone-900 shadow-xs'
                    : 'text-[#66615C] hover:text-[#1C1917]'
                }`}
                title="Working Drafts"
              >
                Drafts ({draftEntries.length})
              </button>
              <button
                onClick={() => setActiveTab('private')}
                className={`py-1.5 rounded transition-colors text-center cursor-pointer ${
                  activeTab === 'private'
                    ? 'bg-[#FAF8F5] text-[#B45309] shadow-xs'
                    : 'text-[#66615C] hover:text-[#1C1917]'
                }`}
                title="Private Entries & Daily Personal Ledgers"
              >
                Private ({privateEntries.length})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#9C9589] absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder={
                  activeTab === 'private'
                    ? 'Search reflections, bright spots, thoughts...'
                    : `Search ${activeTab}...`
                }
                className="w-full pl-8 pr-2.5 py-1.5 bg-[#FAF8F5] border border-[#E5DFC5] rounded text-xs font-serif text-[#1C1917] placeholder:text-[#9C9589] focus:outline-[#1E40AF]"
              />
            </div>

            {/* Document List with Direct Trash Action */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[calc(100vh-280px)]">
              {visibleList.length > 0 ? (
                visibleList.map((entry, idx) => {
                  const isActive = activeEntry?.slug === entry.slug || activeEntry?.id === entry.id;

                  if (activeTab === 'private' || (activeTab === 'all' && entry.status === 'private')) {
                    const entryDate = entry.created_at || entry.published_at || new Date().toISOString();
                    const formattedDate = new Date(entryDate).toLocaleDateString('en-US', {
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
                              <Lock className="w-2.5 h-2.5" />
                              <span>Private</span>
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
                          {entry.metadata?.category || entry.entry_type?.replace('_', ' ') || 'DISPATCH'}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          {entry.status === 'private' ? (
                            <span className="text-[8px] font-display uppercase tracking-wider text-amber-800 bg-amber-100/90 px-1 py-0.2 rounded font-bold flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Private</span>
                            </span>
                          ) : entry.status === 'published' ? (
                            <span className="text-[8px] font-display uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-1 py-0.2 rounded font-bold">
                              Live
                            </span>
                          ) : (
                            <span className="text-[8px] font-display uppercase tracking-wider text-stone-600 bg-stone-200/80 px-1 py-0.2 rounded font-bold">
                              Draft
                            </span>
                          )}

                          {/* Direct Trash Icon */}
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
                        {entry.title || 'Untitled Entry'}
                      </h4>

                      <p className="text-[10px] text-[#9C9589] mt-0.5 font-sans flex items-center justify-between">
                        <span>{entry.published_at ? new Date(entry.published_at).toLocaleDateString() : (entry.status === 'private' ? 'Private Journal' : 'Draft')}</span>
                        {entry.slug && <span className="font-mono text-[9px] text-stone-400">/{entry.slug.substring(0, 15)}...</span>}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs font-serif text-[#9C9589] italic">
                  {searchFilter ? 'No matching entries found.' : `No ${activeTab} available.`}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Center Editorial Writing Canvas (Hard-capped to max-w-[680px], Touch-friendly pb-48) */}
        <main className="flex-1 max-w-[680px] mx-auto w-full overflow-y-auto pb-48 px-1 sm:px-0">
          {/* Active Status Banner & Quick Action Buttons */}
          {isLiveActive && activeEntry?.slug && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 font-serif rounded">
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
                  title="Broadcast this article to subscribers via The Dispatch"
                >
                  <Mail className="w-3 h-3 text-[#D4AF37]" />
                  <span>Dispatch Email</span>
                </button>
                <button
                  type="button"
                  onClick={handleUnpublishToDraft}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FAF8F5] hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-[10px] font-display font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  title="Unpublish this article and return it to Drafts"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Unpublish</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteEntry(activeEntry)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-red-700 hover:bg-red-100 rounded text-[10px] font-display font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  title="Permanently delete from database"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {isPrivateActive && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between font-serif rounded">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Private Journal Entry (Shielded from public broadsheet).</span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteEntry(activeEntry!)}
                className="inline-flex items-center gap-1 text-red-700 hover:underline text-[10px] font-display uppercase tracking-wider font-bold cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          )}

          {!isPrivateActive && !isLiveActive && activeEntry && (
            <div className="mb-4 p-2 bg-[#F2ECE1] border border-[#DDD5C7] text-[#44403C] text-xs flex items-center justify-between font-serif rounded">
              <span className="text-[11px] italic">Editing unpublished working draft.</span>
              <button
                type="button"
                onClick={() => handleDeleteEntry(activeEntry)}
                className="inline-flex items-center gap-1 text-stone-500 hover:text-red-700 text-[10px] font-display uppercase tracking-wider font-bold cursor-pointer"
                title="Discard this draft"
              >
                <Trash2 className="w-3 h-3" />
                <span>Discard Draft</span>
              </button>
            </div>
          )}

          {/* Reflection Prompts Bar (Shown when in Private mode or reflection note) */}
          {isPrivateActive && (
            <ReflectionPromptBar
              onInsertPrompt={handleInsertReflectionPrompt}
            />
          )}

          {/* Format & Desk Taxonomy Ribbon */}
          <div className="mb-6 p-4 bg-[#F3EFEA] border border-[#E5DFC5] space-y-3 rounded">
            {/* Entry Format Selector Buttons */}
            <div>
              <label className="block text-[10px] font-display font-bold uppercase tracking-widest text-[#1C1917] mb-1.5">
                ENTRY FORMAT &amp; LENS
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ENTRY_TYPES.map((fmt) => {
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

            {/* Taxonomy Dropdowns */}
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

          {/* Structured Cultural Review Craft Panel (Comics, Books, Records, Podcasts) */}
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

          {/* Daily Personal Ledger (Active for Private entries or personal_ledger format) */}
          {(isPrivateActive || entryType === 'personal_ledger') && (
            <div className="mb-6 space-y-2.5">
              <DailyPersonalLedger
                metadata={metadata}
                entries={[...privateEntries, ...draftEntries, ...publishedEntries]}
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
                      Autosaved to confidential archive
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleInsertLedgerIntoBody}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#EAE4D7] text-[#44403C] hover:text-[#1C1917] border border-[#DDD5C7] rounded text-[11px] font-display uppercase tracking-wider font-bold transition-colors cursor-pointer shadow-2xs"
                    title="Insert formatted ledger summary into editor body"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5 text-[#B45309]" />
                    <span>Insert into Body</span>
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
          )}

          {/* Headline Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaveStatus('unsaved');
            }}
            placeholder={
              isPrivateActive
                ? "Private Journal Title / Date..."
                : entryType.includes('review')
                ? "Review Headline..."
                : "Headline of the Entry..."
            }
            className="w-full font-display font-black text-2xl sm:text-4xl text-[#1C1917] placeholder:text-[#9C9589] bg-transparent border-none outline-none py-3 mb-2 tracking-tight"
          />

          {/* TipTap Rich Text Reading Canvas */}
          <TipTapEditor
            initialContent={contentHtml}
            placeholder={
              isPrivateActive
                ? "Private, confidential notes and observations..."
                : "Write without restraint for the broadsheet..."
            }
            onChange={({ html }) => {
              setContentHtml(html);
              setSaveStatus('unsaved');
            }}
          />

          {/* Relocated Editorial Photography & Cover Art Accordion (BELOW Canvas) */}
          <EditorialPhotographyAccordion
            metadata={metadata}
            onMetadataChange={(newMeta) => {
              setMetadata((prev) => ({ ...prev, ...newMeta }));
              setSaveStatus('unsaved');
            }}
          />
        </main>
      </div>

      {/* Promote to Public Modal */}
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
              id: activeEntry?.id || ('entry-' + Date.now()),
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
            setActiveTab('published');
          }}
        />
      )}

            {/* The Dispatch Modal */}
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
