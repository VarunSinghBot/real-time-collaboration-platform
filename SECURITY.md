# Security Configuration Guide

## Overview

This document outlines the security features implemented in the Collab Platform authentication system.

## Security Features

### 1. Token-Based Authentication

#### Access Tokens
- **Lifetime**: 15 minutes
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Storage**: Client-side (localStorage)
- **Use**: Authorization for API requests

#### Refresh Tokens
- **Lifetime**: 7 days
- **Storage**: Database + Client localStorage
- **Rotation**: New token issued on each refresh
- **Revocation**: Can be revoked individually or all at once

### 2. Rate Limiting

Rate limiting is implemented using a token bucket algorithm:

#### Auth Endpoints (Signup/Login)
```
Rate: 5 requests per 15 minutes
Purpose: Prevent brute force attacks
```

#### OAuth Endpoints
```
Rate: 10 requests per minute
Purpose: Prevent OAuth flow abuse
```

#### General API
```
Rate: 100 requests per minute
Purpose: Prevent API abuse
```

#### Implementation Details
- Per-IP tracking
- Automatic cleanup of old visitors
- Configurable limits
- Returns 429 (Too Many Requests) when exceeded

### 3. CSRF Protection

Cross-Site Request Forgery protection:

- **Token Generation**: Cryptographically secure random tokens
- **Token Lifetime**: 1 hour
- **Storage**: Session storage (client) + in-memory (server)
- **Validation**: Required for all state-changing requests (POST, PUT, DELETE, PATCH)
- **Header**: `X-CSRF-Token`

#### How It Works
1. Client requests CSRF token from `/api/auth/csrf-token`
2. Token is cached in sessionStorage
3. Token is sent with each state-changing request
4. Server validates token before processing request

### 4. Password Security

- **Algorithm**: bcrypt
- **Cost Factor**: Automatically managed by bcrypt
- **Salt**: Unique per password
- **Storage**: Never stored in plain text
- **Validation**: Constant-time comparison

#### Best Practices
- Minimum 8 characters (enforce client-side)
- Recommend combination of uppercase, lowercase, numbers, special characters
- No password in logs or error messages
- Password field excluded from JSON responses

### 5. OAuth Security

#### State Parameter
- Prevents CSRF attacks on OAuth flow
- Cryptographically random
- Validated on callback

#### Token Exchange
- Done server-side only
- Client never sees OAuth tokens
- Secure HTTPS communication

#### Provider Verification
- Email verification status from provider
- Avatar URLs validated

### 6. Database Security

#### User Model
- Email: Indexed, normalized to lowercase
- Password: Nullable (for OAuth users)
- Soft deletes: Data not permanently deleted
- Timestamps: Track creation and updates

#### OAuth Providers
- Multiple providers per user supported
- Provider ID uniquely indexed
- Email verified flag preserved

#### Refresh Tokens
- Revocation timestamp
- Automatic cleanup of old tokens
- Cascade delete on user deletion

### 7. API Security

#### CORS
```go
AllowedOrigins:   []string{os.Getenv("CORS_ORIGIN")}
AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"}
AllowCredentials: true
MaxAge:           300
```

#### Headers
- `Authorization: Bearer <token>` for authenticated requests
- `X-CSRF-Token: <token>` for state-changing requests
- `Content-Type: application/json` enforced

### 8. Session Management

#### Token Refresh Flow
```
1. Access token expires (15 min)
2. Client automatically calls /refresh with refresh token
3. Server validates refresh token from database
4. Old refresh token is revoked
5. New access + refresh tokens issued
6. Client updates stored tokens
```

#### Logout Flow
```
1. Client calls /logout with refresh token
2. Server marks refresh token as revoked
3. Client clears local storage
4. User logged out
```

#### Logout All Flow
```
1. Client calls /logout-all (requires access token)
2. Server revokes ALL refresh tokens for user
3. All sessions invalidated
4. User must re-authenticate
```

## Environment Security

### Required Environment Variables

