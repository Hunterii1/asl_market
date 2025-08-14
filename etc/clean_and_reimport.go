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

func main66() {
	log.Println("📋 ASL Market Excel Import Tool")
	log.Println("===============================")

	// Connect to database
	db, err := connectToDatabase()
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}

	// Get current directory (which is /etc)
	wd, _ := os.Getwd()
	log.Printf("📂 Looking for Excel files in: %s", wd)

	supplierFile := filepath.Join(wd, "ASL SUPPLIER.xlsx")
	visitorFile := filepath.Join(wd, "ASL MARKET VISITOR.xlsx")

	totalImported := 0

	// Step 1: Analyze and import suppliers
	if _, err := os.Stat(supplierFile); err == nil {
		log.Println("📋 Analyzing supplier Excel structure...")
		analyzeSupplierExcel(supplierFile)

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

	// Step 2: Analyze and import visitors
	if _, err := os.Stat(visitorFile); err == nil {
		log.Println("📋 Analyzing visitor Excel structure...")
		analyzeVisitorExcel(visitorFile)

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

func analyzeSupplierExcel(filePath string) {
	f, err := excelize.OpenFile(filePath)
	if err != nil {
		log.Printf("❌ Failed to open supplier file: %v", err)
		return
	}
	defer f.Close()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		log.Println("❌ No sheets found in supplier file")
		return
	}

	rows, err := f.GetRows(sheets[0])
	if err != nil {
		log.Printf("❌ Failed to read supplier rows: %v", err)
		return
	}

	if len(rows) == 0 {
		log.Println("❌ No rows found in supplier file")
		return
	}

	log.Println("📊 Supplier Excel Structure:")
	log.Println("==========================")
	log.Printf("Total rows: %d (including header)", len(rows))
	log.Println("Header row:")
	for i, col := range rows[0] {
		log.Printf("  Column %d: [%s]", i, col)
	}

	if len(rows) > 1 {
		log.Println("\nFirst data row sample:")
		for i, col := range rows[1] {
			if i < 15 { // Show first 15 columns
				log.Printf("  Column %d: [%s]", i, col)
			}
		}
		log.Println("\nColumn mapping will be:")
		log.Println("  Column 2 -> Full Name (نام و نام خانوادگی)")
		log.Println("  Column 3 -> Mobile (شماره تماس)")
		log.Println("  Column 4 -> Email (ایمیل)")
		log.Println("  Column 5 -> Product Name (نام محصول)")
		log.Println("  Column 6 -> Product Type (نوع محصول)")
		log.Println("  Column 7 -> City (شهر)")
		log.Println("  Column 8 -> Address (آدرس)")
		log.Println("  Column 9 -> Wholesale Price (قیمت عمده)")
	}
}

func analyzeVisitorExcel(filePath string) {
	f, err := excelize.OpenFile(filePath)
	if err != nil {
		log.Printf("❌ Failed to open visitor file: %v", err)
		return
	}
	defer f.Close()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		log.Println("❌ No sheets found in visitor file")
		return
	}

	rows, err := f.GetRows(sheets[0])
	if err != nil {
		log.Printf("❌ Failed to read visitor rows: %v", err)
		return
	}

	if len(rows) == 0 {
		log.Println("❌ No rows found in visitor file")
		return
	}

	log.Println("📊 Visitor Excel Structure:")
	log.Println("==========================")
	log.Printf("Total rows: %d (including header)", len(rows))
	log.Println("Header row:")
	for i, col := range rows[0] {
		log.Printf("  Column %d: [%s]", i, col)
	}

	if len(rows) > 1 {
		log.Println("\nFirst data row sample:")
		for i, col := range rows[1] {
			if i < 20 { // Show first 20 columns
				log.Printf("  Column %d: [%s]", i, col)
			}
		}
		log.Println("\nColumn mapping will be:")
		log.Println("  Column 2 -> Full Name (نام و نام خانوادگی)")
		log.Println("  Column 3 -> Mobile (شماره تماس)")
		log.Println("  Column 4 -> Email (ایمیل)")
		log.Println("  Column 5 -> National ID (کد ملی)")
		log.Println("  Column 6 -> Birth Date (تاریخ تولد)")
		log.Println("  Column 7 -> City/Province (شهر/استان)")
		log.Println("  Column 8 -> Address (آدرس سکونت)")
		log.Println("  Column 9 -> Destination Cities (شهرهای مقصد)")
		log.Println("  Column 10 -> Bank IBAN (شماره حساب)")
		log.Println("  Column 11 -> Bank Name (نام بانک)")
	}
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

	// Skip header row, start from row 1
	for i, row := range rows[1:] {
		rowNum := i + 2

		if len(row) < 10 {
			log.Printf("⚠️  Row %d: Insufficient columns (%d), skipping", rowNum, len(row))
			continue
		}

		// Map columns based on typical Google Forms/Porsline structure
		// You'll need to adjust these based on the actual Excel structure
		fullName := getCleanString(row, 2)          // نام و نام خانوادگی
		mobile := getCleanString(row, 3)            // شماره تماس
		email := getCleanString(row, 4)             // ایمیل
		productName := getCleanString(row, 5)       // نام محصول
		productType := getCleanString(row, 6)       // نوع محصول
		city := getCleanString(row, 7)              // شهر
		address := getCleanString(row, 8)           // آدرس
		wholesaleMinPrice := getCleanString(row, 9) // قیمت عمده

		// Optional fields
		businessRegNum := getCleanString(row, 11)    // شماره ثبت
		exportPrice := getCleanString(row, 12)       // قیمت صادرات
		monthlyProduction := getCleanString(row, 13) // تولید ماهانه

		log.Printf("📝 Row %d data:", rowNum)
		log.Printf("  Full Name: %s", fullName)
		log.Printf("  Mobile: %s", mobile)
		log.Printf("  Email: %s", email)
		log.Printf("  Product: %s", productName)

		// Validate required fields
		if fullName == "" || mobile == "" {
			log.Printf("⚠️  Row %d: Missing name or mobile, skipping", rowNum)
			continue
		}

		// Clean and validate mobile number
		mobile = cleanMobileNumber(mobile)
		if mobile == "" {
			log.Printf("⚠️  Row %d: Invalid mobile number, skipping", rowNum)
			continue
		}

		// Clean and validate email
		email = cleanEmail(email)
		if email == "" {
			email = generateEmailFromName(fullName, mobile)
		}

		// Set default values if missing
		if city == "" {
			city = "نامشخص"
		}
		if address == "" {
			address = "نامشخص"
		}
		if wholesaleMinPrice == "" {
			wholesaleMinPrice = "توافقی"
		}
		if productName == "" {
			productName = "محصول عمومی"
		}

		// Create user
		user, err := findOrCreateUser(db, fullName, mobile, email)
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

		// Create brand name: نام | نام محصول
		brandDisplayName := fullName
		if productName != "" && productName != "محصول عمومی" {
			brandDisplayName = fmt.Sprintf("%s | %s", fullName, productName)
		}

		// Create supplier
		supplier := Supplier{
			UserID:                   user.ID,
			FullName:                 fullName,
			Mobile:                   mobile,
			BrandName:                brandDisplayName,
			City:                     city,
			Address:                  address,
			HasRegisteredBusiness:    businessRegNum != "",
			BusinessRegistrationNum:  businessRegNum,
			HasExportExperience:      exportPrice != "",
			ExportPrice:              exportPrice,
			WholesaleMinPrice:        wholesaleMinPrice,
			WholesaleHighVolumePrice: "",
			CanProducePrivateLabel:   false,
			Status:                   "approved",
		}

		if err := db.Create(&supplier).Error; err != nil {
			log.Printf("❌ Row %d: Failed to create supplier: %v", rowNum, err)
			continue
		}

		// Create product
		product := SupplierProduct{
			SupplierID:           supplier.ID,
			ProductName:          productName,
			ProductType:          normalizeProductType(productType),
			Description:          fmt.Sprintf("محصول ارائه شده توسط %s", fullName),
			NeedsExportLicense:   false,
			MonthlyProductionMin: monthlyProduction,
		}

		if monthlyProduction == "" {
			product.MonthlyProductionMin = "نامشخص"
		}

		if err := db.Create(&product).Error; err != nil {
			log.Printf("⚠️  Row %d: Failed to create product: %v", rowNum, err)
		}

		successCount++
		log.Printf("✅ Row %d: Created supplier %s (ID: %d)", rowNum, brandDisplayName, supplier.ID)
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

	// Skip header row, start from row 1
	for i, row := range rows[1:] {
		rowNum := i + 2

		if len(row) < 12 {
			log.Printf("⚠️  Row %d: Insufficient columns (%d), skipping", rowNum, len(row))
			continue
		}

		// Map columns based on typical Google Forms/Porsline structure
		fullName := getCleanString(row, 2)          // نام و نام خانوادگی
		mobile := getCleanString(row, 3)            // شماره تماس
		email := getCleanString(row, 4)             // ایمیل
		nationalID := getCleanString(row, 5)        // کد ملی
		birthDate := getCleanString(row, 6)         // تاریخ تولد
		cityProvince := getCleanString(row, 7)      // شهر/استان
		residenceAddress := getCleanString(row, 8)  // آدرس سکونت
		destinationCities := getCleanString(row, 9) // شهرهای مقصد
		bankIBAN := getCleanString(row, 10)         // شماره حساب
		bankName := getCleanString(row, 11)         // نام بانک

		// Optional fields
		passportNumber := getCleanString(row, 12) // شماره پاسپورت
		whatsappNumber := getCleanString(row, 13) // واتساپ
		languageLevel := getCleanString(row, 14)  // سطح زبان
		marketingExp := getCleanString(row, 15)   // تجربه بازاریابی
		specialSkills := getCleanString(row, 16)  // مهارت‌ها

		log.Printf("📝 Row %d data:", rowNum)
		log.Printf("  Full Name: %s", fullName)
		log.Printf("  Mobile: %s", mobile)
		log.Printf("  Email: %s", email)
		log.Printf("  National ID: %s", nationalID)

		// Validate required fields
		if fullName == "" || mobile == "" {
			log.Printf("⚠️  Row %d: Missing name or mobile, skipping", rowNum)
			continue
		}

		// Clean and validate mobile number
		mobile = cleanMobileNumber(mobile)
		if mobile == "" {
			log.Printf("⚠️  Row %d: Invalid mobile number, skipping", rowNum)
			continue
		}

		// Clean and validate email
		email = cleanEmail(email)
		if email == "" {
			email = generateEmailFromName(fullName, mobile)
		}

		// Set default values if missing
		if nationalID == "" {
			nationalID = "0000000000"
		}
		if birthDate == "" {
			birthDate = "1990-01-01"
		}
		if cityProvince == "" {
			cityProvince = "نامشخص"
		}
		if residenceAddress == "" {
			residenceAddress = "نامشخص"
		}
		if destinationCities == "" {
			destinationCities = "نامشخص"
		}
		if bankIBAN == "" {
			bankIBAN = "IR000000000000000000000000"
		}
		if bankName == "" {
			bankName = "نامشخص"
		}

		// Create user
		user, err := findOrCreateUser(db, fullName, mobile, email)
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

		// Normalize language level
		if languageLevel == "" {
			languageLevel = "good"
		} else {
			languageLevel = normalizeLanguageLevel(languageLevel)
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
			HasLocalContact:               false,
			LocalContactDetails:           "",
			BankAccountIBAN:               bankIBAN,
			BankName:                      bankName,
			AccountHolderName:             fullName,
			HasMarketingExperience:        marketingExp != "",
			MarketingExperienceDesc:       marketingExp,
			LanguageLevel:                 languageLevel,
			SpecialSkills:                 specialSkills,
			AgreesToUseApprovedProducts:   true,
			AgreesToViolationConsequences: true,
			AgreesToSubmitReports:         true,
			DigitalSignature:              fullName,
			SignatureDate:                 time.Now().Format("2006-01-02"),
			Status:                        "approved",
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

func findOrCreateUser(db *gorm.DB, fullName, mobile, email string) (*User, error) {
	// Try to find existing user by mobile
	var existing User
	if err := db.Where("phone = ?", mobile).First(&existing).Error; err == nil {
		return &existing, nil
	}

	// Generate password
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

func cleanMobileNumber(mobile string) string {
	// Remove all non-digit characters
	cleaned := ""
	for _, char := range mobile {
		if char >= '0' && char <= '9' {
			cleaned += string(char)
		}
	}

	// Check if it's a valid Iranian mobile number
	if len(cleaned) == 11 && strings.HasPrefix(cleaned, "09") {
		return cleaned
	}
	if len(cleaned) == 10 && strings.HasPrefix(cleaned, "9") {
		return "0" + cleaned
	}

	// If not valid, return empty to skip
	return ""
}

func cleanEmail(email string) string {
	email = strings.TrimSpace(email)

	// Check if it contains invalid patterns
	if strings.Contains(email, "survey.porsline") ||
		strings.Contains(email, "reviewtoken") ||
		len(email) > 50 ||
		!strings.Contains(email, "@") {
		return ""
	}

	return email
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
