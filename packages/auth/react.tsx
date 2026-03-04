"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthService } from "./authService";
import type { User, LoginRequest, SignupRequest } from "./types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  authService: AuthService;
}

export function AuthProvider({ children, authService }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // React to same-tab token clearing (e.g. background refresh failure,
  // or apiFetch calling clearSession() after a persistent 401).
  // The native 'storage' event only fires in OTHER tabs, so authService
  // dispatches 'auth:session-cleared' explicitly in clearTokens().
  useEffect(() => {
    const handleCleared = () => setUser(null);
    if (typeof window !== "undefined") {
      window.addEventListener("auth:session-cleared", handleCleared);
      return () => window.removeEventListener("auth:session-cleared", handleCleared);
    }
  }, []);

  // React to cross-tab/cross-window logout by listening to localStorage changes
  // This enables logging out from one app (dashboard/whiteboard) to log out from all
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      // Check if auth_tokens was removed or cleared
      if (e.key === "auth_tokens" && e.newValue === null) {
        // Tokens were cleared in another tab/window - clear local session
        setUser(null);
        // Clear any scheduled refresh timers without calling the API
        authService.clearSession();
      }
      // Also check if the user was removed
      else if (e.key === "auth_user" && e.newValue === null) {
        setUser(null);
      }
      // If both keys were cleared (e.g., localStorage.clear())
      else if (e.key === null) {
        setUser(null);
        authService.clearSession();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [authService]);

  // Poll localStorage for cross-origin logout detection
  // Storage events don't fire across different origins (e.g., localhost:3000 vs localhost:5173)
  // so we poll every 2 seconds to check if tokens were cleared in the other app
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const checkAuthState = () => {
      // If we think we're authenticated but tokens are gone, log out
      if (user !== null && !authService.isAuthenticated()) {
        setUser(null);
      }
    };

    // Check every 2 seconds
    const interval = setInterval(checkAuthState, 2000);
    return () => clearInterval(interval);
  }, [user, authService]);

  useEffect(() => {
    // Initialize auth on mount
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Prefer the locally-cached user so we restore the session
          // immediately without an extra API round-trip.  This prevents a
          // transient /me failure (e.g. right after an OAuth redirect) from
          // calling logout() and wiping a perfectly valid session.
          const cachedUser = authService.getUser();
          if (cachedUser) {
            setUser(cachedUser);
          } else {
            // No cache – must fetch from the server.
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
          }
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        // Do NOT call authService.logout() here.  A network error or a
        // momentarily-unavailable backend must not wipe a perfectly valid
        // session.  If the access token is genuinely expired the next API
        // call will receive a 401 and the caller is responsible for logging
        // the user out at that point.
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [authService]);

  const login = async (data: LoginRequest) => {
    const response = await authService.login(data);
    setUser(response.user);
  };

  const signup = async (data: SignupRequest) => {
    const response = await authService.signup(data);
    setUser(response.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const logoutAll = async () => {
    await authService.logoutAll();
    setUser(null);
  };

  const loginWithGoogle = async () => {
    const { url } = await authService.getGoogleAuthUrl();
    window.location.href = url;
  };

  const refreshUser = async () => {
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
  };

  const value: AuthContextType = {
    user,
    loading,
    // Derive isAuthenticated from React state so changes are reactive:
    //   user !== null          → we have a loaded profile → definitely authed ✓
    //   authService.isAuth()   → tokens still in localStorage (e.g. initAuth
    //                            hasn't finished yet, or cached without profile) ✓
    // When clearTokens() fires 'auth:session-cleared' → setUser(null) above runs
    // → user becomes null → authService.isAuthenticated() returns false (tokens
    // gone) → isAuthenticated = false → auth guard redirects via router.push ✓
    isAuthenticated: user !== null || authService.isAuthenticated(),
    login,
    signup,
    logout,
    logoutAll,
    loginWithGoogle,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
