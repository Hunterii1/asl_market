package controllers

import (
	"net/http"
	"strings"

	"asl-market-backend/models"
	"asl-market-backend/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// PushController handles push notification subscriptions
type PushController struct {
	db *gorm.DB
}

// NewPushController creates a new push controller
func NewPushController(db *gorm.DB) *PushController {
	return &PushController{
		db: db,
	}
}

// SubscribeRequest represents a push subscription request
type SubscribeRequest struct {
	Endpoint string `json:"endpoint" binding:"required"`
	Keys     struct {
		P256dh string `json:"p256dh"` // Optional for FCM
		Auth   string `json:"auth"`   // Optional for FCM
	} `json:"keys"` // Optional for FCM
}

// Subscribe handles push subscription
func (pc *PushController) Subscribe(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	var req SubscribeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "اطلاعات ارسالی نامعتبر است",
			"details": err.Error(),
		})
		return
	}

	userAgent := c.GetHeader("User-Agent")
	if userAgent == "" {
		userAgent = "Unknown"
	}

	// Handle FCM token (if endpoint is FCM token format)
	// FCM tokens can be sent as endpoint directly
	p256dh := req.Keys.P256dh
	auth := req.Keys.Auth

	// If endpoint looks like FCM token, keys might be empty
	if p256dh == "" && auth == "" && (strings.HasPrefix(req.Endpoint, "fcm:") || len(req.Endpoint) > 100) {
		// This is likely an FCM token
		// Extract token if it's in URL format
		endpoint := req.Endpoint
		if strings.Contains(endpoint, "fcm.googleapis.com") {
			parts := strings.Split(endpoint, "/")
			if len(parts) > 0 {
				endpoint = parts[len(parts)-1]
			}
		} else if strings.HasPrefix(endpoint, "fcm:") {
			endpoint = endpoint[4:]
		}

		subscription, err := models.CreatePushSubscription(
			pc.db,
			userIDUint,
			endpoint,
			"", // FCM doesn't use these
			"", // FCM doesn't use these
			userAgent,
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "خطا در ثبت subscription",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message":      "FCM Subscription با موفقیت ثبت شد",
			"subscription": subscription,
		})
		return
	}

	subscription, err := models.CreatePushSubscription(
		pc.db,
		userIDUint,
		req.Endpoint,
		p256dh,
		auth,
		userAgent,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در ثبت subscription",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Subscription با موفقیت ثبت شد",
		"subscription": subscription,
	})
}

// Unsubscribe handles push unsubscription
func (pc *PushController) Unsubscribe(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	var req struct {
		Endpoint string `json:"endpoint" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "اطلاعات ارسالی نامعتبر است",
		})
		return
	}

	if err := models.DeactivatePushSubscription(pc.db, userIDUint, req.Endpoint); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در لغو subscription",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Subscription با موفقیت لغو شد",
	})
}

// SendTestPush sends a test push notification
func (pc *PushController) SendTestPush(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	pushService := services.GetPushNotificationService()
	message := services.PushMessage{
		Title:   "تست Push Notification",
		Message: "این یک پیام تست است",
		Icon:    "/pwa.png",
		Tag:     "test",
		Data: map[string]interface{}{
			"url": "/",
		},
	}

	if err := pushService.SendPushNotification(userIDUint, message); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در ارسال push notification",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Push notification با موفقیت ارسال شد",
	})
}

// GetVAPIDPublicKey returns the VAPID public key for frontend
func (pc *PushController) GetVAPIDPublicKey(c *gin.Context) {
	pushService := services.GetPushNotificationService()
	publicKey := pushService.GetVAPIDPublicKey()

	if publicKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "VAPID public key not configured",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"public_key": publicKey,
	})
}
