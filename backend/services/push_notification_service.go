package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"asl-market-backend/config"
	"asl-market-backend/models"

	"github.com/SherClockHolmes/webpush-go"
	"gorm.io/gorm"
)

// PushNotificationService handles push notifications
type PushNotificationService struct {
	db *gorm.DB
}

var pushNotificationServiceInstance *PushNotificationService

// GetPushNotificationService returns the singleton instance
func GetPushNotificationService() *PushNotificationService {
	if pushNotificationServiceInstance == nil {
		pushNotificationServiceInstance = &PushNotificationService{
			db: models.GetDB(),
		}
	}
	return pushNotificationServiceInstance
}

// PushMessage represents a push notification message
type PushMessage struct {
	Title   string                 `json:"title"`
	Message string                 `json:"message"`
	Icon    string                 `json:"icon,omitempty"`
	Badge   string                 `json:"badge,omitempty"`
	Tag     string                 `json:"tag,omitempty"`
	Data    map[string]interface{} `json:"data,omitempty"`
	Actions []PushAction           `json:"actions,omitempty"`
}

// PushAction represents an action button in push notification
type PushAction struct {
	Action string `json:"action"`
	Title  string `json:"title"`
	Icon   string `json:"icon,omitempty"`
}

// SendPushNotification sends a push notification to a user
func (pns *PushNotificationService) SendPushNotification(userID uint, message PushMessage) error {
	subscriptions, err := models.GetUserPushSubscriptions(pns.db, userID)
	if err != nil {
		return fmt.Errorf("failed to get subscriptions: %v", err)
	}

	if len(subscriptions) == 0 {
		return nil // No subscriptions, nothing to send
	}

	successCount := 0
	for _, sub := range subscriptions {
		if err := pns.sendToSubscription(sub, message); err != nil {
			log.Printf("Failed to send push notification to subscription %d: %v", sub.ID, err)
			// Mark subscription as inactive if it fails
			models.DeactivatePushSubscription(pns.db, userID, sub.Endpoint)
		} else {
			successCount++
		}
	}

	if successCount == 0 {
		return fmt.Errorf("failed to send to any subscription")
	}

	return nil
}

// SendPushNotificationToAll sends a push notification to all active subscriptions
func (pns *PushNotificationService) SendPushNotificationToAll(message PushMessage) error {
	subscriptions, err := models.GetAllActivePushSubscriptions(pns.db)
	if err != nil {
		return fmt.Errorf("failed to get subscriptions: %v", err)
	}

	successCount := 0
	for _, sub := range subscriptions {
		if err := pns.sendToSubscription(sub, message); err != nil {
			log.Printf("Failed to send push notification to subscription %d: %v", sub.ID, err)
			// Mark subscription as inactive if it fails
			models.DeactivatePushSubscription(pns.db, sub.UserID, sub.Endpoint)
		} else {
			successCount++
		}
	}

	log.Printf("Sent push notification to %d/%d subscriptions", successCount, len(subscriptions))
	return nil
}

// sendToSubscription sends a push notification to a specific subscription
// Supports both FCM and WebPush
func (pns *PushNotificationService) sendToSubscription(subscription models.PushSubscription, message PushMessage) error {
	// Check if this is an FCM subscription
	if pns.isFCMSubscription(subscription.Endpoint) {
		return pns.sendFCMNotification(subscription, message)
	}
	
	// Otherwise use WebPush
	return pns.sendWebPushNotification(subscription, message)
}

// isFCMSubscription checks if the endpoint is an FCM endpoint
func (pns *PushNotificationService) isFCMSubscription(endpoint string) bool {
	if len(endpoint) == 0 {
		return false
	}
	// FCM tokens are typically long strings (152+ characters)
	// WebPush endpoints are URLs
	return len(endpoint) > 100 && !strings.HasPrefix(endpoint, "https://") && !strings.HasPrefix(endpoint, "http://")
}

