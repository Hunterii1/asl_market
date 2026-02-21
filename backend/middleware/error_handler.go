package middleware

import (
	"fmt"
	"log"
	"strings"

	"github.com/gin-gonic/gin"
)

// ErrorHandlerMiddleware improves error messages for better user experience
func ErrorHandlerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Process request
		c.Next()

		// Check if there's an error response
		if c.Writer.Status() >= 500 {
			// Get the response that was written
			if c.Keys != nil {
				if errorMsg, exists := c.Get("error"); exists {
					log.Printf("🔴 Server Error [%d]: %v", c.Writer.Status(), errorMsg)
				}
			}
		}
	}
}

// ImproveErrorMessage converts generic error messages to more specific ones
func ImproveErrorMessage(err error, context string) string {
	if err == nil {
		return "خطای نامشخص"
	}

	errMsg := err.Error()
	errLower := strings.ToLower(errMsg)

	// Database errors
	if strings.Contains(errLower, "duplicate") || strings.Contains(errLower, "unique constraint") {
		if strings.Contains(context, "email") {
			return "این ایمیل قبلاً ثبت شده است. لطفاً از ایمیل دیگری استفاده کنید."
		}
		if strings.Contains(context, "phone") || strings.Contains(context, "mobile") {
			return "این شماره موبایل قبلاً ثبت شده است. لطفاً از شماره دیگری استفاده کنید."
		}
		return "این اطلاعات قبلاً ثبت شده است. لطفاً اطلاعات دیگری وارد کنید."
	}

	// Foreign key errors
	if strings.Contains(errLower, "foreign key") || strings.Contains(errLower, "constraint") {
		return "اطلاعات وارد شده با سایر رکوردها سازگار نیست. لطفاً اطلاعات را بررسی کنید."
	}

	// Connection errors
	if strings.Contains(errLower, "connection") || strings.Contains(errLower, "timeout") {
		return "مشکل در اتصال به پایگاه داده. لطفاً چند لحظه دیگر مجدداً تلاش کنید."
	}

	// Validation errors
	if strings.Contains(errLower, "invalid") || strings.Contains(errLower, "validation") {
		return "اطلاعات وارد شده نامعتبر است. لطفاً فرم را با دقت تکمیل کنید."
	}

	// Not found errors
	if strings.Contains(errLower, "not found") || strings.Contains(errLower, "no rows") {
		if strings.Contains(context, "user") || strings.Contains(context, "کاربر") {
			return "کاربر مورد نظر یافت نشد."
		}
		return "اطلاعات مورد نظر یافت نشد."
	}

	// Permission errors
	if strings.Contains(errLower, "permission") || strings.Contains(errLower, "access denied") {
		return "شما دسترسی لازم برای انجام این عملیات را ندارید."
	}

	// File errors
	if strings.Contains(errLower, "file") {
		if strings.Contains(errLower, "size") || strings.Contains(errLower, "too large") {
			return "حجم فایل بیش از حد مجاز است. لطفاً فایل کوچکتری انتخاب کنید."
		}
		if strings.Contains(errLower, "format") || strings.Contains(errLower, "type") {
			return "فرمت فایل پشتیبانی نمی‌شود. لطفاً فایل دیگری انتخاب کنید."
		}
		return "مشکل در پردازش فایل. لطفاً فایل دیگری انتخاب کنید."
	}

	// Generic database errors
	if strings.Contains(errLower, "sql") || strings.Contains(errLower, "database") {
		return "مشکل در ذخیره‌سازی اطلاعات. لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید."
	}

	// If no specific match, return a user-friendly generic message
	return fmt.Sprintf("مشکلی در پردازش درخواست شما پیش آمد. لطفاً دوباره تلاش کنید. (کد خطا: %s)", context)
}

