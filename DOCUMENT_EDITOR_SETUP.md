# Collaborative Word Document Editor Setup Guide

This guide will help you set up and run the collaborative word document editor frontend and backend.

## Overview

The collaborative word editor allows multiple users to edit documents in real-time, similar to Google Docs. It features:

- **Real-time collaboration** using Yjs CRDT and WebSockets
- **Rich text editing** with Tiptap editor
- **User presence** showing who's currently editing
- **Permission system** (owner, edit, view)
- **JWT authentication**

## Architecture

### Frontend
- **React 19** with TypeScript
- **Tiptap** - Rich text editor
- **Yjs** - Conflict-free Replicated Data Type for real-time sync
- **y-websocket** - WebSocket provider for Yjs
- **Tailwind CSS** for styling

### Backend
- **Go** with Chi router
- **PostgreSQL** database with GORM
- **WebSocket** (Gorilla WebSocket) for real-time communication
- **JWT** authentication

### Database Schema

The backend adds three new tables:
1. `document_data` - Private documents for individual users
2. `collab_documents` - Collaborative documents with room codes
3. `document_members` - User permissions for collaborative documents

## Prerequisites

- Node.js 18+ and pnpm
- Go 1.21+
- PostgreSQL 14+
- Running collab-platform backend (see backend setup)

## Frontend Setup

### 1. Install Dependencies

```bash
cd collab-platform/apps/colab-word-frontend
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in `apps/colab-word-frontend/`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_API_URL=http://localhost:4000
```

### 3. Start Development Server

```bash
pnpm dev
```

The frontend will be available at `http://localhost:5174`

## Backend Setup

### 1. Database Migrations

The new models will be automatically migrated when you start the backend:
- `DocumentData` model for private documents
- `CollabDocument` model for collaborative documents
- `DocumentMember` model for document permissions

### 2. API Endpoints

The following endpoints have been added:

#### Document Management
- `POST /api/documents` - Create a new collaborative document
- `GET /api/documents` - Get all documents for the authenticated user
- `GET /api/documents/:roomCode` - Get a specific document
- `PUT /api/documents/:roomCode` - Update document title or content
- `DELETE /api/documents/:roomCode` - Delete a document (owner only)
- `POST /api/documents/:roomCode/members` - Add a member to a document

#### WebSocket
- `WS /ws/document` - WebSocket endpoint for real-time document collaboration

### 3. Start Backend

Make sure your backend is running:

```bash
cd collab-platform/apps/api
go run cmd/main.go
```

The backend API will be available at `http://localhost:4000`

## Usage

### Creating a Document

1. Sign up or log in to the application
2. Navigate to the Dashboard
3. Click "New Document" button
4. You'll be redirected to the collaborative editor

### Sharing a Document

1. Open a document
2. Share the room code with other users
3. Other users can access it via `/collab/{roomCode}`

### Permissions

- **Owner**: Full access, can delete document and manage members
- **Edit**: Can edit the document content
- **View**: Read-only access

## WebSocket Communication

The document editor uses two types of WebSocket messages:

1. **Binary Messages**: Yjs document updates (CRDT operations)
2. **Text Messages**: JSON messages for presence, awareness, and metadata

### Connection Parameters

When connecting to the WebSocket endpoint:
- `room` - The document room code
- `token` - JWT authentication token
- `permission` - User permission level

Example WebSocket URL:
```
ws://localhost:4000/ws/document?room=ABC12345&token=<jwt_token>&permission=edit
```

## Features

### Rich Text Editing

The Tiptap editor supports:
- Basic formatting (bold, italic, underline, strikethrough)
- Headings (H1, H2, H3)
- Lists (bullet and numbered)
- Text alignment
- Code blocks
- Blockquotes
- Syntax highlighting
- Color and highlighting

### Real-time Collaboration

Using Yjs CRDT:
- **Conflict-free merging** of concurrent edits
- **Operational transformation** for consistent state
- **Offline editing** with automatic sync when reconnecting
- **Undo/redo** that works across multiple users

### User Presence

- See who's currently editing
- View cursor positions of other users
- User avatars with colored indicators

## Development Tips

### Frontend

To add new formatting options to the toolbar, edit:
```
apps/colab-word-frontend/src/components/editor/Toolbar.tsx
```

To customize the editor appearance, modify:
```
apps/colab-word-frontend/src/index.css
```

### Backend

To add custom document metadata or features, update:
```
apps/api/internal/api/models/document.model.go
apps/api/internal/api/controllers/document.controller.go
```

## Troubleshooting

### WebSocket Connection Issues

1. Check that the backend is running on port 4000
2. Verify the JWT token is valid
3. Check browser console for WebSocket errors
4. Ensure CORS is properly configured in the backend

### Database Migration Errors

If you encounter migration errors:

```bash
# Connect to PostgreSQL
psql -U your_username -d your_database

# Check if tables exist
\dt

# Drop tables if needed (CAUTION: This deletes data)
DROP TABLE IF EXISTS document_members CASCADE;
DROP TABLE IF EXISTS collab_documents CASCADE;
DROP TABLE IF EXISTS document_data CASCADE;

# Restart backend to re-run migrations
```

### Yjs Sync Issues

If documents aren't syncing:
1. Check WebSocket connection status (indicator in header)
2. Verify user has edit permissions (not view-only)
3. Check browser console for Yjs errors
4. Try refreshing the page

## Project Structure

```
collab-platform/
├── apps/
│   ├── colab-word-frontend/          # Frontend application
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── auth/             # Auth components
│   │   │   │   ├── editor/           # Editor components
│   │   │   │   │   ├── Editor.tsx              # Simple editor
│   │   │   │   │   ├── CollaborativeEditor.tsx # Collaborative editor
│   │   │   │   │   ├── Toolbar.tsx             # Formatting toolbar
│   │   │   │   │   └── UserPresence.tsx        # User presence indicator
│   │   │   │   ├── Dashboard.tsx     # Document list
│   │   │   │   └── ...
│   │   │   ├── lib/
│   │   │   │   └── auth.ts           # Auth service
│   │   │   ├── App.tsx               # Main app with routing
│   │   │   └── main.tsx              # Entry point
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── api/                          # Backend application
│       ├── internal/
│       │   └── api/
│       │       ├── models/
│       │       │   ├── document.model.go         # Document models
│       │       │   └── document_member.model.go  # Member models
│       │       ├── controllers/
│       │       │   └── document.controller.go    # Document API
│       │       └── routes/
│       │           └── document.route.go         # Document routes
│       ├── websocket/
│       │   └── ws.go                 # WebSocket handlers
│       └── cmd/
│           └── main.go
```

## Next Steps

### Planned Features

- [ ] Document versioning and history
- [ ] Comments and annotations
- [ ] Export to PDF/DOCX
- [ ] Real-time cursor tracking
- [ ] Document templates
- [ ] Folder organization
- [ ] Search functionality
- [ ] Document sharing via link

### Contributing

When contributing to the document editor:

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Test real-time collaboration with multiple users

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the backend logs
3. Check browser console for frontend errors
4. Ensure all dependencies are up to date

## License

This project is part of the collab-platform monorepo.
