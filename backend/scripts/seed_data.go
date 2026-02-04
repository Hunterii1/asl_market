package main

import (
	"fmt"
	"log"

	"asl-market-backend/config"
	"asl-market-backend/models"

	"gorm.io/gorm"
)

func main24555() {
	// Load config
	config.LoadConfig()

	// Connect to database
	models.ConnectDatabase()
	db := models.GetDB()

	fmt.Println("🌱 Starting database seeding...")

	// Create a default admin user if not exists
	var adminUser models.User
	err := db.Where("email = ?", "admin@asllmarket.com").First(&adminUser).Error
	if err != nil {
		adminUser = models.User{
			FirstName: "Admin",
			LastName:  "ASL Market",
			Email:     "admin@asllmarket.com",
			Password:  "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
			Phone:     "09123456789",
			IsActive:  true,
		}
		if err := db.Create(&adminUser).Error; err != nil {
			log.Printf("Error creating admin user: %v", err)
		} else {
			fmt.Println("✅ Created admin user")
		}
	}

	// Seed Research Products
	seedResearchProducts(db, adminUser.ID)

	// Seed Suppliers (convert fake data to real)
	seedSuppliers(db)

	// Seed Visitors (convert fake data to real)
	seedVisitors(db)

	fmt.Println("🎉 Database seeding completed!")
}

func seedResearchProducts(db *gorm.DB, adminID uint) {
	fmt.Println("📦 Seeding research products...")

	products := []models.ResearchProductRequest{
		{
			Name:               "زعفران سرگل",
			Category:           "مواد غذایی",
			Description:        "محصول پرفروش با تقاضای بالا در کشورهای عربی",
			ExportValue:        "2,500,000 دلار",
			TargetCountry:      "امارات متحده عربی",
			IranPurchasePrice:  "2500",
			TargetCountryPrice: "4200",
			PriceCurrency:      "USD",
			MarketDemand:       "high",
			ProfitPotential:    "high",
			CompetitionLevel:   "medium",
			TargetCountries:    "امارات، عربستان، کویت، قطر",
			SeasonalFactors:    "همه فصل",
			Priority:           10,
		},
		{
			Name:               "خرما مجول",
			Category:           "مواد غذایی",
			Description:        "محصول محبوب در ماه رمضان و مناسبات مذهبی",
			ExportValue:        "1,800,000 دلار",
			TargetCountry:      "عربستان سعودی",
			IranPurchasePrice:  "800",
			TargetCountryPrice: "1400",
			PriceCurrency:      "USD",
			MarketDemand:       "high",
			ProfitPotential:    "medium",
			CompetitionLevel:   "high",
			TargetCountries:    "امارات، عربستان، بحرین",
			SeasonalFactors:    "رمضان و مناسبات مذهبی",
			Priority:           9,
		},
		{
			Name:               "پسته اکبری",
			Category:           "مواد غذایی",
			Description:        "کیفیت بالا و تقاضای مداوم در بازارهای عربی",
			ExportValue:        "3,200,000 دلار",
			TargetCountry:      "کویت",
			IranPurchasePrice:  "1200",
			TargetCountryPrice: "2100",
			PriceCurrency:      "USD",
			MarketDemand:       "high",
			ProfitPotential:    "high",
			CompetitionLevel:   "low",
			TargetCountries:    "امارات، عربستان، کویت، قطر، عمان",
			SeasonalFactors:    "همه فصل",
			Priority:           8,
		},
		{
			Name:               "فرش دستباف",
			Category:           "صنایع دستی",
			Description:        "فرش‌های سنتی ایرانی با کیفیت بالا",
			ExportValue:        "1,500,000 دلار",
			TargetCountry:      "قطر",
			IranPurchasePrice:  "500",
			TargetCountryPrice: "1200",
			PriceCurrency:      "USD",
			MarketDemand:       "medium",
			ProfitPotential:    "high",
			CompetitionLevel:   "low",
			TargetCountries:    "امارات، قطر، کویت",
			SeasonalFactors:    "همه فصل",
			Priority:           7,
		},
		{
			Name:               "چای احمد",
			Category:           "نوشیدنی",
			Description:        "چای سیاه درجه یک ایرانی",
			ExportValue:        "800,000 دلار",
			TargetCountry:      "عراق",
			IranPurchasePrice:  "15",
			TargetCountryPrice: "28",
			PriceCurrency:      "USD",
			MarketDemand:       "medium",
			ProfitPotential:    "medium",
			CompetitionLevel:   "medium",
			TargetCountries:    "عراق، افغانستان، تاجیکستان",
			SeasonalFactors:    "همه فصل",
			Priority:           6,
		},
		{
			Name:               "صنایع دستی سفالی",
			Category:           "صنایع دستی",
			Description:        "ظروف سفالی تزیینی و کاربردی",
			ExportValue:        "600,000 دلار",
			TargetCountry:      "امارات متحده عربی",
			IranPurchasePrice:  "50",
			TargetCountryPrice: "120",
			PriceCurrency:      "USD",
			MarketDemand:       "low",
			ProfitPotential:    "medium",
			CompetitionLevel:   "low",
			TargetCountries:    "امارات، قطر",
			SeasonalFactors:    "همه فصل",
			Priority:           5,
		},
	}

	for _, productReq := range products {
		var existing models.ResearchProduct
		err := db.Where("name = ?", productReq.Name).First(&existing).Error
		if err != nil {
			_, err := models.CreateResearchProduct(productReq, adminID)
			if err != nil {
				log.Printf("Error creating research product %s: %v", productReq.Name, err)
			} else {
				fmt.Printf("✅ Created research product: %s\n", productReq.Name)
			}
		}
	}
}

