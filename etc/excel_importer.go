package main

import (
	"crypto/rand"
	"fmt"
	"log"
	"math/big"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// User model matching backend
type User struct {
	ID        uint   `gorm:"primaryKey"`
	FirstName string `gorm:"size:100;not null"`
	LastName  string `gorm:"size:100;not null"`
	Email     string `gorm:"size:255;uniqueIndex;not null"`
	Password  string `gorm:"size:255;not null"`
	Phone     string `gorm:"size:20"`
	IsActive  bool   `gorm:"default:true"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

// Supplier model matching backend
type Supplier struct {
	ID                       uint   `gorm:"primaryKey"`
	UserID                   uint   `gorm:"not null;index"`
	FullName                 string `gorm:"size:255;not null"`
	Mobile                   string `gorm:"size:20;not null"`
	BrandName                string `gorm:"size:255"`
	City                     string `gorm:"size:100;not null"`
	Address                  string `gorm:"type:text;not null"`
	HasRegisteredBusiness    bool   `gorm:"default:false"`
	BusinessRegistrationNum  string `gorm:"size:100"`
	HasExportExperience      bool   `gorm:"default:false"`
	ExportPrice              string `gorm:"type:text"`
	WholesaleMinPrice        string `gorm:"type:text;not null"`
	WholesaleHighVolumePrice string `gorm:"type:text"`
	CanProducePrivateLabel   bool   `gorm:"default:false"`
	Status                   string `gorm:"size:20;default:'pending'"`
	CreatedAt                time.Time
	UpdatedAt                time.Time
}

// SupplierProduct model matching backend
type SupplierProduct struct {
	ID                   uint   `gorm:"primaryKey"`
	SupplierID           uint   `gorm:"not null;index"`
	ProductName          string `gorm:"size:255;not null"`
	ProductType          string `gorm:"size:50;not null"`
	Description          string `gorm:"type:text;not null"`
	NeedsExportLicense   bool   `gorm:"default:false"`
	RequiredLicenseType  string `gorm:"size:255"`
	MonthlyProductionMin string `gorm:"size:100;not null"`
	CreatedAt            time.Time
	UpdatedAt            time.Time
}

// Visitor model matching backend
type Visitor struct {
	ID                            uint   `gorm:"primaryKey"`
	UserID                        uint   `gorm:"not null;index"`
	FullName                      string `gorm:"size:255;not null"`
	NationalID                    string `gorm:"size:20;not null"`
	PassportNumber                string `gorm:"size:20"`
	BirthDate                     string `gorm:"size:20;not null"`
	Mobile                        string `gorm:"size:20;not null"`
	WhatsappNumber                string `gorm:"size:20"`
	Email                         string `gorm:"size:255"`
	ResidenceAddress              string `gorm:"type:text;not null"`
	CityProvince                  string `gorm:"size:255;not null"`
	DestinationCities             string `gorm:"type:text;not null"`
	HasLocalContact               bool   `gorm:"default:false"`
	LocalContactDetails           string `gorm:"type:text"`
	BankAccountIBAN               string `gorm:"size:50;not null"`
	BankName                      string `gorm:"size:255;not null"`
	AccountHolderName             string `gorm:"size:255"`
	HasMarketingExperience        bool   `gorm:"default:false"`
	MarketingExperienceDesc       string `gorm:"type:text"`
	LanguageLevel                 string `gorm:"size:50;not null"`
	SpecialSkills                 string `gorm:"type:text"`
	AgreesToUseApprovedProducts   bool   `gorm:"default:false"`
	AgreesToViolationConsequences bool   `gorm:"default:false"`
	AgreesToSubmitReports         bool   `gorm:"default:false"`
	DigitalSignature              string `gorm:"size:255"`
	SignatureDate                 string `gorm:"size:20"`
	Status                        string `gorm:"size:20;default:'pending'"`
	CreatedAt                     time.Time
	UpdatedAt                     time.Time
}

func main() {
	log.Println("🚀 ASL Market Excel Data Import")
	log.Println("================================")

	// Connect to database
	db, err := connectToDatabase()
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}

	// Get current directory (which is /etc)
	wd, _ := os.Getwd()
	log.Printf("📂 Looking for Excel files in: %s", wd)

	supplierFile := filepath.Join(wd, "َASL SUPPLIER.xlsx")
	visitorFile := filepath.Join(wd, "ASL MARKET VISITOR.xlsx")

	totalImported := 0

	// Import suppliers
	if _, err := os.Stat(supplierFile); err == nil {
		log.Println("📋 Importing suppliers from Excel...")
		count, err := importSuppliersFromExcel(db, supplierFile)
		if err != nil {
			log.Printf("❌ Error importing suppliers: %v", err)
		} else {
			log.Printf("✅ Successfully imported %d suppliers!", count)
			totalImported += count
		}
	} else {
		log.Printf("⚠️  Supplier file not found: %s", supplierFile)
	}

	// Import visitors
	if _, err := os.Stat(visitorFile); err == nil {
		log.Println("📋 Importing visitors from Excel...")
		count, err := importVisitorsFromExcel(db, visitorFile)
		if err != nil {
			log.Printf("❌ Error importing visitors: %v", err)
		} else {
			log.Printf("✅ Successfully imported %d visitors!", count)
			totalImported += count
		}
	} else {
		log.Printf("⚠️  Visitor file not found: %s", visitorFile)
	}

	log.Printf("🎉 Import completed! Total records imported: %d", totalImported)
}

func connectToDatabase() (*gorm.DB, error) {
	dbUser := getEnvOrDefault("DB_USER", "root")
	dbPassword := getEnvOrDefault("DB_PASSWORD", "")
	dbHost := getEnvOrDefault("DB_HOST", "localhost")
	dbPort := getEnvOrDefault("DB_PORT", "3306")
	dbName := getEnvOrDefault("DB_NAME", "asl_market")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		dbUser, dbPassword, dbHost, dbPort, dbName)

	return gorm.Open(mysql.Open(dsn), &gorm.Config{})
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func importSuppliersFromExcel(db *gorm.DB, filePath string) (int, error) {
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

	if len(rows) < 2 {
		return 0, fmt.Errorf("no data rows found")
	}

	successCount := 0
	log.Printf("Processing %d supplier rows...", len(rows)-1)

	for i, row := range rows[1:] {
		rowNum := i + 2

		if len(row) < 5 {
			log.Printf("⚠️  Row %d: Insufficient columns, skipping", rowNum)
			continue
		}

		// Extract data
		fullName := getCleanString(row, 0)
		mobile := getCleanString(row, 1)
		city := getCleanString(row, 2)
		address := getCleanString(row, 3)
		wholesaleMinPrice := getCleanString(row, 4)
		brandName := getCleanString(row, 5)
		businessRegNum := getCleanString(row, 6)
		exportPrice := getCleanString(row, 7)
		wholesaleHighPrice := getCleanString(row, 8)
		productName := getCleanString(row, 9)
		productType := getCleanString(row, 10)
		productDesc := getCleanString(row, 11)
		monthlyProduction := getCleanString(row, 12)

		// Validate required fields
		if fullName == "" || mobile == "" || city == "" || address == "" || wholesaleMinPrice == "" {
			log.Printf("⚠️  Row %d: Missing required fields, skipping", rowNum)
			continue
		}

		// Find or create user
		user, err := findOrCreateUser(db, fullName, mobile)
		if err != nil {
			log.Printf("❌ Row %d: Failed to create user: %v", rowNum, err)
			continue
		}

		// Check if supplier exists
		var existing Supplier
		if err := db.Where("user_id = ?", user.ID).First(&existing).Error; err == nil {
			log.Printf("ℹ️  Row %d: Supplier exists for %s, skipping", rowNum, fullName)
			continue
		}

		// Create supplier
		supplier := Supplier{
			UserID:                   user.ID,
			FullName:                 fullName,
			Mobile:                   mobile,
			BrandName:                brandName,
			City:                     city,
			Address:                  address,
			HasRegisteredBusiness:    businessRegNum != "",
			BusinessRegistrationNum:  businessRegNum,
			HasExportExperience:      exportPrice != "",
			ExportPrice:              exportPrice,
			WholesaleMinPrice:        wholesaleMinPrice,
			WholesaleHighVolumePrice: wholesaleHighPrice,
			CanProducePrivateLabel:   false,
			Status:                   "pending",
		}

		if err := db.Create(&supplier).Error; err != nil {
			log.Printf("❌ Row %d: Failed to create supplier: %v", rowNum, err)
			continue
		}

		// Create product if provided
		if productName != "" && productDesc != "" && monthlyProduction != "" {
			if productType == "" {
				productType = "other"
			}

			product := SupplierProduct{
				SupplierID:           supplier.ID,
				ProductName:          productName,
				ProductType:          normalizeProductType(productType),
				Description:          productDesc,
				NeedsExportLicense:   false,
				MonthlyProductionMin: monthlyProduction,
			}

			if err := db.Create(&product).Error; err != nil {
				log.Printf("⚠️  Row %d: Failed to create product: %v", rowNum, err)
			}
		} else {
			// Create default product
			product := SupplierProduct{
				SupplierID:           supplier.ID,
				ProductName:          "محصول عمومی",
				ProductType:          "other",
				Description:          "اطلاعات محصول در Excel موجود نبود",
				NeedsExportLicense:   false,
				MonthlyProductionMin: "نامشخص",
			}
			db.Create(&product)
		}

		successCount++
		log.Printf("✅ Row %d: Created supplier %s (ID: %d)", rowNum, fullName, supplier.ID)
	}

	return successCount, nil
}

func importVisitorsFromExcel(db *gorm.DB, filePath string) (int, error) {
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

	if len(rows) < 2 {
		return 0, fmt.Errorf("no data rows found")
	}

	successCount := 0
	log.Printf("Processing %d visitor rows...", len(rows)-1)

	for i, row := range rows[1:] {
		rowNum := i + 2

		if len(row) < 9 {
			log.Printf("⚠️  Row %d: Insufficient columns, skipping", rowNum)
			continue
		}

		// Extract required fields
		fullName := getCleanString(row, 0)
		nationalID := getCleanString(row, 1)
		birthDate := getCleanString(row, 2)
		mobile := getCleanString(row, 3)
		residenceAddress := getCleanString(row, 4)
		cityProvince := getCleanString(row, 5)
		destinationCities := getCleanString(row, 6)
		bankIBAN := getCleanString(row, 7)
		bankName := getCleanString(row, 8)

		// Extract optional fields
		passportNumber := getCleanString(row, 9)
		whatsappNumber := getCleanString(row, 10)
		email := getCleanString(row, 11)
		accountHolderName := getCleanString(row, 12)
		languageLevel := getCleanString(row, 13)
		marketingExp := getCleanString(row, 14)
		specialSkills := getCleanString(row, 15)
		localContact := getCleanString(row, 16)

		// Validate required fields
		if fullName == "" || nationalID == "" || mobile == "" || cityProvince == "" ||
			destinationCities == "" || bankIBAN == "" || bankName == "" {
			log.Printf("⚠️  Row %d: Missing required fields, skipping", rowNum)
			continue
		}

		// Find or create user
		user, err := findOrCreateUser(db, fullName, mobile)
		if err != nil {
			log.Printf("❌ Row %d: Failed to create user: %v", rowNum, err)
			continue
		}

		// Check if visitor exists
		var existing Visitor
		if err := db.Where("user_id = ?", user.ID).First(&existing).Error; err == nil {
			log.Printf("ℹ️  Row %d: Visitor exists for %s, skipping", rowNum, fullName)
			continue
		}

		// Normalize data
		if languageLevel == "" {
			languageLevel = "good"
		} else {
			languageLevel = normalizeLanguageLevel(languageLevel)
		}

		if birthDate == "" {
			birthDate = "1990-01-01"
		}

		if email == "" {
			email = user.Email
		}

		// Create visitor
		visitor := Visitor{
			UserID:                        user.ID,
			FullName:                      fullName,
			NationalID:                    nationalID,
			PassportNumber:                passportNumber,
			BirthDate:                     birthDate,
			Mobile:                        mobile,
			WhatsappNumber:                whatsappNumber,
			Email:                         email,
			ResidenceAddress:              residenceAddress,
			CityProvince:                  cityProvince,
			DestinationCities:             destinationCities,
			HasLocalContact:               localContact != "",
			LocalContactDetails:           localContact,
			BankAccountIBAN:               bankIBAN,
			BankName:                      bankName,
			AccountHolderName:             accountHolderName,
			HasMarketingExperience:        marketingExp != "",
			MarketingExperienceDesc:       marketingExp,
			LanguageLevel:                 languageLevel,
			SpecialSkills:                 specialSkills,
			AgreesToUseApprovedProducts:   true,
			AgreesToViolationConsequences: true,
			AgreesToSubmitReports:         true,
			DigitalSignature:              fullName,
			SignatureDate:                 time.Now().Format("2006-01-02"),
			Status:                        "pending",
		}

		if err := db.Create(&visitor).Error; err != nil {
			log.Printf("❌ Row %d: Failed to create visitor: %v", rowNum, err)
			continue
		}

		successCount++
		log.Printf("✅ Row %d: Created visitor %s (ID: %d)", rowNum, fullName, visitor.ID)
	}

	return successCount, nil
}

func findOrCreateUser(db *gorm.DB, fullName, mobile string) (*User, error) {
	// Try to find existing user by mobile
	var existing User
	if err := db.Where("phone = ?", mobile).First(&existing).Error; err == nil {
		return &existing, nil
	}

	// Generate email and password
	email := generateEmailFromName(fullName, mobile)
	password := generateSecurePassword()

	// Split name
	nameParts := strings.Fields(fullName)
	firstName := nameParts[0]
	lastName := ""
	if len(nameParts) > 1 {
		lastName = strings.Join(nameParts[1:], " ")
	}

	// Hash password
	hashedPassword, err := hashPassword(password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := User{
		FirstName: firstName,
		LastName:  lastName,
		Email:     email,
		Password:  hashedPassword,
		Phone:     mobile,
		IsActive:  true,
	}

	if err := db.Create(&user).Error; err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	log.Printf("👤 Created user: %s (email: %s, password: %s)", fullName, email, password)
	return &user, nil
}

func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func generateEmailFromName(fullName, mobile string) string {
	name := strings.ToLower(fullName)
	name = strings.ReplaceAll(name, " ", ".")

	// Transliterate Persian characters
	persianMap := map[string]string{
		"آ": "a", "ا": "a", "ب": "b", "پ": "p", "ت": "t", "ث": "s", "ج": "j", "چ": "ch",
		"ح": "h", "خ": "kh", "د": "d", "ذ": "z", "ر": "r", "ز": "z", "ژ": "zh", "س": "s",
		"ش": "sh", "ص": "s", "ض": "z", "ط": "t", "ظ": "z", "ع": "a", "غ": "gh", "ف": "f",
		"ق": "gh", "ک": "k", "گ": "g", "ل": "l", "م": "m", "ن": "n", "و": "v", "ه": "h", "ی": "y",
	}

	for persian, english := range persianMap {
		name = strings.ReplaceAll(name, persian, english)
	}

	// Clean up name
	cleanName := ""
	for _, char := range name {
		if (char >= 'a' && char <= 'z') || char == '.' {
			cleanName += string(char)
		}
	}

	// Use last 4 digits of mobile
	mobileDigits := "0000"
	if len(mobile) >= 4 {
		mobileDigits = mobile[len(mobile)-4:]
	}

	return fmt.Sprintf("%s.%s@aslmarket.local", cleanName, mobileDigits)
}

func generateSecurePassword() string {
	return fmt.Sprintf("ASL%d!", generateRandomNumber(100000, 999999))
}

func generateRandomNumber(min, max int) int {
	diff := max - min
	n, _ := rand.Int(rand.Reader, big.NewInt(int64(diff)))
	return min + int(n.Int64())
}

func getCleanString(row []string, index int) string {
	if index >= len(row) {
		return ""
	}
	return strings.TrimSpace(row[index])
}

func normalizeProductType(productType string) string {
	productType = strings.ToLower(strings.TrimSpace(productType))

	switch {
	case strings.Contains(productType, "غذا") || strings.Contains(productType, "خوراک") ||
		strings.Contains(productType, "food") || strings.Contains(productType, "غذایی"):
		return "food"
	case strings.Contains(productType, "گیاه") || strings.Contains(productType, "دارو") ||
		strings.Contains(productType, "herbal") || strings.Contains(productType, "طبیعی"):
		return "herbal"
	case strings.Contains(productType, "سلامت") || strings.Contains(productType, "health") ||
		strings.Contains(productType, "پزشکی"):
		return "health"
	case strings.Contains(productType, "صنایع دستی") || strings.Contains(productType, "handicraft") ||
		strings.Contains(productType, "هنری"):
		return "handicraft"
	case strings.Contains(productType, "صنعت") || strings.Contains(productType, "industrial") ||
		strings.Contains(productType, "فنی"):
		return "industrial"
	case strings.Contains(productType, "خانه") || strings.Contains(productType, "home") ||
		strings.Contains(productType, "منزل"):
		return "home"
	default:
		return "other"
	}
}

func normalizeLanguageLevel(level string) string {
	level = strings.ToLower(strings.TrimSpace(level))

	switch {
	case strings.Contains(level, "عالی") || strings.Contains(level, "ممتاز") ||
		strings.Contains(level, "excellent") || strings.Contains(level, "perfect"):
		return "excellent"
	case strings.Contains(level, "خوب") || strings.Contains(level, "good") ||
		strings.Contains(level, "مناسب"):
		return "good"
	case strings.Contains(level, "ضعیف") || strings.Contains(level, "weak") ||
		strings.Contains(level, "کم"):
		return "weak"
	case strings.Contains(level, "ندارم") || strings.Contains(level, "none") ||
		strings.Contains(level, "صفر") || strings.Contains(level, "نمی‌دانم"):
		return "none"
	default:
		return "good"
	}
}
