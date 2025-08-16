package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"asl-market-backend/models"

	"github.com/xuri/excelize/v2"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

const (
	// Column indices based on Excel structure (0-based)
	COL_NAME             = 0 // نام محصول
	COL_HS_CODE          = 1 // HS code
	COL_TARGET_COUNTRIES = 2 // مقصدهای عربی اصلی
	COL_DESCRIPTION      = 3 // کاربرد/نکته قابل استفاده در فروش
	COL_EXPORT_VALUE     = 4 // حجم معاملات در سال ۲۰۲۴
)

func main99() {
	// Database connection
	dsn := "root:@tcp(localhost:3306)/asl_market?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto-migrate to add HSCode field if it doesn't exist
	err = db.AutoMigrate(&models.ResearchProduct{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// Excel file path
	excelPath := filepath.Join("..", "etc", "products_detailed.xlsx")

	// Check if file exists
	if _, err := os.Stat(excelPath); os.IsNotExist(err) {
		log.Fatalf("Excel file not found: %s", excelPath)
	}

	// Import products
	count, err := importResearchProductsFromExcel(db, excelPath, 1) // adminID = 1
	if err != nil {
		log.Fatalf("Import failed: %v", err)
	}

	log.Printf("✅ Successfully imported %d research products!", count)
}

func importResearchProductsFromExcel(db *gorm.DB, filePath string, adminID uint) (int, error) {
	f, err := excelize.OpenFile(filePath)
	if err != nil {
		return 0, fmt.Errorf("failed to open Excel file: %w", err)
	}
	defer f.Close()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return 0, fmt.Errorf("no sheets found")
	}

	rows, err := f.GetRows(sheets[0])
	if err != nil {
		return 0, fmt.Errorf("failed to read rows: %w", err)
	}

	if len(rows) < 3 { // Header + at least 2 data rows (skip first 2 rows)
		return 0, fmt.Errorf("insufficient data rows found")
	}

	// Log Excel structure for debugging
	log.Printf("📊 Excel Structure Analysis:")
	log.Printf("Total rows: %d", len(rows))
	log.Printf("Header row: %v", rows[0])
	if len(rows) > 1 {
		log.Printf("Sample data row: %v", rows[2]) // Skip row 1, show row 2
	}
	log.Println()

	successCount := 0
	errorCount := 0

	// Skip first 2 rows (header and sample), start from row 2 (index 2)
	log.Printf("📝 Processing %d data rows...", len(rows)-2)

	for i := 2; i < len(rows); i++ {
		row := rows[i]
		rowNum := i + 1

		// Skip empty rows
		if len(row) == 0 || isEmptyRow(row) {
			log.Printf("⏭️  Row %d: Empty row, skipping", rowNum)
			continue
		}

		if len(row) < 5 {
			log.Printf("⚠️  Row %d: Insufficient columns (%d), skipping", rowNum, len(row))
			errorCount++
			continue
		}

		// Extract data from columns
		name := cleanString(getColumnValue(row, COL_NAME))
		hsCode := cleanString(getColumnValue(row, COL_HS_CODE))
		targetCountries := cleanString(getColumnValue(row, COL_TARGET_COUNTRIES))
		description := cleanString(getColumnValue(row, COL_DESCRIPTION))
		exportValue := cleanString(getColumnValue(row, COL_EXPORT_VALUE))

		log.Printf("📋 Row %d data:", rowNum)
		log.Printf("  نام محصول: %s", name)
		log.Printf("  HS Code: %s", hsCode)
		log.Printf("  مقصدها: %s", targetCountries)
		log.Printf("  توضیحات: %s", truncateString(description, 50))
		log.Printf("  حجم معاملات: %s", exportValue)

		// Validate required fields
		if name == "" {
			log.Printf("❌ Row %d: Missing product name, skipping", rowNum)
			errorCount++
			continue
		}

		// Check if product already exists
		var existingProduct models.ResearchProduct
		err := db.Where("name = ?", name).First(&existingProduct).Error
		if err == nil {
			log.Printf("⚠️  Row %d: Product '%s' already exists, skipping", rowNum, name)
			continue
		}

		// Determine category based on product name or default
		category := determineCategoryFromName(name)

		// Create research product
		product := models.ResearchProduct{
			Name:            name,
			HSCode:          hsCode,
			Category:        category,
			Description:     description,
			ExportValue:     exportValue,
			TargetCountries: targetCountries,
			Status:          "active",
			Priority:        0,
			AddedBy:         adminID,
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		}

		// Save to database
		err = db.Create(&product).Error
		if err != nil {
			log.Printf("❌ Row %d: Failed to save product '%s': %v", rowNum, name, err)
			errorCount++
			continue
		}

		log.Printf("✅ Row %d: Successfully imported '%s'", rowNum, name)
		successCount++
	}

	log.Printf("\n📊 Import Summary:")
	log.Printf("✅ Success: %d", successCount)
	log.Printf("❌ Errors: %d", errorCount)
	log.Printf("📈 Total processed: %d", successCount+errorCount)

	return successCount, nil
}

// Helper functions

func getColumnValue(row []string, index int) string {
	if index >= len(row) {
		return ""
	}
	return row[index]
}

func cleanString(s string) string {
	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, "\n", " ")
	s = strings.ReplaceAll(s, "\r", " ")
	s = strings.ReplaceAll(s, "\t", " ")
	// Remove multiple spaces
	for strings.Contains(s, "  ") {
		s = strings.ReplaceAll(s, "  ", " ")
	}
	return s
}

func isEmptyRow(row []string) bool {
	for _, cell := range row {
		if strings.TrimSpace(cell) != "" {
			return false
		}
	}
	return true
}

func truncateString(s string, maxLength int) string {
	if len(s) <= maxLength {
		return s
	}
	return s[:maxLength] + "..."
}

func determineCategoryFromName(name string) string {
	name = strings.ToLower(name)

	// Category mapping based on product names
	categoryMap := map[string]string{
		"پلی":     "پلاستیک و پلیمر",
		"پلاستیک": "پلاستیک و پلیمر",
		"پلیمر":   "پلاستیک و پلیمر",
		"زعفران":  "ادویه و چاشنی",
		"خرما":    "میوه و خشکبار",
		"پسته":    "میوه و خشکبار",
		"فرش":     "صنایع دستی",
		"قالی":    "صنایع دستی",
		"چای":     "نوشیدنی",
		"برنج":    "غلات",
		"نفت":     "انرژی",
		"گاز":     "انرژی",
		"مس":      "فلزات",
		"آهن":     "فلزات",
		"فولاد":   "فلزات",
		"سیمان":   "مصالح ساختمانی",
		"سنگ":     "مصالح ساختمانی",
		"شیمیایی": "مواد شیمیایی",
		"دارو":    "دارو و بهداشت",
		"کشمش":    "میوه و خشکبار",
		"انجیر":   "میوه و خشکبار",
	}

	// Check for category keywords in product name
	for keyword, category := range categoryMap {
		if strings.Contains(name, keyword) {
			return category
		}
	}

	// Default category
	return "سایر محصولات"
}
