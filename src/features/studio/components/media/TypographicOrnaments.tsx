import { TypographicOrnament } from '@/types/database';

interface TypographicOrnamentProps {
  ornament?: TypographicOrnament;
  className?: string;
}

export default function TypographicOrnamentView({
  ornament = 'broadsheet_crest',
  className = '',
}: TypographicOrnamentProps) {
  switch (ornament) {
    case 'century_monogram':
      return (
        <div className={`flex flex-col items-center justify-center select-none py-6 ${className}`}>
          <div className="w-14 h-14 border-2 border-[#1C1917] rotate-45 flex items-center justify-center bg-[#F2ECE1] shadow-2xs mb-2">
            <span className="-rotate-45 font-display font-black text-sm tracking-widest text-[#1C1917]">
              RW
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-[0.25em] text-[#B45309]">
            <span>Est.</span>
            <span>◆</span>
            <span>Broadsheet</span>
          </div>
        </div>
      );

    case 'woodcut_fleuron':
      return (
        <div className={`flex flex-col items-center justify-center select-none py-6 ${className}`}>
          <div className="text-2xl text-[#1E40AF] font-serif mb-1 leading-none">
            ❦
          </div>
          <div className="flex items-center gap-3 w-48 max-w-full">
            <div className="flex-1 border-t border-[#DDD5C7]" />
            <span className="text-[#B45309] text-[10px]">◆</span>
            <div className="flex-1 border-t border-[#DDD5C7]" />
          </div>
        </div>
      );

    case 'minimal_dropcap':
      return (
        <div className={`flex items-center justify-center gap-3 py-4 select-none ${className}`}>
          <div className="flex-1 border-t-2 border-[#1C1917]" />
          <div className="flex items-center gap-1.5 text-xs text-[#B45309] font-medium tracking-[0.2em] uppercase font-display">
            <span>◆</span>
            <span>ESSAY &amp; COMMENTARY</span>
            <span>◆</span>
          </div>
          <div className="flex-1 border-t-2 border-[#1C1917]" />
        </div>
      );

    case 'broadsheet_crest':
    default:
      return (
        <div className={`flex flex-col items-center justify-center select-none py-6 text-center ${className}`}>
          <div className="flex items-center gap-3 w-full max-w-md mx-auto mb-2">
            <div className="flex-1 border-t border-[#1C1917]/70" />
            <div className="px-3 py-1 bg-[#F2ECE1] border border-[#DDD5C7] rounded text-xs font-display font-bold uppercase tracking-[0.22em] text-[#1C1917]">
              ROCK THE WESTERN WORLD
            </div>
            <div className="flex-1 border-t border-[#1C1917]/70" />
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#78716C] font-serif italic">
            <span>&bull;</span>
            <span>A Cultural Broadsheet &bull; Typographic Feature</span>
            <span>&bull;</span>
          </div>
        </div>
      );
  }
}
