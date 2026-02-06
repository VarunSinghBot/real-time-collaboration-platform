"use client";

import { createContext, useContext } from "react";
import { initializeAuth } from "@repo/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Initialize auth service
export const authService = initializeAuth(API_URL);

const AuthServiceContext = createContext(authService);

export function AuthServiceProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthServiceContext.Provider value={authService}>
      {children}
    </AuthServiceContext.Provider>
  );
}

export function useAuthService() {
  return useContext(AuthServiceContext);
}
