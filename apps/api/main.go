package main

import (
	"net/http"

	"collab-platform/api/websocket"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	r.GET("/ws", websocket.HandleWS)

	r.Run(":4000")

}
