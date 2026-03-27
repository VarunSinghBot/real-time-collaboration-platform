# Collaborative Word Editor

A real-time collaborative word processing application built with React, Tiptap, and Yjs.

## Features

- 📝 Rich text editing with formatting tools
- 👥 Real-time collaboration
- 🎨 Text styling (bold, italic, underline, colors)
- 📊 Text alignment and lists
- 🔒 Permission-based access (owner, editor, viewer)
- 👤 User presence indicators

## Tech Stack

- **React 19** - UI framework
- **Tiptap** - Rich text editor
- **Yjs** - CRDT for real-time collaboration
- **WebSocket** - Real-time communication
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:5174`

## Architecture

- **Editor Component**: Tiptap editor with collaboration extensions
- **WebSocket Integration**: Y-websocket provider for real-time sync
- **Authentication**: JWT-based auth with @repo/auth package
- **State Management**: React hooks and Yjs shared types

## Collaboration

Documents are synced in real-time using:
1. Yjs CRDT (Conflict-free Replicated Data Type)
2. WebSocket connection to backend
3. Operational transformation for concurrent edits
4. Presence awareness for showing other users' cursors
