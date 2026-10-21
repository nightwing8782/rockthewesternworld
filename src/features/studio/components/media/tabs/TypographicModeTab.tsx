'use client';

import { EntryMetadata, TypographicOrnament } from '@/types/database';
import TypographicOrnamentView from '../TypographicOrnaments';
import { BookOpen, CheckCircle2, Sparkles } from 'lucide-react';

interface TypographicModeTabProps {
  metadata: EntryMetadata;
  onMetadataChange: (newMeta: Partial<EntryMetadata>) => void;
}

const ORNAMENTS: { id: TypographicOrnament; name: string; description: string }[] = [
  {
    id: 'broadsheet_crest',
    name: 'Broadsheet Masthead Crest',
    description: 'Engraved double-rule with centered "Rock The Western World" publication header.',
  },
  {
    id: 'century_monogram',
    name: 'Century Printer’s Seal',
    description: 'Classical octagonal monogram emblem with diamond typographic stamps.',
  },
  {
    id: 'woodcut_fleuron',
    name: 'Woodcut Printer’s Fleuron',
    description: 'Classical printer’s ivy leaf fleuron (❦) with hairline dividers.',
  },
  {
    id: 'minimal_dropcap',
    name: 'Broadsheet Rule & Diamond',
    description: 'Sturdy twin-border rule with diamond point and classical dropcap layout.',
  },
];

export default function TypographicModeTab({
  metadata,
  onMetadataChange,
}: TypographicModeTabProps) {
  const currentOrnament = metadata.typographic_ornament || 'broadsheet_crest';
  const isTypographicActive = metadata.cover_type === 'typographic';

  const handleSelectOrnament = (ornament: TypographicOrnament) => {
    onMetadataChange({
      cover_type: 'typographic',
      typographic_ornament: ornament,
      // Retain existing image URLs in case user switches back later, but clear active display
    });
  };

  return (
    <div className="space-y-4 font-serif">
      <div className="p-3 bg-[#F2ECE1] border border-[#DDD5C7] rounded text-xs text-[#44403C] flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
        <div>
          <span className="font-display font-bold uppercase tracking-wider text-[#1C1917] block mb-0.5">
            Dignified Typographic Publishing
          </span>
          <span>
            Publishing without an image is an authentic, intentional design choice. Typographic Mode removes all placeholder boxes and formats your piece with classical broadsheet printer's ornaments and dropcaps.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {ORNAMENTS.map((item) => {
          const isSelected = isTypographicActive && currentOrnament === item.id;

          return (
            <div
              key={item.id}
              onClick={() => handleSelectOrnament(item.id)}
              className={`p-4 border rounded cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-[#1E40AF] bg-[#FAF8F5] ring-2 ring-[#1E40AF]/20 shadow-xs'
                  : 'border-[#DDD5C7] bg-[#FAF8F5] hover:border-[#1E40AF] hover:bg-white'
              }`}
            >
              <div className="border border-[#DDD5C7] rounded bg-[#F2ECE1] mb-3 overflow-hidden">
                <TypographicOrnamentView ornament={item.id} />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#1C1917]">
                    {item.name}
                  </h4>
                  {isSelected && (
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[9px] font-sans font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#66615C] leading-snug">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
