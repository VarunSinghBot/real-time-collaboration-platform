package middlewares

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"sync"
	"time"
)

// CSRF token store
type CSRFStore struct {
	tokens map[string]time.Time
	mu     sync.RWMutex
}

var csrfStore = &CSRFStore{
	tokens: make(map[string]time.Time),
}

// Cleanup expired tokens every 10 minutes
func init() {
	go func() {
		for {
			time.Sleep(10 * time.Minute)
			csrfStore.mu.Lock()
			now := time.Now()
			for token, expiry := range csrfStore.tokens {
				if now.After(expiry) {
					delete(csrfStore.tokens, token)
				}
			}
			csrfStore.mu.Unlock()
		}
	}()
}

// GenerateCSRFToken creates a new CSRF token
func GenerateCSRFToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	token := base64.URLEncoding.EncodeToString(b)

	// Store token with 1 hour expiry
	csrfStore.mu.Lock()
	csrfStore.tokens[token] = time.Now().Add(1 * time.Hour)
	csrfStore.mu.Unlock()

	return token, nil
}

// ValidateCSRFToken checks if a CSRF token is valid
func ValidateCSRFToken(token string) bool {
	csrfStore.mu.RLock()
	expiry, exists := csrfStore.tokens[token]
	csrfStore.mu.RUnlock()

	if !exists {
		return false
	}

	if time.Now().After(expiry) {
		// Token expired, remove it
		csrfStore.mu.Lock()
		delete(csrfStore.tokens, token)
		csrfStore.mu.Unlock()
		return false
	}

	return true
}

// CSRFProtection middleware validates CSRF tokens for state-changing requests
func CSRFProtection(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Only check CSRF for state-changing methods
		if r.Method == "POST" || r.Method == "PUT" || r.Method == "DELETE" || r.Method == "PATCH" {
			token := r.Header.Get("X-CSRF-Token")
			if token == "" {
				http.Error(w, `{"error": "CSRF token missing"}`, http.StatusForbidden)
				return
			}

			if !ValidateCSRFToken(token) {
				http.Error(w, `{"error": "Invalid or expired CSRF token"}`, http.StatusForbidden)
				return
			}
		}

		next.ServeHTTP(w, r)
	})
}

// GetCSRFToken endpoint to get a new CSRF token
func GetCSRFToken(w http.ResponseWriter, r *http.Request) {
	token, err := GenerateCSRFToken()
	if err != nil {
		http.Error(w, `{"error": "Failed to generate CSRF token"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"csrfToken": "` + token + `"}`))
}
