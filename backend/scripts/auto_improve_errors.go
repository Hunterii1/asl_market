package main

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// این اسکریپت به صورت خودکار پیغام‌های خطا را در کنترلرها بهبود می‌دهد

func main5m() {
	controllersDir := "../controllers"

	// پیدا کردن تمام فایل‌های .go
	files, err := filepath.Glob(filepath.Join(controllersDir, "*.go"))
	if err != nil {
		fmt.Printf("Error finding files: %v\n", err)
		return
	}

	fmt.Printf("🔍 Found %d controller files\n", len(files))

	updatedCount := 0
	for _, file := range files {
		if processFile(file) {
			updatedCount++
		}
	}

	fmt.Printf("\n✨ Done! Updated %d files\n", updatedCount)
}

func processFile(filename string) bool {
	// خواندن فایل
	content, err := os.ReadFile(filename)
	if err != nil {
		fmt.Printf("Error reading %s: %v\n", filename, err)
		return false
	}

	originalContent := string(content)
	newContent := originalContent

	// بررسی اینکه آیا middleware import شده یا نه
	hasMiddlewareImport := strings.Contains(newContent, `"asl-market-backend/middleware"`)

	// اگر import نداره و نیاز به آپدیت داره، اضافه کن
	needsMiddleware := strings.Contains(newContent, "c.JSON(http.StatusInternalServerError") ||
		strings.Contains(newContent, "c.JSON(http.StatusBadRequest")

	if !hasMiddlewareImport && needsMiddleware {
		// اضافه کردن import
		importRegex := regexp.MustCompile(`(import \(\n(?:[^\)]*\n)*?)(\))`)
		newContent = importRegex.ReplaceAllString(newContent, `$1	"asl-market-backend/middleware"
$2`)
		fmt.Printf("✅ Added middleware import to %s\n", filepath.Base(filename))
	}

	// بهبود پیغام‌های خطای رایج
	improvements := map[string]string{
		`"error": "لطفا ابتدا وارد شوید"`:              `"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."`,
		`"error": "دسترسی غیرمجاز"`:                    `"error": "شما دسترسی لازم برای مشاهده این صفحه را ندارید."`,
		`"error": "اطلاعات ارسالی نامعتبر است"`:        `"error": "اطلاعات وارد شده صحیح نیست. لطفاً فرم را با دقت تکمیل کنید."`,
		`"error": "داده‌های ورودی نامعتبر"`:            `"error": "اطلاعات وارد شده صحیح نیست. لطفاً تمام فیلدهای الزامی را پر کنید."`,
		`"error": "داده‌های ورودی نامعتبر است"`:        `"error": "اطلاعات وارد شده صحیح نیست. لطفاً تمام فیلدهای الزامی را پر کنید."`,
		`"error": "شناسه نامعتبر است"`:                 `"error": "شناسه وارد شده معتبر نیست. لطفاً دوباره تلاش کنید."`,
		`"error": "شناسه درخواست نامعتبر است"`:         `"error": "شناسه درخواست معتبر نیست. لطفاً صفحه را رفرش کنید."`,
		`"error": "درخواست یافت نشد"`:                  `"error": "درخواست مورد نظر یافت نشد. ممکن است حذف شده باشد."`,
		`"error": "کاربر یافت نشد"`:                    `"error": "کاربر مورد نظر یافت نشد. لطفاً اطلاعات ورود خود را بررسی کنید."`,
		`"error": "User not authenticated"`:            `"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."`,
		`"error": "Admin access required"`:             `"error": "این بخش فقط برای مدیران سیستم قابل دسترسی است."`,
		`"error": "Forbidden"`:                         `"error": "شما دسترسی لازم برای انجام این عملیات را ندارید."`,
		`"error": "Invalid request data"`:              `"error": "اطلاعات وارد شده صحیح نیست. لطفاً فرم را با دقت تکمیل کنید."`,
		`"error": "Invalid product ID"`:                `"error": "شناسه محصول معتبر نیست. لطفاً دوباره تلاش کنید."`,
		`"error": "نام کاربری یا رمز عبور اشتباه است"`: `"error": "نام کاربری یا رمز عبور اشتباه است. لطفاً دوباره تلاش کنید یا از 'فراموشی رمز عبور' استفاده کنید."`,
		`"error": "خطا در دریافت لیست"`:                `"error": "مشکلی در بارگذاری اطلاعات پیش آمد. لطفاً صفحه را رفرش کنید."`,
		`"error": "خطا در دریافت درخواست"`:             `"error": "مشکلی در بارگذاری درخواست پیش آمد. لطفاً صفحه را رفرش کنید."`,
		`"error": "خطا در دریافت درخواست‌ها"`:          `"error": "مشکلی در بارگذاری درخواست‌ها پیش آمد. لطفاً صفحه را رفرش کنید."`,
		`"error": "خطا در تولید توکن"`:                 `"error": "مشکلی در ایجاد نشست کاربری پیش آمد. لطفاً دوباره تلاش کنید."`,
	}

	changed := false
	for old, new := range improvements {
		if strings.Contains(newContent, old) {
			newContent = strings.ReplaceAll(newContent, old, new)
			changed = true
		}
	}

	// اگر تغییری انجام شد، فایل را ذخیره کن
	if newContent != originalContent {
		// ایجاد backup
		backupFile := filename + ".backup"
		if err := os.WriteFile(backupFile, []byte(originalContent), 0644); err != nil {
			fmt.Printf("Error creating backup for %s: %v\n", filename, err)
			return false
		}

		// ذخیره فایل جدید
		if err := os.WriteFile(filename, []byte(newContent), 0644); err != nil {
			fmt.Printf("Error writing %s: %v\n", filename, err)
			return false
		}

		if changed {
			fmt.Printf("✅ Improved error messages in %s\n", filepath.Base(filename))
		}
		return true
	}

	return false
}
