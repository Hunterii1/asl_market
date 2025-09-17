package controllers

import (
	"net/http"
	"strconv"

	"asl-market-backend/models"
	"asl-market-backend/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SupportTicketController handles support ticket related requests
type SupportTicketController struct {
	telegramService *services.TelegramService
}

// NewSupportTicketController creates a new support ticket controller
func NewSupportTicketController() *SupportTicketController {
	return &SupportTicketController{
		telegramService: services.GetTelegramService(),
	}
}

// CreateTicket creates a new support ticket
func (stc *SupportTicketController) CreateTicket(c *gin.Context) {
	userID := c.GetUint("user_id")
	db := c.MustGet("db").(*gorm.DB)

	var req models.CreateTicketRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "اطلاعات وارد شده نامعتبر است",
			"error":   err.Error(),
		})
		return
	}

	// Get user information
	user, err := models.GetUserByID(db, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "خطا در دریافت اطلاعات کاربر",
			"error":   err.Error(),
		})
		return
	}

	// Create ticket
	ticket := models.SupportTicket{
		UserID:      userID,
		Title:       req.Title,
		Description: req.Description,
		Priority:    req.Priority,
		Status:      "open",
		Category:    req.Category,
	}

	if err := db.Create(&ticket).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "خطا در ایجاد تیکت",
			"error":   err.Error(),
		})
		return
	}

	// Create initial message
	initialMessage := models.SupportTicketMessage{
		TicketID: ticket.ID,
		SenderID: &userID,
		Message:  req.Description,
		IsAdmin:  false,
	}

	if err := db.Create(&initialMessage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "خطا در ایجاد پیام اولیه",
			"error":   err.Error(),
		})
		return
	}

	// Send notification to Telegram
	go func() {
		if stc.telegramService != nil {
			stc.telegramService.NotifyNewSupportTicket(&ticket, user)
		}
	}()

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "تیکت با موفقیت ایجاد شد",
		"data":    stc.formatTicketResponse(&ticket),
	})
}

// GetUserTickets gets all tickets for the current user
func (stc *SupportTicketController) GetUserTickets(c *gin.Context) {
	userID := c.GetUint("user_id")
	db := c.MustGet("db").(*gorm.DB)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	status := c.Query("status")

	offset := (page - 1) * perPage

	query := db.Where("user_id = ?", userID)
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var tickets []models.SupportTicket
	var total int64

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "خطا در دریافت تیکت‌ها",
			"error":   err.Error(),
		})
		return
	}

	if err := query.Preload("User").Preload("Messages", func(db *gorm.DB) *gorm.DB {
		return db.Order("created_at DESC")
	}).Order("created_at DESC").Offset(offset).Limit(perPage).Find(&tickets).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "خطا در دریافت تیکت‌ها",
			"error":   err.Error(),
		})
		return
	}

	var responseTickets []models.TicketResponse
	for _, ticket := range tickets {
		responseTickets = append(responseTickets, stc.formatTicketResponse(&ticket))
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"tickets": responseTickets,
			"pagination": gin.H{
				"page":        page,
				"per_page":    perPage,
				"total":       total,
				"total_pages": (total + int64(perPage) - 1) / int64(perPage),
			},
		},
	})
}

// GetTicket gets a specific ticket with its messages
func (stc *SupportTicketController) GetTicket(c *gin.Context) {
	userID := c.GetUint("user_id")
	db := c.MustGet("db").(*gorm.DB)

	ticketID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "شناسه تیکت نامعتبر است",
		})
		return
	}

	var ticket models.SupportTicket
	if err := db.Where("id = ? AND user_id = ?", ticketID, userID).
		Preload("User").Preload("Messages", func(db *gorm.DB) *gorm.DB {
		return db.Preload("Sender").Order("created_at ASC")
	}).First(&ticket).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "تیکت یافت نشد",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "خطا در دریافت تیکت",
				"error":   err.Error(),
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stc.formatTicketResponse(&ticket),
	})
}

