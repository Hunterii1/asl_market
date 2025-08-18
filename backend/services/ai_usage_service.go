package services

import (
	"time"

	"asl-market-backend/models"

	"gorm.io/gorm"
)

type AIUsageService struct {
	db *gorm.DB
}

// NewAIUsageService creates a new AI usage service instance
func NewAIUsageService(db *gorm.DB) *AIUsageService {
	return &AIUsageService{
		db: db,
	}
}

// GetTodayUsage gets or creates today's usage record for a user
func (s *AIUsageService) GetTodayUsage(userID uint) (*models.AIUsage, error) {
	today := time.Now().UTC().Truncate(24 * time.Hour) // Get today's date at 00:00:00

	var usage models.AIUsage
	err := s.db.Where("user_id = ? AND date = ?", userID, today).First(&usage).Error

	if err == gorm.ErrRecordNotFound {
		// Create new usage record for today
		usage = models.AIUsage{
			UserID:       userID,
			Date:         today,
			MessageCount: 0,
		}
		err = s.db.Create(&usage).Error
		if err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}

	return &usage, nil
}

// CanSendMessage checks if user can send a message (hasn't reached daily limit)
func (s *AIUsageService) CanSendMessage(userID uint) (bool, int, error) {
	usage, err := s.GetTodayUsage(userID)
	if err != nil {
		return false, 0, err
	}

	remaining := models.DailyAIMessageLimit - usage.MessageCount
	if remaining <= 0 {
		return false, 0, nil
	}

	return true, remaining, nil
}

// IncrementUsage increments the message count for today
func (s *AIUsageService) IncrementUsage(userID uint) error {
	today := time.Now().UTC().Truncate(24 * time.Hour)

	// Use atomic increment to prevent race conditions
	result := s.db.Model(&models.AIUsage{}).
		Where("user_id = ? AND date = ?", userID, today).
		UpdateColumn("message_count", gorm.Expr("message_count + ?", 1))

	if result.Error != nil {
		return result.Error
	}

	// If no rows were affected, the record doesn't exist, create it
	if result.RowsAffected == 0 {
		usage := models.AIUsage{
			UserID:       userID,
			Date:         today,
			MessageCount: 1,
		}
		return s.db.Create(&usage).Error
	}

	return nil
}

// GetUsageInfo returns usage information for the user
func (s *AIUsageService) GetUsageInfo(userID uint) (*models.AIUsageResponse, error) {
	usage, err := s.GetTodayUsage(userID)
	if err != nil {
		return nil, err
	}

	remaining := models.DailyAIMessageLimit - usage.MessageCount
	if remaining < 0 {
		remaining = 0
	}

	return &models.AIUsageResponse{
		Date:           usage.Date.Format("2006-01-02"),
		MessageCount:   usage.MessageCount,
		RemainingCount: remaining,
		DailyLimit:     models.DailyAIMessageLimit,
	}, nil
}
