package middlewares

import (
	"net/http"
	"sync"
	"time"
)

// Rate limiter using token bucket algorithm
type RateLimiter struct {
	visitors map[string]*Visitor
	mu       sync.RWMutex
	rate     int           // requests per window
	window   time.Duration // time window
}

type Visitor struct {
	limiter  *TokenBucket
	lastSeen time.Time
}

type TokenBucket struct {
	tokens    float64
	capacity  float64
	rate      float64 // tokens per second
	lastCheck time.Time
	mu        sync.Mutex
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(rate int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		visitors: make(map[string]*Visitor),
		rate:     rate,
		window:   window,
	}

	// Cleanup old visitors every 5 minutes
	go rl.cleanupVisitors()

	return rl
}

// Allow checks if a request should be allowed
func (rl *RateLimiter) Allow(ip string) bool {
	rl.mu.Lock()
	visitor, exists := rl.visitors[ip]
	if !exists {
		tokensPerSecond := float64(rl.rate) / rl.window.Seconds()
		visitor = &Visitor{
			limiter: &TokenBucket{
				tokens:    float64(rl.rate),
				capacity:  float64(rl.rate),
				rate:      tokensPerSecond,
				lastCheck: time.Now(),
			},
			lastSeen: time.Now(),
		}
		rl.visitors[ip] = visitor
	}
	rl.mu.Unlock()

	visitor.lastSeen = time.Now()
	return visitor.limiter.Allow()
}

// Allow checks if a token is available
func (tb *TokenBucket) Allow() bool {
	tb.mu.Lock()
	defer tb.mu.Unlock()

	now := time.Now()
	elapsed := now.Sub(tb.lastCheck).Seconds()
	tb.lastCheck = now

	// Refill tokens
	tb.tokens += elapsed * tb.rate
	if tb.tokens > tb.capacity {
		tb.tokens = tb.capacity
	}

	// Check if we have a token
	if tb.tokens >= 1.0 {
		tb.tokens -= 1.0
		return true
	}

	return false
}

// cleanupVisitors removes visitors that haven't been seen in 5 minutes
func (rl *RateLimiter) cleanupVisitors() {
	for {
		time.Sleep(5 * time.Minute)
		rl.mu.Lock()
		for ip, visitor := range rl.visitors {
			if time.Since(visitor.lastSeen) > 5*time.Minute {
				delete(rl.visitors, ip)
			}
		}
		rl.mu.Unlock()
	}
}

// RateLimitMiddleware creates a rate limiting middleware
func RateLimitMiddleware(limiter *RateLimiter) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := getIP(r)

			if !limiter.Allow(ip) {
				w.Header().Set("Retry-After", "60")
				http.Error(w, `{"error": "Rate limit exceeded. Please try again later."}`, http.StatusTooManyRequests)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// getIP extracts the real IP address from the request
func getIP(r *http.Request) string {
	// Check X-Forwarded-For header
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		return forwarded
	}

	// Check X-Real-IP header
	realIP := r.Header.Get("X-Real-IP")
	if realIP != "" {
		return realIP
	}

	// Fall back to RemoteAddr
	return r.RemoteAddr
}

// Specific rate limiters
var (
	// 5 requests per 15 minutes for login/signup (brute-force protection)
	AuthRateLimiter = NewRateLimiter(5, 15*time.Minute)

	// 60 requests per 15 minutes for token refresh.
	// Access tokens expire every 15 min so the client legitimately fires one
	// refresh per expiry.  60 gives ~4x headroom for retries without enabling
	// meaningful brute-force abuse of a cryptographically random refresh token.
	RefreshRateLimiter = NewRateLimiter(60, 15*time.Minute)

	// 30 requests per 15 minutes for logout (user-or-client-initiated).
	LogoutRateLimiter = NewRateLimiter(30, 15*time.Minute)

	// 100 requests per minute for general API endpoints
	APIRateLimiter = NewRateLimiter(100, 1*time.Minute)

	// 10 requests per minute for OAuth endpoints
	OAuthRateLimiter = NewRateLimiter(10, 1*time.Minute)
)
