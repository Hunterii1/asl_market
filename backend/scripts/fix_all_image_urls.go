package main

import (
	"log"
	"strings"

	"asl-market-backend/config"
	"asl-market-backend/models"
	"asl-market-backend/utils"
)

func main() {
	// Load configuration
	config.LoadConfig()

	// Connect to database
	models.ConnectDatabase()
	db := models.GetDB()

	log.Println("🔧 Fixing all image URLs in database...")
	log.Println("================================================")

	// 1. Fix Slider image URLs
	log.Println("\n1️⃣  Fixing Slider image URLs...")
	var sliders []models.Slider
	if err := db.Find(&sliders).Error; err != nil {
		log.Printf("❌ Failed to fetch sliders: %v", err)
	} else {
		sliderCount := 0
		for _, slider := range sliders {
			// First normalize to remove any full URLs
			normalizedURL := utils.NormalizeImagePath(slider.ImageURL)
			newURL := fixImageURL(normalizedURL, "sliders")
			if newURL != slider.ImageURL {
				if err := db.Model(&slider).Update("image_url", newURL).Error; err != nil {
					log.Printf("❌ Failed to update slider #%d: %v", slider.ID, err)
					continue
				}
				log.Printf("✅ Updated slider #%d: %s -> %s", slider.ID, slider.ImageURL, newURL)
				sliderCount++
			}
		}
		log.Printf("📊 Updated %d slider image URLs", sliderCount)
	}

	// 2. Fix Supplier image URLs
	log.Println("\n2️⃣  Fixing Supplier image URLs...")
	var suppliers []models.Supplier
	if err := db.Find(&suppliers).Error; err != nil {
		log.Printf("❌ Failed to fetch suppliers: %v", err)
	} else {
		supplierCount := 0
		for _, supplier := range suppliers {
			if supplier.ImageURL != "" {
				// First normalize to remove any full URLs
				normalizedURL := utils.NormalizeImagePath(supplier.ImageURL)
				newURL := fixImageURL(normalizedURL, "suppliers")
				if newURL != supplier.ImageURL {
					if err := db.Model(&supplier).Update("image_url", newURL).Error; err != nil {
						log.Printf("❌ Failed to update supplier #%d: %v", supplier.ID, err)
						continue
					}
					log.Printf("✅ Updated supplier #%d: %s -> %s", supplier.ID, supplier.ImageURL, newURL)
					supplierCount++
				}
			}
		}
		log.Printf("📊 Updated %d supplier image URLs", supplierCount)
	}

	// 3. Fix AvailableProduct image URLs
	log.Println("\n3️⃣  Fixing AvailableProduct image URLs...")
	var products []models.AvailableProduct
	if err := db.Find(&products).Error; err != nil {
		log.Printf("❌ Failed to fetch products: %v", err)
	} else {
		productCount := 0
		for _, product := range products {
			if product.ImageURLs != "" {
				// ImageURLs is a comma-separated list or JSON array
				// Split by comma and fix each URL
				urls := strings.Split(product.ImageURLs, ",")
				var fixedURLs []string
				changed := false
				for _, url := range urls {
					url = strings.TrimSpace(url)
					// Remove JSON array brackets if present
					url = strings.Trim(url, "[]\"'")
					url = strings.TrimSpace(url)
					if url != "" {
						// First normalize to remove any full URLs
						normalizedURL := utils.NormalizeImagePath(url)
						newURL := fixImageURL(normalizedURL, "products")
						fixedURLs = append(fixedURLs, newURL)
						if newURL != url {
							changed = true
						}
					}
				}
				if changed {
					newImageURLs := strings.Join(fixedURLs, ",")
					if err := db.Model(&product).Update("image_urls", newImageURLs).Error; err != nil {
						log.Printf("❌ Failed to update product #%d: %v", product.ID, err)
						continue
					}
					log.Printf("✅ Updated product #%d image URLs: %s -> %s", product.ID, product.ImageURLs, newImageURLs)
					productCount++
				}
			}
		}
		log.Printf("📊 Updated %d product image URLs", productCount)
	}

	// 4. Fix MatchingMessage image URLs
	log.Println("\n4️⃣  Fixing MatchingMessage image URLs...")
	var messages []models.MatchingMessage
	if err := db.Find(&messages).Error; err != nil {
		log.Printf("❌ Failed to fetch messages: %v", err)
	} else {
		messageCount := 0
		for _, message := range messages {
			if message.ImageURL != "" {
				// First normalize to remove any full URLs
				normalizedURL := utils.NormalizeImagePath(message.ImageURL)
				newURL := fixImageURL(normalizedURL, "chat")
				if newURL != message.ImageURL {
					if err := db.Model(&message).Update("image_url", newURL).Error; err != nil {
						log.Printf("❌ Failed to update message #%d: %v", message.ID, err)
						continue
					}
					log.Printf("✅ Updated message #%d: %s -> %s", message.ID, message.ImageURL, newURL)
					messageCount++
				}
			}
		}
		log.Printf("📊 Updated %d message image URLs", messageCount)
	}

	// 5. Fix WithdrawalRequest receipt paths
	log.Println("\n5️⃣  Fixing WithdrawalRequest receipt paths...")
	var withdrawals []models.WithdrawalRequest
	if err := db.Find(&withdrawals).Error; err != nil {
		log.Printf("❌ Failed to fetch withdrawals: %v", err)
	} else {
		withdrawalCount := 0
		for _, withdrawal := range withdrawals {
			if withdrawal.ReceiptPath != "" {
				newPath := fixReceiptPath(withdrawal.ReceiptPath)
				if newPath != withdrawal.ReceiptPath {
					if err := db.Model(&withdrawal).Update("receipt_path", newPath).Error; err != nil {
						log.Printf("❌ Failed to update withdrawal #%d: %v", withdrawal.ID, err)
						continue
					}
					log.Printf("✅ Updated withdrawal #%d receipt: %s -> %s", withdrawal.ID, withdrawal.ReceiptPath, newPath)
					withdrawalCount++
				}
			}
		}
		log.Printf("📊 Updated %d withdrawal receipt paths", withdrawalCount)
	}

	log.Println("\n================================================")
	log.Println("🎉 Image URL fixing completed!")
	log.Println("================================================")
}

