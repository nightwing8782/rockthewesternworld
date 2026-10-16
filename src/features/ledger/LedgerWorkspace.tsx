'use client';

import React, { useState } from 'react';
import { Sun, Compass, Search } from 'lucide-react';
import { Entry } from '@/types/database';
import {
  CompassMetadata,
  MonthlyMetadata,
  WeeklyMetadata,
  DailyLedgerMetadata,
} from '@/types/journal';
import { getMonthLabel, getWeekLabel } from '@/lib/journal/dateMath';
import { useLedgerState } from './hooks/useLedgerState';
import LedgerHierarchyTree from './components/LedgerHierarchyTree';
import LedgerHorizonNav from './components/LedgerHorizonNav';
import CompassRoadmapView from './components/CompassRoadmapView';
import MonthlyHorizonView from './components/MonthlyHorizonView';
import WeeklyRhythmView from './components/WeeklyRhythmView';
import DailyLedgerView from './components/DailyLedgerView';

import { EssaySeedPayload } from '@/features/shared';

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

export interface LedgerWorkspaceProps {
  userId: string | null;
  isSidebarOpen: boolean;
  isFocusMode: boolean;
  onCloseMobileSidebar?: () => void;
  allEntries?: Entry[];
  state?: ReturnType<typeof useLedgerState>;
  onSeedToEssay?: (seed: EssaySeedPayload) => void;
}

