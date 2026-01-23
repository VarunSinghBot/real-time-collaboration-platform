package routes

import (
	"collab-platform/api/internal/api/controllers"
	"collab-platform/api/internal/api/middlewares"

	"github.com/go-chi/chi/v5"
)

func SetupAuthRoutes(r chi.Router) {
	r.Route("/auth", func(r chi.Router) {
		// Public routes
		r.Post("/signup", controllers.Signup)
		r.Post("/login", controllers.Login)

		// Protected routes
		r.Group(func(r chi.Router) {
			r.Use(middlewares.AuthMiddleware)
			r.Get("/me", middlewares.MeHandler)
		})
	})
}
