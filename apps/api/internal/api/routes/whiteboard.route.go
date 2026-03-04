package routes

import (
	"collab-platform/api/internal/api/controllers"
	"collab-platform/api/internal/api/middlewares"

	"github.com/go-chi/chi/v5"
)

func SetupWhiteboardRoutes(r chi.Router) {
	r.Route("/whiteboard", func(r chi.Router) {
		// All whiteboard routes require authentication
		r.Use(middlewares.AuthMiddleware)
		r.Use(middlewares.RateLimitMiddleware(middlewares.APIRateLimiter))

		// Private whiteboard endpoints
		r.Get("/private", controllers.GetUserWhiteboard)
		r.Post("/private", controllers.SaveUserWhiteboard)
		r.Delete("/private", controllers.DeleteUserWhiteboard)
	})
}
