package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"asl-market-backend/config"
	"asl-market-backend/models"
	"asl-market-backend/services"
	"asl-market-backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

// ============================================
// DASHBOARD STATS
// ============================================

// GetAdminDashboardStats returns comprehensive statistics for admin dashboard
func GetAdminDashboardStats(c *gin.Context) {
	db := models.GetDB()

	// Get user statistics
	var totalUsers int64
	var activeUsers int64
	var adminUsers int64
	db.Model(&models.User{}).Count(&totalUsers)
	db.Model(&models.User{}).Where("is_active = ?", true).Count(&activeUsers)
	db.Model(&models.User{}).Where("is_admin = ?", true).Count(&adminUsers)

	// Get supplier statistics
	var totalSuppliers int64
	var approvedSuppliers int64
	var pendingSuppliers int64
	db.Model(&models.Supplier{}).Count(&totalSuppliers)
	db.Model(&models.Supplier{}).Where("status = ?", "approved").Count(&approvedSuppliers)
	db.Model(&models.Supplier{}).Where("status = ?", "pending").Count(&pendingSuppliers)

	// Get visitor statistics
	var totalVisitors int64
	var approvedVisitors int64
	var pendingVisitors int64
	db.Model(&models.Visitor{}).Count(&totalVisitors)
	db.Model(&models.Visitor{}).Where("status = ?", "approved").Count(&approvedVisitors)
	db.Model(&models.Visitor{}).Where("status = ?", "pending").Count(&pendingVisitors)

	// Get license statistics
	var totalLicenses int64
	var usedLicenses int64
	var availableLicenses int64
	db.Model(&models.License{}).Count(&totalLicenses)
	db.Model(&models.License{}).Where("is_used = ?", true).Count(&usedLicenses)
	db.Model(&models.License{}).Where("is_used = ?", false).Count(&availableLicenses)

	// Get withdrawal statistics
	withdrawalStats, _ := models.GetWithdrawalStats(db, nil)
	var pendingWithdrawals int64
	var completedWithdrawals int64
	db.Model(&models.WithdrawalRequest{}).Where("status = ?", "pending").Count(&pendingWithdrawals)
	db.Model(&models.WithdrawalRequest{}).Where("status = ?", "completed").Count(&completedWithdrawals)

	// Get ticket statistics
	var totalTickets int64
	var openTickets int64
	var closedTickets int64
	db.Model(&models.SupportTicket{}).Count(&totalTickets)
	db.Model(&models.SupportTicket{}).Where("status = ?", "open").Or("status = ?", "in_progress").Count(&openTickets)
	db.Model(&models.SupportTicket{}).Where("status = ?", "closed").Count(&closedTickets)

	// Get training video statistics
	videoStats, _ := models.GetVideoStats(db)

	// Get notification statistics
	notificationStats, _ := models.GetNotificationStats(db)

	// Get research product statistics
	var totalResearchProducts int64
	var activeResearchProducts int64
	db.Model(&models.ResearchProduct{}).Count(&totalResearchProducts)
	db.Model(&models.ResearchProduct{}).Where("status = ?", "active").Count(&activeResearchProducts)

	// Get available product statistics
	var totalAvailableProducts int64
	var activeAvailableProducts int64
	db.Model(&models.AvailableProduct{}).Count(&totalAvailableProducts)
	db.Model(&models.AvailableProduct{}).Where("status = ?", "active").Count(&activeAvailableProducts)

	// Get marketing popup statistics
	var totalPopups int64
	var activePopups int64
	db.Model(&models.MarketingPopup{}).Count(&totalPopups)
	db.Model(&models.MarketingPopup{}).Where("is_active = ?", true).Count(&activePopups)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"users": gin.H{
				"total":  totalUsers,
				"active": activeUsers,
				"admins": adminUsers,
			},
			"suppliers": gin.H{
				"total":    totalSuppliers,
				"approved": approvedSuppliers,
				"pending":  pendingSuppliers,
			},
			"visitors": gin.H{
				"total":    totalVisitors,
				"approved": approvedVisitors,
				"pending":  pendingVisitors,
			},
			"licenses": gin.H{
				"total":     totalLicenses,
				"used":      usedLicenses,
				"available": availableLicenses,
			},
			"withdrawals": gin.H{
				"total":     withdrawalStats["total"],
				"pending":   pendingWithdrawals,
				"completed": completedWithdrawals,
				"stats":     withdrawalStats,
			},
			"tickets": gin.H{
				"total":  totalTickets,
				"open":   openTickets,
				"closed": closedTickets,
			},
			"training":      videoStats,
			"notifications": notificationStats,
			"research_products": gin.H{
				"total":  totalResearchProducts,
				"active": activeResearchProducts,
			},
			"available_products": gin.H{
				"total":  totalAvailableProducts,
				"active": activeAvailableProducts,
			},
			"marketing_popups": gin.H{
				"total":  totalPopups,
				"active": activePopups,
			},
		},
	})
}

// ============================================
// USER MANAGEMENT
// ============================================

// GetUsersForAdmin returns paginated list of users for admin panel
func GetUsersForAdmin(c *gin.Context) {
	db := models.GetDB()

	// Parse query parameters
	pageStr := c.DefaultQuery("page", "1")
	perPageStr := c.DefaultQuery("per_page", "10")
	search := c.Query("search")
	status := c.Query("status") // active, inactive, all

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	perPage, err := strconv.Atoi(perPageStr)
	if err != nil || perPage < 1 || perPage > 100 {
		perPage = 10
	}

	// Build query
	query := db.Model(&models.User{})

	// Apply search filter
	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?",
			searchPattern, searchPattern, searchPattern, searchPattern)
	}

	// Apply status filter
	if status == "active" {
		query = query.Where("is_active = ?", true)
	} else if status == "inactive" {
		query = query.Where("is_active = ?", false)
	}

	// Get total count
	var total int64
	query.Count(&total)

	// Get paginated results
	offset := (page - 1) * perPage
	var users []models.User
	if err := query.Offset(offset).Limit(perPage).Order("created_at DESC").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت لیست کاربران"})
		return
	}

	// Convert to response format
	var usersResponse []models.UserResponse
	for _, user := range users {
		usersResponse = append(usersResponse, user.ToResponse())
	}

	totalPages := (int(total) + perPage - 1) / perPage

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"users":       usersResponse,
			"total":       total,
			"page":        page,
			"per_page":    perPage,
			"total_pages": totalPages,
			"has_next":    page < totalPages,
			"has_prev":    page > 1,
		},
	})
}

// GetUserDetailsForAdmin returns detailed information about a user
func GetUserDetailsForAdmin(c *gin.Context) {
	db := models.GetDB()

	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه کاربر نامعتبر است"})
		return
	}

	user, err := models.GetUserByID(db, uint(userID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "کاربر یافت نشد"})
		return
	}

	// Get user's supplier info if exists
	supplier, _ := models.GetSupplierByUserID(db, user.ID)

	// Get user's visitor info if exists
	visitor, _ := models.GetVisitorByUserID(db, user.ID)

	// Get user's license info if exists
	var license *models.License
	license, _ = models.GetUserLicense(db, user.ID)

	// Get user's withdrawal requests
	withdrawals, _ := models.GetUserWithdrawalRequests(db, user.ID)

	// Get user's tickets
	var tickets []models.SupportTicket
	db.Where("user_id = ?", user.ID).Find(&tickets)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"user":        user.ToResponse(),
			"supplier":    supplier,
			"visitor":     visitor,
			"license":     license,
			"withdrawals": withdrawals,
			"tickets":     tickets,
		},
	})
}

// CreateUser creates a new user (admin only)
func CreateUser(c *gin.Context) {
	db := models.GetDB()

	var req struct {
		Name       string  `json:"name" binding:"required"`
		Email      string  `json:"email" binding:"required,email"`
		Phone      string  `json:"phone" binding:"required"`
		Password   string  `json:"password"`
		TelegramID string  `json:"telegram_id"`
		Balance    float64 `json:"balance"`
		IsActive   *bool   `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "داده‌های ورودی نامعتبر", "details": err.Error()})
		return
	}

	// Check if email already exists
	var existingUser models.User
	if err := db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "این ایمیل قبلاً ثبت شده است"})
		return
	}

	// Check if phone already exists
	if err := db.Where("phone = ?", req.Phone).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "این شماره تلفن قبلاً ثبت شده است"})
		return
	}

	// Parse name into first_name and last_name
	nameParts := strings.Fields(req.Name)
	firstName := ""
	lastName := ""
	if len(nameParts) > 0 {
		firstName = nameParts[0]
		if len(nameParts) > 1 {
			lastName = strings.Join(nameParts[1:], " ")
		}
	}

	// Set default password if not provided
	password := req.Password
	if password == "" {
		password = "123456" // Default password
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در پردازش رمز عبور"})
		return
	}

	// Set default is_active if not provided
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	// Create user
	user := models.User{
		FirstName: firstName,
		LastName:  lastName,
		Email:     req.Email,
		Phone:     req.Phone,
		Password:  hashedPassword,
		IsActive:  isActive,
	}

	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد کاربر", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "کاربر با موفقیت ایجاد شد",
		"data": gin.H{
			"id":         user.ID,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"email":      user.Email,
			"phone":      user.Phone,
			"is_active":  user.IsActive,
		},
	})
}

// UpdateUser updates user information (name, email, phone, status)
func UpdateUser(c *gin.Context) {
	db := models.GetDB()

	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه کاربر نامعتبر است"})
		return
	}

	var req struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Phone    string `json:"phone"`
		IsActive *bool  `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "داده‌های ورودی نامعتبر"})
		return
	}

	// Check if user exists
	var user models.User
	if err := db.First(&user, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "کاربر یافت نشد"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بازیابی اطلاعات کاربر"})
		return
	}

	// Prepare update data
	updates := make(map[string]interface{})

	// Parse name into first_name and last_name
	if req.Name != "" {
		nameParts := strings.Fields(req.Name)
		if len(nameParts) > 0 {
			updates["first_name"] = nameParts[0]
			if len(nameParts) > 1 {
				updates["last_name"] = strings.Join(nameParts[1:], " ")
			} else {
				updates["last_name"] = ""
			}
		}
	}

	if req.Email != "" {
		updates["email"] = req.Email
	}

	if req.Phone != "" {
		updates["phone"] = req.Phone
	}

	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}

	// Update user
	if err := db.Model(&user).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی اطلاعات کاربر"})
		return
	}

	// Reload user to get updated data
	if err := db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بازیابی اطلاعات به‌روز شده"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "اطلاعات کاربر با موفقیت به‌روزرسانی شد",
		"data": gin.H{
			"id":         user.ID,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"email":      user.Email,
			"phone":      user.Phone,
			"is_active":  user.IsActive,
		},
	})
}

