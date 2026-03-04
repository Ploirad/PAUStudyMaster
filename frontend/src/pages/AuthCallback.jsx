import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get('session_id');

        if (!sessionId) {
          navigate('/login');
          return;
        }

        // Exchange session_id for user data
        const response = await fetch(`${BACKEND_URL}/api/auth/session`, {
          headers: {
            'X-Session-ID': sessionId
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Auth failed');
        }

        const data = await response.json();

        // Set cookie manually with better compatibility
        document.cookie = `session_token=${data.session_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

        // Navigate to dashboard with user data
        navigate('/dashboard', { state: { user: data.user }, replace: true });
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/login');
      }
    };

    processAuth();
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-700">Autenticando...</p>
      </div>
    </div>
  );
};

export default AuthCallback;