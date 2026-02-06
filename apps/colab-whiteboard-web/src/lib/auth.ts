import { initializeAuth } from "@repo/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Initialize auth service
export const authService = initializeAuth(API_URL);
