'use client';

import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Sparkles,
  Target,
  Plus,
  Trash2,
  Activity,
  BookOpen,
  PenTool,
  Moon,
  ChevronRight,
  Briefcase,
  User,
  ListTodo,
  CheckSquare,
  Square,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { WeeklyMetadata, WeeklyTaskItem, TaskPriority } from '@/types/journal';
import { WeekDayInfo } from '@/lib/journal/dateMath';

interface WeeklyRhythmViewProps {
  metadata: WeeklyMetadata;
  weekKey: string;
  weekLabel: string;
  parentGamechangerTitle?: string;
  parentGamechangerTarget?: string;
  onUpdateMetadata: (updated: WeeklyMetadata) => void;
  weekDates: WeekDayInfo[];
  weeklyWins: { dateKey: string; dayLabel: string; brightSpot: string }[];
  weeklyHabitMatrix: { [habitId: string]: { [dateKey: string]: boolean } };
  onSelectDate?: (dateKey: string) => void;
  onToggleDailyHabit?: (dateKey: string, habitId: string) => void;
}

const HABIT_CONFIGS = [
  { id: 'movement', label: 'Movement / Body', icon: Activity, color: 'text-emerald-700' },
  { id: 'reading', label: 'Reading & Synthesis', icon: BookOpen, color: 'text-blue-700' },
  { id: 'writing', label: 'Fiction / Broadsheet', icon: PenTool, color: 'text-purple-700' },
  { id: 'unplug', label: 'Unplug & Stillness', icon: Moon, color: 'text-amber-700' },
];

