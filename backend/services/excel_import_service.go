package services

import (
	"fmt"
	"strings"
	"time"

	"asl-market-backend/models"
	"asl-market-backend/utils"

	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

type ExcelImportService struct {
	db *gorm.DB
}

type ImportResult struct {
	TotalRows    int      `json:"total_rows"`
	SuccessCount int      `json:"success_count"`
	ErrorCount   int      `json:"error_count"`
	Errors       []string `json:"errors"`
	SuccessItems []string `json:"success_items"`
}

func NewExcelImportService(db *gorm.DB) *ExcelImportService {
	return &ExcelImportService{db: db}
}

// GenerateSupplierTemplate creates an Excel template for supplier import
func (s *ExcelImportService) GenerateSupplierTemplate() (*excelize.File, error) {
	f := excelize.NewFile()

	// Create main sheet
	sheetName := "Suppliers"
	f.SetSheetName("Sheet1", sheetName)

	// Headers
	headers := []string{
		"نام و نام خانوادگی",
		"شماره موبایل",
		"نام برند",
		"شهر",
		"آدرس",
		"دارای کسب و کار ثبت شده؟ (بله/خیر)",
		"شماره ثبت کسب و کار",
		"سابقه صادرات؟ (بله/خیر)",
		"قیمت صادراتی",
		"حداقل قیمت عمده فروشی",
		"قیمت عمده فروشی حجم بالا",
		"قابلیت تولید برند خصوصی؟ (بله/خیر)",
		"نام محصول ۱",
		"نوع محصول ۱",
		"توضیحات محصول ۱",
		"نیاز به مجوز صادراتی؟ ۱ (بله/خیر)",
		"نوع مجوز مورد نیاز ۱",
		"حداقل تولید ماهانه ۱",
		"نام محصول ۲",
		"نوع محصول ۲",
		"توضیحات محصول ۲",
		"نیاز به مجوز صادراتی؟ ۲ (بله/خیر)",
		"نوع مجوز مورد نیاز ۲",
		"حداقل تولید ماهانه ۲",
	}

	// Set headers
	for i, header := range headers {
		cell := fmt.Sprintf("%s1", string(rune('A'+i)))
		f.SetCellValue(sheetName, cell, header)
	}

	// Add sample data
	sampleData := []interface{}{
		"احمد محمدی",
		"09123456789",
		"برند نمونه",
		"تهران",
		"خیابان ولیعصر، پلاک ۱۲۳",
		"بله",
		"123456789",
		"بله",
		"$10",
		"50000",
		"45000",
		"بله",
		"محصول نمونه",
		"غذایی",
		"توضیحات محصول",
		"خیر",
		"",
		"1000",
		"",
		"",
		"",
		"",
		"",
		"",
	}

	for i, data := range sampleData {
		cell := fmt.Sprintf("%s2", string(rune('A'+i)))
		f.SetCellValue(sheetName, cell, data)
	}

	// Style headers
	style, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#E6F3FF"}, Pattern: 1},
	})

	for i := range headers {
		cell := fmt.Sprintf("%s1", string(rune('A'+i)))
		f.SetCellStyle(sheetName, cell, cell, style)
	}

	// Auto-fit columns
	for i := range headers {
		col := string(rune('A' + i))
		f.SetColWidth(sheetName, col, col, 20)
	}

	return f, nil
}

