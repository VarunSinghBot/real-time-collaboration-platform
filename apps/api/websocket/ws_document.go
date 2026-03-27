package websocket

// ws_document.go — y-websocket–compatible collaborative document handler.
//
// Protocol summary (binary messages only):
//   Message type 0 (sync):
//     sub-type 0 — sync step 1: client sends its state vector
//     sub-type 1 — sync step 2 / update: client sends a Yjs update
//   Message type 3 (awareness): presence information, relay only
//
// On connection the server immediately sends the full document history as
// individual sync-update messages so the client can rebuild the document
// without waiting for another peer.  An empty sync-step-2 is sent first when
// there is no history so the client knows the handshake is complete.

import (
	"collab-platform/api/internal/api/utils"
	"log"
	"net/http"
	"sync"

	"github.com/go-chi/chi/v5"
	gows "github.com/gorilla/websocket"
)

// msgTypeSync and msgTypeAwareness are the first-byte message-type markers used
// by the y-websocket protocol (encoded as single-byte varints for values < 128).
const (
	msgTypeSync      byte = 0x00
	msgTypeAwareness byte = 0x01 // y-websocket messageAwareness = 1
	syncStep1        byte = 0x00
	syncStep2Update  byte = 0x01
)

// emptySyncStep2 is a y-websocket sync-step-2 message carrying an empty Yjs
// update. The y-protocols decoder (readVarUint8Array) expects a varint length
// prefix followed by the actual bytes, so the payload is:
//
//	[msgTypeSync=0][syncStep2=1][length=2][0x00][0x00]
//
// where [0x00, 0x00] is the canonical empty Yjs update (0 structs + 0 deletes).
var emptySyncStep2 = []byte{msgTypeSync, syncStep2Update, 0x02, 0x00, 0x00}

// wrapAsUpdate wraps raw Yjs update bytes in a y-websocket sync-update message.
func wrapAsUpdate(update []byte) []byte {
	msg := make([]byte, 2+len(update))
	msg[0] = msgTypeSync
	msg[1] = syncStep2Update
	copy(msg[2:], update)
	return msg
}

// ── Room management ──────────────────────────────────────────────────────────

type docRoom struct {
	mu      sync.RWMutex
	clients map[*docClient]bool
	// updates stores the raw Yjs update payloads (without the 2-byte sync wrapper).
	// Every binary update received from any editing client is appended here so
	// late-joiners can reconstruct the full document state.
	updates [][]byte
}

type docClient struct {
	conn *gows.Conn
	mu   sync.Mutex
}

var (
	docRooms   = make(map[string]*docRoom)
	docRoomsMu sync.RWMutex
)

func getOrCreateDocRoom(roomID string) *docRoom {
	docRoomsMu.Lock()
	defer docRoomsMu.Unlock()
	if r, ok := docRooms[roomID]; ok {
		return r
	}
	r := &docRoom{clients: make(map[*docClient]bool)}
	docRooms[roomID] = r
	return r
}

func (r *docRoom) add(c *docClient) {
	r.mu.Lock()
	r.clients[c] = true
	r.mu.Unlock()
}

func (r *docRoom) remove(roomID string, c *docClient) {
	r.mu.Lock()
	delete(r.clients, c)
	empty := len(r.clients) == 0
	r.mu.Unlock()
	if empty {
		docRoomsMu.Lock()
		delete(docRooms, roomID)
		docRoomsMu.Unlock()
	}
}

// send writes a binary message to one client.
func (c *docClient) send(msg []byte) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if err := c.conn.WriteMessage(gows.BinaryMessage, msg); err != nil {
		log.Printf("[doc-ws] send error: %v", err)
	}
}

// broadcast sends a binary message to every client in the room except sender.
func (r *docRoom) broadcast(sender *docClient, msg []byte) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for c := range r.clients {
		if c != sender {
			c.send(msg)
		}
	}
}

// broadcastAll sends a binary message to every client including the sender.
func (r *docRoom) broadcastAll(msg []byte) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for c := range r.clients {
		c.send(msg)
	}
}

// ── Handler ──────────────────────────────────────────────────────────────────