export function LedgerWorkspace({
  userId,
  isSidebarOpen,
  isFocusMode,
  onCloseMobileSidebar,
  allEntries,
  state: externalState,
  onSeedToEssay,
}: LedgerWorkspaceProps) {
  const internalState = useLedgerState({ userId });
  const state = externalState || internalState;

  const [searchFilter, setSearchFilter] = useState('');

  const {
    ledgerHorizon,
    setLedgerHorizon,
    selectedDateKey,
    selectedWeekKey,
    selectedMonthKey,
    selectedYear,
    setSelectedDateKey,
    setSelectedWeekKey,
    setSelectedMonthKey,
    setSelectedYear,
    handleHorizonChange,
    handlePrevPeriod,
    handleNextPeriod,
    handleSnapCurrent,
    handleJumpToDaily,
    handleToggleDailyHabitFromWeek,
    loadHorizonDocument,
    activeEntry,
    title,
    setTitle,
    contentHtml,
    setContentHtml,
    metadata,
    setMetadata,
    saveStatus,
    setSaveStatus,
    ledgerFeedback,
    privateEntries,
    saveCurrentLedger,
    handleRecordDailyCheckIn,
    handleInsertLedgerIntoBody,
    handleInsertPrompt,
    handleDeleteEntry,
    selectEntry,
    selectedMonthParsed,
    parentGamechangerTitle,
    parentGamechangerTarget,
    parentWeekFocus,
    monthlyHabitHeatmap,
    monthlyWins,
    weekDates,
    weeklyWins,
    weeklyHabitMatrix,
    monthlyGoalProgress,
  } = state;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-8 py-4 sm:py-6 w-full flex-1 flex gap-6 lg:gap-8">
      {/* Off-Canvas Backdrop for Mobile */}
      {!isFocusMode && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 xl:hidden"
          onClick={onCloseMobileSidebar}
        />
      )}

      {/* Dedicated Workspace Sidebar */}
      {!isFocusMode && (
        <aside
          className={`shrink-0 flex flex-col gap-3.5 transition-all duration-200 bg-[#FAF8F5] ${
            isSidebarOpen
              ? 'fixed inset-y-0 left-0 z-50 w-80 shadow-2xl p-5 border-r border-[#E5DFC5] overflow-y-auto xl:sticky xl:top-16 xl:max-h-[calc(100vh-5rem)] xl:z-auto xl:w-72 xl:shadow-none xl:p-0 xl:pr-6'
              : 'w-0 opacity-0 pointer-events-none pr-0 -translate-x-full xl:translate-x-0'
          }`}
        >
          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleSnapCurrent}
              className="w-full py-2.5 px-3 bg-[#B45309] hover:bg-[#92400E] text-[#FAF8F5] rounded-xl text-xs font-display uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <Sun className="w-3.5 h-3.5 text-amber-300" />
              <span>Today&apos;s Check-in</span>
            </button>
          </div>

          {/* Sidebar Title */}
          <div className="flex items-center justify-between px-1 border-b border-[#E5DFC5] pb-2">
            <div className="flex items-center gap-1.5 text-[10px] font-display uppercase tracking-[0.2em] text-[#B45309] font-bold">
              <Compass className="w-3.5 h-3.5" />
              <span>Horizon Timeline</span>
            </div>
            <span className="text-[10px] font-serif text-[#78716C] italic font-semibold">
              {privateEntries.length} {privateEntries.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9C9589] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search thoughts, bright spots, habits..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-[#FAF8F5] border border-[#E5DFC5] rounded text-xs font-serif text-[#1C1917] placeholder:text-[#9C9589] focus:outline-[#1E40AF]"
            />
          </div>

          {/* Document Hierarchy Tree */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[calc(100vh-280px)]">
            <LedgerHierarchyTree
              entries={privateEntries}
              activeHorizon={ledgerHorizon}
              selectedDateKey={selectedDateKey}
              selectedWeekKey={selectedWeekKey}
              selectedMonthKey={selectedMonthKey}
              selectedYear={selectedYear}
              searchFilter={searchFilter}
              onSelectCompass={(year) => {
                setSelectedYear(year);
                setLedgerHorizon('compass');
                loadHorizonDocument('compass', selectedDateKey, selectedWeekKey, selectedMonthKey, year);
              }}
              onSelectMonth={(mKey) => {
                setSelectedMonthKey(mKey);
                const [y] = mKey.split('-').map(Number);
                setSelectedYear(y);
                setLedgerHorizon('monthly');
                loadHorizonDocument('monthly', selectedDateKey, selectedWeekKey, mKey, y);
              }}
              onSelectWeek={(wKey) => {
                setSelectedWeekKey(wKey);
                setLedgerHorizon('weekly');
                loadHorizonDocument('weekly', selectedDateKey, wKey, selectedMonthKey, selectedYear);
              }}
              onSelectDay={(dKey, entry) => {
                setSelectedDateKey(dKey);
                setLedgerHorizon('daily');
                if (entry) selectEntry(entry);
                else loadHorizonDocument('daily', dKey, selectedWeekKey, selectedMonthKey, selectedYear);
              }}
              onDeleteEntry={handleDeleteEntry}
            />
          </div>
        </aside>
      )}

      {/* Center Canvas */}
      <main
        className={`flex-1 mx-auto w-full pb-48 px-1 sm:px-0 transition-all ${
          ledgerHorizon !== 'daily' ? 'max-w-5xl' : 'max-w-[720px]'
        }`}
      >
        <div className="space-y-6">
          {/* Dynamic Horizon Navigation Bar */}
          <LedgerHorizonNav
            activeHorizon={ledgerHorizon}
            onHorizonChange={handleHorizonChange}
            selectedDateKey={selectedDateKey}
            selectedWeekKey={selectedWeekKey}
            selectedMonthKey={selectedMonthKey}
            selectedYear={selectedYear}
            onPrevPeriod={handlePrevPeriod}
            onNextPeriod={handleNextPeriod}
            onSnapCurrent={handleSnapCurrent}
            saveStatus={saveStatus}
            monthlyGoalProgress={monthlyGoalProgress}
          />

          {/* HORIZON VIEW 1: COMPASS & ANNUAL ROADMAP */}
          {ledgerHorizon === 'compass' && (
            <CompassRoadmapView
              metadata={(metadata as unknown) as CompassMetadata}
              year={selectedYear}
              onUpdateMetadata={(newMeta) => {
                setMetadata((prev) => ({ ...prev, ...newMeta }));
                saveCurrentLedger(newMeta);
              }}
            />
          )}

          {/* HORIZON VIEW 2: MONTHLY HORIZON */}
          {ledgerHorizon === 'monthly' && (
            <MonthlyHorizonView
              metadata={(metadata as unknown) as MonthlyMetadata}
              year={selectedMonthParsed.year}
              month={selectedMonthParsed.month}
              monthLabel={getMonthLabel(selectedMonthParsed.year, selectedMonthParsed.month)}
              onUpdateMetadata={(newMeta) => {
                setMetadata((prev) => ({ ...prev, ...newMeta }));
                saveCurrentLedger(newMeta);
              }}
              habitHeatmap={monthlyHabitHeatmap}
              monthlyWins={monthlyWins}
              onSelectDate={handleJumpToDaily}
            />
          )}

          {/* HORIZON VIEW 3: WEEKLY RHYTHM */}
          {ledgerHorizon === 'weekly' && (
            <WeeklyRhythmView
              metadata={(metadata as unknown) as WeeklyMetadata}
              weekKey={selectedWeekKey}
              weekLabel={getWeekLabel(selectedWeekKey)}
              parentGamechangerTitle={parentGamechangerTitle}
              parentGamechangerTarget={parentGamechangerTarget}
              onUpdateMetadata={(newMeta) => {
                setMetadata((prev) => ({ ...prev, ...newMeta }));
                saveCurrentLedger(newMeta);
              }}
              weekDates={weekDates}
              weeklyWins={weeklyWins}
              weeklyHabitMatrix={weeklyHabitMatrix}
              onSelectDate={handleJumpToDaily}
              onToggleDailyHabit={handleToggleDailyHabitFromWeek}
            />
          )}

          {/* HORIZON VIEW 4: DAILY LEDGER */}
          {ledgerHorizon === 'daily' && (
            <DailyLedgerView
              metadata={(metadata as unknown) as DailyLedgerMetadata}
              dateKey={selectedDateKey}
              formattedDate={formatDateSafe(
                activeEntry?.created_at,
                new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                }),
                {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                }
              )}
              entries={allEntries || privateEntries}
              parentGamechangerTitle={parentGamechangerTitle}
              parentWeekFocus={parentWeekFocus}
              onUpdateMetadata={(newMeta) => {
                setMetadata((prev) => ({ ...prev, ...newMeta }));
                saveCurrentLedger(newMeta);
              }}
              onSelectMemory={(memoryEntry) => selectEntry(memoryEntry)}
              title={title}
              onChangeTitle={(newTitle) => {
                setTitle(newTitle);
                setSaveStatus('unsaved');
              }}
              contentHtml={contentHtml}
              onChangeContentHtml={(newHtml) => {
                setContentHtml(newHtml);
                setSaveStatus('unsaved');
              }}
              onInsertLedgerIntoBody={handleInsertLedgerIntoBody}
              onRecordDailyCheckIn={handleRecordDailyCheckIn}
              onInsertPrompt={handleInsertPrompt}
              feedbackMessage={ledgerFeedback}
              onSeedToEssay={onSeedToEssay}
            />
          )}
        </div>
      </main>
    </div>
  );
}
