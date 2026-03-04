# CollabBoard

A modern, real-time collaborative whiteboarding platform built with Go, Next.js, and React. Create infinite canvases, invite team members, and collaborate in real-time with live cursors and instant synchronization.

## Overview

CollabBoard is a full-stack monorepo consisting of three main applications:

- **Dashboard** (`apps/web`) — Next.js 14 app for managing whiteboards, team collaboration, and user preferences
- **Whiteboard** (`apps/colab-whiteboard-web`) — Vite/React app with Tldraw infinite canvas and live WebSocket sync
- **API** (`apps/api`) — Go backend with Chi router, GORM + PostgreSQL, JWT auth, and real-time WebSocket support

---

## ✨ Key Features

### 🎨 Whiteboard & Drawing
- **Infinite canvas** powered by Tldraw with professional drawing tools
- **8 pre-built templates** — Kanban boards, flowcharts, mind maps, wireframes, sticky notes, SWOT analysis, timelines, and system architecture diagrams
- **Real-time collaboration** — see changes from team members instantly via WebSocket
- **Live cursors** — track where collaborators are working on the canvas
- **Rich toolset** — shapes, freehand drawing, text, sticky notes, arrows, images, and more

### 📊 Dashboard & Organization
- **Board management** — create, organize, and access all your whiteboards from one place
- **Three view layouts** — switch between list, grid, and compact views
- **Smart navigation** — Boards, Recent, and Starred sections for quick access
- **Starred boards** — favorite important boards for instant access
- **Recent boards** — automatically tracks your 5 most recently opened boards
- **Drag-to-scroll** — intuitive mouse-drag scrolling through board thumbnails
- **Visual indicators** — navigation dots show your position when scrolling
- **Search & filter** — find boards by name, filter by ownership (All/Owned/Shared)
- **Sort options** — organize by most recent, date created, or alphabetically

### 👥 Collaboration & Permissions
- **Role-based access** — Owner, Editor, and Viewer permissions per whiteboard
- **Member management** — invite collaborators by email, change roles, or remove members
- **Team insights** — see member counts and activity at a glance
- **Shared boards** — easily track which boards are shared with you

### 🎨 Personalization
- **Theme system** — seamless light and dark mode support with system preference detection
- **8 accent colors** — choose from Violet, Blue, Pink, Teal, Orange, Red, Amber, or Green
- **Persistent preferences** — your theme and layout choices are saved across sessions
- **Adaptive UI** — interface adjusts for optimal readability in both themes

### 🔐 Authentication & Security
- **JWT authentication** — secure access and refresh token system
- **Google OAuth** — one-click sign-in with Google
- **Cross-app sync** — logging out from dashboard or whiteboard logs you out from both
- **Session management** — automatic token refresh and expiration handling
- **CSRF protection** — built-in protection against cross-site request forgery

### 🚀 Performance & UX
- **Optimistic updates** — instant UI feedback with background synchronization
- **Smooth animations** — Framer Motion powered transitions and micro-interactions
- **Responsive design** — works seamlessly on desktop, tablet, and large mobile screens
- **Fast navigation** — client-side routing with Next.js for instant page transitions
- **Efficient data fetching** — smart caching and real-time updates

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Go 1.21+, Chi Router, GORM ORM, PostgreSQL |
| **Real-time** | gorilla/websocket, WebSocket rooms |
| **Auth** | JWT (access + refresh), Google OAuth 2.0 |
| **Dashboard** | Next.js 14, TypeScript, Tailwind CSS v4 |
| **Whiteboard** | React 18, Vite, Tldraw, TypeScript |
| **UI/Animation** | Framer Motion, Custom theme system |
| **Monorepo** | pnpm workspaces, Turborepo |

---

## Getting Started

### Prerequisites

- **Go** 1.21 or higher
- **Node.js** 18+ with pnpm installed
- **PostgreSQL** 12 or higher
- **Google OAuth credentials** (for OAuth login)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd collab-platform
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables** (see below)

4. **Run all apps**
   ```bash
   pnpm dev
   ```
   This starts:
   - API server on `http://localhost:4000`
   - Dashboard on `http://localhost:3000`
   - Whiteboard on `http://localhost:5173`

---

## Environment Setup

### Backend (`apps/api/.env`)

```env
# Database
DATABASE_URL=postgres://user:password@localhost:5432/collabboard?sslmode=disable

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URL=http://localhost:4000/api/auth/google/callback

# CORS
FRONTEND_URL=http://localhost:3000
WHITEBOARD_URL=http://localhost:5173

# Server
PORT=4000
```

### Dashboard (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WHITEBOARD_URL=http://localhost:5173
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Whiteboard (`apps/colab-whiteboard-web/.env`)

```env
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000
```

---

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register new user | ❌ |
| POST | `/api/auth/login` | Login with email/password | ❌ |
| GET | `/api/auth/google` | Initiate Google OAuth flow | ❌ |
| POST | `/api/auth/google/callback` | Handle OAuth callback | ❌ |
| POST | `/api/auth/refresh` | Refresh access token | ❌ |
| POST | `/api/auth/logout` | Logout (invalidate refresh token) | ✅ |
| POST | `/api/auth/logout-all` | Logout from all devices | ✅ |
| GET | `/api/auth/me` | Get current user | ✅ |
| GET | `/api/auth/csrf-token` | Get CSRF token | ❌ |