func seedSuppliers(db *gorm.DB) {
	fmt.Println("🏪 Seeding suppliers...")

	// First create users for suppliers
	supplierUsers := []models.User{
		{
			FirstName: "احمد",
			LastName:  "محمدی",
			Email:     "ahmad.mohammadi@example.com",
			Password:  "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
			Phone:     "09123456789",
			IsActive:  true,
		},
		{
			FirstName: "فاطمه",
			LastName:  "احمدی",
			Email:     "fateme.ahmadi@example.com",
			Password:  "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
			Phone:     "09187654321",
			IsActive:  true,
		},
		{
			FirstName: "محمد",
			LastName:  "رضایی",
			Email:     "mohammad.rezaei@example.com",
			Password:  "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
			Phone:     "09156789012",
			IsActive:  true,
		},
	}

	suppliers := []models.SupplierRegistrationRequest{
		{
			FullName:                 "احمد محمدی",
			Mobile:                   "09123456789",
			BrandName:                "شرکت زعفران طلایی",
			City:                     "مشهد",
			Address:                  "مشهد، خیابان امام رضا، پلاک 123",
			HasRegisteredBusiness:    true,
			BusinessRegistrationNum:  "12345-67890",
			HasExportExperience:      true,
			ExportPrice:              "50-100 دلار/کیلو",
			WholesaleMinPrice:        "45 دلار/کیلو",
			WholesaleHighVolumePrice: "40 دلار/کیلو",
			CanProducePrivateLabel:   true,
			Products: []models.SupplierProductRequest{
				{
					ProductName:          "زعفران سرگل",
					ProductType:          "زعفران",
					Description:          "زعفران درجه یک با کیفیت صادراتی",
					NeedsExportLicense:   false,
					MonthlyProductionMin: "100 کیلوگرم",
				},
			},
		},
		{
			FullName:                 "فاطمه احمدی",
			Mobile:                   "09187654321",
			BrandName:                "باغات خرمای جنوب",
			City:                     "اهواز",
			Address:                  "اهواز، خیابان کریمخان، پلاک 456",
			HasRegisteredBusiness:    true,
			BusinessRegistrationNum:  "23456-78901",
			HasExportExperience:      true,
			ExportPrice:              "8-15 دلار/کیلو",
			WholesaleMinPrice:        "6 دلار/کیلو",
			WholesaleHighVolumePrice: "5 دلار/کیلو",
			CanProducePrivateLabel:   false,
			Products: []models.SupplierProductRequest{
				{
					ProductName:          "خرما مجول",
					ProductType:          "خرما",
					Description:          "خرما درجه یک با کیفیت صادراتی",
					NeedsExportLicense:   false,
					MonthlyProductionMin: "500 کیلوگرم",
				},
			},
		},
		{
			FullName:                 "محمد رضایی",
			Mobile:                   "09156789012",
			BrandName:                "فرش‌های اصیل کاشان",
			City:                     "کاشان",
			Address:                  "کاشان، بازار سنتی، پلاک 789",
			HasRegisteredBusiness:    true,
			BusinessRegistrationNum:  "34567-89012",
			HasExportExperience:      true,
			ExportPrice:              "200-500 دلار/متر",
			WholesaleMinPrice:        "150 دلار/متر",
			WholesaleHighVolumePrice: "120 دلار/متر",
			CanProducePrivateLabel:   true,
			Products: []models.SupplierProductRequest{
				{
					ProductName:          "فرش دستباف",
					ProductType:          "صنایع دستی",
					Description:          "فرش دستباف اصیل کاشان",
					NeedsExportLicense:   false,
					MonthlyProductionMin: "50 متر مربع",
				},
			},
		},
	}

	for i, userReq := range supplierUsers {
		var existingUser models.User
		err := db.Where("email = ?", userReq.Email).First(&existingUser).Error
		if err != nil {
			if err := db.Create(&userReq).Error; err != nil {
				log.Printf("Error creating user %s: %v", userReq.Email, err)
				continue
			}
			existingUser = userReq
		}

		// Check if supplier already exists
		var existingSupplier models.Supplier
		err = db.Where("user_id = ?", existingUser.ID).First(&existingSupplier).Error
		if err != nil {
			supplier, err := models.CreateSupplier(db, existingUser.ID, suppliers[i])
			if err != nil {
				log.Printf("Error creating supplier %s: %v", suppliers[i].BrandName, err)
			} else {
				// Approve the supplier
				db.Model(supplier).Update("status", "approved")
				fmt.Printf("✅ Created and approved supplier: %s\n", suppliers[i].BrandName)
			}
		}
	}
}

