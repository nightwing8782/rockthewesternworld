'use client';

import React from 'react';
import { Compass, Sparkles, Target, Star, Plus, Trash2, Shield, Heart } from 'lucide-react';
import { CompassMetadata, CoreValueEntry } from '@/types/journal';

interface CompassRoadmapViewProps {
  metadata: CompassMetadata;
  year: number;
  onUpdateMetadata: (updated: CompassMetadata) => void;
}

export default function CompassRoadmapView({
  metadata,
  year,
  onUpdateMetadata,
}: CompassRoadmapViewProps) {
  const coreValues = metadata.coreValues || [
    { value: '', whyImportant: '', howEmbodiedNow: '', actionableSteps: '' },
    { value: '', whyImportant: '', howEmbodiedNow: '', actionableSteps: '' },
    { value: '', whyImportant: '', howEmbodiedNow: '', actionableSteps: '' },
  ];

  const roadmap = metadata.roadmap || {
    lifetime: [],
    threeYears: [],
    oneYear: [],
    threeMonths: [],
  };

  const annualGamechanger = metadata.annualGamechanger || {
    goal: '',
    vision: '',
    whyMatters: '',
  };

  const updateCoreValue = (idx: number, field: keyof CoreValueEntry, val: string) => {
    const updatedValues = [...coreValues];
    updatedValues[idx] = { ...updatedValues[idx], [field]: val };
    onUpdateMetadata({
      ...metadata,
      coreValues: updatedValues,
    });
  };

  const updateRoadmapItem = (
    horizon: 'lifetime' | 'threeYears' | 'oneYear' | 'threeMonths',
    index: number,
    value: string
  ) => {
    const updatedList = [...(roadmap[horizon] || [])];
    updatedList[index] = value;
    onUpdateMetadata({
      ...metadata,
      roadmap: {
        ...roadmap,
        [horizon]: updatedList,
      },
    });
  };

  const addRoadmapItem = (horizon: 'lifetime' | 'threeYears' | 'oneYear' | 'threeMonths') => {
    const updatedList = [...(roadmap[horizon] || []), ''];
    onUpdateMetadata({
      ...metadata,
      roadmap: {
        ...roadmap,
        [horizon]: updatedList,
      },
    });
  };

  const removeRoadmapItem = (
    horizon: 'lifetime' | 'threeYears' | 'oneYear' | 'threeMonths',
    index: number
  ) => {
    const updatedList = (roadmap[horizon] || []).filter((_, i) => i !== index);
    onUpdateMetadata({
      ...metadata,
      roadmap: {
        ...roadmap,
        [horizon]: updatedList,
      },
    });
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-5xl mx-auto font-serif text-[#242120]">
      {/* Header Banner */}
      <div className="bg-[#FAF8F5] border border-[#DDD5C7] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-widest text-[#B45309]">
            <Compass className="w-4 h-4" />
            <span>North Star &amp; Long-Horizon Vision</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#1C1917] tracking-tight">
            {year} Compass &amp; Passion Roadmap
          </h1>
          <p className="text-xs sm:text-sm text-[#78716C] font-serif max-w-2xl">
            The foundation from which your months, weeks, and daily actions flow. Define your 3 core compass values and long-term horizons.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F2ECE1] border border-[#DDD5C7] rounded-xl text-xs font-mono text-[#1C1917] self-start md:self-auto">
          <Shield className="w-3.5 h-3.5 text-[#1E40AF]" />
          <span>Confidential Life Roadmap</span>
        </div>
      </div>

      {/* 1. Annual GameChanger Goal Card */}
      <div className="bg-[#FAF8F5] border-2 border-[#1C1917] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5DFC5] pb-3">
          <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-widest text-[#1C1917]">
            <Target className="w-4 h-4 text-[#B45309]" />
            <span>{year} Annual GameChanger Goal</span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-[#FFDE59] text-[#111827] px-2 py-0.5 rounded font-bold">
            Highest Leverage Priority
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-display uppercase tracking-widest text-[#66615C] font-bold mb-1">
              What is the one goal that will have the most transformative impact this year?
            </label>
            <input
              type="text"
              value={annualGamechanger.goal}
              onChange={(e) =>
                onUpdateMetadata({
                  ...metadata,
                  annualGamechanger: { ...annualGamechanger, goal: e.target.value },
                })
              }
              placeholder="e.g. Publish the first volume of my book &amp; establish daily physical vitality..."
              className="w-full text-base sm:text-lg font-serif font-bold text-[#1C1917] bg-[#F2ECE1] border border-[#DDD5C7] rounded-xl px-4 py-2.5 outline-none focus:border-[#1E40AF]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[10px] font-display uppercase tracking-widest text-[#66615C] font-bold mb-1">
                Vivid Vision (What does achieving this look &amp; feel like?)
              </label>
              <textarea
                rows={3}
                value={annualGamechanger.vision}
                onChange={(e) =>
                  onUpdateMetadata({
                    ...metadata,
                    annualGamechanger: { ...annualGamechanger, vision: e.target.value },
                  })
                }
                placeholder="Visualize the outcome: What do you see, feel, and experience when this win is realized?"
                className="w-full text-xs font-serif text-[#1C1917] bg-[#F2ECE1] border border-[#DDD5C7] rounded-xl p-3 outline-none focus:border-[#1E40AF]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-display uppercase tracking-widest text-[#66615C] font-bold mb-1">
                Why this matters deeply (The Internal Purpose)
              </label>
              <textarea
                rows={3}
                value={annualGamechanger.whyMatters}
                onChange={(e) =>
                  onUpdateMetadata({
                    ...metadata,
                    annualGamechanger: { ...annualGamechanger, whyMatters: e.target.value },
                  })
                }
                placeholder="Why does this goal matter to who you are becoming? What changes when you reach it?"
                className="w-full text-xs font-serif text-[#1C1917] bg-[#F2ECE1] border border-[#DDD5C7] rounded-xl p-3 outline-none focus:border-[#1E40AF]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Core Values Compass (3 Pillars) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-700" />
            <h2 className="text-lg font-serif font-bold text-[#1C1917]">
              Uncover Your Compass: 3 Core Values
            </h2>
          </div>
          <span className="text-xs text-[#78716C] font-serif italic">
            Guiding beliefs that anchor all decision-making
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((idx) => {
            const pillar = coreValues[idx] || {
              value: '',
              whyImportant: '',
              howEmbodiedNow: '',
              actionableSteps: '',
            };
            return (
              <div
                key={idx}
                className="bg-[#FAF8F5] border border-[#DDD5C7] rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#E5DFC5] pb-2">
                    <span className="text-[10px] font-display uppercase tracking-widest font-bold text-[#B45309]">
                      Core Value {idx + 1}
                    </span>
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-display uppercase tracking-wider text-[#66615C] mb-1 font-semibold">
                      Value Name
                    </label>
                    <input
                      type="text"
                      value={pillar.value}
                      onChange={(e) => updateCoreValue(idx, 'value', e.target.value)}
                      placeholder={
                        idx === 0
                          ? 'e.g. Courageous Authenticity'
                          : idx === 1
                          ? 'e.g. Strategic Progress'
                          : 'e.g. Deep Focus & Presence'
                      }
                      className="w-full text-sm font-serif font-bold bg-[#F2ECE1] border border-[#DDD5C7] rounded-lg px-3 py-1.5 text-[#1C1917] outline-none focus:border-[#1E40AF]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-display uppercase tracking-wider text-[#66615C] mb-1 font-semibold">
                      Why is this value essential to you?
                    </label>
                    <textarea
                      rows={2}
                      value={pillar.whyImportant}
                      onChange={(e) => updateCoreValue(idx, 'whyImportant', e.target.value)}
                      placeholder="Why does this anchor your choices?"
                      className="w-full text-xs font-serif bg-[#F2ECE1] border border-[#DDD5C7] rounded-lg p-2 text-[#1C1917] outline-none focus:border-[#1E40AF]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-display uppercase tracking-wider text-[#66615C] mb-1 font-semibold">
                      How do you embody this now?
                    </label>
                    <textarea
                      rows={2}
                      value={pillar.howEmbodiedNow}
                      onChange={(e) => updateCoreValue(idx, 'howEmbodiedNow', e.target.value)}
                      placeholder="Current examples in daily life..."
                      className="w-full text-xs font-serif bg-[#F2ECE1] border border-[#DDD5C7] rounded-lg p-2 text-[#1C1917] outline-none focus:border-[#1E40AF]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-display uppercase tracking-wider text-[#66615C] mb-1 font-semibold">
                      3 Actionable ways to embody this more:
                    </label>
                    <textarea
                      rows={2}
                      value={pillar.actionableSteps}
                      onChange={(e) => updateCoreValue(idx, 'actionableSteps', e.target.value)}
                      placeholder="1. Daily writing block&#10;2. Direct candor&#10;3. Morning movement"
                      className="w-full text-xs font-serif bg-[#F2ECE1] border border-[#DDD5C7] rounded-lg p-2 text-[#1C1917] outline-none focus:border-[#1E40AF]"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. The Passion Roadmap (4-Horizon Wishlist) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D97706]" />
            <h2 className="text-lg font-serif font-bold text-[#1C1917]">
              The Passion Roadmap: 4 Horizon Wishlists
            </h2>
          </div>
          <span className="text-xs text-[#78716C] font-serif italic">
            "If I could experience, create, or have anything, what would it be?"
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(
            [
              { key: 'threeMonths', label: '3-Month Horizon', badge: 'Immediate Focus', border: 'border-[#1E40AF]/40' },
              { key: 'oneYear', label: '1-Year Horizon', badge: 'Annual Milestones', border: 'border-[#B45309]/40' },
              { key: 'threeYears', label: '3-Year Horizon', badge: 'Strategic Growth', border: 'border-stone-400' },
              { key: 'lifetime', label: 'Lifetime Horizon', badge: 'Legacy & Dreams', border: 'border-stone-400' },
            ] as const
          ).map((quad) => {
            const items = roadmap[quad.key] || [];
            return (
              <div
                key={quad.key}
                className={`bg-[#FAF8F5] border-2 ${quad.border} rounded-2xl p-5 shadow-xs space-y-3`}
              >
                <div className="flex items-center justify-between border-b border-[#E5DFC5] pb-2">
                  <span className="text-xs font-display font-bold uppercase tracking-wider text-[#1C1917]">
                    {quad.label}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#66615C] bg-[#EAE4D7] px-2 py-0.5 rounded">
                    {quad.badge}
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <p className="text-xs font-serif italic text-[#78716C] py-2">
                      No milestones added yet. Click below to add.
                    </p>
                  ) : (
                    items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#B45309] font-bold">
                          {idx + 1}.
                        </span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateRoadmapItem(quad.key, idx, e.target.value)}
                          placeholder="Goal or aspiration..."
                          className="flex-1 text-xs font-serif bg-[#F2ECE1] border border-[#DDD5C7] rounded-lg px-2.5 py-1.5 text-[#1C1917] outline-none focus:border-[#1E40AF]"
                        />
                        <button
                          type="button"
                          onClick={() => removeRoadmapItem(quad.key, idx)}
                          className="p-1 text-[#9C9589] hover:text-red-700 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}

                  <button
                    type="button"
                    onClick={() => addRoadmapItem(quad.key)}
                    className="inline-flex items-center gap-1.5 text-xs font-display uppercase tracking-wider font-bold text-[#1E40AF] hover:text-[#1D4ED8] pt-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Milestone</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
