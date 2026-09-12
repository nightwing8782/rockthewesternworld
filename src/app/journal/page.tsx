'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { EntryType, Entry, EntryMetadata, EDITORIAL_DESKS, SubCategory, DeskType } from '@/types/database';
import TipTapEditor from '@/components/journal/TipTapEditor';
import MediaRibbon from '@/components/journal/MediaRibbon';
import PromoteModal from '@/components/journal/PromoteModal';
import AnalyticsModal from '@/components/journal/AnalyticsModal';
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
  FileText,
  Archive,
  ExternalLink,
} from 'lucide-react';

export default function JournalStudioPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // Archive Lists
  const [draftEntries, setDraftEntries] = useState<Entry[]>([]);
  const [publishedEntries, setPublishedEntries] = useState<Entry[]>([]);
  const [historicalEntries, setHistoricalEntries] = useState<Entry[]>([]);
  const [activeTab, setActiveTab] = useState<'drafts' | 'published' | 'historical'>('drafts');
  const [searchFilter, setSearchFilter] = useState('');

  // Active Document State
  const [activeEntry, setActiveEntry] = useState<Entry | null>(null);
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [entryType, setEntryType] = useState<EntryType>('essay');
  const [selectedDesk, setSelectedDesk] = useState<DeskType>('commonwealth');
  const [selectedCategory, setSelectedCategory] = useState<SubCategory>('Dan Reads the News');
  const [metadata, setMetadata] = useState<EntryMetadata>({});
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

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

  const createNewDraft = useCallback(() => {
    const newDraft: Entry = {
      id: 'draft-' + Date.now(),
      user_id: user?.id || 'master-author',
      entry_type: 'essay',
      status: 'draft',
      title: '',
      slug: null,
      body_json: null,
      body_html: '',
      metadata: {
        desk: 'commonwealth',
        category: 'Dan Reads the News',
      },
      published_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setActiveEntry(newDraft);
    setTitle('');
    setContentHtml('');
    setEntryType('essay');
    setSelectedDesk('commonwealth');
    setSelectedCategory('Dan Reads the News');
    setMetadata({ desk: 'commonwealth', category: 'Dan Reads the News' });
    setSaveStatus('saved');
    setActiveTab('drafts');
  }, [user]);

  const selectEntry = (entry: Entry) => {
    setActiveEntry(entry);
    setTitle(entry.title || '');
    setContentHtml(entry.body_html || '');
    setEntryType(entry.entry_type || 'essay');
    const desk = entry.metadata?.desk || 'commonwealth';
    const cat = (entry.metadata?.category as SubCategory) || 'Dan Reads the News';
    setSelectedDesk(desk);
    setSelectedCategory(cat);
    setMetadata(entry.metadata || { desk, category: cat });
    setSaveStatus('saved');
  };

  // Load Drafts, Published, and Historical Archive
  useEffect(() => {
    if (!user) return;

    // 1. Local Drafts
    const savedDrafts = localStorage.getItem('rww_local_entries');
    let parsedDrafts: Entry[] = [];
    if (savedDrafts) {
      try {
        parsedDrafts = JSON.parse(savedDrafts).filter((e: Entry) => e.status !== 'published');
        setDraftEntries(parsedDrafts);
      } catch (e) {}
    }

    // 2. Fetch Live Published from Supabase
    try {
      const supabase = createClient();
      supabase
        .from('entries')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .then(({ data }) => {
          if (data) setPublishedEntries(data as Entry[]);
        });
    } catch (e) {}

    // 3. Fetch 341 WordPress Historical Archive
    fetch('/archive/imported-entries.json')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setHistoricalEntries(data);
        }
      })
      .catch(() => {});

    if (parsedDrafts.length > 0) {
      selectEntry(parsedDrafts[0]);
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

  const saveCurrentDraft = async () => {
    if (!activeEntry) return;
    setSaveStatus('saving');

    const isCurrentlyPublished = activeEntry.status === 'published';

    const updated: Entry = {
      ...activeEntry,
      title: title.trim() || 'Untitled Broadside',
      body_html: contentHtml,
      entry_type: entryType,
      metadata: {
        ...metadata,
        desk: selectedDesk,
        category: selectedCategory,
      },
      updated_at: new Date().toISOString(),
    };

    setActiveEntry(updated);

    if (isCurrentlyPublished) {
      // Save directly to Supabase
      try {
        const supabase = createClient();
        await supabase.from('entries').upsert({
          title: updated.title,
          slug: updated.slug,
          entry_type: updated.entry_type,
          status: 'published',
          body_html: updated.body_html,
          metadata: updated.metadata,
          published_at: updated.published_at || new Date().toISOString(),
          updated_at: updated.updated_at,
        }, { onConflict: 'slug' });

        setPublishedEntries((prev) => {
          const idx = prev.findIndex((e) => e.slug === updated.slug || e.id === updated.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updated;
            return next;
          }
          return [updated, ...prev];
        });
      } catch (e) {}
    } else {
      // Save to local drafts
      const existingIndex = draftEntries.findIndex((e) => e.id === updated.id);
      let newDrafts = [];
      if (existingIndex >= 0) {
        newDrafts = [...draftEntries];
        newDrafts[existingIndex] = updated;
      } else {
        newDrafts = [updated, ...draftEntries];
      }
      setDraftEntries(newDrafts);
      localStorage.setItem('rww_local_entries', JSON.stringify(newDrafts));
    }

    setTimeout(() => setSaveStatus('saved'), 400);
  };

  const deleteCurrentDraft = () => {
    if (!activeEntry) return;
    const remaining = draftEntries.filter((e) => e.id !== activeEntry.id);
    setDraftEntries(remaining);
    localStorage.setItem('rww_local_entries', JSON.stringify(remaining));
    if (remaining.length > 0) {
      selectEntry(remaining[0]);
    } else {
      createNewDraft();
    }
  };

  // Filter items based on active tab and search query
  const getVisibleList = () => {
    let list: Entry[] = [];
    if (activeTab === 'drafts') list = draftEntries;
    else if (activeTab === 'published') list = publishedEntries;
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
              className="w-full py-2.5 px-4 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] text-xs font-display uppercase tracking-widest font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
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

  const visibleList = getVisibleList();

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#242120] flex flex-col font-reading selection:bg-[#1E40AF] selection:text-white">
      {/* Studio Header */}
      <header className="border-b border-[#E5DFC5] bg-[#FAF8F5]/90 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-[0.2em] text-[#66615C] hover:text-[#1E40AF] transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Public Broadsheet</span>
            </Link>

            <span className="text-[#B45309] text-xs">◆</span>

            <div className="flex items-center gap-1.5 text-xs font-display tracking-widest text-[#1C1917] uppercase font-bold">
              <Lock className="w-3 h-3 text-[#B45309]" />
              <span>DRAFTING ATELIER</span>
            </div>

            {activeEntry?.status === 'published' && (
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-display uppercase tracking-wider font-bold">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                <span>Live Broadside</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-display uppercase tracking-widest text-[#66615C]">
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Unsaved'}
            </span>

            <button
              onClick={() => setIsAnalyticsOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[#44403C] hover:text-[#1E40AF] hover:bg-[#F2ECE1] transition-colors text-xs font-display uppercase tracking-wider font-bold"
              title="View Umami Analytics"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#1E40AF]" />
              <span className="hidden sm:inline">Analytics</span>
            </button>

            <button
              onClick={() => setIsFocusMode(!isFocusMode)}
              className="p-1.5 rounded text-[#66615C] hover:text-[#1E40AF] hover:bg-[#F3EFEA] transition-colors"
              title={isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
            >
              {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={saveCurrentDraft}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F3EFEA] hover:bg-[#E5DFC5] text-[#1C1917] rounded text-xs font-display uppercase tracking-widest font-bold transition-colors"
            >
              <Save className="w-3.5 h-3.5 text-[#B45309]" />
              <span>Save</span>
            </button>

            <button
              onClick={() => setIsPromoteOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1E40AF] hover:bg-[#1D4ED8] text-white rounded text-xs font-display uppercase tracking-widest font-bold transition-colors shadow-xs"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{activeEntry?.status === 'published' ? 'Update Live' : 'Promote'}</span>
            </button>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 p-1.5 rounded text-[#66615C] hover:text-[#B45309] hover:bg-[#F3EFEA] transition-colors text-[11px] font-display uppercase tracking-wider"
              title={'Signed in. Click to Lock / Sign Out'}
            >
              <Lock className="w-3.5 h-3.5 text-[#B45309]" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 w-full flex-1 flex gap-8">
        {/* Left Sidebar (hidden in focus mode) */}
        {!isFocusMode && (
          <aside className="w-72 shrink-0 hidden md:flex flex-col gap-3.5 border-r border-[#E5DFC5] pr-6">
            <button
              onClick={createNewDraft}
              className="w-full py-2.5 px-3 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] rounded text-xs font-display uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Blank Dispatch</span>
            </button>

            {/* Sidebar Tabs: Drafts | Published | Historical Archive */}
            <div className="grid grid-cols-3 bg-[#EAE4D7] p-0.5 rounded text-[10px] font-display uppercase tracking-wider font-bold">
              <button
                onClick={() => setActiveTab('drafts')}
                className={'py-1.5 rounded transition-colors ' + (
                  activeTab === 'drafts'
                    ? 'bg-[#FAF8F5] text-[#1C1917] shadow-xs'
                    : 'text-[#66615C] hover:text-[#1C1917]'
                )}
              >
                Drafts ({draftEntries.length})
              </button>
              <button
                onClick={() => setActiveTab('published')}
                className={'py-1.5 rounded transition-colors ' + (
                  activeTab === 'published'
                    ? 'bg-[#FAF8F5] text-[#1E40AF] shadow-xs'
                    : 'text-[#66615C] hover:text-[#1C1917]'
                )}
              >
                Live ({publishedEntries.length})
              </button>
              <button
                onClick={() => setActiveTab('historical')}
                className={'py-1.5 rounded transition-colors ' + (
                  activeTab === 'historical'
                    ? 'bg-[#FAF8F5] text-[#B45309] shadow-xs'
                    : 'text-[#66615C] hover:text-[#1C1917]'
                )}
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
                placeholder={'Search ' + activeTab + '...'}
                className="w-full pl-8 pr-2.5 py-1.5 bg-[#FAF8F5] border border-[#E5DFC5] rounded text-xs font-serif text-[#1C1917] placeholder:text-[#9C9589] focus:outline-[#1E40AF]"
              />
            </div>

            {/* Document List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[calc(100vh-280px)]">
              {visibleList.length > 0 ? (
                visibleList.map((entry, idx) => (
                  <div
                    key={entry.id || entry.slug || ('entry-' + idx)}
                    onClick={() => selectEntry(entry)}
                    className={'p-2.5 rounded cursor-pointer transition-colors border ' + (
                      activeEntry?.slug === entry.slug || activeEntry?.id === entry.id
                        ? 'bg-[#F3EFEA] border-[#1E40AF] shadow-xs'
                        : 'border-transparent hover:bg-[#F3EFEA]/60 text-[#66615C]'
                    )}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] font-display uppercase tracking-widest text-[#B45309] font-bold">
                        {entry.metadata?.category || entry.entry_type?.replace('_', ' ') || 'DISPATCH'}
                      </span>
                      {entry.status === 'published' ? (
                        <span className="text-[8px] font-display uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-1 py-0.2 rounded font-bold">
                          Live
                        </span>
                      ) : (
                        <span className="text-[8px] font-display uppercase tracking-wider text-amber-700 bg-amber-100/80 px-1 py-0.2 rounded font-bold">
                          Draft
                        </span>
                      )}
                    </div>

                    <h4 className="font-display font-semibold text-xs text-[#1C1917] line-clamp-1">
                      {entry.title || 'Untitled Broadside'}
                    </h4>

                    <p className="text-[10px] text-[#9C9589] mt-0.5 font-sans flex items-center justify-between">
                      <span>{entry.published_at ? new Date(entry.published_at).toLocaleDateString() : 'Draft'}</span>
                      {entry.slug && <span className="font-mono text-[9px] text-stone-400">/{entry.slug.substring(0, 15)}...</span>}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs font-serif text-[#9C9589] italic">
                  {searchFilter ? 'No matching dispatches found.' : ('No ' + activeTab + ' available.')}
                </div>
              )}
            </div>

            {activeEntry && activeTab === 'drafts' && (
              <button
                onClick={deleteCurrentDraft}
                className="text-xs text-stone-400 hover:text-red-700 flex items-center gap-1.5 pt-2 border-t border-[#E5DFC5] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Discard Active Draft</span>
              </button>
            )}
          </aside>
        )}

        {/* Center Editorial Writing Canvas (Hard-capped to max-w-[680px]) */}
        <main className="flex-1 max-w-[680px] mx-auto w-full">
          {/* Active Status Banner */}
          {activeEntry?.status === 'published' && activeEntry.slug && (
            <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between font-serif">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Editing Live Broadside. Saving will immediately update this published article.</span>
              </div>
              <Link
                href={'/' + activeEntry.slug}
                target="_blank"
                className="inline-flex items-center gap-1 text-[11px] font-display font-bold uppercase tracking-wider text-[#1E40AF] hover:underline shrink-0"
              >
                <span>View Live</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Taxonomy & Desk Selector */}
          <div className="mb-6 p-4 bg-[#F3EFEA] border border-[#E5DFC5] grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          {/* Media Lookup Ribbon for Reviews */}
          <MediaRibbon
            entryType={entryType}
            onTypeChange={(t) => setEntryType(t)}
            metadata={metadata}
            onMetadataChange={(newMeta) => {
              setMetadata((prev) => ({ ...prev, ...newMeta }));
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
            placeholder="Headline of the Broadside..."
            className="w-full font-display font-black text-2xl sm:text-4xl text-[#1C1917] placeholder:text-[#9C9589] bg-transparent border-none outline-none py-3 mb-2 tracking-tight"
          />

          {/* TipTap Rich Text Reading Canvas */}
          <TipTapEditor
            initialContent={contentHtml}
            onChange={({ html }) => {
              setContentHtml(html);
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
          onPublished={() => {
            setIsPromoteOpen(false);
            // Move from drafts to published
            const publishedItem: Entry = {
              ...(activeEntry || {}),
              id: activeEntry?.id || ('entry-' + Date.now()),
              title,
              body_html: contentHtml,
              entry_type: entryType,
              status: 'published',
              metadata: { ...metadata, desk: selectedDesk, category: selectedCategory },
              published_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as Entry;

            setActiveEntry(publishedItem);
            setPublishedEntries((prev) => [publishedItem, ...prev.filter((p) => p.slug !== publishedItem.slug)]);
            setDraftEntries((prev) => prev.filter((d) => d.id !== activeEntry?.id));
            localStorage.setItem(
              'rww_local_entries',
              JSON.stringify(draftEntries.filter((d) => d.id !== activeEntry?.id))
            );
            setActiveTab('published');
          }}
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