func seedVisitors(db *gorm.DB) {
	fmt.Println("🚶‍♂️ Seeding visitors...")

	// First create users for visitors
	visitorUsers := []models.User{
		{
			FirstName: "احمد",
			LastName:  "محمدی",
			Email:     "ahmad.visitor@example.com",
			Password:  "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
			Phone:     "+971501234567",
			IsActive:  true,
		},
		{
			FirstName: "فاطمه",
			LastName:  "احمدی",
			Email:     "fateme.visitor@example.com",
			Password:  "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
			Phone:     "+966501234567",
			IsActive:  true,
		},
		{
			FirstName: "علی",
			LastName:  "رضایی",
			Email:     "ali.visitor@example.com",
			Password:  "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
			Phone:     "+965501234567",
			IsActive:  true,
		},
	}

	visitors := []models.VisitorRegistrationRequest{
		{
			FullName:                      "احمد محمدی",
			NationalID:                    "1234567890",
			PassportNumber:                "A12345678",
			BirthDate:                     "1990/05/15",
			Mobile:                        "+971501234567",
			WhatsappNumber:                "+971501234567",
			ResidenceAddress:              "دبی، منطقه دیره، خیابان الصباح",
			CityProvince:                  "دبی، امارات متحده عربی",
			DestinationCities:             "دبی، ابوظبی، شارجه",
			HasLocalContact:               true,
			LocalContactDetails:           "محمد علی زاده - +971502345678",
			BankAccountIBAN:               "AE123456789012345678901234",
			BankName:                      "Emirates NBD",
			AccountHolderName:             "Ahmad Mohammadi",
			HasMarketingExperience:        true,
			MarketingExperienceDesc:       "5 سال تجربه در بازاریابی محصولات ایرانی",
			LanguageLevel:                 "excellent",
			SpecialSkills:                 "ارتباطات، شبکه سازی، مذاکره",
			AgreesToUseApprovedProducts:   true,
			AgreesToViolationConsequences: true,
			AgreesToSubmitReports:         true,
			DigitalSignature:              "احمد محمدی",
			SignatureDate:                 "1403/05/15",
		},
		{
			FullName:                      "فاطمه احمدی",
			NationalID:                    "2345678901",
			PassportNumber:                "B23456789",
			BirthDate:                     "1992/08/22",
			Mobile:                        "+966501234567",
			WhatsappNumber:                "+966501234567",
			ResidenceAddress:              "ریاض، حی الملز، شارع الملک فهد",
			CityProvince:                  "ریاض، عربستان سعودی",
			DestinationCities:             "ریاض، جده، دمام",
			HasLocalContact:               false,
			LocalContactDetails:           "",
			BankAccountIBAN:               "SA123456789012345678901234",
			BankName:                      "Al Rajhi Bank",
			AccountHolderName:             "Fateme Ahmadi",
			HasMarketingExperience:        true,
			MarketingExperienceDesc:       "3 سال تجربه در فروش محصولات کشاورزی",
			LanguageLevel:                 "good",
			SpecialSkills:                 "فروش، روابط عمومی، زبان عربی",
			AgreesToUseApprovedProducts:   true,
			AgreesToViolationConsequences: true,
			AgreesToSubmitReports:         true,
			DigitalSignature:              "فاطمه احمدی",
			SignatureDate:                 "1403/05/15",
		},
		{
			FullName:                      "علی رضایی",
			NationalID:                    "3456789012",
			PassportNumber:                "C34567890",
			BirthDate:                     "1988/12/10",
			Mobile:                        "+965501234567",
			WhatsappNumber:                "+965501234567",
			ResidenceAddress:              "کویت سیتی، منطقه السالمیه",
			CityProvince:                  "کویت سیتی، کویت",
			DestinationCities:             "کویت سیتی، الاحمدی، حولی",
			HasLocalContact:               true,
			LocalContactDetails:           "حسین کریمی - +965502345678",
			BankAccountIBAN:               "KW123456789012345678901234",
			BankName:                      "National Bank of Kuwait",
			AccountHolderName:             "Ali Rezaei",
			HasMarketingExperience:        true,
			MarketingExperienceDesc:       "7 سال تجربه در واردات و توزیع محصولات غذایی",
			LanguageLevel:                 "excellent",
			SpecialSkills:                 "واردات، توزیع، مدیریت زنجیره تامین",
			AgreesToUseApprovedProducts:   true,
			AgreesToViolationConsequences: true,
			AgreesToSubmitReports:         true,
			DigitalSignature:              "علی رضایی",
			SignatureDate:                 "1403/05/15",
		},
	}

	for i, userReq := range visitorUsers {
		var existingUser models.User
		err := db.Where("email = ?", userReq.Email).First(&existingUser).Error
		if err != nil {
			if err := db.Create(&userReq).Error; err != nil {
				log.Printf("Error creating user %s: %v", userReq.Email, err)
				continue
			}
			existingUser = userReq
		}

		// Check if visitor already exists
		var existingVisitor models.Visitor
		err = db.Where("user_id = ?", existingUser.ID).First(&existingVisitor).Error
		if err != nil {
			visitor, err := models.CreateVisitor(db, existingUser.ID, visitors[i])
			if err != nil {
				log.Printf("Error creating visitor %s: %v", visitors[i].FullName, err)
			} else {
				// Approve the visitor
				db.Model(visitor).Update("status", "approved")
				fmt.Printf("✅ Created and approved visitor: %s\n", visitors[i].FullName)
			}
		}
	}
}
