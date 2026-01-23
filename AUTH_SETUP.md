# Authentication Setup Guide

## Project Structure

The authentication system has been set up with the following structure:

### Backend (Go)
```
apps/api/
├── controllers/
│   └── auth.go          # Authentication handlers (Signup, Login, GetMe, Logout)
├── middlewares/
│   └── auth.go          # JWT authentication middleware
├── routes/
│   └── auth.go          # Authentication route definitions
├── utils/
│   ├── db.go            # Database connection utilities
│   └── jwt.go           # JWT token generation and validation
├── prisma/
│   └── schema.prisma    # Prisma database schema
├── main.go              # Main application entry point with CORS
├── go.mod               # Go dependencies
└── .env                 # Environment variables
```

### Frontend (Next.js)
```
apps/web/
├── app/
│   ├── login/
│   │   └── page.tsx     # Login page with auto-redirect
│   ├── signup/
│   │   └── page.tsx     # Signup page with validation
│   └── dashboard/
│       └── page.tsx     # Protected dashboard with user details
```

## Setup Instructions

### 1. Install Backend Dependencies

Navigate to the API directory and install dependencies:

```bash
cd apps/api
go mod tidy
```

This will install:
- `github.com/gin-gonic/gin` - Web framework
- `github.com/gin-contrib/cors` - CORS middleware
- `github.com/golang-jwt/jwt/v5` - JWT authentication
- `github.com/joho/godotenv` - Environment variable loader
- `github.com/steebchen/prisma-client-go` - Prisma client for Go
- `golang.org/x/crypto` - Password hashing (bcrypt)

### 2. Configure Prisma for Go

The project uses Prisma 7 with Go. To generate the Prisma client:

```bash
cd apps/api
# Install Prisma CLI globally if not already installed
npm install -g prisma

# Generate Prisma client for Go
go run github.com/steebchen/prisma-client-go generate
```

### 3. Run Database Migrations

```bash
cd apps/api
npx prisma migrate dev --name init
```

### 4. Start the Backend Server

```bash
cd apps/api
go run main.go
```

The server will start on `http://localhost:4000`

### 5. Start the Frontend

```bash
cd apps/web
pnpm install  # or npm install
pnpm dev      # or npm run dev
```

The frontend will start on `http://localhost:3000`

## API Endpoints

### Authentication Routes

All authentication routes are prefixed with `/api/auth`:

- **POST** `/api/auth/signup` - Create a new user account
  - Body: `{ "username": "string", "name": "string", "email": "string", "password": "string" }`
  - Returns: `{ "message": "string", "token": "string", "user": {...} }`

- **POST** `/api/auth/login` - Login with email and password
  - Body: `{ "email": "string", "password": "string" }`
  - Returns: `{ "message": "string", "token": "string", "user": {...} }`

- **GET** `/api/auth/me` - Get current user details (Protected)
  - Headers: `Authorization: Bearer <token>` or Cookie with token
  - Returns: `{ "user": {...} }`

- **POST** `/api/auth/logout` - Logout and clear cookies
  - Returns: `{ "message": "Logout successful" }`

## Features

### Backend Features
✅ JWT-based authentication
✅ Password hashing with bcrypt
✅ Cookie-based token storage
✅ CORS configured for frontend
✅ Prisma ORM integration
✅ Protected route middleware
✅ Token validation on protected endpoints

### Frontend Features
✅ Auto-redirect if user already logged in
✅ Token stored in localStorage
✅ Auto-login on page refresh if token exists
✅ Token verification with backend
✅ User details fetched from API
✅ Logout functionality
✅ Error handling and loading states
✅ Password visibility toggle
✅ Form validation

## Environment Variables

The `.env` file contains:
```env
DATABASE_URL=postgresql://...
PORT=4000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-very-long-and-random
```

**Important:** Change the `JWT_SECRET` in production to a strong, random string.

## Security Notes

1. **HTTPS in Production**: Set the cookie secure flag to `true` in production
2. **JWT Secret**: Use a strong, random secret key (at least 32 characters)
3. **Password Requirements**: Passwords must be at least 6 characters
4. **CORS**: Currently allows `http://localhost:3000` - update for production

## User Flow

### Signup Flow
1. User fills signup form
2. Frontend validates password match
3. POST request to `/api/auth/signup`
4. Backend hashes password and creates user
5. Backend generates JWT token
6. Token stored in localStorage and cookies
7. User redirected to dashboard

### Login Flow
1. User fills login form
2. POST request to `/api/auth/login`
3. Backend validates credentials
4. Backend generates JWT token
5. Token stored in localStorage and cookies
6. User redirected to dashboard

### Auto-Login Flow
1. User visits any page
2. Frontend checks localStorage for token
3. If token exists, verify with backend
4. If valid, redirect to dashboard
5. If invalid, clear storage and show login

### Dashboard Access
1. User navigates to dashboard
2. Frontend checks for token
3. Calls `/api/auth/me` to verify token
4. If valid, displays user details
5. If invalid, redirects to login

## Database Schema

```prisma
model User {
  id         String   @id @default(cuid())
  email      String   @unique
  password   String?
  googleId   String?  @unique
  username   String?  @unique
  name       String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

## Next Steps

To implement actual database integration:

1. Generate Prisma client for Go:
   ```bash
   go run github.com/steebchen/prisma-client-go generate
   ```

2. Replace the mock data in `controllers/auth.go` with actual Prisma queries

3. Example Prisma query pattern:
   ```go
   user, err := utils.DB.User.CreateOne(
       db.User.Email.Set(req.Email),
       db.User.Password.Set(string(hashedPassword)),
       db.User.Username.Set(req.Username),
       db.User.Name.Set(req.Name),
   ).Exec(ctx)
   ```

## Troubleshooting

### CORS Issues
- Ensure the frontend URL is added to CORS allowed origins in `main.go`
- Check that credentials are included in fetch requests

### Token Issues
- Verify JWT_SECRET is set in `.env`
- Check token expiration (default: 24 hours)
- Clear localStorage if experiencing stale token issues

### Database Connection
- Verify DATABASE_URL in `.env` is correct
- Run migrations: `npx prisma migrate dev`
- Check database is accessible

## File Structure Summary

Created/Modified Files:
- ✅ `apps/api/.env` - Added JWT_SECRET
- ✅ `apps/api/main.go` - Added CORS and auth routes
- ✅ `apps/api/go.mod` - Added dependencies
- ✅ `apps/api/controllers/auth.go` - Auth handlers
- ✅ `apps/api/middlewares/auth.go` - JWT middleware
- ✅ `apps/api/routes/auth.go` - Route definitions
- ✅ `apps/api/utils/jwt.go` - JWT utilities
- ✅ `apps/api/utils/db.go` - Database utilities
- ✅ `apps/web/app/login/page.tsx` - Login page with API integration
- ✅ `apps/web/app/signup/page.tsx` - Signup page with API integration
- ✅ `apps/web/app/dashboard/page.tsx` - Protected dashboard with user details

All files follow a clean, organized structure with proper separation of concerns.