// UpdateUserStatus updates a user's active status
func UpdateUserStatus(c *gin.Context) {
	db := models.GetDB()

	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه کاربر نامعتبر است"})
		return
	}

	var req struct {
		IsActive bool `json:"is_active" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "داده‌های ورودی نامعتبر"})
		return
	}

	if err := db.Model(&models.User{}).Where("id = ?", userID).Update("is_active", req.IsActive).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی وضعیت کاربر"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "وضعیت کاربر با موفقیت به‌روزرسانی شد",
	})
}

// DeleteUser deletes a user (soft delete)
func DeleteUser(c *gin.Context) {
	db := models.GetDB()

	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه کاربر نامعتبر است"})
		return
	}

	if err := db.Delete(&models.User{}, userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف کاربر"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "کاربر با موفقیت حذف شد",
	})
}

// ============================================
// LICENSE MANAGEMENT
// ============================================

// GetLicensesForAdmin returns paginated list of licenses for admin panel
func GetLicensesForAdmin(c *gin.Context) {
	db := models.GetDB()

	// Parse query parameters
	pageStr := c.DefaultQuery("page", "1")
	perPageStr := c.DefaultQuery("per_page", "10")
	status := c.Query("status")    // used, available, all
	licenseType := c.Query("type") // pro, plus, plus4

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	perPage, err := strconv.Atoi(perPageStr)
	if err != nil || perPage < 1 || perPage > 100 {
		perPage = 10
	}

	// Build query
	query := db.Model(&models.License{}).Preload("User").Preload("Admin")

	// Apply status filter
	if status == "used" {
		query = query.Where("is_used = ?", true)
	} else if status == "available" {
		query = query.Where("is_used = ?", false)
	}

	// Apply type filter
	if licenseType != "" {
		query = query.Where("type = ?", licenseType)
	}

	// Get total count
	var total int64
	query.Count(&total)

	// Get paginated results
	offset := (page - 1) * perPage
	var licenses []models.License
	if err := query.Offset(offset).Limit(perPage).Order("created_at DESC").Find(&licenses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت لیست لایسنس‌ها"})
		return
	}

	// Get statistics
	var usedCount int64
	var availableCount int64
	db.Model(&models.License{}).Where("is_used = ?", true).Count(&usedCount)
	db.Model(&models.License{}).Where("is_used = ?", false).Count(&availableCount)

	totalPages := (int(total) + perPage - 1) / perPage

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"licenses":    licenses,
			"total":       total,
			"used":        usedCount,
			"available":   availableCount,
			"page":        page,
			"per_page":    perPage,
			"total_pages": totalPages,
			"has_next":    page < totalPages,
			"has_prev":    page > 1,
		},
	})
}

// GenerateLicensesForAdmin generates new licenses (admin only)
func GenerateLicensesForAdmin(c *gin.Context) {
	db := models.GetDB()
	adminID := c.GetUint("user_id")

	var req models.LicenseGenerateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "داده‌های ورودی نامعتبر"})
		return
	}

	codes, err := models.GenerateLicenses(db, req.Count, req.Type, adminID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در تولید لایسنس‌ها"})
		return
	}

	// Get duration based on type
	duration := 12 // default for plus
	if req.Type == "pro" {
		duration = 30
	} else if req.Type == "plus4" {
		duration = 4
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data": models.LicenseGenerateResponse{
			Message:  fmt.Sprintf("%d لایسنس %s با موفقیت تولید شد", req.Count, req.Type),
			Count:    req.Count,
			Type:     req.Type,
			Duration: duration,
			Licenses: codes,
		},
	})
}

// ============================================
// SUPPORT TICKET MANAGEMENT (ADMIN)
// ============================================

// GetAllTicketsForAdmin returns all tickets for admin panel
func GetAllTicketsForAdmin(c *gin.Context) {
	db := models.GetDB()

	// Parse query parameters
	pageStr := c.DefaultQuery("page", "1")
	perPageStr := c.DefaultQuery("per_page", "10")
	status := c.Query("status")     // open, in_progress, waiting_response, closed, all
	priority := c.Query("priority") // low, medium, high, urgent
	category := c.Query("category") // general, technical, billing, license, other

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	perPage, err := strconv.Atoi(perPageStr)
	if err != nil || perPage < 1 || perPage > 100 {
		perPage = 10
	}

	// Build query
	query := db.Model(&models.SupportTicket{}).Preload("User").Preload("Messages", func(db *gorm.DB) *gorm.DB {
		return db.Order("created_at DESC").Limit(1) // Get last message only for preview
	})

	// Apply filters
	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	if priority != "" {
		query = query.Where("priority = ?", priority)
	}

	if category != "" {
		query = query.Where("category = ?", category)
	}

	// Get total count
	var total int64
	query.Count(&total)

	// Get paginated results
	offset := (page - 1) * perPage
	var tickets []models.SupportTicket
	if err := query.Offset(offset).Limit(perPage).Order("created_at DESC").Find(&tickets).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت لیست تیکت‌ها"})
		return
	}

	// Format response
	var responseTickets []models.TicketResponse
	for _, ticket := range tickets {
		// Get all messages for this ticket
		var messages []models.SupportTicketMessage
		db.Where("ticket_id = ?", ticket.ID).Preload("Sender").Order("created_at ASC").Find(&messages)

		// Format messages
		var messageResponses []models.TicketMessageResponse
		for _, msg := range messages {
			var senderResponse *models.TicketUserResponse
			if msg.Sender != nil {
				senderResponse = &models.TicketUserResponse{
					ID:        msg.Sender.ID,
					FirstName: msg.Sender.FirstName,
					LastName:  msg.Sender.LastName,
					Email:     msg.Sender.Email,
					Phone:     msg.Sender.Phone,
				}
			}

			messageResponses = append(messageResponses, models.TicketMessageResponse{
				ID:        msg.ID,
				Message:   msg.Message,
				IsAdmin:   msg.IsAdmin,
				Sender:    senderResponse,
				CreatedAt: msg.CreatedAt,
			})
		}

		responseTickets = append(responseTickets, models.TicketResponse{
			ID:          ticket.ID,
			Title:       ticket.Title,
			Description: ticket.Description,
			Priority:    ticket.Priority,
			Status:      ticket.Status,
			Category:    ticket.Category,
			User: models.TicketUserResponse{
				ID:        ticket.User.ID,
				FirstName: ticket.User.FirstName,
				LastName:  ticket.User.LastName,
				Email:     ticket.User.Email,
				Phone:     ticket.User.Phone,
			},
			Messages:  messageResponses,
			CreatedAt: ticket.CreatedAt,
			UpdatedAt: ticket.UpdatedAt,
		})
	}

	totalPages := (int(total) + perPage - 1) / perPage

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"tickets": responseTickets,
			"pagination": gin.H{
				"page":        page,
				"per_page":    perPage,
				"total":       total,
				"total_pages": totalPages,
				"has_next":    page < totalPages,
				"has_prev":    page > 1,
			},
		},
	})
}

// GetTicketDetailsForAdmin returns detailed information about a ticket
func GetTicketDetailsForAdmin(c *gin.Context) {
	db := models.GetDB()

	ticketID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه تیکت نامعتبر است"})
		return
	}

	var ticket models.SupportTicket
	if err := db.Where("id = ?", ticketID).
		Preload("User").
		Preload("Messages", func(db *gorm.DB) *gorm.DB {
			return db.Preload("Sender").Order("created_at ASC")
		}).
		First(&ticket).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "تیکت یافت نشد"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت تیکت"})
		}
		return
	}

	// Format messages
	var messageResponses []models.TicketMessageResponse
	for _, msg := range ticket.Messages {
		var senderResponse *models.TicketUserResponse
		if msg.Sender != nil {
			senderResponse = &models.TicketUserResponse{
				ID:        msg.Sender.ID,
				FirstName: msg.Sender.FirstName,
				LastName:  msg.Sender.LastName,
				Email:     msg.Sender.Email,
				Phone:     msg.Sender.Phone,
			}
		}

		messageResponses = append(messageResponses, models.TicketMessageResponse{
			ID:        msg.ID,
			Message:   msg.Message,
			IsAdmin:   msg.IsAdmin,
			Sender:    senderResponse,
			CreatedAt: msg.CreatedAt,
		})
	}

	response := models.TicketResponse{
		ID:          ticket.ID,
		Title:       ticket.Title,
		Description: ticket.Description,
		Priority:    ticket.Priority,
		Status:      ticket.Status,
		Category:    ticket.Category,
		User: models.TicketUserResponse{
			ID:        ticket.User.ID,
			FirstName: ticket.User.FirstName,
			LastName:  ticket.User.LastName,
			Email:     ticket.User.Email,
			Phone:     ticket.User.Phone,
		},
		Messages:  messageResponses,
		CreatedAt: ticket.CreatedAt,
		UpdatedAt: ticket.UpdatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    response,
	})
}

// UpdateTicketStatusForAdmin updates ticket status (admin only)
func UpdateTicketStatusForAdmin(c *gin.Context) {
	db := models.GetDB()
	adminID := c.GetUint("user_id")

	ticketID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه تیکت نامعتبر است"})
		return
	}

	var req struct {
		Status  string `json:"status" binding:"required,oneof=open in_progress waiting_response closed"`
		Message string `json:"message"` // Optional admin message
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "داده‌های ورودی نامعتبر"})
		return
	}

	// Check if ticket exists
	var ticket models.SupportTicket
	if err := db.Where("id = ?", ticketID).First(&ticket).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "تیکت یافت نشد"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت تیکت"})
		}
		return
	}

	// Update ticket status
	if err := db.Model(&ticket).Update("status", req.Status).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی وضعیت تیکت"})
		return
	}

	// Add admin message if provided
	if req.Message != "" {
		adminMessage := models.SupportTicketMessage{
			TicketID: ticket.ID,
			SenderID: &adminID,
			Message:  req.Message,
			IsAdmin:  true,
		}

		if err := db.Create(&adminMessage).Error; err != nil {
			log.Printf("Error creating admin message: %v", err)
		}

		// Notify user via Telegram if service is available and Telegram is enabled (non-Iran)
		if !config.AppConfig.Environment.IsInIran {
			go func() {
				telegramService := services.GetTelegramService()
				if telegramService != nil {
					user, _ := models.GetUserByID(db, ticket.UserID)
					telegramService.NotifyTicketMessage(&ticket, user, &adminMessage)
				}
			}()
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "وضعیت تیکت با موفقیت به‌روزرسانی شد",
	})
}

// AddAdminMessageToTicket adds an admin message to a ticket
func AddAdminMessageToTicket(c *gin.Context) {
	db := models.GetDB()
	adminID := c.GetUint("user_id")

	ticketID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه تیکت نامعتبر است"})
		return
	}

	var req models.AddMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "پیام نامعتبر است"})
		return
	}

	// Check if ticket exists
	var ticket models.SupportTicket
	if err := db.Where("id = ?", ticketID).First(&ticket).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "تیکت یافت نشد"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در یافتن تیکت"})
		}
		return
	}

	// Create admin message
	message := models.SupportTicketMessage{
		TicketID: uint(ticketID),
		SenderID: &adminID,
		Message:  req.Message,
		IsAdmin:  true,
	}

	if err := db.Create(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ارسال پیام"})
		return
	}

	// Update ticket status based on current status
	var newStatus string
	switch ticket.Status {
	case "open", "in_progress":
		newStatus = "waiting_response" // Admin replied, waiting for user
	default:
		newStatus = ticket.Status // Keep current status
	}

	db.Model(&ticket).Updates(map[string]interface{}{
		"status":     newStatus,
		"updated_at": time.Now(),
	})

	// Notify user via Telegram (only when Telegram is enabled and not in Iran)
	if !config.AppConfig.Environment.IsInIran {
		go func() {
			telegramService := services.GetTelegramService()
			if telegramService != nil {
				user, _ := models.GetUserByID(db, ticket.UserID)
				telegramService.NotifyTicketMessage(&ticket, user, &message)
			}
		}()
	}

	// Get updated ticket with messages
	var updatedTicket models.SupportTicket
	db.Where("id = ?", ticketID).
		Preload("User").
		Preload("Messages", func(db *gorm.DB) *gorm.DB {
			return db.Preload("Sender").Order("created_at ASC")
		}).
		First(&updatedTicket)

	// Format response
	var messageResponses []models.TicketMessageResponse
	for _, msg := range updatedTicket.Messages {
		var senderResponse *models.TicketUserResponse
		if msg.Sender != nil {
			senderResponse = &models.TicketUserResponse{
				ID:        msg.Sender.ID,
				FirstName: msg.Sender.FirstName,
				LastName:  msg.Sender.LastName,
				Email:     msg.Sender.Email,
				Phone:     msg.Sender.Phone,
			}
		}

		messageResponses = append(messageResponses, models.TicketMessageResponse{
			ID:        msg.ID,
			Message:   msg.Message,
			IsAdmin:   msg.IsAdmin,
			Sender:    senderResponse,
			CreatedAt: msg.CreatedAt,
		})
	}

	response := models.TicketResponse{
		ID:          updatedTicket.ID,
		Title:       updatedTicket.Title,
		Description: updatedTicket.Description,
		Priority:    updatedTicket.Priority,
		Status:      updatedTicket.Status,
		Category:    updatedTicket.Category,
		User: models.TicketUserResponse{
			ID:        updatedTicket.User.ID,
			FirstName: updatedTicket.User.FirstName,
			LastName:  updatedTicket.User.LastName,
			Email:     updatedTicket.User.Email,
			Phone:     updatedTicket.User.Phone,
		},
		Messages:  messageResponses,
		CreatedAt: updatedTicket.CreatedAt,
		UpdatedAt: updatedTicket.UpdatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "پیام با موفقیت ارسال شد",
		"data":    response,
	})
}

// UpdateTicketForAdmin updates ticket details (title, description, priority, category) - admin only
func UpdateTicketForAdmin(c *gin.Context) {
	db := models.GetDB()

	ticketID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه تیکت نامعتبر است"})
		return
	}

	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Priority    string `json:"priority" binding:"omitempty,oneof=low medium high urgent"`
		Category    string `json:"category" binding:"omitempty,oneof=general technical billing license other"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "داده‌های ورودی نامعتبر"})
		return
	}

	// Check if ticket exists
	var ticket models.SupportTicket
	if err := db.Where("id = ?", ticketID).First(&ticket).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "تیکت یافت نشد"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت تیکت"})
		}
		return
	}

	// Update fields
	updates := make(map[string]interface{})
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Priority != "" {
		updates["priority"] = req.Priority
	}
	if req.Category != "" {
		updates["category"] = req.Category
	}
	updates["updated_at"] = time.Now()

	if err := db.Model(&ticket).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی تیکت"})
		return
	}

	// Get updated ticket with relations
	var updatedTicket models.SupportTicket
	if err := db.Where("id = ?", ticketID).
		Preload("User").
		Preload("Messages", func(db *gorm.DB) *gorm.DB {
			return db.Preload("Sender").Order("created_at ASC")
		}).
		First(&updatedTicket).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت تیکت به‌روزرسانی شده"})
		return
	}

	// Format messages
	var messageResponses []models.TicketMessageResponse
	for _, msg := range updatedTicket.Messages {
		var senderResponse *models.TicketUserResponse
		if msg.Sender != nil {
			senderResponse = &models.TicketUserResponse{
				ID:        msg.Sender.ID,
				FirstName: msg.Sender.FirstName,
				LastName:  msg.Sender.LastName,
				Email:     msg.Sender.Email,
				Phone:     msg.Sender.Phone,
			}
		}

		messageResponses = append(messageResponses, models.TicketMessageResponse{
			ID:        msg.ID,
			Message:   msg.Message,
			IsAdmin:   msg.IsAdmin,
			Sender:    senderResponse,
			CreatedAt: msg.CreatedAt,
		})
	}

	response := models.TicketResponse{
		ID:          updatedTicket.ID,
		Title:       updatedTicket.Title,
		Description: updatedTicket.Description,
		Priority:    updatedTicket.Priority,
		Status:      updatedTicket.Status,
		Category:    updatedTicket.Category,
		User: models.TicketUserResponse{
			ID:        updatedTicket.User.ID,
			FirstName: updatedTicket.User.FirstName,
			LastName:  updatedTicket.User.LastName,
			Email:     updatedTicket.User.Email,
			Phone:     updatedTicket.User.Phone,
		},
		Messages:  messageResponses,
		CreatedAt: updatedTicket.CreatedAt,
		UpdatedAt: updatedTicket.UpdatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "تیکت با موفقیت به‌روزرسانی شد",
		"data":    response,
	})
}

