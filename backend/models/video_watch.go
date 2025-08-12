package models

import (
	"time"

	"gorm.io/gorm"
)

// VideoWatch tracks which videos users have watched
type VideoWatch struct {
	ID        uint          `gorm:"primaryKey" json:"id"`
	UserID    uint          `gorm:"not null;index" json:"user_id"`
	VideoID   uint          `gorm:"not null;index" json:"video_id"`
	User      User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Video     TrainingVideo `gorm:"foreignKey:VideoID" json:"video,omitempty"`
	WatchedAt *time.Time    `json:"watched_at"` // Nullable to avoid MySQL default value issues
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
}

// MarkVideoAsWatched marks a video as watched by a user
func MarkVideoAsWatched(db *gorm.DB, userID, videoID uint) error {
	// Check if already watched
	var existing VideoWatch
	err := db.Where("user_id = ? AND video_id = ?", userID, videoID).First(&existing).Error

	if err == gorm.ErrRecordNotFound {
		// Create new watch record
		now := time.Now()
		watch := VideoWatch{
			UserID:    userID,
			VideoID:   videoID,
			WatchedAt: &now,
		}
		return db.Create(&watch).Error
	}

	// Already watched, update timestamp
	if err == nil {
		now := time.Now()
		return db.Model(&existing).Update("watched_at", &now).Error
	}

	return err
}

// GetUserWatchedVideos returns all videos watched by a user
func GetUserWatchedVideos(db *gorm.DB, userID uint) ([]VideoWatch, error) {
	var watches []VideoWatch
	err := db.Preload("Video").Preload("Video.Category").
		Where("user_id = ?", userID).
		Order("watched_at DESC").
		Find(&watches).Error
	return watches, err
}

// GetUserWatchedVideoIDs returns just the video IDs that user has watched
func GetUserWatchedVideoIDs(db *gorm.DB, userID uint) ([]uint, error) {
	var videoIDs []uint
	err := db.Model(&VideoWatch{}).
		Where("user_id = ?", userID).
		Pluck("video_id", &videoIDs).Error
	return videoIDs, err
}

// IsVideoWatchedByUser checks if a specific video is watched by user
func IsVideoWatchedByUser(db *gorm.DB, userID, videoID uint) (bool, error) {
	var count int64
	err := db.Model(&VideoWatch{}).
		Where("user_id = ? AND video_id = ?", userID, videoID).
		Count(&count).Error
	return count > 0, err
}

// GetVideoWatchCount returns total watch count for a video
func GetVideoWatchCount(db *gorm.DB, videoID uint) (int64, error) {
	var count int64
	err := db.Model(&VideoWatch{}).
		Where("video_id = ?", videoID).
		Count(&count).Error
	return count, err
}

// GetUserWatchStats returns watch statistics for a user
func GetUserWatchStats(db *gorm.DB, userID uint) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total videos watched
	var totalWatched int64
	err := db.Model(&VideoWatch{}).Where("user_id = ?", userID).Count(&totalWatched).Error
	if err != nil {
		return nil, err
	}
	stats["total_watched"] = totalWatched

	// Total available videos
	var totalAvailable int64
	err = db.Model(&TrainingVideo{}).Where("status = ?", "active").Count(&totalAvailable).Error
	if err != nil {
		return nil, err
	}
	stats["total_available"] = totalAvailable

	// Progress percentage
	if totalAvailable > 0 {
		stats["progress_percentage"] = float64(totalWatched) / float64(totalAvailable) * 100
	} else {
		stats["progress_percentage"] = 0
	}

	// Recent watches (last 7 days)
	var recentWatches int64
	sevenDaysAgo := time.Now().AddDate(0, 0, -7)
	err = db.Model(&VideoWatch{}).
		Where("user_id = ? AND watched_at >= ?", userID, sevenDaysAgo).
		Count(&recentWatches).Error
	if err != nil {
		return nil, err
	}
	stats["recent_watches"] = recentWatches

	return stats, nil
}
