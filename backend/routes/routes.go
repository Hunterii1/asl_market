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
	}

	// Protected routes (authentication required)
	protected := v1.Group("/")
	protected.Use(middleware.AuthMiddleware())
	{
		// User routes
		protected.GET("/me", authController.Me)

		// License routes (no license check needed)
		protected.POST("/license/verify", controllers.VerifyLicense)
		protected.GET("/license/status", controllers.CheckLicenseStatus)
		protected.GET("/license/info", controllers.GetUserLicenseInfo)

		// Supplier routes
		protected.POST("/supplier/register", controllers.RegisterSupplier)
		protected.GET("/supplier/status", controllers.GetMySupplierStatus)
		protected.GET("/suppliers", controllers.GetApprovedSuppliers)

		// Admin supplier management routes
		protected.GET("/admin/suppliers", controllers.GetSuppliersForAdmin)
		protected.POST("/admin/suppliers/:id/approve", controllers.ApproveSupplier)
		protected.POST("/admin/suppliers/:id/reject", controllers.RejectSupplier)

		// Visitor routes
		protected.POST("/visitor/register", controllers.RegisterVisitor)
		protected.GET("/visitor/status", controllers.GetMyVisitorStatus)
		protected.GET("/visitors", controllers.GetApprovedVisitors)
		protected.GET("/debug/visitor/:id", controllers.GetVisitorByID)

		// Admin visitor management routes
		protected.GET("/admin/visitors", controllers.GetVisitorsForAdmin)
		protected.GET("/admin/visitors/:id", controllers.GetVisitorDetails)
		protected.POST("/admin/visitors/:id/approve", controllers.ApproveVisitorByAdmin)
		protected.POST("/admin/visitors/:id/reject", controllers.RejectVisitorByAdmin)
		protected.PUT("/admin/visitors/:id/status", controllers.UpdateVisitorStatus)

		// Research products routes (public access)
		protected.GET("/research-products", controllers.GetResearchProducts)
		protected.GET("/research-products/active", controllers.GetActiveResearchProducts)
		protected.GET("/research-products/categories", controllers.GetResearchProductCategories)
		protected.GET("/research-products/:id", controllers.GetResearchProduct)

		// Admin research products management routes
		protected.POST("/admin/research-products", controllers.CreateResearchProduct)
		protected.PUT("/admin/research-products/:id", controllers.UpdateResearchProduct)
		protected.DELETE("/admin/research-products/:id", controllers.DeleteResearchProduct)
		protected.PATCH("/admin/research-products/:id/status", controllers.UpdateResearchProductStatus)

		// License-protected routes
		licensed := protected.Group("/")
		licensed.Use(middleware.LicenseMiddleware())
		{
			// Dashboard routes
			licensed.GET("/dashboard", getDashboard)

			// User-specific data
			licensed.GET("/my-orders", getMyOrders)
			licensed.GET("/my-products", getMyProducts)
			licensed.POST("/orders", createOrder)
			licensed.PUT("/profile", updateProfile)

			// AI Chat routes
			licensed.POST("/ai/chat", controllers.Chat)
			licensed.GET("/ai/chats", controllers.GetChats)
			licensed.GET("/ai/chats/:id", controllers.GetChat)
			licensed.DELETE("/ai/chats/:id", controllers.DeleteChat)
		}
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
