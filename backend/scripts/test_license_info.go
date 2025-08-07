package main

import (
	"encoding/json"
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

	log.Println("🔍 Testing license info...")

	// Find all used licenses
	var licenses []models.License
	err := db.Where("is_used = ? AND used_by IS NOT NULL", true).Find(&licenses).Error
	if err != nil {
		log.Fatalf("❌ Error finding licenses: %v", err)
	}

	log.Printf("📊 Found %d used licenses", len(licenses))

	for i, license := range licenses {
		if i >= 3 { // Show only first 3 for testing
			break
		}

		log.Printf("\n📋 License %s:", license.Code)
		log.Printf("   Type: '%s'", license.Type)
		log.Printf("   Duration: %d", license.Duration)
		log.Printf("   UsedAt: %v", license.UsedAt)
		log.Printf("   ExpiresAt: %v", license.ExpiresAt)

		// Simulate controller logic
		var licenseType string
		var duration int
		var isActive bool

		if license.ExpiresAt != nil {
			licenseType = license.Type
			duration = license.Duration
			// Check if active (simplified)
			isActive = true
		} else {
			licenseType = "plus"
			duration = 12
			isActive = true
		}

		result := map[string]interface{}{
			"license_code": license.Code,
			"type":         licenseType,
			"duration":     duration,
			"is_active":    isActive,
		}

		jsonResult, _ := json.MarshalIndent(result, "   ", "  ")
		log.Printf("   Result: %s", string(jsonResult))
	}

	log.Println("\n✅ Test completed!")
}
