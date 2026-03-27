package websocket

import (
	"fmt"
	"sync"
	"sync/atomic"
	"testing"
)

// ============================================================
// Concurrency — Race Condition Detection Tests
// Demonstrates: race condition scenarios, mutex validation
// Run with: go test -race -v ./websocket/
// ============================================================

// TestRoomManager_ConcurrentAccess spawns multiple goroutines that
// simultaneously add and remove clients from the RoomManager.
// Running this with `go test -race` verifies that the mutex-based
// synchronization correctly prevents race conditions.
func TestRoomManager_ConcurrentAccess(t *testing.T) {
	rm := &RoomManager{
		rooms: make(map[string]map[*Client]bool),
	}

	const numGoroutines = 50
	const roomID = "test-room"
	var wg sync.WaitGroup

	// Spawn goroutines that concurrently add clients
	clients := make([]*Client, numGoroutines)
	for i := 0; i < numGoroutines; i++ {
		clients[i] = &Client{
			UserID:    fmt.Sprintf("user-%d", i),
			UserEmail: fmt.Sprintf("user%d@test.com", i),
			RoomID:    roomID,
		}
	}

	// Phase 1: Concurrent AddClient
	wg.Add(numGoroutines)
	for i := 0; i < numGoroutines; i++ {
		go func(idx int) {
			defer wg.Done()
			rm.AddClient(roomID, clients[idx])
		}(i)
	}
	wg.Wait()

	// Verify all clients were added
	presence := rm.GetPresenceList(roomID)
	if len(presence) != numGoroutines {
		t.Errorf("Expected %d clients, got %d", numGoroutines, len(presence))
	}

	// Phase 2: Concurrent GetPresenceList (read operations — no nil Conn needed)
	wg.Add(numGoroutines)
	for i := 0; i < numGoroutines; i++ {
		go func() {
			defer wg.Done()
			rm.GetPresenceList(roomID)
		}()
	}
	wg.Wait()

	// Phase 3: Concurrent RemoveClient
	wg.Add(numGoroutines)
	for i := 0; i < numGoroutines; i++ {
		go func(idx int) {
			defer wg.Done()
			rm.RemoveClient(roomID, clients[idx])
		}(i)
	}
	wg.Wait()

	// Verify all clients were removed
	presence = rm.GetPresenceList(roomID)
	if len(presence) != 0 {
		t.Errorf("Expected 0 clients after removal, got %d", len(presence))
	}
}

// TestRoomManager_ConcurrentRooms tests concurrent access across multiple rooms
func TestRoomManager_ConcurrentRooms(t *testing.T) {
	rm := &RoomManager{
		rooms: make(map[string]map[*Client]bool),
	}

	const numRooms = 10
	const clientsPerRoom = 5
	var wg sync.WaitGroup

	// Concurrently add clients to different rooms
	wg.Add(numRooms * clientsPerRoom)
	for r := 0; r < numRooms; r++ {
		for c := 0; c < clientsPerRoom; c++ {
			go func(room, client int) {
				defer wg.Done()
				roomID := fmt.Sprintf("room-%d", room)
				cl := &Client{
					UserID:    fmt.Sprintf("user-%d-%d", room, client),
					UserEmail: fmt.Sprintf("user%d_%d@test.com", room, client),
					RoomID:    roomID,
				}
				rm.AddClient(roomID, cl)
			}(r, c)
		}
	}
	wg.Wait()

	// Verify each room has the correct number of clients
	for r := 0; r < numRooms; r++ {
		roomID := fmt.Sprintf("room-%d", r)
		presence := rm.GetPresenceList(roomID)
		if len(presence) != clientsPerRoom {
			t.Errorf("Room %s: expected %d clients, got %d", roomID, clientsPerRoom, len(presence))
		}
	}
}

// TestAtomicConnectionCounter verifies the atomic connection counter
func TestAtomicConnectionCounter(t *testing.T) {
	// Reset counter for test isolation
	atomic.StoreInt64(&activeConnections, 0)

	rm := &RoomManager{
		rooms: make(map[string]map[*Client]bool),
	}

	// Add clients and verify counter increments
	client1 := &Client{UserID: "u1", UserEmail: "u1@test.com"}
	client2 := &Client{UserID: "u2", UserEmail: "u2@test.com"}

	rm.AddClient("room-1", client1)
	if count := GetActiveConnectionCount(); count != 1 {
		t.Errorf("After 1 add: expected count=1, got %d", count)
	}

	rm.AddClient("room-1", client2)
	if count := GetActiveConnectionCount(); count != 2 {
		t.Errorf("After 2 adds: expected count=2, got %d", count)
	}

	// Remove and verify counter decrements
	rm.RemoveClient("room-1", client1)
	if count := GetActiveConnectionCount(); count != 1 {
		t.Errorf("After 1 remove: expected count=1, got %d", count)
	}

	rm.RemoveClient("room-1", client2)
	if count := GetActiveConnectionCount(); count != 0 {
		t.Errorf("After 2 removes: expected count=0, got %d", count)
	}
}

// TestAtomicCounter_ConcurrentAccess tests the atomic counter under concurrent load
func TestAtomicCounter_ConcurrentAccess(t *testing.T) {
	atomic.StoreInt64(&activeConnections, 0)

	rm := &RoomManager{
		rooms: make(map[string]map[*Client]bool),
	}

	const n = 100
	var wg sync.WaitGroup

	// Concurrently add clients
	clients := make([]*Client, n)
	wg.Add(n)
	for i := 0; i < n; i++ {
		clients[i] = &Client{
			UserID:    fmt.Sprintf("user-%d", i),
			UserEmail: fmt.Sprintf("user%d@test.com", i),
		}
		go func(idx int) {
			defer wg.Done()
			rm.AddClient("counter-room", clients[idx])
		}(i)
	}
	wg.Wait()

	if count := GetActiveConnectionCount(); count != int64(n) {
		t.Errorf("After %d concurrent adds: expected count=%d, got %d", n, n, count)
	}

	// Concurrently remove all clients
	wg.Add(n)
	for i := 0; i < n; i++ {
		go func(idx int) {
			defer wg.Done()
			rm.RemoveClient("counter-room", clients[idx])
		}(i)
	}
	wg.Wait()

	if count := GetActiveConnectionCount(); count != 0 {
		t.Errorf("After %d concurrent removes: expected count=0, got %d", n, count)
	}
}
