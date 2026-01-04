package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"asl-market-backend/config"
	"asl-market-backend/models"
)

func main() {
	// This function seeds sliders from assets folder
	// Load configuration
	config.LoadConfig()

	// Connect to database
	models.ConnectDatabase()
	db := models.GetDB()

	// Get first admin user, or first user if no admin exists
	var adminUser models.User
	err := db.Where("is_admin = ?", true).First(&adminUser).Error
	if err != nil {
		// If no admin found, try to get first user
		log.Println("⚠️  No admin user found. Trying to use first user...")
		err = db.First(&adminUser).Error
		if err != nil {
			log.Fatal("❌ No users found in database. Please create a user first.")
		}
		log.Printf("ℹ️  Using user ID %d as admin for seeding", adminUser.ID)
	} else {
		log.Printf("✅ Found admin user: %s (ID: %d)", adminUser.Name(), adminUser.ID)
	}

	log.Println("🌱 Starting to seed sliders from assets folder...")
	log.Println("================================================")

	// Assets folder path
	assetsDir := "./assets"

	// Check if assets directory exists
	if _, err := os.Stat(assetsDir); os.IsNotExist(err) {
		log.Printf("⚠️  Assets directory '%s' does not exist. Creating it...", assetsDir)
		if err := os.MkdirAll(assetsDir, 0755); err != nil {
			log.Fatalf("❌ Failed to create assets directory: %v", err)
		}
		log.Println("✅ Assets directory created")
	}

	// Supported image extensions
	imageExtensions := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
		".webp": true,
	}

	// Read all files from assets directory
	files, err := os.ReadDir(assetsDir)
	if err != nil {
		log.Fatalf("❌ Failed to read assets directory: %v", err)
	}

	if len(files) == 0 {
		log.Println("⚠️  No files found in assets directory")
		return
	}

	log.Printf("📁 Found %d files in assets directory\n", len(files))

	sliderCount := 0
	order := 0

	for _, file := range files {
		// Skip directories
		if file.IsDir() {
			continue
		}

		// Get file extension
		ext := strings.ToLower(filepath.Ext(file.Name()))
		if !imageExtensions[ext] {
			log.Printf("⏭️  Skipping non-image file: %s", file.Name())
			continue
		}

		// Image URL path - use /assets/ directly since we serve assets folder
		imageURL := fmt.Sprintf("/assets/%s", file.Name())

		// Check if slider with this image already exists
		var existingSlider models.Slider
		err := db.Where("image_url = ?", imageURL).First(&existingSlider).Error
		if err == nil {
			log.Printf("⚠️  Slider with image %s already exists (ID: %d), skipping...", imageURL, existingSlider.ID)
			continue
		}

		// Create slider request
		sliderReq := models.SliderRequest{
			ImageURL: imageURL,
			Link:     "", // No link by default
			LinkType: "internal",
			IsActive: true,
			Order:    order,
		}

		// Create slider
		slider, err := models.CreateSlider(db, adminUser.ID, sliderReq)
		if err != nil {
			log.Printf("❌ Failed to create slider for %s: %v", file.Name(), err)
			continue
		}

		log.Printf("✅ Created slider #%d for image: %s", slider.ID, file.Name())
		sliderCount++
		order++
	}

	log.Println("")
	log.Println("================================================")
	log.Printf("🎉 Slider seeding completed!")
	log.Printf("📊 Total sliders created: %d", sliderCount)
	log.Println("================================================")
}
