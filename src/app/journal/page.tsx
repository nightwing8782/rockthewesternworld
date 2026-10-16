'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStudioAuth, StudioAuthGate, WorkspaceHeader } from '@/features/shared';
import { LedgerWorkspace, useLedgerState } from '@/features/ledger';
import { StudioWorkspace, useStudioState } from '@/features/studio';

export default function JournalStudioPage() {
  const { user, loading, authError, isSubmitting, signIn, signOut } = useStudioAuth();

  const [workspaceMode, setWorkspaceMode] = useState<'ledger' | 'editorial'>('ledger');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Load Saved Preferences from LocalStorage
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
    } catch {}
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('rww_studio_sidebar_collapsed', String(!next));
      } catch {}
      return next;
    });
  }, []);

  // Isolated Domain State Hooks
  const ledgerState = useLedgerState({ userId: user?.id || null });
  const studioState = useStudioState({ userId: user?.id || null });

  const handleModeChange = useCallback(
    (mode: 'ledger' | 'editorial') => {
      if (workspaceMode === 'ledger') {
        ledgerState.flushDraft();
      } else {
        studioState.flushDraft();
      }
      setWorkspaceMode(mode);
      try {
        localStorage.setItem('rww_studio_workspace_mode', mode);
      } catch {}
    },
    [workspaceMode, ledgerState, studioState]
  );

  if (loading) {
    return <StudioAuthGate loading={true} onSignIn={signIn} />;
  }

  if (!user) {
    return (
      <StudioAuthGate
        loading={false}
        error={authError}
        isSubmitting={isSubmitting}
        onSignIn={signIn}
      />
    );
  }

  const isLiveActive = workspaceMode === 'editorial' && studioState.entryStatus === 'published';
  const currentSaveStatus = workspaceMode === 'ledger' ? ledgerState.saveStatus : studioState.saveStatus;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#242120] flex flex-col font-reading selection:bg-[#1E40AF] selection:text-white relative">
      <WorkspaceHeader
        workspaceMode={workspaceMode}
        onModeChange={handleModeChange}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        isFocusMode={isFocusMode}
        onToggleFocusMode={() => setIsFocusMode((prev) => !prev)}
        saveStatus={currentSaveStatus}
        onSignOut={signOut}
        onSaveLedger={() => ledgerState.saveCurrentLedger()}
        isLiveActive={isLiveActive}
        onSetEditorialStatus={studioState.handleSetEditorialStatus}
        onSaveDraft={() => studioState.saveCurrentDraft()}
        onPromoteLive={() => studioState.setIsPromoteOpen(true)}
        onOpenDispatch={() => studioState.setIsDispatchOpen(true)}
        onOpenAnalytics={() => studioState.setIsAnalyticsOpen(true)}
        onUnpublishToDraft={studioState.handleUnpublishToDraft}
        onDeleteActiveEntry={() => {
          if (workspaceMode === 'ledger' && ledgerState.activeEntry) {
            ledgerState.handleDeleteEntry(ledgerState.activeEntry);
          } else if (workspaceMode === 'editorial' && studioState.activeEntry) {
            studioState.handleDeleteEntry(studioState.activeEntry);
          }
        }}
        hasActiveEntry={
          workspaceMode === 'ledger'
            ? Boolean(ledgerState.activeEntry)
            : Boolean(studioState.activeEntry)
        }
      />

      {workspaceMode === 'ledger' ? (
        <LedgerWorkspace
          userId={user.id}
          isSidebarOpen={isSidebarOpen}
          isFocusMode={isFocusMode}
          onCloseMobileSidebar={() => setIsSidebarOpen(false)}
          state={ledgerState}
          allEntries={[
            ...ledgerState.privateEntries,
            ...studioState.draftEntries,
            ...studioState.publishedEntries,
          ]}
          onSeedToEssay={(seed) => {
            ledgerState.flushDraft();
            studioState.createSeedDraft(seed);
            handleModeChange('editorial');
          }}
        />
      ) : (
        <StudioWorkspace
          userId={user.id}
          isSidebarOpen={isSidebarOpen}
          isFocusMode={isFocusMode}
          onCloseMobileSidebar={() => setIsSidebarOpen(false)}
          state={studioState}
        />
      )}
    </div>
  );
}