### Whiteboard Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/collab-whiteboard` | List user's whiteboards | ✅ |
| POST | `/api/collab-whiteboard` | Create new whiteboard | ✅ |
| GET | `/api/collab-whiteboard/:id` | Get whiteboard details | ✅ |
| PUT | `/api/collab-whiteboard/:id` | Update whiteboard | ✅ |
| DELETE | `/api/collab-whiteboard/:id` | Delete whiteboard | ✅ |
| POST | `/api/collab-whiteboard/:id/members` | Invite member to board | ✅ |
| PUT | `/api/collab-whiteboard/:id/members/:userId` | Update member permission | ✅ |
| DELETE | `/api/collab-whiteboard/:id/members/:userId` | Remove member | ✅ |
| GET | `/api/collab-whiteboard/:id/members` | List board members | ✅ |

### WebSocket

| Endpoint | Description |
|----------|-------------|
| `WS /ws/:roomId` | Connect to whiteboard room for real-time sync |

**Message Types:**
- `join` — Join a whiteboard room
- `draw` — Canvas state synchronization
- `cursor` — Cursor position updates
- `presence` — User join/leave notifications

---

---

## Project Structure

```
collab-platform/
├── apps/
│   ├── api/                           # Go backend
│   │   ├── cmd/main.go               # Application entry point
│   │   ├── internal/
│   │   │   ├── api/
│   │   │   │   ├── controllers/      # HTTP request handlers
│   │   │   │   ├── models/           # GORM database models
│   │   │   │   ├── routes/           # Route definitions
│   │   │   │   └── middleware/       # Auth, CORS middleware
│   │   │   ├── db.go                 # Database connection
│   │   │   └── app.go                # Application setup
│   │   └── websocket/                # WebSocket handlers
│   │
│   ├── web/                           # Next.js dashboard
│   │   ├── app/
│   │   │   ├── login/                # Login page
│   │   │   ├── signup/               # Signup page
│   │   │   ├── dashboard/            # Main dashboard page
│   │   │   └── oauth-callback/       # OAuth redirect handler
│   │   ├── components/
│   │   │   └── ManageMembersModal.tsx
│   │   └── lib/
│   │       ├── auth.tsx              # Auth service instance
│   │       └── preferences.tsx       # Theme & preferences system
│   │
│   └── colab-whiteboard-web/         # Vite whiteboard app
│       └── src/
│           ├── components/
│           │   ├── CollabWhiteboard.tsx    # Main collaborative canvas
│           │   ├── Whiteboard.tsx          # Personal whiteboard
│           │   ├── PrivateWhiteboard.tsx   # Private mode
│           │   ├── WhiteboardTemplates.tsx # 8 pre-built templates
│           │   ├── InviteMemberModal.tsx
│           │   ├── LandingPage.tsx
│           │   ├── ProtectedRoute.tsx
│           │   └── auth/                   # Login/Signup components
│           ├── lib/
│           │   └── auth.ts           # Auth service instance
│           └── App.tsx               # React Router setup
│
├── packages/                         # Shared packages
│   ├── auth/                         # Authentication logic
│   │   ├── authService.ts           # Core auth service (JWT, OAuth)
│   │   ├── react.tsx                # React hooks & provider
│   │   └── types.ts                 # Auth type definitions
│   ├── types/                        # Shared TypeScript types
│   │   ├── user.ts
│   │   └── task.ts
│   └── utils/                        # Shared utilities
│
├── turbo.json                        # Turborepo configuration
├── pnpm-workspace.yaml              # pnpm workspace config
└── package.json                      # Root package.json
```

---

## Usage Guide

### Dashboard Features

#### Creating a Whiteboard
1. Click the **"+ New Board"** button in the sidebar
2. Enter a title or leave blank for "Untitled Whiteboard"
3. The board opens automatically in a new tab

#### Using Templates
1. Open any whiteboard
2. Click the **Templates** button (grid icon) in the top toolbar
3. Choose from 8 professional templates:
   - **Kanban Board** — Organize tasks with To Do, In Progress, Done columns
   - **Flowchart** — Map processes with start, process, decision, and end nodes
   - **Mind Map** — Brainstorm ideas with central topic and branches
   - **Sticky Notes** — Quick note-taking with colorful sticky notes
   - **SWOT Analysis** — Strategic planning with Strengths, Weaknesses, Opportunities, Threats
   - **Mobile Wireframe** — Design mobile app layouts
   - **Timeline** — Plan projects with milestone markers
   - **System Architecture** — Design technical systems with components

#### Organizing Boards
- **Star boards** — Click the star icon to add boards to favorites
- **View Recent** — Access your 5 most recently opened boards
- **Filter** — Toggle between All, Owned, and Shared boards
- **Sort** — Sort by Most Recent, Date Created, or Name (A-Z)
- **Layouts** — Switch between List, Grid, and Compact views

