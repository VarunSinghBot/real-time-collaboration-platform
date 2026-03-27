package routes

import (
	"collab-platform/api/internal/api/controllers"
	"collab-platform/api/internal/api/middlewares"

	"github.com/go-chi/chi/v5"
)

func SetupDocumentRoutes(r chi.Router) {
	r.Route("/documents", func(r chi.Router) {
		// Apply JWT middleware to all document routes
		r.Use(middlewares.AuthMiddleware)

		// Create a new collaborative document
		r.Post("/", controllers.CreateDocument)

		// Get all documents for the authenticated user
		r.Get("/", controllers.GetDocuments)

		// Get a specific document by room code
		r.Get("/{roomCode}", controllers.GetDocument)

		// Update a document (title or content)
		r.Put("/{roomCode}", controllers.UpdateDocument)

		// Delete a document (owner only)
		r.Delete("/{roomCode}", controllers.DeleteDocument)

		// Add a member to a document
		r.Post("/{roomCode}/members", controllers.AddDocumentMember)
	})
}
