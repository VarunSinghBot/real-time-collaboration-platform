# OAuth Implementation Guide - Collab Platform

This document explains the comprehensive OAuth implementation for the Collab Platform, including unified authentication across both the `web` and `colab-whiteboard-web` applications.

## Overview

The platform now supports:
- **Traditional email/password authentication**
- **Google OAuth 2.0**
- **Unified authentication** - same user across both applications
- **Security features** - Rate limiting, CSRF protection, refresh tokens
- **Token management** - Automatic token refresh, secure storage

## Architecture

### Backend (Go API)

The backend provides a centralized authentication service that both frontend applications use.

#### Key Components

1. **Models**
   - `User` - User account with support for both password and OAuth
   - `OAuthProvider` - OAuth provider connections (Google, etc.)
   - `RefreshToken` - Secure refresh tokens for maintaining sessions

2. **Controllers**
   - `auth.controller.go` - Email/password authentication
   - `oauth.controller.go` - OAuth flows and token management

3. **Middleware**
   - `auth.middleware.go` - JWT validation
   - `ratelimit.middleware.go` - Rate limiting protection
   - `csrf.middleware.go` - CSRF token protection

4. **Utilities**
   - `jwt.util.go` - Token generation and validation
   - `password.util.go` - Password hashing

### Frontend (Shared Auth Package)

A shared authentication package (`@repo/auth`) provides consistent authentication logic for both React and Next.js applications.

#### Key Components

1. **AuthService** - Core authentication service
   - Token management
   - API communication
   - Automatic token refresh

2. **React Context** - React hooks for authentication
   - `AuthProvider` - Context provider
   - `useAuth()` - Authentication hook

## Setup Instructions

### 1. Backend Configuration

#### Environment Variables

Create a `.env` file in `apps/api/`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/collabdb

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Server
PORT=4000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
```

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Create OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (for web app)
     - `http://localhost:5173/auth/callback` (for colab-whiteboard-web)
     - Add production URLs when deploying
7. Copy Client ID and Client Secret to `.env` file

#### Install Dependencies

```bash
cd apps/api
go mod download
```

#### Run Migrations

The database schema will be automatically migrated when you start the server. The following tables will be created:
- `users` - User accounts
- `oauth_providers` - OAuth connections
- `refresh_tokens` - Refresh token storage

#### Start the Server

```bash
go run cmd/main.go
```

The API will be available at `http://localhost:4000`

### 2. Frontend Configuration (Web - Next.js)

#### Install Dependencies

```bash
cd apps/web
pnpm install
```

#### Environment Variables

Create a `.env.local` file in `apps/web/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

#### Start the Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

### 3. Frontend Configuration (Colab Whiteboard - React + Vite)

#### Install Dependencies

```bash
cd apps/colab-whiteboard-web
pnpm install
```

#### Environment Variables

Create a `.env` file in `apps/colab-whiteboard-web/`:

```env
VITE_API_URL=http://localhost:4000
```

#### Start the Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

## API Endpoints

### Authentication

#### POST `/api/auth/signup`
Register a new user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "username": "johndoe",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "base64-encoded-token",
  "expiresIn": 900,
  "user": {
    "id": "usr_...",
    "email": "user@example.com",
    "username": "johndoe",
    "name": "John Doe",
    "avatar": null,
    "emailVerified": false
  }
}
```

#### POST `/api/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:** Same as signup

#### GET `/api/auth/me` (Protected)
Get current user information.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "id": "usr_...",
  "email": "user@example.com",
  "username": "johndoe",
  "name": "John Doe"
}
```

#### POST `/api/auth/refresh`
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "base64-encoded-refresh-token"
}
```

**Response:**
```json
{
  "accessToken": "new-access-token",
  "refreshToken": "new-refresh-token",
  "expiresIn": 900
}
```

#### POST `/api/auth/logout`
Logout and revoke refresh token.

**Request:**
```json
{
  "refreshToken": "base64-encoded-refresh-token"
}
```

#### POST `/api/auth/logout-all` (Protected)
Logout from all devices (revoke all refresh tokens).

### OAuth

#### GET `/api/auth/google`
Get Google OAuth authorization URL.

