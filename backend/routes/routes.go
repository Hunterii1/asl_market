package routes

import (
	"net/http"

	"asl-market-backend/controllers"
	"asl-market-backend/middleware"
	"asl-market-backend/models"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {
	// Initialize controllers
	authController := controllers.NewAuthController(models.GetDB())

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "OK",
			"message": "ASL Market Backend is running",
		})
	})

	// API v1 routes
	v1 := router.Group("/api/v1")

	// Public routes (no authentication required)
	auth := v1.Group("/auth")
	{
		auth.POST("/register", authController.Register)
		auth.POST("/login", authController.Login)
	}

	// Public routes with optional authentication
	public := v1.Group("/")
	public.Use(middleware.OptionalAuthMiddleware())
	{
		// These routes can be accessed without authentication
		// but will include user info if authenticated
		public.GET("/dashboard/stats", getDashboardStats)
		public.GET("/products", getProducts)
		public.GET("/suppliers", getSuppliers)
	}

	// Protected routes (authentication required)
	protected := v1.Group("/")
	protected.Use(middleware.AuthMiddleware())
	{
		// User routes
		protected.GET("/me", authController.Me)

		// Dashboard routes
		protected.GET("/dashboard", getDashboard)

		// User-specific data
		protected.GET("/my-orders", getMyOrders)
		protected.GET("/my-products", getMyProducts)
		protected.POST("/orders", createOrder)
		protected.PUT("/profile", updateProfile)
	}
}

// Sample handlers for demonstration
func getDashboardStats(c *gin.Context) {
	// Check if user is authenticated
	userID, isAuthenticated := c.Get("user_id")

	response := gin.H{
		"stats": gin.H{
			"total_products":  45,
			"total_suppliers": 124,
			"total_countries": 6,
		},
		"authenticated": isAuthenticated,
	}

	if isAuthenticated {
		response["user_id"] = userID
		response["personalized_data"] = gin.H{
			"my_orders":   12,
			"my_products": 3,
		}
	}

	c.JSON(http.StatusOK, response)
}

func getProducts(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Products list",
		"data": []gin.H{
			{"id": 1, "name": "زعفران سرگل", "category": "saffron"},
			{"id": 2, "name": "خرما مجول", "category": "dates"},
		},
	})
}

func getSuppliers(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Suppliers list",
		"data": []gin.H{
			{"id": 1, "name": "شرکت زعفران طلایی", "verified": true},
			{"id": 2, "name": "باغات خرمای جنوب", "verified": true},
		},
	})
}

func getDashboard(c *gin.Context) {
	userID := c.GetUint("user_id")
	c.JSON(http.StatusOK, gin.H{
		"message": "User dashboard",
		"user_id": userID,
		"data": gin.H{
			"recent_orders": []gin.H{},
			"analytics": gin.H{
				"total_sales":  15600,
				"total_orders": 24,
			},
		},
	})
}

func getMyOrders(c *gin.Context) {
	userID := c.GetUint("user_id")
	c.JSON(http.StatusOK, gin.H{
		"message": "User orders",
		"user_id": userID,
		"orders":  []gin.H{},
	})
}

func getMyProducts(c *gin.Context) {
	userID := c.GetUint("user_id")
	c.JSON(http.StatusOK, gin.H{
		"message":  "User products",
		"user_id":  userID,
		"products": []gin.H{},
	})
}

func createOrder(c *gin.Context) {
	userID := c.GetUint("user_id")
	c.JSON(http.StatusCreated, gin.H{
		"message": "Order created successfully",
		"user_id": userID,
	})
}

func updateProfile(c *gin.Context) {
	userID := c.GetUint("user_id")
	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"user_id": userID,
	})
}
