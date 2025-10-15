package controllers

import (
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

// ServeStaticFile serves static files from the public directory
func ServeStaticFile(c *gin.Context) {
	fileName := c.Param("filename")

	// Security check - prevent directory traversal
	if strings.Contains(fileName, "..") || strings.Contains(fileName, "/") || strings.Contains(fileName, "\\") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid filename"})
		return
	}

	// Define the public directory path
	publicDir := "./public"
	filePath := filepath.Join(publicDir, fileName)

	// Set appropriate headers based on file extension
	ext := strings.ToLower(filepath.Ext(fileName))
	switch ext {
	case ".xlsx", ".xls":
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		c.Header("Content-Disposition", "attachment; filename="+fileName)
	case ".docx", ".doc":
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
		c.Header("Content-Disposition", "attachment; filename="+fileName)
	case ".pdf":
		c.Header("Content-Type", "application/pdf")
		c.Header("Content-Disposition", "inline; filename="+fileName)
	case ".txt":
		c.Header("Content-Type", "text/plain")
		c.Header("Content-Disposition", "attachment; filename="+fileName)
	case ".zip":
		c.Header("Content-Type", "application/zip")
		c.Header("Content-Disposition", "attachment; filename="+fileName)
	case ".rar":
		c.Header("Content-Type", "application/x-rar-compressed")
		c.Header("Content-Disposition", "attachment; filename="+fileName)
	default:
		c.Header("Content-Type", "application/octet-stream")
		c.Header("Content-Disposition", "attachment; filename="+fileName)
	}

	// Serve the file
	c.File(filePath)
}

// GetAvailableFiles returns list of available static files
func GetAvailableFiles(c *gin.Context) {
	files := []map[string]string{
		{
			"name":        "CRM_Template_ASL_Market.xlsx",
			"title":       "قالب CRM",
			"description": "قالب آماده برای مدیریت مشتریان و فروش",
			"type":        "Excel Template",
			"url":         "/api/static/CRM_Template_ASL_Market.xlsx",
		},
		{
			"name":        "mega prompt ASL MARKET.docx",
			"title":       "مگا پرامپت",
			"description": "راهنمای کامل استفاده از هوش مصنوعی",
			"type":        "Word Document",
			"url":         "/api/static/mega prompt ASL MARKET.docx",
		},
		{
			"name":        "Script ASL MARKET.docx",
			"title":       "اسکریپت",
			"description": "اسکریپت کامل پلتفرم اصل مارکت",
			"type":        "Word Document",
			"url":         "/api/static/Script ASL MARKET.docx",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Available files",
		"data":    files,
	})
}