// HandleDocumentWS handles WebSocket connections for collaborative document
// editing using the y-websocket binary protocol.
//
// Route: GET /ws/document/{roomId}
// Auth:  JWT via ?token= query param (set by the frontend before opening the WS)
func HandleDocumentWS(w http.ResponseWriter, r *http.Request) {
	// Room ID from URL path param (/ws/document/{roomId}) — set by y-websocket
	// which appends the room name as a path segment.
	roomID := chi.URLParam(r, "roomId")
	if roomID == "" {
		roomID = r.URL.Query().Get("room") // fallback
	}
	if roomID == "" {
		http.Error(w, "room ID required", http.StatusBadRequest)
		return
	}

	// Authenticate
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "authentication token required", http.StatusUnauthorized)
		return
	}
	claims, err := utils.ValidateJWT(token)
	if err != nil {
		http.Error(w, "invalid or expired token", http.StatusUnauthorized)
		return
	}

	permission := r.URL.Query().Get("permission")
	if permission == "" {
		permission = "view"
	}

	// Upgrade HTTP → WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[doc-ws] upgrade error room=%s: %v", roomID, err)
		return
	}

	room := getOrCreateDocRoom(roomID)
	client := &docClient{conn: conn}
	room.add(client)
	log.Printf("[doc-ws] %s joined room=%s perm=%s", claims.Email, roomID, permission)

	// ── Send document history to the new client ───────────────────────────
	// This lets a solo user see a previously saved document immediately, and
	// lets late-joining collaborators reconstruct the current state even if
	// the original author has already closed their tab.
	room.mu.RLock()
	snapshot := make([][]byte, len(room.updates))
	copy(snapshot, room.updates)
	room.mu.RUnlock()

	if len(snapshot) == 0 {
		// No history — send empty sync step 2 to complete the handshake so
		// the client knows the server has no additional state.
		client.send(emptySyncStep2)
	} else {
		// Send each stored update; the client applies them in order and ends
		// up with the full document.
		for _, upd := range snapshot {
			client.send(wrapAsUpdate(upd))
		}
	}

	// ── Clean up on disconnect ────────────────────────────────────────────
	defer func() {
		room.remove(roomID, client)
		conn.Close()
		log.Printf("[doc-ws] %s left room=%s", claims.Email, roomID)
	}()

	// ── Read loop ─────────────────────────────────────────────────────────
	for {
		mt, msg, err := conn.ReadMessage()
		if err != nil {
			if gows.IsUnexpectedCloseError(err, gows.CloseGoingAway, gows.CloseNormalClosure) {
				log.Printf("[doc-ws] read error %s room=%s: %v", claims.Email, roomID, err)
			}
			break
		}

		if mt != gows.BinaryMessage || len(msg) < 1 {
			continue
		}

		switch msg[0] {
		case msgTypeSync:
			if len(msg) < 2 {
				continue
			}
			switch msg[1] {
			case syncStep1:
				// Client is requesting the server's current state.
				// Reply by replaying all stored updates (same as we do on connect).
				room.mu.RLock()
				snap := make([][]byte, len(room.updates))
				copy(snap, room.updates)
				room.mu.RUnlock()

				if len(snap) == 0 {
					client.send(emptySyncStep2)
				} else {
					for _, upd := range snap {
						client.send(wrapAsUpdate(upd))
					}
				}

			case syncStep2Update:
				// Client is sending a document update.
				if permission == "view" {
					continue // ignore edits from view-only clients
				}
				updatePayload := msg[2:] // strip [msgTypeSync][syncStep2Update]
				if len(updatePayload) == 0 {
					continue
				}
				// Persist the update so future clients can catch up.
				room.mu.Lock()
				room.updates = append(room.updates, updatePayload)
				room.mu.Unlock()
				// Forward the original message (with wrapper) to other clients.
				room.broadcast(client, msg)
			}

		case msgTypeAwareness:
			// Awareness carries ephemeral presence info (cursor, user colour).
			// Relay to everyone else; do NOT persist.
			room.broadcast(client, msg)

		default:
			// Unknown message type — relay to other clients unchanged.
			room.broadcast(client, msg)
		}
	}
}
