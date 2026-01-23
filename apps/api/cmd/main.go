package main

import (
	"log"
	"net/http"
	"os"

	"collab-platform/api/internal/api"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env
	godotenv.Load()

	// Connect DB
	api.ConnectDB()
	defer api.DisconnectDB()

	router := api.SetupRouter()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server running on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, router))
}
