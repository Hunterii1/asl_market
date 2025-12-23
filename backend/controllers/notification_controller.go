package controllers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"

	"asl-market-backend/models"
	"asl-market-backend/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetUserNotifications retrieves notifications for the current user
func GetUserNotifications(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	user := c.MustGet("user").(models.User)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	unreadOnly := c.DefaultQuery("unread_only", "false") == "true"

	notifications, total, err := models.GetUserNotifications(db, user.ID, page, perPage, unreadOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve notifications"})
		return
	}

	// Convert to response format
	var responseNotifications []models.NotificationResponse
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

		// Add user info if available
		if notification.User != nil {
			response.User = &models.UserResponse{
				ID:        notification.User.ID,
				FirstName: notification.User.FirstName,
				LastName:  notification.User.LastName,
				Email:     notification.User.Email,
			}
		}

		// Add created by info
		response.CreatedBy = models.UserResponse{
			ID:        notification.CreatedBy.ID,
			FirstName: notification.CreatedBy.FirstName,
			LastName:  notification.CreatedBy.LastName,
			Email:     notification.CreatedBy.Email,
		}

		responseNotifications = append(responseNotifications, response)
	}

	c.JSON(http.StatusOK, gin.H{
		"notifications": responseNotifications,
		"pagination": gin.H{
			"page":        page,
			"per_page":    perPage,
			"total":       total,
			"total_pages": (total + int64(perPage) - 1) / int64(perPage),
		},
	})
}

// GetNotification retrieves a single notification
func GetNotification(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	user := c.MustGet("user").(models.User)

	notificationID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	notification, err := models.GetNotification(db, uint(notificationID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	// Check if user can access this notification
	if notification.UserID != nil && *notification.UserID != user.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// Convert to response format
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

	// Add user info if available
	if notification.User != nil {
		response.User = &models.UserResponse{
			ID:        notification.User.ID,
			FirstName: notification.User.FirstName,
			LastName:  notification.User.LastName,
			Email:     notification.User.Email,
		}
	}

	// Add created by info
	response.CreatedBy = models.UserResponse{
		ID:        notification.CreatedBy.ID,
		FirstName: notification.CreatedBy.FirstName,
		LastName:  notification.CreatedBy.LastName,
		Email:     notification.CreatedBy.Email,
	}

	c.JSON(http.StatusOK, response)
}

// MarkNotificationAsRead marks a notification as read
func MarkNotificationAsRead(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	user := c.MustGet("user").(models.User)

	notificationID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	err = models.MarkNotificationAsRead(db, uint(notificationID), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark notification as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}

// MarkAllNotificationsAsRead marks all notifications as read for the current user
func MarkAllNotificationsAsRead(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	user := c.MustGet("user").(models.User)

	err := models.MarkAllNotificationsAsRead(db, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark all notifications as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "All notifications marked as read"})
}

// GetUnreadNotificationCount gets the count of unread notifications
func GetUnreadNotificationCount(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	user := c.MustGet("user").(models.User)

	count, err := models.GetUnreadNotificationCount(db, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get unread notification count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"count": count})
}

// CreateNotification creates a new notification (Admin only)
func CreateNotification(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	user := c.MustGet("user").(models.User)

	if !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	var req models.CreateNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	notification, err := models.CreateNotification(db, user.ID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create notification"})
		return
	}

	// Convert to response format
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
	response.CreatedBy = models.UserResponse{
		ID:        notification.CreatedBy.ID,
		FirstName: notification.CreatedBy.FirstName,
		LastName:  notification.CreatedBy.LastName,
		Email:     notification.CreatedBy.Email,
	}

	// Send push notification
	pushService := services.GetPushNotificationService()
	pushMessage := services.PushMessage{
		Title:   notification.Title,
		Message: notification.Message,
		Icon:    "/pwa.png",
		Tag:     fmt.Sprintf("notification-%d", notification.ID),
		Data: map[string]interface{}{
			"url":  notification.ActionURL,
			"type": notification.Type,
		},
	}

	// Send to specific user or all users
	if notification.UserID != nil {
		// Send to specific user
		if err := pushService.SendPushNotification(*notification.UserID, pushMessage); err != nil {
			log.Printf("Failed to send push notification: %v", err)
		}
	} else {
		// Broadcast to all users
		if err := pushService.SendPushNotificationToAll(pushMessage); err != nil {
			log.Printf("Failed to send push notification to all: %v", err)
		}
	}

	c.JSON(http.StatusCreated, response)
}

// UpdateNotification updates an existing notification (Admin only)
func UpdateNotification(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	user := c.MustGet("user").(models.User)

	if !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	notificationID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	var req models.UpdateNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	notification, err := models.UpdateNotification(db, uint(notificationID), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notification"})
		return
	}

	// Convert to response format
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
	response.CreatedBy = models.UserResponse{
		ID:        notification.CreatedBy.ID,
		FirstName: notification.CreatedBy.FirstName,
		LastName:  notification.CreatedBy.LastName,
		Email:     notification.CreatedBy.Email,
	}

	c.JSON(http.StatusOK, response)
}

// DeleteNotification deletes a notification (Admin only)
func DeleteNotification(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	user := c.MustGet("user").(models.User)

	if !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	notificationID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	err = models.DeleteNotification(db, uint(notificationID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete notification"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification deleted successfully"})
}

// GetNotificationStats gets notification statistics (Admin only)
func GetNotificationStats(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	user := c.MustGet("user").(models.User)

	if !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	stats, err := models.GetNotificationStats(db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get notification statistics"})
		return
	}

	c.JSON(http.StatusOK, stats)
}
