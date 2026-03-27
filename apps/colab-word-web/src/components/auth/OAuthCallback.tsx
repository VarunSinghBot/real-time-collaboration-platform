import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const processingRef = useRef(false); // Prevent duplicate OAuth code exchange

  useEffect(() => {
    // Prevent duplicate processing (React StrictMode calls useEffect twice)
    if (processingRef.current) return;
    processingRef.current = true;

    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (!code) {
        setError('No authorization code received.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      try {
        const redirectUri = `${window.location.origin}/auth/callback`;
        await authService.handleGoogleCallback({
          code,
          state: searchParams.get('state') || '',
          redirectUri,
        });
        navigate('/dashboard');
      } catch (err: any) {
        setError(err.message || 'Authentication failed');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-red-600 text-lg mb-2">{error}</div>
            <p className="text-gray-600">Redirecting to login...</p>
          </>
        ) : (
          <>
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-700 text-lg">Completing sign in...</p>
          </>
        )}
      </div>
    </div>
  );
}
