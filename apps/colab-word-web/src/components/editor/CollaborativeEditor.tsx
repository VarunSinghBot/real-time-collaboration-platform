import { useEffect, useState, useMemo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Cloud, CloudOff, Loader, Share2 } from 'lucide-react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import Toolbar from './Toolbar';
import { authService } from '@/lib/auth';

interface CollaborativeEditorProps {
  roomId: string;
  permission: string;
  title?: string;
  onTitleChange?: (title: string) => void;
}

const COLORS = [
  '#1a73e8', '#e8453c', '#0f9d58', '#f4b400', '#9c27b0',
  '#00bcd4', '#ff5722', '#607d8b', '#e91e63', '#4caf50',
];

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function initials(name: string) {
  return (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function CollaborativeEditor({
  roomId,
  permission,
  title = 'Untitled document',
  onTitleChange,
}: CollaborativeEditorProps) {
  const navigate = useNavigate();
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [docTitle, setDocTitle] = useState(title);

  const WS_URL = (import.meta.env.VITE_WS_URL || 'ws://localhost:4000').replace(/\/$/, '');

  const userRef = useRef(authService.getUser());
  const userColor = useRef(getRandomColor()).current;
  const [noToken, setNoToken] = useState(false);

  const { ydoc, provider } = useMemo(() => {
    const doc = new Y.Doc();
    const token = authService.getAccessToken();
    if (!token) {
      // No valid token — create a disconnected provider so the editor can
      // still mount, then redirect to login via the effect below.
      const wsProvider = new WebsocketProvider(
        `${WS_URL}/ws/document`,
        roomId,
        doc,
        { params: { token: '', permission }, connect: false },
      );
      setNoToken(true);
      return { ydoc: doc, provider: wsProvider };
    }
    const wsProvider = new WebsocketProvider(
      `${WS_URL}/ws/document`,
      roomId,
      doc,
      { params: { token, permission }, connect: false },
    );
    return { ydoc: doc, provider: wsProvider };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, permission]);

  // Redirect to login when there is no token (expired/cleared session)
  useEffect(() => {
    if (noToken) navigate('/login');
  }, [noToken, navigate]);

  // Also redirect when the session is cleared while the editor is open
  useEffect(() => {
    const handleCleared = () => navigate('/login');
    window.addEventListener('auth:session-cleared', handleCleared);
    return () => window.removeEventListener('auth:session-cleared', handleCleared);
  }, [navigate]);

  useEffect(() => {
    const handleStatus = (event: any) => setStatus(event.status);
    const handleAwarenessChange = () => {
      const states = Array.from(provider.awareness.getStates().values());
      setOnlineUsers(states.filter((state: any) => state.user));
    };

    provider.on('status', handleStatus);
    provider.awareness.on('change', handleAwarenessChange);

    // Start the connection NOW — after the listener is registered so we
    // never miss the 'connected' event (useMemo creates the provider with
    // connect:false to prevent an auto-connect race condition).
    provider.connect();
    provider.awareness.setLocalState({
      user: {
        name: userRef.current?.name || userRef.current?.email,
        color: userColor,
      },
    });

    return () => {
      provider.off('status', handleStatus);
      provider.awareness.off('change', handleAwarenessChange);
      provider.destroy();
    };
  }, [provider, userColor]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      Placeholder.configure({
        placeholder: permission === 'view' ? 'This document is read-only.' : 'Start typing\u2026',
      }),
      Collaboration.configure({ document: ydoc }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: userRef.current?.name || userRef.current?.email,
          color: userColor,
        },
      }),
    ],
    editable: permission !== 'view',
    editorProps: {
      attributes: {
        class: 'tiptap-doc focus:outline-none',
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#f0f4f9' }}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="bg-white shrink-0 px-3 pt-2 pb-0 flex flex-col" style={{ boxShadow: '0 1px 0 #e0e0e0' }}>
        {/* Row 1: icon + title + actions */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-1">
            {/* Back to dashboard */}
            <button
              onClick={() => navigate('/dashboard')}
              title="Back to dashboard"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            {/* Google-Docs-style document icon */}
            <div className="w-8 h-9 flex items-end justify-center shrink-0 mr-1">
              <svg viewBox="0 0 38 48" className="w-7 h-9">
                <path d="M0 6C0 2.7 2.7 0 6 0H24L38 14V42C38 45.3 35.3 48 32 48H6C2.7 48 0 45.3 0 42V6Z" fill="#4285F4" />
                <path d="M24 0L38 14H27C25.3 14 24 12.7 24 11V0Z" fill="#A8C7FA" />
                <rect x="8" y="22" width="22" height="3" rx="1.5" fill="white" />
                <rect x="8" y="29" width="22" height="3" rx="1.5" fill="white" />
                <rect x="8" y="36" width="16" height="3" rx="1.5" fill="white" />
              </svg>
            </div>

            {/* Editable title */}
            <input
              value={docTitle}
              onChange={e => setDocTitle(e.target.value)}
              onBlur={() => onTitleChange?.(docTitle)}
              onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              readOnly={permission === 'view'}
              placeholder="Untitled document"
              className="text-[18px] font-normal text-gray-900 bg-transparent border border-transparent focus:border-blue-400 hover:border-gray-300 rounded px-2 py-0.5 focus:outline-none transition-colors w-45 sm:w-80 md:w-120 truncate"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Save status */}
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 select-none">
              {status === 'connected' && <><Cloud className="w-4 h-4" /><span>Saved</span></>}
              {status === 'connecting' && <><Loader className="w-4 h-4 animate-spin" /><span>Connecting…</span></>}
              {status === 'disconnected' && <><CloudOff className="w-4 h-4 text-red-400" /><span className="text-red-500">Offline</span></>}
            </div>

            {/* Online user avatars */}
            {onlineUsers.length > 0 && (
              <div className="flex -space-x-1.5">
                {onlineUsers.slice(0, 5).map((u, i) => (
                  <div
                    key={u.user?.name || i}
                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-semibold shadow-sm"
                    style={{ backgroundColor: u.user?.color || '#888' }}
                    title={u.user?.name || u.user?.email || 'User'}
                  >
                    {initials(u.user?.name || u.user?.email || '?')}
                  </div>
                ))}
                {onlineUsers.length > 5 && (
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                    +{onlineUsers.length - 5}
                  </div>
                )}
              </div>
            )}

            {/* Share button */}
            <button
              className="flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-medium text-white transition-colors shadow-sm shrink-0"
              style={{ backgroundColor: '#1a73e8' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1557b0')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1a73e8')}
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>

        {/* Row 2: menu bar */}
        <div className="flex items-center border-t border-gray-100 -mx-3 px-3">
          {(['File', 'Edit', 'View', 'Insert', 'Format', 'Tools', 'Extensions', 'Help'] as const).map(m => (
            <button
              key={m}
              className="px-3 py-1 text-[13px] text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              {m}
            </button>
          ))}
        </div>
      </header>

      {/* ── Formatting toolbar ───────────────────────────────────── */}
      {permission !== 'view' && <Toolbar editor={editor} />}

      {/* ── Page area ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-8 px-4 flex flex-col items-center">

          {/* Connection banners */}
          {status === 'connecting' && (
            <div className="w-full max-w-204 mb-3 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              <Loader className="w-4 h-4 animate-spin shrink-0" />
              Connecting to collaboration server…
            </div>
          )}
          {status === 'disconnected' && (
            <div className="w-full max-w-204 mb-3 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <CloudOff className="w-4 h-4 shrink-0" />
              Cannot reach collaboration server. Your changes are local only.
            </div>
          )}

          {/* White document page */}
          <div
            className="w-full max-w-204 bg-white"
            style={{
              minHeight: 1056,
              padding: '72px 96px',
              boxShadow: '0 1px 3px rgba(0,0,0,.2), 0 1px 2px rgba(0,0,0,.1)',
            }}
          >
            <EditorContent editor={editor} />
          </div>

          {/* Bottom breathing room */}
          <div className="h-16" />
        </div>
      </div>
    </div>
  );
}
