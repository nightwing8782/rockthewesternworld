'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { EnergyQuadrant, HabitMap, TriadState, DailyLedgerMetadata } from '@/types/journal';
import { createClient } from '@/lib/supabase/client';
import { Entry } from '@/types/database';
import {
  Sparkles,
  Zap,
  Compass,
  Sprout,
  BatteryCharging,
  Check,
  Calendar,
  History,
  Loader2,
  ChevronRight,
  BookOpen,
  Activity,
  PenTool,
  Moon,
} from 'lucide-react';

interface DailyPersonalLedgerProps {
  metadata?: Partial<DailyLedgerMetadata> & Record<string, any>;
  entries?: Entry[];
  onUpdateMetadata: (updated: DailyLedgerMetadata) => void;
  onSelectMemory?: (memoryEntry: Entry) => void;
}

interface WikiEvent {
  year: number;
  text: string;
}

interface PastMemory {
  year: number;
  dateStr: string;
  brightSpot: string;
  entry: Entry;
}

const DEFAULT_HABITS = [
  { id: 'movement', label: 'Movement', icon: Activity },
  { id: 'reading', label: 'Reading', icon: BookOpen },
  { id: 'writing', label: 'Fiction / Writing', icon: PenTool },
  { id: 'unplug', label: 'Unplug', icon: Moon },
];

const ENERGY_OPTIONS: {
  id: EnergyQuadrant;
  label: string;
  sub: string;
  icon: any;
  activeClass: string;
}[] = [
  {
    id: 'high_focused',
    label: 'High · Focused',
    sub: 'Deep work & clarity',
    icon: Zap,
    activeClass: 'bg-[#1C1917] text-[#FAF8F5] border-[#1C1917] shadow-sm',
  },
  {
    id: 'high_scattered',
    label: 'High · Scattered',
    sub: 'High energy, split attention',
    icon: Compass,
    activeClass: 'bg-[#B45309] text-white border-[#B45309] shadow-sm',
  },
  {
    id: 'low_reflective',
    label: 'Low · Reflective',
    sub: 'Quiet, observational mode',
    icon: Sprout,
    activeClass: 'bg-[#1E40AF] text-white border-[#1E40AF] shadow-sm',
  },
  {
    id: 'low_depleted',
    label: 'Low · Depleted',
    sub: 'Rest & restorative pace',
    icon: BatteryCharging,
    activeClass: 'bg-stone-700 text-stone-100 border-stone-700 shadow-sm',
  },
];

