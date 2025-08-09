package main

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	log.Println("🔧 Fix Imported Records Status")
	log.Println("==============================")

	// Connect to database
	db, err := connectToDatabase()
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}

	// Update suppliers from pending to approved
	var supplierCount int64
	if err := db.Model(&Supplier{}).Where("status = ?", "pending").Update("status", "approved").Error; err != nil {
		log.Printf("❌ Error updating suppliers: %v", err)
	} else {
		db.Model(&Supplier{}).Where("status = ?", "approved").Count(&supplierCount)
		log.Printf("✅ Updated suppliers to approved status. Total approved suppliers: %d", supplierCount)
	}

	// Update visitors from pending to approved
	var visitorCount int64
	if err := db.Model(&Visitor{}).Where("status = ?", "pending").Update("status", "approved").Error; err != nil {
		log.Printf("❌ Error updating visitors: %v", err)
	} else {
		db.Model(&Visitor{}).Where("status = ?", "approved").Count(&visitorCount)
		log.Printf("✅ Updated visitors to approved status. Total approved visitors: %d", visitorCount)
	}

	log.Printf("🎉 Status fix completed! Now you have %d suppliers and %d visitors approved", supplierCount, visitorCount)
}

// User model matching backend
type User struct {
	ID        uint   `gorm:"primaryKey"`
	FirstName string `gorm:"size:100;not null"`
	LastName  string `gorm:"size:100;not null"`
	Email     string `gorm:"size:255;uniqueIndex;not null"`
	Password  string `gorm:"size:255;not null"`
	Phone     string `gorm:"size:20"`
	IsActive  bool   `gorm:"default:true"`
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
