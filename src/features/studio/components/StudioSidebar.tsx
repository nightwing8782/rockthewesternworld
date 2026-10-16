'use client';

import React from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { Entry, EntryType } from '@/types/database';

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

export interface StudioSidebarProps {
  isSidebarOpen: boolean;
  draftEntries: Entry[];
  publishedEntries: Entry[];
  activeEntry: Entry | null;
  editorialTab: 'drafts' | 'published' | 'all';
  onTabChange: (tab: 'drafts' | 'published' | 'all') => void;
  searchFilter: string;
  onSearchChange: (q: string) => void;
  onNewDraft: (type?: EntryType) => void;
  onSelectEntry: (entry: Entry) => void;
  onDeleteEntry: (entry: Entry) => void;
}

export function StudioSidebar({
  isSidebarOpen,
  draftEntries,
  publishedEntries,
  activeEntry,
  editorialTab,
  onTabChange,
  searchFilter,
  onSearchChange,
  onNewDraft,
  onSelectEntry,
  onDeleteEntry,
}: StudioSidebarProps) {
  const visibleList = React.useMemo(() => {
    let list: Entry[] = [];
    if (editorialTab === 'drafts') list = draftEntries;
    else if (editorialTab === 'published') list = publishedEntries;
    else list = [...draftEntries, ...publishedEntries];

    if (!searchFilter.trim()) return list;
    const q = searchFilter.toLowerCase();
    return list.filter((item) => {
      const titleMatch = (item.title || '').toLowerCase().includes(q);
      const catMatch = (item.metadata?.category || '').toLowerCase().includes(q);
      const bodyMatch = (item.body_html || '').toLowerCase().includes(q);
      return titleMatch || catMatch || bodyMatch;
    });
  }, [editorialTab, draftEntries, publishedEntries, searchFilter]);

  return (
    <aside
      className={`shrink-0 flex flex-col gap-3.5 transition-all duration-200 bg-[#FAF8F5] ${
        isSidebarOpen
          ? 'fixed inset-y-0 left-0 z-50 w-80 shadow-2xl p-5 border-r border-[#E5DFC5] overflow-y-auto xl:sticky xl:top-16 xl:max-h-[calc(100vh-5rem)] xl:z-auto xl:w-72 xl:shadow-none xl:p-0 xl:pr-6'
          : 'w-0 opacity-0 pointer-events-none pr-0 -translate-x-full xl:translate-x-0'
      }`}
    >
      <div>
        <button
          type="button"
          onClick={() => onNewDraft('essay')}
          className="w-full py-2.5 px-3 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] rounded-xl text-xs font-display uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Broadsheet Draft</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 bg-[#EAE4D7] p-0.5 rounded text-[9px] font-display uppercase tracking-wider font-bold">
        <button
          type="button"
          onClick={() => onTabChange('drafts')}
          className={`py-1.5 rounded transition-colors text-center cursor-pointer ${
            editorialTab === 'drafts'
              ? 'bg-[#FAF8F5] text-stone-900 shadow-xs'
              : 'text-[#66615C] hover:text-[#1C1917]'
          }`}
        >
          Drafts ({draftEntries.length})
        </button>
        <button
          type="button"
          onClick={() => onTabChange('published')}
          className={`py-1.5 rounded transition-colors text-center cursor-pointer ${
            editorialTab === 'published'
              ? 'bg-[#FAF8F5] text-[#1E40AF] shadow-xs'
              : 'text-[#66615C] hover:text-[#1C1917]'
          }`}
        >
          Published ({publishedEntries.length})
        </button>
        <button
          type="button"
          onClick={() => onTabChange('all')}
          className={`py-1.5 rounded transition-colors text-center cursor-pointer ${
            editorialTab === 'all'
              ? 'bg-[#FAF8F5] text-[#1C1917] shadow-xs'
              : 'text-[#66615C] hover:text-[#1C1917]'
          }`}
        >
          All ({draftEntries.length + publishedEntries.length})
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-[#9C9589] absolute left-2.5 top-2.5" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search drafts, titles, desks..."
          className="w-full pl-8 pr-2.5 py-1.5 bg-[#FAF8F5] border border-[#E5DFC5] rounded text-xs font-serif text-[#1C1917] placeholder:text-[#9C9589] focus:outline-[#1E40AF]"
        />
      </div>

      {/* List of articles */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[calc(100vh-280px)]">
        {visibleList.length > 0 ? (
          visibleList.map((entry, idx) => {
            const isActive = activeEntry?.slug === entry.slug || activeEntry?.id === entry.id;

            return (
              <div
                key={entry.id || entry.slug || `entry-${idx}`}
                onClick={() => onSelectEntry(entry)}
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
                        onDeleteEntry(entry);
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
  );
}
