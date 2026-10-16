'use client';

import { useState } from 'react';
import { Sparkles, RefreshCw, Quote, X } from 'lucide-react';

export const REFLECTION_PROMPTS = [
  'What quiet truth about human nature did you witness or uncover today that most people hurried past?',
  'Examine an architectural, musical, or artistic detail you encountered recently. What philosophy of life does it embody?',
  'Which conviction of yours was challenged, deepened, or complicated recently by something you read or experienced?',
  'Reflect on the difference between what a cultural work promised to be and what it actually delivered.',
  'What is a memory from your past that returned unexpectedly this week, and what does it reveal about your current trajectory?',
  'Describe a single room, street corner, or landscape from memory with forensic, sensory precision.',
  'What is a classic or historical debate that is quietly playing out beneath modern headlines?',
  'If you had to distill your primary creative or intellectual preoccupation of the last month into one sentence, what would it be?',
  'What piece of advice or conventional wisdom have you recently discarded, and why?',
  'Reflect on a book, album, or film that you judged unfairly on first encounter. How has your perspective shifted?',
  'What is an unresolved tension in your thinking that you are not yet ready to solve, but want to record?',
  'How has the physical environment you worked in today shaped the rhythm and cadence of your thoughts?',
  'What does genuine mastery look like in a craft or discipline you admire from afar?',
  'What is a fleeting conversation or overheard fragment that lingered in your thoughts long after it ended?',
  'What is an aesthetic standard or artistic principle you refuse to compromise on?',
];

interface ReflectionPromptBarProps {
  onInsertPrompt: (promptText: string) => void;
  onDismiss?: () => void;
}

export default function ReflectionPromptBar({ onInsertPrompt, onDismiss }: ReflectionPromptBarProps) {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * REFLECTION_PROMPTS.length));
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const currentPrompt = REFLECTION_PROMPTS[index % REFLECTION_PROMPTS.length];

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % REFLECTION_PROMPTS.length);
  };

  const handleInsert = () => {
    onInsertPrompt(currentPrompt);
  };

  const handleClose = () => {
    setIsDismissed(true);
    if (onDismiss) onDismiss();
  };

  return (
    <div className="mb-5 p-3.5 bg-[#FAF3E0]/70 border border-[#E2D5B8] rounded text-[#242120] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <Sparkles className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
        <div className="text-xs font-serif leading-relaxed italic text-[#3A352F]">
          <span className="font-display not-italic font-bold uppercase tracking-wider text-[10px] text-[#B45309] mr-2">
            Private Reflection Prompt:
          </span>
          "{currentPrompt}"
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center text-xs font-display font-semibold uppercase tracking-wider">
        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] text-[#554F47] hover:text-[#1C1917] hover:bg-[#EADBBE]/50 rounded transition-colors cursor-pointer"
          title="Show another prompt"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Another</span>
        </button>

        <button
          type="button"
          onClick={handleInsert}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1C1917] text-[#FAF8F5] hover:bg-[#1E40AF] text-[11px] rounded transition-colors shadow-2xs cursor-pointer"
          title="Insert prompt as blockquote into editor"
        >
          <Quote className="w-3 h-3" />
          <span>Insert as Blockquote</span>
        </button>

        <button
          type="button"
          onClick={handleClose}
          className="p-1 text-[#8C8479] hover:text-[#1C1917] rounded transition-colors cursor-pointer"
          title="Dismiss prompt bar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