// GenerateVisitorTemplate creates an Excel template for visitor import
func (s *ExcelImportService) GenerateVisitorTemplate() (*excelize.File, error) {
	f := excelize.NewFile()

	// Create main sheet
	sheetName := "Visitors"
	f.SetSheetName("Sheet1", sheetName)

	// Headers
	headers := []string{
		"نام و نام خانوادگی",
		"کد ملی",
		"شماره پاسپورت",
		"تاریخ تولد (YYYY-MM-DD)",
		"شماره موبایل",
		"شماره واتساپ",
		"ایمیل",
		"آدرس محل سکونت",
		"شهر/استان",
		"شهرهای مقصد",
		"ارتباط محلی؟ (بله/خیر)",
		"جزئیات ارتباط محلی",
		"شماره حساب بین‌المللی (IBAN)",
		"نام بانک",
		"نام صاحب حساب",
		"سابقه بازاریابی؟ (بله/خیر)",
		"سطح زبان (excellent/good/weak/none)",
		"توضیحات سابقه بازاریابی",
		"مهارت‌های خاص",
	}

	// Set headers
	for i, header := range headers {
		cell := fmt.Sprintf("%s1", string(rune('A'+i)))
		f.SetCellValue(sheetName, cell, header)
	}

	// Add sample data
	sampleData := []interface{}{
		"فاطمه احمدی",
		"1234567890",
		"P123456789",
		"1985-03-15",
		"09123456789",
		"09123456789",
		"fateme@example.com",
		"تهران، خیابان انقلاب",
		"تهران",
		"دبی، ابوظبی",
		"بله",
		"دوست در دبی",
		"IR123456789012345678901234",
		"بانک ملی",
		"فاطمه احمدی",
		"بله",
		"good",
		"سابقه ۳ ساله فروش",
		"عکاسی، زبان انگلیسی",
	}

	for i, data := range sampleData {
		cell := fmt.Sprintf("%s2", string(rune('A'+i)))
		f.SetCellValue(sheetName, cell, data)
	}

	// Style headers
	style, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#F0F8E6"}, Pattern: 1},
	})

	for i := range headers {
		cell := fmt.Sprintf("%s1", string(rune('A'+i)))
		f.SetCellStyle(sheetName, cell, cell, style)
	}

	// Auto-fit columns
	for i := range headers {
		col := string(rune('A' + i))
		f.SetColWidth(sheetName, col, col, 20)
	}

	return f, nil
}

// ImportSuppliersFromExcel imports suppliers from Excel file
func (s *ExcelImportService) ImportSuppliersFromExcel(filePath string) (*ImportResult, error) {
	f, err := excelize.OpenFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open Excel file: %v", err)
	}
	defer f.Close()

	// Get the first sheet
	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, fmt.Errorf("no sheets found in Excel file")
	}

	sheetName := sheets[0]
	rows, err := f.GetRows(sheetName)
	if err != nil {
		return nil, fmt.Errorf("failed to read rows: %v", err)
	}

	if len(rows) < 2 {
		return nil, fmt.Errorf("file must contain at least header row and one data row")
	}

	result := &ImportResult{
		TotalRows:    len(rows) - 1, // Exclude header
		Errors:       []string{},
		SuccessItems: []string{},
	}

	// Process each row (skip header)
	for i, row := range rows[1:] {
		rowNum := i + 2 // Row number in Excel (1-indexed + header)

		if len(row) < 12 { // Minimum required columns
			result.Errors = append(result.Errors, fmt.Sprintf("ردیف %d: تعداد ستون‌های کافی نیست", rowNum))
			result.ErrorCount++
			continue
		}

		// Parse supplier data
		supplierReq, err := s.parseSupplierRow(row, rowNum)
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("ردیف %d: %v", rowNum, err))
			result.ErrorCount++
			continue
		}

		// Create user first
		userReq := models.RegisterRequest{
			FirstName: strings.Split(supplierReq.FullName, " ")[0],
			LastName:  strings.Join(strings.Split(supplierReq.FullName, " ")[1:], " "),
			Email:     fmt.Sprintf("supplier_%s@import.com", supplierReq.Mobile),
			Password:  "imported123", // Default password
		}

		if userReq.LastName == "" {
			userReq.LastName = "وارد نشده"
		}

		// Check if user with this email already exists
		var existingUser models.User
		if err := s.db.Where("email = ?", userReq.Email).First(&existingUser).Error; err == nil {
			// User exists, use this user
		} else {
			// Create new user
			hashedPassword, _ := utils.HashPassword(userReq.Password)
			existingUser = models.User{
				FirstName: userReq.FirstName,
				LastName:  userReq.LastName,
				Email:     userReq.Email,
				Password:  hashedPassword,
				Phone:     supplierReq.Mobile,
				IsActive:  true,
			}

			if err := s.db.Create(&existingUser).Error; err != nil {
				result.Errors = append(result.Errors, fmt.Sprintf("ردیف %d: خطا در ایجاد کاربر: %v", rowNum, err))
				result.ErrorCount++
				continue
			}
		}

		// Create supplier
		supplier, err := models.CreateSupplier(s.db, existingUser.ID, *supplierReq)
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("ردیف %d: خطا در ایجاد تأمین‌کننده: %v", rowNum, err))
			result.ErrorCount++
			continue
		}

		// Auto-approve imported suppliers
		s.db.Model(supplier).Update("status", "approved")

		result.SuccessCount++
		result.SuccessItems = append(result.SuccessItems, supplierReq.FullName)
	}

	return result, nil
}