// sendFCMNotification sends notification via FCM REST API
func (pns *PushNotificationService) sendFCMNotification(subscription models.PushSubscription, message PushMessage) error {
	// FCM token is stored directly in endpoint
	fcmToken := subscription.Endpoint
	
	// Clean up token if it has prefix
	if strings.HasPrefix(fcmToken, "fcm:") {
		fcmToken = fcmToken[4:]
	} else if strings.Contains(fcmToken, "fcm.googleapis.com") {
		// Extract token from URL
		parts := strings.Split(fcmToken, "/")
		if len(parts) > 0 {
			fcmToken = parts[len(parts)-1]
		}
	}

	// Get FCM Server Key from config
	fcmServerKey := config.AppConfig.Push.FCMServerKey
	if fcmServerKey == "" {
		// Try to use VAPID private key as fallback (if it's actually an FCM server key)
		fcmServerKey = config.AppConfig.Push.VAPIDPrivateKey
	}

	if fcmServerKey == "" {
		return fmt.Errorf("FCM server key not configured")
	}

	// Prepare FCM payload
	fcmPayload := map[string]interface{}{
		"to": fcmToken,
		"notification": map[string]interface{}{
			"title": message.Title,
			"body":  message.Message,
			"icon":  message.Icon,
			"badge": message.Badge,
			"tag":   message.Tag,
		},
		"data": message.Data,
		"priority": "high",
	}

	payloadJSON, err := json.Marshal(fcmPayload)
	if err != nil {
		return fmt.Errorf("failed to marshal FCM payload: %v", err)
	}

	// Send to FCM REST API
	req, err := http.NewRequest("POST", "https://fcm.googleapis.com/fcm/send", bytes.NewBuffer(payloadJSON))
	if err != nil {
		return fmt.Errorf("failed to create FCM request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("key=%s", fcmServerKey))

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send FCM notification: %v", err)
	}
	defer resp.Body.Close()

	// Check response
	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		if resp.StatusCode == 401 {
			return fmt.Errorf("FCM authentication failed - check server key")
		}
		if resp.StatusCode == 404 || resp.StatusCode == 400 {
			return fmt.Errorf("FCM token invalid or expired: %s", string(body))
		}
		return fmt.Errorf("FCM error (status %d): %s", resp.StatusCode, string(body))
	}

	return nil
}

// sendWebPushNotification sends notification via WebPush
func (pns *PushNotificationService) sendWebPushNotification(subscription models.PushSubscription, message PushMessage) error {
	// Get VAPID keys from config
	vapidPublicKey := config.AppConfig.Push.VAPIDPublicKey
	vapidPrivateKey := config.AppConfig.Push.VAPIDPrivateKey
	vapidSubject := config.AppConfig.Push.VAPIDSubject

	// Use Firebase VAPID public key as fallback
	if vapidPublicKey == "" {
		vapidPublicKey = "BOU4y6g5J16DjSRy5ybfM3_LiFeWTsoY8kx7ESQPNvz5OhHe3r-09XaTnyyuzHFhbrOp9DINikXHCLgHNZTQQzc"
	}

	if vapidPrivateKey == "" {
		return fmt.Errorf("VAPID private key not configured. Please set push.vapid_private_key in config.yaml")
	}

	if vapidSubject == "" {
		vapidSubject = "mailto:admin@asllmarket.com"
	}

	// Create subscription object for webpush
	sub := &webpush.Subscription{
		Endpoint: subscription.Endpoint,
		Keys: webpush.Keys{
			P256dh: subscription.P256dh,
			Auth:   subscription.Auth,
		},
	}

	// Create notification payload
	payload := map[string]interface{}{
		"title": message.Title,
		"body":  message.Message,
		"icon":  message.Icon,
		"badge": message.Badge,
		"tag":   message.Tag,
		"data":  message.Data,
	}

	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %v", err)
	}

	// Send notification using webpush
	resp, err := webpush.SendNotification(payloadJSON, sub, &webpush.Options{
		VAPIDPublicKey:  vapidPublicKey,
		VAPIDPrivateKey: vapidPrivateKey,
		TTL:             86400, // 24 hours
		Urgency:         "normal",
		Topic:           message.Tag,
	})

	if err != nil {
		return fmt.Errorf("failed to send notification: %v", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode >= 400 {
		// Subscription might be invalid
		if resp.StatusCode == 410 || resp.StatusCode == 404 {
			return fmt.Errorf("subscription expired or invalid (status: %d)", resp.StatusCode)
		}
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	return nil
}

// GetVAPIDPublicKey returns the VAPID public key for frontend
func (pns *PushNotificationService) GetVAPIDPublicKey() string {
	publicKey := config.AppConfig.Push.VAPIDPublicKey
	if publicKey == "" {
		// Fallback to Firebase key
		publicKey = "BOU4y6g5J16DjSRy5ybfM3_LiFeWTsoY8kx7ESQPNvz5OhHe3r-09XaTnyyuzHFhbrOp9DINikXHCLgHNZTQQzc"
	}
	return publicKey
}