// DeleteTicketForAdmin deletes a ticket (soft delete) - admin only
func DeleteTicketForAdmin(c *gin.Context) {
	db := models.GetDB()

	ticketID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه تیکت نامعتبر است"})
		return
	}

	// Check if ticket exists
	var ticket models.SupportTicket
	if err := db.Where("id = ?", ticketID).First(&ticket).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "تیکت یافت نشد"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت تیکت"})
		}
		return
	}

	// Soft delete ticket
	if err := db.Delete(&ticket).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف تیکت"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "تیکت با موفقیت حذف شد",
	})
}

// ============================================
// NOTIFICATION MANAGEMENT (ADMIN - Additional endpoints)
// ============================================

// GetAllNotificationsForAdmin returns all notifications for admin panel
func GetAllNotificationsForAdmin(c *gin.Context) {
	db := models.GetDB()

	// Parse query parameters
	pageStr := c.DefaultQuery("page", "1")
	perPageStr := c.DefaultQuery("per_page", "10")
	status := c.Query("status")         // active, inactive, all
	notificationType := c.Query("type") // info, warning, error, success

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	perPage, err := strconv.Atoi(perPageStr)
	if err != nil || perPage < 1 || perPage > 100 {
		perPage = 10
	}

	// Build query
	query := db.Model(&models.Notification{}).Preload("User").Preload("CreatedBy")

	// Apply status filter
	if status == "active" {
		query = query.Where("is_active = ?", true)
	} else if status == "inactive" {
		query = query.Where("is_active = ?", false)
	}

	// Apply type filter
	if notificationType != "" {
		query = query.Where("type = ?", notificationType)
	}

	// Get total count
	var total int64
	query.Count(&total)

	// Get paginated results
	offset := (page - 1) * perPage
	var notifications []models.Notification
	if err := query.Offset(offset).Limit(perPage).Order("created_at DESC").Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت لیست نوتیفیکیشن‌ها"})
		return
	}

	// Convert to response format
	var notificationsResponse []models.NotificationResponse
	for _, notification := range notifications {
		response := models.NotificationResponse{
			ID:          notification.ID,
			Title:       notification.Title,
			Message:     notification.Message,
			Type:        notification.Type,
			Priority:    notification.Priority,
			IsActive:    notification.IsActive,
			IsRead:      notification.IsRead,
			UserID:      notification.UserID,
			CreatedByID: notification.CreatedByID,
			ExpiresAt:   notification.ExpiresAt,
			ActionURL:   notification.ActionURL,
			ActionText:  notification.ActionText,
			CreatedAt:   notification.CreatedAt,
			UpdatedAt:   notification.UpdatedAt,
		}

		// Add created by info
		if notification.CreatedBy.ID > 0 {
			response.CreatedBy = models.UserResponse{
				ID:        notification.CreatedBy.ID,
				FirstName: notification.CreatedBy.FirstName,
				LastName:  notification.CreatedBy.LastName,
				Email:     notification.CreatedBy.Email,
			}
		}

		// Add user info if specific user notification
		if notification.UserID != nil && *notification.UserID > 0 {
			if notification.User != nil && notification.User.ID > 0 {
				response.User = &models.UserResponse{
					ID:        notification.User.ID,
					FirstName: notification.User.FirstName,
					LastName:  notification.User.LastName,
					Email:     notification.User.Email,
				}
			}
		}

		notificationsResponse = append(notificationsResponse, response)
	}

	totalPages := (int(total) + perPage - 1) / perPage

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"notifications": notificationsResponse,
			"total":         total,
			"page":          page,
			"per_page":      perPage,
			"total_pages":   totalPages,
			"has_next":      page < totalPages,
			"has_prev":      page > 1,
		},
	})
}

