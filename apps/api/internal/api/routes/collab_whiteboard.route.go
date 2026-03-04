package routes

import (
	"collab-platform/api/internal/api/controllers"
	"collab-platform/api/internal/api/middlewares"

	"github.com/go-chi/chi/v5"
)

func SetupCollabWhiteboardRoutes(r chi.Router) {
	r.Route("/collab-whiteboard", func(r chi.Router) {
		// All routes require authentication
		r.Use(middlewares.AuthMiddleware)
		r.Use(middlewares.RateLimitMiddleware(middlewares.APIRateLimiter))

		// Whiteboard CRUD
		r.Post("/", controllers.CreateCollabWhiteboard)
		r.Get("/", controllers.ListCollabWhiteboards)
		r.Get("/{id}", controllers.GetCollabWhiteboard)
		r.Put("/{id}", controllers.UpdateCollabWhiteboard)
		r.Delete("/{id}", controllers.DeleteCollabWhiteboard)

		// Save whiteboard data
		r.Post("/{id}/save", controllers.SaveCollabWhiteboardData)

		// Member management
		r.Post("/{id}/members", controllers.AddMember)
		r.Get("/{id}/members", controllers.ListMembers)
		r.Put("/{id}/members/{memberId}", controllers.UpdateMember)
		r.Delete("/{id}/members/{memberId}", controllers.RemoveMember)
	})
}
