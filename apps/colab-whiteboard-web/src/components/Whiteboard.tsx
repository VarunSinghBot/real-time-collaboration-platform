"use client";

import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@repo/auth";
import { Tldraw, Editor } from "tldraw";
import "tldraw/tldraw.css";
import WhiteboardTemplates from "./WhiteboardTemplates";

export default function Whiteboard() {
  const [tokensProcessed, setTokensProcessed] = useState(false);
  const { user, logout, isAuthenticated, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editorRef = useRef<Editor | null>(null);

  // Handle authentication from URL params (cross-origin token sharing)
  useEffect(() => {
    const handleTokensFromUrl = async () => {
      const accessToken = searchParams.get("accessToken");
      const refreshToken = searchParams.get("refreshToken");
      const expiresIn = searchParams.get("expiresIn");

      if (accessToken && refreshToken && expiresIn) {
        console.log("🔐 [Whiteboard] Received tokens from URL");
        console.log("🔍 [Whiteboard] Token details:", {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          expiresIn,
          accessTokenPrefix: accessToken.substring(0, 20) + "..."
        });
        
        // Store tokens from URL params with issuedAt timestamp
        if (typeof window !== "undefined") {
          const tokens = {
            accessToken,
            refreshToken,
            expiresIn: parseInt(expiresIn, 10),
            issuedAt: Date.now() // Critical: needed for token refresh scheduling
          };
          console.log("💾 [Whiteboard] Storing tokens with issuedAt:", new Date(tokens.issuedAt).toISOString());
          localStorage.setItem("auth_tokens", JSON.stringify(tokens));
          console.log("✅ [Whiteboard] Tokens stored in localStorage");
          
          // Reinitialize auth service to schedule token refresh
          console.log("🔄 [Whiteboard] Initializing auth service...");
          const { authService } = await import("../lib/auth");
          authService.initialize();
          console.log("✅ [Whiteboard] Auth service initialized");
          
          // Fetch and store user info
          try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            console.log("📡 [Whiteboard] Fetching user info from:", `${apiUrl}/api/auth/me`);
            const response = await fetch(`${apiUrl}/api/auth/me`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });
            
            console.log("📡 [Whiteboard] /api/auth/me response status:", response.status);
            
            if (response.ok) {
              const user = await response.json();
              localStorage.setItem("auth_user", JSON.stringify(user));
              console.log("✅ [Whiteboard] User info stored:", user);
            } else {
              const errorText = await response.text();
              console.error("❌ [Whiteboard] Failed to fetch user info:", response.status, errorText);
            }
          } catch (err) {
            console.error("❌ [Whiteboard] Exception fetching user info:", err);
          }
          
          // Remove tokens from URL for security
          setSearchParams({}, { replace: true });
          
          // Refresh the user in the auth context
          try {
            console.log("🔄 [Whiteboard] Refreshing auth context...");
            await refreshUser();
            console.log("✅ [Whiteboard] Auth context refreshed successfully");
          } catch (err) {
            console.error("❌ [Whiteboard] Failed to refresh user context:", err);
          }
        }
      }
      
      setTokensProcessed(true);
    };

    if (!tokensProcessed) {
      handleTokensFromUrl();
    }
  }, [searchParams, tokensProcessed, refreshUser, setSearchParams]);

  // Redirect to login if not authenticated (only after tokens are processed)
  useEffect(() => {
    if (tokensProcessed && !loading) {
      // Check both AuthContext AND localStorage to avoid race condition
      const hasStoredTokens = typeof window !== "undefined" && localStorage.getItem("auth_tokens");
      console.log("🔐 [Whiteboard] Auth check:", {
        tokensProcessed,
        loading,
        isAuthenticated,
        hasStoredTokens: !!hasStoredTokens,
        user: user?.email
      });
      if (!isAuthenticated && !hasStoredTokens) {
        console.log("❌ [Whiteboard] Not authenticated, redirecting to login");
        navigate("/login");
      }
    }
  }, [tokensProcessed, loading, isAuthenticated, navigate, user]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleMount = (editor: Editor) => {
    editorRef.current = editor;
  };

  // Show loading state while processing tokens or checking authentication
  if (!tokensProcessed || loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-medium">Loading whiteboard...</p>
        </div>
      </div>
    );
  }

  // Don't render if no user (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Modern Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 z-50">
        <div className="px-6 py-3 flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-linear-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Collaborative Whiteboard</h1>
              <p className="text-xs text-gray-600">Work together in real-time</p>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/private-board")}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              My Private Board
            </button>
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
              <div 
                className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-sm shadow-sm"
                title={user?.name || user?.email || "User"}
              >
                {user?.name ? getInitials(user.name) : user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-800">
                  {user?.name || user?.email?.split('@')[0] || "User"}
                </span>
                <span className="text-xs text-gray-600">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
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

      {/* Tldraw Whiteboard - Full Screen */}
      <div className="flex-1 bg-white relative">
        <Tldraw
          onMount={handleMount}
          // Future collaboration setup:
          // 1. Install: pnpm add @tldraw/sync yjs y-websocket
          // 2. Create a WebSocket server for real-time sync
          // 3. Add store prop with Yjs provider for multiplayer
          // Example: store={createTLStore({ shapeUtils: defaultShapeUtils })}
          // Then connect to your WebSocket backend for real-time collaboration
        />
        {/* Templates Panel */}
        <WhiteboardTemplates editor={editorRef.current} />
      </div>
    </div>
  );
}
