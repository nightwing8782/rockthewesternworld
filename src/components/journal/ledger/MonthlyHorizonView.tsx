'use client';

import React from 'react';
import {
  Target,
  CheckCircle2,
  Calendar,
  Sparkles,
  Star,
  Users,
  MapPin,
  GraduationCap,
  Plus,
  Trash2,
  Activity,
  BookOpen,
  PenTool,
  Moon,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { MonthlyMetadata, SubtaskItem, ProjectItem } from '@/types/journal';
import { getDaysInMonth, MonthDayInfo } from '@/lib/journal/dateMath';

interface MonthlyHorizonViewProps {
  metadata: MonthlyMetadata;
  year: number;
  month: number;
  monthLabel: string;
  onUpdateMetadata: (updated: MonthlyMetadata) => void;
  habitHeatmap: { [habitId: string]: { [dayNum: number]: boolean } };
  monthlyWins: { dateKey: string; dayNum: number; dateFormatted: string; brightSpot: string }[];
  onSelectDate?: (dateKey: string) => void;
}

export default function MonthlyHorizonView({
  metadata,
  year,
  month,
  monthLabel,
  onUpdateMetadata,
  habitHeatmap,
  monthlyWins,
  onSelectDate,
}: MonthlyHorizonViewProps) {
  const daysInMonth: MonthDayInfo[] = getDaysInMonth(year, month);

  const gamechanger = metadata.gamechanger || {
    title: '',
    targetDate: '',
    whyWin: '',
    challenges: '',
    subtasks: [],
  };

  const quads = metadata.quads || {
    peopleToSee: [],
    placesToGo: [],
    thingsToLearn: [],
  };

  const projects = metadata.projects || {
    personal: [],
    work: [],
  };

  const reflection = metadata.reflection || {
    rating: 8,
    accomplishments: '',
    lessons: '',
    memorableMoments: '',
    focusesNextMonth: '',
    domains: {
      mental: 4,
      physical: 4,
      finances: 4,
      passions: 5,
      relationships: 4,
      selfCare: 4,
    },
  };

  // Compute subtask completion percentage
  const totalSubtasks = gamechanger.subtasks?.length || 0;
  const completedSubtasks = gamechanger.subtasks?.filter((s) => s.done).length || 0;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Subtask Handlers
  const addSubtask = () => {
    const newSubtask: SubtaskItem = {
      id: `st-${Date.now()}`,
      title: '',
      done: false,
      targetDate: '',
    };
    onUpdateMetadata({
      ...metadata,
      gamechanger: {
        ...gamechanger,
        subtasks: [...(gamechanger.subtasks || []), newSubtask],
      },
    });
  };

  const updateSubtask = (id: string, updates: Partial<SubtaskItem>) => {
    const updated = (gamechanger.subtasks || []).map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );
    onUpdateMetadata({
      ...metadata,
      gamechanger: {
        ...gamechanger,
        subtasks: updated,
      },
    });
  };

  const deleteSubtask = (id: string) => {
    const updated = (gamechanger.subtasks || []).filter((s) => s.id !== id);
    onUpdateMetadata({
      ...metadata,
      gamechanger: {
        ...gamechanger,
        subtasks: updated,
      },
    });
  };

  // Quad list helpers
  const updateQuadList = (quadKey: keyof typeof quads, idx: number, val: string) => {
    const updated = [...(quads[quadKey] || [])];
    updated[idx] = val;
    onUpdateMetadata({
      ...metadata,
      quads: {
        ...quads,
        [quadKey]: updated,
      },
    });
  };

  const addQuadItem = (quadKey: keyof typeof quads) => {
    onUpdateMetadata({
      ...metadata,
      quads: {
        ...quads,
        [quadKey]: [...(quads[quadKey] || []), ''],
      },
    });
  };

  const removeQuadItem = (quadKey: keyof typeof quads, idx: number) => {
    onUpdateMetadata({
      ...metadata,
      quads: {
        ...quads,
        [quadKey]: (quads[quadKey] || []).filter((_, i) => i !== idx),
      },
    });
  };

  // Projects helpers
  const addProject = (type: 'personal' | 'work') => {
    const newProj: ProjectItem = {
      id: `prj-${Date.now()}`,
      title: '',
      dueDate: '',
      done: false,
    };
    onUpdateMetadata({
      ...metadata,
      projects: {
        ...projects,
        [type]: [...(projects[type] || []), newProj],
      },
    });
  };

  const updateProject = (type: 'personal' | 'work', id: string, updates: Partial<ProjectItem>) => {
    const updated = (projects[type] || []).map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );
    onUpdateMetadata({
      ...metadata,
      projects: {
        ...projects,
        [type]: updated,
      },
    });
  };

  const deleteProject = (type: 'personal' | 'work', id: string) => {
    const updated = (projects[type] || []).filter((p) => p.id !== id);
    onUpdateMetadata({
      ...metadata,
      projects: {
        ...projects,
        [type]: updated,
      },
    });
  };

  const habitsList = [
    { id: 'movement', label: 'Movement', icon: Activity, color: 'text-amber-700' },
    { id: 'reading', label: 'Reading', icon: BookOpen, color: 'text-blue-700' },
    { id: 'writing', label: 'Writing', icon: PenTool, color: 'text-emerald-700' },
    { id: 'unplug', label: 'Unplug', icon: Moon, color: 'text-purple-700' },
  ];

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-5xl mx-auto font-serif text-[#242120]">
      {/* 1. Month Header & Focus */}
      <div className="bg-[#FAF8F5] border border-[#DDD5C7] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E5DFC5] pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-widest text-[#B45309]">
              <Target className="w-4 h-4" />
              <span>Monthly Strategic Planning</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#1C1917] tracking-tight">
              {monthLabel} Horizon
            </h1>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto bg-[#F2ECE1] px-3.5 py-2 rounded-xl border border-[#DDD5C7]">
            <span className="text-xs font-display uppercase tracking-wider text-[#66615C] font-bold">
              Project Progress:
            </span>
            <span className="font-mono font-bold text-sm text-[#1C1917]">{progressPercent}%</span>
            <div className="w-20 sm:w-28 bg-white h-2 rounded-full overflow-hidden border border-[#DDD5C7]">
              <div
                className="bg-[#2ED573] h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-display uppercase tracking-widest text-[#66615C] font-bold mb-1">
            This Month’s Overarching Theme &amp; Focus:
          </label>
          <input
            type="text"
            value={metadata.monthFocus || ''}
            onChange={(e) => onUpdateMetadata({ ...metadata, monthFocus: e.target.value })}
            placeholder="e.g. Relentless execution on core essay collection &amp; restoring morning movement routine..."
            className="w-full text-sm sm:text-base font-serif font-bold text-[#1C1917] bg-[#F2ECE1] border border-[#DDD5C7] rounded-xl px-3.5 py-2 outline-none focus:border-[#1E40AF]"
          />
        </div>
      </div>

      {/* 2. Monthly GameChanger Project Breakdown */}
      <div className="bg-[#FAF8F5] border-2 border-[#1C1917] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5DFC5] pb-3">
          <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-widest text-[#1C1917]">
            <Sparkles className="w-4 h-4 text-[#B45309]" />
            <span>Monthly GameChanger Goal (The Core Win)</span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-[#2ED573] text-[#111827] px-2 py-0.5 rounded font-bold">
            Highest-Leverage Milestone
          </span>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-display uppercase tracking-widest text-[#66615C] font-bold mb-1">
                GameChanger Project Title:
              </label>
              <input
                type="text"
                value={gamechanger.title}
                onChange={(e) =>
                  onUpdateMetadata({
                    ...metadata,
                    gamechanger: { ...gamechanger, title: e.target.value },
                  })
                }
                placeholder="e.g. Complete 6-Issue Comic Review Arc &amp; Publish Broadsheet Dispatch"
                className="w-full text-sm sm:text-base font-serif font-bold bg-[#F2ECE1] border border-[#DDD5C7] rounded-xl px-3.5 py-2 text-[#1C1917] outline-none focus:border-[#1E40AF]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-display uppercase tracking-widest text-[#66615C] font-bold mb-1">
                Target Completion Date:
              </label>
              <input
                type="text"
                value={gamechanger.targetDate}
                onChange={(e) =>
                  onUpdateMetadata({
                    ...metadata,
                    gamechanger: { ...gamechanger, targetDate: e.target.value },
                  })
                }
                placeholder="e.g. Oct 28, 2026"
                className="w-full text-xs font-serif bg-[#F2ECE1] border border-[#DDD5C7] rounded-xl px-3 py-2 text-[#1C1917] outline-none focus:border-[#1E40AF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[10px] font-display uppercase tracking-widest text-[#66615C] font-bold mb-1">
                What would make this month feel like a win?
              </label>
              <textarea
                rows={2}
                value={gamechanger.whyWin}
                onChange={(e) =>
                  onUpdateMetadata({
                    ...metadata,
                    gamechanger: { ...gamechanger, whyWin: e.target.value },
                  })
                }
                placeholder="Describe what reaching this milestone unlocks..."
                className="w-full text-xs font-serif bg-[#F2ECE1] border border-[#DDD5C7] rounded-xl p-2.5 text-[#1C1917] outline-none focus:border-[#1E40AF]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-display uppercase tracking-widest text-[#66615C] font-bold mb-1">
                Potential roadblocks &amp; navigation strategies:
              </label>
              <textarea
                rows={2}
                value={gamechanger.challenges}
                onChange={(e) =>
                  onUpdateMetadata({
                    ...metadata,
                    gamechanger: { ...gamechanger, challenges: e.target.value },
                  })
                }
                placeholder="Anticipate friction and set preventive rules..."
                className="w-full text-xs font-serif bg-[#F2ECE1] border border-[#DDD5C7] rounded-xl p-2.5 text-[#1C1917] outline-none focus:border-[#1E40AF]"
              />
            </div>
          </div>

          {/* Actionable Subtasks Breakdown */}
          <div className="pt-2 space-y-2 border-t border-[#E5DFC5]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-display uppercase tracking-wider text-[#1C1917] font-bold">
                Actionable Milestones &amp; Subtasks ({completedSubtasks}/{totalSubtasks})
              </span>
              <button
                type="button"
                onClick={addSubtask}
                className="inline-flex items-center gap-1 text-xs font-display uppercase tracking-wider font-bold text-[#1E40AF] hover:text-[#1D4ED8] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Step</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {gamechanger.subtasks?.length === 0 ? (
                <p className="text-xs font-serif italic text-[#78716C] py-2">
                  No subtasks defined. Break this project down into 3-5 concrete steps.
                </p>
              ) : (
                gamechanger.subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-[#F2ECE1] border border-[#DDD5C7] group"
                  >
                    <input
                      type="checkbox"
                      checked={st.done}
                      onChange={(e) => updateSubtask(st.id, { done: e.target.checked })}
                      className="w-4 h-4 rounded border-[#111827] text-[#1E40AF] focus:ring-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={st.title}
                      onChange={(e) => updateSubtask(st.id, { title: e.target.value })}
                      placeholder="Actionable milestone step..."
                      className={`flex-1 text-xs font-serif bg-transparent border-none outline-none text-[#1C1917] ${
                        st.done ? 'line-through text-stone-400' : ''
                      }`}
                    />
                    <input
                      type="text"
                      value={st.targetDate || ''}
                      onChange={(e) => updateSubtask(st.id, { targetDate: e.target.value })}
                      placeholder="Due Date"
                      className="w-24 text-[11px] font-mono text-stone-600 bg-white/70 border border-[#DDD5C7] rounded px-1.5 py-0.5 text-center outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => deleteSubtask(st.id)}
                      className="p-1 text-[#9C9589] hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. 31-Day Habit Heatmap (Automated Roll-Up from Daily Check-Ins) */}
      <div className="bg-[#FAF8F5] border border-[#DDD5C7] rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E5DFC5] pb-2">
          <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-widest text-[#1C1917]">
            <TrendingUp className="w-4 h-4 text-[#2ED573]" />
            <span>Monthly Habit Practice Heatmap (Automated Roll-Up)</span>
          </div>
          <span className="text-[11px] font-serif text-[#78716C] italic">
            Populates automatically as you complete daily ledgers
          </span>
        </div>

        <div className="overflow-x-auto [scrollbar-width:none] pt-1">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-[#E5DFC5] text-[#78716C]">
                <th className="py-1 text-left font-display uppercase tracking-wider text-[10px] w-28">
                  Practice
                </th>
                {daysInMonth.map((d) => (
                  <th
                    key={d.dayNum}
                    onClick={() => onSelectDate && onSelectDate(d.dateKey)}
                    className={`p-1 text-center font-normal min-w-[20px] cursor-pointer hover:bg-[#EAE4D7] rounded ${
                      d.isToday ? 'font-bold text-[#B45309] bg-amber-100' : ''
                    }`}
                    title={`${d.weekday}, ${monthLabel} ${d.dayNum}`}
                  >
                    <span className="block text-[9px] text-[#9C9589]">{d.weekdayShort}</span>
                    <span>{d.dayNum}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFC5]">
              {habitsList.map((h) => {
                const Icon = h.icon;
                const habitData = habitHeatmap[h.id] || {};
                const totalCompleted = Object.values(habitData).filter(Boolean).length;
                return (
                  <tr key={h.id} className="hover:bg-[#F2ECE1]/50 transition-colors">
                    <td className="py-2 pr-2 font-serif font-bold text-[#1C1917] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${h.color}`} />
                        <span>{h.label}</span>
                      </span>
                      <span className="text-[10px] font-mono text-[#78716C]">
                        {totalCompleted}d
                      </span>
                    </td>
                    {daysInMonth.map((d) => {
                      const isDone = Boolean(habitData[d.dayNum]);
                      return (
                        <td
                          key={d.dayNum}
                          className="p-1 text-center"
                          title={`${h.label}: Day ${d.dayNum} ${isDone ? '✓ Completed' : '—'}`}
                        >
                          <div
                            className={`w-4 h-4 mx-auto rounded flex items-center justify-center text-[10px] font-bold ${
                              isDone
                                ? 'bg-[#2ED573] text-[#111827] shadow-2xs'
                                : d.isPast
                                ? 'bg-stone-200/50 text-stone-300'
                                : 'bg-[#EAE4D7]/40 text-transparent'
                            }`}
                          >
                            {isDone ? '✓' : ''}
                          </div>
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

      {/* 4. Life Logistics Quads & Dual-Track Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Life Connections Quad */}
        <div className="bg-[#FAF8F5] border border-[#DDD5C7] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E5DFC5] pb-2 text-xs font-display font-bold uppercase tracking-wider text-[#1C1917]">
            <Users className="w-4 h-4 text-[#1E40AF]" />
            <span>People, Places &amp; Learning</span>
          </div>

          <div className="space-y-3">
            {/* People to See */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-display uppercase tracking-wider text-[#66615C] font-bold">
                  People to See / Connect With
                </span>
                <button
                  type="button"
                  onClick={() => addQuadItem('peopleToSee')}
                  className="text-[10px] font-display uppercase font-bold text-[#1E40AF] hover:underline cursor-pointer"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-1">
                {quads.peopleToSee.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateQuadList('peopleToSee', idx, e.target.value)}
                      placeholder="Person's name..."
                      className="flex-1 text-xs font-serif bg-[#F2ECE1] border border-[#DDD5C7] rounded-lg px-2.5 py-1 text-[#1C1917] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeQuadItem('peopleToSee', idx)}
                      className="text-stone-400 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Places to Go */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-display uppercase tracking-wider text-[#66615C] font-bold">
                  Places to Go / Visit
                </span>
                <button
                  type="button"
                  onClick={() => addQuadItem('placesToGo')}
                  className="text-[10px] font-display uppercase font-bold text-[#1E40AF] hover:underline cursor-pointer"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-1">
                {quads.placesToGo.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateQuadList('placesToGo', idx, e.target.value)}
                      placeholder="Location, museum, park..."
                      className="flex-1 text-xs font-serif bg-[#F2ECE1] border border-[#DDD5C7] rounded-lg px-2.5 py-1 text-[#1C1917] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeQuadItem('placesToGo', idx)}
                      className="text-stone-400 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Things to Learn */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-display uppercase tracking-wider text-[#66615C] font-bold">
                  Things to Learn &amp; Explore
                </span>
                <button
                  type="button"
                  onClick={() => addQuadItem('thingsToLearn')}
                  className="text-[10px] font-display uppercase font-bold text-[#1E40AF] hover:underline cursor-pointer"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-1">
                {quads.thingsToLearn.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateQuadList('thingsToLearn', idx, e.target.value)}
                      placeholder="Skill, topic, book subject..."
                      className="flex-1 text-xs font-serif bg-[#F2ECE1] border border-[#DDD5C7] rounded-lg px-2.5 py-1 text-[#1C1917] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeQuadItem('thingsToLearn', idx)}
                      className="text-stone-400 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dual-Track Projects (Personal vs Work) */}
        <div className="bg-[#FAF8F5] border border-[#DDD5C7] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E5DFC5] pb-2 text-xs font-display font-bold uppercase tracking-wider text-[#1C1917]">
            <Calendar className="w-4 h-4 text-[#B45309]" />
            <span>Monthly Projects (Personal &amp; Work)</span>
          </div>

          <div className="space-y-3">
            {/* Personal Projects */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-display uppercase tracking-wider text-[#1C1917] font-bold">
                  Personal Projects
                </span>
                <button
                  type="button"
                  onClick={() => addProject('personal')}
                  className="text-[10px] font-display uppercase font-bold text-[#1E40AF] hover:underline cursor-pointer"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-1.5">
                {projects.personal.map((prj) => (
                  <div key={prj.id} className="flex items-center gap-1.5 bg-[#F2ECE1] p-1.5 rounded-lg border border-[#DDD5C7]">
                    <input
                      type="checkbox"
                      checked={prj.done}
                      onChange={(e) => updateProject('personal', prj.id, { done: e.target.checked })}
                      className="w-3.5 h-3.5 rounded border-[#111827] text-[#1E40AF]"
                    />
                    <input
                      type="text"
                      value={prj.title}
                      onChange={(e) => updateProject('personal', prj.id, { title: e.target.value })}
                      placeholder="Project name..."
                      className={`flex-1 text-xs font-serif bg-transparent outline-none ${
                        prj.done ? 'line-through text-stone-400' : 'text-[#1C1917]'
                      }`}
                    />
                    <input
                      type="text"
                      value={prj.dueDate}
                      onChange={(e) => updateProject('personal', prj.id, { dueDate: e.target.value })}
                      placeholder="Due"
                      className="w-16 text-[10px] font-mono text-center bg-white border border-[#DDD5C7] rounded px-1"
                    />
                    <button
                      type="button"
                      onClick={() => deleteProject('personal', prj.id)}
                      className="text-stone-400 hover:text-red-700 p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Work & Writing Projects */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-display uppercase tracking-wider text-[#1C1917] font-bold">
                  Work &amp; Writing Projects
                </span>
                <button
                  type="button"
                  onClick={() => addProject('work')}
                  className="text-[10px] font-display uppercase font-bold text-[#1E40AF] hover:underline cursor-pointer"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-1.5">
                {projects.work.map((prj) => (
                  <div key={prj.id} className="flex items-center gap-1.5 bg-[#F2ECE1] p-1.5 rounded-lg border border-[#DDD5C7]">
                    <input
                      type="checkbox"
                      checked={prj.done}
                      onChange={(e) => updateProject('work', prj.id, { done: e.target.checked })}
                      className="w-3.5 h-3.5 rounded border-[#111827] text-[#1E40AF]"
                    />
                    <input
                      type="text"
                      value={prj.title}
                      onChange={(e) => updateProject('work', prj.id, { title: e.target.value })}
                      placeholder="Article, review, or client milestone..."
                      className={`flex-1 text-xs font-serif bg-transparent outline-none ${
                        prj.done ? 'line-through text-stone-400' : 'text-[#1C1917]'
                      }`}
                    />
                    <input
                      type="text"
                      value={prj.dueDate}
                      onChange={(e) => updateProject('work', prj.id, { dueDate: e.target.value })}
                      placeholder="Due"
                      className="w-16 text-[10px] font-mono text-center bg-white border border-[#DDD5C7] rounded px-1"
                    />
                    <button
                      type="button"
                      onClick={() => deleteProject('work', prj.id)}
                      className="text-stone-400 hover:text-red-700 p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. End-of-Month Review & Life Domain Radar */}
      <div className="bg-[#FAF8F5] border border-[#DDD5C7] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5DFC5] pb-3">
          <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-widest text-[#1C1917]">
            <Sparkles className="w-4 h-4 text-[#D97706]" />
            <span>End-of-Month Reflection &amp; Life Domain Review</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-display uppercase tracking-wider text-[#66615C]">
              Month Rating (1–10):
            </span>
            <input
              type="number"
              min="1"
              max="10"
              value={reflection.rating || 8}
              onChange={(e) =>
                onUpdateMetadata({
                  ...metadata,
                  reflection: { ...reflection, rating: parseInt(e.target.value, 10) || 1 },
                })
              }
              className="w-12 text-center text-xs font-mono font-bold bg-[#F2ECE1] border border-[#DDD5C7] rounded px-1 py-0.5"
            />
          </div>
        </div>

        {/* Life Domain 5-Star Ratings */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {(
            [
              { key: 'mental', label: 'Mental Health' },
              { key: 'physical', label: 'Physical Vitality' },
              { key: 'finances', label: 'Finances' },
              { key: 'passions', label: 'Passions / Writing' },
              { key: 'relationships', label: 'Relationships' },
              { key: 'selfCare', label: 'Self-Care' },
            ] as const
          ).map((domain) => {
            const current = reflection.domains?.[domain.key] || 4;
            return (
              <div key={domain.key} className="bg-[#F2ECE1] p-2.5 rounded-xl border border-[#DDD5C7] text-center space-y-1">
                <span className="text-[10px] font-display uppercase tracking-wider text-[#66615C] block font-bold truncate">
                  {domain.label}
                </span>
                <div className="flex items-center justify-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        onUpdateMetadata({
                          ...metadata,
                          reflection: {
                            ...reflection,
                            domains: {
                              ...reflection.domains,
                              [domain.key]: star,
                            },
                          },
                        })
                      }
                      className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-3 h-3 ${
                          current >= star ? 'fill-amber-500 text-amber-500' : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Written Reflections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-[10px] font-display uppercase tracking-widest text-[#66615C] font-bold mb-1">
              Accomplishments I'm Proud Of:
            </label>
            <textarea
              rows={3}
              value={reflection.accomplishments}
              onChange={(e) =>
                onUpdateMetadata({
                  ...metadata,
                  reflection: { ...reflection, accomplishments: e.target.value },
                })
              }
              placeholder="Key milestones completed, challenges overcome, and progress celebrated..."
              className="w-full text-xs font-serif bg-[#F2ECE1] border border-[#DDD5C7] rounded-xl p-2.5 text-[#1C1917] outline-none focus:border-[#1E40AF]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-display uppercase tracking-widest text-[#66615C] font-bold mb-1">
              How I've Grown &amp; Biggest Lessons:
            </label>
            <textarea
              rows={3}
              value={reflection.lessons}
              onChange={(e) =>
                onUpdateMetadata({
                  ...metadata,
                  reflection: { ...reflection, lessons: e.target.value },
                })
              }
              placeholder="What did this month teach you? What will you calibrate next month?"
              className="w-full text-xs font-serif bg-[#F2ECE1] border border-[#DDD5C7] rounded-xl p-2.5 text-[#1C1917] outline-none focus:border-[#1E40AF]"
            />
          </div>
        </div>

        {/* Monthly Wins Stream (Roll-Up from Daily Triad Bright Spots) */}
        {monthlyWins.length > 0 && (
          <div className="pt-2 border-t border-[#E5DFC5] space-y-2">
            <span className="text-xs font-display uppercase tracking-wider text-[#B45309] font-bold block">
              Captured Daily Wins This Month ({monthlyWins.length} Bright Spots)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 [scrollbar-width:thin]">
              {monthlyWins.map((win) => (
                <div
                  key={win.dateKey}
                  onClick={() => onSelectDate && onSelectDate(win.dateKey)}
                  className="p-2 bg-[#F2ECE1] border border-[#DDD5C7] rounded-lg text-xs hover:border-[#1E40AF] cursor-pointer transition-colors"
                >
                  <span className="text-[10px] font-mono text-[#B45309] font-bold block">
                    {win.dateFormatted}
                  </span>
                  <span className="font-serif italic text-stone-800 line-clamp-2">
                    "{win.brightSpot}"
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
