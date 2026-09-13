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
} from 'lucide-react';
import { useEffect } from 'react';

interface TipTapEditorProps {
  initialContent?: string;
  onChange: (data: { html: string; json: any }) => void;
  placeholder?: string;
  onInsertImage?: (url: string) => void;
}

export default function TipTapEditor({
  initialContent = '',
  onChange,
  placeholder = 'Write without restraint for the broadsheet...',
}: TipTapEditorProps) {
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
      </div>

      {/* Editor Body */}
      <div className="p-6 sm:p-8 bg-[#FAF8F5]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
