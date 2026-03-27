package middlewares

import (
	"testing"
	"time"
)

// ============================================================
// Testing — Rate Limiter Tests
// Demonstrates: table-driven tests, benchmarks
// ============================================================

// TestTokenBucket_TableDriven tests the token bucket algorithm
func TestTokenBucket_TableDriven(t *testing.T) {
	tests := []struct {
		name       string
		capacity   float64
		rate       float64 // tokens per second
		requests   int     // number of requests to make
		expectPass int     // how many should be allowed
	}{
		{
			name:       "all requests allowed within capacity",
			capacity:   5,
			rate:       1.0,
			requests:   5,
			expectPass: 5,
		},
		{
			name:       "excess requests denied",
			capacity:   3,
			rate:       1.0,
			requests:   5,
			expectPass: 3,
		},
		{
			name:       "single token capacity",
			capacity:   1,
			rate:       1.0,
			requests:   3,
			expectPass: 1,
		},
		{
			name:       "zero requests always pass",
			capacity:   10,
			rate:       1.0,
			requests:   0,
			expectPass: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tb := &TokenBucket{
				tokens:    tt.capacity,
				capacity:  tt.capacity,
				rate:      tt.rate,
				lastCheck: time.Now(),
			}

			passed := 0
			for i := 0; i < tt.requests; i++ {
				if tb.Allow() {
					passed++
				}
			}

			if passed != tt.expectPass {
				t.Errorf("expected %d requests to pass, got %d", tt.expectPass, passed)
			}
		})
	}
}

// TestTokenBucket_Refill verifies that tokens refill over time
func TestTokenBucket_Refill(t *testing.T) {
	tb := &TokenBucket{
		tokens:    1,
		capacity:  5,
		rate:      100.0, // 100 tokens per second (fast refill for testing)
		lastCheck: time.Now(),
	}

	// Use the one available token
	if !tb.Allow() {
		t.Fatal("First request should be allowed")
	}

	// All tokens consumed
	if tb.Allow() {
		t.Fatal("Second immediate request should be denied")
	}

	// Wait for refill (at 100 tokens/sec, 50ms gives ~5 tokens)
	time.Sleep(50 * time.Millisecond)

	if !tb.Allow() {
		t.Error("Request after refill should be allowed")
	}
}

// TestRateLimiter_MultipleIPs verifies that rate limiting is per-IP
func TestRateLimiter_MultipleIPs(t *testing.T) {
	rl := &RateLimiter{
		visitors: make(map[string]*Visitor),
		rate:     2,
		window:   time.Minute,
	}

	// IP 1: use all tokens
	rl.Allow("192.168.1.1")
	rl.Allow("192.168.1.1")
	if rl.Allow("192.168.1.1") {
		t.Error("IP 1 should be rate limited after 2 requests")
	}

	// IP 2: should still have tokens (separate bucket)
	if !rl.Allow("192.168.1.2") {
		t.Error("IP 2 should not be rate limited")
	}
}

// ============================================================
// Benchmarks
// Run with: go test -bench=. -benchmem
// ============================================================

// BenchmarkTokenBucket_Allow measures token bucket throughput
func BenchmarkTokenBucket_Allow(b *testing.B) {
	tb := &TokenBucket{
		tokens:    float64(b.N),
		capacity:  float64(b.N),
		rate:      1000.0,
		lastCheck: time.Now(),
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		tb.Allow()
	}
}

// BenchmarkRateLimiter_Allow measures rate limiter throughput with concurrent IPs
func BenchmarkRateLimiter_Allow(b *testing.B) {
	rl := &RateLimiter{
		visitors: make(map[string]*Visitor),
		rate:     1000,
		window:   time.Minute,
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		rl.Allow("bench-ip")
	}
}
