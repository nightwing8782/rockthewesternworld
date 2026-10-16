'use client';

import React from 'react';
import {
  Sun,
  Calendar,
  Target,
  Compass,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  Loader2,
  CalendarDays,
} from 'lucide-react';
import { LedgerHorizon } from '@/types/journal';
import { getMonthLabel, getWeekLabel, formatDateKey, formatMonthKey, formatWeekKey } from '@/lib/journal/dateMath';

export interface LedgerHorizonNavProps {
  activeHorizon?: LedgerHorizon;
  horizon?: LedgerHorizon;
  onHorizonChange?: (h: LedgerHorizon) => void;
  onSelectHorizon?: (h: LedgerHorizon) => void;
  selectedDateKey?: string;
  selectedWeekKey?: string;
  selectedMonthKey?: string;
  selectedYear?: number;
  dateLabel?: string;
  onPrevPeriod?: () => void;
  onPrevDate?: () => void;
  onNextPeriod?: () => void;
  onNextDate?: () => void;
  onSnapCurrent?: () => void;
  onResetToday?: () => void;
  isCurrentPeriod?: boolean;
  saveStatus?: 'saved' | 'saving' | 'unsaved';
  monthlyGoalProgress?: number;
  monthProgressPercent?: number;
}

export default function LedgerHorizonNav({
  activeHorizon,
  horizon,
  onHorizonChange,
  onSelectHorizon,
  selectedDateKey,
  selectedWeekKey,
  selectedMonthKey,
  selectedYear,
  dateLabel,
  onPrevPeriod,
  onPrevDate,
  onNextPeriod,
  onNextDate,
  onSnapCurrent,
  onResetToday,
  isCurrentPeriod,
  saveStatus = 'saved',
  monthlyGoalProgress,
  monthProgressPercent,
}: LedgerHorizonNavProps) {
  const currentHorizon: LedgerHorizon = activeHorizon || horizon || 'daily';
  const handleSelect = onHorizonChange || onSelectHorizon || (() => {});
  const handlePrev = onPrevPeriod || onPrevDate || (() => {});
  const handleNext = onNextPeriod || onNextDate || (() => {});
  const handleReset = onSnapCurrent || onResetToday || (() => {});
  const progressVal = typeof monthlyGoalProgress === 'number' ? monthlyGoalProgress : monthProgressPercent;

  const horizons: { id: LedgerHorizon; label: string; icon: any }[] = [
    { id: 'daily', label: "Daily Ledger", icon: Sun },
    { id: 'weekly', label: 'Weekly Rhythm', icon: Calendar },
    { id: 'monthly', label: 'Monthly Horizon', icon: Target },
    { id: 'compass', label: 'Compass & Roadmap', icon: Compass },
  ];

  // Compute date label if not explicitly provided
  let computedLabel = dateLabel || '';
  if (!computedLabel) {
    if (currentHorizon === 'compass') {
      computedLabel = `${selectedYear || new Date().getFullYear()} Annual Roadmap`;
    } else if (currentHorizon === 'monthly') {
      const [y, m] = (selectedMonthKey || formatMonthKey(new Date())).split('-').map(Number);
      computedLabel = getMonthLabel(y, m);
    } else if (currentHorizon === 'weekly') {
      computedLabel = getWeekLabel(selectedWeekKey || formatWeekKey(new Date()));
    } else {
      const d = selectedDateKey ? new Date(selectedDateKey + 'T12:00:00') : new Date();
      computedLabel = !isNaN(d.getTime())
        ? d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
        : (selectedDateKey || 'Today');
    }
  }

  // Check if currently on real-time current date/week/month/year
  const now = new Date();
  const isNow = isCurrentPeriod !== undefined
    ? isCurrentPeriod
    : currentHorizon === 'daily'
    ? (selectedDateKey === formatDateKey(now))
    : currentHorizon === 'weekly'
    ? (selectedWeekKey === formatWeekKey(now))
    : currentHorizon === 'monthly'
    ? (selectedMonthKey === formatMonthKey(now))
    : (selectedYear === now.getFullYear());

  return (
    <div className="bg-[#FAF8F5] border border-[#DDD5C7] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs select-none">
      {/* Top Row: Horizon Navigation Tabs + Save Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Horizon Tabs */}
        <div className="flex items-center bg-[#EAE4D7] p-1 rounded-xl text-xs font-display uppercase tracking-wider font-bold shadow-2xs overflow-x-auto [scrollbar-width:none]">
          {horizons.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentHorizon === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelect(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#1C1917] text-[#FAF8F5] shadow-xs'
                    : 'text-[#66615C] hover:text-[#1C1917]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4AF37]' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Real-time Save Status & Sync */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded bg-[#EAE4D7]/70 text-[#66615C] border border-[#DDD5C7]/60 shadow-2xs">
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3 h-3 text-amber-600 animate-spin" />
                <span className="text-amber-800 font-semibold">Auto-Saving...</span>
              </>
            ) : saveStatus === 'unsaved' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Unsaved edits</span>
              </>
            ) : (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-stone-600">Encrypted &amp; Saved</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Context-Aware Date Navigation & Period Jump */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E5DFC5]/60 text-xs">
        {/* Arrow Step Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#DDD5C7] text-[#44403C] hover:text-[#1C1917] hover:bg-[#F2ECE1] transition-colors shadow-2xs cursor-pointer"
            title="Previous period"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="px-3 py-1 bg-[#F2ECE1] border border-[#DDD5C7] rounded-lg text-xs font-serif font-bold text-[#1C1917] flex items-center gap-2 shadow-2xs">
            <CalendarDays className="w-3.5 h-3.5 text-[#B45309]" />
            <span>{computedLabel}</span>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#DDD5C7] text-[#44403C] hover:text-[#1C1917] hover:bg-[#F2ECE1] transition-colors shadow-2xs cursor-pointer"
            title="Next period"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Snap to Current Period & Goal Progress */}
        <div className="flex items-center gap-3">
          {!isNow && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#EAE4D7] hover:bg-[#DDD5C7] text-[#1C1917] font-display text-[10px] uppercase tracking-wider font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3 h-3 text-[#B45309]" />
              <span>Snap to Current</span>
            </button>
          )}

          {/* Month Progress Percentage Indicator */}
          {currentHorizon === 'monthly' && typeof progressVal === 'number' && (
            <div className="flex items-center gap-2 text-xs font-serif text-[#66615C]">
              <span className="text-[10px] font-display uppercase tracking-widest text-[#B45309] font-bold">
                Goal Progress
              </span>
              <div className="w-20 sm:w-28 bg-[#EAE4D7] rounded-full h-2 overflow-hidden border border-[#DDD5C7]">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progressVal))}%` }}
                />
              </div>
              <span className="font-mono font-bold text-[#1C1917] text-xs">
                {progressVal}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
