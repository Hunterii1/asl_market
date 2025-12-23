package services

import (
	"fmt"
	"log"
	"strings"
	"time"

	"asl-market-backend/models"

	"gorm.io/gorm"
)

// MatchingService handles the matching algorithm and notifications
type MatchingService struct {
	db *gorm.DB
}

// NewMatchingService creates a new matching service
func NewMatchingService(db *gorm.DB) *MatchingService {
	return &MatchingService{db: db}
}

// FindMatchingVisitors finds suitable visitors for a matching request
func (s *MatchingService) FindMatchingVisitors(matchingRequest *models.MatchingRequest) ([]models.Visitor, error) {
	// Get all approved visitors
	var allVisitors []models.Visitor
	if err := s.db.Preload("User").Where("status = ?", "approved").Find(&allVisitors).Error; err != nil {
		return nil, err
	}

	// Parse destination countries from matching request
	requestCountries := parseCountries(matchingRequest.DestinationCountries)

	// Filter and score visitors
	var matchedVisitors []models.Visitor
	scores := make(map[uint]int) // visitor ID -> score

	for _, visitor := range allVisitors {
		score := s.calculateMatchingScore(matchingRequest, &visitor, requestCountries)
		if score > 0 {
			matchedVisitors = append(matchedVisitors, visitor)
			scores[visitor.ID] = score
		}
	}

	// Sort by score (highest first)
	// Simple bubble sort for now (can be optimized)
	for i := 0; i < len(matchedVisitors)-1; i++ {
		for j := i + 1; j < len(matchedVisitors); j++ {
			if scores[matchedVisitors[i].ID] < scores[matchedVisitors[j].ID] {
				matchedVisitors[i], matchedVisitors[j] = matchedVisitors[j], matchedVisitors[i]
			}
		}
	}

	// Send to ALL matching visitors (no limit)
	return matchedVisitors, nil
}

// calculateMatchingScore calculates a matching score for a visitor
// Returns 0 if visitor doesn't match at all
func (s *MatchingService) calculateMatchingScore(request *models.MatchingRequest, visitor *models.Visitor, requestCountries []string) int {
	score := 0

	// 1. Country match (highest priority - 50 points)
	visitorCountries := parseCountries(visitor.DestinationCities)
	countryMatch := false
	for _, reqCountry := range requestCountries {
		for _, visCountry := range visitorCountries {
			if strings.EqualFold(strings.TrimSpace(reqCountry), strings.TrimSpace(visCountry)) {
				countryMatch = true
				score += 50
				break
			}
		}
		if countryMatch {
			break
		}
	}

	// If no country match, return 0 (visitor is not suitable)
	if !countryMatch {
		return 0
	}

	// 2. Product interest match (30 points)
	if visitor.InterestedProducts != "" {
		interestedProducts := parseProducts(visitor.InterestedProducts)
		productNameLower := strings.ToLower(request.ProductName)
		for _, product := range interestedProducts {
			if strings.Contains(strings.ToLower(product), productNameLower) ||
				strings.Contains(productNameLower, strings.ToLower(product)) {
				score += 30
				break
			}
		}
	}

	// 3. Language level (20 points)
	// Excellent = 20, Good = 15, Weak = 10, None = 0
	switch strings.ToLower(visitor.LanguageLevel) {
	case "excellent":
		score += 20
	case "good":
		score += 15
	case "weak":
		score += 10
	}

	// 4. Marketing experience (10 points)
	if visitor.HasMarketingExperience {
		score += 10
	}

	// 5. Featured visitor bonus (5 points)
	if visitor.IsFeatured {
		score += 5
	}

	// 6. Recent activity (5 points) - if visitor was approved recently
	if visitor.ApprovedAt != nil {
		daysSinceApproval := time.Since(*visitor.ApprovedAt).Hours() / 24
		if daysSinceApproval < 30 {
			score += 5
		}
	}

	return score
}

// parseCountries parses comma-separated or space-separated countries
func parseCountries(countriesStr string) []string {
	if countriesStr == "" {
		return []string{}
	}

	// Try comma first
	countries := strings.Split(countriesStr, ",")
	if len(countries) == 1 {
		// Try space
		countries = strings.Fields(countriesStr)
	}

	// Clean up
	var result []string
	for _, country := range countries {
		cleaned := strings.TrimSpace(country)
		if cleaned != "" {
			result = append(result, cleaned)
		}
	}

	return result
}

// parseProducts parses comma-separated or space-separated products
func parseProducts(productsStr string) []string {
	return parseCountries(productsStr) // Same logic
}

