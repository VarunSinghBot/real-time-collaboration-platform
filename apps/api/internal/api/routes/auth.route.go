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

		// Login / signup — strict rate limit (brute-force protection)
		r.Group(func(r chi.Router) {
			r.Use(middlewares.RateLimitMiddleware(middlewares.AuthRateLimiter))
			r.Post("/signup", controllers.Signup)
			r.Post("/login", controllers.Login)
		})

		// Token refresh — generous limit; this is an automated client call
		// fired once per access-token lifetime (~15 min).  Keeping it in the
		// same tight bucket as login caused 429s in normal usage.
		r.Group(func(r chi.Router) {
			r.Use(middlewares.RateLimitMiddleware(middlewares.RefreshRateLimiter))
			r.Post("/refresh", controllers.RefreshAccessToken)
		})

		// Logout — also client-initiated but less frequent; moderate limit
		r.Group(func(r chi.Router) {
			r.Use(middlewares.RateLimitMiddleware(middlewares.LogoutRateLimiter))
			r.Post("/logout", controllers.RevokeRefreshToken)
		})

		// OAuth routes with rate limiting
		r.Group(func(r chi.Router) {
			r.Use(middlewares.RateLimitMiddleware(middlewares.OAuthRateLimiter))

			// Google OAuth
			r.Get("/google", controllers.GetGoogleAuthURL)
			r.Get("/google/callback", controllers.GoogleOAuthCallback)
			r.Post("/google/callback", controllers.GoogleOAuthCallback)
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