// ============================================
// EXCEL EXPORT/IMPORT
// ============================================

// ImportUsersFromExcel imports users from Excel/CSV file
func ImportUsersFromExcel(c *gin.Context) {
	db := models.GetDB()

	// Get uploaded file
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "فایل آپلود نشده است"})
		return
	}

	// Validate file type
	ext := strings.ToLower(file.Filename[strings.LastIndex(file.Filename, "."):])
	if ext != ".xlsx" && ext != ".xls" && ext != ".csv" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "فرمت فایل نامعتبر است. فقط Excel و CSV مجاز است"})
		return
	}

	// Validate file size (max 5MB)
	if file.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "حجم فایل نباید بیشتر از 5 مگابایت باشد"})
		return
	}

	// Open uploaded file
	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در باز کردن فایل"})
		return
	}
	defer src.Close()

	// Read file content
	var rows [][]string

	if ext == ".csv" {
		// Parse CSV
		content := new(bytes.Buffer)
		io.Copy(content, src)
		lines := strings.Split(content.String(), "\n")

		for _, line := range lines {
			if strings.TrimSpace(line) == "" {
				continue
			}
			// Simple CSV parsing (handle comma-separated values)
			fields := strings.Split(line, ",")
			for i := range fields {
				fields[i] = strings.TrimSpace(fields[i])
				// Remove quotes if present
				fields[i] = strings.Trim(fields[i], "\"")
			}
			rows = append(rows, fields)
		}
	} else {
		// Parse Excel
		f, err := excelize.OpenReader(src)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "خطا در خواندن فایل Excel"})
			return
		}
		defer f.Close()

		// Get first sheet
		sheets := f.GetSheetList()
		if len(sheets) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "فایل Excel خالی است"})
			return
		}

		rows, err = f.GetRows(sheets[0])
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "خطا در خواندن داده‌های Excel"})
			return
		}
	}

	if len(rows) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "فایل حداقل باید شامل یک ردیف داده باشد"})
		return
	}

	// Parse and validate users
	var successCount int
	var failedCount int
	var errors []string

	// Skip header row
	for i, row := range rows[1:] {
		rowNum := i + 2 // +2 because we skip header and arrays are 0-indexed

		// Validate row has enough columns (at least name, email, phone)
		if len(row) < 3 {
			errors = append(errors, fmt.Sprintf("ردیف %d: تعداد ستون‌ها کافی نیست", rowNum))
			failedCount++
			continue
		}

		// Parse fields
		name := strings.TrimSpace(row[0])
		email := strings.TrimSpace(row[1])
		phone := strings.TrimSpace(row[2])

		isActive := true
		if len(row) > 4 {
			statusStr := strings.TrimSpace(strings.ToLower(row[4]))
			if statusStr == "غیرفعال" || statusStr == "inactive" || statusStr == "false" || statusStr == "0" {
				isActive = false
			}
		}

		// Validate required fields
		if name == "" {
			errors = append(errors, fmt.Sprintf("ردیف %d: نام الزامی است", rowNum))
			failedCount++
			continue
		}

		if email == "" {
			errors = append(errors, fmt.Sprintf("ردیف %d: ایمیل الزامی است", rowNum))
			failedCount++
			continue
		}

		if phone == "" {
			errors = append(errors, fmt.Sprintf("ردیف %d: شماره تلفن الزامی است", rowNum))
			failedCount++
			continue
		}

		// Check if email already exists
		var existingUser models.User
		if err := db.Where("email = ?", email).First(&existingUser).Error; err == nil {
			errors = append(errors, fmt.Sprintf("ردیف %d: ایمیل %s قبلاً ثبت شده است", rowNum, email))
			failedCount++
			continue
		}

		// Check if phone already exists
		if err := db.Where("phone = ?", phone).First(&existingUser).Error; err == nil {
			errors = append(errors, fmt.Sprintf("ردیف %d: شماره تلفن %s قبلاً ثبت شده است", rowNum, phone))
			failedCount++
			continue
		}

		// Parse name into first_name and last_name
		nameParts := strings.Fields(name)
		firstName := ""
		lastName := ""
		if len(nameParts) > 0 {
			firstName = nameParts[0]
			if len(nameParts) > 1 {
				lastName = strings.Join(nameParts[1:], " ")
			}
		}

		// Hash default password
		hashedPassword, err := utils.HashPassword("123456")
		if err != nil {
			errors = append(errors, fmt.Sprintf("ردیف %d: خطا در پردازش رمز عبور", rowNum))
			failedCount++
			continue
		}

		// Create user
		user := models.User{
			FirstName: firstName,
			LastName:  lastName,
			Email:     email,
			Phone:     phone,
			Password:  hashedPassword,
			IsActive:  isActive,
		}

		if err := db.Create(&user).Error; err != nil {
			errors = append(errors, fmt.Sprintf("ردیف %d: خطا در ایجاد کاربر - %v", rowNum, err))
			failedCount++
			continue
		}

		successCount++
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("%d کاربر با موفقیت وارد شد، %d کاربر با خطا مواجه شد", successCount, failedCount),
		"data": gin.H{
			"success_count": successCount,
			"failed_count":  failedCount,
			"errors":        errors,
		},
	})
}

// ExportUsersToExcel exports users to Excel file
func ExportUsersToExcel(c *gin.Context) {
	db := models.GetDB()

	var users []models.User
	if err := db.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت کاربران"})
		return
	}

	// Create Excel file
	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {
			log.Printf("Error closing Excel file: %v", err)
		}
	}()

	sheetName := "Users"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد فایل Excel"})
		return
	}

	// Set headers
	headers := []string{"ID", "نام", "نام خانوادگی", "ایمیل", "تلفن", "فعال", "ادمین", "تاریخ ثبت"}
	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(sheetName, cell, header)
	}

	// Add data
	for i, user := range users {
		row := i + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), user.ID)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), user.FirstName)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), user.LastName)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), user.Email)
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), user.Phone)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), user.IsActive)
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), user.IsAdmin)
		f.SetCellValue(sheetName, fmt.Sprintf("H%d", row), user.CreatedAt.Format("2006-01-02 15:04:05"))
	}

	f.SetActiveSheet(index)

	// Save file
	filename := fmt.Sprintf("users_export_%s.xlsx", time.Now().Format("20060102_150405"))
	filepath := fmt.Sprintf("./uploads/exports/%s", filename)

	// Ensure directory exists
	if err := f.SaveAs(filepath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ذخیره فایل Excel"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"message":  "فایل Excel با موفقیت ایجاد شد",
		"filename": filename,
		"url":      fmt.Sprintf("/uploads/exports/%s", filename),
	})
}

// ExportSuppliersToExcel exports suppliers to Excel file
func ExportSuppliersToExcel(c *gin.Context) {
	db := models.GetDB()

	var suppliers []models.Supplier
	if err := db.Preload("User").Find(&suppliers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت تأمین‌کنندگان"})
		return
	}

	// Create Excel file
	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {
			log.Printf("Error closing Excel file: %v", err)
		}
	}()

	sheetName := "Suppliers"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد فایل Excel"})
		return
	}

	// Set headers
	headers := []string{"ID", "نام کامل", "موبایل", "شهر", "وضعیت", "تاریخ ثبت"}
	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(sheetName, cell, header)
	}

	// Add data
	for i, supplier := range suppliers {
		row := i + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), supplier.ID)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), supplier.FullName)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), supplier.Mobile)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), supplier.City)
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), supplier.Status)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), supplier.CreatedAt.Format("2006-01-02 15:04:05"))
	}

	f.SetActiveSheet(index)

	// Save file
	filename := fmt.Sprintf("suppliers_export_%s.xlsx", time.Now().Format("20060102_150405"))
	filepath := fmt.Sprintf("./uploads/exports/%s", filename)

	if err := f.SaveAs(filepath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ذخیره فایل Excel"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"message":  "فایل Excel با موفقیت ایجاد شد",
		"filename": filename,
		"url":      fmt.Sprintf("/uploads/exports/%s", filename),
	})
}

// ExportVisitorsToExcel exports visitors to Excel file
func ExportVisitorsToExcel(c *gin.Context) {
	db := models.GetDB()

	var visitors []models.Visitor
	if err := db.Preload("User").Find(&visitors).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت ویزیتورها"})
		return
	}

	// Create Excel file
	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {
			log.Printf("Error closing Excel file: %v", err)
		}
	}()

	sheetName := "Visitors"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد فایل Excel"})
		return
	}

	// Set headers
	headers := []string{"ID", "نام کامل", "موبایل", "شهر/کشور", "وضعیت", "تاریخ ثبت"}
	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(sheetName, cell, header)
	}

	// Add data
	for i, visitor := range visitors {
		row := i + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), visitor.ID)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), visitor.FullName)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), visitor.Mobile)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), visitor.CityProvince)
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), visitor.Status)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), visitor.CreatedAt.Format("2006-01-02 15:04:05"))
	}

	f.SetActiveSheet(index)

	// Save file
	filename := fmt.Sprintf("visitors_export_%s.xlsx", time.Now().Format("20060102_150405"))
	filepath := fmt.Sprintf("./uploads/exports/%s", filename)

	if err := f.SaveAs(filepath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ذخیره فایل Excel"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"message":  "فایل Excel با موفقیت ایجاد شد",
		"filename": filename,
		"url":      fmt.Sprintf("/uploads/exports/%s", filename),
	})
}