// ImportVisitorsFromExcel imports visitors from Excel file
func (s *ExcelImportService) ImportVisitorsFromExcel(filePath string) (*ImportResult, error) {
	f, err := excelize.OpenFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open Excel file: %v", err)
	}
	defer f.Close()

	// Get the first sheet
	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, fmt.Errorf("no sheets found in Excel file")
	}

	sheetName := sheets[0]
	rows, err := f.GetRows(sheetName)
	if err != nil {
		return nil, fmt.Errorf("failed to read rows: %v", err)
	}

	if len(rows) < 2 {
		return nil, fmt.Errorf("file must contain at least header row and one data row")
	}

	result := &ImportResult{
		TotalRows:    len(rows) - 1, // Exclude header
		Errors:       []string{},
		SuccessItems: []string{},
	}

	// Process each row (skip header)
	for i, row := range rows[1:] {
		rowNum := i + 2 // Row number in Excel (1-indexed + header)

		if len(row) < 15 { // Minimum required columns
			result.Errors = append(result.Errors, fmt.Sprintf("ردیف %d: تعداد ستون‌های کافی نیست", rowNum))
			result.ErrorCount++
			continue
		}

		// Parse visitor data
		visitorReq, err := s.parseVisitorRow(row, rowNum)
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("ردیف %d: %v", rowNum, err))
			result.ErrorCount++
			continue
		}

		// Create user first
		userReq := models.RegisterRequest{
			FirstName: strings.Split(visitorReq.FullName, " ")[0],
			LastName:  strings.Join(strings.Split(visitorReq.FullName, " ")[1:], " "),
			Email:     fmt.Sprintf("visitor_%s@import.com", visitorReq.Mobile),
			Password:  "imported123", // Default password
		}

		if userReq.LastName == "" {
			userReq.LastName = "وارد نشده"
		}

		// Check if user with this email already exists
		var existingUser models.User
		if err := s.db.Where("email = ?", userReq.Email).First(&existingUser).Error; err == nil {
			// User exists, use this user
		} else {
			// Create new user
			hashedPassword, _ := utils.HashPassword(userReq.Password)
			existingUser = models.User{
				FirstName: userReq.FirstName,
				LastName:  userReq.LastName,
				Email:     userReq.Email,
				Password:  hashedPassword,
				Phone:     visitorReq.Mobile,
				IsActive:  true,
			}

			if err := s.db.Create(&existingUser).Error; err != nil {
				result.Errors = append(result.Errors, fmt.Sprintf("ردیف %d: خطا در ایجاد کاربر: %v", rowNum, err))
				result.ErrorCount++
				continue
			}
		}

		// Create visitor
		visitor, err := models.CreateVisitor(s.db, existingUser.ID, *visitorReq)
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("ردیف %d: خطا در ایجاد ویزیتور: %v", rowNum, err))
			result.ErrorCount++
			continue
		}

		// Auto-approve imported visitors
		s.db.Model(visitor).Update("status", "approved")

		result.SuccessCount++
		result.SuccessItems = append(result.SuccessItems, visitorReq.FullName)
	}

	return result, nil
}

