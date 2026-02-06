"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@repo/auth";

export default function Dashboard() {
  const router = useRouter();
  const { user, loading, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleMakeWhiteboard = () => {
    // Get current auth tokens
    const tokensStr = typeof window !== "undefined" ? localStorage.getItem("auth_tokens") : null;
    
    if (tokensStr) {
      try {
        const tokens = JSON.parse(tokensStr);
        const whiteboardUrl = process.env.NEXT_PUBLIC_WHITEBOARD_URL || "http://localhost:5173/whiteboard";
        
        // Pass tokens to whiteboard via URL for seamless auth
        const urlWithTokens = `${whiteboardUrl}?accessToken=${encodeURIComponent(tokens.accessToken)}&refreshToken=${encodeURIComponent(tokens.refreshToken)}&expiresIn=${tokens.expiresIn}`;
        
        window.open(urlWithTokens, "_blank", "noopener,noreferrer");
      } catch (err) {
        console.error("Failed to parse tokens:", err);
        // Fallback to opening without tokens
        const whiteboardUrl = process.env.NEXT_PUBLIC_WHITEBOARD_URL || "http://localhost:5173/whiteboard";
        window.open(whiteboardUrl, "_blank", "noopener,noreferrer");
      }
    } else {
      // No tokens found, open whiteboard anyway (will redirect to login)
      const whiteboardUrl = process.env.NEXT_PUBLIC_WHITEBOARD_URL || "http://localhost:5173/whiteboard";
      window.open(whiteboardUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleSeeAllWhiteboards = () => {
    // TODO: Navigate to whiteboards list
    console.log("See all whiteboards clicked");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-linear-to-br from-purple-50 to-purple-100">
        <div className="relative">
          {/* Spinning circle */}
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          {/* Inner circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-linear-to-br from-purple-500 to-purple-700 rounded-full opacity-20"></div>
        </div>
        <p className="mt-6 text-lg text-purple-700 font-semibold">Loading your dashboard...</p>
        <p className="mt-2 text-sm text-purple-600">Please wait</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 to-purple-100">
      {/* Top Navbar */}
      <nav className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - User Info */}
            <div className="flex items-center space-x-4">
              {/* User Avatar */}
              <div className="w-12 h-12 rounded-full bg-linear-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold shadow-lg text-lg">
                {user.name ? getInitials(user.name) : user.email?.charAt(0).toUpperCase()}
              </div>
              
              {/* User Name */}
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900">
                  {user.name || user.email}
                </span>
                <span className="text-xs text-purple-600 font-medium">
                  Welcome back
                </span>
              </div>
            </div>

            {/* Right side - Logout */}
            <button
              onClick={handleLogout}
              className="px-5 py-2 text-sm cursor-pointer font-semibold text-purple-600 hover:text-white hover:bg-purple-600 border-2 border-purple-600 rounded-lg transition-all duration-300"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center justify-center space-y-12">
          {/* Welcome Section */}
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-3">
              Your Dashboard
            </h1>
            <p className="text-xl text-gray-700">
              Start collaborating on whiteboards
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-3xl">
            {/* Make a Whiteboard Button */}
            <button
              onClick={handleMakeWhiteboard}
              className="flex-1 group cursor-pointer bg-white hover:bg-linear-to-r hover:from-purple-600 hover:to-purple-700 text-gray-800 hover:text-white px-10 py-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-purple-200 hover:border-transparent"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-purple-100 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                  <svg
                    className="w-9 h-9 text-purple-600 group-hover:text-white transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <span className="text-2xl font-bold">Make a Whiteboard</span>
                <span className="text-sm text-gray-600 group-hover:text-purple-100">
                  Create a new collaborative space
                </span>
              </div>
            </button>

            {/* See All Whiteboards Button */}
            <button
              onClick={handleSeeAllWhiteboards}
              className="flex-1 group cursor-pointer bg-white hover:bg-linear-to-r hover:from-purple-600 hover:to-purple-700 text-gray-800 hover:text-white px-10 py-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-purple-200 hover:border-transparent"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-purple-100 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                  <svg
                    className="w-9 h-9 text-purple-600 group-hover:text-white transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </div>
                <span className="text-2xl font-bold">
                  See All Whiteboards
                </span>
                <span className="text-sm text-gray-600 group-hover:text-purple-100">
                  Browse your existing whiteboards
                </span>
              </div>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="w-full max-w-3xl mt-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Quick Stats
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-linear-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
                  <div className="text-4xl font-bold text-purple-600 mb-2">0</div>
                  <div className="text-sm font-semibold text-gray-700">Total Whiteboards</div>
                </div>
                <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                  <div className="text-4xl font-bold text-blue-600 mb-2">0</div>
                  <div className="text-sm font-semibold text-gray-700">Collaborators</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
