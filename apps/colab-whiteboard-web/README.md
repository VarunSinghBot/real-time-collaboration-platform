# CollabBoard Whiteboard App

The whiteboard application for CollabBoard - a real-time collaborative canvas built with React, Vite, and Tldraw.

## Features

### 🎨 Drawing & Design
- **Infinite canvas** with smooth pan and zoom
- **Professional tools** — pen, shapes, text, arrows, sticky notes, frames
- **8 starter templates** including Kanban boards, flowcharts, mind maps, wireframes, and more
- **Rich styling** — colors, stroke width, fill options, fonts
- **Asset library** — import images and media
- **Frames** — organize content into logical sections

### 🤝 Real-time Collaboration
- **Live synchronization** — see changes from collaborators instantly
- **Live cursors** — track where team members are working
- **Presence indicators** — know who's online with color-coded avatars
- **Permission-based access** — Owner, Editor, and Viewer roles
- **Conflict resolution** — automatic handling of concurrent edits

### 🎯 User Experience
- **Responsive interface** — adapts to different screen sizes
- **Keyboard shortcuts** — fast navigation and actions
- **Undo/Redo** — unlimited history with Ctrl+Z / Ctrl+Shift+Z
- **Copy/Paste** — duplicate elements quickly
- **Selection tools** — lasso and box selection
- **Context menus** — right-click for quick actions

## Tech Stack

- **React 18** — UI framework
- **Vite** — Fast build tool and dev server
- **TypeScript** — Type-safe development
- **Tldraw** — Professional whiteboard library
- **WebSocket** — Real-time communication
- **React Router** — Client-side routing
- **Framer Motion** — Smooth animations

## Getting Started

### Prerequisites
- Node.js 18 or higher
- pnpm package manager
- Running CollabBoard API server

### Installation

```bash
# From the whiteboard app directory
cd apps/colab-whiteboard-web

# Install dependencies
pnpm install
```

### Environment Setup

Create a `.env` file in the app root:

```env
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000
```

### Development

```bash
# Start dev server
pnpm dev

# App runs on http://localhost:5173
```

### Build for Production

```bash
# Create optimized production build
pnpm build

# Preview production build
pnpm preview
```

## Application Structure

```
src/
├── components/
│   ├── CollabWhiteboard.tsx          # Main collaborative whiteboard
│   ├── Whiteboard.tsx                # Personal whiteboard mode
│   ├── PrivateWhiteboard.tsx         # Private mode (no sharing)
│   ├── WhiteboardTemplates.tsx       # 8 pre-built templates
│   ├── InviteMemberModal.tsx         # Team invitation dialog
│   ├── LandingPage.tsx               # Welcome/home page
│   ├── ProtectedRoute.tsx            # Auth guard
│   └── auth/
│       ├── Login.tsx                 # Login page
│       ├── Signup.tsx                # Registration page
│       └── OAuthCallback.tsx         # OAuth redirect handler
├── lib/
│   └── auth.ts                       # Auth service instance
├── App.tsx                           # Root component with routing
├── main.tsx                          # Application entry point
└── index.css                         # Global styles & Tldraw theme

public/
└── ...                               # Static assets
```

## Usage

### Accessing Whiteboards

**Collaborative Whiteboard**
```
/collab/:boardId?accessToken=...&refreshToken=...
```
Opens a shared whiteboard with real-time sync. Tokens are passed from the dashboard.

**Personal Whiteboard**
```
/whiteboard
```
Your private canvas for quick sketches and notes.

**Private Mode**
```
/private
```
Offline-first whiteboard with no internet requirement.

### Using Templates

1. Click the **Templates** button (grid icon) in the top-right toolbar
2. Browse 8 professional templates:
   - Kanban Board
   - Flowchart
   - Mind Map
   - Sticky Notes
   - SWOT Analysis
   - Mobile Wireframe
   - Timeline
   - System Architecture
3. Click any template to insert it on the canvas
4. Customize shapes, text, and colors to fit your needs

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `V` | Select tool |
| `D` | Draw/pen tool |
| `E` | Eraser tool |
| `A` | Arrow tool |
| `T` | Text tool |
| `S` | Sticky note |
| `R` | Rectangle |
| `O` | Ellipse |
| `Space + Drag` | Pan canvas |
| `Ctrl/Cmd + Scroll` | Zoom in/out |
| `Ctrl/Cmd + 0` | Reset zoom to 100% |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + D` | Duplicate |
| `Ctrl/Cmd + A` | Select all |
| `Delete` | Delete selection |
| `Ctrl/Cmd + C` | Copy |
| `Ctrl/Cmd + V` | Paste |
| `Ctrl/Cmd + X` | Cut |

### Inviting Collaborators

1. Click the **person icon** in the top-right corner
2. Enter email addresses of team members
3. Select permission level (Editor or Viewer)
4. Click **Invite** to send
5. Collaborators receive an email and can access the board

## WebSocket Integration

The app connects to the backend WebSocket server for real-time collaboration:

```typescript
const ws = new WebSocket(`${WS_URL}/ws/${boardId}`);

// Send canvas updates
ws.send(JSON.stringify({
  type: 'draw',
  data: { shapes, bindings }
}));

// Receive updates from others
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // Apply changes to canvas
};
```

Messages include:
- **draw** — Canvas state changes
- **cursor** — Cursor position updates
- **presence** — User join/leave events

## Authentication

Protected routes require authentication. The app uses JWT tokens:

1. **Access Token** — Short-lived (15 min), sent with API requests
2. **Refresh Token** — Long-lived (7 days), used to obtain new access tokens

Tokens are passed via URL parameters when launching from the dashboard:
```
/collab/:boardId?accessToken=xxx&refreshToken=yyy&expiresIn=900&issuedAt=123456
```

The auth service automatically:
- Stores tokens securely
- Refreshes expired access tokens
- Redirects to login if refresh fails
- Syncs logout across dashboard and whiteboard

## Theme & Styling

The app uses a custom CSS theme that adapts to the Tldraw editor:

```css
/* Custom variables for theme consistency */
:root {
  --color-background: #ffffff;
  --color-panel: #f9fafb;
  --color-text: #111827;
  --color-accent: #7c3aed;
}
```

Tldraw's native theme is modified in `index.css` to match CollabBoard's design system.

## Performance Optimization

- **Code splitting** — React Router lazy loading for route components
- **Asset optimization** — Vite automatically optimizes images and fonts
- **WebSocket efficiency** — Debounced updates to reduce network traffic
- **Canvas virtualization** — Tldraw only renders visible shapes

## Troubleshooting

### WebSocket won't connect
- Verify API server is running on the correct port
- Check `VITE_WS_URL` in `.env`
- Ensure firewall allows WebSocket connections
- Look for errors in browser console (F12)

### Templates not appearing
- Clear browser cache
- Verify WhiteboardTemplates.tsx is imported correctly
- Check console for TypeScript errors

### Canvas not syncing
- Check WebSocket connection status (look for green indicator)
- Verify you have Editor permissions (not just Viewer)
- Refresh the page to reconnect
- Check network tab for failed messages

### Authentication errors
- Clear localStorage: `localStorage.clear()`
- Re-login from dashboard
- Verify JWT_SECRET matches between frontend and backend
- Check access token hasn't expired

---

## Contributing

This is part of the CollabBoard monorepo. See the [main README](../../README.md) for contribution guidelines.

---

## License

MIT License
