package main

import (
	"asl-market-backend/config"
	"asl-market-backend/models"
	"fmt"
	"log"
	"strconv"
)

func main5() {
	fmt.Println("🔄 Updating existing research products...")

	// Load configuration and connect database
	config.LoadConfig()
	models.ConnectDatabase()
	db := models.GetDB()

	// Update existing products with new fields
	updates := map[string]map[string]interface{}{
		"زعفران سرگل": {
			"target_country":       "امارات متحده عربی",
			"iran_purchase_price":  "2500",
			"target_country_price": "4200",
			"price_currency":       "USD",
		},
		"خرما مجول": {
			"target_country":       "عربستان سعودی",
			"iran_purchase_price":  "800",
			"target_country_price": "1400",
			"price_currency":       "USD",
		},
		"پسته اکبری": {
			"target_country":       "کویت",
			"iran_purchase_price":  "1200",
			"target_country_price": "2100",
			"price_currency":       "USD",
		},
		"فرش دستباف": {
			"target_country":       "قطر",
			"iran_purchase_price":  "500",
			"target_country_price": "1200",
			"price_currency":       "USD",
		},
		"چای احمد": {
			"target_country":       "عراق",
			"iran_purchase_price":  "15",
			"target_country_price": "28",
			"price_currency":       "USD",
		},
		"صنایع دستی سفالی": {
			"target_country":       "امارات متحده عربی",
			"iran_purchase_price":  "50",
			"target_country_price": "120",
			"price_currency":       "USD",
		},
	}

	// Update each product
	for productName, updateFields := range updates {
		result := db.Model(&models.ResearchProduct{}).
			Where("name = ?", productName).
			Updates(updateFields)

		if result.Error != nil {
			log.Printf("❌ Error updating %s: %v", productName, result.Error)
		} else if result.RowsAffected > 0 {
			fmt.Printf("✅ Updated product: %s\n", productName)
		} else {
			fmt.Printf("⚠️ Product not found: %s\n", productName)
		}
	}

	// Now calculate profit margins for all products
	var products []models.ResearchProduct
	if err := db.Find(&products).Error; err != nil {
		log.Printf("Error fetching products: %v", err)
		return
	}

	for _, product := range products {
		if product.IranPurchasePrice != "" && product.TargetCountryPrice != "" {
			// Calculate profit margin manually
			if iranPrice, err1 := strconv.ParseFloat(product.IranPurchasePrice, 64); err1 == nil {
				if targetPrice, err2 := strconv.ParseFloat(product.TargetCountryPrice, 64); err2 == nil && iranPrice > 0 {
					margin := ((targetPrice - iranPrice) / iranPrice) * 100
					marginStr := fmt.Sprintf("%.2f%%", margin)

					if err := db.Model(&product).Update("profit_margin", marginStr).Error; err == nil {
						fmt.Printf("✅ Updated profit margin for: %s (%s)\n", product.Name, marginStr)
					} else {
						log.Printf("❌ Error updating profit margin for %s: %v", product.Name, err)
					}
				}
			}
		}
	}

	fmt.Println("🎉 Research products update completed!")
}