#### Managing Team Members
1. Click the **people icon** on any board you own
2. Enter team member's email address
3. Select permission level (Owner, Editor, Viewer)
4. Click **Invite** to send invitation
5. Modify permissions or remove members anytime

#### Customizing Appearance
1. Click your profile picture in the sidebar
2. Choose **Light** or **Dark** theme
3. Select an **Accent Color** (8 colors available)
4. Pick a **Board Layout** (List, Grid, or Compact)
5. Preferences are saved automatically

### Whiteboard Features

#### Drawing Tools
- **Select** (V) — Move, resize, and rotate objects
- **Draw** (D) — Freehand drawing with pressure sensitivity
- **Erase** (E) — Remove elements
- **Arrow** (A) — Connect shapes with arrows
- **Text** (T) — Add text boxes
- **Sticky Note** (S) — Create sticky notes
- **Shapes** — Rectangle, ellipse, triangle, diamond, pentagon, hexagon
- **Frames** — Group related content

#### Collaboration
- See **live cursors** of collaborators with their names
- Changes sync **instantly** across all connected users
- **Color-coded** presence indicators show who's active

#### Shortcuts
- **Space + Drag** — Pan the canvas
- **Ctrl/Cmd + Scroll** — Zoom in/out
- **Ctrl/Cmd + Z** — Undo
- **Ctrl/Cmd + Shift + Z** — Redo
- **Delete/Backspace** — Delete selected objects
- **Ctrl/Cmd + D** — Duplicate selection
- **Ctrl/Cmd + A** — Select all

---

## Development

### Running Individual Apps

```bash
# Backend only
cd apps/api
go run cmd/main.go

# Dashboard only
cd apps/web
pnpm dev

# Whiteboard only
cd apps/colab-whiteboard-web
pnpm dev
```

### Building for Production

```bash
# Build all apps
pnpm build

# Build specific app
pnpm build --filter=web
pnpm build --filter=colab-whiteboard-web
```

### Database Migrations

GORM auto-migrates on startup. Models are in `apps/api/internal/api/models/`

To manually migrate:
```go
db.AutoMigrate(&models.User{}, &models.CollabWhiteboard{}, &models.WhiteboardMember{})
```

### Testing

```bash
# Run all tests
pnpm test

# Test specific app
cd apps/web && pnpm test
```

---

## Architecture Highlights

### Authentication Flow
1. User signs up/logs in → receives JWT access token (15 min) + refresh token (7 days)
2. Access token stored in memory, refresh token in localStorage
3. Expired access token automatically refreshed using refresh token
4. Cross-app logout: logging out from dashboard/whiteboard logs out from both

### Real-time Synchronization
1. User joins whiteboard → WebSocket connection established
2. Canvas changes → broadcasted to room
3. Server validates user permissions before broadcasting
4. Reconnection handling with automatic state sync

### State Management
- **Dashboard**: React state + localStorage for preferences
- **Whiteboard**: Tldraw internal state + WebSocket sync
- **Auth**: Centralized auth service in `packages/auth`

---

## Troubleshooting

### Common Issues

**Cannot connect to database**
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in `.env`
- Ensure database exists: `createdb collabboard`

**OAuth not working**
- Verify Google OAuth credentials are correct
- Check redirect URLs match in Google Console and `.env`
- Ensure CORS_ORIGIN includes frontend URL

**WebSocket connection failed**
- Check WS_URL in whiteboard `.env`
- Verify firewall isn't blocking WebSocket connections
- Check browser console for connection errors

**Boards not syncing**
- Refresh the page to reconnect WebSocket
- Check network tab for failed WS messages
- Verify user has edit permissions

**Cross-app logout not working**
- Clear browser localStorage and cookies
- Ensure both apps are on same domain (or different origins for testing)
- Check browser console for storage event errors

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see LICENSE file for details

---

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

## Acknowledgments

- [Tldraw](https://tldraw.com) — Excellent whiteboard library
- [Next.js](https://nextjs.org) — React framework
- [Go Chi](https://github.com/go-chi/chi) — Lightweight router
- [GORM](https://gorm.io) — Fantastic Go ORM
- [Framer Motion](https://www.framer.com/motion/) — Animation library

  apps/
    api/                     # Go backend
      cmd/                   # Entry point
      internal/api/
        controllers/         # Route handlers
        models/              # GORM models
        routes/              # Chi route registration
        middleware/          # Auth middleware
    web/                     # Next.js dashboard
      app/
        login/               # Login page
        signup/              # Signup page
        dashboard/           # Main dashboard
      components/            # ManageMembersModal, etc.
    colab-whiteboard-web/    # Vite whiteboard app
      src/components/
        CollabWhiteboard.tsx # Main canvas with Tldraw + WS
        InviteMemberModal.tsx
        LandingPage.tsx
        auth/                # Login / Signup pages
  packages/
    auth/                    # Shared auth context & hooks
    types/                   # Shared TypeScript types
```

---

## License

MIT
