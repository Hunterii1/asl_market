package main

import (
	"log"
	"strings"

	"asl-market-backend/config"
	"asl-market-backend/models"
)

func main() {
	// Load configuration
	config.LoadConfig()

	// Connect to database
	models.ConnectDatabase()
	db := models.GetDB()

	log.Println("🔧 Fixing slider image URLs...")
	log.Println("================================================")

	// Get all sliders
	var sliders []models.Slider
	if err := db.Find(&sliders).Error; err != nil {
		log.Fatalf("❌ Failed to fetch sliders: %v", err)
	}

	log.Printf("📊 Found %d sliders to check\n", len(sliders))

	updatedCount := 0
	for _, slider := range sliders {
		// Check if URL starts with /uploads/assets/ and needs to be changed to /assets/
		if strings.HasPrefix(slider.ImageURL, "/uploads/assets/") {
			// Extract filename
			filename := strings.TrimPrefix(slider.ImageURL, "/uploads/assets/")
			newURL := "/assets/" + filename

			// Update slider
			if err := db.Model(&slider).Update("image_url", newURL).Error; err != nil {
				log.Printf("❌ Failed to update slider #%d: %v", slider.ID, err)
				continue
			}

			log.Printf("✅ Updated slider #%d: %s -> %s", slider.ID, slider.ImageURL, newURL)
			updatedCount++
		} else {
			log.Printf("ℹ️  Slider #%d already has correct URL: %s", slider.ID, slider.ImageURL)
		}
	}

	log.Println("")
	log.Println("================================================")
	log.Printf("🎉 URL fixing completed!")
	log.Printf("📊 Total sliders updated: %d", updatedCount)
	log.Println("================================================")
}
