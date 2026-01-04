package utils

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

// AllowedImageTypes defines allowed image MIME types
var AllowedImageTypes = map[string]bool{
	"image/jpeg": true,
	"image/jpg":  true,
	"image/png":  true,
	"image/webp": true,
	"image/gif":  true,
}

// MaxImageSize defines maximum image size (5MB)
const MaxImageSize = 5 * 1024 * 1024

// UploadImage handles image upload and returns the file path
func UploadImage(file *multipart.FileHeader, uploadType string) (string, error) {
	// Check file size
	if file.Size > MaxImageSize {
		return "", fmt.Errorf("حجم فایل نباید بیشتر از 5MB باشد")
	}

	// Open the file
	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("خطا در باز کردن فایل: %v", err)
	}
	defer src.Close()

	// Check file type
	buffer := make([]byte, 512)
	_, err = src.Read(buffer)
	if err != nil {
		return "", fmt.Errorf("خطا در خواندن فایل: %v", err)
	}

	// Reset file pointer
	src.Seek(0, 0)

	// Get file extension
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext == "" {
		ext = ".jpg"
	}

	// Generate unique filename
	filename := fmt.Sprintf("%s_%s%s", uploadType, uuid.New().String(), ext)

	// Create upload directory if it doesn't exist
	uploadDir := filepath.Join("uploads", uploadType)
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("خطا در ایجاد پوشه: %v", err)
	}

	// Create destination file
	filePath := filepath.Join(uploadDir, filename)
	dst, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("خطا در ایجاد فایل: %v", err)
	}
	defer dst.Close()

	// Copy file
	if _, err := io.Copy(dst, src); err != nil {
		return "", fmt.Errorf("خطا در ذخیره فایل: %v", err)
	}

	// Return relative path (always /uploads/{type}/filename)
	// Never return full URLs - frontend will construct the full URL based on environment
	relativePath := "/" + strings.ReplaceAll(filePath, "\\", "/")

	// Ensure it starts with /uploads/ and normalize
	relativePath = strings.ReplaceAll(relativePath, "\\", "/")
	if !strings.HasPrefix(relativePath, "/uploads/") {
		// If somehow the path doesn't start with /uploads/, fix it
		relativePath = "/uploads/" + uploadType + "/" + filename
	}

	// Normalize: ensure no double slashes and correct format
	relativePath = strings.ReplaceAll(relativePath, "//", "/")

	return relativePath, nil
}

// DeleteImage deletes an image file
func DeleteImage(imagePath string) error {
	if imagePath == "" {
		return nil
	}

	// Remove leading slash if present
	imagePath = strings.TrimPrefix(imagePath, "/")

	// Check if file exists
	if _, err := os.Stat(imagePath); os.IsNotExist(err) {
		return nil // File doesn't exist, no error
	}

	// Delete file
	return os.Remove(imagePath)
}

// GenerateImageFilename generates a unique filename for images
func GenerateImageFilename(uploadType string, ext string) string {
	timestamp := time.Now().Unix()
	uuid := uuid.New().String()[:8]
	return fmt.Sprintf("%s_%d_%s%s", uploadType, timestamp, uuid, ext)
}
