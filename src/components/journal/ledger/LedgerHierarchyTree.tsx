'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Compass,
  Target,
  Calendar,
  Sun,
  ChevronDown,
  ChevronRight,
  Trash2,
  Sparkles,
  Zap,
  Sprout,
  BatteryCharging,
} from 'lucide-react';
import { Entry } from '@/types/database';
import { LedgerHorizon } from '@/types/journal';
import {
  formatDateKey,
  formatWeekKey,
  formatMonthKey,
  getMonthLabel,
  getWeekLabel,
  getDaySlug,
  getWeekSlug,
  getMonthSlug,
  getCompassSlug,
} from '@/lib/journal/dateMath';

interface LedgerHierarchyTreeProps {
  entries: Entry[];
  activeHorizon: LedgerHorizon;
  selectedDateKey: string;
  selectedWeekKey: string;
  selectedMonthKey: string;
  selectedYear: number;
  searchFilter: string;
  onSelectCompass: (year: number) => void;
  onSelectMonth: (monthKey: string) => void;
  onSelectWeek: (weekKey: string) => void;
  onSelectDay: (dateKey: string, entry?: Entry) => void;
  onDeleteEntry: (entry: Entry) => void;
}

interface DayNode {
  dateKey: string;
  dateStr: string;
  dayLabel: string;
  entry?: Entry;
  brightSpot?: string;
  energy?: string | null;
  habitCount?: number;
}

interface WeekNode {
  weekKey: string;
  weekLabel: string;
  entry?: Entry;
  days: DayNode[];
}

interface MonthNode {
  monthKey: string;
  monthLabel: string;
  year: number;
  monthNum: number;
  entry?: Entry;
  weeks: WeekNode[];
  totalDays: number;
}

