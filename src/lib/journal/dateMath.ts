import { Entry } from '@/types/database';
import { EnergyQuadrant, HabitMap } from '@/types/journal';

/**
 * Returns ISO week number and year for any Date object
 */
export function getISOWeekNumber(d: Date): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week: weekNo };
}

/**
 * Pads a number with leading zero
 */
export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Format date as 'YYYY-MM-DD'
 */
export function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${year}-${month}-${day}`;
}

/**
 * Format month key as 'YYYY-MM'
 */
export function formatMonthKey(d: Date): string {
  const year = d.getFullYear();
  const month = pad2(d.getMonth() + 1);
  return `${year}-${month}`;
}

/**
 * Format week key as 'YYYY-Www'
 */
export function formatWeekKey(d: Date): string {
  const { year, week } = getISOWeekNumber(d);
  return `${year}-W${pad2(week)}`;
}

/**
 * Get deterministic document slugs
 */
export function getDaySlug(dateKey: string): string {
  return `ledger-${dateKey}`;
}

export function getWeekSlug(weekKey: string): string {
  return `ledger-week-${weekKey}`;
}

export function getMonthSlug(monthKey: string): string {
  return `ledger-month-${monthKey}`;
}

export function getCompassSlug(year: number): string {
  return `ledger-compass-${year}`;
}

/**
 * Parse keys back into components
 */
export function parseMonthKey(monthKey: string): { year: number; month: number } {
  const [y, m] = monthKey.split('-').map(Number);
  return { year: y || new Date().getFullYear(), month: m || new Date().getMonth() + 1 };
}

export function parseWeekKey(weekKey: string): { year: number; week: number } {
  const [yStr, wStr] = weekKey.split('-W');
  return { year: Number(yStr) || new Date().getFullYear(), week: Number(wStr) || 1 };
}

/**
 * Get Month Label: e.g. "October 2026"
 */
export function getMonthLabel(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Navigate to adjacent month (supports either (year, month, dir) or (monthKey, offset))
 */
export function getAdjacentMonth(
  yearOrKey: number | string,
  monthOrOffset?: number | 'prev' | 'next',
  maybeDir?: 'prev' | 'next'
): string {
  let y: number;
  let m: number;
  let dirOffset = 1;

  if (typeof yearOrKey === 'string') {
    const parsed = parseMonthKey(yearOrKey);
    y = parsed.year;
    m = parsed.month;
    if (typeof monthOrOffset === 'number') {
      dirOffset = monthOrOffset;
    } else if (monthOrOffset === 'prev') {
      dirOffset = -1;
    }
  } else {
    y = yearOrKey;
    m = typeof monthOrOffset === 'number' ? monthOrOffset : 1;
    if (maybeDir === 'prev' || monthOrOffset === 'prev') {
      dirOffset = -1;
    }
  }

  let newMonth = m + dirOffset;
  let newYear = y;
  while (newMonth > 12) {
    newMonth -= 12;
    newYear += 1;
  }
  while (newMonth < 1) {
    newMonth += 12;
    newYear -= 1;
  }

  return `${newYear}-${pad2(newMonth)}`;
}

/**
 * Get list of all days in a month for 31-day heatmap
 */
export interface MonthDayInfo {
  dayNum: number;
  dateKey: string;
  weekday: string;
  weekdayShort: string;
  isToday: boolean;
  isPast: boolean;
  isWeekend: boolean;
}

export function getDaysInMonth(year: number, month: number): MonthDayInfo[] {
  const todayKey = formatDateKey(new Date());
  const daysCount = new Date(year, month, 0).getDate();
  const days: MonthDayInfo[] = [];

  for (let i = 1; i <= daysCount; i++) {
    const d = new Date(year, month - 1, i);
    const dateKey = `${year}-${pad2(month)}-${pad2(i)}`;
    const dayOfWeek = d.getDay();
    days.push({
      dayNum: i,
      dateKey,
      weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
      weekdayShort: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      isToday: dateKey === todayKey,
      isPast: dateKey < todayKey,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }

  return days;
}

export interface WeekDayInfo {
  dayNum: number;
  dayNumber: number;
  dateKey: string;
  weekday: string;
  dayName: string;
  weekdayShort: string;
  monthName: string;
  date: Date;
  isToday: boolean;
}

/**
 * Format date as 'YYYY-MM-DD' strictly from UTC components
 */
export function formatUTCDateKey(d: Date): string {
  const year = d.getUTCFullYear();
  const month = pad2(d.getUTCMonth() + 1);
  const day = pad2(d.getUTCDate());
  return `${year}-${month}-${day}`;
}

/**
 * Get start and end Date objects for an ISO week
 */
export function getWeekDates(yearOrWeekKey: number | string, maybeWeekNumber?: number): WeekDayInfo[] {
  let year: number;
  let weekNumber: number;

  if (typeof yearOrWeekKey === 'string') {
    const parsed = parseWeekKey(yearOrWeekKey);
    year = parsed.year;
    weekNumber = parsed.week;
  } else {
    year = yearOrWeekKey;
    weekNumber = maybeWeekNumber || 1;
  }

  const simple = new Date(Date.UTC(year, 0, 1 + (weekNumber - 1) * 7));
  const dow = simple.getUTCDay();
  const isoWeekStart = new Date(simple);
  if (dow <= 4) {
    isoWeekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
  } else {
    isoWeekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
  }

  const todayKey = formatDateKey(new Date());
  const weekDays: WeekDayInfo[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(isoWeekStart);
    d.setUTCDate(isoWeekStart.getUTCDate() + i);
    const dateKey = formatUTCDateKey(d);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    const dayNum = d.getUTCDate();
    weekDays.push({
      dayNum,
      dayNumber: dayNum,
      dateKey,
      weekday: dayName,
      dayName,
      weekdayShort: d.toLocaleDateString('en-US', { weekday: 'narrow', timeZone: 'UTC' }),
      monthName: d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
      date: d,
      isToday: dateKey === todayKey,
    });
  }

  return weekDays;
}

/**
 * Returns the primary month ('YYYY-MM') that an ISO week belongs to.
 * Under ISO 8601, a week belongs to the month containing its Thursday (majority 4+ days).
 */
export function getPrimaryMonthForWeek(yearOrWeekKey: number | string, maybeWeekNumber?: number): string {
  const dates = getWeekDates(yearOrWeekKey, maybeWeekNumber);
  const thursday = dates[3];
  if (thursday) {
    const y = thursday.date.getUTCFullYear();
    const m = pad2(thursday.date.getUTCMonth() + 1);
    return `${y}-${m}`;
  }
  return formatMonthKey(new Date());
}

/**
 * Get formatted Week Label: e.g. "Week 40 · Oct 5 – Oct 11, 2026"
 */
export function getWeekLabel(yearOrWeekKey: number | string, maybeWeekNumber?: number): string {
  let year: number;
  let weekNumber: number;

  if (typeof yearOrWeekKey === 'string') {
    const parsed = parseWeekKey(yearOrWeekKey);
    year = parsed.year;
    weekNumber = parsed.week;
  } else {
    year = yearOrWeekKey;
    weekNumber = maybeWeekNumber || 1;
  }

  const days = getWeekDates(year, weekNumber);
  if (days.length === 0) return `Week ${weekNumber} (${year})`;
  const start = days[0];
  const end = days[6];
  return `Week ${weekNumber} · ${start.monthName} ${start.dayNum} – ${end.monthName} ${end.dayNum}, ${year}`;
}

/**
 * Navigate to adjacent week
 */
export function getAdjacentWeek(
  yearOrWeekKey: number | string,
  weekOrOffset?: number | 'prev' | 'next',
  maybeDir?: 'prev' | 'next'
): string {
  let year: number;
  let weekNumber: number;
  let dirOffset = 1;

  if (typeof yearOrWeekKey === 'string') {
    const parsed = parseWeekKey(yearOrWeekKey);
    year = parsed.year;
    weekNumber = parsed.week;
    if (typeof weekOrOffset === 'number') {
      dirOffset = weekOrOffset;
    } else if (weekOrOffset === 'prev') {
      dirOffset = -1;
    }
  } else {
    year = yearOrWeekKey;
    weekNumber = typeof weekOrOffset === 'number' ? weekOrOffset : 1;
    if (maybeDir === 'prev' || weekOrOffset === 'prev') {
      dirOffset = -1;
    }
  }

  let newYear = year;
  let newWeek = weekNumber + dirOffset;
  if (newWeek > 52) {
    newWeek = 1;
    newYear += 1;
  } else if (newWeek < 1) {
    newWeek = 52;
    newYear -= 1;
  }

  return `${newYear}-W${pad2(newWeek)}`;
}

// ==========================================
// TWO-WAY ROLL-UP AGGREGATORS
// ==========================================

/**
 * Scans all daily ledger entries in a given month and builds a 1..31 habit completion heatmap matrix
 */
export function aggregateMonthlyHabitHeatmap(
  entries: Entry[],
  year: number,
  month: number
): { [habitId: string]: { [dayNum: number]: boolean } } {
  const monthPrefix = `${year}-${pad2(month)}`;
  const matrix: { [habitId: string]: { [dayNum: number]: boolean } } = {
    movement: {},
    reading: {},
    writing: {},
    unplug: {},
  };

  entries.forEach((entry) => {
    if (entry.status !== 'private' && entry.entry_type !== 'personal_ledger') return;
    
    const dateKey = entry.metadata?.dateKey || (entry.created_at ? formatDateKey(new Date(entry.created_at)) : '');
    if (!dateKey || !dateKey.startsWith(monthPrefix)) return;

    const dayNum = parseInt(dateKey.slice(8, 10), 10);
    if (!dayNum || isNaN(dayNum)) return;

    const habits: HabitMap = entry.metadata?.habits || entry.metadata?.ledger?.habits || {};
    Object.keys(habits).forEach((hId) => {
      if (!matrix[hId]) matrix[hId] = {};
      if (habits[hId]) {
        matrix[hId][dayNum] = true;
      }
    });
  });

  return matrix;
}

/**
 * Pulls all (+) Bright Spots logged across a given month for reflection roll-up
 */
export function aggregateMonthlyWins(
  entries: Entry[],
  yearOrMonthKey: number | string,
  maybeMonth?: number
): { dateKey: string; dayNum: number; dateFormatted: string; brightSpot: string }[] {
  let year: number;
  let month: number;

  if (typeof yearOrMonthKey === 'string') {
    const parsed = parseMonthKey(yearOrMonthKey);
    year = parsed.year;
    month = parsed.month;
  } else {
    year = yearOrMonthKey;
    month = maybeMonth || 1;
  }

  const monthPrefix = `${year}-${pad2(month)}`;
  const wins: { dateKey: string; dayNum: number; dateFormatted: string; brightSpot: string }[] = [];

  entries.forEach((entry) => {
    if (entry.status !== 'private' && entry.entry_type !== 'personal_ledger') return;

    const dateKey = entry.metadata?.dateKey || (entry.created_at ? formatDateKey(new Date(entry.created_at)) : '');
    if (!dateKey || !dateKey.startsWith(monthPrefix)) return;

    const brightSpot = entry.metadata?.triad?.bright_spot || entry.metadata?.ledger?.triad?.bright_spot || '';
    if (!brightSpot.trim()) return;

    const dayNum = parseInt(dateKey.slice(8, 10), 10);
    const dateFormatted = new Date(year, month - 1, dayNum).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    wins.push({
      dateKey,
      dayNum,
      dateFormatted,
      brightSpot: brightSpot.trim(),
    });
  });

  return wins.sort((a, b) => a.dayNum - b.dayNum);
}

/**
 * Pulls all (+) Bright Spots logged across a specific 7-day week
 */
export function aggregateWeeklyWins(
  entries: Entry[],
  weekKeyOrWeekDays: string | { dateKey: string; weekday?: string; dayName?: string; monthName?: string; dayNum?: number }[]
): { dateKey: string; dayLabel: string; brightSpot: string }[] {
  let weekDays: { dateKey: string; weekday: string; monthName: string; dayNum: number }[];

  if (typeof weekKeyOrWeekDays === 'string') {
    const days = getWeekDates(weekKeyOrWeekDays);
    weekDays = days.map((d) => ({
      dateKey: d.dateKey,
      weekday: d.weekday,
      monthName: d.monthName,
      dayNum: d.dayNum,
    }));
  } else {
    weekDays = weekKeyOrWeekDays.map((d) => ({
      dateKey: d.dateKey,
      weekday: d.weekday || d.dayName || '',
      monthName: d.monthName || '',
      dayNum: d.dayNum || 0,
    }));
  }

  const dateKeySet = new Set(weekDays.map((d) => d.dateKey));
  const wins: { dateKey: string; dayLabel: string; brightSpot: string }[] = [];

  entries.forEach((entry) => {
    if (entry.status !== 'private' && entry.entry_type !== 'personal_ledger') return;

    const dateKey = entry.metadata?.dateKey || (entry.created_at ? formatDateKey(new Date(entry.created_at)) : '');
    if (!dateKey || !dateKeySet.has(dateKey)) return;

    const brightSpot = entry.metadata?.triad?.bright_spot || entry.metadata?.ledger?.triad?.bright_spot || '';
    if (!brightSpot.trim()) return;

    const dayInfo = weekDays.find((d) => d.dateKey === dateKey);
    const dayLabel = dayInfo ? `${dayInfo.weekday} (${dayInfo.monthName} ${dayInfo.dayNum})` : dateKey;

    wins.push({
      dateKey,
      dayLabel,
      brightSpot: brightSpot.trim(),
    });
  });

  return wins;
}

/**
 * Aggregates Energy quadrant counts across a set of date keys
 */
export function aggregateEnergyDistribution(
  entries: Entry[],
  dateKeys: string[]
): { high_focused: number; high_scattered: number; low_reflective: number; low_depleted: number } {
  const dateSet = new Set(dateKeys);
  const counts = {
    high_focused: 0,
    high_scattered: 0,
    low_reflective: 0,
    low_depleted: 0,
  };

  entries.forEach((entry) => {
    if (entry.status !== 'private' && entry.entry_type !== 'personal_ledger') return;
    const dateKey = entry.metadata?.dateKey || (entry.created_at ? formatDateKey(new Date(entry.created_at)) : '');
    if (!dateKey || !dateSet.has(dateKey)) return;

    const energy: EnergyQuadrant = entry.metadata?.energy || entry.metadata?.ledger?.energy || null;
    if (energy && counts[energy] !== undefined) {
      counts[energy] += 1;
    }
  });

  return counts;
}