// SendMatchingNotifications sends notifications to matched visitors
func (s *MatchingService) SendMatchingNotifications(matchingRequest *models.MatchingRequest, visitors []models.Visitor) error {
	smsService := GetSMSService()

	for _, visitor := range visitors {
		// Create notification record
		notification := models.MatchingNotification{
			MatchingRequestID: matchingRequest.ID,
			VisitorID:         visitor.ID,
			UserID:            visitor.UserID,
			NotificationType:  "in_app",
			Status:            "pending",
		}

		// Send SMS (if visitor has license and is approved)
		if visitor.Status == "approved" && visitor.UserID > 0 {
			// Check if user has active license
			hasLicense, _ := models.CheckUserLicense(s.db, visitor.UserID)
			if hasLicense && smsService != nil {
				// Get user phone
				var user models.User
				if err := s.db.First(&user, visitor.UserID).Error; err == nil {
					phoneNumber := ValidateIranianPhoneNumber(user.Phone)
					if phoneNumber != "" {
						message := fmt.Sprintf(
							"درخواست جدید برای فروش %s در %s. مبلغ: %s %s. برای مشاهده جزئیات وارد اپلیکیشن شوید.",
							matchingRequest.ProductName,
							matchingRequest.DestinationCountries,
							matchingRequest.Price,
							matchingRequest.Currency,
						)

						// Try to send SMS
						err := smsService.SendSimpleSMS(phoneNumber, message)
						if err == nil {
							notification.NotificationType = "sms"
							notification.Status = "sent"
							now := time.Now()
							notification.SentAt = &now
							notification.Message = message
						} else {
							notification.Status = "failed"
							notification.Error = err.Error()
							log.Printf("Failed to send SMS to visitor %d: %v", visitor.ID, err)
						}
					}
				}
			}
		}

		// Create in-app notification
		if notification.Status == "pending" {
			notification.NotificationType = "in_app"
			notification.Status = "sent"
			now := time.Now()
			notification.SentAt = &now
			notification.Message = fmt.Sprintf(
				"درخواست جدید برای فروش %s در %s",
				matchingRequest.ProductName,
				matchingRequest.DestinationCountries,
			)
		}

		// Save notification
		if err := s.db.Create(&notification).Error; err != nil {
			log.Printf("Failed to create matching notification: %v", err)
		}

		// Create in-app notification for user
		if visitor.UserID > 0 {
			visitorUserID := visitor.UserID
			inAppNotification := models.Notification{
				UserID:      &visitorUserID,
				Title:       "درخواست Matching جدید",
				Message:     fmt.Sprintf("درخواست جدید برای فروش %s در %s", matchingRequest.ProductName, matchingRequest.DestinationCountries),
				Type:        "matching",
				Priority:    "high",
				IsRead:      false,
				CreatedByID: matchingRequest.UserID, // Created by supplier
				ActionURL:   fmt.Sprintf("/matching/requests/%d", matchingRequest.ID),
			}
			if err := s.db.Create(&inAppNotification).Error; err != nil {
				log.Printf("Failed to create in-app notification: %v", err)
			}

			// Send push notification
			pushService := GetPushNotificationService()
			pushMessage := PushMessage{
				Title:   "درخواست Matching جدید",
				Message: fmt.Sprintf("درخواست جدید برای فروش %s در %s", matchingRequest.ProductName, matchingRequest.DestinationCountries),
				Icon:    "/pwa.png",
				Tag:     fmt.Sprintf("matching-%d", matchingRequest.ID),
				Data: map[string]interface{}{
					"url":  fmt.Sprintf("/matching/requests/%d", matchingRequest.ID),
					"type": "matching",
				},
			}
			if err := pushService.SendPushNotification(visitorUserID, pushMessage); err != nil {
				log.Printf("Failed to send push notification: %v", err)
			}
		}

		// Send Telegram notification to admin (optional)
		// Note: We skip this to avoid spam. Matching notifications are sent via in-app notifications.
		// If needed, we can add a method to send to admins later.
	}

	// Update matched visitor count
	matchingRequest.MatchedVisitorCount = len(visitors)
	s.db.Model(matchingRequest).Update("matched_visitor_count", len(visitors))

	return nil
}

// ProcessMatchingRequest processes a new matching request
func (s *MatchingService) ProcessMatchingRequest(matchingRequest *models.MatchingRequest) error {
	// Find matching visitors
	visitors, err := s.FindMatchingVisitors(matchingRequest)
	if err != nil {
		return fmt.Errorf("failed to find matching visitors: %v", err)
	}

	// Send notifications
	if err := s.SendMatchingNotifications(matchingRequest, visitors); err != nil {
		return fmt.Errorf("failed to send notifications: %v", err)
	}

	// Update status to active
	if matchingRequest.Status == "pending" {
		s.db.Model(matchingRequest).Update("status", "active")
	}

	return nil
}

// CheckAndExpireRequests checks for expired matching requests
func (s *MatchingService) CheckAndExpireRequests() error {
	return models.CheckExpiredMatchingRequests(s.db)
}