// fixImageURL fixes image URLs to use /uploads/{type}/ format
func fixImageURL(url string, uploadType string) string {
	if url == "" {
		return url
	}

	// Remove localhost:8080 or any full URL prefix - we only want relative paths
	if strings.Contains(url, "localhost:8080") {
		// Extract the path part after localhost:8080
		parts := strings.Split(url, "localhost:8080")
		if len(parts) > 1 {
			url = parts[1]
		}
	}

	// Remove http:// or https:// prefixes if present (but keep the path)
	if strings.HasPrefix(url, "http://") {
		url = strings.TrimPrefix(url, "http://")
		// Remove domain part
		if idx := strings.Index(url, "/"); idx != -1 {
			url = url[idx:]
		} else {
			url = "/" + url
		}
	}
	if strings.HasPrefix(url, "https://") {
		url = strings.TrimPrefix(url, "https://")
		// Remove domain part
		if idx := strings.Index(url, "/"); idx != -1 {
			url = url[idx:]
		} else {
			url = "/" + url
		}
	}

	// If it's an external URL (not our domain), keep it as is
	// But if it's our domain (asllmarket.com), extract the path
	if strings.Contains(url, "asllmarket.com") {
		parts := strings.Split(url, "asllmarket.com")
		if len(parts) > 1 {
			url = parts[1]
		}
	}

	// If already in correct format /uploads/{type}/..., return as is
	if strings.HasPrefix(url, "/uploads/"+uploadType+"/") {
		return url
	}

	// Remove leading slash if present
	url = strings.TrimPrefix(url, "/")

	// Handle different old formats
	if strings.HasPrefix(url, "uploads/"+uploadType+"/") {
		// Already has uploads/ but missing leading slash
		return "/" + url
	}

	if strings.HasPrefix(url, uploadType+"/") {
		// Missing uploads/ prefix
		return "/uploads/" + url
	}

	if strings.HasPrefix(url, "assets/") {
		// Old assets folder - move to appropriate uploads folder
		filename := strings.TrimPrefix(url, "assets/")
		return "/uploads/" + uploadType + "/" + filename
	}

	if strings.HasPrefix(url, "/assets/") {
		// Old assets folder with leading slash
		filename := strings.TrimPrefix(url, "/assets/")
		return "/uploads/" + uploadType + "/" + filename
	}

	// If it's just a filename, assume it's in the correct uploads folder
	if !strings.Contains(url, "/") {
		return "/uploads/" + uploadType + "/" + url
	}

	// Unknown format - try to extract filename and use it
	parts := strings.Split(url, "/")
	filename := parts[len(parts)-1]
	if filename != "" {
		return "/uploads/" + uploadType + "/" + filename
	}

	// If we can't fix it, return as is
	return url
}

// fixReceiptPath fixes receipt paths to use /uploads/receipts/ format
func fixReceiptPath(path string) string {
	if path == "" {
		return path
	}

	// If already in correct format /uploads/receipts/..., return as is
	if strings.HasPrefix(path, "/uploads/receipts/") {
		return path
	}

	// Remove leading slash if present
	path = strings.TrimPrefix(path, "/")

	// Handle different old formats
	if strings.HasPrefix(path, "uploads/receipts/") {
		// Already has uploads/ but missing leading slash
		return "/" + path
	}

	if strings.HasPrefix(path, "receipts/") {
		// Missing uploads/ prefix
		return "/uploads/" + path
	}

	// If it's just a filename, assume it's in receipts folder
	if !strings.Contains(path, "/") {
		return "/uploads/receipts/" + path
	}

	// If it contains "receipt" or "withdrawal", try to extract filename
	if strings.Contains(path, "receipt") || strings.Contains(path, "withdrawal") {
		parts := strings.Split(path, "/")
		filename := parts[len(parts)-1]
		if filename != "" {
			return "/uploads/receipts/" + filename
		}
	}

	// If we can't fix it, return as is
	return path
}
