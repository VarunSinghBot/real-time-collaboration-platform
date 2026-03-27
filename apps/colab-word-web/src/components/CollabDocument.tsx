import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '@/lib/auth';
import CollaborativeEditor from './editor/CollaborativeEditor';

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

export default function CollabDocument() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [permission, setPermission] = useState<string>('view');
  const [title, setTitle] = useState('Untitled document');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const tokensProcessed = useRef(false);

  // Cross-origin token handoff: the web dashboard opens this page with tokens
  // in the URL (?accessToken=...&refreshToken=...&expiresIn=...&issuedAt=...)
  // so the user is already "logged in" on the parent tab.  Store them before
  // the auth check runs.
  useEffect(() => {
    if (tokensProcessed.current) return;
    tokensProcessed.current = true;

    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const expiresIn = searchParams.get('expiresIn');
    const issuedAt = searchParams.get('issuedAt');

    if (accessToken && refreshToken && expiresIn) {
      const tokens = {
        accessToken,
        refreshToken,
        expiresIn: parseInt(expiresIn, 10),
        issuedAt: issuedAt ? parseInt(issuedAt, 10) : Date.now(),
      };
      localStorage.setItem('auth_tokens', JSON.stringify(tokens));
      authService.initialize();

      // Clean tokens out of the URL bar so they don't appear in browser history
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Redirect to login if session is cleared while on this page
  useEffect(() => {
    const handleCleared = () => navigate('/login');
    window.addEventListener('auth:session-cleared', handleCleared);
    return () => window.removeEventListener('auth:session-cleared', handleCleared);
  }, [navigate]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    fetchDocumentAccess();
  }, [roomCode, navigate]);

  const fetchDocumentAccess = async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/documents/${roomCode}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to load document' }));
        setError(data.error || 'Failed to load document');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setPermission(data.permission || 'view');
      setTitle(data.title || 'Untitled document');
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load document');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleTitleChange = async (newTitle: string) => {
    if (!newTitle.trim() || newTitle === title) return;
    const res = await apiFetch(`${API_URL}/api/documents/${roomCode}`, {
      method: 'PUT',
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    if (res.ok) setTitle(newTitle.trim());
  };

  return (
    <CollaborativeEditor
      roomId={roomCode!}
      permission={permission}
      title={title}
      onTitleChange={handleTitleChange}
    />
  );
}
