import type {
  AuthResponse,
  AuthTokens,
  LoginRequest,
  SignupRequest,
  OAuthCallbackRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  User,
} from "./types";

const TOKEN_STORAGE_KEY = "auth_tokens";
const USER_STORAGE_KEY = "auth_user";
const CSRF_TOKEN_KEY = "csrf_token";

export class AuthService {
  private apiUrl: string;
  private refreshTokenTimeout: NodeJS.Timeout | null = null;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  // Storage helpers
  private getTokens(): AuthTokens | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  private setTokens(tokens: AuthTokens): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    this.scheduleTokenRefresh(tokens.expiresIn);
  }

  private clearTokens(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = null;
    }
  }

  private setUser(user: User): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  getUser(): User | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  getAccessToken(): string | null {
    const tokens = this.getTokens();
    return tokens?.accessToken || null;
  }

  private async getCSRFToken(): Promise<string> {
    // Check if we have a cached CSRF token
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(CSRF_TOKEN_KEY);
      if (cached) return cached;
    }

    // Fetch a new CSRF token
    const response = await fetch(`${this.apiUrl}/api/auth/csrf-token`);
    if (!response.ok) {
      throw new Error("Failed to get CSRF token");
    }

    const data = await response.json();
    if (typeof window !== "undefined") {
      sessionStorage.setItem(CSRF_TOKEN_KEY, data.csrfToken);
    }
    return data.csrfToken;
  }

  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    // Add access token if available
    const accessToken = this.getAccessToken();
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    // Add CSRF token for state-changing requests
    if (
      options.method &&
      ["POST", "PUT", "DELETE", "PATCH"].includes(options.method)
    ) {
      const csrfToken = await this.getCSRFToken();
      headers["X-CSRF-Token"] = csrfToken;
    }

    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: "Request failed",
      }));
      throw new Error(error.error || "Request failed");
    }

    return response.json();
  }

  // Schedule automatic token refresh
  private scheduleTokenRefresh(expiresIn: number): void {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }

    // Refresh token 1 minute before it expires
    const refreshTime = (expiresIn - 60) * 1000;
    if (refreshTime > 0) {
      this.refreshTokenTimeout = setTimeout(() => {
        this.refreshToken().catch((err) => {
          console.error("Failed to refresh token:", err);
          this.clearTokens();
        });
      }, refreshTime);
    }
  }

  // Authentication methods
  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await this.apiRequest<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });

    this.setTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresIn: response.expiresIn,
    });
    this.setUser(response.user);

    return response;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.apiRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });

    this.setTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresIn: response.expiresIn,
    });
    this.setUser(response.user);

    return response;
  }

  async logout(): Promise<void> {
    const tokens = this.getTokens();
    if (tokens) {
      try {
        await this.apiRequest("/api/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    this.clearTokens();
  }

  async logoutAll(): Promise<void> {
    try {
      await this.apiRequest("/api/auth/logout-all", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout all error:", error);
    }
    this.clearTokens();
  }

  async refreshToken(): Promise<RefreshTokenResponse> {
    const tokens = this.getTokens();
    if (!tokens) {
      throw new Error("No refresh token available");
    }

    const response = await this.apiRequest<RefreshTokenResponse>(
      "/api/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      }
    );

    this.setTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresIn: response.expiresIn,
    });

    return response;
  }

  async getCurrentUser(): Promise<User> {
    const user = await this.apiRequest<User>("/api/auth/me");
    this.setUser(user);
    return user;
  }

  // OAuth methods
  async getGoogleAuthUrl(): Promise<{ url: string; state: string }> {
    return this.apiRequest<{ url: string; state: string }>(
      "/api/auth/google"
    );
  }

  async handleGoogleCallback(
    data: OAuthCallbackRequest
  ): Promise<AuthResponse> {
    const response = await this.apiRequest<AuthResponse>(
      "/api/auth/google/callback",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

    this.setTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresIn: response.expiresIn,
    });
    this.setUser(response.user);

    return response;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  // Initialize auth service (call on app startup)
  initialize(): void {
    const tokens = this.getTokens();
    if (tokens && tokens.expiresIn) {
      // Schedule token refresh, but don't refresh immediately
      // Only refresh when the token is about to expire
      this.scheduleTokenRefresh(tokens.expiresIn);
    }
  }
}

// Create a singleton instance
let authServiceInstance: AuthService | null = null;

export function getAuthService(apiUrl?: string): AuthService {
  if (!authServiceInstance && apiUrl) {
    authServiceInstance = new AuthService(apiUrl);
  }
  if (!authServiceInstance) {
    throw new Error("AuthService not initialized. Provide apiUrl first.");
  }
  return authServiceInstance;
}

export function initializeAuth(apiUrl: string): AuthService {
  authServiceInstance = new AuthService(apiUrl);
  authServiceInstance.initialize();
  return authServiceInstance;
}
