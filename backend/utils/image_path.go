package utils

import (
	"strings"
)

// NormalizeImagePath ensures image path is in correct format (/uploads/{type}/filename)
// Removes any full URLs (localhost:8080, http://, https://) and returns only relative path
func NormalizeImagePath(imagePath string) string {
	if imagePath == "" {
		return imagePath
	}

	// Remove localhost:8080 or any localhost URL
	if strings.Contains(imagePath, "localhost:8080") {
		parts := strings.Split(imagePath, "localhost:8080")
		if len(parts) > 1 {
			imagePath = parts[1]
		} else {
			return imagePath // Can't fix, return as is
		}
	}

	// Remove http:// or https:// prefixes
	if strings.HasPrefix(imagePath, "http://") {
		imagePath = strings.TrimPrefix(imagePath, "http://")
		// Remove domain part (everything before first /)
		if idx := strings.Index(imagePath, "/"); idx != -1 {
			imagePath = imagePath[idx:]
		} else {
			imagePath = "/" + imagePath
		}
	}
	if strings.HasPrefix(imagePath, "https://") {
		imagePath = strings.TrimPrefix(imagePath, "https://")
		// Remove domain part (everything before first /)
		if idx := strings.Index(imagePath, "/"); idx != -1 {
			imagePath = imagePath[idx:]
		} else {
			imagePath = "/" + imagePath
		}
	}

	// If it contains our domain, extract the path
	if strings.Contains(imagePath, "asllmarket.com") {
		parts := strings.Split(imagePath, "asllmarket.com")
		if len(parts) > 1 {
			imagePath = parts[1]
		}
	} else if strings.Contains(imagePath, "asllmarket.ir") {
		parts := strings.Split(imagePath, "asllmarket.ir")
		if len(parts) > 1 {
			imagePath = parts[1]
		}
	}

	// Normalize slashes
	imagePath = strings.ReplaceAll(imagePath, "\\", "/")
	imagePath = strings.ReplaceAll(imagePath, "//", "/")

	// Ensure it starts with /
	if !strings.HasPrefix(imagePath, "/") {
		imagePath = "/" + imagePath
	}

	return imagePath
}
