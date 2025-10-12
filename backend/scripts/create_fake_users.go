package main

import (
	"fmt"
	"log"
	"math/rand"
	"strings"
	"time"

	"asl-market-backend/models"
	"asl-market-backend/utils"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	fmt.Println("🚀 Creating fake users for video recording...")

	// Database connection
	dsn := "asl_user:asl_password_2024@tcp(localhost:3306)/asl_market?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Create users
	users := []struct {
		FirstName string
		LastName  string
		Phone     string
		Email     string
		Password  string
		Gender    string
	}{
		{
			FirstName: "سارا",
			LastName:  "احمدی",
			Phone:     "09123456789",
			Email:     "sara@example.com",
			Password:  "123456",
			Gender:    "خانم",
		},
		{
			FirstName: "علی",
			LastName:  "محمدی",
			Phone:     "09123456790",
			Email:     "ali@example.com",
			Password:  "123456",
			Gender:    "آقا",
		},
	}

	for i, userData := range users {
		fmt.Printf("\n👤 Creating user %d: %s %s (%s)\n", i+1, userData.FirstName, userData.LastName, userData.Gender)

		// Hash password
		hashedPassword, err := utils.HashPassword(userData.Password)
		if err != nil {
			log.Printf("Error hashing password for %s: %v", userData.FirstName, err)
			continue
		}

		// Create user
		user := models.User{
			FirstName: userData.FirstName,
			LastName:  userData.LastName,
			Email:     userData.Email,
			Password:  hashedPassword,
			Phone:     userData.Phone,
			IsActive:  true,
			IsAdmin:   false,
		}

		if err := db.Create(&user).Error; err != nil {
			log.Printf("Error creating user %s: %v", userData.FirstName, err)
			continue
		}

		fmt.Printf("✅ User created with ID: %d\n", user.ID)

		// Create active license
		licenseCode, err := models.GenerateLicenseCode()
		if err != nil {
			log.Printf("Error generating license code: %v", err)
			continue
		}

		now := time.Now()
		expiresAt := now.AddDate(0, 12, 0) // 12 months from now

		license := models.License{
			Code:        licenseCode,
			Type:        "plus",
			Duration:    12,
			IsUsed:      true,
			UsedBy:      &user.ID,
			UsedAt:      &now,
			ExpiresAt:   &expiresAt,
			GeneratedBy: 1, // Assuming admin user ID is 1
		}

		if err := db.Create(&license).Error; err != nil {
			log.Printf("Error creating license for %s: %v", userData.FirstName, err)
			continue
		}

		fmt.Printf("✅ License created: %s\n", licenseCode)

		// Create 50 withdrawal requests for chart data
		fmt.Printf("📊 Creating 50 withdrawal data points...\n")
		totalAmount := 0.0

		for j := 0; j < 50; j++ {
			// Generate random amounts between $1 and $15
			amount := float64(rand.Intn(1400)+100) / 100.0 // $1.00 to $15.00

			// Generate random statuses with weighted distribution
			// Chart only shows: completed, approved, processing
			var status models.WithdrawalStatus
			statusRand := rand.Intn(100)
			switch {
			case statusRand < 70: // 70% completed (most visible on chart)
				status = models.WithdrawalStatusCompleted
			case statusRand < 85: // 15% approved
				status = models.WithdrawalStatusApproved
			case statusRand < 95: // 10% processing
				status = models.WithdrawalStatusProcessing
			case statusRand < 98: // 3% pending
				status = models.WithdrawalStatusPending
			default: // 2% rejected
				status = models.WithdrawalStatusRejected
			}

			// Generate random date within last 30 days (for chart visibility)
			daysAgo := rand.Intn(30) // 0 to 30 days ago
			requestedAt := now.AddDate(0, 0, -daysAgo)

			withdrawal := models.WithdrawalRequest{
				UserID:         user.ID,
				Amount:         amount,
				Currency:       "USD",
				SourceCountry:  "ایران",
				BankCardNumber: fmt.Sprintf("**** **** **** %04d", 1000+j),
				CardHolderName: fmt.Sprintf("%s %s", userData.FirstName, userData.LastName),
				ShebaNumber:    generateShebaNumber(),
				BankName:       "بانک ملی",
				Status:         status,
				RequestedAt:    requestedAt,
			}

			// Set completion date for completed withdrawals
			if status == models.WithdrawalStatusCompleted {
				completedAt := requestedAt.AddDate(0, 0, rand.Intn(3)+1) // 1-3 days later
				withdrawal.CompletedAt = &completedAt
			}

			// Set approval date for approved withdrawals
			if status == models.WithdrawalStatusApproved {
				approvedAt := requestedAt.AddDate(0, 0, rand.Intn(2)+1) // 1-2 days later
				withdrawal.ApprovedAt = &approvedAt
			}

			if err := db.Create(&withdrawal).Error; err != nil {
				log.Printf("Error creating withdrawal %d for %s: %v", j+1, userData.FirstName, err)
				continue
			}

			totalAmount += amount
		}

		fmt.Printf("✅ Created 50 withdrawal requests, total amount: $%.2f\n", totalAmount)

		// Create user progress with high completion
		progress := models.UserProgress{
			UserID:              user.ID,
			OverallProgress:     85, // High progress for demo
			CompletedTutorial:   true,
			ViewedSuppliers:     true,
			ViewedVisitors:      true,
			UsedAI:              true,
			ViewedProducts:      true,
			SubmittedWithdrawal: true,
			ViewedAvailable:     true,
			UsedExpress:         true,
			CompletedLearning:   true,
		}

		if err := db.Create(&progress).Error; err != nil {
			log.Printf("Error creating progress for %s: %v", userData.FirstName, err)
		} else {
			fmt.Printf("✅ User progress created: 85%%\n")
		}

		// Print login credentials
		fmt.Printf("\n📋 Login Credentials for %s %s:\n", userData.FirstName, userData.LastName)
		fmt.Printf("   Phone: %s\n", userData.Phone)
		fmt.Printf("   Email: %s\n", userData.Email)
		fmt.Printf("   Password: %s\n", userData.Password)
		fmt.Printf("   License: %s\n", licenseCode)
		fmt.Printf("   Total Withdrawals: $%.2f\n", totalAmount)
		fmt.Printf("   Chart Data Points: 50\n")
		fmt.Println("   " + strings.Repeat("-", 50))
	}

	fmt.Println("\n🎉 Fake users created successfully!")
	fmt.Println("\n📝 Summary:")
	fmt.Println("   - 2 users created (1 female, 1 male)")
	fmt.Println("   - Both have active Plus licenses")
	fmt.Println("   - Both have 50 withdrawal data points")
	fmt.Println("   - Both have 85% progress")
	fmt.Println("   - Ready for video recording!")
}

// Helper function to generate random Sheba number
func generateShebaNumber() string {
	numbers := make([]int, 6)
	for i := range numbers {
		numbers[i] = rand.Intn(9000) + 1000 // 1000-9999
	}
	return fmt.Sprintf("IR%04d%04d%04d%04d%04d%04d",
		numbers[0], numbers[1], numbers[2], numbers[3], numbers[4], numbers[5])
}
