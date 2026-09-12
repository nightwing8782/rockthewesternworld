'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { EntryType, Entry, EntryMetadata, EDITORIAL_DESKS, SubCategory, DeskType } from '@/types/database';
import TipTapEditor from '@/components/journal/TipTapEditor';
import MediaRibbon from '@/components/journal/MediaRibbon';
import PromoteModal from '@/components/journal/PromoteModal';
import AuthModal from '@/components/journal/AuthModal';
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
} from 'lucide-react';

export default function JournalStudioPage() {
  const [user, setUser] = useState<any>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [activeEntry, setActiveEntry] = useState<Entry | null>(null);
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [entryType, setEntryType] = useState<EntryType>('essay');
  const [selectedDesk, setSelectedDesk] = useState<DeskType>('commonwealth');
  const [selectedCategory, setSelectedCategory] = useState<SubCategory>('Dan Reads the News');
  const [metadata, setMetadata] = useState<EntryMetadata>({});
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  const handleDeskChange = (deskId: DeskType) => {
    setSelectedDesk(deskId);
    const desk = EDITORIAL_DESKS.find((d) => d.id === deskId);
    if (desk && desk.categories.length > 0) {
      setSelectedCategory(desk.categories[0]);
    }
  };

  const createNewDraft = useCallback(() => {
    const newDraft: Entry = {
      id: 'draft-' + Date.now(),
      user_id: user?.id || 'local-author',
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
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem('rww_local_entries');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setEntries(parsed);
        if (parsed.length > 0) {
          selectEntry(parsed[0]);
          return;
        }
      } catch (e) {}
    }
    createNewDraft();
  }, [createNewDraft]);

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

  const saveCurrentDraft = () => {
    if (!activeEntry) return;
    setSaveStatus('saving');

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
    const existingIndex = entries.findIndex((e) => e.id === updated.id);
    let newEntries = [];
    if (existingIndex >= 0) {
      newEntries = [...entries];
      newEntries[existingIndex] = updated;
    } else {
      newEntries = [updated, ...entries];
    }
    setEntries(newEntries);
    localStorage.setItem('rww_local_entries', JSON.stringify(newEntries));
    setTimeout(() => setSaveStatus('saved'), 400);
  };

  const deleteCurrentDraft = () => {
    if (!activeEntry) return;
    const remaining = entries.filter((e) => e.id !== activeEntry.id);
    setEntries(remaining);
    localStorage.setItem('rww_local_entries', JSON.stringify(remaining));
    if (remaining.length > 0) {
      selectEntry(remaining[0]);
    } else {
      createNewDraft();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#242120] flex flex-col font-reading selection:bg-[#1E40AF] selection:text-white">
      {/* Studio Header */}
      <header className="border-b border-[#E5DFC5] bg-[#FAF8F5]/90 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-[0.2em] text-[#66615C] hover:text-[#1E40AF] transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Public Broadsheet</span>
            </Link>

            <span className="text-[#B45309] text-xs">◆</span>

            <div className="flex items-center gap-1.5 text-xs font-display tracking-widest text-[#1C1917] uppercase font-bold">
              <Lock className="w-3 h-3 text-[#B45309]" />
              <span>DRAFTING ATELIER</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
              <span>Promote</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Area */}
      <div className="max-w-6xl mx-auto px-6 sm:px-12 py-6 w-full flex-1 flex gap-8">
        {/* Left Sidebar (hidden in focus mode) */}
        {!isFocusMode && (
          <aside className="w-64 shrink-0 hidden md:flex flex-col gap-4 border-r border-[#E5DFC5] pr-6">
            <button
              onClick={createNewDraft}
              className="w-full py-2 px-3 border border-dashed border-[#B45309] text-[#B45309] hover:bg-[#F3EFEA] rounded text-xs font-display uppercase tracking-widest font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Dispatch</span>
            </button>

            {/* Drafts List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              <div className="text-[10px] font-display uppercase tracking-[0.2em] text-[#66615C] font-bold pb-1 border-b border-[#E5DFC5]">
                DRAFT ARCHIVE
              </div>
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => selectEntry(entry)}
                  className={`p-2.5 rounded cursor-pointer transition-colors ${
                    activeEntry?.id === entry.id
                      ? 'bg-[#F3EFEA] border-l-2 border-[#1E40AF]'
                      : 'hover:bg-[#F3EFEA]/50 text-[#66615C]'
                  }`}
                >
                  <div className="text-[10px] font-display uppercase tracking-widest text-[#B45309] mb-0.5">
                    {entry.metadata?.category || entry.entry_type}
                  </div>
                  <h4 className="font-display font-semibold text-xs text-[#1C1917] line-clamp-1">
                    {entry.title || 'Untitled Draft'}
                  </h4>
                  <p className="text-[10px] text-[#9C9589] mt-0.5 font-sans">
                    {new Date(entry.updated_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>

            {activeEntry && (
              <button
                onClick={deleteCurrentDraft}
                className="text-xs text-stone-400 hover:text-red-700 flex items-center gap-1.5 pt-2 border-t border-[#E5DFC5] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Discard Draft</span>
              </button>
            )}
          </aside>
        )}

        {/* Center Editorial Writing Canvas (Hard-capped to max-w-[680px]) */}
        <main className="flex-1 max-w-[680px] mx-auto w-full">
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
            saveCurrentDraft();
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

      {/* Auth Modal */}
      {isAuthOpen && (
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onAuthenticated={(u: any) => setUser(u)}
          onContinueOffline={() => setIsAuthOpen(false)}
        />
      )}
    </div>
  );
}