// ImproveGenericMessage improves common generic error messages
func ImproveGenericMessage(message string, context string) string {
	msgLower := strings.ToLower(message)
	
	// Map of generic messages to improved ones
	improvements := map[string]string{
		"لطفا ابتدا وارد شوید": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید.",
		"دسترسی غیرمجاز": "شما دسترسی لازم برای مشاهده این صفحه را ندارید. لطفاً با حساب کاربری مناسب وارد شوید.",
		"اطلاعات ارسالی نامعتبر است": "اطلاعات وارد شده صحیح نیست. لطفاً فرم را با دقت تکمیل کنید و دوباره تلاش کنید.",
		"invalid request data": "اطلاعات وارد شده صحیح نیست. لطفاً فرم را با دقت تکمیل کنید و دوباره تلاش کنید.",
		"داده‌های ورودی نامعتبر": "اطلاعات وارد شده صحیح نیست. لطفاً تمام فیلدهای الزامی را با دقت پر کنید.",
		"داده‌های ورودی نامعتبر است": "اطلاعات وارد شده صحیح نیست. لطفاً تمام فیلدهای الزامی را با دقت پر کنید.",
		"شناسه نامعتبر است": "شناسه وارد شده معتبر نیست. لطفاً دوباره تلاش کنید.",
		"شناسه درخواست نامعتبر است": "شناسه درخواست معتبر نیست. لطفاً صفحه را رفرش کنید و دوباره تلاش کنید.",
		"درخواست یافت نشد": "درخواست مورد نظر یافت نشد. ممکن است حذف شده یا دسترسی شما محدود شده باشد.",
		"کاربر یافت نشد": "کاربر مورد نظر یافت نشد. لطفاً اطلاعات ورود خود را بررسی کنید.",
		"user not authenticated": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید.",
		"admin access required": "این بخش فقط برای مدیران سیستم قابل دسترسی است.",
		"forbidden": "شما دسترسی لازم برای انجام این عملیات را ندارید.",
		"نام کاربری یا رمز عبور اشتباه است": "نام کاربری یا رمز عبور اشتباه است. لطفاً دوباره تلاش کنید یا از گزینه 'فراموشی رمز عبور' استفاده کنید.",
		"خطا در دریافت لیست": "مشکلی در بارگذاری اطلاعات پیش آمد. لطفاً صفحه را رفرش کنید و دوباره تلاش کنید.",
		"خطا در دریافت درخواست": "مشکلی در بارگذاری درخواست پیش آمد. لطفاً صفحه را رفرش کنید و دوباره تلاش کنید.",
		"خطا در دریافت درخواست‌ها": "مشکلی در بارگذاری درخواست‌ها پیش آمد. لطفاً صفحه را رفرش کنید و دوباره تلاش کنید.",
		"خطا در تولید توکن": "مشکلی در ایجاد نشست کاربری پیش آمد. لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.",
	}
	
	// Check for exact matches first
	for generic, improved := range improvements {
		if msgLower == strings.ToLower(generic) {
			return improved
		}
	}
	
	// Check for partial matches
	for generic, improved := range improvements {
		if strings.Contains(msgLower, strings.ToLower(generic)) {
			return improved
		}
	}
	
	// Context-specific improvements
	if strings.Contains(context, "visitor") || strings.Contains(context, "ویزیتور") {
		if strings.Contains(msgLower, "یافت نشد") || strings.Contains(msgLower, "not found") {
			return "ویزیتور مورد نظر یافت نشد. ممکن است حذف شده یا دسترسی شما محدود شده باشد."
		}
		if strings.Contains(msgLower, "نامعتبر") || strings.Contains(msgLower, "invalid") {
			return "شناسه ویزیتور معتبر نیست. لطفاً دوباره تلاش کنید."
		}
	}
	
	if strings.Contains(context, "supplier") || strings.Contains(context, "تأمین") {
		if strings.Contains(msgLower, "یافت نشد") || strings.Contains(msgLower, "not found") {
			return "تأمین‌کننده مورد نظر یافت نشد. ممکن است حذف شده یا دسترسی شما محدود شده باشد."
		}
		if strings.Contains(msgLower, "نامعتبر") || strings.Contains(msgLower, "invalid") {
			return "شناسه تأمین‌کننده معتبر نیست. لطفاً دوباره تلاش کنید."
		}
	}
	
	if strings.Contains(context, "project") || strings.Contains(context, "پروژه") {
		if strings.Contains(msgLower, "یافت نشد") || strings.Contains(msgLower, "not found") {
			return "پروژه مورد نظر یافت نشد. ممکن است حذف شده یا دسترسی شما محدود شده باشد."
		}
		if strings.Contains(msgLower, "نامعتبر") || strings.Contains(msgLower, "invalid") {
			return "شناسه پروژه معتبر نیست. لطفاً دوباره تلاش کنید."
		}
	}
	
	if strings.Contains(context, "affiliate") || strings.Contains(context, "افیلیت") {
		if strings.Contains(msgLower, "یافت نشد") || strings.Contains(msgLower, "not found") {
			return "افیلیت مورد نظر یافت نشد. ممکن است حذف شده یا غیرفعال باشد."
		}
	}
	
	// Return original if no improvement found
	return message
}

// RespondWithError sends a consistent error response with improved messages
func RespondWithError(c *gin.Context, statusCode int, genericMsg string, err error, context string) {
	// Log the actual error for debugging
	log.Printf("🔴 Error [%s]: %v (context: %s)", c.Request.URL.Path, err, context)

	// Improve the error message for the user
	userMessage := genericMsg
	if err != nil && statusCode >= 500 {
		userMessage = ImproveErrorMessage(err, context)
	} else if err != nil {
		// For 4xx errors, use the actual error message if it's user-friendly
		errMsg := err.Error()
		if !strings.Contains(strings.ToLower(errMsg), "sql") && 
		   !strings.Contains(strings.ToLower(errMsg), "database") &&
		   !strings.Contains(strings.ToLower(errMsg), "gorm") {
			userMessage = errMsg
		}
	}
	
	// Always try to improve generic messages
	userMessage = ImproveGenericMessage(userMessage, context)

	c.JSON(statusCode, gin.H{
		"error": userMessage,
	})
}

// RespondWithSimpleError sends error with message improvement (no err object needed)
func RespondWithSimpleError(c *gin.Context, statusCode int, message string, context string) {
	// Log for debugging
	log.Printf("🔴 Error [%s]: %s (context: %s)", c.Request.URL.Path, message, context)
	
	// Improve the message
	improvedMessage := ImproveGenericMessage(message, context)
	
	c.JSON(statusCode, gin.H{
		"error": improvedMessage,
	})
}
