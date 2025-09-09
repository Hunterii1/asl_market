package main

import (
	"fmt"
	"log"

	"asl-market-backend/config"
	"asl-market-backend/models"
	"asl-market-backend/routes"
	"asl-market-backend/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	config.LoadConfig()

	// Connect to database
	models.ConnectDatabase()

	// Initialize Telegram bot service
	telegramService := services.GetTelegramService()
	log.Printf("Telegram bot initialized for admin IDs: %v", services.ADMIN_IDS)

	// Initialize SMS service
	if config.AppConfig.SMS.APIKey != "" {
		services.InitSMSService(
			config.AppConfig.SMS.APIKey,
			config.AppConfig.SMS.Originator,
			config.AppConfig.SMS.PatternCode,
			config.AppConfig.SMS.PasswordRecoveryPattern,
		)
		log.Println("SMS service initialized")
	} else {
		log.Println("SMS service not configured - license activation SMS disabled")
	}

	// Set Gin mode
	gin.SetMode(gin.ReleaseMode)

	// Create Gin router
	router := gin.Default()

	// Setup CORS
	corsConfig := cors.DefaultConfig()

	// Allow all origins for development and testing
	corsConfig.AllowAllOrigins = true
	corsConfig.AllowMethods = config.AppConfig.CORS.AllowedMethods
	corsConfig.AllowHeaders = config.AppConfig.CORS.AllowedHeaders
	corsConfig.AllowCredentials = true
	corsConfig.ExposeHeaders = []string{"Content-Length", "Content-Range", "Accept-Ranges"}
	corsConfig.MaxAge = 12 * 60 * 60 // 12 hours
	router.Use(cors.New(corsConfig))

	// Serve static files (uploaded videos) with proper headers
	router.Static("/uploads", "./uploads")

	// Add video streaming middleware
	router.Use(func(c *gin.Context) {
		// Get origin from request
		origin := c.Request.Header.Get("Origin")

		// Allow all origins for development and testing
		c.Header("Access-Control-Allow-Origin", origin)
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Requested-With, Range")
		c.Header("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges")
		c.Header("Access-Control-Allow-Credentials", "true")

		// Handle preflight requests
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Setup routes
	routes.SetupRoutes(router, telegramService)

	// Start server
	serverAddr := fmt.Sprintf("%s:%s", config.AppConfig.Server.Host, config.AppConfig.Server.Port)
	log.Printf("Server starting on %s", serverAddr)
	log.Printf("API Documentation: http://%s/health", serverAddr)

	if err := router.Run(serverAddr); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
