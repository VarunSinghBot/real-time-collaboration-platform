# Collaborative Whiteboard

This whiteboard uses **Tldraw** - a modern, production-ready whiteboard library with built-in multiplayer support.

## ✨ Features

- **Full-featured drawing tools** - Pen, shapes, text, arrows, sticky notes, frames
- **Proper coordinate handling** - No drawing offset issues
- **Modern UI** - Clean interface with user info overlay
- **Production-ready** - Battle-tested library used by thousands
- **Collaboration-ready** - Built for multiplayer from the ground up

## 🚀 Current Implementation

The whiteboard currently runs in single-user mode. Each user has their own isolated canvas.

## 🤝 Adding Real-time Collaboration

To enable Discord-style collaborative editing where multiple users can edit the same canvas in real-time:

### Step 1: Install Collaboration Dependencies

```bash
cd apps/colab-whiteboard-web
pnpm add @tldraw/sync yjs y-websocket
```

### Step 2: Create WebSocket Server (Go Backend)

Add WebSocket support to your Go API for real-time sync:

```go
// apps/api/internal/websocket/whiteboard.go
package websocket

import (
    "github.com/gorilla/websocket"
    "sync"
)

type WhiteboardRoom struct {
    ID      string
    Clients map[*websocket.Conn]bool
    mu      sync.Mutex
}

// Broadcast updates to all clients in the room
func (r *WhiteboardRoom) Broadcast(data []byte, sender *websocket.Conn) {
    r.mu.Lock()
    defer r.mu.Unlock()
    
    for client := range r.Clients {
        if client != sender {
            client.WriteMessage(websocket.BinaryMessage, data)
        }
    }
}
```

### Step 3: Update Frontend Whiteboard Component

```tsx
import { Tldraw, createTLStore, defaultShapeUtils } from "tldraw";
import { useSync } from "@tldraw/sync";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export default function Whiteboard() {
  // ... existing auth code ...

  // Create Yjs document for collaboration
  const [yDoc] = useState(() => new Y.Doc());
  
  // Connect to WebSocket server
  const [provider] = useState(() => 
    new WebsocketProvider(
      'ws://localhost:4000/ws/whiteboard/room-123', // Your WebSocket URL
      'whiteboard',
      yDoc
    )
  );

  // Create collaborative store
  const store = useSync({
    uri: 'ws://localhost:4000/ws/whiteboard/room-123',
    roomId: 'room-123', // Use unique room ID per whiteboard
  });

  return (
    <div className="h-screen w-screen flex overflow-hidden relative">
      {/* ... existing UI ... */}
      
      <div className="flex-1">
        <Tldraw store={store} />
      </div>
    </div>
  );
}
```

### Step 4: Room-based Collaboration

Create a system where each whiteboard has a unique room ID:

```tsx
// Get room ID from URL or database
const roomId = useParams().whiteboardId;

const store = useSync({
  uri: `ws://localhost:4000/ws/whiteboard/${roomId}`,
  roomId: roomId,
});
```

## 📚 Resources

- [Tldraw Docs](https://tldraw.dev/)
- [Tldraw Sync (Multiplayer)](https://tldraw.dev/docs/multiplayer)
- [Yjs - CRDT for collaboration](https://github.com/yjs/yjs)
- [Y-WebSocket](https://github.com/yjs/y-websocket)

## 🔒 Security Considerations

When implementing collaboration:

1. **Authenticate WebSocket connections** - Verify JWT tokens
2. **Authorize room access** - Ensure users can only join whiteboards they own/are invited to
3. **Rate limiting** - Prevent spam and abuse
4. **Persistence** - Save whiteboard state to database
5. **Cursor presence** - Show other users' cursors and names

## 🎯 Next Steps

1. Create whiteboard rooms (database table)
2. Implement WebSocket handler in Go backend
3. Add room ID to URL structure (`/whiteboard/:roomId`)
4. Install collaboration packages
5. Update Whiteboard component with sync logic
6. Add user presence indicators
7. Implement whiteboard save/load functionality
