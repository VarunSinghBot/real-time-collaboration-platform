package main

// ============================================================
// Unit 5: Concurrency — Graceful Shutdown
// Demonstrates: channels, select, sync.WaitGroup, context,
//               concurrency vs parallelism
// ============================================================
//
// CONCURRENCY VS PARALLELISM:
//   - Concurrency: structuring code to handle multiple tasks that can
//     make progress independently (e.g. handling HTTP requests + listening
//     for OS signals simultaneously using goroutines and channels).
//   - Parallelism: actually executing multiple tasks at the same time
//     on multiple CPU cores (e.g. Go's runtime schedules goroutines
//     across available cores automatically).
//
// This main.go demonstrates concurrency: the HTTP server runs in one
// goroutine while signal handling runs in another. They communicate
// through a channel, and select multiplexes between them.

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"collab-platform/api/internal/api"
	ws "collab-platform/api/websocket"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env
	godotenv.Load()

	// Connect DB
	api.ConnectDB()
	defer api.DisconnectDB()

	router := api.SetupRouter()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Create HTTP server
	server := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	// ── Channel for OS signals ────────────────────────────────────────
	// os.Signal is sent through this channel when SIGINT (Ctrl+C) or
	// SIGTERM is received. This is the channel-based concurrency pattern.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// ── Channel for server errors ─────────────────────────────────────
	serverErr := make(chan error, 1)

	// ── WaitGroup to track background goroutines ──────────────────────
	// WaitGroup lets the main goroutine wait for all background work
	// (like the HTTP server and the hub) to finish before exiting.
	var wg sync.WaitGroup

	// Start the channel-based WebSocket hub in a goroutine
	hub := ws.NewHub()
	wg.Add(1)
	go func() {
		defer wg.Done()
		log.Println("🔌 WebSocket Hub started (channel-based)")
		hub.Run()
		log.Println("🔌 WebSocket Hub stopped")
	}()

	// Start HTTP server in a goroutine
	wg.Add(1)
	go func() {
		defer wg.Done()
		log.Printf("🚀 Server running on port %s", port)
		log.Printf("📊 Active WS connections: %d", ws.GetActiveConnectionCount())
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			serverErr <- err
		}
	}()

	// ── Select: multiplex between signal and server error ─────────────
	// select blocks until one of the channels receives a value.
	// This is how Go handles multiple concurrent events without polling.
	select {
	case sig := <-quit:
		log.Printf("\n⚠️  Received signal: %v", sig)
		log.Println("🔄 Starting graceful shutdown...")

	case err := <-serverErr:
		log.Printf("❌ Server error: %v", err)
		log.Println("🔄 Shutting down due to error...")
	}

	// ── Graceful shutdown with context timeout ────────────────────────
	// Give in-flight requests 30 seconds to complete before force-closing.
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Stop the WebSocket hub
	hub.Stop()

	// Log active connections before shutdown
	log.Printf("📊 Active WS connections at shutdown: %d", ws.GetActiveConnectionCount())

	// Shutdown the HTTP server gracefully
	if err := server.Shutdown(ctx); err != nil {
		log.Printf("❌ Server forced to shutdown: %v", err)
	}

	// Wait for all goroutines to finish
	log.Println("⏳ Waiting for background tasks to complete...")
	wg.Wait()

	log.Println("✅ Server shutdown complete")
}

