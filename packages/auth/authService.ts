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
  // Deduplicate concurrent refresh calls: if one is already in flight every
  // caller awaits the same promise instead of spawning parallel requests.
  private refreshTokenPromise: Promise<RefreshTokenResponse> | null = null;
  // Cooldown: after a failed refresh we record the timestamp and skip all
  // refresh attempts for REFRESH_COOLDOWN_MS to avoid hammering a
  // rate-limited endpoint.
  private refreshFailedAt: number | null = null;
  private static readonly REFRESH_COOLDOWN_MS = 30_000;

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
    // Store the issue timestamp so we can compute remaining time on page reload
    const payload = { ...tokens, issuedAt: Date.now() };
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(payload));
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
    // Notify any AuthProvider instances in this tab so they can react
    // immediately (the native 'storage' event only fires in OTHER tabs).
    window.dispatchEvent(new CustomEvent("auth:session-cleared"));
  }

  // Wipe the local session without calling the /logout API endpoint.
  // Use this when the session is known to be broken (e.g. persistent 401)
  // so the caller doesn't need to make another failing API call.
  clearSession(): void {
    this.clearTokens();
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
      const err = new Error(error.error || "Request failed") as Error & { status: number };
      err.status = response.status;
      throw err;
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
        this.refreshToken().catch((err: unknown) => {
          console.error("Failed to refresh token:", err);
          // Only wipe the session on a definitive 401 (invalid/revoked refresh
          // token).  A 429 (rate-limit) or network error must NOT clear valid
          // tokens — the cooldown in refreshToken() will gate retries.
          const status = (err as { status?: number })?.status;
          if (status === 401) this.clearTokens();
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
    // Respect the cooldown window after a failed refresh so we never spam
    // the backend's rate-limited /refresh endpoint.
    if (
      this.refreshFailedAt !== null &&
      Date.now() - this.refreshFailedAt < AuthService.REFRESH_COOLDOWN_MS
    ) {
      throw Object.assign(new Error("Refresh cooldown active"), { status: 429 });
    }

    // Return the in-flight promise if a refresh is already happening so we
    // never send parallel refresh requests (which hit rate limits fast).
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }
    this.refreshTokenPromise = this._performRefresh()
      .then((res) => {
        // Successful refresh — clear the failure timestamp.
        this.refreshFailedAt = null;
        return res;
      })
      .catch((err: unknown) => {
        // Record failure time so the cooldown kicks in for the next caller.
        this.refreshFailedAt = Date.now();
        throw err;
      })
      .finally(() => {
        this.refreshTokenPromise = null;
      });
    return this.refreshTokenPromise;
  }

  private async _performRefresh(): Promise<RefreshTokenResponse> {
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

  // Store tokens received from an OAuth callback (ensures issuedAt is recorded
  // and the auto-refresh timer is started, just like a normal login).
  storeOAuthSession(tokens: AuthTokens): void {
    this.setTokens(tokens);
  }

  // Returns true if the stored access token is expired or expiring within
  // the next 30 seconds AND we are not currently in a refresh cooldown.
  // Used by apiFetch to proactively refresh before making a request.
  isAccessTokenExpired(): boolean {
    if (typeof window === "undefined") return false;
    // Don't proactively refresh while we're in the cooldown window — the
    // backend is rate-limiting us and we must wait it out.
    if (
      this.refreshFailedAt !== null &&
      Date.now() - this.refreshFailedAt < AuthService.REFRESH_COOLDOWN_MS
    ) {
      return false;
    }
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) return true;
    try {
      const tokens = JSON.parse(stored) as AuthTokens & { issuedAt?: number };
      if (!tokens.accessToken) return true;
      if (!tokens.issuedAt || !tokens.expiresIn) return false;
      const expiresAtMs = tokens.issuedAt + tokens.expiresIn * 1000;
      return Date.now() >= expiresAtMs - 30_000; // treat as expired 30s early
    } catch { return true; }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  // Initialize auth service (call on app startup)
  initialize(): void {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    if (!stored) return;
    try {
      const tokens = JSON.parse(stored) as AuthTokens & { issuedAt?: number };
      if (!tokens.expiresIn) return;

      // Compute how many seconds are actually remaining
      const issuedAt = tokens.issuedAt ?? Date.now();
      const expiresAtMs = issuedAt + tokens.expiresIn * 1000;
      const remainingSeconds = (expiresAtMs - Date.now()) / 1000;

      if (remainingSeconds <= 0) {
        // Already expired — attempt a proactive refresh.
        // Only wipe the session on a definitive 401 (invalid/expired refresh
        // token).  A 429 (rate-limit) or network error must NOT clear valid
        // tokens; the cooldown in refreshToken() will gate retries.
        this.refreshToken().catch((err: unknown) => {
          const status = (err as { status?: number })?.status;
          if (status === 401) this.clearTokens();
          // For 429 / network errors: leave tokens intact and let normal
          // apiFetch calls retry after the cooldown window expires.
        });
      } else {
        this.scheduleTokenRefresh(remainingSeconds);
      }
    } catch { /* ignore */ }
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
