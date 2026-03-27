import { useRef } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Minus,
  Eraser,
  Undo,
  Redo,
} from 'lucide-react';

interface ToolbarProps {
  editor: Editor;
}

export default function Toolbar({ editor }: ToolbarProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);

  const getActiveStyle = () => {
    if (editor.isActive('heading', { level: 1 })) return 'h1';
    if (editor.isActive('heading', { level: 2 })) return 'h2';
    if (editor.isActive('heading', { level: 3 })) return 'h3';
    if (editor.isActive('heading', { level: 4 })) return 'h4';
    return 'p';
  };

  const applyStyle = (value: string) => {
    if (value === 'p') editor.chain().focus().setParagraph().run();
    else if (value === 'h1') editor.chain().focus().setHeading({ level: 1 }).run();
    else if (value === 'h2') editor.chain().focus().setHeading({ level: 2 }).run();
    else if (value === 'h3') editor.chain().focus().setHeading({ level: 3 }).run();
    else if (value === 'h4') editor.chain().focus().setHeading({ level: 4 }).run();
  };

  const Sep = () => <div className="w-px h-5 bg-gray-300 mx-1 shrink-0" />;

  const Btn = ({
    onClick, active = false, title, disabled = false, children,
  }: {
    onClick: () => void; active?: boolean; title: string; disabled?: boolean; children: React.ReactNode;
  }) => (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={[
        'h-7 min-w-7 px-1.5 rounded flex items-center justify-center transition-colors shrink-0',
        active ? 'bg-[#c2e7ff] text-[#001d35]' : 'text-gray-700 hover:bg-gray-200',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      {children}
    </button>
  );

  const currentColor = editor.getAttributes('textStyle').color || '#000000';

  return (
    <div
      className="bg-[#f8f9fa] border-b border-gray-200 px-2 py-1 flex items-center gap-0.5 overflow-x-auto shrink-0"
      style={{ minHeight: 40 }}
    >
      {/* Undo / Redo */}
      <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)" disabled={!editor.can().undo()}>
        <Undo className="w-4 h-4" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Y)" disabled={!editor.can().redo()}>
        <Redo className="w-4 h-4" />
      </Btn>
      <Sep />

      {/* Paragraph style */}
      <select
        value={getActiveStyle()}
        onChange={e => applyStyle(e.target.value)}
        title="Paragraph style"
        className="h-7 text-sm border border-transparent rounded px-1.5 bg-transparent text-gray-700 hover:bg-gray-200 cursor-pointer focus:outline-none focus:border-gray-300"
      >
        <option value="p">Normal text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="h4">Heading 4</option>
      </select>

      {/* Font face (display only â€” FontFamily extension not installed) */}
      <select
        disabled
        title="Font name"
        className="h-7 text-sm border border-transparent rounded px-1 bg-transparent text-gray-500 cursor-not-allowed focus:outline-none w-28"
      >
        <option>Arial</option>
      </select>

      {/* Font size (display only) */}
      <div className="flex items-center border border-transparent rounded hover:border-gray-300 h-7 px-1">
        <input
          type="text"
          defaultValue="11"
          disabled
          title="Font size"
          className="w-6 text-sm text-center bg-transparent text-gray-500 cursor-not-allowed focus:outline-none"
          readOnly
        />
      </div>
      <Sep />

      {/* Bold / Italic / Underline / Strike / Code */}
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
        <Bold className="w-4 h-4" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
        <Italic className="w-4 h-4" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
        <UnderlineIcon className="w-4 h-4" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
        <Strikethrough className="w-4 h-4" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
        <Code className="w-4 h-4" />
      </Btn>
      <Sep />

      {/* Text color */}
      <div className="relative shrink-0">
        <button
          type="button"
          title="Text color"
          onMouseDown={e => { e.preventDefault(); colorInputRef.current?.click(); }}
          className="h-7 w-7 rounded flex flex-col items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
        >
          <span className="text-sm font-black text-gray-800 leading-none">A</span>
          <span className="w-4 h-0.75 rounded-full mt-0.5" style={{ backgroundColor: currentColor }} />
        </button>
        <input
          ref={colorInputRef}
          type="color"
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
          defaultValue="#000000"
          onChange={e => editor.chain().focus().setColor(e.target.value).run()}
        />
      </div>

      {/* Highlight */}
      <div className="relative shrink-0">
        <button
          type="button"
          title="Highlight color"
          onMouseDown={e => { e.preventDefault(); highlightInputRef.current?.click(); }}
          className="h-7 w-7 rounded flex flex-col items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
        >
          <span className="text-sm text-gray-800 leading-none font-medium">ab</span>
          <span className="w-4 h-0.75 rounded-full mt-0.5 bg-yellow-300" />
        </button>
        <input
          ref={highlightInputRef}
          type="color"
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
          defaultValue="#ffd700"
          onChange={e => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
        />
      </div>
      <Sep />

      {/* Alignment */}
      <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
        <AlignLeft className="w-4 h-4" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
        <AlignCenter className="w-4 h-4" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
        <AlignRight className="w-4 h-4" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
        <AlignJustify className="w-4 h-4" />
      </Btn>
      <Sep />

      {/* Lists */}
      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
        <List className="w-4 h-4" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
        <ListOrdered className="w-4 h-4" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
        <Quote className="w-4 h-4" />
      </Btn>
      <Sep />

      {/* Misc */}
      <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal divider">
        <Minus className="w-4 h-4" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear formatting">
        <Eraser className="w-4 h-4" />
      </Btn>
    </div>
  );
}