**Response:**
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "csrf-state-token"
}
```

#### POST `/api/auth/google/callback`
Handle Google OAuth callback.

**Request:**
```json
{
  "code": "authorization-code",
  "state": "csrf-state-token"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "base64-encoded-token",
  "expiresIn": 900,
  "user": {
    "id": "usr_...",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://...",
    "emailVerified": true
  },
  "isNewUser": true
}
```

### Security

#### GET `/api/auth/csrf-token`
Get CSRF token for state-changing requests.

**Response:**
```json
{
  "csrfToken": "base64-encoded-csrf-token"
}
```

## Security Features

### 1. Rate Limiting

The API implements rate limiting to prevent abuse:

- **Auth endpoints** (signup/login): 5 requests per 15 minutes per IP
- **OAuth endpoints**: 10 requests per minute per IP
- **General API**: 100 requests per minute per IP

Rate limit headers are automatically added to responses.

### 2. CSRF Protection

All state-changing requests (POST, PUT, DELETE, PATCH) require a CSRF token in the `X-CSRF-Token` header. The frontend automatically manages this.

### 3. Token Security

- **Access tokens**: Short-lived (15 minutes), stored in memory
- **Refresh tokens**: Long-lived (7 days), securely stored
- **Token rotation**: Refresh tokens are rotated on each use
- **Automatic cleanup**: Old tokens are automatically removed

### 4. Password Security

- Passwords are hashed using bcrypt with appropriate cost factor
- Minimum password requirements should be enforced client-side

### 5. CORS

CORS is configured to only allow requests from configured origins.

## Frontend Usage

### Using the Auth Context (React/Next.js)

```tsx
import { useAuth } from "@repo/auth";

function MyComponent() {
  const {
    user,              // Current user or null
    loading,           // Loading state
    isAuthenticated,   // Boolean
    login,             // Login function
    signup,            // Signup function
    logout,            // Logout function
    logoutAll,         // Logout from all devices
    loginWithGoogle,   // Google OAuth
    refreshUser,       // Refresh user data
  } = useAuth();

  // Use authentication in your component
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please login</div>;

  return <div>Welcome, {user.name}!</div>;
}
```

### Manual API Calls

```tsx
import { authService } from "@/lib/auth";

// Login
await authService.login({
  email: "user@example.com",
  password: "password"
});

// Get current user
const user = await authService.getCurrentUser();

// Logout
await authService.logout();
```

## Cross-Application Authentication

Both frontend applications share the same authentication backend and use the same token storage mechanism. This means:

1. **Single Sign-On**: Login in one app = logged in both apps
2. **Shared Sessions**: Same user session across applications
3. **Unified Token Management**: Tokens are synchronized

### How It Works

1. User logs in via `web` app (Next.js)
2. Tokens are stored in localStorage
3. User navigates to `colab-whiteboard-web` (Vite)
4. Auth service reads tokens from localStorage
5. User is automatically authenticated

### Important Notes

- Both apps must be on the same domain for localStorage sharing in production
- For development, both apps can run on `localhost` with different ports
- In production, consider using subdomain approach:
  - `app.yourdomain.com` for web
  - `whiteboard.yourdomain.com` for colab-whiteboard-web

## Production Deployment

### Backend

1. **Environment Variables**
   - Set secure `JWT_SECRET` (minimum 32 characters)
   - Configure production database URL
   - Set production CORS origins
   - Add production Google OAuth redirect URIs

2. **HTTPS**
   - Always use HTTPS in production
   - Update OAuth redirect URIs to use HTTPS

3. **Database**
   - Use connection pooling
   - Set up regular backups
   - Enable SSL/TLS for database connections

### Frontend

1. **Environment Variables**
   - Set production API URL
   - Ensure HTTPS is used

2. **Security Headers**
   - Enable CSP (Content Security Policy)
   - Set secure cookie flags
   - Enable HSTS

3. **Domain Configuration**
   - Both apps should be on the same root domain for token sharing
   - Use subdomain approach for separate applications

## Troubleshooting

### "Token expired" errors

- The auth service automatically refreshes tokens
- If refresh fails, user will be logged out
- Check that refresh token is valid and not expired

### CORS errors

- Verify CORS_ORIGIN in backend .env matches frontend URL
- Check that credentials are included in requests

### Google OAuth not working

- Verify redirect URI matches exactly (including protocol and port)
- Check that OAuth consent screen is configured
- Ensure Google+ API is enabled

### Rate limit errors

- Wait for the rate limit window to reset
- Consider implementing exponential backoff
- In production, consider using IP allowlists for trusted clients

## Future Enhancements

1. **Additional OAuth Providers**
   - GitHub, Microsoft, Apple Sign In
   - Easy to add using the same pattern

2. **Two-Factor Authentication**
   - TOTP-based 2FA
   - SMS-based verification

3. **Email Verification**
   - Send verification emails
   - Verify email before allowing full access

4. **Password Reset**
   - Secure password reset flow
   - Email-based token verification

5. **Session Management**
   - View active sessions
   - Revoke specific sessions
   - Session notifications

## Support

For issues or questions:
1. Check this documentation
2. Review the code comments
3. Check API error responses for details
4. Enable debug logging in development

## License

[Your License Here]
