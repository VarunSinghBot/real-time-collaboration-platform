import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Save } from 'lucide-react';
import Toolbar from './Toolbar';
import { authService } from '@/lib/auth';

export default function Editor() {
  const navigate = useNavigate();
  const user = authService.getUser();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
      Placeholder.configure({
        placeholder: 'Start typing your document...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-screen',
      },
    },
  });

  const handleSave = () => {
    if (editor) {
      const content = editor.getHTML();
      localStorage.setItem('document_content', content);
      alert('Document saved!');
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80">
            <FileText className="w-6 h-6 text-indigo-600" />
            <span className="font-semibold text-gray-900">CollabDocs</span>
          </Link>
          <div className="text-sm text-gray-600">Private Document</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">{user?.name || user?.email}</div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <Toolbar editor={editor} />

      {/* Editor */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
