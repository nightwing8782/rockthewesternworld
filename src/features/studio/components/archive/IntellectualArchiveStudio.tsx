'use client';

import { useState, useMemo } from 'react';
import {
  Entry,
  EntryMetadata,
  RelationshipType,
  IdeaStage,
  RelatedWorkLink,
} from '@/types/database';
import {
  BookMarked,
  GitBranch,
  Layers,
  Sparkles,
  Link2,
  Trash2,
  Plus,
  Search,
  AlertCircle,
  Clock,
  Compass,
  Trophy,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Tag,
  Check,
} from 'lucide-react';

interface IntellectualArchiveStudioProps {
  activeEntry: Entry | null;
  title: string;
  entryType: string;
  metadata: EntryMetadata;
  draftEntries: Entry[];
  publishedEntries: Entry[];
  onMetadataChange: (newMeta: Partial<EntryMetadata>) => void;
}

const PERENNIAL_THEMES = [
  'Meaning',
  'Faith',
  'Loneliness',
  'Creativity',
  'Community',
  'Art & Craft',
  'Politics & Power',
  'Memory & Time',
  'Technology',
  'Grief & Loss',
  'Epiphanies',
  'Disillusionment',
];

const IDEA_STAGES: { stage: IdeaStage; title: string; desc: string; step: number }[] = [
  { stage: 'reflection', title: 'Personal Reflection', desc: 'Working thought or ledger note', step: 1 },
  { stage: 'reading_note', title: 'Reading / Cultural Log', desc: 'Note on a book, comic, or album', step: 2 },
  { stage: 'draft', title: 'Essay Draft', desc: 'Draft in deliberate development', step: 3 },
  { stage: 'editorial', title: 'Broadsheet Editorial', desc: 'Polished archival publication', step: 4 },
];

const RELATIONSHIP_LABELS: Record<RelationshipType, { label: string; desc: string; color: string }> = {
  builds_upon: {
    label: 'Builds Upon',
    desc: 'Extends or deepens an earlier argument',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  },
  referenced_by: {
    label: 'Referenced By',
    desc: 'Cited as cultural evidence or source',
    color: 'bg-blue-50 text-blue-800 border-blue-300',
  },
  contradicts: {
    label: 'Contradicts / Evolves',
    desc: 'Revises or departs from a past viewpoint',
    color: 'bg-amber-50 text-amber-800 border-amber-300',
  },
  continues_from: {
    label: 'Continues Discussion',
    desc: 'Sequel or serial continuation of thought',
    color: 'bg-purple-50 text-purple-800 border-purple-300',
  },
  companion: {
    label: 'Companion Piece',
    desc: 'Parallel exploration of the same theme',
    color: 'bg-stone-100 text-stone-800 border-stone-300',
  },
};