// ExportLicensesToExcel exports licenses to Excel file
func ExportLicensesToExcel(c *gin.Context) {
	db := models.GetDB()

	var licenses []models.License
	if err := db.Preload("User").Preload("Admin").Find(&licenses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت لایسنس‌ها"})
		return
	}

	// Create Excel file
	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {
			log.Printf("Error closing Excel file: %v", err)
		}
	}()

	sheetName := "Licenses"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد فایل Excel"})
		return
	}

	// Set headers
	headers := []string{"ID", "کد لایسنس", "نوع", "مدت (ماه)", "استفاده شده", "کاربر", "تاریخ تولید"}
	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(sheetName, cell, header)
	}

	// Add data
	for i, license := range licenses {
		row := i + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), license.ID)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), license.Code)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), license.Type)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), license.Duration)
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), license.IsUsed)
		if license.User != nil {
			f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), fmt.Sprintf("%s %s", license.User.FirstName, license.User.LastName))
		}
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), license.CreatedAt.Format("2006-01-02 15:04:05"))
	}

	f.SetActiveSheet(index)

	// Save file
	filename := fmt.Sprintf("licenses_export_%s.xlsx", time.Now().Format("20060102_150405"))
	filepath := fmt.Sprintf("./uploads/exports/%s", filename)

	if err := f.SaveAs(filepath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ذخیره فایل Excel"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"message":  "فایل Excel با موفقیت ایجاد شد",
		"filename": filename,
		"url":      fmt.Sprintf("/uploads/exports/%s", filename),
	})
}

// ============================================
// RE-EXPORT EXISTING ENDPOINTS (for consistency)
// ============================================

// Note: The following endpoints are already implemented in other controller files,
// but we're documenting them here for reference:
//
// Suppliers:
// - GetSuppliersForAdmin (supplier_controller.go)
// - ApproveSupplier (supplier_controller.go)
// - RejectSupplier (supplier_controller.go)
// - SetSupplierFeatured (supplier_controller.go)
//
// Visitors:
// - GetVisitorsForAdmin (visitor_controller.go)
// - ApproveVisitorByAdmin (visitor_controller.go)
// - RejectVisitorByAdmin (visitor_controller.go)
// - UpdateVisitorStatus (visitor_controller.go)
//
// Withdrawals:
// - GetAllWithdrawalRequests (withdrawal_controller.go)
// - UpdateWithdrawalStatus (withdrawal_controller.go)
// - GetAllWithdrawalStats (withdrawal_controller.go)
//
// Training Videos:
// - GetAllVideosForAdmin (training_controller.go)
// - CreateTrainingVideo (training_controller.go)
// - UpdateTrainingVideo (training_controller.go)
// - DeleteTrainingVideo (training_controller.go)
// - CreateTrainingCategory (training_controller.go)
//
// Notifications:
// - CreateNotification (notification_controller.go)
// - UpdateNotification (notification_controller.go)
// - DeleteNotification (notification_controller.go)
// - GetNotificationStats (notification_controller.go)
//
// Marketing Popups:
// - GetMarketingPopups (marketing_popup_controller.go)
// - CreateMarketingPopup (marketing_popup_controller.go)
// - UpdateMarketingPopup (marketing_popup_controller.go)
// - DeleteMarketingPopup (marketing_popup_controller.go)
//
// Research Products:
// - CreateResearchProduct (research_product_controller.go)
// - UpdateResearchProduct (research_product_controller.go)
// - DeleteResearchProduct (research_product_controller.go)
// - UpdateResearchProductStatus (research_product_controller.go)
// - ImportResearchProductsFromExcel (research_product_controller.go)
//
// Available Products:
// - CreateAvailableProduct (available_product_controller.go)
// - UpdateAvailableProduct (available_product_controller.go)
// - DeleteAvailableProduct (available_product_controller.go)
// - UpdateAvailableProductStatus (available_product_controller.go)

// ============================================
// ADMIN MANAGEMENT (Telegram Admins)
// ============================================

// GetTelegramAdminsForAdmin returns all telegram admins for admin panel
func GetTelegramAdminsForAdmin(c *gin.Context) {
	db := models.GetDB()

	// Get all admins (both full and support)
	admins, err := models.GetAllAdmins(db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت لیست ادمین‌ها"})
		return
	}

	// Format response
	var response []gin.H
	for _, admin := range admins {
		adminType := "admin"
		if admin.IsFullAdmin {
			adminType = "super_admin"
		} else {
			adminType = "moderator" // Support admin = moderator
		}

		status := "active"
		if !admin.IsActive {
			status = "inactive"
		}

		response = append(response, gin.H{
			"id":            admin.ID,
			"telegram_id":   admin.TelegramID,
			"name":          admin.FirstName,
			"username":      admin.Username,
			"email":         "", // Telegram admins don't have email
			"phone":         "", // Telegram admins don't have phone
			"role":          adminType,
			"status":        status,
			"is_full_admin": admin.IsFullAdmin,
			"is_active":     admin.IsActive,
			"notes":         admin.Notes,
			"created_at":    admin.CreatedAt.Format(time.RFC3339),
			"updated_at":    admin.UpdatedAt.Format(time.RFC3339),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"admins": response,
			"total":  len(response),
		},
	})
}

// AddTelegramAdmin adds a new telegram admin
func AddTelegramAdmin(c *gin.Context) {
	db := models.GetDB()
	addedByID := c.GetUint("user_id")

	var req struct {
		TelegramID  int64  `json:"telegram_id" binding:"required"`
		FirstName   string `json:"first_name" binding:"required"`
		Username    string `json:"username"`
		IsFullAdmin bool   `json:"is_full_admin"`
		Notes       string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "داده‌های ورودی نامعتبر است"})
		return
	}

	// Add admin
	admin, err := models.AddAdmin(db, req.TelegramID, req.FirstName, req.Username, req.IsFullAdmin, int64(addedByID), req.Notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در اضافه کردن ادمین"})
		return
	}

	adminType := "admin"
	if admin.IsFullAdmin {
		adminType = "super_admin"
	} else {
		adminType = "moderator"
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"id":            admin.ID,
			"telegram_id":   admin.TelegramID,
			"name":          admin.FirstName,
			"username":      admin.Username,
			"role":          adminType,
			"is_full_admin": admin.IsFullAdmin,
			"is_active":     admin.IsActive,
		},
	})
}

// RemoveTelegramAdmin removes a telegram admin (soft delete)
func RemoveTelegramAdmin(c *gin.Context) {
	db := models.GetDB()

	telegramIDStr := c.Param("telegram_id")
	telegramID, err := strconv.ParseInt(telegramIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه تلگرام نامعتبر است"})
		return
	}

	err = models.RemoveAdmin(db, telegramID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف ادمین"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "ادمین با موفقیت حذف شد",
	})
}

// ============================================
// WEB ADMIN MANAGEMENT (Panel Admins)
// ============================================

// GetWebAdmins returns all web panel admins with pagination and filters
func GetWebAdmins(c *gin.Context) {
	db := models.GetDB()

	// Get query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	role := c.Query("role")
	status := c.Query("status")

	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 10
	}

	// Get admins
	admins, total, err := models.GetAllWebAdmins(db, page, perPage, role, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت لیست مدیران"})
		return
	}

	// Format response
	var response []gin.H
	for _, admin := range admins {
		// Parse permissions (stored as JSON string)
		permissions := []string{}
		if admin.Permissions != "" {
			// Simple parsing - assuming comma-separated or JSON array
			if admin.Permissions[0] == '[' {
				// JSON array format
				_ = json.Unmarshal([]byte(admin.Permissions), &permissions)
			} else {
				// Comma-separated format
				parts := strings.Split(admin.Permissions, ",")
				for _, part := range parts {
					permissions = append(permissions, strings.TrimSpace(part))
				}
			}
		}

		statusStr := "active"
		if !admin.IsActive {
			statusStr = "inactive"
		}

		lastLoginStr := ""
		if admin.LastLogin != nil {
			lastLoginStr = admin.LastLogin.Format(time.RFC3339)
		}

		response = append(response, gin.H{
			"id":          admin.ID,
			"name":        admin.Name,
			"email":       admin.Email,
			"phone":       admin.Phone,
			"username":    admin.Username,
			"telegram_id": admin.TelegramID,
			"role":        admin.Role,
			"permissions": permissions,
			"status":      statusStr,
			"is_active":   admin.IsActive,
			"last_login":  lastLoginStr,
			"login_count": admin.LoginCount,
			"created_at":  admin.CreatedAt.Format(time.RFC3339),
			"updated_at":  admin.UpdatedAt.Format(time.RFC3339),
		})
	}

	totalPages := (int(total) + perPage - 1) / perPage
	if totalPages == 0 {
		totalPages = 1
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"admins":      response,
			"total":       total,
			"page":        page,
			"per_page":    perPage,
			"total_pages": totalPages,
		},
	})
}

// GetWebAdmin returns a single web admin by ID
func GetWebAdmin(c *gin.Context) {
	db := models.GetDB()

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه مدیر نامعتبر است"})
		return
	}

	admin, err := models.GetWebAdminByID(db, uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "مدیر یافت نشد"})
		return
	}

	// Parse permissions
	permissions := []string{}
	if admin.Permissions != "" {
		if admin.Permissions[0] == '[' {
			_ = json.Unmarshal([]byte(admin.Permissions), &permissions)
		} else {
			parts := strings.Split(admin.Permissions, ",")
			for _, part := range parts {
				permissions = append(permissions, strings.TrimSpace(part))
			}
		}
	}

	statusStr := "active"
	if !admin.IsActive {
		statusStr = "inactive"
	}

	lastLoginStr := ""
	if admin.LastLogin != nil {
		lastLoginStr = admin.LastLogin.Format(time.RFC3339)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"id":          admin.ID,
			"name":        admin.Name,
			"email":       admin.Email,
			"phone":       admin.Phone,
			"username":    admin.Username,
			"telegram_id": admin.TelegramID,
			"role":        admin.Role,
			"permissions": permissions,
			"status":      statusStr,
			"is_active":   admin.IsActive,
			"last_login":  lastLoginStr,
			"login_count": admin.LoginCount,
			"created_at":  admin.CreatedAt.Format(time.RFC3339),
			"updated_at":  admin.UpdatedAt.Format(time.RFC3339),
		},
	})
}