// AddMessage adds a message to a ticket
func (stc *SupportTicketController) AddMessage(c *gin.Context) {
	userID := c.GetUint("user_id")
	db := c.MustGet("db").(*gorm.DB)

	ticketID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "شناسه تیکت نامعتبر است",
		})
		return
	}

	var req models.AddMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "پیام نامعتبر است",
			"error":   err.Error(),
		})
		return
	}

	// Check if ticket exists and belongs to user
	var ticket models.SupportTicket
	if err := db.Where("id = ? AND user_id = ?", ticketID, userID).First(&ticket).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "تیکت یافت نشد",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "خطا در یافتن تیکت",
				"error":   err.Error(),
			})
		}
		return
	}

	// Check if ticket is closed
	if ticket.Status == "closed" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "این تیکت بسته شده است و نمی‌توان پیام جدید اضافه کرد",
		})
		return
	}

	// Create message
	message := models.SupportTicketMessage{
		TicketID: uint(ticketID),
		SenderID: &userID,
		Message:  req.Message,
		IsAdmin:  false,
	}

	if err := db.Create(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "خطا در ارسال پیام",
			"error":   err.Error(),
		})
		return
	}

	// Update ticket status and timestamp
	db.Model(&ticket).Updates(map[string]interface{}{
		"status":     "waiting_response",
		"updated_at": db.NowFunc(),
	})

	// Send notification to Telegram
	go func() {
		if stc.telegramService != nil {
			user, _ := models.GetUserByID(db, userID)
			stc.telegramService.NotifyTicketMessage(&ticket, user, &message)
		}
	}()

	// Get updated ticket with messages
	var updatedTicket models.SupportTicket
	db.Where("id = ?", ticketID).
		Preload("User").Preload("Messages", func(db *gorm.DB) *gorm.DB {
		return db.Preload("Sender").Order("created_at ASC")
	}).First(&updatedTicket)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "پیام با موفقیت ارسال شد",
		"data":    stc.formatTicketResponse(&updatedTicket),
	})
}

// CloseTicket closes a ticket
func (stc *SupportTicketController) CloseTicket(c *gin.Context) {
	userID := c.GetUint("user_id")
	db := c.MustGet("db").(*gorm.DB)

	ticketID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "شناسه تیکت نامعتبر است",
		})
		return
	}

	// Check if ticket exists and belongs to user
	var ticket models.SupportTicket
	if err := db.Where("id = ? AND user_id = ?", ticketID, userID).First(&ticket).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "تیکت یافت نشد",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "خطا در یافتن تیکت",
				"error":   err.Error(),
			})
		}
		return
	}

	// Update ticket status
	if err := db.Model(&ticket).Update("status", "closed").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "خطا در بستن تیکت",
			"error":   err.Error(),
		})
		return
	}

	// Send notification to Telegram
	go func() {
		if stc.telegramService != nil {
			user, _ := models.GetUserByID(db, userID)
			stc.telegramService.NotifyTicketClosed(&ticket, user)
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "تیکت با موفقیت بسته شد",
	})
}

// formatTicketResponse formats a ticket for API response
func (stc *SupportTicketController) formatTicketResponse(ticket *models.SupportTicket) models.TicketResponse {
	var messages []models.TicketMessageResponse
	for _, msg := range ticket.Messages {
		var sender *models.TicketUserResponse
		if msg.Sender != nil {
			sender = &models.TicketUserResponse{
				ID:        msg.Sender.ID,
				FirstName: msg.Sender.FirstName,
				LastName:  msg.Sender.LastName,
				Email:     msg.Sender.Email,
				Phone:     msg.Sender.Phone,
			}
		}

		messages = append(messages, models.TicketMessageResponse{
			ID:        msg.ID,
			Message:   msg.Message,
			IsAdmin:   msg.IsAdmin,
			Sender:    sender,
			CreatedAt: msg.CreatedAt,
		})
	}

	return models.TicketResponse{
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
		Messages:  messages,
		CreatedAt: ticket.CreatedAt,
		UpdatedAt: ticket.UpdatedAt,
	}
}
