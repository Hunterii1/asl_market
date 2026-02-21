package controllers

import (
	"fmt"
	"net/http"
	"strconv"

	"asl-market-backend/models"
	"asl-market-backend/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Chat handles chat requests with AI
func Chat(c *gin.Context) {
	// Get current user from context
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید.",
		})
		return
	}

	user, ok := userInterface.(models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid user context",
		})
		return
	}

	// Parse request
	var request models.ChatRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
		})
		return
	}

	// Debug logging
	fmt.Printf("🔄 Chat request received - User: %d, Message: '%s', ChatID: %v\n",
		user.ID, request.Message, request.ChatID)

	// Check AI usage rate limit
	db := models.GetDB()
	aiUsageService := services.NewAIUsageService(db)

	canSend, remaining, err := aiUsageService.CanSendMessage(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check message limit",
		})
		return
	}

	if !canSend {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"error":           "Daily message limit exceeded",
			"message":         "شما به حد روزانه ۲۰ پیام رسیده‌اید. فردا دوباره تلاش کنید.",
			"daily_limit":     models.DailyAIMessageLimit,
			"remaining_count": remaining,
		})
		return
	}

	var chat models.Chat

	// Get or create chat
	if request.ChatID != nil {
		fmt.Printf("🔍 Looking for existing chat with ID: %d for user: %d\n", *request.ChatID, user.ID)
		// Get existing chat with messages in chronological order
		if err := db.Where("id = ? AND user_id = ?", *request.ChatID, user.ID).
			Preload("Messages", func(db *gorm.DB) *gorm.DB {
				return db.Order("created_at ASC")
			}).First(&chat).Error; err != nil {
			fmt.Printf("❌ Chat not found: %v\n", err)
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Chat not found",
			})
			return
		}
		fmt.Printf("✅ Found existing chat: %d with %d messages\n", chat.ID, len(chat.Messages))
	} else {
		fmt.Printf("🆕 Creating new chat for user: %d\n", user.ID)
		// Create new chat
		chat = models.Chat{
			UserID: user.ID,
			Title:  generateChatTitle(request.Message),
		}
		if err := db.Create(&chat).Error; err != nil {
			fmt.Printf("❌ Failed to create chat: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to create chat",
			})
			return
		}
		fmt.Printf("✅ Created new chat: %d\n", chat.ID)
	}

	// Save user message
	userMessage := models.Message{
		ChatID:  chat.ID,
		Role:    "user",
		Content: request.Message,
	}
	if err := db.Create(&userMessage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to save user message",
		})
		return
	}

	// Get OpenAI service
	openAIService := services.NewOpenAIService()

	// Prepare messages for OpenAI (include chat history)
	var openAIMessages []services.OpenAIMessage

	// Add system prompt
	openAIMessages = append(openAIMessages, services.OpenAIMessage{
		Role:    "system",
		Content: openAIService.GetSystemPrompt(),
	})

	// Add chat history (limit to last 20 messages to avoid token overflow)
	// Sort messages by created_at to ensure correct order
	historyMessages := chat.Messages
	maxHistoryMessages := 20 // Adjust this based on your needs

	// If we have too many messages, take the most recent ones
	startIndex := 0
	if len(historyMessages) > maxHistoryMessages {
		startIndex = len(historyMessages) - maxHistoryMessages
	}

	// Add historical messages in chronological order
	for i := startIndex; i < len(historyMessages); i++ {
		msg := historyMessages[i]
		openAIMessages = append(openAIMessages, services.OpenAIMessage{
			Role:    msg.Role,
			Content: msg.Content,
		})
	}

	// Add current user message
	openAIMessages = append(openAIMessages, services.OpenAIMessage{
		Role:    "user",
		Content: request.Message,
	})

	// Send to OpenAI
	response, err := openAIService.SendMessage(openAIMessages)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to get AI response: %v", err),
		})
		return
	}

	// Save AI response
	aiMessage := models.Message{
		ChatID:  chat.ID,
		Role:    "assistant",
		Content: response,
	}
	if err := db.Create(&aiMessage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to save AI response",
		})
		return
	}

	// Increment AI usage count
	if err := aiUsageService.IncrementUsage(user.ID); err != nil {
		// Log error but don't fail the request since the message was already processed
		fmt.Printf("⚠️ Failed to increment AI usage for user %d: %v\n", user.ID, err)
	}

	// Get updated chat with all messages
	if err := db.Where("id = ?", chat.ID).
		Preload("Messages").First(&chat).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to load chat",
		})
		return
	}

	// Return response
	c.JSON(http.StatusOK, models.ChatResponse{
		ChatID:   chat.ID,
		Message:  request.Message,
		Response: response,
		Messages: chat.Messages,
	})
}

// GetChats returns all chats for the current user
func GetChats(c *gin.Context) {
	// Get current user from context
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید.",
		})
		return
	}

	user, ok := userInterface.(models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid user context",
		})
		return
	}

	db := models.GetDB()
	var chats []models.Chat

	if err := db.Where("user_id = ?", user.ID).
		Order("updated_at DESC").
		Find(&chats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get chats",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"chats": chats,
	})
}

// GetChat returns a specific chat with all messages
func GetChat(c *gin.Context) {
	// Get current user from context
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید.",
		})
		return
	}

	user, ok := userInterface.(models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid user context",
		})
		return
	}

	// Get chat ID from URL
	chatIDStr := c.Param("id")
	chatID, err := strconv.ParseUint(chatIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid chat ID",
		})
		return
	}

	db := models.GetDB()
	var chat models.Chat

	if err := db.Where("id = ? AND user_id = ?", uint(chatID), user.ID).
		Preload("Messages").First(&chat).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Chat not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"chat": chat,
	})
}

// DeleteChat deletes a specific chat
func DeleteChat(c *gin.Context) {
	// Get current user from context
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید.",
		})
		return
	}

	user, ok := userInterface.(models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid user context",
		})
		return
	}

	// Get chat ID from URL
	chatIDStr := c.Param("id")
	chatID, err := strconv.ParseUint(chatIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid chat ID",
		})
		return
	}

	db := models.GetDB()

	// Delete chat (will cascade delete messages due to foreign key)
	if err := db.Where("id = ? AND user_id = ?", uint(chatID), user.ID).
		Delete(&models.Chat{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete chat",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Chat deleted successfully",
	})
}

// GetAIUsage returns AI usage information for the current user
func GetAIUsage(c *gin.Context) {
	// Get current user from context
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید.",
		})
		return
	}

	user, ok := userInterface.(models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid user context",
		})
		return
	}

	// Get usage information
	db := models.GetDB()
	aiUsageService := services.NewAIUsageService(db)

	usageInfo, err := aiUsageService.GetUsageInfo(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get usage information",
		})
		return
	}

	c.JSON(http.StatusOK, usageInfo)
}

// generateChatTitle creates a title from the first message
func generateChatTitle(message string) string {
	if len(message) <= 50 {
		return message
	}
	return message[:47] + "..."
}
