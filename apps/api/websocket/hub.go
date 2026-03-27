package websocket

// ============================================================
// Unit 5: Concurrency — Channel-based WebSocket Hub
// Demonstrates: goroutines, channels, directional channels,
//               range over channel, select
// ============================================================
//
// This Hub provides an alternative, idiomatic Go approach to managing
// WebSocket connections using channels instead of mutexes. Instead of
// locking shared state, operations are serialized through channels and
// processed by a single goroutine (the Run loop).
//
// This pattern is used by the official Gorilla WebSocket chat example
// and eliminates the need for explicit mutex locking during broadcast.

// HubMessage wraps a message with its sender and target room
type HubMessage struct {
	RoomID  string
	Sender  *Client
	Data    []byte
	SendAll bool // if true, send to all clients including sender
}

// Hub manages WebSocket connections using channels instead of mutexes.
// All operations go through channels and are processed by a single
// goroutine, eliminating race conditions by design.
type Hub struct {
	// rooms holds all active clients grouped by room ID
	rooms map[string]map[*Client]bool

	// register is a channel to add a client to a room
	// chan *registration uses a directional send pattern
	register chan *registration

	// unregister is a channel to remove a client from a room
	unregister chan *registration

	// broadcast is a channel for broadcasting messages to rooms
	broadcast chan *HubMessage

	// stop signals the hub to shut down
	stop chan struct{}
}

// registration pairs a client with their target room
type registration struct {
	roomID string
	client *Client
	done   chan struct{} // signals completion back to caller
}

// NewHub creates a new Hub with initialized channels
func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[string]map[*Client]bool),
		register:   make(chan *registration),
		unregister: make(chan *registration),
		broadcast:  make(chan *HubMessage, 256), // buffered for performance
		stop:       make(chan struct{}),
	}
}

// Run starts the Hub's main event loop in a goroutine.
// It uses select to multiplex between register, unregister, broadcast,
// and stop channels — this is the idiomatic Go concurrency pattern.
func (h *Hub) Run() {
	for {
		select {
		case reg := <-h.register:
			// Add client to room
			if _, ok := h.rooms[reg.roomID]; !ok {
				h.rooms[reg.roomID] = make(map[*Client]bool)
			}
			h.rooms[reg.roomID][reg.client] = true
			close(reg.done) // signal completion

		case reg := <-h.unregister:
			// Remove client from room
			if clients, ok := h.rooms[reg.roomID]; ok {
				delete(clients, reg.client)
				if len(clients) == 0 {
					delete(h.rooms, reg.roomID)
				}
			}
			close(reg.done) // signal completion

		case msg := <-h.broadcast:
			// Broadcast message to all clients in the room
			clients, ok := h.rooms[msg.RoomID]
			if !ok {
				continue
			}
			for client := range clients {
				if !msg.SendAll && client == msg.Sender {
					continue // skip sender unless SendAll is true
				}
				client.mu.Lock()
				err := client.Conn.WriteMessage(1, msg.Data) // TextMessage = 1
				client.mu.Unlock()
				if err != nil {
					// Client disconnected — could queue for unregister
					continue
				}
			}

		case <-h.stop:
			// Graceful shutdown: close all connections
			for roomID, clients := range h.rooms {
				for client := range clients {
					client.Conn.Close()
				}
				delete(h.rooms, roomID)
			}
			return
		}
	}
}

// RegisterClient adds a client to a room via the register channel.
// Uses a directional channel pattern: the caller sends, the hub receives.
func (h *Hub) RegisterClient(roomID string, client *Client) {
	done := make(chan struct{})
	h.register <- &registration{
		roomID: roomID,
		client: client,
		done:   done,
	}
	<-done // wait for hub to process
}

// UnregisterClient removes a client from a room via the unregister channel.
func (h *Hub) UnregisterClient(roomID string, client *Client) {
	done := make(chan struct{})
	h.unregister <- &registration{
		roomID: roomID,
		client: client,
		done:   done,
	}
	<-done // wait for hub to process
}

// BroadcastToRoom sends a message to a room via the broadcast channel.
// The message is queued and processed by the hub's Run goroutine.
func (h *Hub) BroadcastToRoom(roomID string, sender *Client, data []byte) {
	h.broadcast <- &HubMessage{
		RoomID:  roomID,
		Sender:  sender,
		Data:    data,
		SendAll: false,
	}
}

// BroadcastToAll sends a message to all clients in a room including sender.
func (h *Hub) BroadcastToAll(roomID string, data []byte) {
	h.broadcast <- &HubMessage{
		RoomID:  roomID,
		Sender:  nil,
		Data:    data,
		SendAll: true,
	}
}

// Stop signals the hub goroutine to shut down gracefully.
func (h *Hub) Stop() {
	close(h.stop)
}

// DrainBroadcast reads all remaining messages from the broadcast channel.
// This demonstrates range over a channel — iterating until the channel is closed.
func (h *Hub) DrainBroadcast() []HubMessage {
	close(h.broadcast)
	var messages []HubMessage
	// Range over channel: iterates until the channel is closed
	for msg := range h.broadcast {
		messages = append(messages, *msg)
	}
	return messages
}

// GetRoomCount returns the number of active rooms (for monitoring)
func (h *Hub) GetRoomCount() int {
	return len(h.rooms)
}

// SendToChannel demonstrates directional channel usage.
// ch chan<- string is a send-only channel — you can only write to it.
// This function is exported for educational purposes.
func SendToChannel(ch chan<- string, message string) {
	ch <- message
}

// ReceiveFromChannel demonstrates directional channel usage.
// ch <-chan string is a receive-only channel — you can only read from it.
func ReceiveFromChannel(ch <-chan string) string {
	return <-ch
}
