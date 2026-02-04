package controllers

import (
	"bytes"
	"encoding/csv"
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

// GetAffiliates returns all affiliates with pagination
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
	list := make([]gin.H, 0, len(admins))
	for _, a := range admins {
		list = append(list, gin.H{
			"id":             a.ID,
			"name":           a.Name,
			"username":       a.Username,
			"referral_code":  a.ReferralCode,
			"referral_link":  a.ReferralLink,
			"balance":        a.Balance,
			"total_earnings": a.TotalEarnings,
			"is_active":      a.IsActive,
			"last_login":     a.LastLogin,
			"login_count":    a.LoginCount,
			"created_at":     a.CreatedAt.Format(time.RFC3339),
		})
	}
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"affiliates": list,
			"total":      total,
			"page":       page,
			"per_page":   perPage,
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
			"id":             aff.ID,
			"name":           aff.Name,
			"username":       aff.Username,
			"referral_code":  aff.ReferralCode,
			"referral_link":  aff.ReferralLink,
			"balance":        aff.Balance,
			"total_earnings": aff.TotalEarnings,
			"is_active":      aff.IsActive,
			"last_login":     aff.LastLogin,
			"login_count":    aff.LoginCount,
			"created_at":     aff.CreatedAt.Format(time.RFC3339),
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
		Name         *string  `json:"name"`
		Password     *string  `json:"password"`
		IsActive     *bool    `json:"is_active"`
		Balance      *float64 `json:"balance"`
		ReferralLink *string  `json:"referral_link"`
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
	if perPage < 1 || perPage > 200 {
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

	var rows [][]string

	if isExcel {
		// Handle Excel file
		fileBytes, err := io.ReadAll(file)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "خطا در خواندن فایل Excel: " + err.Error()})
			return
		}

		xlFile, err := excelize.OpenReader(bytes.NewReader(fileBytes))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "خطا در باز کردن فایل Excel: " + err.Error()})
			return
		}
		defer xlFile.Close()

		// Get first sheet
		sheetName := xlFile.GetSheetName(0)
		if sheetName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "فایل Excel خالی است"})
			return
		}

		// Read all rows
		excelRows, err := xlFile.GetRows(sheetName)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "خطا در خواندن داده‌های Excel: " + err.Error()})
			return
		}

		rows = excelRows
	} else {
		// Handle CSV file with improved parsing
		content, err := io.ReadAll(file)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "خطا در خواندن فایل: " + err.Error()})
			return
		}

		// Try to detect and convert encoding (UTF-8, Windows-1256, etc.)
		contentStr := string(content)
		// Remove BOM if present
		if len(contentStr) > 0 && contentStr[0] == '\ufeff' {
			contentStr = contentStr[1:]
		}

		// Try standard CSV parser first
		reader := csv.NewReader(strings.NewReader(contentStr))
		reader.Comma = ','
		reader.LazyQuotes = true // Allow unquoted quotes in fields
		reader.TrimLeadingSpace = true
		reader.FieldsPerRecord = -1 // Allow variable number of fields
		reader.ReuseRecord = false  // Don't reuse records

		csvRows, err := reader.ReadAll()
		if err != nil {
			// If standard parser fails, use manual parsing
			log.Printf("CSV parse error, using manual parsing: %v", err)
			lines := strings.Split(contentStr, "\n")
			csvRows = [][]string{}
			for _, line := range lines {
				line = strings.TrimSpace(line)
				if line == "" {
					continue
				}
				// Manual CSV parsing: handle quotes properly
				parts := []string{}
				current := ""
				inQuotes := false
				lineRunes := []rune(line)
				for i := 0; i < len(lineRunes); i++ {
					char := lineRunes[i]
					if char == '"' {
						if inQuotes && i+1 < len(lineRunes) && lineRunes[i+1] == '"' {
							// Escaped quote ("")
							current += `"`
							i++ // Skip next quote
						} else {
							inQuotes = !inQuotes
						}
					} else if char == ',' && !inQuotes {
						parts = append(parts, strings.TrimSpace(current))
						current = ""
					} else {
						current += string(char)
					}
				}
				// Add last field
				if current != "" || len(parts) > 0 {
					parts = append(parts, strings.TrimSpace(current))
					csvRows = append(csvRows, parts)
				}
			}
		}

		if len(csvRows) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "هیچ داده‌ای در فایل CSV یافت نشد"})
			return
		}

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
		c.JSON(http.StatusBadRequest, gin.H{"error": "هیچ رکورد معتبری در فایل یافت نشد"})
		return
	}
	if err := models.CreateAffiliateRegisteredUserBatch(db, uint(id), toInsert); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ذخیره: " + err.Error()})
		return
	}
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
		Name  string `json:"name"`
		Phone string `json:"phone"`
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
		rows = append(rows, models.AffiliateBuyer{Name: name, Phone: phone})
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
	if perPage < 1 || perPage > 200 {
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
		out = append(out, gin.H{"id": r.ID, "name": r.Name, "phone": r.Phone, "purchased_at": pa, "created_at": r.CreatedAt.Format(time.RFC3339)})
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"items": out, "total": total, "page": page, "per_page": perPage}})
}
