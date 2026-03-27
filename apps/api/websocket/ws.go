package websocket

import (
	"collab-platform/api/internal/api/utils"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"sync/atomic"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Client represents a connected WebSocket user
type Client struct {
	Conn       *websocket.Conn
	UserID     string
	UserEmail  string
	RoomID     string
	Permission string // "owner", "edit", or "view"
	mu         sync.Mutex
}

// WSMessage is the message structure sent over WebSocket
type WSMessage struct {
	Type    string          `json:"type"`    // "draw", "presence", "sync", "error"
	Payload json.RawMessage `json:"payload"` // Tldraw diff data or presence info
	UserID  string          `json:"userId,omitempty"`
	Email   string          `json:"email,omitempty"`
}

// RoomManager manages all active WebSocket rooms
type RoomManager struct {
	rooms map[string]map[*Client]bool
	mu    sync.RWMutex
}

// activeConnections tracks the total number of connected WebSocket clients
// using sync/atomic for lock-free, thread-safe counting.
var activeConnections int64

var manager = &RoomManager{
	rooms: make(map[string]map[*Client]bool),
}

// GetManager returns the global room manager instance
func GetManager() *RoomManager {
	return manager
}

// AddClient adds a client to a room
func (rm *RoomManager) AddClient(roomID string, client *Client) {
	rm.mu.Lock()
	defer rm.mu.Unlock()
	if _, ok := rm.rooms[roomID]; !ok {
		rm.rooms[roomID] = make(map[*Client]bool)
	}
	rm.rooms[roomID][client] = true
	atomic.AddInt64(&activeConnections, 1)
}

// RemoveClient removes a client from a room
func (rm *RoomManager) RemoveClient(roomID string, client *Client) {
	rm.mu.Lock()
	defer rm.mu.Unlock()
	if clients, ok := rm.rooms[roomID]; ok {
		delete(clients, client)
		atomic.AddInt64(&activeConnections, -1)
		if len(clients) == 0 {
			delete(rm.rooms, roomID)
		}
	}
}

// GetActiveConnectionCount returns the current number of active WebSocket
// connections using an atomic load (lock-free read).
func GetActiveConnectionCount() int64 {
	return atomic.LoadInt64(&activeConnections)
}

// BroadcastToRoom sends a message to all clients in a room except the sender
func (rm *RoomManager) BroadcastToRoom(roomID string, sender *Client, message []byte) {
	rm.mu.RLock()
	defer rm.mu.RUnlock()
	clients, ok := rm.rooms[roomID]
	if !ok {
		return
	}
	for client := range clients {
		if client != sender {
			client.mu.Lock()
			err := client.Conn.WriteMessage(websocket.TextMessage, message)
			client.mu.Unlock()
			if err != nil {
				log.Printf("Error broadcasting to client %s: %v", client.UserEmail, err)
			}
		}
	}
}

// BroadcastToAll sends a message to ALL clients in a room including the sender
func (rm *RoomManager) BroadcastToAll(roomID string, message []byte) {
	rm.mu.RLock()
	defer rm.mu.RUnlock()
	clients, ok := rm.rooms[roomID]
	if !ok {
		return
	}
	for client := range clients {
		client.mu.Lock()
		err := client.Conn.WriteMessage(websocket.TextMessage, message)
		client.mu.Unlock()
		if err != nil {
			log.Printf("Error broadcasting to client %s: %v", client.UserEmail, err)
		}
	}
}

// GetPresenceList returns a list of users currently in a room
func (rm *RoomManager) GetPresenceList(roomID string) []map[string]string {
	rm.mu.RLock()
	defer rm.mu.RUnlock()
	var users []map[string]string
	clients, ok := rm.rooms[roomID]
	if !ok {
		return users
	}
	for client := range clients {
		users = append(users, map[string]string{
			"userId":     client.UserID,
			"email":      client.UserEmail,
			"permission": client.Permission,
		})
	}
	return users
}

// HandleCollabWS handles WebSocket connections for collaborative whiteboard rooms
func HandleCollabWS(w http.ResponseWriter, r *http.Request) {
	roomID := chi.URLParam(r, "roomId")
	if roomID == "" {
		http.Error(w, "Room ID required", http.StatusBadRequest)
		return
	}

	// Authenticate via query param token
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Authentication token required", http.StatusUnauthorized)
		return
	}

	claims, err := utils.ValidateJWT(token)
	if err != nil {
		http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
		return
	}

	// Get permission from query param (set by frontend after REST API check)
	permission := r.URL.Query().Get("permission")
	if permission == "" {
		permission = "view"
	}

	// Upgrade to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &Client{
		Conn:       conn,
		UserID:     claims.UserID,
		UserEmail:  claims.Email,
		RoomID:     roomID,
		Permission: permission,
	}

	manager.AddClient(roomID, client)
	log.Printf("User %s joined room %s with %s permission", claims.Email, roomID, permission)

	// Notify others of user joining
	presenceMsg, _ := json.Marshal(WSMessage{
		Type: "presence",
		Payload: json.RawMessage(mustMarshal(map[string]interface{}{
			"action": "joined",
			"users":  manager.GetPresenceList(roomID),
		})),
		UserID: claims.UserID,
		Email:  claims.Email,
	})
	manager.BroadcastToAll(roomID, presenceMsg)

	// Handle messages
	defer func() {
		manager.RemoveClient(roomID, client)
		conn.Close()

		// Notify others of user leaving
		leaveMsg, _ := json.Marshal(WSMessage{
			Type: "presence",
			Payload: json.RawMessage(mustMarshal(map[string]interface{}{
				"action": "left",
				"users":  manager.GetPresenceList(roomID),
			})),
			UserID: claims.UserID,
			Email:  claims.Email,
		})
		manager.BroadcastToAll(roomID, leaveMsg)
		log.Printf("User %s left room %s", claims.Email, roomID)
	}()

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("WebSocket error for user %s in room %s: %v", claims.Email, roomID, err)
			}
			break
		}

		var wsMsg WSMessage
		if err := json.Unmarshal(msg, &wsMsg); err != nil {
			continue
		}

		switch wsMsg.Type {
		case "draw":
			// Only allow drawing if user has edit or owner permission
			if client.Permission == "view" {
				errMsg, _ := json.Marshal(WSMessage{
					Type:    "error",
					Payload: json.RawMessage(`{"message": "View-only access - cannot edit"}`),
				})
				client.mu.Lock()
				client.Conn.WriteMessage(websocket.TextMessage, errMsg)
				client.mu.Unlock()
				continue
			}
			// Broadcast the draw data to all other clients
			wsMsg.UserID = claims.UserID
			wsMsg.Email = claims.Email
			broadcastData, _ := json.Marshal(wsMsg)
			manager.BroadcastToRoom(roomID, client, broadcastData)

		case "sync":
			// Full sync request â€” broadcast to all others
			wsMsg.UserID = claims.UserID
			wsMsg.Email = claims.Email
			broadcastData, _ := json.Marshal(wsMsg)
			manager.BroadcastToRoom(roomID, client, broadcastData)

		case "cursor":
			// Cursor position updates â€” broadcast to others
			wsMsg.UserID = claims.UserID
			wsMsg.Email = claims.Email
			broadcastData, _ := json.Marshal(wsMsg)
			manager.BroadcastToRoom(roomID, client, broadcastData)
		}
	}
}

func mustMarshal(v interface{}) []byte {
	data, _ := json.Marshal(v)
	return data
}