func (s *ExcelImportService) parseSupplierRow(row []string, rowNum int) (*models.SupplierRegistrationRequest, error) {
	// Helper function to safely get column value
	getCol := func(index int) string {
		if index < len(row) {
			return strings.TrimSpace(row[index])
		}
		return ""
	}

	parseBool := func(value string) bool {
		value = strings.ToLower(strings.TrimSpace(value))
		return value == "بله" || value == "yes" || value == "true" || value == "1"
	}

	req := &models.SupplierRegistrationRequest{
		FullName:                 getCol(0),
		Mobile:                   getCol(1),
		BrandName:                getCol(2),
		City:                     getCol(3),
		Address:                  getCol(4),
		HasRegisteredBusiness:    parseBool(getCol(5)),
		BusinessRegistrationNum:  getCol(6),
		HasExportExperience:      parseBool(getCol(7)),
		ExportPrice:              getCol(8),
		WholesaleMinPrice:        getCol(9),
		WholesaleHighVolumePrice: getCol(10),
		CanProducePrivateLabel:   parseBool(getCol(11)),
	}

	// Validation
	if req.FullName == "" {
		return nil, fmt.Errorf("نام و نام خانوادگی الزامی است")
	}
	if req.Mobile == "" {
		return nil, fmt.Errorf("شماره موبایل الزامی است")
	}
	if req.City == "" {
		return nil, fmt.Errorf("شهر الزامی است")
	}
	if req.WholesaleMinPrice == "" {
		return nil, fmt.Errorf("حداقل قیمت عمده فروشی الزامی است")
	}

	// Parse products (up to 2 products in template)
	for i := 0; i < 2; i++ {
		nameIndex := 12 + (i * 6)
		if nameIndex < len(row) && getCol(nameIndex) != "" {
			product := models.SupplierProductRequest{
				ProductName:          getCol(nameIndex),
				ProductType:          getCol(nameIndex + 1),
				Description:          getCol(nameIndex + 2),
				NeedsExportLicense:   parseBool(getCol(nameIndex + 3)),
				RequiredLicenseType:  getCol(nameIndex + 4),
				MonthlyProductionMin: getCol(nameIndex + 5),
			}
			req.Products = append(req.Products, product)
		}
	}

	if len(req.Products) == 0 {
		return nil, fmt.Errorf("حداقل یک محصول الزامی است")
	}

	return req, nil
}

func (s *ExcelImportService) parseVisitorRow(row []string, rowNum int) (*models.VisitorRegistrationRequest, error) {
	// Helper function to safely get column value
	getCol := func(index int) string {
		if index < len(row) {
			return strings.TrimSpace(row[index])
		}
		return ""
	}

	parseBool := func(value string) bool {
		value = strings.ToLower(strings.TrimSpace(value))
		return value == "بله" || value == "yes" || value == "true" || value == "1"
	}

	req := &models.VisitorRegistrationRequest{
		FullName:                      getCol(0),
		NationalID:                    getCol(1),
		PassportNumber:                getCol(2),
		BirthDate:                     getCol(3),
		Mobile:                        getCol(4),
		WhatsappNumber:                getCol(5),
		Email:                         getCol(6),
		ResidenceAddress:              getCol(7),
		CityProvince:                  getCol(8),
		DestinationCities:             getCol(9),
		HasLocalContact:               parseBool(getCol(10)),
		LocalContactDetails:           getCol(11),
		BankAccountIBAN:               getCol(12),
		BankName:                      getCol(13),
		AccountHolderName:             getCol(14),
		HasMarketingExperience:        parseBool(getCol(15)),
		LanguageLevel:                 getCol(16),
		MarketingExperienceDesc:       getCol(17),
		SpecialSkills:                 getCol(18),
		AgreesToUseApprovedProducts:   true, // Default to true for imports
		AgreesToViolationConsequences: true,
		AgreesToSubmitReports:         true,
		DigitalSignature:              "IMPORTED",
	}

	// Parse birth date
	if req.BirthDate != "" {
		if _, err := time.Parse("2006-01-02", req.BirthDate); err != nil {
			return nil, fmt.Errorf("فرمت تاریخ تولد نامعتبر (باید YYYY-MM-DD باشد)")
		}
	}

	// Validation
	if req.FullName == "" {
		return nil, fmt.Errorf("نام و نام خانوادگی الزامی است")
	}
	if req.Mobile == "" {
		return nil, fmt.Errorf("شماره موبایل الزامی است")
	}
	if req.Email == "" {
		return nil, fmt.Errorf("ایمیل الزامی است")
	}
	if req.CityProvince == "" {
		return nil, fmt.Errorf("شهر/استان الزامی است")
	}

	return req, nil
}