export default function IntellectualArchiveStudio({
  activeEntry,
  title,
  entryType,
  metadata,
  draftEntries,
  publishedEntries,
  onMetadataChange,
}: IntellectualArchiveStudioProps) {
  const [activeTab, setActiveTab] = useState<'themes' | 'lineage' | 'relations' | 'intelligence'>('themes');
  const [customThemeInput, setCustomThemeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRelType, setSelectedRelType] = useState<RelationshipType>('builds_upon');

  const currentThemes: string[] = metadata.themes || [];
  const currentRelatedWorks: RelatedWorkLink[] = metadata.related_works || [];
  const currentLineage = metadata.idea_lineage || {
    stage: (entryType === 'thought' || entryType === 'personal_ledger')
      ? 'reflection'
      : (entryType.includes('review') ? 'reading_note' : 'draft'),
  };

  // Combine all entries for search and intelligence
  const allKnownEntries = useMemo(() => {
    const list: Entry[] = [];
    const seen = new Set<string>();

    [...draftEntries, ...publishedEntries].forEach((e) => {
      const id = e.id || e.slug;
      if (id && id !== activeEntry?.id && !seen.has(id)) {
        seen.add(id);
        list.push(e);
      }
    });

    return list;
  }, [draftEntries, publishedEntries, activeEntry]);

  // Similar Entry Detection (Phase 6)
  const similarEntries = useMemo(() => {
    const rawTitle = title.toLowerCase().trim();
    if (rawTitle.length < 4) return [];

    const stopWords = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'about', 'into', 'over']);
    const titleWords = rawTitle
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));

    if (titleWords.length === 0) return [];

    return allKnownEntries
      .filter((e) => {
        const otherTitle = (e.title || '').toLowerCase();
        const matches = titleWords.filter((w) => otherTitle.includes(w));
        return matches.length >= 1;
      })
      .slice(0, 3);
  }, [title, allKnownEntries]);

  // Unfinished Idea Resurfacing (Phase 6)
  const resurfacedDrafts = useMemo(() => {
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    return draftEntries
      .filter((d) => {
        if (!d.id || d.id === activeEntry?.id) return false;
        const createdTime = new Date(d.created_at || '').getTime();
        const hasSharedTheme = (d.metadata?.themes || []).some((t) => currentThemes.includes(t));
        return createdTime < fourteenDaysAgo && (hasSharedTheme || d.metadata?.desk === metadata.desk);
      })
      .slice(0, 2);
  }, [draftEntries, activeEntry, currentThemes, metadata.desk]);

  // Toggle Theme
  const handleToggleTheme = (theme: string) => {
    let next: string[];
    if (currentThemes.includes(theme)) {
      next = currentThemes.filter((t) => t !== theme);
    } else {
      next = [...currentThemes, theme];
    }
    onMetadataChange({ themes: next });
  };

  const handleAddCustomTheme = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customThemeInput.trim();
    if (clean && !currentThemes.includes(clean)) {
      onMetadataChange({ themes: [...currentThemes, clean] });
      setCustomThemeInput('');
    }
  };

  // Idea Lineage Update
  const handleSetStage = (stage: IdeaStage) => {
    onMetadataChange({
      idea_lineage: {
        ...currentLineage,
        stage,
      },
    });
  };

  const handleSelectParentEntry = (parentId: string) => {
    const parent = allKnownEntries.find((e) => e.id === parentId);
    onMetadataChange({
      idea_lineage: {
        ...currentLineage,
        parent_id: parentId || undefined,
        parent_title: parent?.title || undefined,
      },
    });
  };

  // Related Works Link Management
  const handleAddRelatedWork = (entry: Entry) => {
    const id = entry.id || entry.slug || `entry-${Date.now()}`;
    if (currentRelatedWorks.some((w) => w.id === id)) return;

    const newLink: RelatedWorkLink = {
      id,
      title: entry.title || 'Untitled Dispatch',
      slug: entry.slug || id,
      relationship: selectedRelType,
      entry_type: entry.entry_type,
    };

    onMetadataChange({
      related_works: [...currentRelatedWorks, newLink],
    });
    setSearchQuery('');
  };

  const handleRemoveRelatedWork = (id: string) => {
    onMetadataChange({
      related_works: currentRelatedWorks.filter((w) => w.id !== id),
    });
  };

  // Trophy Room Connection
  const handleSetTrophyRoom = (itemTitle: string) => {
    onMetadataChange({
      trophy_room_item_title: itemTitle.trim() || undefined,
    });
  };

  // Search results for adding related works
  const filteredSearchEntries = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allKnownEntries
      .filter(
        (e) =>
          (e.title || '').toLowerCase().includes(q) ||
          (e.slug || '').toLowerCase().includes(q) ||
          (e.metadata?.author || '').toLowerCase().includes(q) ||
          (e.metadata?.artist || '').toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [searchQuery, allKnownEntries]);

  return (
    <div className="border border-[#DDD5C7] bg-[#FAF8F5] rounded shadow-2xs overflow-hidden font-serif">
      {/* Studio Header */}
      <div className="p-4 bg-[#F2ECE1] border-b border-[#DDD5C7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#FAF8F5] border border-[#DDD5C7] flex items-center justify-center text-[#B45309]">
            <BookMarked className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-black text-xs uppercase tracking-widest text-[#1C1917]">
                INTELLECTUAL ARCHIVE &amp; IDEA LINEAGE
              </h3>
              <span className="text-[10px] font-mono bg-[#FAF8F5] px-1.5 py-0.5 border border-[#DDD5C7] rounded text-[#66615C]">
                Permanent Commonwealth Layer
              </span>
            </div>
            <p className="text-[11px] text-[#66615C] mt-0.5">
              Connect dispatches, track conceptual evolution, and weave ideas across decades.
            </p>
          </div>
        </div>

        {/* Studio Sub-Navigation Tabs */}
        <div className="inline-flex p-0.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded self-stretch sm:self-auto overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('themes')}
            className={`px-2.5 py-1 text-[11px] font-display font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${
              activeTab === 'themes' ? 'bg-[#1E40AF] text-white shadow-2xs' : 'text-[#66615C] hover:text-[#1C1917]'
            }`}
          >
            Themes ({currentThemes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lineage')}
            className={`px-2.5 py-1 text-[11px] font-display font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${
              activeTab === 'lineage' ? 'bg-[#1E40AF] text-white shadow-2xs' : 'text-[#66615C] hover:text-[#1C1917]'
            }`}
          >
            Idea Lineage
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('relations')}
            className={`px-2.5 py-1 text-[11px] font-display font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${
              activeTab === 'relations' ? 'bg-[#1E40AF] text-white shadow-2xs' : 'text-[#66615C] hover:text-[#1C1917]'
            }`}
          >
            Related Works ({currentRelatedWorks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('intelligence')}
            className={`px-2.5 py-1 text-[11px] font-display font-bold uppercase tracking-wider rounded transition-colors cursor-pointer relative ${
              activeTab === 'intelligence' ? 'bg-[#1E40AF] text-white shadow-2xs' : 'text-[#66615C] hover:text-[#1C1917]'
            }`}
          >
            Intelligence
            {(similarEntries.length > 0 || resurfacedDrafts.length > 0) && (
              <span className="w-2 h-2 rounded-full bg-[#B45309] inline-block ml-1" />
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Theme Discovery & Cross-Cutting Knowledge */}
      {activeTab === 'themes' && (
        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-display font-bold uppercase tracking-wider text-[#1C1917]">
                Perennial Philosophical Themes
              </span>
              <span className="text-[11px] text-[#78716C]">
                Selected themes link this piece across essays, reviews &amp; notes.
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PERENNIAL_THEMES.map((theme) => {
                const isSelected = currentThemes.includes(theme);
                return (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => handleToggleTheme(theme)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1E40AF] text-white font-medium shadow-2xs'
                        : 'bg-white hover:bg-[#F2ECE1] border border-[#DDD5C7] text-[#44403C]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{theme}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Theme Add */}
          <form onSubmit={handleAddCustomTheme} className="flex gap-2 max-w-sm pt-2">
            <input
              type="text"
              value={customThemeInput}
              onChange={(e) => setCustomThemeInput(e.target.value)}
              placeholder="Add custom conceptual theme..."
              className="flex-1 px-2.5 py-1.5 bg-white border border-[#DDD5C7] rounded text-xs text-[#1C1917] focus:outline-[#1E40AF]"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#DDD5C7] border border-[#DDD5C7] rounded text-xs font-display font-bold uppercase tracking-wider text-[#1C1917] cursor-pointer"
            >
              Add
            </button>
          </form>

          {/* Active Themes Summary */}
          {currentThemes.length > 0 && (
            <div className="pt-2 border-t border-[#DDD5C7]/70 text-xs text-[#66615C]">
              <span>Active in Archive: </span>
              {currentThemes.map((t, idx) => (
                <span key={t} className="font-semibold text-[#1C1917]">
                  {t}{idx < currentThemes.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Idea Lineage & Evolutionary Provenance */}
      {activeTab === 'lineage' && (
        <div className="p-4 sm:p-5 space-y-5">
          <div>
            <span className="text-xs font-display font-bold uppercase tracking-wider text-[#1C1917] block mb-1">
              Conceptual Evolutionary Stage
            </span>
            <p className="text-[11px] text-[#66615C] mb-3">
              Ideas accumulate: track whether this entry is a fleeting thought or an archival broadsheet anchor.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              {IDEA_STAGES.map((s) => {
                const isSelected = currentLineage.stage === s.stage;
                return (
                  <button
                    key={s.stage}
                    type="button"
                    onClick={() => handleSetStage(s.stage)}
                    className={`p-3 rounded border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1E40AF] text-white border-[#1E40AF] shadow-2xs'
                        : 'bg-white hover:bg-[#F2ECE1] border-[#DDD5C7] text-[#44403C]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-blue-200' : 'text-[#B45309]'}`}>
                        STAGE {s.step}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div className="font-display font-bold text-xs leading-snug">
                      {s.title}
                    </div>
                    <div className={`text-[10px] mt-1 line-clamp-2 leading-tight ${isSelected ? 'text-blue-100' : 'text-[#78716C]'}`}>
                      {s.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ancestor / Seed Provenance */}
          <div className="p-3.5 bg-white border border-[#DDD5C7] rounded space-y-2.5">
            <span className="text-xs font-display font-bold uppercase tracking-wider text-[#1C1917] block">
              Ancestor Idea / Provenance Link
            </span>
            <p className="text-[11px] text-[#66615C]">
              Did this piece originate from an earlier journal thought or cultural note?
            </p>

            <select
              value={currentLineage.parent_id || ''}
              onChange={(e) => handleSelectParentEntry(e.target.value)}
              className="w-full text-xs font-serif bg-[#FAF8F5] border border-[#DDD5C7] rounded p-2 text-[#1C1917]"
            >
              <option value="">-- No direct ancestor (Original standalone inception) --</option>
              {allKnownEntries.map((e) => (
                <option key={e.id || e.slug} value={e.id || e.slug || ''}>
                  [{e.entry_type.toUpperCase()}] {e.title || 'Untitled'}
                </option>
              ))}
            </select>

            {currentLineage.parent_title && (
              <div className="text-xs text-emerald-800 bg-emerald-50 p-2 border border-emerald-200 rounded flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Evolved from: <strong>{currentLineage.parent_title}</strong></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Related Works & Citation Graph */}
      {activeTab === 'relations' && (
        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-display font-bold uppercase tracking-wider text-[#1C1917]">
                Archival Citation &amp; Related Works Graph
              </span>
              <span className="text-[11px] text-[#78716C]">
                Expose intellectual bridges across essays, reviews, and readings.
              </span>
            </div>

            {/* Existing Related Works List */}
            {currentRelatedWorks.length > 0 ? (
              <div className="space-y-2 mb-4">
                {currentRelatedWorks.map((work) => {
                  const rel = RELATIONSHIP_LABELS[work.relationship] || RELATIONSHIP_LABELS.companion;
                  return (
                    <div
                      key={work.id}
                      className="p-2.5 bg-white border border-[#DDD5C7] rounded flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-display font-bold uppercase border shrink-0 ${rel.color}`}>
                          {rel.label}
                        </span>
                        <span className="font-semibold text-[#1C1917] truncate">
                          {work.title}
                        </span>
                        <span className="text-[11px] font-mono text-[#78716C] truncate hidden sm:inline">
                          /{work.slug}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveRelatedWork(work.id)}
                        className="p-1 text-[#78716C] hover:text-red-700 transition-colors cursor-pointer shrink-0"
                        title="Remove citation link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 text-center border border-dashed border-[#DDD5C7] rounded text-xs text-[#78716C] italic mb-3">
                No citations or related works linked yet. Add below to connect ideas.
              </div>
            )}

            {/* Add Related Work Form */}
            <div className="p-3.5 bg-white border border-[#DDD5C7] rounded space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-display font-bold uppercase tracking-wider text-[#66615C] mb-1">
                    RELATIONSHIP TYPE
                  </label>
                  <select
                    value={selectedRelType}
                    onChange={(e) => setSelectedRelType(e.target.value as RelationshipType)}
                    className="w-full text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded p-1.5 text-[#1C1917]"
                  >
                    {Object.entries(RELATIONSHIP_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-8">
                  <label className="block text-[10px] font-display font-bold uppercase tracking-wider text-[#66615C] mb-1">
                    SEARCH ARCHIVE TO LINK
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#9C9589] absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Type title, author, or keyword..."
                      className="w-full pl-8 pr-3 py-1.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded text-xs text-[#1C1917] focus:outline-[#1E40AF]"
                    />
                  </div>
                </div>
              </div>

              {/* Search Suggestions Dropdown */}
              {filteredSearchEntries.length > 0 && (
                <div className="border border-[#DDD5C7] rounded bg-[#FAF8F5] divide-y divide-[#DDD5C7] overflow-hidden">
                  {filteredSearchEntries.map((item) => (
                    <button
                      key={item.id || item.slug}
                      type="button"
                      onClick={() => handleAddRelatedWork(item)}
                      className="w-full p-2 text-left hover:bg-white flex items-center justify-between text-xs text-[#1C1917] transition-colors cursor-pointer"
                    >
                      <div className="truncate pr-3">
                        <span className="text-[10px] font-mono text-[#B45309] uppercase mr-1.5">
                          [{item.entry_type}]
                        </span>
                        <span>{item.title}</span>
                      </div>
                      <span className="text-[10px] font-display font-bold uppercase tracking-wider text-[#1E40AF] shrink-0">
                        + Link
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Editorial Intelligence Layer (Phase 6) */}
      {activeTab === 'intelligence' && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Similar Entry / Duplicate Topic Warning */}
          {similarEntries.length > 0 ? (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded space-y-2">
              <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Related Archive Topics Discovered</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed font-serif">
                You previously published or drafted similar dispatches. Consider citing or contrasting them:
              </p>
              <div className="space-y-1.5">
                {similarEntries.map((sim) => (
                  <div key={sim.id} className="flex items-center justify-between text-xs bg-white/70 p-2 rounded border border-amber-200/60">
                    <span className="font-semibold text-[#1C1917]">{sim.title}</span>
                    <button
                      type="button"
                      onClick={() => handleAddRelatedWork(sim)}
                      className="text-[10px] font-display font-bold uppercase tracking-wider text-[#1E40AF] hover:underline cursor-pointer"
                    >
                      + Add Citation
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded flex items-center gap-2 text-xs text-emerald-800">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Original conceptual territory: no duplicate topic conflicts found in the archive.</span>
            </div>
          )}

          {/* Unfinished Idea Resurfacing */}
          {resurfacedDrafts.length > 0 && (
            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded space-y-2">
              <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-blue-900">
                <Clock className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Resurfaced Unfinished Inquiries</span>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed font-serif">
                These drafts have lingered in your notebook and share common themes with this piece:
              </p>
              <div className="space-y-1.5">
                {resurfacedDrafts.map((draft) => (
                  <div key={draft.id} className="flex items-center justify-between text-xs bg-white/70 p-2 rounded border border-blue-200/60">
                    <div>
                      <span className="font-semibold text-[#1C1917] block">{draft.title || 'Untitled Draft'}</span>
                      <span className="text-[10px] text-[#78716C]">
                        Started {draft.created_at ? new Date(draft.created_at).toLocaleDateString('en-US') : 'Earlier'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddRelatedWork(draft)}
                      className="text-[10px] font-display font-bold uppercase tracking-wider text-[#1E40AF] hover:underline cursor-pointer"
                    >
                      + Link Ideas
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trophy Room Bridge Connection */}
          <div className="p-3.5 bg-white border border-[#DDD5C7] rounded space-y-2.5">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#B45309]" />
              <span className="text-xs font-display font-bold uppercase tracking-wider text-[#1C1917]">
                Connect to Trophy Room Shelf Item
              </span>
            </div>
            <p className="text-[11px] text-[#66615C]">
              Bridges this essay directly to an item in the reading suite library (book, record, comic, or film).
            </p>
            <input
              type="text"
              value={metadata.trophy_room_item_title || ''}
              onChange={(e) => handleSetTrophyRoom(e.target.value)}
              placeholder="e.g. Blue Period Vol. 4 or Abbey Road (Vinyl)"
              className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded text-xs text-[#1C1917] focus:outline-[#1E40AF]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