export default function LedgerHierarchyTree({
  entries,
  activeHorizon,
  selectedDateKey,
  selectedWeekKey,
  selectedMonthKey,
  selectedYear,
  searchFilter,
  onSelectCompass,
  onSelectMonth,
  onSelectWeek,
  onSelectDay,
  onDeleteEntry,
}: LedgerHierarchyTreeProps) {
  // Expansion State
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<string>>(new Set());

  // Auto-expand active month/week on selection
  useEffect(() => {
    if (selectedMonthKey) {
      setCollapsedMonths((prev) => {
        const next = new Set(prev);
        next.delete(selectedMonthKey);
        return next;
      });
    }
    if (selectedWeekKey) {
      setCollapsedWeeks((prev) => {
        const next = new Set(prev);
        next.delete(selectedWeekKey);
        return next;
      });
    }
  }, [selectedMonthKey, selectedWeekKey]);

  const toggleMonth = (mKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(mKey)) next.delete(mKey);
      else next.add(mKey);
      return next;
    });
  };

  const toggleWeek = (wKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(wKey)) next.delete(wKey);
      else next.add(wKey);
      return next;
    });
  };

  // Group entries into hierarchy
  const tree = useMemo(() => {
    const monthsMap = new Map<string, MonthNode>();
    const now = new Date();
    const currentMonthKey = formatMonthKey(now);
    const currentWeekKey = formatWeekKey(now);

    // Ensure current month exists in tree even if no entries yet
    const [curY, curM] = currentMonthKey.split('-').map(Number);
    monthsMap.set(currentMonthKey, {
      monthKey: currentMonthKey,
      monthLabel: getMonthLabel(curY, curM),
      year: curY,
      monthNum: curM,
      weeks: [],
      totalDays: 0,
    });

    // 1. Scan private entries
    entries.forEach((entry) => {
      const isDaily =
        entry.metadata?.horizon === 'daily' ||
        (!entry.metadata?.horizon && entry.entry_type === 'personal_ledger');
      const isMonthly = entry.metadata?.horizon === 'monthly';
      const isWeekly = entry.metadata?.horizon === 'weekly';

      if (isMonthly) {
        const mKey = entry.metadata?.monthKey || (entry.created_at ? formatMonthKey(new Date(entry.created_at)) : '');
        if (mKey) {
          const [y, m] = mKey.split('-').map(Number);
          const existing = monthsMap.get(mKey);
          if (existing) {
            existing.entry = entry;
          } else {
            monthsMap.set(mKey, {
              monthKey: mKey,
              monthLabel: getMonthLabel(y, m),
              year: y,
              monthNum: m,
              entry,
              weeks: [],
              totalDays: 0,
            });
          }
        }
      }

      if (isWeekly) {
        const wKey = entry.metadata?.weekKey || (entry.created_at ? formatWeekKey(new Date(entry.created_at)) : '');
        const mKey = entry.metadata?.monthKey || (entry.created_at ? formatMonthKey(new Date(entry.created_at)) : '');
        if (wKey && mKey) {
          const [y, m] = mKey.split('-').map(Number);
          let mNode = monthsMap.get(mKey);
          if (!mNode) {
            mNode = {
              monthKey: mKey,
              monthLabel: getMonthLabel(y, m),
              year: y,
              monthNum: m,
              weeks: [],
              totalDays: 0,
            };
            monthsMap.set(mKey, mNode);
          }
          let wNode = mNode.weeks.find((w) => w.weekKey === wKey);
          if (!wNode) {
            wNode = {
              weekKey: wKey,
              weekLabel: getWeekLabel(wKey),
              entry,
              days: [],
            };
            mNode.weeks.push(wNode);
          } else {
            wNode.entry = entry;
          }
        }
      }

      if (isDaily) {
        const dKey = entry.metadata?.dateKey || (entry.created_at ? formatDateKey(new Date(entry.created_at)) : '');
        if (!dKey) return;

        const dObj = new Date(dKey + 'T12:00:00');
        const mKey = formatMonthKey(dObj);
        const wKey = formatWeekKey(dObj);
        const [y, m] = mKey.split('-').map(Number);

        let mNode = monthsMap.get(mKey);
        if (!mNode) {
          mNode = {
            monthKey: mKey,
            monthLabel: getMonthLabel(y, m),
            year: y,
            monthNum: m,
            weeks: [],
            totalDays: 0,
          };
          monthsMap.set(mKey, mNode);
        }

        let wNode = mNode.weeks.find((w) => w.weekKey === wKey);
        if (!wNode) {
          wNode = {
            weekKey: wKey,
            weekLabel: getWeekLabel(wKey),
            days: [],
          };
          mNode.weeks.push(wNode);
        }

        const energy = entry.metadata?.energy || entry.metadata?.ledger?.energy || null;
        const brightSpot = entry.metadata?.triad?.bright_spot || entry.metadata?.ledger?.triad?.bright_spot || '';
        const habits = entry.metadata?.habits || entry.metadata?.ledger?.habits || {};
        const habitCount = Object.values(habits).filter(Boolean).length;

        const dayLabel = !isNaN(dObj.getTime())
          ? dObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          : dKey;

        // Check if day already recorded under week
        const existingDay = wNode.days.find((d) => d.dateKey === dKey);
        if (!existingDay) {
          wNode.days.push({
            dateKey: dKey,
            dateStr: dKey,
            dayLabel,
            entry,
            brightSpot,
            energy,
            habitCount,
          });
          mNode.totalDays += 1;
        }
      }
    });

    // Sort months descending, weeks descending, days descending
    const sortedMonths = Array.from(monthsMap.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
    sortedMonths.forEach((m) => {
      m.weeks.sort((a, b) => b.weekKey.localeCompare(a.weekKey));
      m.weeks.forEach((w) => {
        w.days.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
      });
    });

    return sortedMonths;
  }, [entries]);

  // Search Filter Filtered Tree
  const filteredTree = useMemo(() => {
    if (!searchFilter.trim()) return tree;
    const q = searchFilter.toLowerCase();

    return tree
      .map((month) => {
        const monthMatch = month.monthLabel.toLowerCase().includes(q);

        const filteredWeeks = month.weeks
          .map((week) => {
            const weekMatch = week.weekLabel.toLowerCase().includes(q);

            const filteredDays = week.days.filter((day) => {
              const labelMatch = day.dayLabel.toLowerCase().includes(q);
              const brightMatch = (day.brightSpot || '').toLowerCase().includes(q);
              const bodyMatch = (day.entry?.body_html || '').toLowerCase().includes(q);
              const titleMatch = (day.entry?.title || '').toLowerCase().includes(q);
              return labelMatch || brightMatch || bodyMatch || titleMatch;
            });

            if (weekMatch || filteredDays.length > 0) {
              return {
                ...week,
                days: filteredDays.length > 0 ? filteredDays : week.days,
              };
            }
            return null;
          })
          .filter(Boolean) as WeekNode[];

        if (monthMatch || filteredWeeks.length > 0) {
          return {
            ...month,
            weeks: filteredWeeks,
          };
        }
        return null;
      })
      .filter(Boolean) as MonthNode[];
  }, [tree, searchFilter]);

  const renderEnergyPill = (energy?: string | null) => {
    switch (energy) {
      case 'high_focused':
        return <span className="text-[8px] font-display font-bold uppercase tracking-wider text-amber-950 bg-amber-200/90 px-1 py-0.5 rounded">⚡ Focused</span>;
      case 'high_scattered':
        return <span className="text-[8px] font-display font-bold uppercase tracking-wider text-orange-950 bg-orange-200/90 px-1 py-0.5 rounded">🌀 High</span>;
      case 'low_reflective':
        return <span className="text-[8px] font-display font-bold uppercase tracking-wider text-blue-950 bg-blue-200/90 px-1 py-0.5 rounded">🌱 Reflect</span>;
      case 'low_depleted':
        return <span className="text-[8px] font-display font-bold uppercase tracking-wider text-stone-900 bg-stone-200 px-1 py-0.5 rounded">🔋 Rest</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3 font-serif select-none text-xs">
      {/* 1. TOP PINNED ANNUAL HORIZON: COMPASS & ROADMAP */}
      <div
        onClick={() => onSelectCompass(selectedYear)}
        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all cursor-pointer shadow-2xs group ${
          activeHorizon === 'compass'
            ? 'bg-[#1C1917] border-[#1C1917] text-[#FAF8F5]'
            : 'bg-[#FAF8F5] hover:bg-[#F2ECE1] border-[#DDD5C7] text-[#1C1917]'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              activeHorizon === 'compass' ? 'bg-amber-500 text-stone-900' : 'bg-amber-100 text-[#B45309]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span
              className={`text-[9px] font-display uppercase tracking-widest font-black block leading-none ${
                activeHorizon === 'compass' ? 'text-amber-400' : 'text-[#B45309]'
              }`}
            >
              Annual Compass
            </span>
            <span className="font-display font-bold text-xs truncate">
              {selectedYear} Passion Roadmap
            </span>
          </div>
        </div>

        <span
          className={`text-[9px] font-display uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border shrink-0 ${
            activeHorizon === 'compass'
              ? 'bg-white/10 text-white border-white/20'
              : 'bg-amber-50 text-[#B45309] border-amber-200'
          }`}
        >
          North Star
        </span>
      </div>

      {/* 2. NESTED TREE: MONTHS -> WEEKS -> DAYS */}
      <div className="space-y-2">
        {filteredTree.map((month) => {
          const isMonthActive = activeHorizon === 'monthly' && selectedMonthKey === month.monthKey;
          const isMonthCollapsed = collapsedMonths.has(month.monthKey);

          return (
            <div
              key={month.monthKey}
              className="bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl overflow-hidden shadow-2xs"
            >
              {/* MONTH HEADER */}
              <div
                onClick={() => onSelectMonth(month.monthKey)}
                className={`px-2.5 py-2 flex items-center justify-between gap-1.5 transition-colors cursor-pointer group ${
                  isMonthActive
                    ? 'bg-[#B45309] text-white font-bold'
                    : 'bg-[#F2ECE1]/70 hover:bg-[#EAE4D7] text-[#1C1917]'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => toggleMonth(month.monthKey, e)}
                    className={`p-0.5 rounded hover:bg-black/10 transition-transform cursor-pointer ${
                      isMonthActive ? 'text-white' : 'text-[#78716C]'
                    }`}
                  >
                    {isMonthCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <Target className={`w-3.5 h-3.5 shrink-0 ${isMonthActive ? 'text-amber-200' : 'text-[#B45309]'}`} />
                  <span className="font-display font-bold text-xs uppercase tracking-wider truncate">
                    {month.monthLabel}
                  </span>
                </div>

                <span
                  className={`text-[9px] font-display uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                    isMonthActive
                      ? 'bg-white/20 text-white border-white/30'
                      : 'bg-stone-200/70 text-stone-700 border-stone-300'
                  }`}
                >
                  Horizon
                </span>
              </div>

              {/* MONTH BODY: WEEKS & DAYS */}
              {!isMonthCollapsed && (
                <div className="p-1.5 space-y-1.5 bg-[#FAF8F5]">
                  {month.weeks.map((week) => {
                    const isWeekActive = activeHorizon === 'weekly' && selectedWeekKey === week.weekKey;
                    const isWeekCollapsed = collapsedWeeks.has(week.weekKey);

                    return (
                      <div
                        key={week.weekKey}
                        className="border border-[#E5DFC5] rounded-lg overflow-hidden bg-white/70"
                      >
                        {/* WEEK HEADER */}
                        <div
                          onClick={() => onSelectWeek(week.weekKey)}
                          className={`px-2 py-1.5 flex items-center justify-between gap-1.5 transition-colors cursor-pointer ${
                            isWeekActive
                              ? 'bg-[#1E40AF] text-white font-semibold'
                              : 'bg-[#FAF8F5] hover:bg-[#F2ECE1] text-[#44403C]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => toggleWeek(week.weekKey, e)}
                              className={`p-0.5 rounded hover:bg-black/10 transition-transform cursor-pointer ${
                                isWeekActive ? 'text-white' : 'text-[#78716C]'
                              }`}
                            >
                              {isWeekCollapsed ? (
                                <ChevronRight className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>

                            <Calendar className={`w-3 h-3 shrink-0 ${isWeekActive ? 'text-blue-200' : 'text-[#1E40AF]'}`} />
                            <span className="font-display font-semibold text-[11px] truncate">
                              {week.weekLabel.split(' · ')[0]}
                            </span>
                            <span
                              className={`text-[10px] font-serif truncate ${
                                isWeekActive ? 'text-blue-100' : 'text-[#78716C]'
                              }`}
                            >
                              {week.weekLabel.split(' · ')[1] || ''}
                            </span>
                          </div>

                          <span
                            className={`text-[8px] font-display uppercase tracking-wider font-bold px-1 py-0.2 rounded border shrink-0 ${
                              isWeekActive
                                ? 'bg-white/20 text-white border-white/30'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}
                          >
                            Week
                          </span>
                        </div>

                        {/* WEEK BODY: DAYS */}
                        {!isWeekCollapsed && (
                          <div className="py-1 px-1 space-y-1 bg-[#FAF8F5]/80">
                            {week.days.map((day) => {
                              const isDayActive =
                                activeHorizon === 'daily' && selectedDateKey === day.dateKey;

                              return (
                                <div
                                  key={day.dateKey}
                                  onClick={() => onSelectDay(day.dateKey, day.entry)}
                                  className={`p-1.5 rounded-md flex items-center justify-between gap-1.5 transition-all cursor-pointer group border ${
                                    isDayActive
                                      ? 'bg-[#F2ECE1] border-[#B45309] shadow-2xs font-semibold'
                                      : 'border-transparent hover:bg-[#EAE4D7]/70 text-[#44403C]'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <Sun
                                      className={`w-3 h-3 shrink-0 ${
                                        isDayActive ? 'text-[#B45309]' : 'text-[#78716C]'
                                      }`}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-display font-bold text-[10px] text-[#1C1917] truncate">
                                          {day.dayLabel}
                                        </span>
                                        {day.habitCount !== undefined && day.habitCount > 0 && (
                                          <span className="text-[7px] font-display font-bold uppercase tracking-wider text-emerald-900 bg-emerald-100 px-1 py-0.2 rounded border border-emerald-300/80">
                                            ✓ {day.habitCount}/4
                                          </span>
                                        )}
                                        {renderEnergyPill(day.energy)}
                                      </div>

                                      {day.brightSpot && (
                                        <p className="text-[10px] font-serif text-[#78350F] italic truncate mt-0.5 leading-tight">
                                          ✦ {day.brightSpot}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {day.entry && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteEntry(day.entry!);
                                      }}
                                      className="p-1 text-stone-400 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                                      title="Delete entry"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}

                            {week.days.length === 0 && (
                              <p className="text-[10px] text-stone-400 italic text-center py-1">
                                No check-ins logged for this week.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {month.weeks.length === 0 && (
                    <p className="text-[10px] text-stone-400 italic text-center py-1">
                      No weekly logs recorded.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredTree.length === 0 && (
          <p className="text-xs text-stone-400 italic text-center py-6">
            No entries match your search.
          </p>
        )}
      </div>
    </div>
  );
}
