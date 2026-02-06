package routes

import (
	"collab-platform/api/internal/api/controllers"
	"collab-platform/api/internal/api/middlewares"

	"github.com/go-chi/chi/v5"
)

func SetupAuthRoutes(r chi.Router) {
	r.Route("/auth", func(r chi.Router) {
		// CSRF token endpoint (public, no rate limit)
		r.Get("/csrf-token", middlewares.GetCSRFToken)

		// Public auth routes with rate limiting
		r.Group(func(r chi.Router) {
			r.Use(middlewares.RateLimitMiddleware(middlewares.AuthRateLimiter))

			// Traditional email/password auth
			r.Post("/signup", controllers.Signup)
			r.Post("/login", controllers.Login)

			// Token management
			r.Post("/refresh", controllers.RefreshAccessToken)
			r.Post("/logout", controllers.RevokeRefreshToken)
		})

		// OAuth routes with rate limiting
		r.Group(func(r chi.Router) {
			r.Use(middlewares.RateLimitMiddleware(middlewares.OAuthRateLimiter))

			// Google OAuth
			r.Get("/google", controllers.GetGoogleAuthURL)
			r.Get("/google/callback", controllers.GoogleOAuthCallback)
		})

		// Protected routes
		r.Group(func(r chi.Router) {
			r.Use(middlewares.AuthMiddleware)
			r.Use(middlewares.RateLimitMiddleware(middlewares.APIRateLimiter))

			// Get current user
			r.Get("/me", middlewares.MeHandler)

			// Revoke all sessions (logout from all devices)
			r.Post("/logout-all", controllers.RevokeAllRefreshTokens)
		})
	})
}
