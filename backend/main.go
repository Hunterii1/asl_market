package main

import (
	"fmt"
	"log"

	"asl-market-backend/config"
	"asl-market-backend/models"
	"asl-market-backend/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	config.LoadConfig()

	// Connect to database
	models.ConnectDatabase()

	// Set Gin mode
	gin.SetMode(gin.ReleaseMode)

	// Create Gin router
	router := gin.Default()

	// Setup CORS
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = config.AppConfig.CORS.AllowedOrigins
	corsConfig.AllowMethods = config.AppConfig.CORS.AllowedMethods
	corsConfig.AllowHeaders = config.AppConfig.CORS.AllowedHeaders
	corsConfig.AllowCredentials = true
	router.Use(cors.New(corsConfig))

	// Setup routes
	routes.SetupRoutes(router)

	// Start server
	serverAddr := fmt.Sprintf("%s:%s", config.AppConfig.Server.Host, config.AppConfig.Server.Port)
	log.Printf("Server starting on %s", serverAddr)
	log.Printf("API Documentation: http://%s/health", serverAddr)

	if err := router.Run(serverAddr); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
