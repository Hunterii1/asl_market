package controllers

import (
	"net/http"

	"asl-market-backend/services"

	"github.com/gin-gonic/gin"
)

type OpenAIMonitorController struct {
	monitor *services.OpenAIMonitor
}

func NewOpenAIMonitorController(monitor *services.OpenAIMonitor) *OpenAIMonitorController {
	return &OpenAIMonitorController{
		monitor: monitor,
	}
}

// GetUsageStats returns current OpenAI usage statistics
func (c *OpenAIMonitorController) GetUsageStats(ctx *gin.Context) {
	stats, err := c.monitor.GetUsageStats()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get usage stats",
			"details": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "OpenAI usage statistics",
		"data":    stats,
	})
}

// CheckUsage manually triggers a usage check
func (c *OpenAIMonitorController) CheckUsage(ctx *gin.Context) {
	err := c.monitor.CheckUsage()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to check usage",
			"details": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Usage check completed",
		"success": true,
	})
}

// SendTestAlert sends a test alert to admins
func (c *OpenAIMonitorController) SendTestAlert(ctx *gin.Context) {
	err := c.monitor.SendTestAlert()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to send test alert",
			"details": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Test alert sent to all admins",
		"success": true,
	})
}
