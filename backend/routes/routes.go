package routes

import (
	"net/http"

	"asl-market-backend/controllers"
	"asl-market-backend/middleware"
	"asl-market-backend/models"
	"asl-market-backend/services"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, telegramService *services.TelegramService) {
	// Initialize controllers
	authController := controllers.NewAuthController(models.GetDB())
	contactController := controllers.NewContactController(models.GetDB())
	withdrawalController := controllers.NewWithdrawalController(models.GetDB())
	upgradeController := controllers.NewUpgradeController(telegramService)

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "OK",
			"message": "ASL Market Backend is running",
		})
	})

	// API v1 routes
	v1 := router.Group("/api/v1")
	// Add database middleware to all v1 routes
	v1.Use(middleware.DatabaseMiddleware())

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

		// Progress tracking routes
		protected.GET("/progress", controllers.GetUserProgress)
		protected.POST("/progress/update", controllers.UpdateUserProgress)

		// Dashboard route
		protected.GET("/dashboard", getDashboard)

		// License routes (no license check needed)
		protected.POST("/license/verify", controllers.VerifyLicense)
		protected.GET("/license/status", controllers.CheckLicenseStatus)
		protected.GET("/license/info", controllers.GetUserLicenseInfo)

		// Upgrade request routes
		protected.POST("/upgrade/request", upgradeController.CreateUpgradeRequest)
		protected.GET("/upgrade/requests", upgradeController.GetUserUpgradeRequests)

		// Admin upgrade management routes
		protected.GET("/admin/upgrade/requests", upgradeController.GetPendingUpgradeRequests)
		protected.POST("/admin/upgrade/requests/:id/approve", upgradeController.ApproveUpgradeRequest)
		protected.POST("/admin/upgrade/requests/:id/reject", upgradeController.RejectUpgradeRequest)

		// Daily limits routes
		protected.GET("/daily-limits", controllers.GetDailyLimitsStatus)
		protected.GET("/daily-limits/visitor-permission", controllers.CheckVisitorViewPermission)

		// Withdrawal routes
		protected.POST("/withdrawal/request", withdrawalController.CreateWithdrawalRequest)
		protected.GET("/withdrawal/requests", withdrawalController.GetUserWithdrawalRequests)
		protected.GET("/withdrawal/request/:id", withdrawalController.GetWithdrawalRequest)
		protected.POST("/withdrawal/receipt/:id", withdrawalController.UploadReceipt)
		protected.GET("/withdrawal/stats", withdrawalController.GetUserWithdrawalStats)
		protected.GET("/daily-limits/supplier-permission", controllers.CheckSupplierViewPermission)

		// Contact view limits routes
		protected.GET("/contact-limits", contactController.GetContactLimits)
		protected.POST("/contact/view", contactController.ViewContactInfo)
		protected.GET("/contact/history", contactController.GetContactHistory)
		protected.GET("/contact/check/:type/:id", contactController.CheckCanViewContact)

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

		// Product submission
		protected.POST("/submit-product", controllers.SubmitProduct)

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

		// Training videos routes (public access)
		protected.GET("/training/categories", controllers.GetTrainingCategories)
		protected.GET("/training/videos", controllers.GetAllTrainingVideos)
		protected.GET("/training/videos/search", controllers.SearchTrainingVideos)
		protected.GET("/training/category/:id/videos", controllers.GetVideosByCategory)
		protected.GET("/training/video/:id", controllers.GetTrainingVideo)
		protected.GET("/training/stats", controllers.GetTrainingStats)

		// Video watching routes
		protected.POST("/training/video/:id/watch", controllers.MarkVideoAsWatched)
		protected.GET("/training/watched-videos", controllers.GetWatchedVideos)
		protected.GET("/training/watch-stats", controllers.GetUserWatchStats)
		protected.GET("/training/video/:id/stream", controllers.StreamVideo)

		// Admin research products management routes
		protected.POST("/admin/research-products", controllers.CreateResearchProduct)
		protected.PUT("/admin/research-products/:id", controllers.UpdateResearchProduct)
		protected.DELETE("/admin/research-products/:id", controllers.DeleteResearchProduct)
		protected.PATCH("/admin/research-products/:id/status", controllers.UpdateResearchProductStatus)

		// Marketing popup routes (public access for active popup)
		protected.GET("/marketing-popups/active", controllers.GetActiveMarketingPopup)
		protected.POST("/marketing-popups/:id/click", controllers.TrackPopupClick)
		protected.GET("/marketing-popups", controllers.GetMarketingPopups)
		protected.GET("/marketing-popups/:id", controllers.GetMarketingPopup)

		// Admin marketing popup management routes
		protected.POST("/admin/marketing-popups", controllers.CreateMarketingPopup)
		protected.PUT("/admin/marketing-popups/:id", controllers.UpdateMarketingPopup)
		protected.DELETE("/admin/marketing-popups/:id", controllers.DeleteMarketingPopup)

		// Admin withdrawal management routes
		protected.GET("/admin/withdrawal/requests", withdrawalController.GetAllWithdrawalRequests)
		protected.PUT("/admin/withdrawal/request/:id/status", withdrawalController.UpdateWithdrawalStatus)
		protected.GET("/admin/withdrawal/stats", withdrawalController.GetAllWithdrawalStats)

		// Available products routes (public access for viewing)
		protected.GET("/available-products", controllers.GetAvailableProducts)
		protected.GET("/available-products/categories", controllers.GetAvailableProductCategories)
		protected.GET("/available-products/featured", controllers.GetFeaturedAvailableProducts)
		protected.GET("/available-products/hot-deals", controllers.GetHotDealsAvailableProducts)
		protected.GET("/available-products/:id", controllers.GetAvailableProduct)

		// Admin available products management routes
		protected.POST("/admin/available-products", controllers.CreateAvailableProduct)
		protected.PUT("/admin/available-products/:id", controllers.UpdateAvailableProduct)
		protected.DELETE("/admin/available-products/:id", controllers.DeleteAvailableProduct)
		protected.PUT("/admin/available-products/:id/status", controllers.UpdateAvailableProductStatus)

		// Admin training videos management routes
		protected.GET("/admin/training/videos", controllers.GetAllVideosForAdmin)
		protected.POST("/admin/training/videos", controllers.CreateTrainingVideo)
		protected.PUT("/admin/training/videos/:id", controllers.UpdateTrainingVideo)
		protected.DELETE("/admin/training/videos/:id", controllers.DeleteTrainingVideo)
		protected.POST("/admin/training/categories", controllers.CreateTrainingCategory)

		// License-protected routes
		licensed := protected.Group("/")
		licensed.Use(middleware.LicenseMiddleware())
		{
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

	// Get withdrawal statistics
	withdrawalStats, err := models.GetWithdrawalStats(models.GetDB(), &userID)
	if err != nil {
		withdrawalStats = map[string]interface{}{
			"total":        0,
			"completed":    0,
			"pending":      0,
			"processing":   0,
			"rejected":     0,
			"total_amount": 0,
		}
	}

	// Get recent withdrawal requests
	recentWithdrawals, err := models.GetUserWithdrawalRequests(models.GetDB(), userID)
	if err != nil {
		recentWithdrawals = []models.WithdrawalRequest{}
	}

	// Get withdrawal history for chart data
	chartData, err := models.GetWithdrawalChartData(models.GetDB(), userID)
	if err != nil {
		chartData = []map[string]interface{}{}
	}

	// Get user progress (create with 0% default if doesn't exist)
	progress, err := models.GetOrCreateUserProgress(models.GetDB(), userID)
	var progressData map[string]interface{}
	if err != nil {
		// Fallback progress data - start at 0%
		progressData = map[string]interface{}{
			"overall_progress": 0,
			"activities": map[string]bool{
				"tutorial":   false,
				"suppliers":  false,
				"visitors":   false,
				"ai":         false,
				"products":   false,
				"withdrawal": false,
				"available":  false,
				"express":    false,
				"learning":   false,
			},
			"next_steps": []string{"مشاهده آموزش‌های پلتفرم"},
		}
	} else {
		progressData = progress.GetProgressBreakdown()
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User dashboard",
		"user_id": userID,
		"data": gin.H{
			"withdrawal_stats":   withdrawalStats,
			"recent_withdrawals": recentWithdrawals,
			"chart_data":         chartData,
			"progress":           progressData,
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
