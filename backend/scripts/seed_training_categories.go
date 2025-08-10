package main

import (
	"log"

	"asl-market-backend/config"
	"asl-market-backend/models"
)

func main() {
	// Load configuration
	config.LoadConfig()

	// Connect to database
	models.ConnectDatabase()

	// Default training categories (matching existing frontend categories)
	categories := []models.TrainingCategory{
		{
			Name:         "آموزش کار با پلتفرم",
			NameEn:       "Platform",
			Description:  "نحوه استفاده از امکانات سایت و پنل کاربری",
			Icon:         "Monitor",
			Color:        "blue",
			DisplayOrder: 1,
			IsActive:     true,
		},
		{
			Name:         "آموزش صادرات عمده",
			NameEn:       "Wholesale Export",
			Description:  "تکنیک‌های فروش عمده و صادرات به کشورهای هدف",
			Icon:         "Package",
			Color:        "green",
			DisplayOrder: 2,
			IsActive:     true,
		},
		{
			Name:         "آموزش فروش تکی محصول",
			NameEn:       "Retail Sales",
			Description:  "استراتژی‌های فروش خرده و بازاریابی آنلاین",
			Icon:         "ShoppingCart",
			Color:        "orange",
			DisplayOrder: 3,
			IsActive:     true,
		},
		{
			Name:         "دوره‌های آموزشی فروش",
			NameEn:       "Sales Courses",
			Description:  "آموزش‌های تخصصی مذاکره، بازاریابی و فروش",
			Icon:         "GraduationCap",
			Color:        "purple",
			DisplayOrder: 4,
			IsActive:     true,
		},
	}

	log.Println("🌱 Adding default training categories...")

	for _, category := range categories {
		// Check if category already exists
		var existing models.TrainingCategory
		err := models.GetDB().Where("name = ?", category.Name).First(&existing).Error

		if err != nil {
			// Category doesn't exist, create it
			if err := models.GetDB().Create(&category).Error; err != nil {
				log.Printf("❌ Failed to create category %s: %v", category.Name, err)
			} else {
				log.Printf("✅ Created category: %s", category.Name)
			}
		} else {
			log.Printf("⚠️  Category already exists: %s", category.Name)
		}
	}

	log.Println("🎉 Training categories setup completed!")
}
