package main

import (
	"fmt"
	"log"

	"asl-market-backend/config"
	"asl-market-backend/models"
)

func main9() {
	// Load configuration
	config.LoadConfig()

	// Connect to database
	models.ConnectDatabase()
	db := models.GetDB()

	fmt.Println("🌱 Starting Available Products seeding...")

	// First, find the admin user to use as creator
	var adminUser models.User
	if err := db.Where("email = ?", "admin@aslmarket.com").First(&adminUser).Error; err != nil {
		// Create a default admin user if not exists
		adminUser = models.User{
			FirstName: "Admin",
			LastName:  "ASL Market",
			Email:     "admin@aslmarket.com",
			Password:  "$2a$10$placeholder", // This should be properly hashed
			IsAdmin:   true,
			IsActive:  true,
		}
		if err := db.Create(&adminUser).Error; err != nil {
			log.Fatal("Failed to create admin user:", err)
		}
		fmt.Println("✅ Created admin user for seeding")
	}

	// Available products fake data from AslAvailable.tsx
	availableProducts := []models.CreateAvailableProductRequest{
		{
			SaleType:          "wholesale",
			ProductName:       "زعفران سرگل ممتاز",
			Category:          "زعفران",
			Subcategory:       "سرگل",
			Description:       "زعفران درجه یک با کیفیت صادراتی",
			WholesalePrice:    "850",
			RetailPrice:       "900",
			ExportPrice:       "850",
			Currency:          "USD",
			AvailableQuantity: 5,
			MinOrderQuantity:  1,
			MaxOrderQuantity:  5,
			Unit:              "کیلوگرم",
			Brand:             "ممتاز",
			Model:             "سرگل",
			Origin:            "ایران",
			Quality:           "A+",
			PackagingType:     "بسته‌بندی خلاء",
			Weight:            "1kg",
			Dimensions:        "20x15x5cm",
			ShippingCost:      "50",
			Location:          "مشهد، ایران",
			ContactPhone:      "09123456789",
			ContactEmail:      "saffron@example.com",
			ContactWhatsapp:   "09123456789",
			CanExport:         true,
			RequiresLicense:   false,
			LicenseType:       "",
			ExportCountries:   "امارات، آلمان، فرانسه",
			ImageURLs:         "https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=300",
			VideoURL:          "",
			CatalogURL:        "",
			IsFeatured:        true,
			IsHotDeal:         false,
			Tags:              "زعفران,صادراتی,ممتاز",
			Notes:             "محصول با کیفیت بالا و آماده صادرات",
		},
		{
			SaleType:          "retail",
			ProductName:       "خرما مجول درجه یک",
			Category:          "خرما",
			Subcategory:       "مجول",
			Description:       "نمونه خرما برای تست کیفیت",
			WholesalePrice:    "120",
			RetailPrice:       "140",
			ExportPrice:       "120",
			Currency:          "USD",
			AvailableQuantity: 2,
			MinOrderQuantity:  1,
			MaxOrderQuantity:  2,
			Unit:              "کیلوگرم",
			Brand:             "طبیعی",
			Model:             "مجول",
			Origin:            "ایران",
			Quality:           "A",
			PackagingType:     "جعبه کارتنی",
			Weight:            "1kg",
			Dimensions:        "25x20x10cm",
			ShippingCost:      "30",
			Location:          "اهواز، ایران",
			ContactPhone:      "09123456788",
			ContactEmail:      "dates@example.com",
			ContactWhatsapp:   "09123456788",
			CanExport:         true,
			RequiresLicense:   false,
			LicenseType:       "",
			ExportCountries:   "عراق، کویت",
			ImageURLs:         "https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=300",
			VideoURL:          "",
			CatalogURL:        "",
			IsFeatured:        false,
			IsHotDeal:         true,
			Tags:              "خرما,نمونه,تست",
			Notes:             "نمونه محصول برای بررسی کیفیت",
		},
		{
			SaleType:          "wholesale",
			ProductName:       "پسته اکبری",
			Category:          "خشکبار",
			Subcategory:       "پسته",
			Description:       "پسته تازه برداشت شده",
			WholesalePrice:    "450",
			RetailPrice:       "480",
			ExportPrice:       "450",
			Currency:          "USD",
			AvailableQuantity: 10,
			MinOrderQuantity:  2,
			MaxOrderQuantity:  10,
			Unit:              "کیلوگرم",
			Brand:             "اکبری",
			Model:             "درجه یک",
			Origin:            "ایران",
			Quality:           "A+",
			PackagingType:     "کیسه 1 کیلویی",
			Weight:            "1kg",
			Dimensions:        "30x20x10cm",
			ShippingCost:      "40",
			Location:          "کرمان، ایران",
			ContactPhone:      "09123456787",
			ContactEmail:      "pistachio@example.com",
			ContactWhatsapp:   "09123456787",
			CanExport:         true,
			RequiresLicense:   false,
			LicenseType:       "",
			ExportCountries:   "امارات، عراق، آلمان",
			ImageURLs:         "https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=300",
			VideoURL:          "",
			CatalogURL:        "",
			IsFeatured:        true,
			IsHotDeal:         false,
			Tags:              "پسته,اکبری,کرمان",
			Notes:             "پسته تازه و با کیفیت",
		},
		{
			SaleType:          "retail",
			ProductName:       "فرش دستباف اصفهان",
			Category:          "صنایع دستی",
			Subcategory:       "فرش",
			Description:       "فرش دستباف با طرح سنتی",
			WholesalePrice:    "2500",
			RetailPrice:       "2800",
			ExportPrice:       "2500",
			Currency:          "USD",
			AvailableQuantity: 1,
			MinOrderQuantity:  1,
			MaxOrderQuantity:  1,
			Unit:              "عدد",
			Brand:             "دستباف اصفهان",
			Model:             "طرح سنتی",
			Origin:            "ایران",
			Quality:           "A+",
			PackagingType:     "بسته‌بندی ویژه",
			Weight:            "15kg",
			Dimensions:        "200x300cm",
			ShippingCost:      "200",
			Location:          "اصفهان، ایران",
			ContactPhone:      "09123456786",
			ContactEmail:      "carpet@example.com",
			ContactWhatsapp:   "09123456786",
			CanExport:         true,
			RequiresLicense:   true,
			LicenseType:       "مجوز صادرات صنایع دستی",
			ExportCountries:   "آلمان، فرانسه، ایتالیا",
			ImageURLs:         "https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=300",
			VideoURL:          "",
			CatalogURL:        "",
			IsFeatured:        true,
			IsHotDeal:         true,
			Tags:              "فرش,دستباف,اصفهان,سنتی",
			Notes:             "فرش دستباف با کیفیت بالا و طرح منحصر به فرد",
		},
	}

	// Clear existing available products (optional)
	fmt.Println("🧹 Clearing existing available products...")
	if err := db.Exec("DELETE FROM available_products").Error; err != nil {
		log.Printf("Warning: Could not clear existing available products: %v", err)
	}

	// Seed available products
	fmt.Printf("📦 Creating %d available products...\n", len(availableProducts))
	for _, productReq := range availableProducts {
		product, err := models.CreateAvailableProduct(db, adminUser.ID, productReq)
		if err != nil {
			log.Printf("Error creating available product %s: %v", productReq.ProductName, err)
			continue
		}

		// Set status to active
		db.Model(product).Update("status", "active")

		fmt.Printf("✅ Created available product: %s (ID: %d)\n", productReq.ProductName, product.ID)
	}

	fmt.Println("🎉 Available Products seeding completed!")

	// Show summary
	var count int64
	db.Model(&models.AvailableProduct{}).Count(&count)
	fmt.Printf("📊 Total Available Products in database: %d\n", count)
}
