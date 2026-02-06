export interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
  avatar?: string;
  emailVerified?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface AuthResponse extends AuthTokens {
  user: User;
  isNewUser?: boolean;
}

export interface SignupRequest {
  email: string;
  password: string;
  username?: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface OAuthCallbackRequest {
  code: string;
  state: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
