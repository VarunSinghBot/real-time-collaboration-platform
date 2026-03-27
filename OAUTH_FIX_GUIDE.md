# OAuth Setup Fix Guide

## Issue: "The OAuth client was not found. Error 401: invalid_client"

This error occurs when Google OAuth is not properly configured. Follow these steps to fix it:

## Step 1: Update Google Cloud Console Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID

### Update Authorized JavaScript Origins:
Add these URLs:
```
http://localhost:3000
http://localhost:5173
http://localhost:5174
http://localhost:4000
```

### Update Authorized Redirect URIs:
Add these URLs:
```
http://localhost:4000/api/auth/google/callback
http://localhost:3000/auth/callback
http://localhost:5173/auth/callback
http://localhost:5174/auth/callback
```

## Step 2: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Set **User Type** to "External" (or "Internal" if using Google Workspace)
3. Fill in required fields:
   - App name
   - User support email
   - Developer contact email
4. Add test users if in "Testing" mode:
   - Click **+ ADD USERS**
   - Add your Google account email
5. Save and continue

## Step 3: Verify Environment Variables

All `.env` files have been updated with the correct Google Client ID:
- Backend: `apps/api/.env`
- Main Dashboard: `apps/web/.env`
- Whiteboard: `apps/colab-whiteboard-web/.env`
- Word Editor: `apps/colab-word-web/.env` ✓ (newly created)

## Step 4: Restart All Services

After making changes, restart all services:

```powershell
# Stop all running services (Ctrl+C in each terminal)

# Restart Backend
cd "D:\Sx Varun\Sx Code\Sx Projects\collab-platform\apps\api"
go run cmd/main.go

# Restart Dashboard (in new terminal)
cd "D:\Sx Varun\Sx Code\Sx Projects\collab-platform"
pnpm run dev

# Services should start on:
# - Backend API: http://localhost:4000
# - Main Dashboard: http://localhost:3000
# - Whiteboard: http://localhost:5173
# - Word Editor: http://localhost:5174
```

## Fixed Issues

### ✅ 1. 404 Page Not Found (Document Creation)
**Problem**: Route mismatch between dashboard and word editor
- Dashboard was opening: `/document/:roomCode`
- Word editor had route: `/collab/:roomId`

**Solution**: Changed word editor route to `/document/:roomCode` in `App.tsx`

### ✅ 2. Missing Environment Variables
**Problem**: Word editor didn't have `.env` file with OAuth credentials

**Solution**: Created `.env` file with proper configuration

### ✅ 3. CORS Configuration
**Problem**: Backend CORS didn't include word editor port (5174)

**Solution**: Updated backend `.env` to include all frontend ports

## Troubleshooting

### If OAuth still doesn't work:

1. **Clear browser cache and cookies** for localhost
2. **Check Google Cloud Console quotas** - ensure you haven't exceeded OAuth limits
3. **Verify OAuth consent screen status** - it should be "In Production" or have test users added
4. **Check Network tab** in browser DevTools for actual error messages
5. **Try incognito mode** to rule out browser extension interference

### If 404 persists:

1. Ensure all services are restarted after the changes
2. Check browser console for routing errors
3. Verify the URL being opened matches: `http://localhost:5174/document/ROOM_CODE`

## Testing the Fixes

1. Log out of all applications
2. Clear browser cache/cookies
3. Navigate to: http://localhost:3000
4. Click "Sign in with Google"
5. If prompted, select your Google account
6. Should redirect successfully to dashboard
7. Click "Documents" tab
8. Click "New Document" button
9. Enter a title and click "Create"
10. Should open in new tab at: `http://localhost:5174/document/XXXX`
