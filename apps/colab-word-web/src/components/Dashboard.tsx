import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@repo/auth';
import { authService } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, LogOut, Clock, Star, Users, MoreVertical, Trash2, PenLine } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (authService.isAccessTokenExpired()) {
    try { await authService.refreshToken(); } catch { /* surfaces as 401 */ }
  }
  const token = authService.getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  let res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    try {
      await authService.refreshToken();
      const newToken = authService.getAccessToken();
      const retryHeaders = { ...headers, ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}) };
      res = await fetch(url, { ...options, headers: retryHeaders });
    } catch { /* ignore */ }
    if (res.status === 401) authService.clearSession();
  }
  return res;
}

const DOC_GRADIENTS = [
  'from-violet-500 via-purple-600 to-indigo-700',
  'from-pink-400 via-rose-500 to-purple-600',
  'from-orange-400 via-red-500 to-rose-600',
  'from-cyan-400 via-blue-500 to-indigo-600',
  'from-emerald-400 via-teal-500 to-cyan-600',
  'from-yellow-400 via-orange-500 to-red-500',
  'from-fuchsia-400 via-pink-500 to-rose-600',
  'from-sky-400 via-blue-500 to-violet-600',
];

function getDocGradient(id: string) {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return DOC_GRADIENTS[hash % DOC_GRADIENTS.length];
}