// CreateWebAdmin creates a new web panel admin
func CreateWebAdmin(c *gin.Context) {
	db := models.GetDB()

	var req struct {
		Name        string   `json:"name" binding:"required"`
		Email       string   `json:"email" binding:"required,email"`
		Phone       string   `json:"phone" binding:"required"`
		Username    string   `json:"username" binding:"required"`
		Password    string   `json:"password" binding:"required,min=6"`
		TelegramID  *int64   `json:"telegram_id"`
		Role        string   `json:"role" binding:"required,oneof=super_admin admin moderator"`
		Permissions []string `json:"permissions"`
		IsActive    bool     `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("CreateWebAdmin: Invalid request data: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "داده‌های ورودی نامعتبر است: " + err.Error()})
		return
	}

	log.Printf("CreateWebAdmin: Creating admin with Username: '%s', Email: '%s', Name: '%s', Role: '%s', IsActive: %v",
		req.Username, req.Email, req.Name, req.Role, req.IsActive)

	// Check if username already exists
	var existingUsername models.WebAdmin
	if err := db.Where("username = ? AND deleted_at IS NULL", req.Username).First(&existingUsername).Error; err == nil {
		log.Printf("CreateWebAdmin: Username '%s' already exists (ID: %d)", req.Username, existingUsername.ID)
		c.JSON(http.StatusConflict, gin.H{"error": "نام کاربری قبلاً استفاده شده است"})
		return
	}

	// Check if email already exists
	var existingEmail models.WebAdmin
	if err := db.Where("email = ? AND deleted_at IS NULL", req.Email).First(&existingEmail).Error; err == nil {
		log.Printf("CreateWebAdmin: Email '%s' already exists (ID: %d)", req.Email, existingEmail.ID)
		c.JSON(http.StatusConflict, gin.H{"error": "ایمیل قبلاً استفاده شده است"})
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در رمزگذاری رمز عبور"})
		return
	}

	// Serialize permissions to JSON
	permissionsJSON := "[]"
	if len(req.Permissions) > 0 {
		permissionsBytes, _ := json.Marshal(req.Permissions)
		permissionsJSON = string(permissionsBytes)
	}

	// Create admin
	admin := models.WebAdmin{
		Name:        req.Name,
		Email:       req.Email,
		Phone:       req.Phone,
		Username:    strings.TrimSpace(req.Username), // Trim whitespace
		Password:    hashedPassword,
		TelegramID:  req.TelegramID,
		Role:        req.Role,
		Permissions: permissionsJSON,
		IsActive:    req.IsActive,
		LoginCount:  0,
	}

	log.Printf("CreateWebAdmin: About to create admin - Username: '%s' (len: %d), Email: '%s'",
		admin.Username, len(admin.Username), admin.Email)

	if err := models.CreateWebAdmin(db, &admin); err != nil {
		log.Printf("CreateWebAdmin: Error creating admin: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد مدیر: " + err.Error()})
		return
	}

	// Verify the admin was created correctly
	var verifyAdmin models.WebAdmin
	if err := db.First(&verifyAdmin, admin.ID).Error; err == nil {
		log.Printf("CreateWebAdmin: Admin created and verified - ID: %d, Username: '%s' (len: %d), Email: '%s', IsActive: %v",
			verifyAdmin.ID, verifyAdmin.Username, len(verifyAdmin.Username), verifyAdmin.Email, verifyAdmin.IsActive)
	} else {
		log.Printf("CreateWebAdmin: Warning - Could not verify created admin: %v", err)
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "مدیر با موفقیت ایجاد شد",
		"data": gin.H{
			"id":         admin.ID,
			"name":       admin.Name,
			"email":      admin.Email,
			"username":   admin.Username,
			"role":       admin.Role,
			"is_active":  admin.IsActive,
			"created_at": admin.CreatedAt.Format(time.RFC3339),
		},
	})
}

// UpdateWebAdmin updates an existing web panel admin
func UpdateWebAdmin(c *gin.Context) {
	db := models.GetDB()

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه مدیر نامعتبر است"})
		return
	}

	var req struct {
		Name        string   `json:"name"`
		Email       string   `json:"email"`
		Phone       string   `json:"phone"`
		Username    string   `json:"username"`
		Password    string   `json:"password"`
		TelegramID  *int64   `json:"telegram_id"`
		Role        string   `json:"role"`
		Permissions []string `json:"permissions"`
		IsActive    *bool    `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "داده‌های ورودی نامعتبر است"})
		return
	}

	// Check if admin exists
	_, err = models.GetWebAdminByID(db, uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "مدیر یافت نشد"})
		return
	}

	// Build updates map
	updates := make(map[string]interface{})

	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Email != "" {
		// Check if email is already taken by another admin
		var existingEmail models.WebAdmin
		if err := db.Where("email = ? AND id != ? AND deleted_at IS NULL", req.Email, id).First(&existingEmail).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "ایمیل قبلاً استفاده شده است"})
			return
		}
		updates["email"] = req.Email
	}
	if req.Phone != "" {
		updates["phone"] = req.Phone
	}
	if req.Username != "" {
		// Check if username is already taken by another admin
		var existingUsername models.WebAdmin
		if err := db.Where("username = ? AND id != ? AND deleted_at IS NULL", req.Username, id).First(&existingUsername).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "نام کاربری قبلاً استفاده شده است"})
			return
		}
		updates["username"] = req.Username
	}
	if req.Password != "" {
		hashedPassword, err := utils.HashPassword(req.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در رمزگذاری رمز عبور"})
			return
		}
		updates["password"] = hashedPassword
	}
	if req.TelegramID != nil {
		updates["telegram_id"] = req.TelegramID
	}
	if req.Role != "" {
		updates["role"] = req.Role
	}
	if req.Permissions != nil {
		permissionsJSON := "[]"
		if len(req.Permissions) > 0 {
			permissionsBytes, _ := json.Marshal(req.Permissions)
			permissionsJSON = string(permissionsBytes)
		}
		updates["permissions"] = permissionsJSON
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}

	if err := models.UpdateWebAdmin(db, uint(id), updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی مدیر: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "مدیر با موفقیت به‌روزرسانی شد",
	})
}

// DeleteWebAdmin deletes a web panel admin (soft delete)
func DeleteWebAdmin(c *gin.Context) {
	db := models.GetDB()

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه مدیر نامعتبر است"})
		return
	}

	// Check if admin exists
	_, err = models.GetWebAdminByID(db, uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "مدیر یافت نشد"})
		return
	}

	if err := models.DeleteWebAdmin(db, uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف مدیر"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "مدیر با موفقیت حذف شد",
	})
}

// ==================== AFFILIATE MANAGEMENT (Admin Panel) ====================

// GetAffiliates returns all affiliates with pagination and aggregate stats
func GetAffiliates(c *gin.Context) {
	db := models.GetDB()
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	status := c.Query("status")
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 10
	}
	admins, total, err := models.GetAllAffiliates(db, page, perPage, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت لیست افیلیت‌ها"})
		return
	}
	// افیلیت‌هایی که درخواست برداشت پیگیری‌نشده دارند (pending, approved, processing)
	var pendingAffiliateIDs []uint
	db.Model(&models.AffiliateWithdrawalRequest{}).
		Where("status IN ?", []models.AffiliateWithdrawalStatus{models.AffiliateWithdrawalPending, models.AffiliateWithdrawalApproved, models.AffiliateWithdrawalProcessing}).
		Distinct("affiliate_id").Pluck("affiliate_id", &pendingAffiliateIDs)
	pendingSet := make(map[uint]bool)
	for _, id := range pendingAffiliateIDs {
		pendingSet[id] = true
	}
	list := make([]gin.H, 0, len(admins))
	for _, a := range admins {
		needsFollowup := pendingSet[a.ID]
		list = append(list, gin.H{
			"id":                        a.ID,
			"name":                      a.Name,
			"username":                  a.Username,
			"referral_code":             a.ReferralCode,
			"referral_link":             a.ReferralLink,
			"balance":                   a.Balance,
			"total_earnings":            a.TotalEarnings,
			"commission_percent":        a.CommissionPercent,
			"is_active":                 a.IsActive,
			"last_login":                a.LastLogin,
			"login_count":               a.LoginCount,
			"created_at":                a.CreatedAt.Format(time.RFC3339),
			"needs_withdrawal_followup": needsFollowup,
		})
	}

	// آمار کلی: تعداد افیلیت‌های فعال، مجموع درآمد افیلیت‌ها، تعداد لیدها
	var activeCount int64
	db.Model(&models.Affiliate{}).Where("deleted_at IS NULL AND is_active = ?", true).Count(&activeCount)
	var totalAffiliateIncome float64
	db.Model(&models.Affiliate{}).Where("deleted_at IS NULL").Select("SUM(total_earnings * COALESCE(NULLIF(commission_percent, 0), 100) / 100)").Scan(&totalAffiliateIncome)
	var totalLeads int64
	db.Model(&models.AffiliateRegisteredUser{}).Where("deleted_at IS NULL").Count(&totalLeads)

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"affiliates": list,
			"total":      total,
			"page":       page,
			"per_page":   perPage,
			"stats": gin.H{
				"active_count":           activeCount,
				"total_affiliate_income": totalAffiliateIncome,
				"total_leads":            totalLeads,
			},
		},
	})
}

// GetAffiliate returns a single affiliate by ID
func GetAffiliate(c *gin.Context) {
	db := models.GetDB()
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه نامعتبر است"})
		return
	}
	aff, err := models.GetAffiliateByID(db, uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "افیلیت یافت نشد"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"id":                 aff.ID,
			"name":               aff.Name,
			"username":           aff.Username,
			"referral_code":      aff.ReferralCode,
			"referral_link":      aff.ReferralLink,
			"balance":            aff.Balance,
			"total_earnings":     aff.TotalEarnings,
			"commission_percent": aff.CommissionPercent,
			"is_active":          aff.IsActive,
			"last_login":         aff.LastLogin,
			"login_count":        aff.LoginCount,
			"created_at":         aff.CreatedAt.Format(time.RFC3339),
		},
	})
}

// CreateAffiliate creates a new affiliate
func CreateAffiliate(c *gin.Context) {
	db := models.GetDB()
	var req struct {
		Name     string `json:"name" binding:"required"`
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "داده‌های ورودی نامعتبر است: " + err.Error()})
		return
	}

	// Normalize username: trim spaces and convert to lowercase for consistency
	usernameNormalized := strings.TrimSpace(strings.ToLower(req.Username))
	if usernameNormalized == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "نام کاربری نمی‌تواند خالی باشد"})
		return
	}

	// Check for existing affiliate (case-insensitive check)
	var existing models.Affiliate
	if err := db.Where("LOWER(TRIM(username)) = ? AND deleted_at IS NULL", usernameNormalized).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "نام کاربری قبلاً استفاده شده است"})
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در رمزگذاری رمز عبور"})
		return
	}

	// Create affiliate with normalized username
	aff := &models.Affiliate{
		Name:     strings.TrimSpace(req.Name),
		Username: usernameNormalized, // Store normalized username
		Password: hashedPassword,
		IsActive: true,
	}

	if err := models.CreateAffiliate(db, aff); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد افیلیت: " + err.Error()})
		return
	}

	// Reload affiliate to get updated referral_link
	if err := db.First(aff, aff.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بارگذاری افیلیت"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "افیلیت با موفقیت ایجاد شد",
		"data": gin.H{
			"id":            aff.ID,
			"name":          aff.Name,
			"username":      aff.Username,
			"referral_code": aff.ReferralCode,
			"referral_link": aff.ReferralLink,
			"is_active":     aff.IsActive,
			"created_at":    aff.CreatedAt.Format(time.RFC3339),
		},
	})
}

