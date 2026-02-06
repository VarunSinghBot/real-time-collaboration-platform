"use client";

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@repo/auth";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

export default function Whiteboard() {
  const [tokensProcessed, setTokensProcessed] = useState(false);
  const { user, logout, isAuthenticated, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle authentication from URL params (cross-origin token sharing)
  useEffect(() => {
    const handleTokensFromUrl = async () => {
      const accessToken = searchParams.get("accessToken");
      const refreshToken = searchParams.get("refreshToken");
      const expiresIn = searchParams.get("expiresIn");

      if (accessToken && refreshToken && expiresIn) {
        console.log("Received tokens from URL, storing...");
        
        // Store tokens from URL params
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_tokens", JSON.stringify({
            accessToken,
            refreshToken,
            expiresIn: parseInt(expiresIn, 10)
          }));
          
          // Fetch and store user info
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/auth/me`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });
            
            if (response.ok) {
              const user = await response.json();
              localStorage.setItem("auth_user", JSON.stringify(user));
              console.log("User info stored:", user);
            }
          } catch (err) {
            console.error("Failed to fetch user info:", err);
          }
          
          // Remove tokens from URL for security
          setSearchParams({}, { replace: true });
          
          // Refresh the user in the auth context
          try {
            await refreshUser();
            console.log("Auth context refreshed");
          } catch (err) {
            console.error("Failed to refresh user context:", err);
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
    if (tokensProcessed && !loading && !isAuthenticated) {
      console.log("Not authenticated, redirecting to login");
      navigate("/login");
    }
  }, [tokensProcessed, loading, isAuthenticated, navigate]);

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
    <div className="h-screen w-screen flex overflow-hidden relative">
      {/* User info overlay - top right */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-gray-200">
        <div 
          className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-sm shadow-md"
          title={user?.name || user?.email || "User"}
        >
          {user?.name ? getInitials(user.name) : user?.email?.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-800">{user?.name?.split(" ")[0] || "User"}</span>
          <span className="text-xs text-gray-600">Collaborative Whiteboard</span>
        </div>
        <button
          onClick={handleLogout}
          className="ml-2 p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
          title="Logout"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      {/* Tldraw Whiteboard - Full Screen */}
      <div className="flex-1">
        <Tldraw
          // Future collaboration setup:
          // 1. Install: pnpm add @tldraw/sync yjs y-websocket
          // 2. Create a WebSocket server for real-time sync
          // 3. Add store prop with Yjs provider for multiplayer
          // Example: store={createTLStore({ shapeUtils: defaultShapeUtils })}
          // Then connect to your WebSocket backend for real-time collaboration
        />
      </div>
    </div>
  );
}
