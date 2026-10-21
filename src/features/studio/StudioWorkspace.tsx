'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  ExternalLink,
  Mail,
  RotateCcw,
  Feather,
  FileEdit,
  Book,
  BookOpen,
  Music,
  Radio,
} from 'lucide-react';
import {
  Entry,
  EntryType,
  SubCategory,
  DeskType,
  EDITORIAL_DESKS,
} from '@/types/database';
import { useStudioState } from './hooks/useStudioState';
import { StudioSidebar } from './components/StudioSidebar';
import TipTapEditor from './components/TipTapEditor';
import ReviewCraftPanel from './components/ReviewCraftPanel';
import EditorialPhotographyAccordion from './components/EditorialPhotographyAccordion';
import SocialPublishingStudio from './components/SocialPublishingStudio';
import PromoteModal from './components/modals/PromoteModal';
import DispatchModal from './components/modals/DispatchModal';
import AnalyticsModal from './components/modals/AnalyticsModal';

const EDITORIAL_ENTRY_TYPES: { type: EntryType; label: string; icon: any }[] = [
  { type: 'essay', label: 'Essay', icon: Feather },
  { type: 'thought', label: 'Reflection / Note', icon: FileEdit },
  { type: 'book_review', label: 'Book Log', icon: Book },
  { type: 'comic_review', label: 'Comic Review', icon: BookOpen },
  { type: 'music_review', label: 'Record Log', icon: Music },
  { type: 'podcast_review', label: 'Podcast Log', icon: Radio },
];

export interface StudioWorkspaceProps {
  userId: string | null;
  isSidebarOpen: boolean;
  isFocusMode: boolean;
  onCloseMobileSidebar?: () => void;
  state?: ReturnType<typeof useStudioState>;
}

export function StudioWorkspace({
  userId,
  isSidebarOpen,
  isFocusMode,
  onCloseMobileSidebar,
  state: externalState,
}: StudioWorkspaceProps) {
  const internalState = useStudioState({ userId });
  const state = externalState || internalState;

  const {
    draftEntries,
    publishedEntries,
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
    selectEntry,
    createNewDocument,
    handleDeleteEntry,
    handleUnpublishToDraft,
    handleDeskChange,
    handleTypeChange,
    handleApplyTemplate,
  } = state;

  const isLiveActive = entryStatus === 'published';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-8 py-4 sm:py-6 w-full flex-1 flex gap-6 lg:gap-8">
      {/* Off-Canvas Backdrop for Mobile */}
      {!isFocusMode && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 xl:hidden"
          onClick={onCloseMobileSidebar}
        />
      )}

      {/* Editorial Sidebar */}
      {!isFocusMode && (
        <StudioSidebar
          isSidebarOpen={isSidebarOpen}
          draftEntries={draftEntries}
          publishedEntries={publishedEntries}
          activeEntry={activeEntry}
          editorialTab={editorialTab}
          onTabChange={setEditorialTab}
          searchFilter={searchFilter}
          onSearchChange={setSearchFilter}
          onNewDraft={createNewDocument}
          onSelectEntry={selectEntry}
          onDeleteEntry={handleDeleteEntry}
        />
      )}

      {/* Center Canvas */}
      <main className="flex-1 mx-auto w-full pb-48 px-1 sm:px-0 transition-all max-w-[720px]">
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
            entryId={activeEntry?.id}
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
      </main>

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
              id: activeEntry?.id || (typeof crypto !== 'undefined' ? crypto.randomUUID() : `pub-${Date.now()}`),
              user_id: activeEntry?.user_id || (userId || ''),
              title: title.trim() || 'Untitled Entry',
              slug: activeEntry?.slug || (title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : `entry-${Date.now()}`),
              body_json: activeEntry?.body_json || null,
              body_html: contentHtml,
              entry_type: entryType,
              status: 'published',
              metadata: { ...metadata, desk: selectedDesk, category: selectedCategory, isPrivate: false },
              published_at: new Date().toISOString(),
              created_at: activeEntry?.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            state.handlePublishComplete(publishedItem);
          }}
        />
      )}

      {/* The Dispatch Broadcast Modal */}
      {isDispatchOpen && (
        <DispatchModal
          isOpen={isDispatchOpen}
          onClose={() => setIsDispatchOpen(false)}
          title={title}
          slug={
            activeEntry?.slug ||
            (title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : 'untitled')
          }
          kicker={metadata.kicker || 'EDITORIAL DISPATCH'}
          excerpt={metadata.excerpt || ''}
          contentHtml={contentHtml}
          publishedAt={activeEntry?.published_at || undefined}
        />
      )}

      {/* Analytics Modal */}
      {isAnalyticsOpen && (
        <AnalyticsModal isOpen={isAnalyticsOpen} onClose={() => setIsAnalyticsOpen(false)} />
      )}
    </div>
  );
}
