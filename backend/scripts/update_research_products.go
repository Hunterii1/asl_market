package main

import (
	"asl-market-backend/models"
	"fmt"
	"log"
)

func main() {
	fmt.Println("🔄 Updating existing research products...")

	// Initialize database
	models.InitDatabase()
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
			// Recalculate profit margin using the same logic as in model
			if err := db.Model(&product).Update("profit_margin", "").Error; err == nil {
				// Trigger the calculation by updating the record
				var req models.ResearchProductRequest
				req.IranPurchasePrice = product.IranPurchasePrice
				req.TargetCountryPrice = product.TargetCountryPrice

				// This will trigger the profit margin calculation
				updatedProduct, err := models.CreateResearchProduct(req, product.AddedBy)
				if err == nil {
					db.Model(&product).Update("profit_margin", updatedProduct.ProfitMargin)
					fmt.Printf("✅ Updated profit margin for: %s (%s)\n", product.Name, updatedProduct.ProfitMargin)
				}
			}
		}
	}

	fmt.Println("🎉 Research products update completed!")
}
