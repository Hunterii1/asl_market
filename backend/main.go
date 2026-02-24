package main

import (
	"fmt"
	"log"
	"time"

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

	// Initialize Telegram bot service (only when not running on Iran servers)
	var telegramService *services.TelegramService
	if !config.AppConfig.Environment.IsInIran {
		telegramService = services.GetTelegramService()
		log.Printf("Telegram bot initialized for admin IDs: %v", services.ADMIN_IDS)
		services.StartBackupScheduler(telegramService)
	} else {
		log.Println("Running in Iran environment - Telegram bot is disabled")
	}

	// Initialize SMS service (با username/password برای لاگین خودکار Edge)
	if config.AppConfig.SMS.APIKey != "" {
		services.InitSMSService(
			config.AppConfig.SMS.APIKey,
			config.AppConfig.SMS.Originator,
			config.AppConfig.SMS.PatternCode,
			config.AppConfig.SMS.PasswordRecoveryPattern,
			config.AppConfig.SMS.Username,
			config.AppConfig.SMS.Password,
		)
		log.Println("SMS service initialized")
	} else {
		log.Println("SMS service not configured - license activation SMS disabled")
	}

	// Set Gin mode
	gin.SetMode(gin.ReleaseMode)

	// Create Gin router
	router := gin.Default()

	// Setup CORS — فقط یک لایه (همین) تا هدر Access-Control-Allow-Origin فقط یک بار ست شود.
	// اگر nginx هم CORS ست کند، مقدار دو بار می‌آید و مرورگر خطای "multiple values" می‌دهد.
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowCredentials = true
	corsConfig.AllowMethods = config.AppConfig.CORS.AllowedMethods
	corsConfig.AllowHeaders = config.AppConfig.CORS.AllowedHeaders
	corsConfig.ExposeHeaders = []string{"Content-Length", "Content-Range", "Accept-Ranges"}
	corsConfig.MaxAge = 12 * 60 * 60 // 12 hours
	// اُرژین‌های مجاز صریح (با credentials نمی‌شود از * استفاده کرد)
	corsConfig.AllowOrigins = []string{
		"https://asllmarket.com",
		"https://www.asllmarket.com",
		"https://admin.asllmarket.com",
		"https://asllmarket.ir",
		"https://www.asllmarket.ir",
		"https://admin.asllmarket.ir",
		"http://localhost:5173",
		"http://localhost:5174",
		"http://localhost:5175",
		"http://127.0.0.1:5173",
		"http://127.0.0.1:5174",
		"http://127.0.0.1:5175",
	}
	router.Use(cors.New(corsConfig))

	// Start matching expiration checker in background
	go func() {
		matchingService := services.NewMatchingService(models.GetDB())
		ticker := time.NewTicker(1 * time.Hour) // Check every hour
		defer ticker.Stop()

		// Run immediately on startup
		matchingService.CheckAndExpireRequests()

		for range ticker.C {
			matchingService.CheckAndExpireRequests()
		}
	}()

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
