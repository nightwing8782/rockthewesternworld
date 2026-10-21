'use client';

import { useState } from 'react';
import { EntryMetadata } from '@/types/database';
import AttachedCoverBanner from './AttachedCoverBanner';
import DirectUploadTab from './tabs/DirectUploadTab';
import SmartUrlImportTab from './tabs/SmartUrlImportTab';
import ReviewMatcherTab from './tabs/ReviewMatcherTab';
import MediaLibraryTab from './tabs/MediaLibraryTab';
import TypographicModeTab from './tabs/TypographicModeTab';
import {
  UploadCloud,
  Link2,
  Library,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Compass,
} from 'lucide-react';

interface EditorialMediaHubProps {
  metadata: EntryMetadata;
  entryId?: string;
  onMetadataChange: (newMeta: Partial<EntryMetadata>) => void;
}

type TabKey = 'upload' | 'url' | 'matcher' | 'library' | 'typographic';

export default function EditorialMediaHub({
  metadata,
  entryId,
  onMetadataChange,
}: EditorialMediaHubProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('upload');

  const handleOpenTab = (tab: TabKey) => {
    setActiveTab(tab);
    setIsOpen(true);
  };

  return (
    <div className="mt-8 border border-[#DDD5C7] bg-[#FAF8F5] rounded shadow-xs overflow-hidden font-serif">
      {/* 1. ATTACHED COVER STATUS BANNER */}
      <AttachedCoverBanner
        metadata={metadata}
        onMetadataChange={onMetadataChange}
        onOpenHubTab={handleOpenTab}
      />

      {/* 2. ACCORDION EXPANDER BAR */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-[#FAF8F5] hover:bg-[#F2ECE1] border-t border-[#DDD5C7] flex items-center justify-between text-xs font-display uppercase tracking-wider font-bold text-[#1C1917] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
          <span>EDITORIAL MEDIA ASSET STUDIO</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#78716C] text-[11px] font-sans">
          <span>{isOpen ? 'Close Asset Studio' : 'Open Media Hub'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* 3. MEDIA HUB DRAWER CONTENT */}
      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-[#DDD5C7] bg-[#FAF8F5] space-y-5">
          {/* TAB BUTTONS */}
          <div className="flex border-b border-[#DDD5C7] overflow-x-auto gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3.5 py-2 font-display text-xs uppercase tracking-wider font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'upload'
                  ? 'border-[#1E40AF] text-[#1E40AF] bg-[#F2ECE1]/50'
                  : 'border-transparent text-[#66615C] hover:text-[#1C1917]'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Direct Upload &amp; Paste</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`px-3.5 py-2 font-display text-xs uppercase tracking-wider font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'url'
                  ? 'border-[#1E40AF] text-[#1E40AF] bg-[#F2ECE1]/50'
                  : 'border-transparent text-[#66615C] hover:text-[#1C1917]'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Smart URL Importer</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('matcher')}
              className={`px-3.5 py-2 font-display text-xs uppercase tracking-wider font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'matcher'
                  ? 'border-[#B45309] text-[#B45309] bg-[#F2ECE1]/50'
                  : 'border-transparent text-[#66615C] hover:text-[#1C1917]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Review Matcher</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className={`px-3.5 py-2 font-display text-xs uppercase tracking-wider font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'library'
                  ? 'border-[#1E40AF] text-[#1E40AF] bg-[#F2ECE1]/50'
                  : 'border-transparent text-[#66615C] hover:text-[#1C1917]'
              }`}
            >
              <Library className="w-3.5 h-3.5" />
              <span>Media Library</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('typographic')}
              className={`px-3.5 py-2 font-display text-xs uppercase tracking-wider font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'typographic'
                  ? 'border-[#B45309] text-[#B45309] bg-[#F2ECE1]/50'
                  : 'border-transparent text-[#66615C] hover:text-[#1C1917]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Typographic Mode</span>
            </button>
          </div>

          {/* TAB PANELS */}
          {activeTab === 'upload' && (
            <DirectUploadTab
              metadata={metadata}
              onMetadataChange={onMetadataChange}
              onAssetSaved={() => setIsOpen(false)}
            />
          )}

          {activeTab === 'url' && (
            <SmartUrlImportTab
              metadata={metadata}
              onMetadataChange={onMetadataChange}
              onAssetSaved={() => setIsOpen(false)}
            />
          )}

          {activeTab === 'matcher' && (
            <ReviewMatcherTab
              metadata={metadata}
              entryId={entryId}
              onMetadataChange={onMetadataChange}
              onNotify={() => {}}
            />
          )}

          {activeTab === 'library' && (
            <MediaLibraryTab
              metadata={metadata}
              onMetadataChange={onMetadataChange}
              onOpenUpload={() => setActiveTab('upload')}
            />
          )}

          {activeTab === 'typographic' && (
            <TypographicModeTab
              metadata={metadata}
              onMetadataChange={onMetadataChange}
            />
          )}
        </div>
      )}
    </div>
  );
}
