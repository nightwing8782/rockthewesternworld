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
} from 'lucide-react';

const ENTRY_TYPES: { type: EntryType; label: string; icon: any }[] = [
  { type: 'essay', label: 'Essay', icon: Feather },
  { type: 'thought', label: 'Reflection / Note', icon: FileEdit },
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
  const [activeTab, setActiveTab] = useState<'drafts' | 'published' | 'private' | 'historical'>('drafts');
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

    // 2. Fetch Live Published & Remote Privates from Supabase
    try {
      const supabase = createClient();
      supabase
        .from('entries')
        .select('*')
        .order('published_at', { ascending: false })
        .then(({ data }) => {
          if (data) {
            const pub = data.filter((e) => e.status === 'published') as Entry[];
            const priv = data.filter((e) => e.status === 'private') as Entry[];
            if (pub.length > 0) setPublishedEntries(pub);
            if (priv.length > 0) {
              setPrivateEntries((prev) => {
                const map = new Map<string, Entry>();
                priv.forEach((p) => map.set(p.id || p.slug || '', p));
                prev.forEach((p) => {
                  const key = p.id || p.slug || '';
                  if (!map.has(key)) map.set(key, p);
                });
                return Array.from(map.values());
              });
            }
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

  // Apply Review Template
  const handleApplyTemplate = (templateHtml: string) => {
    if (!contentHtml.trim() || window.confirm('Apply review structure to canvas? (Existing text will remain beneath).')) {
      setContentHtml((prev) => templateHtml + (prev ? `<hr/>` + prev : ''));
      setSaveStatus('unsaved');
    }
  };

  // Save Current Entry (Local + Supabase)
  const saveCurrentDraft = async () => {
    if (!activeEntry) return;
    setSaveStatus('saving');

    const updatedStatus = metadata.isPrivate ? 'private' : entryStatus;

    const updated: Entry = {
      ...activeEntry,
      title: title.trim() || 'Untitled Entry',
      body_html: contentHtml,
      entry_type: entryType,
      status: updatedStatus,
      metadata: {
        ...metadata,
        desk: selectedDesk,
        category: selectedCategory,
        isPrivate: updatedStatus === 'private',
      },
      updated_at: new Date().toISOString(),
    };

    setActiveEntry(updated);

    // Save to Supabase
    try {
      const supabase = createClient();
      await supabase.from('entries').upsert({
        id: updated.id,
        title: updated.title,
        slug: updated.slug || (updated.title ? updated.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : null),
        entry_type: updated.entry_type,
        status: updated.status,
        body_html: updated.body_html,
        metadata: updated.metadata,
        published_at: updated.status === 'published' ? (updated.published_at || new Date().toISOString()) : null,
        updated_at: updated.updated_at,
      }, { onConflict: 'slug' });

      if (updated.status === 'published') {
        setPublishedEntries((prev) => {
          const idx = prev.findIndex((e) => e.slug === updated.slug || e.id === updated.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updated;
            return next;
          }
          return [updated, ...prev];
        });
      } else if (updated.status === 'private') {
        setPrivateEntries((prev) => {
          const idx = prev.findIndex((e) => e.id === updated.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updated;
            return next;
          }
          return [updated, ...prev];
        });
      } else if (updated.status === 'draft') {
        setDraftEntries((prev) => {
          const idx = prev.findIndex((e) => e.id === updated.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updated;
            return next;
          }
          return [updated, ...prev];
        });
      }
    } catch (e) {}

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

      setDraftEntries(parsed.filter((e) => e.status === 'draft'));
      setPrivateEntries(parsed.filter((e) => e.status === 'private'));
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

  // Filter items based on active tab and search query
  const getVisibleList = () => {
    let list: Entry[] = [];
    if (activeTab === 'drafts') list = draftEntries;
    else if (activeTab === 'published') list = publishedEntries;
    else if (activeTab === 'private') list = privateEntries;
    else if (activeTab === 'historical') list = historicalEntries;

    if (!searchFilter.trim()) return list;
    const q = searchFilter.toLowerCase();
    return list.filter(
      (item) =>
        (item.title || '').toLowerCase().includes(q) ||
        (item.slug || '').toLowerCase().includes(q) ||
        (item.metadata?.category || '').toLowerCase().includes(q)
    );
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
    <div className="min-h-screen bg-[#FAF8F5] text-[#242120] flex flex-col font-reading selection:bg-[#1E40AF] selection:text-white">
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
          <div className="flex items-center gap-2.5">
            {/* Clear Status Segmented Switcher */}
            <div className="flex items-center bg-[#EAE4D7] p-0.5 rounded text-[11px] font-display uppercase tracking-wider font-bold">
              <button
                type="button"
                onClick={() => handleSetStatus('draft')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
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
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
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
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
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

            <span className="hidden lg:inline text-[11px] font-display uppercase tracking-widest text-[#66615C]">
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Unsaved'}
            </span>

            <button
              onClick={() => setIsDispatchOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[#44403C] hover:text-[#1E40AF] hover:bg-[#F2ECE1] transition-colors text-xs font-display uppercase tracking-wider font-bold cursor-pointer"
              title="The Dispatch • Broadcast Newsletter to Subscribers"
            >
              <Mail className="w-3.5 h-3.5 text-[#B45309]" />
              <span className="hidden sm:inline">The Dispatch</span>
            </button>

            <button
              onClick={() => setIsAnalyticsOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[#44403C] hover:text-[#1E40AF] hover:bg-[#F2ECE1] transition-colors text-xs font-display uppercase tracking-wider font-bold cursor-pointer"
              title="View Umami Analytics"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#1E40AF]" />
              <span className="hidden sm:inline">Analytics</span>
            </button>

            <button
              onClick={() => setIsFocusMode(!isFocusMode)}
              className="p-1.5 rounded text-[#66615C] hover:text-[#1E40AF] hover:bg-[#F3EFEA] transition-colors cursor-pointer"
              title={isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
            >
              {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Save Button */}
            <button
              onClick={saveCurrentDraft}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] rounded text-xs font-display uppercase tracking-widest font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-[#E5DFC5]" />
              <span>{isPrivateActive ? 'Save Private' : isLiveActive ? 'Update Live' : 'Save Draft'}</span>
            </button>

            {/* Promote Button (When in draft mode) */}
            {!isPrivateActive && !isLiveActive && (
              <button
                onClick={() => setIsPromoteOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1E40AF] hover:bg-[#1D4ED8] text-white rounded text-xs font-display uppercase tracking-widest font-bold transition-colors shadow-xs cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Promote Live</span>
              </button>
            )}

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 p-1.5 rounded text-[#66615C] hover:text-[#B45309] hover:bg-[#F3EFEA] transition-colors text-[11px] font-display uppercase tracking-wider cursor-pointer"
              title={`Signed in as ${user?.email || 'Author'}. Click to Lock / Sign Out`}
            >
              <Lock className="w-3.5 h-3.5 text-[#B45309]" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 w-full flex-1 flex gap-8">
        {/* Left Sidebar Drawer */}
        {!isFocusMode && (
          <aside
            className={`shrink-0 flex flex-col gap-3.5 transition-all duration-200 overflow-hidden ${
              isSidebarOpen ? 'w-72 border-r border-[#E5DFC5] pr-6' : 'w-0 opacity-0 pointer-events-none pr-0'
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
                onClick={() => createNewDraft('thought', true)}
                className="py-2 px-2.5 bg-[#B45309] hover:bg-[#92400E] text-[#FAF8F5] rounded text-[10px] font-display uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Shield className="w-3 h-3" />
                <span>+ New Private</span>
              </button>
            </div>

            {/* Sidebar 4-Tab Navigation: Drafts | Live | Private | Archive */}
            <div className="grid grid-cols-4 bg-[#EAE4D7] p-0.5 rounded text-[9px] font-display uppercase tracking-wider font-bold">
              <button
                onClick={() => setActiveTab('drafts')}
                className={`py-1.5 rounded transition-colors text-center cursor-pointer ${
                  activeTab === 'drafts'
                    ? 'bg-[#FAF8F5] text-[#1C1917] shadow-xs'
                    : 'text-[#66615C] hover:text-[#1C1917]'
                }`}
                title="Working Drafts"
              >
                Drafts ({draftEntries.length})
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
                Live ({publishedEntries.length})
              </button>
              <button
                onClick={() => setActiveTab('private')}
                className={`py-1.5 rounded transition-colors text-center cursor-pointer ${
                  activeTab === 'private'
                    ? 'bg-[#FAF8F5] text-[#B45309] shadow-xs'
                    : 'text-[#66615C] hover:text-[#1C1917]'
                }`}
                title="Private Entries (Never Published)"
              >
                Private ({privateEntries.length})
              </button>
              <button
                onClick={() => setActiveTab('historical')}
                className={`py-1.5 rounded transition-colors text-center cursor-pointer ${
                  activeTab === 'historical'
                    ? 'bg-[#FAF8F5] text-stone-800 shadow-xs'
                    : 'text-[#66615C] hover:text-[#1C1917]'
                }`}
                title="Historical 341 WordPress Archive"
              >
                Archive ({historicalEntries.length})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#9C9589] absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full pl-8 pr-2.5 py-1.5 bg-[#FAF8F5] border border-[#E5DFC5] rounded text-xs font-serif text-[#1C1917] placeholder:text-[#9C9589] focus:outline-[#1E40AF]"
              />
            </div>

            {/* Document List with Direct Trash Action */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[calc(100vh-280px)]">
              {visibleList.length > 0 ? (
                visibleList.map((entry, idx) => {
                  const isActive = activeEntry?.slug === entry.slug || activeEntry?.id === entry.id;
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
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-400 hover:text-red-700 transition-opacity cursor-pointer"
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

        {/* Center Editorial Writing Canvas (Hard-capped to max-w-[680px]) */}
        <main className="flex-1 max-w-[680px] mx-auto w-full">
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
            onMetadataChange={(newMeta) => {
              setMetadata((prev) => ({ ...prev, ...newMeta }));
              setSaveStatus('unsaved');
            }}
            onApplyTemplate={handleApplyTemplate}
            onAutoTitle={(suggested) => {
              if (!title.trim()) setTitle(suggested);
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
