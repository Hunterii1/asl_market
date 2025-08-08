package main

import (
	"log"

	"asl-market-backend/config"
	"asl-market-backend/models"
)

func main() {
	// Initialize config
	config.LoadConfig()

	// Initialize database
	models.ConnectDatabase()
	db := models.GetDB()

	log.Println("🔍 Starting update of old licenses...")

	// Find all licenses that don't have Type or ExpiresAt set
	var oldLicenses []models.License
	err := db.Where("type = '' OR type IS NULL OR expires_at IS NULL").Find(&oldLicenses).Error
	if err != nil {
		log.Fatalf("❌ Error finding old licenses: %v", err)
	}

	log.Printf("📊 Found %d old licenses to update", len(oldLicenses))

	updatedCount := 0
	for _, license := range oldLicenses {
		// Set default values for old licenses
		updateData := map[string]interface{}{}

		// Set type to 'plus' if empty
		if license.Type == "" {
			updateData["type"] = "plus"
		}

		// Set duration to 12 if empty
		if license.Duration == 0 {
			updateData["duration"] = 12
		}

		// Calculate ExpiresAt if not set and license is used
		if license.ExpiresAt == nil && license.UsedAt != nil {
			expiryDate := license.UsedAt.AddDate(0, 12, 0) // Add 12 months
			updateData["expires_at"] = expiryDate
		}

		// Update the license if there are changes
		if len(updateData) > 0 {
			err := db.Model(&license).Updates(updateData).Error
			if err != nil {
				log.Printf("❌ Error updating license %s: %v", license.Code, err)
				continue
			}
			updatedCount++
			log.Printf("✅ Updated license %s (Type: %s, Duration: %d months)",
				license.Code, updateData["type"], updateData["duration"])
		}
	}

	log.Printf("🎉 Successfully updated %d old licenses", updatedCount)
	log.Println("✨ Migration completed!")
}
