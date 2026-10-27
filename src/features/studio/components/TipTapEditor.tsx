'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Minus,
  Undo,
  Redo,
  ImageIcon,
  Maximize2,
  Minimize2,
  Clock,
  Sparkles,
  Feather,
  Compass,
} from 'lucide-react';
import { useEffect, useState, useRef, useMemo } from 'react';

interface TipTapEditorProps {
  initialContent?: string;
  onChange: (data: { html: string; json: any }) => void;
  placeholder?: string;
  onInsertImage?: (url: string) => void;
  createdAt?: string;
  updatedAt?: string;
  entryType?: string;
}

export default function TipTapEditor({
  initialContent = '',
  onChange,
  placeholder = 'Write without restraint for the broadsheet...',
  createdAt,
  updatedAt,
  entryType = 'essay',
}: TipTapEditorProps) {
  const [isDistractionFree, setIsDistractionFree] = useState(false);
  const initialWordCountRef = useRef<number | null>(null);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Image.configure({
        inline: false,
        HTMLAttributes: {
          class: 'my-6 max-w-full h-auto border border-[#DDD5C7] shadow-xs',
        },
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose-broadsheet focus:outline-none min-h-[420px]',
      },
    },
    onUpdate: ({ editor }) => {
      onChange({
        html: editor.getHTML(),
        json: editor.getJSON(),
      });
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent || '');
    }
  }, [initialContent, editor]);

  // Live Authoring Metrics
  const textContent = editor?.getText() || '';
  const wordCount = useMemo(() => {
    const trimmed = textContent.trim();
    return trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  }, [textContent]);

  const readingTime = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 225));
  }, [wordCount]);

  // Session Statistics: Track words penned during this editing session
  useEffect(() => {
    if (editor && initialWordCountRef.current === null) {
      const initialText = editor.getText().trim();
      initialWordCountRef.current = initialText ? initialText.split(/\s+/).filter(Boolean).length : 0;
    }
  }, [editor]);

  const sessionWordsDelta = initialWordCountRef.current !== null
    ? Math.max(0, wordCount - initialWordCountRef.current)
    : 0;

  // Draft Age Indicator
  const draftAgeText = useMemo(() => {
    if (!createdAt) return 'New Draft';
    try {
      const created = new Date(createdAt);
      const diffMs = Date.now() - created.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return 'First penned today';
      if (diffDays === 1) return 'Draft started yesterday';
      return `Draft started ${diffDays}d ago (${created.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
    } catch {
      return 'Draft in progress';
    }
  }, [createdAt]);

  // Essay Milestones Indicator
  const essayMilestone = useMemo(() => {
    if (wordCount < 300) {
      return { label: 'Sketch / Working Thought', target: 300, pct: Math.min(100, Math.round((wordCount / 300) * 100)) };
    }
    if (wordCount < 800) {
      return { label: 'Draft Outline', target: 800, pct: Math.min(100, Math.round((wordCount / 800) * 100)) };
    }
    if (wordCount < 1500) {
      return { label: 'Broadsheet Dispatch', target: 1500, pct: Math.min(100, Math.round((wordCount / 1500) * 100)) };
    }
    return { label: 'Archival Feature Essay', target: 2500, pct: Math.min(100, Math.round((wordCount / 2500) * 100)) };
  }, [wordCount]);

  // Thoughtful Prompts for Empty Drafts
  const EDITORIAL_PROMPTS = [
    { title: 'Inquiry', prompt: 'What question is this piece trying to answer?' },
    { title: 'Transformation', prompt: 'What changed your mind?' },
    { title: 'Permanence', prompt: 'What deserves remembering?' },
    { title: 'Nuance', prompt: 'What detail would otherwise be lost to time?' },
  ];

  const handleApplyPrompt = (promptText: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(`<blockquote><p><em>“${promptText}”</em></p></blockquote><p></p>`).run();
  };

  // Keyboard shortcut to exit distraction-free mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDistractionFree) {
        setIsDistractionFree(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDistractionFree]);

  const addImageFromUrl = () => {
    const url = window.prompt('Enter Image URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  if (!editor) {
    return (
      <div className="min-h-[420px] flex items-center justify-center text-xs font-display uppercase tracking-widest text-[#44403C]">
        Loading Broadsheet Canvas...
      </div>
    );
  }

  return (
    <>
      {/* Distraction-Free Writing Sanctuary */}
      {isDistractionFree && (
        <div className="fixed inset-0 z-50 bg-[#FAF8F5] text-[#242120] flex flex-col overflow-y-auto">
          {/* Zen Header */}
          <header className="w-full border-b border-[#DDD5C7] bg-[#FAF8F5]/90 backdrop-blur-xs sticky top-0 z-10 py-3 px-6 sm:px-12 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs font-serif text-[#66615C]">
              <span className="font-display font-bold uppercase tracking-widest text-[#1C1917]">
                Distraction-Free Broadsheet
              </span>
              <span>◆</span>
              <span className="font-semibold text-[#1C1917]">{wordCount} words</span>
              <span>·</span>
              <span>~{readingTime} min read</span>
              {sessionWordsDelta > 0 && (
                <>
                  <span>·</span>
                  <span className="text-emerald-700 font-medium">+{sessionWordsDelta} penned this session</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsDistractionFree(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-[#DDD5C7] rounded text-xs font-display font-bold uppercase tracking-wider text-[#1C1917] transition-colors cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Focus (Esc)</span>
            </button>
          </header>

          {/* Zen Body Canvas */}
          <main className="flex-1 w-full max-w-[720px] mx-auto px-6 py-12 sm:py-16">
            <EditorContent editor={editor} />
          </main>
        </div>
      )}

      <div className="border border-[#DDD5C7] bg-[#FAF8F5]">
      {/* Deco Toolbar (iPadOS Touch-Swipeable & Min 40px Touch Targets) */}
      <div className="flex items-center gap-1 p-2 bg-[#F2ECE1] border-b border-[#DDD5C7] text-[#242120] overflow-x-auto no-scrollbar touch-pan-x flex-nowrap shrink-0">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`min-w-[38px] min-h-[38px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center p-2 rounded hover:bg-[#DDD5C7] transition-colors ${
            editor.isActive('bold') ? 'bg-[#DDD5C7] text-[#1E40AF] font-bold' : ''
          }`}
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`min-w-[38px] min-h-[38px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center p-2 rounded hover:bg-[#DDD5C7] transition-colors ${
            editor.isActive('italic') ? 'bg-[#DDD5C7] text-[#1E40AF]' : ''
          }`}
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`min-w-[38px] min-h-[38px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center p-2 rounded hover:bg-[#DDD5C7] transition-colors ${
            editor.isActive('strike') ? 'bg-[#DDD5C7] text-[#1E40AF]' : ''
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-[#DDD5C7] mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`min-w-[38px] min-h-[38px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center p-2 rounded hover:bg-[#DDD5C7] transition-colors ${
            editor.isActive('heading', { level: 1 }) ? 'bg-[#DDD5C7] text-[#1E40AF]' : ''
          }`}
          title="Heading 1"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`min-w-[38px] min-h-[38px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center p-2 rounded hover:bg-[#DDD5C7] transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-[#DDD5C7] text-[#1E40AF]' : ''
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`min-w-[38px] min-h-[38px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center p-2 rounded hover:bg-[#DDD5C7] transition-colors ${
            editor.isActive('heading', { level: 3 }) ? 'bg-[#DDD5C7] text-[#1E40AF]' : ''
          }`}
          title="Heading 3"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-[#DDD5C7] mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`min-w-[38px] min-h-[38px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center p-2 rounded hover:bg-[#DDD5C7] transition-colors ${
            editor.isActive('blockquote') ? 'bg-[#DDD5C7] text-[#1E40AF]' : ''
          }`}
          title="Blockquote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`min-w-[38px] min-h-[38px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center p-2 rounded hover:bg-[#DDD5C7] transition-colors ${
            editor.isActive('bulletList') ? 'bg-[#DDD5C7] text-[#1E40AF]' : ''
          }`}
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`min-w-[38px] min-h-[38px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center p-2 rounded hover:bg-[#DDD5C7] transition-colors ${
            editor.isActive('orderedList') ? 'bg-[#DDD5C7] text-[#1E40AF]' : ''
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded hover:bg-[#DDD5C7] transition-colors"
          title="Divider Diamond"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={addImageFromUrl}
          className="p-1.5 rounded hover:bg-[#DDD5C7] text-[#44403C] hover:text-[#1E40AF] transition-colors"
          title="Insert Image by URL"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-[#DDD5C7] mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded hover:bg-[#DDD5C7] transition-colors disabled:opacity-30"
          title="Undo"
        >
          <Undo className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded hover:bg-[#DDD5C7] transition-colors disabled:opacity-30"
          title="Redo"
        >
          <Redo className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setIsDistractionFree(true)}
          className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FAF8F5] hover:bg-[#DDD5C7] border border-[#DDD5C7] rounded text-xs font-display uppercase tracking-wider font-bold text-[#1C1917] transition-colors cursor-pointer shrink-0"
          title="Distraction-Free Broadsheet Mode"
        >
          <Maximize2 className="w-3.5 h-3.5 text-[#1E40AF]" />
          <span className="hidden sm:inline">Focus Mode</span>
        </button>
      </div>

        {/* Editor Body */}
        <div className="p-6 sm:p-8 bg-[#FAF8F5]">
          <EditorContent editor={editor} />
        </div>

        {/* Empty Draft Prompt Tray (Inviting starting points) */}
        {wordCount === 0 && (
          <div className="mx-6 sm:mx-8 mb-6 p-4 bg-[#F2ECE1]/60 border border-[#DDD5C7] rounded font-serif">
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles className="w-4 h-4 text-[#B45309]" />
              <h5 className="text-xs font-display font-bold uppercase tracking-wider text-[#1C1917]">
                Begin With An Editorial Inquiry
              </h5>
              <span className="text-[11px] text-[#78716C] italic">
                (Click to seed your draft)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EDITORIAL_PROMPTS.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => handleApplyPrompt(item.prompt)}
                  className="p-2.5 text-left bg-white hover:bg-[#FAF8F5] border border-[#DDD5C7] rounded transition-colors group cursor-pointer"
                >
                  <span className="text-[10px] font-display font-bold uppercase tracking-widest text-[#1E40AF] block mb-0.5">
                    {item.title}
                  </span>
                  <span className="text-xs italic text-[#44403C] group-hover:text-[#1C1917] leading-relaxed">
                    "{item.prompt}"
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Phase 1 Authoring Companion Bar (Footer Ledger) */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#F2ECE1] border-t border-[#DDD5C7] flex flex-wrap items-center justify-between gap-3 text-xs font-serif text-[#66615C]">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="font-semibold text-[#1C1917]">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#78716C]" />
              <span>~{readingTime} min read</span>
            </span>
            <span>·</span>
            <span className="text-[#78716C]">{draftAgeText}</span>
            {sessionWordsDelta > 0 && (
              <>
                <span>·</span>
                <span className="text-emerald-700 font-medium">
                  +{sessionWordsDelta} penned this session
                </span>
              </>
            )}
          </div>

          {/* Essay Milestone Meter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-display font-bold uppercase tracking-wider text-[#1C1917]">
              {essayMilestone.label}
            </span>
            <div className="w-20 sm:w-24 h-1.5 bg-[#DDD5C7] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1E40AF] transition-all duration-300"
                style={{ width: `${essayMilestone.pct}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-[#78716C]">
              {essayMilestone.pct}%
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