export default function WeeklyRhythmView({
  metadata,
  weekKey,
  weekLabel,
  parentGamechangerTitle,
  parentGamechangerTarget,
  onUpdateMetadata,
  weekDates,
  weeklyWins,
  weeklyHabitMatrix,
  onSelectDate,
  onToggleDailyHabit,
}: WeeklyRhythmViewProps) {
  const [newPersonalTask, setNewPersonalTask] = useState('');
  const [newPersonalPriority, setNewPersonalPriority] = useState<TaskPriority>('top');
  const [newWorkTask, setNewWorkTask] = useState('');
  const [newWorkPriority, setNewWorkPriority] = useState<TaskPriority>('top');
  const [newWinInput, setNewWinInput] = useState('');

  const weekFocus = metadata.weekFocus || '';
  const goodThings = metadata.goodThings || [];
  const tasks = metadata.tasks || { personal: [], work: [] };
  const infiniteSpace = metadata.infiniteSpace || '';

  // Update Top-level Week Focus
  const handleFocusChange = (val: string) => {
    onUpdateMetadata({
      ...metadata,
      weekFocus: val,
    });
  };

  // Add Task
  const addTask = (track: 'personal' | 'work') => {
    const text = track === 'personal' ? newPersonalTask.trim() : newWorkTask.trim();
    if (!text) return;
    const priority = track === 'personal' ? newPersonalPriority : newWorkPriority;

    const newItem: WeeklyTaskItem = {
      id: `wt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: text,
      priority,
      done: false,
    };

    const updatedTrack = [...(tasks[track] || []), newItem];
    onUpdateMetadata({
      ...metadata,
      tasks: {
        ...tasks,
        [track]: updatedTrack,
      },
    });

    if (track === 'personal') {
      setNewPersonalTask('');
    } else {
      setNewWorkTask('');
    }
  };

  // Toggle Task
  const toggleTask = (track: 'personal' | 'work', id: string) => {
    const updatedTrack = (tasks[track] || []).map((t) =>
      t.id === id ? { ...t, done: !t.done } : t
    );
    onUpdateMetadata({
      ...metadata,
      tasks: {
        ...tasks,
        [track]: updatedTrack,
      },
    });
  };

  // Remove Task
  const removeTask = (track: 'personal' | 'work', id: string) => {
    const updatedTrack = (tasks[track] || []).filter((t) => t.id !== id);
    onUpdateMetadata({
      ...metadata,
      tasks: {
        ...tasks,
        [track]: updatedTrack,
      },
    });
  };

  // Update Task Priority
  const updateTaskPriority = (
    track: 'personal' | 'work',
    id: string,
    priority: TaskPriority
  ) => {
    const updatedTrack = (tasks[track] || []).map((t) =>
      t.id === id ? { ...t, priority } : t
    );
    onUpdateMetadata({
      ...metadata,
      tasks: {
        ...tasks,
        [track]: updatedTrack,
      },
    });
  };

  // Add Custom Weekly Win
  const addGoodThing = () => {
    if (!newWinInput.trim()) return;
    onUpdateMetadata({
      ...metadata,
      goodThings: [...goodThings, newWinInput.trim()],
    });
    setNewWinInput('');
  };

  const removeGoodThing = (index: number) => {
    onUpdateMetadata({
      ...metadata,
      goodThings: goodThings.filter((_, i) => i !== index),
    });
  };

  // Calculate task counts
  const allPersonal = tasks.personal || [];
  const completedPersonal = allPersonal.filter((t) => t.done).length;
  const allWork = tasks.work || [];
  const completedWork = allWork.filter((t) => t.done).length;

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-5xl mx-auto font-serif text-[#242120]">
      {/* 1. Header Banner & North Star Cascade */}
      <div className="bg-[#FAF8F5] border border-[#DDD5C7] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5DFC5] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-widest text-[#B45309]">
              <Calendar className="w-4 h-4" />
              <span>Weekly Rhythm &amp; Dual-Track Matrix</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#1C1917] tracking-tight">
              {weekLabel}
            </h1>
          </div>

          {/* Connected Monthly GameChanger Beacon */}
          {parentGamechangerTitle ? (
            <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl flex items-center gap-3 max-w-md shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-[#B45309] text-white flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-display uppercase tracking-widest text-[#B45309] font-bold block">
                  Monthly GameChanger
                </span>
                <p className="text-xs font-serif font-semibold text-[#78350F] truncate">
                  {parentGamechangerTitle}
                </p>
                {parentGamechangerTarget && (
                  <span className="text-[10px] text-amber-700 italic">
                    Target: {parentGamechangerTarget}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center gap-2 text-stone-500 text-xs">
              <AlertCircle className="w-4 h-4 text-stone-400 shrink-0" />
              <span>No active Monthly GameChanger set for this period.</span>
            </div>
          )}
        </div>

        {/* This Week's Focus / One Main Goal */}
        <div className="space-y-2">
          <label className="text-[10px] font-display font-black uppercase tracking-[0.2em] text-[#1C1917] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
            <span>THIS WEEK&apos;S FOCUS · THE ONE THING</span>
          </label>
          <input
            type="text"
            value={weekFocus}
            onChange={(e) => handleFocusChange(e.target.value)}
            placeholder="What is the single most pivotal achievement or theme for these 7 days?"
            className="w-full text-base sm:text-lg font-serif font-bold text-[#1C1917] bg-[#F4EFE6] border border-[#DDD5C7] rounded-xl px-4 py-3 outline-none focus:border-[#B45309] focus:bg-[#FAF8F5] transition-all placeholder:text-[#9C9589]"
          />
        </div>
      </div>

      {/* 2. 7-Day Habit Tracker Matrix */}
      <div className="bg-[#FAF8F5] border border-[#DDD5C7] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5DFC5] pb-3">
          <div className="space-y-0.5">
            <h2 className="text-sm font-display font-black uppercase tracking-wider text-[#1C1917] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#B45309]" />
              <span>7-Day Habit Rhythm Matrix</span>
            </h2>
            <p className="text-xs text-[#78716C]">
              Real-time roll-up from your daily check-ins. Click any circle to toggle, or click a date column header to jump to that day&apos;s ledger.
            </p>
          </div>
          <span className="text-[10px] font-display uppercase tracking-widest text-[#B45309] font-bold px-2 py-1 bg-amber-50 rounded-md border border-amber-200 self-start sm:self-auto">
            Non-Punitive Rhythm
          </span>
        </div>

        <div className="overflow-x-auto pb-2">
          <table className="w-full border-collapse min-w-[540px]">
            <thead>
              <tr className="border-b border-[#E5DFC5]">
                <th className="text-left py-2 px-3 text-[10px] font-display font-black uppercase tracking-wider text-[#78716C] w-48">
                  HABIT / PRACTICE
                </th>
                {weekDates.map((day) => (
                  <th
                    key={day.dateKey}
                    onClick={() => onSelectDate && onSelectDate(day.dateKey)}
                    className={`py-2 px-2 text-center cursor-pointer transition-colors rounded-t-lg group ${
                      day.isToday ? 'bg-amber-100/70 text-[#B45309]' : 'hover:bg-[#F2ECE1] text-[#44403C]'
                    }`}
                    title="Click to jump to Daily Ledger for this day"
                  >
                    <div className="text-[10px] font-display font-black uppercase tracking-widest group-hover:text-[#B45309]">
                      {day.dayName}
                    </div>
                    <div
                      className={`text-xs font-serif font-bold ${
                        day.isToday
                          ? 'w-5 h-5 mx-auto rounded-full bg-[#B45309] text-white flex items-center justify-center text-[10px]'
                          : 'text-[#78716C]'
                      }`}
                    >
                      {day.dayNumber}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HABIT_CONFIGS.map((habit) => {
                const Icon = habit.icon;
                return (
                  <tr key={habit.id} className="border-b border-[#E5DFC5]/60 hover:bg-[#F9F6F0]/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${habit.color}`} />
                        <span className="text-xs font-serif font-semibold text-[#1C1917]">
                          {habit.label}
                        </span>
                      </div>
                    </td>
                    {weekDates.map((day) => {
                      const isDone = Boolean(weeklyHabitMatrix[habit.id]?.[day.dateKey]);
                      return (
                        <td key={day.dateKey} className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => onToggleDailyHabit && onToggleDailyHabit(day.dateKey, habit.id)}
                            className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center transition-all cursor-pointer ${
                              isDone
                                ? 'bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700'
                                : day.isToday
                                ? 'border-2 border-[#B45309] bg-transparent hover:bg-amber-50'
                                : 'border border-[#DDD5C7] bg-[#FAF8F5] hover:border-stone-400'
                            }`}
                            title={`${habit.label} on ${day.dayName} ${day.dayNumber}: ${isDone ? 'Done' : 'Not completed'}`}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                            ) : null}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Dual-Track Task Matrix (Personal vs Work) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Track A: Personal To-Do & Self Care */}
        <div className="bg-[#FAF8F5] border border-[#DDD5C7] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DFC5] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-display font-black uppercase tracking-wider text-[#1C1917]">
                    Personal Track
                  </h2>
                  <span className="text-[10px] font-serif text-[#78716C]">
                    Health, relationships, passions &amp; errands
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-display font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                {completedPersonal}/{allPersonal.length} Done
              </span>
            </div>

            {/* Task Input */}
            <div className="flex items-center gap-2">
              <select
                value={newPersonalPriority}
                onChange={(e) => setNewPersonalPriority(e.target.value as TaskPriority)}
                className="text-[10px] font-display font-bold uppercase tracking-wider bg-[#F2ECE1] border border-[#DDD5C7] rounded-lg px-2 py-2 text-[#44403C] outline-none"
              >
                <option value="top">🔥 Top</option>
                <option value="priority">⚡ Priority</option>
                <option value="errand">🧺 Errand</option>
              </select>
              <input
                type="text"
                value={newPersonalTask}
                onChange={(e) => setNewPersonalTask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask('personal')}
                placeholder="Add personal task or errand..."
                className="flex-1 text-xs font-serif bg-[#F4EFE6] border border-[#DDD5C7] rounded-lg px-3 py-2 outline-none focus:border-[#B45309] text-[#1C1917]"
              />
              <button
                type="button"
                onClick={() => addTask('personal')}
                className="px-3 py-2 bg-[#1C1917] hover:bg-[#B45309] text-white rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task Lists Grouped */}
            <div className="space-y-3 pt-1">
              {['top', 'priority', 'errand'].map((priorityGroup) => {
                const groupItems = allPersonal.filter((t) => t.priority === priorityGroup);
                if (groupItems.length === 0) return null;

                const groupTitle =
                  priorityGroup === 'top'
                    ? 'Top Priority'
                    : priorityGroup === 'priority'
                    ? 'Priority'
                    : 'Errands & Logistics';

                const groupBadgeClass =
                  priorityGroup === 'top'
                    ? 'text-rose-700 bg-rose-50 border-rose-200'
                    : priorityGroup === 'priority'
                    ? 'text-amber-700 bg-amber-50 border-amber-200'
                    : 'text-stone-600 bg-stone-100 border-stone-200';

                return (
                  <div key={priorityGroup} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-display font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${groupBadgeClass}`}>
                        {groupTitle}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {groupItems.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between gap-2 p-2 bg-[#FAF8F5] border border-[#DDD5C7]/80 rounded-lg hover:border-[#DDD5C7] transition-colors group"
                        >
                          <button
                            type="button"
                            onClick={() => toggleTask('personal', task.id)}
                            className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                          >
                            <div className="text-emerald-700 shrink-0">
                              {task.done ? (
                                <CheckSquare className="w-4 h-4 fill-emerald-100" />
                              ) : (
                                <Square className="w-4 h-4 text-stone-400" />
                              )}
                            </div>
                            <span
                              className={`text-xs font-serif leading-tight ${
                                task.done ? 'line-through text-stone-400' : 'text-[#1C1917]'
                              }`}
                            >
                              {task.title}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => removeTask('personal', task.id)}
                            className="text-stone-400 hover:text-rose-600 transition-colors p-1 opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Delete task"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {allPersonal.length === 0 && (
                <p className="text-xs text-stone-400 italic text-center py-4">
                  No personal tasks scheduled for this week.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Track B: Work Projects & Broadsheet Publishing */}
        <div className="bg-[#FAF8F5] border border-[#DDD5C7] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DFC5] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-display font-black uppercase tracking-wider text-[#1C1917]">
                    Work &amp; Publishing Track
                  </h2>
                  <span className="text-[10px] font-serif text-[#78716C]">
                    Dispatches, essays, code &amp; deadlines
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-display font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                {completedWork}/{allWork.length} Done
              </span>
            </div>

            {/* Task Input */}
            <div className="flex items-center gap-2">
              <select
                value={newWorkPriority}
                onChange={(e) => setNewWorkPriority(e.target.value as TaskPriority)}
                className="text-[10px] font-display font-bold uppercase tracking-wider bg-[#F2ECE1] border border-[#DDD5C7] rounded-lg px-2 py-2 text-[#44403C] outline-none"
              >
                <option value="top">🔥 Top</option>
                <option value="priority">⚡ Priority</option>
                <option value="errand">🧺 Errand</option>
              </select>
              <input
                type="text"
                value={newWorkTask}
                onChange={(e) => setNewWorkTask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask('work')}
                placeholder="Add work project or dispatch task..."
                className="flex-1 text-xs font-serif bg-[#F4EFE6] border border-[#DDD5C7] rounded-lg px-3 py-2 outline-none focus:border-[#1E40AF] text-[#1C1917]"
              />
              <button
                type="button"
                onClick={() => addTask('work')}
                className="px-3 py-2 bg-[#1C1917] hover:bg-[#1E40AF] text-white rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task Lists Grouped */}
            <div className="space-y-3 pt-1">
              {['top', 'priority', 'errand'].map((priorityGroup) => {
                const groupItems = allWork.filter((t) => t.priority === priorityGroup);
                if (groupItems.length === 0) return null;

                const groupTitle =
                  priorityGroup === 'top'
                    ? 'Top Priority'
                    : priorityGroup === 'priority'
                    ? 'Priority'
                    : 'Errands & Logistics';

                const groupBadgeClass =
                  priorityGroup === 'top'
                    ? 'text-rose-700 bg-rose-50 border-rose-200'
                    : priorityGroup === 'priority'
                    ? 'text-blue-700 bg-blue-50 border-blue-200'
                    : 'text-stone-600 bg-stone-100 border-stone-200';

                return (
                  <div key={priorityGroup} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-display font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${groupBadgeClass}`}>
                        {groupTitle}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {groupItems.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between gap-2 p-2 bg-[#FAF8F5] border border-[#DDD5C7]/80 rounded-lg hover:border-[#DDD5C7] transition-colors group"
                        >
                          <button
                            type="button"
                            onClick={() => toggleTask('work', task.id)}
                            className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                          >
                            <div className="text-blue-700 shrink-0">
                              {task.done ? (
                                <CheckSquare className="w-4 h-4 fill-blue-100" />
                              ) : (
                                <Square className="w-4 h-4 text-stone-400" />
                              )}
                            </div>
                            <span
                              className={`text-xs font-serif leading-tight ${
                                task.done ? 'line-through text-stone-400' : 'text-[#1C1917]'
                              }`}
                            >
                              {task.title}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => removeTask('work', task.id)}
                            className="text-stone-400 hover:text-rose-600 transition-colors p-1 opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Delete task"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {allWork.length === 0 && (
                <p className="text-xs text-stone-400 italic text-center py-4">
                  No work tasks scheduled for this week.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. "Good Things That Happened" (Weekly Wins Stream) */}
      <div className="bg-[#FAF8F5] border border-[#DDD5C7] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5DFC5] pb-3">
          <div className="space-y-0.5">
            <h2 className="text-sm font-display font-black uppercase tracking-wider text-[#1C1917] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B45309]" />
              <span>Good Things That Happened · Weekly Wins</span>
            </h2>
            <p className="text-xs text-[#78716C]">
              Automatic roll-up of your Daily Bright Spots (+) throughout this week, plus direct weekly highlights.
            </p>
          </div>
          <span className="text-[10px] font-display font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-[#B45309] border border-amber-200">
            {weeklyWins.length + goodThings.length} Highlights
          </span>
        </div>

        {/* Dynamic Roll-Up from Daily Triad Bright Spots */}
        {weeklyWins.length > 0 && (
          <div className="space-y-2">
            <span className="text-[9px] font-display uppercase tracking-widest text-[#78716C] font-bold block">
              Daily Ledger Roll-Ups:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {weeklyWins.map((win) => (
                <div
                  key={win.dateKey}
                  onClick={() => onSelectDate && onSelectDate(win.dateKey)}
                  className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5 hover:bg-amber-100/60 transition-colors cursor-pointer group shadow-2xs"
                >
                  <span className="text-sm text-emerald-600 font-bold shrink-0 mt-0.5">+</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-display font-bold uppercase tracking-wider text-[#92400E] block">
                      {win.dayLabel}
                    </span>
                    <p className="text-xs font-serif text-[#78350F] leading-snug">
                      {win.brightSpot}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-600 shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Weekly Wins List */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newWinInput}
              onChange={(e) => setNewWinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addGoodThing()}
              placeholder="Record an overarching weekly win or milestone..."
              className="flex-1 text-xs font-serif bg-[#F4EFE6] border border-[#DDD5C7] rounded-lg px-3 py-2 outline-none focus:border-[#B45309] text-[#1C1917]"
            />
            <button
              type="button"
              onClick={addGoodThing}
              className="px-3.5 py-2 bg-[#B45309] hover:bg-[#92400E] text-white rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Win</span>
            </button>
          </div>

          {goodThings.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {goodThings.map((thing, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2.5 bg-[#FAF8F5] border border-[#DDD5C7] rounded-lg"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="text-xs font-serif text-[#1C1917] truncate">{thing}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGoodThing(idx)}
                    className="text-stone-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {weeklyWins.length === 0 && goodThings.length === 0 && (
            <p className="text-xs text-stone-400 italic text-center py-2">
              No weekly wins recorded yet. They will appear here as you log Daily Bright Spots (+).
            </p>
          )}
        </div>
      </div>

      {/* 5. Infinite Space / Weekly Scratchpad */}
      <div className="bg-[#FAF8F5] border border-[#DDD5C7] rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E5DFC5] pb-2">
          <label className="text-sm font-display font-black uppercase tracking-wider text-[#1C1917] flex items-center gap-2">
            <PenTool className="w-4 h-4 text-[#B45309]" />
            <span>Infinite Space · Weekly Scratchpad</span>
          </label>
          <span className="text-[10px] font-serif text-[#78716C] italic">
            Brainstorming, meeting notes, sketches &amp; mid-week thoughts
          </span>
        </div>
        <textarea
          rows={5}
          value={infiniteSpace}
          onChange={(e) =>
            onUpdateMetadata({
              ...metadata,
              infiniteSpace: e.target.value,
            })
          }
          placeholder="Unconstrained thoughts, meeting briefs, reading quotes, ideas to explore next week..."
          className="w-full bg-[#F4EFE6] border border-[#DDD5C7] rounded-xl p-4 text-xs sm:text-sm font-serif text-[#1C1917] placeholder:text-[#9C9589] outline-none focus:border-[#B45309] focus:bg-[#FAF8F5] transition-all resize-y leading-relaxed"
        />
      </div>
    </div>
  );
}