// UpdateAffiliate updates an existing affiliate
func UpdateAffiliate(c *gin.Context) {
	db := models.GetDB()
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه نامعتبر است"})
		return
	}
	_, err = models.GetAffiliateByID(db, uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "افیلیت یافت نشد"})
		return
	}
	var req struct {
		Name              *string  `json:"name"`
		Password          *string  `json:"password"`
		IsActive          *bool    `json:"is_active"`
		Balance           *float64 `json:"balance"`
		ReferralLink      *string  `json:"referral_link"`
		CommissionPercent *float64 `json:"commission_percent"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "داده‌های ورودی نامعتبر است"})
		return
	}
	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Password != nil && len(*req.Password) >= 6 {
		hashed, _ := utils.HashPassword(*req.Password)
		updates["password"] = hashed
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}
	if req.Balance != nil {
		updates["balance"] = *req.Balance
	}
	if req.ReferralLink != nil {
		link := strings.TrimSpace(*req.ReferralLink)
		updates["referral_link"] = link
	}
	if req.CommissionPercent != nil {
		pct := *req.CommissionPercent
		if pct >= 0 && pct <= 100 {
			updates["commission_percent"] = pct
		}
	}
	if len(updates) == 0 {
		c.JSON(http.StatusOK, gin.H{"success": true, "message": "بدون تغییر"})
		return
	}
	if err := models.UpdateAffiliate(db, uint(id), updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی افیلیت"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "افیلیت با موفقیت به‌روزرسانی شد"})
}

// DeleteAffiliate soft deletes an affiliate
func DeleteAffiliate(c *gin.Context) {
	db := models.GetDB()
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه نامعتبر است"})
		return
	}
	if _, err = models.GetAffiliateByID(db, uint(id)); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "افیلیت یافت نشد"})
		return
	}
	if err := models.DeleteAffiliate(db, uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف افیلیت"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "افیلیت با موفقیت حذف شد"})
}

// GetAffiliateRegisteredUsers returns paginated registered users for an affiliate (admin)
func GetAffiliateRegisteredUsers(c *gin.Context) {
	db := models.GetDB()
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه نامعتبر است"})
		return
	}
	if _, err = models.GetAffiliateByID(db, uint(id)); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "افیلیت یافت نشد"})
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "50"))
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 10000 {
		perPage = 50
	}
	offset := (page - 1) * perPage
	list, total, err := models.GetAffiliateRegisteredUsers(db, uint(id), perPage, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت لیست"})
		return
	}
	out := make([]gin.H, 0, len(list))
	for _, r := range list {
		regAt := ""
		if r.RegisteredAt != nil {
			regAt = r.RegisteredAt.Format("2006-01-02")
		}
		out = append(out, gin.H{"id": r.ID, "name": r.Name, "phone": r.Phone, "registered_at": regAt, "created_at": r.CreatedAt.Format(time.RFC3339)})
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"items": out, "total": total, "page": page, "per_page": perPage}})
}

// truncate returns s limited to maxLen runes
func truncate(s string, maxLen int) string {
	r := []rune(s)
	if len(r) <= maxLen {
		return s
	}
	return string(r[:maxLen]) + "..."
}

// truncateSlice returns first max elements of slice as string for logging
func truncateSlice(parts []string, max int) string {
	if len(parts) == 0 {
		return "[]"
	}
	var b strings.Builder
	b.WriteString("[")
	for i, p := range parts {
		if i >= max {
			b.WriteString("...")
			break
		}
		if i > 0 {
			b.WriteString(", ")
		}
		short := p
		if len([]rune(p)) > 30 {
			short = string([]rune(p)[:30]) + "..."
		}
		b.WriteString(`"` + short + `"`)
	}
	b.WriteString("]")
	return b.String()
}

// parseCSVLine parses a single CSV line into fields. Handles quoted fields and bare quotes without failing.
func parseCSVLine(line string) []string {
	var fields []string
	var cur strings.Builder
	inQuote := false
	for i := 0; i < len(line); i++ {
		c := line[i]
		switch c {
		case '"':
			if inQuote {
				// Check for escaped quote ""
				if i+1 < len(line) && line[i+1] == '"' {
					cur.WriteByte('"')
					i++
				} else {
					inQuote = false
				}
			} else {
				inQuote = true
			}
		case ',':
			if inQuote {
				cur.WriteByte(c)
			} else {
				fields = append(fields, strings.TrimSpace(cur.String()))
				cur.Reset()
			}
		default:
			cur.WriteByte(c)
		}
	}
	fields = append(fields, strings.TrimSpace(cur.String()))
	return fields
}

// ImportAffiliateRegisteredUsers parses CSV and saves registered users for an affiliate
// CSV expected: name (col 0), phone (col 1), created_at (col 4 - "ایجاد شده در")
func ImportAffiliateRegisteredUsers(c *gin.Context) {
	db := models.GetDB()
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه نامعتبر است"})
		return
	}
	if _, err = models.GetAffiliateByID(db, uint(id)); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "افیلیت یافت نشد"})
		return
	}
	file, fileHeader, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "فایل ارسال نشده است"})
		return
	}
	defer file.Close()

	// Get file extension
	filename := fileHeader.Filename
	isExcel := strings.HasSuffix(strings.ToLower(filename), ".xlsx") || strings.HasSuffix(strings.ToLower(filename), ".xls")
	log.Printf("[ImportAffiliate] filename=%s isExcel=%v", filename, isExcel)

	var rows [][]string

	if isExcel {
		// Handle Excel file
		fileBytes, err := io.ReadAll(file)
		if err != nil {
			log.Printf("[ImportAffiliate] Excel read error: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "خطا در خواندن فایل Excel: " + err.Error()})
			return
		}
		log.Printf("[ImportAffiliate] Excel file size: %d bytes", len(fileBytes))

		xlFile, err := excelize.OpenReader(bytes.NewReader(fileBytes))
		if err != nil {
			log.Printf("[ImportAffiliate] Excel open error: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "خطا در باز کردن فایل Excel: " + err.Error()})
			return
		}
		defer xlFile.Close()

		sheetName := xlFile.GetSheetName(0)
		if sheetName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "فایل Excel خالی است"})
			return
		}

		excelRows, err := xlFile.GetRows(sheetName)
		if err != nil {
			log.Printf("[ImportAffiliate] Excel GetRows error: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "خطا در خواندن داده‌های Excel: " + err.Error()})
			return
		}
		log.Printf("[ImportAffiliate] Excel rows: %d", len(excelRows))
		rows = excelRows
	} else {
		// Handle CSV: read raw content and parse manually (no encoding/csv to avoid "bare quote" errors)
		content, err := io.ReadAll(file)
		if err != nil {
			log.Printf("[ImportAffiliate] CSV read error: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "خطا در خواندن فایل: " + err.Error()})
			return
		}
		contentStr := string(content)
		contentStr = strings.TrimPrefix(contentStr, "\ufeff")
		log.Printf("[ImportAffiliate] CSV size: %d bytes, first 200 chars: %q", len(contentStr), truncate(contentStr, 200))

		// Character-by-character CSV parser: never fails on quotes
		lines := strings.Split(contentStr, "\n")
		csvRows := [][]string{}
		for lineNum, line := range lines {
			line = strings.TrimRight(line, "\r")
			if strings.TrimSpace(line) == "" {
				continue
			}
			// Parse one line into fields (respect quotes, commas inside quotes don't split)
			fields := parseCSVLine(line)
			if lineNum == 0 {
				log.Printf("[ImportAffiliate] Line 1 has %d fields, first 3: %q", len(fields), truncateSlice(fields, 3))
			}
			hasData := false
			for _, f := range fields {
				if strings.TrimSpace(f) != "" {
					hasData = true
					break
				}
			}
			if hasData {
				csvRows = append(csvRows, fields)
			}
		}

		if len(csvRows) == 0 {
			log.Printf("[ImportAffiliate] No rows parsed from CSV")
			c.JSON(http.StatusBadRequest, gin.H{"error": "هیچ داده‌ای در فایل CSV یافت نشد"})
			return
		}
		log.Printf("[ImportAffiliate] CSV parsed %d rows", len(csvRows))
		rows = csvRows
	}
	var toInsert []models.AffiliateRegisteredUser
	for i, row := range rows {
		// Skip empty rows
		if len(row) == 0 {
			continue
		}

		// Skip header row (check first few rows)
		if i == 0 && len(row) > 0 {
			firstCell := strings.ToLower(strings.TrimSpace(row[0]))
			if strings.Contains(firstCell, "نام") || strings.Contains(firstCell, "name") ||
				strings.Contains(firstCell, "نام و نام") || firstCell == "" {
				continue
			}
		}

		// Need at least name and phone (columns 0 and 1)
		if len(row) < 2 {
			continue
		}

		// Clean and extract name (column 0)
		name := strings.TrimSpace(row[0])
		name = strings.Trim(name, "\"'\t ")
		if name == "" {
			continue
		}

		// Clean and extract phone (column 1)
		phone := strings.TrimSpace(row[1])
		phone = strings.Trim(phone, "\"'\t ")
		if phone == "" {
			continue
		}

		// Normalize phone: extract digits only
		phone = strings.Map(func(r rune) rune {
			if r >= '0' && r <= '9' {
				return r
			}
			return -1
		}, phone)

		// Validate phone length (Iranian phones: 10-11 digits)
		if len(phone) < 10 || len(phone) > 11 {
			continue
		}

		// Extract registration date (column 4 - "ایجاد شده در")
		var regAt *time.Time
		if len(row) >= 5 {
			dateStr := strings.TrimSpace(row[4])
			dateStr = strings.Trim(dateStr, "\"'\t ")
			if dateStr != "" {
				// Try different date formats
				formats := []string{
					"2006-01-02 15:04:05",
					"2006-01-02",
					"02/01/2006 15:04:05",
					"02/01/2006",
				}
				for _, fmt := range formats {
					if t, e := time.Parse(fmt, dateStr); e == nil {
						regAt = &t
						break
					}
				}
			}
		}

		toInsert = append(toInsert, models.AffiliateRegisteredUser{
			Name:         name,
			Phone:        phone,
			RegisteredAt: regAt,
		})
	}
	if len(toInsert) == 0 {
		log.Printf("[ImportAffiliate] No valid records (name+phone) after filtering")
		c.JSON(http.StatusBadRequest, gin.H{"error": "هیچ رکورد معتبری در فایل یافت نشد (نام و شماره موبایل معتبر)"})
		return
	}
	log.Printf("[ImportAffiliate] Inserting %d valid records for affiliate id=%s", len(toInsert), idStr)
	if err := models.CreateAffiliateRegisteredUserBatch(db, uint(id), toInsert); err != nil {
		log.Printf("[ImportAffiliate] DB insert error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ذخیره: " + err.Error()})
		return
	}
	log.Printf("[ImportAffiliate] Success: %d records saved", len(toInsert))
	c.JSON(http.StatusOK, gin.H{"success": true, "message": fmt.Sprintf("%d نفر به لیست ثبت‌نامی اضافه شد", len(toInsert)), "count": len(toInsert)})
}

// MatchAffiliateSalesRequestBody for POST body
type MatchAffiliateSalesRequestBody struct {
	Buyers []struct {
		Name  string `json:"name"`
		Phone string `json:"phone"`
	} `json:"buyers"`
}

// MatchAffiliateSales matches a list of buyers (name+phone) against affiliate's registered users; returns matched list
func MatchAffiliateSales(c *gin.Context) {
	db := models.GetDB()
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه نامعتبر است"})
		return
	}
	if _, err = models.GetAffiliateByID(db, uint(id)); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "افیلیت یافت نشد"})
		return
	}
	var req MatchAffiliateSalesRequestBody
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "داده‌های ورودی نامعتبر است"})
		return
	}
	normalizePhone := func(s string) string {
		return strings.Map(func(r rune) rune {
			if r >= '0' && r <= '9' {
				return r
			}
			return -1
		}, strings.TrimSpace(s))
	}
	normalizeName := func(s string) string {
		return strings.TrimSpace(strings.ToLower(s))
	}
	// load all registered users for this affiliate (no pagination for matching)
	var regUsers []models.AffiliateRegisteredUser
	if err := db.Where("affiliate_id = ?", uint(id)).Find(&regUsers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت لیست ثبت‌نام‌ها"})
		return
	}
	regMap := make(map[string]models.AffiliateRegisteredUser) // key: normalized phone + "|" + normalized name
	for _, u := range regUsers {
		key := normalizePhone(u.Phone) + "|" + normalizeName(u.Name)
		regMap[key] = u
	}
	var matched []gin.H
	for _, b := range req.Buyers {
		name := strings.TrimSpace(b.Name)
		phone := strings.TrimSpace(b.Phone)
		if name == "" || phone == "" {
			continue
		}
		key := normalizePhone(phone) + "|" + normalizeName(name)
		if u, ok := regMap[key]; ok {
			regAt := ""
			if u.RegisteredAt != nil {
				regAt = u.RegisteredAt.Format("2006-01-02")
			}
			matched = append(matched, gin.H{"name": u.Name, "phone": u.Phone, "registered_at": regAt})
		}
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"matched": matched, "count": len(matched)}})
}

// ConfirmAffiliateBuyersRequestBody for confirming matched buyers
type ConfirmAffiliateBuyersRequestBody struct {
	Buyers []struct {
		Name        string `json:"name"`
		Phone       string `json:"phone"`
		AmountToman *int64 `json:"amount_toman"` // مبلغ تومان؛ نزده = ۶ میلیون
	} `json:"buyers"`
	PurchasedAt string `json:"purchased_at"` // optional date for week, e.g. "2026-02-03"
}

// ConfirmAffiliateBuyers saves the matched buyers as affiliate buyers (after admin confirm)
func ConfirmAffiliateBuyers(c *gin.Context) {
	db := models.GetDB()
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه نامعتبر است"})
		return
	}
	if _, err = models.GetAffiliateByID(db, uint(id)); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "افیلیت یافت نشد"})
		return
	}
	var req ConfirmAffiliateBuyersRequestBody
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "داده‌های ورودی نامعتبر است"})
		return
	}
	var purchasedAt *time.Time
	if req.PurchasedAt != "" {
		if t, e := time.Parse("2006-01-02", strings.TrimSpace(req.PurchasedAt)); e == nil {
			purchasedAt = &t
		}
	}
	if purchasedAt == nil {
		// default: start of current week (Saturday in Iran)
		now := time.Now()
		purchasedAt = &now
	}
	var rows []models.AffiliateBuyer
	for _, b := range req.Buyers {
		name := strings.TrimSpace(b.Name)
		phone := strings.TrimSpace(b.Phone)
		if name == "" || phone == "" {
			continue
		}
		row := models.AffiliateBuyer{Name: name, Phone: phone}
		if b.AmountToman != nil && *b.AmountToman >= 0 {
			row.AmountToman = b.AmountToman
		}
		rows = append(rows, row)
	}
	if len(rows) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "لیست خریداران خالی است"})
		return
	}
	if err := models.CreateAffiliateBuyerBatch(db, uint(id), purchasedAt, rows); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ذخیره: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": fmt.Sprintf("%d خریدار ثبت شد", len(rows)), "count": len(rows)})
}

// GetAffiliateBuyers returns paginated buyers for an affiliate (admin)
func GetAffiliateBuyers(c *gin.Context) {
	db := models.GetDB()
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه نامعتبر است"})
		return
	}
	if _, err = models.GetAffiliateByID(db, uint(id)); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "افیلیت یافت نشد"})
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "50"))
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 10000 {
		perPage = 50
	}
	offset := (page - 1) * perPage
	list, total, err := models.GetAffiliateBuyers(db, uint(id), perPage, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت لیست"})
		return
	}
	out := make([]gin.H, 0, len(list))
	for _, r := range list {
		pa := ""
		if r.PurchasedAt != nil {
			pa = r.PurchasedAt.Format("2006-01-02")
		}
		amt := int64(models.DefaultAmountToman)
		if r.AmountToman != nil && *r.AmountToman > 0 {
			amt = *r.AmountToman
		}
		out = append(out, gin.H{"id": r.ID, "name": r.Name, "phone": r.Phone, "purchased_at": pa, "created_at": r.CreatedAt.Format(time.RFC3339), "amount_toman": amt})
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"items": out, "total": total, "page": page, "per_page": perPage}})
}

// GetAffiliateWithdrawalRequests returns withdrawal requests for an affiliate (admin)
func GetAffiliateWithdrawalRequests(c *gin.Context) {
	db := models.GetDB()
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه نامعتبر است"})
		return
	}
	if _, err = models.GetAffiliateByID(db, uint(id)); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "افیلیت یافت نشد"})
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "50"))
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 50
	}
	offset := (page - 1) * perPage
	list, total, err := models.GetAffiliateWithdrawalRequests(db, uint(id), perPage, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت لیست"})
		return
	}
	out := make([]gin.H, 0, len(list))
	for _, r := range list {
		out = append(out, gin.H{
			"id":               r.ID,
			"amount":           r.Amount,
			"currency":         r.Currency,
			"status":           r.Status,
			"admin_notes":      r.AdminNotes,
			"bank_card_number": r.BankCardNumber,
			"card_holder_name": r.CardHolderName,
			"sheba_number":     r.ShebaNumber,
			"bank_name":        r.BankName,
			"requested_at":     r.RequestedAt.Format(time.RFC3339),
			"created_at":       r.CreatedAt.Format(time.RFC3339),
		})
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"items": out, "total": total, "page": page, "per_page": perPage}})
}

// UpdateAffiliateWithdrawalStatus updates status of affiliate withdrawal request (admin): completed (پرداخت شد) or rejected (رد شد)
func UpdateAffiliateWithdrawalStatus(c *gin.Context) {
	db := models.GetDB()
	affIDStr := c.Param("id")
	reqIDStr := c.Param("reqId")
	affID, err := strconv.ParseUint(affIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه افیلیت نامعتبر است"})
		return
	}
	reqID, err := strconv.ParseUint(reqIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه درخواست نامعتبر است"})
		return
	}
	req, err := models.GetAffiliateWithdrawalByID(db, uint(reqID))
	if err != nil || req.AffiliateID != uint(affID) {
		c.JSON(http.StatusNotFound, gin.H{"error": "درخواست یافت نشد"})
		return
	}
	var body struct {
		Status     string `json:"status"`
		AdminNotes string `json:"admin_notes"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "داده نامعتبر"})
		return
	}
	var newStatus models.AffiliateWithdrawalStatus
	switch body.Status {
	case "completed":
		newStatus = models.AffiliateWithdrawalCompleted
	case "rejected":
		newStatus = models.AffiliateWithdrawalRejected
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "وضعیت باید completed یا rejected باشد"})
		return
	}
	if err := models.UpdateAffiliateWithdrawalStatus(db, uint(reqID), newStatus, body.AdminNotes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ذخیره: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "وضعیت به‌روزرسانی شد"})
}

// GetAffiliateSettings returns affiliate settings (singleton)
func GetAffiliateSettings(c *gin.Context) {
	db := models.GetDB()
	settings, err := models.GetAffiliateSettings(db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت تنظیمات"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"sms_pattern_code": settings.SMSPatternCode,
		},
	})
}

// UpdateAffiliateSettings updates affiliate settings (singleton)
func UpdateAffiliateSettings(c *gin.Context) {
	db := models.GetDB()
	var req struct {
		SMSPatternCode string `json:"sms_pattern_code"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "داده‌های نامعتبر"})
		return
	}
	updates := make(map[string]interface{})
	if req.SMSPatternCode != "" {
		updates["sms_pattern_code"] = req.SMSPatternCode
	}
	if err := models.UpdateAffiliateSettings(db, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ذخیره تنظیمات"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "تنظیمات با موفقیت ذخیره شد"})
}