```env
# Critical - Never commit to version control
JWT_SECRET=min-32-character-random-string
GOOGLE_CLIENT_SECRET=your-oauth-secret

# Database connection should use SSL in production
DATABASE_URL=postgresql://...?sslmode=require

# CORS - Restrict to your domains only
CORS_ORIGIN=https://app.yourdomain.com,https://whiteboard.yourdomain.com
```

### Secret Generation

Generate secure secrets:
```bash
# For JWT_SECRET (Linux/Mac)
openssl rand -base64 48

# For JWT_SECRET (Windows PowerShell)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | % {[char]$_})
```

## Production Checklist

### Before Deployment

- [ ] Change all default secrets
- [ ] Enable HTTPS everywhere
- [ ] Configure production CORS origins
- [ ] Set up database SSL
- [ ] Review rate limits for production load
- [ ] Enable security headers (CSP, HSTS, etc.)
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy
- [ ] Review and test OAuth redirect URIs
- [ ] Enable database connection pooling
- [ ] Set up error tracking (Sentry, etc.)

### Security Headers (Recommended)

Add these to your production deployment:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

## Common Attack Vectors and Mitigations

### 1. Brute Force Attacks
**Mitigation**: Rate limiting on auth endpoints (5 req/15min)

### 2. Token Theft
**Mitigation**: 
- Short-lived access tokens (15 min)
- Token rotation on refresh
- Logout all sessions capability

### 3. CSRF Attacks
**Mitigation**: 
- CSRF token validation
- Same-origin policy
- Credentials required flag

### 4. XSS Attacks
**Mitigation**:
- Content Security Policy
- No user input in innerHTML
- Sanitize all user data

### 5. SQL Injection
**Mitigation**:
- GORM parameterized queries
- Input validation
- Prepared statements

### 6. OAuth Hijacking
**Mitigation**:
- State parameter validation
- HTTPS-only redirect URIs
- Server-side token exchange

## Monitoring and Logging

### What to Monitor
- Failed login attempts
- Rate limit violations
- Token refresh failures
- CSRF validation failures
- Unusual OAuth patterns

### What NOT to Log
- Passwords (plain or hashed)
- Access tokens
- Refresh tokens
- CSRF tokens
- OAuth client secrets

### Recommended Log Format
```json
{
  "timestamp": "2026-02-06T10:30:00Z",
  "level": "INFO",
  "event": "login_success",
  "userId": "usr_...",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

## Incident Response

### If Tokens Are Compromised
1. Rotate JWT_SECRET immediately
2. Force logout all users via database (UPDATE refresh_tokens SET revoked_at = NOW())
3. Notify users to re-authenticate
4. Review logs for suspicious activity

### If OAuth Credentials Are Compromised
1. Regenerate OAuth client secret in Google Console
2. Update environment variable
3. Restart application
4. Revoke all OAuth sessions if needed

### If Database Is Compromised
1. Immediately revoke all access
2. Rotate all secrets
3. Force password reset for all users
4. Review audit logs
5. Notify affected users
6. Consider engaging security professionals

## Testing Security

### Manual Testing
```bash
# Test rate limiting
for i in {1..10}; do curl -X POST http://localhost:4000/api/auth/login; done

# Test CSRF protection
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"test"}'
# Should return 403 Forbidden

# Test token expiry
# Wait 15+ minutes after login
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <old-token>"
# Should return 401 Unauthorized
```

### Automated Testing
Consider adding security-focused tests:
- Rate limit bypass attempts
- CSRF token bypass attempts
- Token manipulation attempts
- SQL injection attempts
- XSS payload attempts

## Compliance

### GDPR Considerations
- User data export capability
- Right to be forgotten (user deletion)
- Consent for data processing
- Data breach notification procedures

### Data Retention
- Refresh tokens: 7 days or until revoked
- Deleted users: Soft delete, can be hard deleted after retention period
- Audit logs: Recommended 90 days minimum

## Updates and Maintenance

### Dependency Updates
- Regularly update Go modules: `go get -u ./...`
- Monitor security advisories
- Test thoroughly after updates

### Secret Rotation
- JWT_SECRET: Rotate every 90 days (requires user re-auth)
- OAuth credentials: Rotate annually or when compromised
- Database passwords: Rotate quarterly

## Support and Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
