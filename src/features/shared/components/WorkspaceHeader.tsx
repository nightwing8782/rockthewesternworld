'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
  Compass,
  Feather,
  Shield,
  Save,
  Globe,
  MoreVertical,
  Mail,
  BarChart3,
  Minimize2,
  Maximize2,
  RotateCcw,
  Trash2,
  Lock,
} from 'lucide-react';
import { SaveStatusBadge } from './SaveStatusBadge';

export interface WorkspaceHeaderProps {
  workspaceMode: 'ledger' | 'editorial';
  onModeChange: (mode: 'ledger' | 'editorial') => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  onSignOut: () => Promise<void>;

  // Ledger mode actions
  onSaveLedger?: () => void;

  // Editorial mode actions
  isLiveActive?: boolean;
  onSetEditorialStatus?: (status: 'draft' | 'published') => void;
  onSaveDraft?: () => void;
  onPromoteLive?: () => void;

  // Overflow actions
  onOpenDispatch?: () => void;
  onOpenAnalytics?: () => void;
  onUnpublishToDraft?: () => void;
  onDeleteActiveEntry?: () => void;
  hasActiveEntry?: boolean;
}

export function WorkspaceHeader({
  workspaceMode,
  onModeChange,
  isSidebarOpen,
  onToggleSidebar,
  isFocusMode,
  onToggleFocusMode,
  saveStatus,
  onSignOut,
  onSaveLedger,
  isLiveActive = false,
  onSetEditorialStatus,
  onSaveDraft,
  onPromoteLive,
  onOpenDispatch,
  onOpenAnalytics,
  onUnpublishToDraft,
  onDeleteActiveEntry,
  hasActiveEntry = false,
}: WorkspaceHeaderProps) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  return (
    <header className="border-b border-[#E5DFC5] bg-[#FAF8F5]/95 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Navigation & Workspace Switcher */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {!isFocusMode && (
            <button
              type="button"
              onClick={onToggleSidebar}
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
              onClick={() => onModeChange('ledger')}
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
              onClick={() => onModeChange('editorial')}
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
          <SaveStatusBadge status={saveStatus} />

          {workspaceMode === 'ledger' ? (
            <>
              <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-serif text-[#78716C] italic mr-1">
                <Shield className="w-3.5 h-3.5 text-[#B45309]" />
                <span>Confidential Cloud Notebook</span>
              </span>

              {onSaveLedger && (
                <button
                  type="button"
                  onClick={onSaveLedger}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#B45309] hover:bg-[#92400E] text-[#FAF8F5] rounded text-[11px] sm:text-xs font-display uppercase tracking-widest font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5 text-[#FAF8F5]" />
                  <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Ledger'}</span>
                </button>
              )}
            </>
          ) : (
            <>
              {/* Editorial Status Switcher: Draft vs Live */}
              {onSetEditorialStatus && (
                <div className="flex items-center bg-[#EAE4D7] p-0.5 rounded text-[10px] sm:text-[11px] font-display uppercase tracking-wider font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => onSetEditorialStatus('draft')}
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
                    onClick={() => onSetEditorialStatus('published')}
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
              )}

              {onSaveDraft && (
                <button
                  type="button"
                  onClick={onSaveDraft}
                  className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-[#1C1917] hover:bg-[#1E40AF] text-[#FAF8F5] rounded text-[11px] sm:text-xs font-display uppercase tracking-widest font-bold transition-colors cursor-pointer shadow-xs shrink-0"
                >
                  <Save className="w-3.5 h-3.5 text-[#E5DFC5]" />
                  <span>{isLiveActive ? 'Update Live' : 'Save Draft'}</span>
                </button>
              )}

              {!isLiveActive && onPromoteLive && (
                <button
                  type="button"
                  onClick={onPromoteLive}
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
                  {onOpenDispatch && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenDispatch();
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-[#F2ECE1] flex items-center gap-2 text-[#1C1917] cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#B45309]" />
                      <span>The Dispatch Broadcast</span>
                    </button>
                  )}

                  {onOpenAnalytics && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenAnalytics();
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-[#F2ECE1] flex items-center gap-2 text-[#1C1917] cursor-pointer"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-[#1E40AF]" />
                      <span>Umami Analytics</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onToggleFocusMode();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-[#F2ECE1] flex items-center gap-2 text-[#1C1917] cursor-pointer"
                  >
                    {isFocusMode ? (
                      <Minimize2 className="w-3.5 h-3.5 text-[#B45309]" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5 text-[#1E40AF]" />
                    )}
                    <span>{isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}</span>
                  </button>

                  {isLiveActive && onUnpublishToDraft && (
                    <button
                      type="button"
                      onClick={() => {
                        onUnpublishToDraft();
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-[#F2ECE1] flex items-center gap-2 text-amber-800 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Unpublish to Draft</span>
                    </button>
                  )}

                  {hasActiveEntry && onDeleteActiveEntry && (
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteActiveEntry();
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
                      onSignOut();
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
  );
}
