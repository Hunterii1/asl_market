package main

import (
	"fmt"
	"log"

	"asl-market-backend/config"
	"asl-market-backend/models"
)

func main() {
	// Initialize config
	config.LoadConfig()

	// Initialize database
	models.ConnectDatabase()
	db := models.GetDB()

	log.Println("🔍 Checking for license issues...")

	// 1. Check for duplicate license codes
	fmt.Println("\n📊 Checking for duplicate license codes...")
	var duplicateCodes []struct {
		Code  string
		Count int
	}

	err := db.Model(&models.License{}).
		Select("code, COUNT(*) as count").
		Group("code").
		Having("COUNT(*) > 1").
		Find(&duplicateCodes).Error

	if err != nil {
		log.Fatalf("❌ Error checking duplicate codes: %v", err)
	}

	if len(duplicateCodes) > 0 {
		fmt.Printf("⚠️  Found %d duplicate license codes:\n", len(duplicateCodes))
		for _, dup := range duplicateCodes {
			fmt.Printf("  - Code: %s, Count: %d\n", dup.Code, dup.Count)
		}
	} else {
		fmt.Println("✅ No duplicate license codes found")
	}

	// 2. Check for users with multiple licenses
	fmt.Println("\n📊 Checking for users with multiple active licenses...")
	var usersWithMultipleLicenses []struct {
		UserID uint
		Count  int
	}

	err = db.Model(&models.License{}).
		Select("used_by as user_id, COUNT(*) as count").
		Where("is_used = ? AND used_by IS NOT NULL", true).
		Group("used_by").
		Having("COUNT(*) > 1").
		Find(&usersWithMultipleLicenses).Error

	if err != nil {
		log.Fatalf("❌ Error checking multiple licenses per user: %v", err)
	}

	if len(usersWithMultipleLicenses) > 0 {
		fmt.Printf("⚠️  Found %d users with multiple licenses:\n", len(usersWithMultipleLicenses))
		for _, user := range usersWithMultipleLicenses {
			fmt.Printf("  - User ID: %d, License Count: %d\n", user.UserID, user.Count)
		}
	} else {
		fmt.Println("✅ No users with multiple licenses found")
	}

	// 3. Check for licenses used but marked as unused
	fmt.Println("\n📊 Checking for inconsistent license states...")
	var inconsistentLicenses []models.License

	err = db.Where("(is_used = ? AND used_by IS NOT NULL) OR (is_used = ? AND used_by IS NULL)", false, true).
		Find(&inconsistentLicenses).Error

	if err != nil {
		log.Fatalf("❌ Error checking inconsistent licenses: %v", err)
	}

	if len(inconsistentLicenses) > 0 {
		fmt.Printf("⚠️  Found %d licenses with inconsistent states:\n", len(inconsistentLicenses))
		for _, license := range inconsistentLicenses {
			fmt.Printf("  - Code: %s, IsUsed: %t, UsedBy: %v\n",
				license.Code, license.IsUsed, license.UsedBy)
		}
	} else {
		fmt.Println("✅ No inconsistent license states found")
	}

	// 4. Check current license statistics
	fmt.Println("\n📊 License Statistics:")

	var totalLicenses int64
	db.Model(&models.License{}).Count(&totalLicenses)
	fmt.Printf("  - Total licenses: %d\n", totalLicenses)

	var usedLicenses int64
	db.Model(&models.License{}).Where("is_used = ?", true).Count(&usedLicenses)
	fmt.Printf("  - Used licenses: %d\n", usedLicenses)

	var unusedLicenses int64
	db.Model(&models.License{}).Where("is_used = ?", false).Count(&unusedLicenses)
	fmt.Printf("  - Unused licenses: %d\n", unusedLicenses)

	// 5. Check for users without any license that might have session issues
	fmt.Println("\n📊 Checking for potential session issues...")
	var totalUsers int64
	db.Model(&models.User{}).Count(&totalUsers)
	fmt.Printf("  - Total users: %d\n", totalUsers)

	var usersWithLicenses int64
	db.Model(&models.User{}).
		Joins("JOIN licenses ON users.id = licenses.used_by").
		Where("licenses.is_used = ?", true).
		Count(&usersWithLicenses)
	fmt.Printf("  - Users with licenses: %d\n", usersWithLicenses)

	usersWithoutLicenses := totalUsers - usersWithLicenses
	fmt.Printf("  - Users without licenses: %d\n", usersWithoutLicenses)

	// 6. Show recent license activities
	fmt.Println("\n📊 Recent license activities (last 10):")
	var recentLicenses []models.License
	err = db.Where("is_used = ?", true).
		Order("used_at DESC").
		Limit(10).
		Find(&recentLicenses).Error

	if err == nil && len(recentLicenses) > 0 {
		for _, license := range recentLicenses {
			fmt.Printf("  - Code: %s, User: %v, Used At: %v\n",
				license.Code, license.UsedBy, license.UsedAt)
		}
	}

	fmt.Println("\n✨ License check completed!")
}
