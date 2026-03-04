package middlewares

import (
	"collab-platform/api/internal/api/models"
	"collab-platform/api/internal/api/utils"
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"gorm.io/gorm"
)

type contextKey string

const UserContextKey contextKey = "user"

// GetDB returns the database from context
func GetDB(r *http.Request) *gorm.DB {
	db, ok := r.Context().Value("db").(*gorm.DB)
	if !ok {
		return nil
	}
	return db
}

// AuthMiddleware validates JWT tokens and adds user info to request context
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error": "Authorization header required"}`, http.StatusUnauthorized)
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, `{"error": "Invalid authorization header format"}`, http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]

		// Validate token
		claims, err := utils.ValidateJWT(tokenString)
		if err != nil {
			http.Error(w, `{"error": "Invalid or expired token"}`, http.StatusUnauthorized)
			return
		}

		// Add claims to request context under the typed key (for GetUserFromContext)
		// AND under the plain string key "userID" that all controllers read directly.
		ctx := context.WithValue(r.Context(), UserContextKey, claims)
		ctx = context.WithValue(ctx, "userID", claims.UserID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetUserFromContext extracts user claims from request context
func GetUserFromContext(r *http.Request) *utils.Claims {
	claims, ok := r.Context().Value(UserContextKey).(*utils.Claims)
	if !ok {
		return nil
	}
	return claims
}

// OptionalAuthMiddleware validates JWT if present but allows requests without auth
func OptionalAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")

		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				tokenString := parts[1]
				claims, err := utils.ValidateJWT(tokenString)
				if err == nil {
					ctx := context.WithValue(r.Context(), UserContextKey, claims)
					r = r.WithContext(ctx)
				}
			}
		}

		next.ServeHTTP(w, r)
	})
}

// MeHandler returns the current authenticated user's information
func MeHandler(w http.ResponseWriter, r *http.Request) {
	claims := GetUserFromContext(r)
	if claims == nil {
		http.Error(w, `{"error": "User not found in context"}`, http.StatusUnauthorized)
		return
	}

	// Optionally, fetch full user details from database
	db := GetDB(r)
	if db != nil {
		var user models.User
		if err := db.Where("id = ?", claims.UserID).First(&user).Error; err == nil {
			response := map[string]interface{}{
				"id":       user.ID,
				"email":    user.Email,
				"username": user.Username,
				"name":     user.Name,
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(response)
			return
		}
	}

	// Fallback to claims if DB fetch fails
	response := map[string]interface{}{
		"userId": claims.UserID,
		"email":  claims.Email,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
