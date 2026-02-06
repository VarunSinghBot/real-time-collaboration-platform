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

  useEffect(() => {
    // Initialize auth on mount
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        authService.logout();
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
    isAuthenticated: user !== null,
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
