package main

import (
	"fmt"
	"log"

	"asl-market-backend/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main77777() {
	fmt.Println("🧪 Testing withdrawal chart data...")

	// Database connection
	dsn := "asl_user:asl_password_2024@tcp(localhost:3306)/asl_market?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Find a user with withdrawals
	var user models.User
	if err := db.First(&user).Error; err != nil {
		log.Fatal("No users found:", err)
	}

	fmt.Printf("👤 Testing with user: %s %s (ID: %d)\n", user.FirstName, user.LastName, user.ID)

	// Get withdrawal stats
	stats, err := models.GetWithdrawalStats(db, &user.ID)
	if err != nil {
		log.Printf("Error getting stats: %v", err)
	} else {
		fmt.Printf("📊 Withdrawal Stats: %+v\n", stats)
	}

	// Get chart data
	chartData, err := models.GetWithdrawalChartData(db, user.ID)
	if err != nil {
		log.Printf("Error getting chart data: %v", err)
	} else {
		fmt.Printf("📈 Chart Data Points: %d\n", len(chartData))
		for i, point := range chartData {
			if i < 5 { // Show first 5 points
				fmt.Printf("   %d: %+v\n", i+1, point)
			}
		}
		if len(chartData) > 5 {
			fmt.Printf("   ... and %d more points\n", len(chartData)-5)
		}
	}

	// Get user progress
	progress, err := models.GetOrCreateUserProgress(db, user.ID)
	if err != nil {
		log.Printf("Error getting progress: %v", err)
	} else {
		fmt.Printf("📈 User Progress: %d%%\n", progress.OverallProgress)
		fmt.Printf("📋 Activities: %+v\n", progress.GetProgressBreakdown())
	}

	fmt.Println("\n✅ Test completed!")
}
