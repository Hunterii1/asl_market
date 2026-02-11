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
	affiliateController := controllers.NewAffiliateController(models.GetDB())
	contactController := controllers.NewContactController(models.GetDB())
	withdrawalController := controllers.NewWithdrawalController(models.GetDB())
	upgradeController := controllers.NewUpgradeController(telegramService)
	spotPlayerController := controllers.NewSpotPlayerController()
	supportTicketController := controllers.NewSupportTicketController(telegramService)
	publicRegistrationController := controllers.NewPublicRegistrationController(models.GetDB())
	matchingController := controllers.NewMatchingController(models.GetDB())
	pushController := controllers.NewPushController(models.GetDB())
	visitorProjectController := controllers.NewVisitorProjectController(models.GetDB())
	adminMatchingController := controllers.NewAdminMatchingController(models.GetDB())
	profileController := controllers.NewProfileController(models.GetDB())

	// Initialize OpenAI monitor
	openaiMonitor := services.NewOpenAIMonitor(telegramService)
	openaiMonitorController := controllers.NewOpenAIMonitorController(openaiMonitor)

	// Start OpenAI monitoring in background
	go openaiMonitor.StartMonitoring()

	// Serve uploaded files
	router.Static("/uploads", "./uploads")

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
		auth.POST("/admin/login", authController.AdminLogin)         // Admin panel login with username
		auth.POST("/affiliate/login", authController.AffiliateLogin) // Affiliate panel login
		auth.POST("/forgot-password", authController.RequestPasswordRecovery)
		auth.POST("/reset-password", authController.ResetPassword)
	}

	// Affiliate panel routes (affiliate JWT required)
	affiliate := v1.Group("/affiliate")
	affiliate.Use(middleware.AffiliateAuthMiddleware())
	{
		affiliate.GET("/dashboard", affiliateController.GetDashboard)
		affiliate.GET("/users", affiliateController.GetUsers)
		affiliate.GET("/payments", affiliateController.GetPayments)
		affiliate.POST("/withdrawal-request", affiliateController.CreateWithdrawalRequest)
		affiliate.GET("/withdrawal-requests", affiliateController.GetWithdrawalRequests)
		affiliate.GET("/registered-users", affiliateController.GetRegisteredUsers)
		affiliate.GET("/buyers", affiliateController.GetBuyers)
	}

	// Public registration routes (no authentication required)
	public := v1.Group("/public")
	{
		public.POST("/supplier/register", publicRegistrationController.RegisterPublicSupplier)
		public.POST("/visitor/register", publicRegistrationController.RegisterPublicVisitor)
		public.GET("/registration-status", publicRegistrationController.GetRegistrationStatus)
	}

	// Public routes with optional authentication
	publicOptional := v1.Group("/")
	publicOptional.Use(middleware.OptionalAuthMiddleware())
	{
		// These routes can be accessed without authentication
		// but will include user info if authenticated
		publicOptional.GET("/dashboard/stats", getDashboardStats)
		publicOptional.GET("/products", getProducts)
		// اسلایدر بنر برای همه (لاگین نشده هم ببیند)
		publicOptional.GET("/sliders/active", controllers.GetActiveSliders)
		// Featured suppliers slider برای همه (بدون نمایش اطلاعات تماس)
		publicOptional.GET("/suppliers/featured", controllers.GetFeaturedSuppliersPublic)
		// Public profile (everyone can view profiles)
		publicOptional.GET("/profile/:id", profileController.GetUserProfile)
	}

	// Protected routes (authentication required)
	protected := v1.Group("/")
	protected.Use(middleware.AuthMiddleware())
	{
		// User routes
		protected.GET("/me", authController.Me)
		protected.PUT("/profile", authController.UpdateProfile)
		protected.PUT("/profile/update", profileController.UpdateProfile)
		protected.POST("/profile/upload-profile-image", profileController.UploadProfileImage)
		protected.POST("/profile/upload-cover-image", profileController.UploadCoverImage)

		// Progress tracking routes
		protected.GET("/progress", controllers.GetUserProgress)
		protected.POST("/progress/update", controllers.UpdateUserProgress)

		// Dashboard route
		protected.GET("/dashboard", getDashboard)

		// License routes (no license check needed)
		protected.POST("/license/verify", controllers.VerifyLicense)
		protected.GET("/license/status", controllers.CheckLicenseStatus)
		protected.GET("/license/info", controllers.GetUserLicenseInfo)
		protected.POST("/license/refresh", controllers.RefreshLicense)

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

		// Upload routes
		protected.POST("/upload/supplier-image", controllers.UploadSupplierImage)
		protected.POST("/upload/product-image", controllers.UploadProductImage)
		protected.POST("/upload/product-images", controllers.UploadMultipleProductImages)
		protected.POST("/upload/chat-image", controllers.UploadChatImage)
		protected.POST("/upload/delete-image", controllers.DeleteImage)

		// Supplier routes
		protected.POST("/supplier/register", controllers.RegisterSupplier)
		protected.PUT("/supplier/update", controllers.UpdateMySupplier)
		protected.DELETE("/supplier/delete", controllers.DeleteMySupplier)
		protected.GET("/supplier/status", controllers.GetMySupplierStatus)
		protected.GET("/suppliers", controllers.GetApprovedSuppliers)
		protected.GET("/suppliers/matching-capacity", controllers.GetSuppliersMatchingCapacity)

		// Admin supplier management routes
		protected.POST("/admin/suppliers", controllers.CreateSupplierForAdmin)
		protected.GET("/admin/suppliers", controllers.GetSuppliersForAdmin)
		protected.GET("/admin/suppliers/:id", controllers.GetSupplierForAdmin)
		protected.PUT("/admin/suppliers/:id", controllers.UpdateSupplierForAdmin)
		protected.DELETE("/admin/suppliers/:id", controllers.DeleteSupplierForAdmin)
		protected.POST("/admin/suppliers/:id/approve", controllers.ApproveSupplier)
		protected.POST("/admin/suppliers/:id/reject", controllers.RejectSupplier)
		protected.POST("/admin/suppliers/:id/feature", controllers.FeatureSupplier)
		protected.POST("/admin/suppliers/:id/unfeature", controllers.UnfeatureSupplier)

		// Visitor routes
		protected.POST("/visitor/register", controllers.RegisterVisitor)
		protected.PUT("/visitor/update", controllers.UpdateMyVisitor)
		protected.DELETE("/visitor/delete", controllers.DeleteMyVisitor)
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
		protected.PUT("/admin/visitors/:id", controllers.UpdateVisitorByAdmin)
		protected.DELETE("/admin/visitors/:id", controllers.DeleteVisitorByAdmin)
		protected.POST("/admin/visitors/:id/feature", controllers.FeatureVisitor)
		protected.POST("/admin/visitors/:id/unfeature", controllers.UnfeatureVisitor)

		// Research products routes (public access)
		protected.GET("/research-products", controllers.GetResearchProducts)
		protected.GET("/research-products/active", controllers.GetActiveResearchProducts)
		protected.GET("/research-products/categories", controllers.GetResearchProductCategories)
		protected.GET("/research-products/:id", controllers.GetResearchProduct)

		// Admin research products routes

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
		protected.POST("/admin/research-products/import", controllers.ImportResearchProductsFromExcel)

		// Marketing popup routes (public access for active popup)
		protected.GET("/marketing-popups/active", controllers.GetActiveMarketingPopup)
		protected.POST("/marketing-popups/:id/click", controllers.TrackPopupClick)
		protected.GET("/marketing-popups", controllers.GetMarketingPopups)
		protected.GET("/marketing-popups/:id", controllers.GetMarketingPopup)

		// Admin marketing popup management routes
		protected.GET("/admin/marketing-popups", controllers.GetMarketingPopups)
		protected.POST("/admin/marketing-popups", controllers.CreateMarketingPopup)
		protected.PUT("/admin/marketing-popups/:id", controllers.UpdateMarketingPopup)
		protected.DELETE("/admin/marketing-popups/:id", controllers.DeleteMarketingPopup)

		// Slider routes (GET /sliders/active is public via publicOptional; track requires auth)
		protected.POST("/sliders/:id/click", controllers.TrackSliderClick)
		protected.POST("/sliders/:id/view", controllers.TrackSliderView)

		// Admin slider management routes
		protected.GET("/admin/sliders", controllers.GetSliders)
		protected.GET("/admin/sliders/:id", controllers.GetSlider)
		protected.POST("/admin/sliders", controllers.CreateSlider)
		protected.PUT("/admin/sliders/:id", controllers.UpdateSlider)
		protected.DELETE("/admin/sliders/:id", controllers.DeleteSlider)
		protected.POST("/admin/sliders/upload", controllers.UploadSliderImage)

		// Admin withdrawal management routes
		protected.POST("/admin/withdrawal/requests", withdrawalController.CreateWithdrawalRequestAdmin)
		protected.GET("/admin/withdrawal/requests", withdrawalController.GetAllWithdrawalRequests)
		protected.GET("/admin/withdrawal/request/:id", withdrawalController.GetWithdrawalRequestAdmin)
		protected.PUT("/admin/withdrawal/request/:id", withdrawalController.UpdateWithdrawalRequestAdmin)
		protected.DELETE("/admin/withdrawal/request/:id", withdrawalController.DeleteWithdrawalRequestAdmin)
		protected.PUT("/admin/withdrawal/request/:id/status", withdrawalController.UpdateWithdrawalStatus)
		protected.GET("/admin/withdrawal/stats", withdrawalController.GetAllWithdrawalStats)

		// Global search route
		protected.GET("/search", controllers.GlobalSearch)

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

		// Admin notification management routes
		protected.GET("/admin/notifications", controllers.GetAllNotificationsForAdmin)
		protected.POST("/admin/notifications", controllers.CreateNotification)
		protected.PUT("/admin/notifications/:id", controllers.UpdateNotification)
		protected.DELETE("/admin/notifications/:id", controllers.DeleteNotification)
		protected.GET("/admin/notifications/stats", controllers.GetNotificationStats)
		protected.POST("/admin/training/categories", controllers.CreateTrainingCategory)

		// Admin Panel Web API routes (comprehensive admin endpoints)
		protected.GET("/admin/dashboard/stats", controllers.GetAdminDashboardStats)

		// User Management (Admin)
		protected.GET("/admin/users", controllers.GetUsersForAdmin)
		protected.GET("/admin/users/:id", controllers.GetUserDetailsForAdmin)
		protected.POST("/admin/users", controllers.CreateUser)
		protected.PUT("/admin/users/:id", controllers.UpdateUser)
		protected.PUT("/admin/users/:id/status", controllers.UpdateUserStatus)
		protected.DELETE("/admin/users/:id", controllers.DeleteUser)
		protected.POST("/admin/import/users", controllers.ImportUsersFromExcel)

		// License Management (Admin)
		protected.GET("/admin/licenses", controllers.GetLicensesForAdmin)
		protected.POST("/admin/licenses/generate", controllers.GenerateLicensesForAdmin)

		// Support Ticket Management (Admin)
		protected.GET("/admin/support/tickets", controllers.GetAllTicketsForAdmin)
		protected.GET("/admin/support/tickets/:id", controllers.GetTicketDetailsForAdmin)
		protected.PUT("/admin/support/tickets/:id", controllers.UpdateTicketForAdmin)
		protected.PUT("/admin/support/tickets/:id/status", controllers.UpdateTicketStatusForAdmin)
		protected.POST("/admin/support/tickets/:id/messages", controllers.AddAdminMessageToTicket)
		protected.DELETE("/admin/support/tickets/:id", controllers.DeleteTicketForAdmin)

		// Telegram Admin Management (Admin)
		protected.GET("/admin/telegram-admins", controllers.GetTelegramAdminsForAdmin)
		protected.POST("/admin/telegram-admins", controllers.AddTelegramAdmin)
		protected.DELETE("/admin/telegram-admins/:telegram_id", controllers.RemoveTelegramAdmin)

		// Web Admin Management (Admin Panel Admins)
		protected.GET("/admin/web-admins", controllers.GetWebAdmins)
		protected.GET("/admin/web-admins/:id", controllers.GetWebAdmin)
		protected.POST("/admin/web-admins", controllers.CreateWebAdmin)
		protected.PUT("/admin/web-admins/:id", controllers.UpdateWebAdmin)
		protected.DELETE("/admin/web-admins/:id", controllers.DeleteWebAdmin)

		// Affiliate management (admin panel)
		protected.GET("/admin/affiliates", controllers.GetAffiliates)
		protected.GET("/admin/affiliates/:id", controllers.GetAffiliate)
		protected.POST("/admin/affiliates", controllers.CreateAffiliate)
		protected.PUT("/admin/affiliates/:id", controllers.UpdateAffiliate)
		protected.DELETE("/admin/affiliates/:id", controllers.DeleteAffiliate)
		protected.GET("/admin/affiliates/:id/registered-users", controllers.GetAffiliateRegisteredUsers)
		protected.POST("/admin/affiliates/:id/registered-users/import", controllers.ImportAffiliateRegisteredUsers)
		protected.POST("/admin/affiliates/:id/sales-match", controllers.MatchAffiliateSales)
		protected.POST("/admin/affiliates/:id/buyers/confirm", controllers.ConfirmAffiliateBuyers)
		protected.GET("/admin/affiliates/:id/buyers", controllers.GetAffiliateBuyers)
		protected.GET("/admin/affiliates/:id/withdrawal-requests", controllers.GetAffiliateWithdrawalRequests)
		protected.PUT("/admin/affiliates/:id/withdrawal-requests/:reqId/status", controllers.UpdateAffiliateWithdrawalStatus)

		// Excel Export (Admin)
		protected.GET("/admin/export/users", controllers.ExportUsersToExcel)
		protected.GET("/admin/export/suppliers", controllers.ExportSuppliersToExcel)
		protected.GET("/admin/export/visitors", controllers.ExportVisitorsToExcel)
		protected.GET("/admin/export/licenses", controllers.ExportLicensesToExcel)

		// Admin Matching Management (Admin)
		protected.GET("/admin/matching/requests", adminMatchingController.GetAllMatchingRequests)
		protected.GET("/admin/matching/requests/stats", adminMatchingController.GetMatchingRequestStats)
		protected.GET("/admin/matching/chats", adminMatchingController.GetAllMatchingChats)
		protected.GET("/admin/matching/chats/:id/messages", adminMatchingController.GetMatchingChatMessages)

		// Admin Visitor Projects Management (Admin)
		protected.GET("/admin/visitor-projects", adminMatchingController.GetAllVisitorProjects)
		protected.GET("/admin/visitor-projects/stats", adminMatchingController.GetVisitorProjectStats)
		protected.GET("/admin/visitor-projects/chats", adminMatchingController.GetAllVisitorProjectChats)
		protected.GET("/admin/visitor-projects/chats/:id/messages", adminMatchingController.GetVisitorProjectChatMessages)

		// OpenAI Monitor routes (Admin only)
		protected.GET("/admin/openai/usage", openaiMonitorController.GetUsageStats)
		protected.POST("/admin/openai/check", openaiMonitorController.CheckUsage)
		protected.POST("/admin/openai/test-alert", openaiMonitorController.SendTestAlert)

		// SpotPlayer routes
		protected.POST("/spotplayer/generate-license", spotPlayerController.GenerateSpotPlayerLicense)
		protected.GET("/spotplayer/license", spotPlayerController.GetSpotPlayerLicense)

		// Support Ticket routes
		protected.POST("/support/tickets", supportTicketController.CreateTicket)
		protected.GET("/support/tickets", supportTicketController.GetUserTickets)
		protected.GET("/support/tickets/:id", supportTicketController.GetTicket)
		protected.POST("/support/tickets/:id/messages", supportTicketController.AddMessage)
		protected.POST("/support/tickets/:id/close", supportTicketController.CloseTicket)

		// Notification routes
		protected.GET("/notifications", controllers.GetUserNotifications)
		protected.GET("/notifications/:id", controllers.GetNotification)
		protected.POST("/notifications/:id/read", controllers.MarkNotificationAsRead)
		protected.POST("/notifications/read-all", controllers.MarkAllNotificationsAsRead)
		protected.GET("/notifications/unread-count", controllers.GetUnreadNotificationCount)

		// Push Notification routes
		protected.GET("/push/vapid-key", pushController.GetVAPIDPublicKey)
		protected.POST("/push/subscribe", pushController.Subscribe)
		protected.POST("/push/unsubscribe", pushController.Unsubscribe)
		protected.POST("/push/test", pushController.SendTestPush)

		// Matching routes (Supplier)
		protected.POST("/matching/requests", matchingController.CreateMatchingRequest)
		protected.GET("/matching/requests", matchingController.GetMyMatchingRequests)
		protected.GET("/matching/requests/:id", matchingController.GetMatchingRequestDetails)
		protected.PUT("/matching/requests/:id", matchingController.UpdateMatchingRequest)
		protected.DELETE("/matching/requests/:id", matchingController.CancelMatchingRequest)
		protected.POST("/matching/requests/:id/close", matchingController.CloseMatchingRequest)
		protected.POST("/matching/requests/:id/extend", matchingController.ExtendMatchingRequest)
		protected.GET("/matching/requests/:id/suggested-visitors", matchingController.GetSuggestedVisitors)

		// Matching routes (Visitor)
		protected.GET("/matching/available-requests", matchingController.GetAvailableMatchingRequests)
		protected.POST("/matching/requests/:id/respond", matchingController.RespondToMatchingRequest)

		// Matching rating routes
		protected.POST("/matching/requests/:id/rating", matchingController.CreateMatchingRating)
		protected.GET("/matching/ratings/user", matchingController.GetMatchingRatingsByUser)

		// Matching chat routes
		protected.GET("/matching/chat/conversations", matchingController.GetMatchingChatConversations)
		protected.GET("/matching/chat/:id/messages", matchingController.GetMatchingChatMessages)
		protected.POST("/matching/chat/:id/send", matchingController.SendMatchingChatMessage)

		// Visitor Project routes (Two-way matching: Visitors create projects, Suppliers propose)
		// Visitor creates and manages their visitor projects
		protected.POST("/visitor-projects", visitorProjectController.CreateVisitorProject)
		protected.GET("/visitor-projects/my", visitorProjectController.GetMyVisitorProjects)
		protected.GET("/visitor-projects/:id", visitorProjectController.GetVisitorProjectDetails)
		protected.PUT("/visitor-projects/:id", visitorProjectController.UpdateVisitorProject)
		protected.DELETE("/visitor-projects/:id", visitorProjectController.DeleteVisitorProject)
		protected.POST("/visitor-projects/:id/close", visitorProjectController.CloseVisitorProject)

		// Supplier views available visitor projects and submits proposals
		protected.GET("/visitor-projects/available", visitorProjectController.GetAvailableVisitorProjects)
		protected.POST("/visitor-projects/:id/proposal", visitorProjectController.SubmitProposal)
		protected.GET("/visitor-projects/supplier-capacity", visitorProjectController.GetSupplierCapacityForVisitorProjects)

		// Visitor Project Chat routes
		protected.GET("/visitor-projects/chats", visitorProjectController.GetVisitorProjectChats)
		protected.POST("/visitor-projects/:id/start-chat", visitorProjectController.StartVisitorProjectChat)
		protected.GET("/visitor-projects/chats/:id/messages", visitorProjectController.GetVisitorProjectChatMessages)
		protected.POST("/visitor-projects/chats/:id/send", visitorProjectController.SendVisitorProjectChatMessage)

		// License-protected routes
		licensed := protected.Group("/")
		licensed.Use(middleware.LicenseMiddleware())
		{
			// User-specific data
			licensed.GET("/my-orders", getMyOrders)
			licensed.GET("/my-products", controllers.GetUserAvailableProducts)
			licensed.GET("/my-products/:id", controllers.GetUserAvailableProduct)
			licensed.PUT("/my-products/:id", controllers.UpdateUserAvailableProduct)
			licensed.DELETE("/my-products/:id", controllers.DeleteUserAvailableProduct)
			licensed.POST("/orders", createOrder)
			// Profile update is now handled in protected routes above

			// AI Chat routes
			licensed.POST("/ai/chat", controllers.Chat)
			licensed.GET("/ai/chats", controllers.GetChats)
			licensed.GET("/ai/chats/:id", controllers.GetChat)
			licensed.DELETE("/ai/chats/:id", controllers.DeleteChat)
			licensed.GET("/ai/usage", controllers.GetAIUsage)
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
