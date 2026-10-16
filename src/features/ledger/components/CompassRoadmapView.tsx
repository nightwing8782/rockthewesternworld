'use client';

import React, { useState } from 'react';
import { Compass, Sparkles, Target, Star, Plus, Trash2, Shield, Heart, Lock, Unlock, CheckCircle2 } from 'lucide-react';
import { CompassMetadata, CoreValueEntry } from '@/types/journal';

interface CompassRoadmapViewProps {
  metadata: CompassMetadata;
  year: number;
  onUpdateMetadata: (updated: CompassMetadata) => void;
}

/**
 * Authentic SVG Wax Seal & Ribbon Graphic
 */
function WaxSealEmblem({ year, sealedAt }: { year: number; sealedAt?: string }) {
  const formattedDate = sealedAt
    ? new Date(sealedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : `Anno ${year}`;

  return (
    <div className="relative flex flex-col items-center group select-none shrink-0">
      {/* SVG Wax Seal */}
      <div className="relative w-28 h-32 sm:w-32 sm:h-36 drop-shadow-[0_10px_20px_rgba(153,27,27,0.35)] transition-transform duration-300 group-hover:scale-105">
        <svg viewBox="0 0 200 240" className="w-full h-full overflow-visible">
          <defs>
            {/* Wax Gradient */}
            <radialGradient id="waxGradient" cx="38%" cy="38%" r="62%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="40%" stopColor="#B91C1C" />
              <stop offset="80%" stopColor="#881337" />
              <stop offset="100%" stopColor="#4C0519" />
            </radialGradient>

            {/* Gold Gradients */}
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF3C7" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>

            {/* Ribbon Gradients */}
            <linearGradient id="ribbonLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#991B1B" />
              <stop offset="100%" stopColor="#5B1111" />
            </linearGradient>
            <linearGradient id="ribbonRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#881337" />
              <stop offset="100%" stopColor="#450A0A" />
            </linearGradient>

            <filter id="sealShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#4C0519" floodOpacity="0.5" />
            </filter>

            {/* Circular Arc Paths for Text */}
            <path id="sealTextArcTop" d="M 32 100 A 68 68 0 0 1 168 100" fill="none" />
            <path id="sealTextArcBottom" d="M 168 100 A 68 68 0 0 1 32 100" fill="none" />
          </defs>

          {/* Hanging Ribbon Tails */}
          <g filter="url(#sealShadow)">
            {/* Left Ribbon with V-notch */}
            <polygon
              points="75,130 52,225 78,205 98,225 88,130"
              fill="url(#ribbonLeft)"
              stroke="#D97706"
              strokeWidth="1.5"
              strokeOpacity="0.7"
            />
            {/* Right Ribbon with V-notch */}
            <polygon
              points="112,130 102,225 122,205 148,225 125,130"
              fill="url(#ribbonRight)"
              stroke="#D97706"
              strokeWidth="1.5"
              strokeOpacity="0.7"
            />
          </g>

          {/* Organic Stamped Wax Edge */}
          <path
            d="M 100 12 
               C 116 10, 130 18, 144 20 
               C 158 22, 172 27, 180 40 
               C 188 53, 185 70, 189 84 
               C 193 98, 198 114, 192 128 
               C 186 142, 172 150, 163 162 
               C 154 174, 146 186, 132 190 
               C 118 194, 104 187, 90 189 
               C 76 191, 62 197, 50 189 
               C 38 181, 32 165, 24 153 
               C 16 141, 5 129, 6 114 
               C 7 99, 18 87, 21 73 
               C 24 59, 21 43, 32 32 
               C 43 21, 60 25, 74 19 
               Z"
            fill="url(#waxGradient)"
            filter="url(#sealShadow)"
          />

          {/* Outer Decorative Beaded / Stitched Ring */}
          <circle
            cx="100"
            cy="100"
            r="69"
            fill="none"
            stroke="#FEF3C7"
            strokeWidth="1.8"
            strokeOpacity="0.85"
            strokeDasharray="4 2"
          />
          {/* Inner Recessed Wax Trench */}
          <circle
            cx="100"
            cy="100"
            r="64"
            fill="#7F1D1D"
            stroke="#D97706"
            strokeWidth="1.8"
            fillOpacity="0.7"
          />

          {/* Curved Text Top */}
          <text
            fontSize="9"
            fontWeight="bold"
            fontFamily="ui-serif, Georgia, serif"
            fill="#FDE68A"
            letterSpacing="2.8"
          >
            <textPath href="#sealTextArcTop" startOffset="50%" textAnchor="middle">
              ✦ SEALED &amp; COMMITTED ✦
            </textPath>
          </text>

          {/* Curved Text Bottom */}
          <text
            fontSize="8.5"
            fontWeight="bold"
            fontFamily="ui-serif, Georgia, serif"
            fill="#FDE68A"
            letterSpacing="2"
          >
            <textPath href="#sealTextArcBottom" startOffset="50%" textAnchor="middle">
              ★ ANNO {year} ★
            </textPath>
          </text>

          {/* Central Compass & North Star Insignia */}
          <g transform="translate(100, 100)">
            <circle cx="0" cy="0" r="30" fill="#4C0519" stroke="#F59E0B" strokeWidth="1.5" />

            {/* Diagonal points */}
            <polygon
              points="0,-23 4,-5 19,-19 5,-4 23,0 5,4 19,19 4,5 0,23 -4,5 -19,19 -5,4 -23,0 -5,-4 -19,-19 -4,-5"
              fill="#FDE68A"
              opacity="0.5"
            />
            {/* North Point */}
            <polygon points="0,-25 5,-4 0,0" fill="#FBBF24" />
            <polygon points="0,-25 -5,-4 0,0" fill="#B45309" />
            {/* South Point */}
            <polygon points="0,25 5,4 0,0" fill="#B45309" />
            <polygon points="0,25 -5,4 0,0" fill="#FBBF24" />
            {/* East Point */}
            <polygon points="25,0 4,-5 0,0" fill="#FBBF24" />
            <polygon points="25,0 4,5 0,0" fill="#B45309" />
            {/* West Point */}
            <polygon points="-25,0 -4,-5 0,0" fill="#B45309" />
            <polygon points="-25,0 -4,5 0,0" fill="#FBBF24" />
            {/* Center Core Pip */}
            <circle cx="0" cy="0" r="4" fill="#FEF3C7" stroke="#991B1B" strokeWidth="1" />
          </g>
        </svg>
      </div>

      <div className="mt-1 text-center">
        <span className="text-[9px] font-display uppercase tracking-widest font-black text-[#991B1B] bg-red-50 border border-red-200 px-2 py-0.5 rounded shadow-2xs">
          Sealed &amp; Anchored
        </span>
        <p className="text-[10px] font-mono text-[#78716C] mt-0.5">{formattedDate}</p>
      </div>
    </div>
  );
}

export default function CompassRoadmapView({
  metadata,
  year,
  onUpdateMetadata,
}: CompassRoadmapViewProps) {
  const isLocked = !!metadata.isLocked;
  const sealedAt = metadata.sealedAt;

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

  const handleToggleLock = () => {
    if (isLocked) {
      // Unlock
      onUpdateMetadata({
        ...metadata,
        isLocked: false,
      });
    } else {
      // Seal & Lock
      onUpdateMetadata({
        ...metadata,
        isLocked: true,
        sealedAt: new Date().toISOString(),
      });
    }
  };

  const updateCoreValue = (idx: number, field: keyof CoreValueEntry, val: string) => {
    if (isLocked) return;
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
    if (isLocked) return;
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
    if (isLocked) return;
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
    if (isLocked) return;
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
      {/* 1. TOP HEADER BANNER (WITH WAX SEAL GRAPHIC & LOCK ACTION) */}
      <div
        className={`rounded-2xl p-6 border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs ${
          isLocked
            ? 'bg-gradient-to-br from-[#FAF8F5] via-[#F5EFE6] to-[#EAE0D0] border-[#D4AF37]/50 shadow-md'
            : 'bg-[#FAF8F5] border-[#DDD5C7]'
        }`}
      >
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-widest text-[#B45309]">
            <Compass className="w-4 h-4" />
            <span>North Star &amp; Long-Horizon Vision</span>
            {isLocked && (
              <span className="flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[9px] font-bold">
                <Lock className="w-3 h-3 text-[#B45309]" />
                Officially Sealed
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#1C1917] tracking-tight">
            {year} Compass &amp; Passion Roadmap
          </h1>

          <p className="text-xs sm:text-sm text-[#78716C] font-serif leading-relaxed">
            {isLocked
              ? 'This vision is locked and anchored as your guiding North Star for all months, weeks, and daily check-ins.'
              : 'The foundation from which your months, weeks, and daily actions flow. Fill in your vision and seal it when ready.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleToggleLock}
              className={`px-4 py-2 rounded-xl text-xs font-display uppercase tracking-wider font-bold inline-flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                isLocked
                  ? 'bg-[#FAF8F5] hover:bg-white text-[#78716C] border border-[#DDD5C7] hover:text-[#1C1917]'
                  : 'bg-[#991B1B] hover:bg-[#7F1D1D] text-white hover:shadow-md'
              }`}
            >
              {isLocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-stone-500" />
                  <span>Break Seal / Unlock to Edit</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>Seal &amp; Lock 2026 Compass</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F2ECE1] border border-[#DDD5C7] rounded-xl text-xs font-mono text-[#1C1917]">
              <Shield className="w-3.5 h-3.5 text-[#1E40AF]" />
              <span>Confidential Life Roadmap</span>
            </div>
          </div>
        </div>

        {/* Wax Seal Graphic Graphic Rendered on the Right */}
        {isLocked ? (
          <WaxSealEmblem year={year} sealedAt={sealedAt} />
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-[#DDD5C7] bg-[#F2ECE1]/50 text-center max-w-[180px] shrink-0">
            <Lock className="w-6 h-6 text-[#991B1B] opacity-60 mb-1" />
            <span className="text-[10px] font-display uppercase font-bold text-[#66615C]">
              Seal When Ready
            </span>
            <span className="text-[9px] text-[#78716C] font-serif mt-0.5">
              Locks your roadmap and renders your wax seal
            </span>
          </div>
        )}
      </div>

      {/* 2. Annual GameChanger Goal Card */}
      <div
        className={`rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 border-2 transition-all ${
          isLocked
            ? 'bg-[#FAF8F5] border-[#B45309]/80 shadow-xs'
            : 'bg-[#FAF8F5] border-[#1C1917]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#E5DFC5] pb-3">
          <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-widest text-[#1C1917]">
            <Target className="w-4 h-4 text-[#B45309]" />
            <span>{year} Annual GameChanger Goal</span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-[#FFDE59] text-[#111827] px-2 py-0.5 rounded font-bold">
            Highest Leverage Priority
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-display uppercase tracking-widest text-[#66615C] font-bold mb-1.5">
              What is the one goal that will have the most transformative impact this year?
            </label>
            {isLocked ? (
              <div className="p-3.5 bg-[#F2ECE1]/70 border border-[#DDD5C7] rounded-xl">
                <p className="text-base sm:text-lg font-serif font-black text-[#1C1917]">
                  {annualGamechanger.goal || <span className="italic text-stone-400">No goal defined yet.</span>}
                </p>
              </div>
            ) : (
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
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-[10px] font-display uppercase tracking-widest text-[#66615C] font-bold mb-1.5">
                Vivid Vision (What does achieving this look &amp; feel like?)
              </label>
              {isLocked ? (
                <div className="p-3.5 bg-[#F2ECE1]/70 border border-[#DDD5C7] rounded-xl min-h-[90px]">
                  <p className="text-xs font-serif text-[#1C1917] whitespace-pre-wrap leading-relaxed">
                    {annualGamechanger.vision || <span className="italic text-stone-400">No vision entered.</span>}
                  </p>
                </div>
              ) : (
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
              )}
            </div>

            <div>
              <label className="block text-[10px] font-display uppercase tracking-widest text-[#66615C] font-bold mb-1.5">
                Why this matters deeply (The Internal Purpose)
              </label>
              {isLocked ? (
                <div className="p-3.5 bg-[#F2ECE1]/70 border border-[#DDD5C7] rounded-xl min-h-[90px]">
                  <p className="text-xs font-serif text-[#1C1917] whitespace-pre-wrap leading-relaxed">
                    {annualGamechanger.whyMatters || <span className="italic text-stone-400">No purpose statement entered.</span>}
                  </p>
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Core Values Compass (3 Pillars) */}
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
                <div className="space-y-3">
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
                    {isLocked ? (
                      <p className="text-sm font-serif font-bold text-[#1C1917] bg-[#F2ECE1]/60 px-3 py-1.5 rounded-lg border border-[#DDD5C7]">
                        {pillar.value || <span className="text-stone-400 font-normal italic">Undefined</span>}
                      </p>
                    ) : (
                      <input
                        type="text"
                        value={pillar.value}
                        onChange={(e) => updateCoreValue(idx, 'value', e.target.value)}
                        placeholder={
                          idx === 0
                            ? 'e.g. Purposeful Mentorship'
                            : idx === 1
                            ? 'e.g. Whole-Life Vitality'
                            : 'e.g. Courageous Transformation'
                        }
                        className="w-full text-sm font-serif font-bold bg-[#F2ECE1] border border-[#DDD5C7] rounded-lg px-3 py-1.5 text-[#1C1917] outline-none focus:border-[#1E40AF]"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-display uppercase tracking-wider text-[#66615C] mb-1 font-semibold">
                      Why is this value essential to you?
                    </label>
                    {isLocked ? (
                      <p className="text-xs font-serif text-[#1C1917] bg-[#F2ECE1]/60 p-2.5 rounded-lg border border-[#DDD5C7] leading-relaxed whitespace-pre-wrap">
                        {pillar.whyImportant || <span className="text-stone-400 italic">No notes</span>}
                      </p>
                    ) : (
                      <textarea
                        rows={2}
                        value={pillar.whyImportant}
                        onChange={(e) => updateCoreValue(idx, 'whyImportant', e.target.value)}
                        placeholder="Why does this anchor your choices?"
                        className="w-full text-xs font-serif bg-[#F2ECE1] border border-[#DDD5C7] rounded-lg p-2 text-[#1C1917] outline-none focus:border-[#1E40AF]"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-display uppercase tracking-wider text-[#66615C] mb-1 font-semibold">
                      How do you embody this now?
                    </label>
                    {isLocked ? (
                      <p className="text-xs font-serif text-[#1C1917] bg-[#F2ECE1]/60 p-2.5 rounded-lg border border-[#DDD5C7] leading-relaxed whitespace-pre-wrap">
                        {pillar.howEmbodiedNow || <span className="text-stone-400 italic">No notes</span>}
                      </p>
                    ) : (
                      <textarea
                        rows={2}
                        value={pillar.howEmbodiedNow}
                        onChange={(e) => updateCoreValue(idx, 'howEmbodiedNow', e.target.value)}
                        placeholder="Current examples in daily life..."
                        className="w-full text-xs font-serif bg-[#F2ECE1] border border-[#DDD5C7] rounded-lg p-2 text-[#1C1917] outline-none focus:border-[#1E40AF]"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-display uppercase tracking-wider text-[#66615C] mb-1 font-semibold">
                      Actionable ways to embody this:
                    </label>
                    {isLocked ? (
                      <p className="text-xs font-serif text-[#1C1917] bg-[#F2ECE1]/60 p-2.5 rounded-lg border border-[#DDD5C7] leading-relaxed whitespace-pre-wrap">
                        {pillar.actionableSteps || <span className="text-stone-400 italic">No steps recorded</span>}
                      </p>
                    ) : (
                      <textarea
                        rows={2}
                        value={pillar.actionableSteps}
                        onChange={(e) => updateCoreValue(idx, 'actionableSteps', e.target.value)}
                        placeholder="1. Daily writing block&#10;2. Direct candor&#10;3. Morning movement"
                        className="w-full text-xs font-serif bg-[#F2ECE1] border border-[#DDD5C7] rounded-lg p-2 text-[#1C1917] outline-none focus:border-[#1E40AF]"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. The Passion Roadmap (4-Horizon Wishlist) */}
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
                      No milestones recorded for this horizon yet.
                    </p>
                  ) : (
                    items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#B45309] font-bold shrink-0">
                          {idx + 1}.
                        </span>
                        {isLocked ? (
                          <span className="text-xs font-serif text-[#1C1917] bg-[#F2ECE1]/60 px-2.5 py-1 rounded-lg border border-[#DDD5C7] flex-1">
                            {item}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateRoadmapItem(quad.key, idx, e.target.value)}
                            placeholder="Goal or aspiration..."
                            className="flex-1 text-xs font-serif bg-[#F2ECE1] border border-[#DDD5C7] rounded-lg px-2.5 py-1.5 text-[#1C1917] outline-none focus:border-[#1E40AF]"
                          />
                        )}

                        {!isLocked && (
                          <button
                            type="button"
                            onClick={() => removeRoadmapItem(quad.key, idx)}
                            className="p-1 text-[#9C9589] hover:text-red-700 transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}

                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => addRoadmapItem(quad.key)}
                      className="inline-flex items-center gap-1.5 text-xs font-display uppercase tracking-wider font-bold text-[#1E40AF] hover:text-[#1D4ED8] pt-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Milestone</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
