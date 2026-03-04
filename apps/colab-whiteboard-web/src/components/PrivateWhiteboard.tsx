"use client";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@repo/auth";
import { Tldraw, Editor } from "tldraw";
import type { TLRecord } from "tldraw";
import "tldraw/tldraw.css";
import WhiteboardTemplates from "./WhiteboardTemplates";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function PrivateWhiteboard() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const editorRef = useRef<Editor | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  // Load whiteboard data from backend
  useEffect(() => {
    const loadWhiteboard = async () => {
      if (!isAuthenticated || !editorRef.current || isLoaded) return;

      try {
        const authTokens = localStorage.getItem('auth_tokens');
        if (!authTokens) {
          navigate("/login");
          return;
        }

        const { accessToken } = JSON.parse(authTokens);
        const response = await fetch(`${API_URL}/api/whiteboard/private`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data !== '{}') {
            try {
              const snapshot = JSON.parse(data.data);
              // Use Tldraw's store methods to load the snapshot
              const records: TLRecord[] = Object.values(snapshot.store);
              editorRef.current.store.put(records);
              console.log("Whiteboard loaded from server");
              setIsLoaded(true);
            } catch (err) {
              console.error("Failed to parse whiteboard data:", err);
            }
          } else {
            setIsLoaded(true);
          }
        } else if (response.status === 401) {
          console.error("Unauthorized - please log in again");
          navigate("/login");
        } else {
          setIsLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load whiteboard:", error);
        setLoadError("Failed to load whiteboard from server");
        setIsLoaded(true);
      }
    };

    if (editorRef.current && !isLoaded) {
      // Small delay to ensure editor is fully initialized
      setTimeout(loadWhiteboard, 100);
    }
  }, [isAuthenticated, navigate, isLoaded]);

  // Auto-save to backend
  useEffect(() => {
    if (!isAuthenticated || !isLoaded) return;

    const saveInterval = setInterval(async () => {
      if (editorRef.current) {
        await saveWhiteboard();
      }
    }, 10000); // Auto-save every 10 seconds

    return () => clearInterval(saveInterval);
  }, [isAuthenticated, isLoaded]);

  const saveWhiteboard = async () => {
    if (!editorRef.current) return;

    setIsSaving(true);
    try {
      const authTokens = localStorage.getItem('auth_tokens');
      if (!authTokens) {
        navigate("/login");
        return;
      }

      const { accessToken } = JSON.parse(authTokens);
      
      // Get all records from the store
      const records = editorRef.current.store.allRecords();
      const snapshot = {
        store: records.reduce((acc: Record<string, TLRecord>, record: TLRecord) => {
          acc[record.id] = record;
          return acc;
        }, {}),
      };

      const response = await fetch(`${API_URL}/api/whiteboard/private`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: 'Private Board',
          data: JSON.stringify(snapshot),
        }),
      });

      if (response.ok) {
        setLastSaved(new Date());
        console.log("Whiteboard saved to server");
      } else if (response.status === 401) {
        console.error("Unauthorized - please log in again");
        navigate("/login");
      } else {
        console.error("Failed to save whiteboard");
      }
    } catch (error) {
      console.error("Failed to save whiteboard:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMount = (editor: Editor) => {
    editorRef.current = editor;
  };

  const handleClearBoard = async () => {
    if (window.confirm("Clear whiteboard? This will delete all your work from the server.")) {
      try {
        const authTokens = localStorage.getItem('auth_tokens');
        if (!authTokens) {
          navigate("/login");
          return;
        }

        const { accessToken } = JSON.parse(authTokens);
        const response = await fetch(`${API_URL}/api/whiteboard/private`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          if (editorRef.current) {
            editorRef.current.selectAll();
            editorRef.current.deleteShapes(editorRef.current.getSelectedShapeIds());
          }
          setLastSaved(new Date());
        } else {
          alert("Failed to clear whiteboard from server");
        }
      } catch (error) {
        console.error("Failed to delete whiteboard:", error);
        alert("Failed to clear whiteboard from server");
      }
    }
  };

  const handleSaveNow = async () => {
    await saveWhiteboard();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-linear-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-medium">Loading your private board...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Modern Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 z-50">
        <div className="px-6 py-3 flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-linear-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">My Private Whiteboard</h1>
              <p className="text-xs text-gray-600">Personal workspace with auto-sync</p>
            </div>
          </div>

          {/* Actions and User Menu */}
          <div className="flex items-center gap-3">
            {loadError && (
              <span className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-lg border border-red-200">
                {loadError}
              </span>
            )}
            {lastSaved && (
              <span className="text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => navigate("/whiteboard")}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              Collaborative Board
            </button>
            <button
              onClick={handleSaveNow}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded-lg transition-all shadow-sm"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </span>
              ) : (
                'Save Now'
              )}
            </button>
            <button
              onClick={handleClearBoard}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-sm"
            >
              Clear Board
            </button>
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
              <div className="w-9 h-9 rounded-full bg-linear-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : user?.email?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-800">{user?.email}</span>
              <button
                onClick={logout}
                className="ml-2 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Whiteboard */}
      <div className="flex-1 bg-white relative">
        <Tldraw onMount={handleMount} />
        
        {/* Auto-save indicator */}
        <div className="absolute bottom-6 right-6 z-50">
          <div className={`${isSaving ? 'bg-yellow-500' : 'bg-green-500'} text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2`}>
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving to cloud...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Auto-save enabled
              </>
            )}
          </div>
        </div>

        {/* Templates Panel */}
        <WhiteboardTemplates editor={editorRef.current} />
      </div>
    </div>
  );
}


