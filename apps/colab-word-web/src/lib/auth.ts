import { initializeAuth } from "@repo/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Initialize the shared auth service.
// Using the same "auth_tokens" localStorage key as the web dashboard so that
// a session started there is recognised here automatically.
export const authService = initializeAuth(API_URL);
