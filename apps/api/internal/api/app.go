package api

import (
	"collab-platform/api/internal/api/models"
	"collab-platform/api/internal/api/routes"
	ws "collab-platform/api/websocket"
	"context"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
)

func SetupRouter() http.Handler {
	r := chi.NewRouter()

	// CORS middleware - parse multiple origins from comma-separated env var
	corsOrigins := strings.Split(os.Getenv("CORS_ORIGIN"), ",")
	for i := range corsOrigins {
		corsOrigins[i] = strings.TrimSpace(corsOrigins[i])
	}
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   corsOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Inject DB into context
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), "db", DB)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	})

	// JSON middleware example
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			next.ServeHTTP(w, r)
		})
	})

	// Routesswitch the
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message":   "Welcome to the API!",
			"endpoints": []string{"/api/auth/signup", "/api/auth/login", "/api/v1/users"},
		})
	})

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":    "OK",
			"timestamp": time.Now().UTC(),
		})
	})

	// WebSocket route (outside /api to avoid JSON middleware)
	r.Get("/ws/collab/{roomId}", ws.HandleCollabWS)

	// API routes
	r.Route("/api", func(r chi.Router) {
		// Auth routes
		routes.SetupAuthRoutes(r)

		// Private whiteboard routes
		routes.SetupWhiteboardRoutes(r)

		// Collaborative whiteboard routes
		routes.SetupCollabWhiteboardRoutes(r)

		// Example route: list users
		r.Route("/v1/users", func(r chi.Router) {
			r.Get("/", func(w http.ResponseWriter, r *http.Request) {
				var users []interface{}
				if err := DB.Model(&models.User{}).Find(&users).Error; err != nil {
					http.Error(w, err.Error(), 500)
					return
				}
				json.NewEncoder(w).Encode(users)
			})
		})
	})

	return r
}
