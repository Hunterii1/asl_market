package controllers

import (
	"asl-market-backend/utils"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// UploadSupplierImage uploads a supplier image
func UploadSupplierImage(c *gin.Context) {
	// Check if user is authenticated
	_, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	// Get file from request
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "لطفا یک تصویر انتخاب کنید"})
		return
	}

	// Upload image
	imagePath, err := utils.UploadImage(file, "suppliers")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Normalize path to ensure it's relative (no full URLs)
	imagePath = utils.NormalizeImagePath(imagePath)

	c.JSON(http.StatusOK, gin.H{
		"message":   "تصویر با موفقیت آپلود شد",
		"image_url": imagePath,
	})
}

// UploadChatImage uploads an image for matching chat messages
func UploadChatImage(c *gin.Context) {
	// Check if user is authenticated
	_, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	// Get file from request
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "لطفا یک تصویر انتخاب کنید"})
		return
	}

	// Upload image
	imagePath, err := utils.UploadImage(file, "chat")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Normalize path to ensure it's relative (no full URLs)
	imagePath = utils.NormalizeImagePath(imagePath)

	// Debug: Log the image path
	fmt.Printf("📸 Chat image uploaded: %s\n", imagePath)

	c.JSON(http.StatusOK, gin.H{
		"message":   "تصویر با موفقیت آپلود شد",
		"image_url": imagePath,
	})
}

// UploadProductImage uploads a product image
func UploadProductImage(c *gin.Context) {
	// Debug: Check what's in context
	userID, exists := c.Get("user_id")
	if !exists {
		// Debug: Log all context keys
		keys := c.Keys
		fmt.Printf("🔍 Upload Debug - Context keys: %+v\n", keys)
		fmt.Printf("🔍 Upload Debug - Headers: %+v\n", c.Request.Header)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	fmt.Printf("🔍 Upload Debug - User ID: %v\n", userID)

	// Get file from request
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "لطفا یک تصویر انتخاب کنید"})
		return
	}

	// Upload image
	imagePath, err := utils.UploadImage(file, "products")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Normalize path to ensure it's relative (no full URLs)
	imagePath = utils.NormalizeImagePath(imagePath)

	c.JSON(http.StatusOK, gin.H{
		"message":   "تصویر با موفقیت آپلود شد",
		"image_url": imagePath,
	})
}

// DeleteImage deletes an uploaded image
func DeleteImage(c *gin.Context) {
	// Check if user is authenticated
	_, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	// Get image path from request
	var req struct {
		ImagePath string `json:"image_path" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "مسیر تصویر الزامی است"})
		return
	}

	// Delete image
	if err := utils.DeleteImage(req.ImagePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف تصویر"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "تصویر با موفقیت حذف شد",
	})
}

// UploadMultipleProductImages uploads multiple product images
func UploadMultipleProductImages(c *gin.Context) {
	// Check if user is authenticated
	_, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	// Get files from request
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "خطا در دریافت فایل‌ها"})
		return
	}

	files := form.File["images"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "لطفا حداقل یک تصویر انتخاب کنید"})
		return
	}

	// Maximum 5 images
	if len(files) > 5 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "حداکثر 5 تصویر مجاز است"})
		return
	}

	var imagePaths []string
	for _, file := range files {
		imagePath, err := utils.UploadImage(file, "products")
		if err != nil {
			// Clean up already uploaded images
			for _, path := range imagePaths {
				utils.DeleteImage(path)
			}
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		// Normalize path to ensure it's relative (no full URLs)
		imagePath = utils.NormalizeImagePath(imagePath)
		imagePaths = append(imagePaths, imagePath)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "تصاویر با موفقیت آپلود شدند",
		"image_urls":  imagePaths,
		"images_json": strings.Join(imagePaths, ","),
	})
}