function initials(s: string) {
  return s?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function formatDate(str: string) {
  const d = new Date(str), now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000), hours = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

interface Document {
  id: string;
  roomCode: string;
  title: string;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  permission: string;
  memberCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated, logout: contextLogout } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [navActive, setNavActive] = useState<'all' | 'recent' | 'starred'>('all');
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Restore local bookmarks
  useEffect(() => {
    try {
      const r = localStorage.getItem('recent_docs');
      if (r) setRecentIds(JSON.parse(r));
      const s = localStorage.getItem('starred_docs');
      if (s) setStarredIds(JSON.parse(s));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/login');
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchDocuments = async () => {
      try {
        const res = await apiFetch(`${API_URL}/api/documents`);
        if (res.ok) {
          const raw = await res.json();
          const docs: Document[] = (raw || [])
            .filter((d: any) => d.roomCode || d.id)
            .map((d: any) => ({
              id: d.id || d.roomCode,
              roomCode: d.roomCode,
              title: d.title || 'Untitled Document',
              ownerId: d.ownerId || '',
              ownerName: d.ownerName || '',
              ownerEmail: d.ownerEmail || '',
              permission: d.permission || 'owner',
              memberCount: d.memberCount || 0,
              createdAt: d.createdAt,
              updatedAt: d.updatedAt || d.createdAt,
            }));
          setDocuments(docs);
        }
      } catch { /* ignore */ }
      finally { setLoadingDocs(false); }
    };
    fetchDocuments();
  }, [isAuthenticated]);

  const trackRecent = (id: string) => {
    setRecentIds(prev => {
      const next = [id, ...prev.filter(x => x !== id)].slice(0, 8);
      localStorage.setItem('recent_docs', JSON.stringify(next));
      return next;
    });
  };

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [id, ...prev];
      localStorage.setItem('starred_docs', JSON.stringify(next));
      return next;
    });
  };

  const handleOpenDocument = (doc: Document) => {
    trackRecent(doc.id);
    navigate(`/document/${doc.roomCode}`);
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await apiFetch(`${API_URL}/api/documents`, {
        method: 'POST',
        body: JSON.stringify({ title: newTitle.trim() || 'Untitled Document' }),
      });
      if (res.ok) {
        const data = await res.json();
        const newDoc: Document = {
          id: data.id || data.roomCode,
          roomCode: data.roomCode,
          title: data.title || 'Untitled Document',
          ownerId: data.ownerId || user?.id || '',
          ownerName: data.ownerName || user?.name || '',
          ownerEmail: data.ownerEmail || user?.email || '',
          permission: 'owner',
          memberCount: 0,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || data.createdAt || new Date().toISOString(),
        };
        setDocuments(prev => [newDoc, ...prev]);
        setShowCreateInput(false);
        setNewTitle('');
        trackRecent(newDoc.id);
        navigate(`/document/${newDoc.roomCode}`);
      }
    } catch { /* ignore */ }
    finally { setCreating(false); }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    setOpenMenuId(null);
    const res = await apiFetch(`${API_URL}/api/documents/${doc.roomCode}`, { method: 'DELETE' });
    if (res.ok) setDocuments(prev => prev.filter(d => d.id !== doc.id));
  };

  const handleSaveTitle = async (doc: Document) => {
    const trimmed = editingTitle.trim();
    setEditingId(null);
    if (!trimmed || trimmed === doc.title) return;
    const res = await apiFetch(`${API_URL}/api/documents/${doc.roomCode}`, {
      method: 'PUT',
      body: JSON.stringify({ title: trimmed }),
    });
    if (res.ok) setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, title: trimmed } : d));
  };

  const displayedDocs = (() => {
    if (navActive === 'recent') {
      return recentIds.map(id => documents.find(d => d.id === id)).filter(Boolean) as Document[];
    }
    if (navActive === 'starred') {
      return starredIds.map(id => documents.find(d => d.id === id)).filter(Boolean) as Document[];
    }
    return [...documents].sort((a, b) =>
      new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );
  })();

  const navItems = [
    { id: 'all', label: 'All Documents', icon: <FileText className="w-5 h-5" /> },
    { id: 'recent', label: 'Recent', icon: <Clock className="w-5 h-5" /> },
    { id: 'starred', label: 'Starred', icon: <Star className="w-5 h-5" /> },
  ] as const;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full animate-spin border-2 border-zinc-700 border-t-violet-500" />
        <span className="text-sm text-zinc-500">Loading your workspaceâ€¦</span>
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-30 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* â”€â”€ LEFT SIDEBAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-64 md:w-16 flex flex-col py-5 shrink-0
          border-r border-zinc-800 bg-zinc-900
          transform transition-transform duration-300 md:transform-none
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Mobile: user header */}
        <div className="md:hidden px-4 pb-4 border-b border-zinc-800 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 bg-linear-to-br from-violet-500 to-indigo-600">
              {user.name ? initials(user.name) : user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-zinc-100">{user.name || user.email?.split('@')[0]}</p>
              <p className="text-xs truncate text-zinc-500">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Desktop: logo */}
        <div className="hidden md:flex w-9 h-9 rounded-xl items-center justify-center mb-5 mx-auto bg-linear-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30">
          <FileText className="w-5 h-5 text-white" />
        </div>

        {/* Nav items */}
        <div className="flex flex-col md:items-center gap-1 flex-1 px-3 md:px-0">
          {navItems.map(item => {
            const active = navActive === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setNavActive(item.id); setMobileMenuOpen(false); }}
                title={item.label}
                className={`
                  w-full md:w-10 h-11 md:h-10 rounded-xl flex items-center gap-3 md:justify-center
                  transition-all duration-200 group relative px-3 md:px-0
                  ${active ? 'bg-violet-500/20 text-violet-400 md:bg-violet-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}
                `}
              >
                <span className="w-5 h-5 shrink-0">{item.icon}</span>
                <span className="md:hidden text-sm font-medium">{item.label}</span>
                {/* Desktop tooltip */}
                <span className="hidden md:block absolute left-full ml-3 px-2.5 py-1 text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 bg-zinc-800 border border-zinc-700 text-zinc-100 shadow-xl">
                  {item.label}
                </span>
                {active && <span className="hidden md:block absolute left-0 w-0.5 h-5 rounded-full bg-violet-400" />}
              </button>
            );
          })}
        </div>

        {/* Bottom: logout + avatar */}
        <div className="hidden md:flex flex-col items-center gap-2 mt-auto">
          <button
            onClick={async () => { await contextLogout(); navigate('/login'); }}
            title="Logout"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-all group relative"
          >
            <LogOut className="w-5 h-5" />
            <span className="absolute left-full ml-3 px-2.5 py-1 text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap bg-zinc-800 border border-zinc-700 text-zinc-100 shadow-xl z-50">Logout</span>
          </button>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold bg-linear-to-br from-violet-500 to-indigo-600 shadow-lg mt-1 select-none">
            {user.name ? initials(user.name) : user.email?.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Mobile: logout */}
        <div className="md:hidden px-4 pt-4 border-t border-zinc-800">
          <button
            onClick={async () => { await contextLogout(); navigate('/login'); setMobileMenuOpen(false); }}
            className="w-full h-11 rounded-xl flex items-center gap-3 px-3 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* â”€â”€ MAIN CONTENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden h-16 shrink-0 flex items-center justify-between px-4 border-b border-zinc-800 bg-zinc-900">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-zinc-800 transition-colors"
          >
            {mobileMenuOpen
              ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            }
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-linear-to-br from-violet-500 to-indigo-600">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-zinc-100">CollabDocs</span>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold bg-linear-to-br from-violet-500 to-indigo-600">
            {user.name ? initials(user.name) : user.email?.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Desktop top bar */}
        <header className="hidden md:flex h-14 shrink-0 items-center justify-between px-6 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-100">
              {navActive === 'all' ? 'All Documents' : navActive === 'recent' ? 'Recent' : 'Starred'}
            </span>
            <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
              {displayedDocs.length}
            </span>
          </div>
          <div className="text-xs text-zinc-600">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 space-y-5">
          {/* Header row */}
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-zinc-100">
                {navActive === 'all' ? 'Your documents' : navActive === 'recent' ? 'Recent' : 'Starred'}
              </h1>
              <p className="text-sm text-zinc-500 mt-0.5">
                {loadingDocs ? 'Loadingâ€¦' : `${displayedDocs.length} document${displayedDocs.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            {/* Create button */}
            <div className="relative">
              {showCreateInput ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <input
                    autoFocus
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setShowCreateInput(false); setNewTitle(''); } }}
                    placeholder="Document nameâ€¦"
                    className="h-9 px-3 rounded-xl text-sm bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 w-44 md:w-60"
                  />
                  <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="h-9 px-4 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
                  >
                    {creating ? 'â€¦' : 'Create'}
                  </button>
                  <button onClick={() => { setShowCreateInput(false); setNewTitle(''); }} className="h-9 px-3 rounded-xl text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors">
                    Cancel
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setShowCreateInput(true)}
                  className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors shadow-lg shadow-violet-500/20"
                >
                  <Plus className="w-4 h-4" />
                  New Document
                </motion.button>
              )}
            </div>
          </div>

          {/* Documents grid */}
          {loadingDocs ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-44 rounded-2xl bg-zinc-900 animate-pulse border border-zinc-800" />
              ))}
            </div>
          ) : displayedDocs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 gap-4"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-zinc-900 border border-zinc-800">
                {navActive === 'starred' ? <Star className="w-7 h-7 text-zinc-600" /> : navActive === 'recent' ? <Clock className="w-7 h-7 text-zinc-600" /> : <FileText className="w-7 h-7 text-zinc-600" />}
              </div>
              <p className="text-zinc-500 text-sm">
                {navActive === 'starred' ? 'No starred documents yet' : navActive === 'recent' ? 'No recent documents' : 'No documents yet'}
              </p>
              {navActive === 'all' && (
                <button
                  onClick={() => setShowCreateInput(true)}
                  className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create your first document
                </button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence>
                {displayedDocs.map((doc, i) => {
                  const gradient = getDocGradient(doc.id);
                  const isStarred = starredIds.includes(doc.id);
                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="relative group flex flex-col rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-all duration-200 cursor-pointer"
                      onClick={() => editingId !== doc.id && handleOpenDocument(doc)}
                    >
                      {/* Colour thumbnail */}
                      <div className={`h-28 bg-linear-to-br ${gradient} relative flex items-center justify-center shrink-0`}>
                        <span className="text-4xl font-black text-white/20 select-none">{doc.title.slice(0, 2).toUpperCase()}</span>
                        {/* Star */}
                        <button
                          onClick={e => toggleStar(doc.id, e)}
                          className={`absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isStarred ? 'bg-yellow-400/20 text-yellow-400' : 'opacity-0 group-hover:opacity-100 bg-black/30 text-white/70 hover:text-yellow-400'}`}
                        >
                          <Star className={`w-4 h-4 ${isStarred ? 'fill-yellow-400' : ''}`} />
                        </button>
                        {/* Permission badge */}
                        {doc.permission && doc.permission !== 'owner' && (
                          <span className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-black/40 text-white/80 backdrop-blur-sm">
                            {doc.permission}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 p-3 flex flex-col gap-1">
                        {editingId === doc.id ? (
                          <input
                            autoFocus
                            value={editingTitle}
                            onClick={e => e.stopPropagation()}
                            onChange={e => setEditingTitle(e.target.value)}
                            onBlur={() => handleSaveTitle(doc)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(doc); if (e.key === 'Escape') setEditingId(null); }}
                            className="text-sm font-semibold bg-zinc-800 border border-violet-500 rounded-lg px-2 py-1 text-zinc-100 focus:outline-none w-full"
                          />
                        ) : (
                          <p className="text-sm font-semibold text-zinc-100 truncate">{doc.title}</p>
                        )}
                        <div className="flex items-center justify-between mt-auto pt-1">
                          <span className="text-xs text-zinc-600">{formatDate(doc.updatedAt || doc.createdAt)}</span>
                          {doc.memberCount !== undefined && doc.memberCount > 0 && (
                            <div className="flex items-center gap-1 text-xs text-zinc-600">
                              <Users className="w-3 h-3" />
                              {doc.memberCount}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Context menu trigger */}
                      <button
                        onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === doc.id ? null : doc.id); }}
                        className="absolute top-2 left-2 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 text-white/70 hover:text-white transition-all"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown */}
                      <AnimatePresence>
                        {openMenuId === doc.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            className="absolute top-9 left-2 z-20 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden min-w-35"
                          >
                            <button
                              onClick={() => { setEditingId(doc.id); setEditingTitle(doc.title); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                            >
                              <PenLine className="w-4 h-4" /> Rename
                            </button>
                            {doc.permission === 'owner' && (
                              <button
                                onClick={() => handleDelete(doc)}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Close dropdown on outside click */}
      {openMenuId && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
      )}
    </div>
  );
}
