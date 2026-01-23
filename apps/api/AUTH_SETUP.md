# JWT Authentication Setup

This guide explains the JWT authentication implementation for the collaboration platform using GORM.

## Backend (Go API)

### Setup

1. **Environment Variables**
   Create a `.env` file in `apps/api` based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

   Update the following variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: A strong secret key (use a random string generator)
   - `CORS_ORIGIN`: Your frontend URL (default: http://localhost:3000)
   - `PORT`: API server port (default: 4000)

2. **Install Dependencies**
   ```bash
   cd apps/api
   go mod download
   ```

3. **Run Migrations**
   GORM will automatically migrate the database schema on startup. The User table will be created with all necessary fields.

4. **Start the Server**
   ```bash
   go run cmd/main.go
   ```

### API Endpoints

#### Authentication Routes

**POST /api/auth/signup**
- Creates a new user account
- Request body:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "username": "johndoe",
    "name": "John Doe"
  }
  ```
- Response:
  ```json
  {
    "token": "jwt-token-here",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "username": "johndoe",
      "name": "John Doe"
    }
  }
  ```

**POST /api/auth/login**
- Authenticates existing user
- Request body:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
- Response: Same as signup

**GET /api/auth/me** (Protected)
- Returns current user information
- Requires: `Authorization: Bearer <token>` header
- Response:
  ```json
  {
    "userId": "user-id",
    "email": "user@example.com"
  }
  ```

### Architecture

```
apps/api/
├── internal/api/
│   ├── models/
│   │   └── user.go          # GORM User model
│   ├── controllers/
│   │   └── auth.controller.go  # Signup and Login handlers
│   ├── middlewares/
│   │   └── auth.go          # JWT validation middleware
│   ├── routes/
│   │   └── auth.go          # Auth route setup
│   ├── utils/
│   │   ├── jwt.go           # JWT generation and validation
│   │   └── password.go      # Password hashing utilities
│   ├── app.go               # Main router setup
│   └── db.go                # GORM database connection
├── cmd/
│   └── main.go              # Entry point
└── .env                     # Environment variables
```

## Frontend (Next.js)

### Setup

1. **Environment Variables**
   Create a `.env.local` file in `apps/web`:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

2. **Install Dependencies**
   ```bash
   cd apps/web
   pnpm install
   ```

3. **Start Development Server**
   ```bash
   pnpm dev
   ```

### Usage

The frontend automatically handles authentication:

1. **Login/Signup Pages**: Navigate to `/login` or `/signup`
2. **Automatic Token Management**: Tokens are stored in localStorage
3. **Protected Routes**: Dashboard and other protected routes check for valid tokens
4. **API Client**: Axios client (`lib/axios.ts`) automatically includes tokens in requests

### API Client

The centralized axios client (`lib/axios.ts`) provides:
- Automatic token injection in request headers
- Response error handling
- Automatic redirect to login on 401 errors
- Base URL configuration

Example usage:
```typescript
import apiClient from '@/lib/axios';

// The token is automatically included
const response = await apiClient.get('/api/some-endpoint');
```

## Security Features

- **Password Hashing**: bcrypt with default cost factor
- **JWT Tokens**: HS256 signing with 24-hour expiration
- **CORS Protection**: Configured for specific origin
- **Input Validation**: Email normalization and required field checks
- **Unique Constraints**: Email and username uniqueness enforced

## Testing

### Test Signup
```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword",
    "username": "testuser",
    "name": "Test User"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword"
  }'
```

### Test Protected Route
```bash
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure `CORS_ORIGIN` in `.env` matches your frontend URL
2. **JWT Secret Not Set**: Add `JWT_SECRET` to your `.env` file
3. **Database Connection**: Verify `DATABASE_URL` is correct and PostgreSQL is running
4. **Token Expired**: Tokens expire after 24 hours; user needs to login again

### Database Schema
(GORM) includes:
- `id`: Unique identifier (auto-generated with CUID-like format)
- `email`: Unique, required
- `password`: Hashed, nullable for OAuth users
- `username`: Optional, unique if provided
- `name`: Optional display name
- `google_id`: For future OAuth integration
- `created_at`, `updated_at`: Timestamps
- `deleted_at`: Soft delete support

GORM automatically handles migrations and creates these fields with proper constraints.tion
- `createdAt`, `updatedAt`: Timestamps

## Next Steps

- Implement password reset functionality
- Add Google OAuth integration
- Implement refresh tokens
- Add email verification
- Rate limiting for auth endpoints
- Two-factor authentication (2FA)