export default function DailyPersonalLedger({
  metadata,
  entries = [],
  onUpdateMetadata,
  onSelectMemory,
}: DailyPersonalLedgerProps) {
  // 1. Internal state synced with metadata (supporting top-level and metadata.ledger fallback)
  const energy: EnergyQuadrant = metadata?.energy || metadata?.ledger?.energy || null;
  const habits: HabitMap = metadata?.habits || metadata?.ledger?.habits || {};
  const triad: TriadState = {
    bright_spot: metadata?.triad?.bright_spot || metadata?.ledger?.triad?.bright_spot || '',
    calibration: metadata?.triad?.calibration || metadata?.ledger?.triad?.calibration || '',
    working_thought: metadata?.triad?.working_thought || metadata?.ledger?.triad?.working_thought || '',
  };

  const [localTriad, setLocalTriad] = useState<TriadState>(triad);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 2. On This Day State
  const [wikiFact, setWikiFact] = useState<WikiEvent | null>(null);
  const [isLoadingWiki, setIsLoadingWiki] = useState(true);
  const [pastMemory, setPastMemory] = useState<PastMemory | null>(null);

  // 3. Past 7 Days Rhythm Compute
  const [pastWeekRhythm, setPastWeekRhythm] = useState<{ dayLabel: string; dateNum: number; isCompleted: boolean; isToday: boolean }[]>([]);

  useEffect(() => {
    setLocalTriad({
      bright_spot: metadata?.triad?.bright_spot || metadata?.ledger?.triad?.bright_spot || '',
      calibration: metadata?.triad?.calibration || metadata?.ledger?.triad?.calibration || '',
      working_thought: metadata?.triad?.working_thought || metadata?.ledger?.triad?.working_thought || '',
    });
  }, [metadata?.triad, metadata?.ledger?.triad]);

  // Compute 7-day past week rhythm using parent entries + localStorage + today's active habits
  useEffect(() => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const result = [];
    const now = new Date();

    // Check local storage for past entries
    let savedLocal: Entry[] = [];
    try {
      const raw = localStorage.getItem('rww_local_entries');
      if (raw) savedLocal = JSON.parse(raw);
    } catch (e) {}

    // Combine all entries
    const allEntriesMap = new Map<string, Entry>();
    [...(entries || []), ...savedLocal].forEach((e) => {
      const key = e.id || e.slug || '';
      if (key && !allEntriesMap.has(key)) allEntriesMap.set(key, e);
    });
    const combinedEntries = Array.from(allEntriesMap.values());

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayLabel = days[d.getDay()];
      const dateNum = d.getDate();

      const targetYear = d.getFullYear();
      const targetMonth = d.getMonth();
      const targetDate = d.getDate();

      // Check if any habit was completed on this date
      const hasCompleted = combinedEntries.some((e) => {
        if (!e.created_at) return false;
        const entryDate = new Date(e.created_at);
        const matchesDate =
          entryDate.getFullYear() === targetYear &&
          entryDate.getMonth() === targetMonth &&
          entryDate.getDate() === targetDate;
        if (!matchesDate) return false;

        const h = e.metadata?.habits || e.metadata?.ledger?.habits;
        return h && Object.values(h).some(Boolean);
      }) || (i === 0 && Object.values(habits).some(Boolean));

      result.push({
        dayLabel,
        dateNum,
        isCompleted: Boolean(hasCompleted),
        isToday: i === 0,
      });
    }

    setPastWeekRhythm(result);
  }, [habits, entries]);

  // Fetch Wikipedia On This Day + Throwback Memory
  useEffect(() => {
    let isMounted = true;
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const currentYear = today.getFullYear();

    // A. Fetch Wikipedia fact
    async function fetchOnThisDay() {
      setIsLoadingWiki(true);
      try {
        const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/selected/${mm}/${dd}`;
        const res = await fetch(url, { headers: { 'User-Agent': 'RockTheWesternWorld/1.0' } });
        if (res.ok) {
          const data = await res.json();
          const list = data.selected || data.events || [];
          if (list.length > 0 && isMounted) {
            const chosen = list[Math.floor(Math.random() * Math.min(list.length, 5))];
            setWikiFact({ year: chosen.year, text: chosen.text });
          }
        }
      } catch (e) {
        try {
          const fallbackUrl = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/selected/${mm}/${dd}`;
          const res = await fetch(fallbackUrl);
          if (res.ok) {
            const data = await res.json();
            const list = data.selected || [];
            if (list.length > 0 && isMounted) {
              setWikiFact({ year: list[0].year, text: list[0].text });
            }
          }
        } catch (err) {}
      } finally {
        if (isMounted) setIsLoadingWiki(false);
      }
    }

    // B. Query Throwback Memory from Supabase or loaded entries
    async function fetchPastMemories() {
      try {
        let allPrivate: Entry[] = [];
        const supabase = createClient();
        const { data } = await supabase
          .from('entries')
          .select('*')
          .eq('status', 'private')
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          allPrivate = data;
        } else if (entries && entries.length > 0) {
          allPrivate = entries.filter((e) => e.status === 'private');
        }

        if (allPrivate.length > 0 && isMounted) {
          const match = allPrivate.find((item: Entry) => {
            if (!item.created_at) return false;
            const itemDate = new Date(item.created_at);
            const itemYear = itemDate.getFullYear();
            const itemMM = String(itemDate.getMonth() + 1).padStart(2, '0');
            const itemDD = String(itemDate.getDate()).padStart(2, '0');
            return itemYear < currentYear && itemMM === mm && itemDD === dd;
          });

          if (match && isMounted) {
            const itemDate = new Date(match.created_at);
            const spot = match.metadata?.triad?.bright_spot || match.metadata?.ledger?.triad?.bright_spot || match.title || match.body_html?.replace(/<[^>]+>/g, '').slice(0, 75) || 'Personal entry';
            setPastMemory({
              year: itemDate.getFullYear(),
              dateStr: itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              brightSpot: spot,
              entry: match,
            });
          }
        }
      } catch (e) {}
    }

    fetchOnThisDay();
    fetchPastMemories();

    return () => {
      isMounted = false;
    };
  }, [entries]);

  const emitUpdate = useCallback(
    (newEnergy: EnergyQuadrant, newHabits: HabitMap, newTriad: TriadState) => {
      onUpdateMetadata({
        entry_type: 'personal_ledger',
        energy: newEnergy,
        habits: newHabits,
        triad: newTriad,
      });
    },
    [onUpdateMetadata]
  );

  // Toggle Energy Quadrant
  const handleToggleEnergy = (selected: EnergyQuadrant) => {
    const nextEnergy = energy === selected ? null : selected;
    emitUpdate(nextEnergy, habits, localTriad);
  };

  // Toggle Habit
  const handleToggleHabit = (habitId: string) => {
    const nextHabits = {
      ...habits,
      [habitId]: !habits[habitId],
    };
    emitUpdate(energy, nextHabits, localTriad);
  };

  // Handle Triad text change with debouncing
  const handleTriadChange = (field: keyof TriadState, val: string) => {
    const updated = { ...localTriad, [field]: val };
    setLocalTriad(updated);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      emitUpdate(energy, habits, updated);
    }, 200);
  };

  const completedHabitsCount = Object.values(habits).filter(Boolean).length;

  return (
    <section className="mb-8 p-4 sm:p-5 bg-[#F2ECE1] border border-[#DDD5C7] rounded-lg shadow-xs space-y-6 text-[#1C1917] select-none touch-manipulation">
      {/* 1. "ON THIS DAY" ARCHIVAL MEMORY & HISTORIC ENGINE */}
      <div className="p-3.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded-md space-y-2 shadow-2xs">
        <div className="flex items-center justify-between gap-2 border-b border-[#E5DFC5] pb-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#B45309]" />
            <span className="text-[10px] font-display font-black uppercase tracking-[0.2em] text-[#B45309]">
              ON THIS DAY
            </span>
          </div>
          <span className="text-[11px] font-serif text-[#66615C] italic">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </span>
        </div>

        {/* Prior Year Throwback Memory (if found) */}
        {pastMemory && (
          <button
            type="button"
            onClick={() => onSelectMemory && onSelectMemory(pastMemory.entry)}
            className="w-full text-left p-2 bg-amber-50/80 hover:bg-amber-100/70 border border-amber-200/80 rounded flex items-center justify-between gap-2 transition-colors cursor-pointer group"
          >
            <div className="min-w-0 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
              <p className="text-xs font-serif text-[#78350F] truncate">
                <span className="font-bold font-display uppercase text-[10px] tracking-wider text-[#92400E]">
                  {pastMemory.year} Throwback:
                </span>{' '}
                "{pastMemory.brightSpot}"
              </p>
            </div>
            <span className="text-[10px] font-display uppercase tracking-wider text-[#B45309] font-bold shrink-0 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              <span>View</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </button>
        )}

        {/* Wikipedia Historic Fact */}
        <div className="text-xs font-serif text-[#44403C] flex items-start gap-2 pt-0.5">
          <History className="w-3.5 h-3.5 text-[#78716C] shrink-0 mt-0.5" />
          {isLoadingWiki ? (
            <div className="flex items-center gap-1.5 text-stone-400 italic">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Scanning annals of history...</span>
            </div>
          ) : wikiFact ? (
            <p className="leading-relaxed">
              <span className="font-display font-bold text-[#1C1917] tracking-wider mr-1">
                {wikiFact.year}:
              </span>
              {wikiFact.text}
            </p>
          ) : (
            <p className="italic text-[#78716C]">A clean page in history.</p>
          )}
        </div>
      </div>

      {/* 2. ENERGY & CLARITY QUADRANT */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-display font-black uppercase tracking-[0.2em] text-[#1C1917]">
            ENERGY &amp; CLARITY QUADRANT
          </label>
          <span className="text-[10px] font-serif text-[#66615C] italic">
            {energy ? 'State calibrated' : 'Tap to register state'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {ENERGY_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = energy === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleToggleEnergy(opt.id)}
                className={`min-h-[44px] p-2.5 sm:p-3 rounded-md border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  isSelected
                    ? opt.activeClass
                    : 'bg-[#FAF8F5] hover:bg-[#EAE4D7] border-[#DDD5C7] text-[#44403C]'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div
                  className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-stone-200/70 text-[#44403C]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-display font-bold uppercase tracking-wider leading-tight">
                    {opt.label}
                  </div>
                  <div
                    className={`text-[10px] font-serif truncate ${
                      isSelected ? 'text-white/80' : 'text-[#78716C]'
                    }`}
                  >
                    {opt.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. DAILY HABIT RAIL & 7-DAY RHYTHM */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-display font-black uppercase tracking-[0.2em] text-[#1C1917]">
              DAILY HABIT RAIL &amp; 7-DAY RHYTHM
            </label>
            {completedHabitsCount > 0 && (
              <span className="text-[9px] font-display uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300/80">
                {completedHabitsCount}/4 done today
              </span>
            )}
          </div>
          <span className="text-[10px] font-serif text-[#66615C] italic">
            Non-punitive momentum
          </span>
        </div>

        {/* 7-Day Minimal Rhythm Dots */}
        <div className="p-2 bg-[#FAF8F5] border border-[#DDD5C7] rounded-md flex items-center justify-between px-3">
          <span className="text-[10px] font-display uppercase tracking-widest text-[#78716C] font-semibold">
            Past 7 Days:
          </span>
          <div className="flex items-center gap-3">
            {pastWeekRhythm.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <span
                  className={`text-[9px] font-display font-bold ${
                    item.isToday ? 'text-[#1E40AF]' : 'text-[#78716C]'
                  }`}
                >
                  {item.dayLabel}
                </span>
                <div
                  className={`w-3 h-3 rounded-full transition-all ${
                    item.isCompleted
                      ? 'bg-emerald-600 border border-emerald-700 shadow-2xs'
                      : item.isToday
                      ? 'border-2 border-[#1E40AF] bg-transparent'
                      : 'border border-stone-300 bg-stone-100'
                  }`}
                  title={`${item.dayLabel} ${item.dateNum}: ${item.isCompleted ? 'Active' : 'Rest'}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Touch Habit Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DEFAULT_HABITS.map((h) => {
            const Icon = h.icon;
            const isDone = Boolean(habits[h.id]);
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => handleToggleHabit(h.id)}
                className={`min-h-[44px] px-3 py-2 rounded-md border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  isDone
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                    : 'bg-[#FAF8F5] hover:bg-[#EAE4D7] border-[#DDD5C7] text-[#44403C]'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isDone ? 'text-emerald-700' : 'text-[#78716C]'
                    }`}
                  />
                  <span className="text-xs font-display font-bold uppercase tracking-wider truncate">
                    {h.label}
                  </span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : 'border border-stone-300 bg-white'
                  }`}
                >
                  {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. THE REFLECTION TRIAD */}
      <div className="space-y-3 pt-2 border-t border-[#DDD5C7]">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-display font-black uppercase tracking-[0.2em] text-[#1C1917]">
            THE REFLECTION TRIAD
          </label>
          <span className="text-[10px] font-serif text-[#66615C] italic">
            Micro-observations of the day
          </span>
        </div>

        <div className="space-y-2.5">
          {/* Bright Spot */}
          <div className="p-2.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded-md space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-emerald-800">
              <span className="text-emerald-600 text-sm font-black">+</span>
              <span>Bright Spot</span>
            </div>
            <textarea
              rows={1}
              value={localTriad.bright_spot}
              onChange={(e) => handleTriadChange('bright_spot', e.target.value)}
              placeholder="A small win or moment of gratitude..."
              className="w-full bg-transparent border-none outline-none text-xs font-serif text-[#1C1917] placeholder:text-[#9C9589] resize-none leading-relaxed"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
          </div>

          {/* Calibration */}
          <div className="p-2.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded-md space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-[#B45309]">
              <span className="text-[#B45309] text-sm font-black">△</span>
              <span>Calibration</span>
            </div>
            <textarea
              rows={1}
              value={localTriad.calibration}
              onChange={(e) => handleTriadChange('calibration', e.target.value)}
              placeholder="Something to adjust or do differently..."
              className="w-full bg-transparent border-none outline-none text-xs font-serif text-[#1C1917] placeholder:text-[#9C9589] resize-none leading-relaxed"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
          </div>

          {/* Working Thought */}
          <div className="p-2.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded-md space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-[#1E40AF]">
              <span className="text-[#1E40AF] text-sm font-black">•</span>
              <span>Working Thought</span>
            </div>
            <textarea
              rows={1}
              value={localTriad.working_thought}
              onChange={(e) => handleTriadChange('working_thought', e.target.value)}
              placeholder="An idea, lyric, or observation that lingered..."
              className="w-full bg-transparent border-none outline-none text-xs font-serif text-[#1C1917] placeholder:text-[#9C9589] resize-none leading-relaxed"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
