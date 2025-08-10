package models

import (
	"log"
	"time"

	"gorm.io/gorm"
)

// UserProgress tracks user's learning and activity progress
type UserProgress struct {
	ID     uint `gorm:"primaryKey"`
	UserID uint `gorm:"not null;uniqueIndex"`
	User   User `gorm:"foreignKey:UserID"`

	// Main progress percentage (0-100)
	OverallProgress int `gorm:"default:0"` // Start at 0%

	// Individual activity completion flags
	CompletedTutorial   bool `gorm:"default:false"`
	ViewedSuppliers     bool `gorm:"default:false"`
	ViewedVisitors      bool `gorm:"default:false"`
	UsedAI              bool `gorm:"default:false"`
	ViewedProducts      bool `gorm:"default:false"`
	SubmittedWithdrawal bool `gorm:"default:false"`
	ViewedAvailable     bool `gorm:"default:false"`
	UsedExpress         bool `gorm:"default:false"`
	CompletedLearning   bool `gorm:"default:false"`

	CreatedAt time.Time
	UpdatedAt time.Time
}

// GetOrCreateUserProgress gets existing progress or creates new one with 33% default
func GetOrCreateUserProgress(db *gorm.DB, userID uint) (*UserProgress, error) {
	var progress UserProgress

	// Try to find existing progress
	err := db.Where("user_id = ?", userID).First(&progress).Error
	if err == nil {
		return &progress, nil
	}

	// If not found, create new with 0% default progress
	if err == gorm.ErrRecordNotFound {
		progress = UserProgress{
			UserID:          userID,
			OverallProgress: 0, // Start at 0% - user hasn't done anything yet
		}

		if err := db.Create(&progress).Error; err != nil {
			return nil, err
		}

		log.Printf("Created new user progress for user %d with 0%% initial progress", userID)
		return &progress, nil
	}

	return nil, err
}

// UpdateProgress updates a specific activity and recalculates overall progress
func (up *UserProgress) UpdateProgress(db *gorm.DB, activity string) error {
	// Mark the specific activity as completed
	switch activity {
	case "tutorial":
		if !up.CompletedTutorial {
			up.CompletedTutorial = true
		}
	case "suppliers":
		if !up.ViewedSuppliers {
			up.ViewedSuppliers = true
		}
	case "visitors":
		if !up.ViewedVisitors {
			up.ViewedVisitors = true
		}
	case "ai":
		if !up.UsedAI {
			up.UsedAI = true
		}
	case "products":
		if !up.ViewedProducts {
			up.ViewedProducts = true
		}
	case "withdrawal":
		if !up.SubmittedWithdrawal {
			up.SubmittedWithdrawal = true
		}
	case "available":
		if !up.ViewedAvailable {
			up.ViewedAvailable = true
		}
	case "express":
		if !up.UsedExpress {
			up.UsedExpress = true
		}
	case "learning":
		if !up.CompletedLearning {
			up.CompletedLearning = true
		}
	}

	// Recalculate overall progress
	up.calculateOverallProgress()

	// Save to database
	return db.Save(up).Error
}

// calculateOverallProgress calculates the overall progress based on completed activities
func (up *UserProgress) calculateOverallProgress() {
	// Start from 0% - user earns progress by doing activities
	totalProgress := 0

	// Each activity adds specific percentage
	if up.CompletedTutorial { // 15%
		totalProgress += 15
	}
	if up.ViewedSuppliers { // 12%
		totalProgress += 12
	}
	if up.ViewedVisitors { // 12%
		totalProgress += 12
	}
	if up.UsedAI { // 15%
		totalProgress += 15
	}
	if up.ViewedProducts { // 10%
		totalProgress += 10
	}
	if up.SubmittedWithdrawal { // 8%
		totalProgress += 8
	}
	if up.ViewedAvailable { // 8%
		totalProgress += 8
	}
	if up.UsedExpress { // 10%
		totalProgress += 10
	}
	if up.CompletedLearning { // 10%
		totalProgress += 10
	}

	// Total progress (max 100%)
	up.OverallProgress = totalProgress
	if up.OverallProgress > 100 {
		up.OverallProgress = 100
	}

	log.Printf("User %d progress updated to %d%% (activities completed)",
		up.UserID, up.OverallProgress)
}

// GetProgressBreakdown returns detailed progress information
func (up *UserProgress) GetProgressBreakdown() map[string]interface{} {
	return map[string]interface{}{
		"overall_progress": up.OverallProgress,
		"activities": map[string]bool{
			"tutorial":   up.CompletedTutorial,
			"suppliers":  up.ViewedSuppliers,
			"visitors":   up.ViewedVisitors,
			"ai":         up.UsedAI,
			"products":   up.ViewedProducts,
			"withdrawal": up.SubmittedWithdrawal,
			"available":  up.ViewedAvailable,
			"express":    up.UsedExpress,
			"learning":   up.CompletedLearning,
		},
		"next_steps": up.getNextSteps(),
	}
}

// getNextSteps suggests what the user should do next
func (up *UserProgress) getNextSteps() []string {
	var suggestions []string

	if !up.CompletedTutorial {
		suggestions = append(suggestions, "مشاهده آموزش‌های پلتفرم")
	}
	if !up.ViewedSuppliers {
		suggestions = append(suggestions, "بررسی تأمین‌کنندگان")
	}
	if !up.ViewedVisitors {
		suggestions = append(suggestions, "مشاهده ویزیتورها")
	}
	if !up.UsedAI {
		suggestions = append(suggestions, "استفاده از هوش مصنوعی")
	}
	if !up.ViewedProducts {
		suggestions = append(suggestions, "بررسی محصولات تحقیقی")
	}

	if len(suggestions) == 0 {
		suggestions = append(suggestions, "شما تمام بخش‌های اصلی را مشاهده کرده‌اید!")
	}

	return suggestions
}
