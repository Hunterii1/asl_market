package main

import (
	"fmt"
	"log"
	"strings"

	"asl-market-backend/config"
	"asl-market-backend/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	// Load config
	cfg, err := config.LoadConfig("config/config.yaml")
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to database
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.Name,
	)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Get all affiliates
	var affiliates []models.Affiliate
	if err := db.Where("deleted_at IS NULL").Find(&affiliates).Error; err != nil {
		log.Fatalf("Failed to fetch affiliates: %v", err)
	}

	fmt.Printf("Found %d affiliates to normalize\n", len(affiliates))

	updated := 0
	skipped := 0
	errors := 0

	for _, aff := range affiliates {
		// Normalize username: trim spaces and convert to lowercase
		normalizedUsername := strings.TrimSpace(strings.ToLower(aff.Username))
		
		// Skip if already normalized
		if normalizedUsername == aff.Username {
			skipped++
			continue
		}

		// Check if normalized username already exists (conflict)
		var existing models.Affiliate
		if err := db.Where("username = ? AND id != ? AND deleted_at IS NULL", normalizedUsername, aff.ID).First(&existing).Error; err == nil {
			log.Printf("WARNING: Cannot normalize username '%s' to '%s' for affiliate ID %d - conflict with affiliate ID %d", 
				aff.Username, normalizedUsername, aff.ID, existing.ID)
			errors++
			continue
		}

		// Update affiliate username
		if err := db.Model(&aff).Update("username", normalizedUsername).Error; err != nil {
			log.Printf("ERROR: Failed to normalize username for affiliate ID %d: %v", aff.ID, err)
			errors++
			continue
		}

		fmt.Printf("Normalized username: '%s' -> '%s' (ID: %d)\n", aff.Username, normalizedUsername, aff.ID)
		updated++
	}

	fmt.Printf("\nMigration completed:\n")
	fmt.Printf("  Updated: %d\n", updated)
	fmt.Printf("  Skipped: %d\n", skipped)
	fmt.Printf("  Errors: %d\n", errors)
}
