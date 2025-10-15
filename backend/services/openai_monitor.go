package services

import (
	"asl-market-backend/config"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

// OpenAIUsageResponse represents the usage response from OpenAI
type OpenAIUsageResponse struct {
	Object     string `json:"object"`
	TotalUsage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"total_usage"`
	Data []struct {
		ID      string `json:"id"`
		Object  string `json:"object"`
		Created int64  `json:"created"`
		Model   string `json:"model"`
		Usage   struct {
			PromptTokens     int `json:"prompt_tokens"`
			CompletionTokens int `json:"completion_tokens"`
			TotalTokens      int `json:"total_tokens"`
		} `json:"usage"`
	} `json:"data"`
}

// OpenAIBillingResponse represents the billing response from OpenAI
type OpenAIBillingResponse struct {
	Object        string  `json:"object"`
	TotalUsage    float64 `json:"total_usage"`
	TotalPaid     float64 `json:"total_paid"`
	TotalDue      float64 `json:"total_due"`
	CurrentPeriod struct {
		StartDate string  `json:"start_date"`
		EndDate   string  `json:"end_date"`
		Usage     float64 `json:"usage"`
	} `json:"current_period"`
}

// OpenAIMonitor handles OpenAI usage monitoring and alerts
type OpenAIMonitor struct {
	config    *config.OpenAIConfig
	telegram  *TelegramService
	client    *http.Client
	lastAlert time.Time
	alertSent bool
}

// NewOpenAIMonitor creates a new OpenAI monitor instance
func NewOpenAIMonitor(telegramService *TelegramService) *OpenAIMonitor {
	return &OpenAIMonitor{
		config:   &config.AppConfig.OpenAI,
		telegram: telegramService,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
		lastAlert: time.Now().AddDate(0, 0, -1), // Yesterday
		alertSent: false,
	}
}

// CheckUsage checks OpenAI usage and sends alerts if needed
func (m *OpenAIMonitor) CheckUsage() error {
	// Get current usage
	usage, err := m.getCurrentUsage()
	if err != nil {
		log.Printf("Error getting OpenAI usage: %v", err)
		return err
	}

	log.Printf("OpenAI Usage: $%.4f", usage)

	// Check if usage is approaching $3
	if usage >= 2.5 && !m.alertSent {
		err := m.sendLowBalanceAlert(usage)
		if err != nil {
			log.Printf("Error sending low balance alert: %v", err)
			return err
		}
		m.alertSent = true
		m.lastAlert = time.Now()
	}

	// Reset alert flag if usage is below $2
	if usage < 2.0 {
		m.alertSent = false
	}

	return nil
}

// getCurrentUsage gets the current OpenAI usage from API
func (m *OpenAIMonitor) getCurrentUsage() (float64, error) {
	// Try to get billing information
	billing, err := m.getBillingInfo()
	if err == nil && billing.TotalUsage > 0 {
		return billing.TotalUsage, nil
	}

	// Fallback: estimate based on recent usage
	recentUsage, err := m.getRecentUsage()
	if err != nil {
		return 0, err
	}

	// Estimate current usage (this is approximate)
	// OpenAI charges approximately $0.002 per 1K tokens for GPT-3.5-turbo
	estimatedCost := float64(recentUsage) * 0.002 / 1000
	return estimatedCost, nil
}

// getBillingInfo gets billing information from OpenAI
func (m *OpenAIMonitor) getBillingInfo() (*OpenAIBillingResponse, error) {
	req, err := http.NewRequest("GET", "https://api.openai.com/v1/usage", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+m.config.APIKey)

	resp, err := m.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("OpenAI billing API error: %s", string(body))
	}

	var billing OpenAIBillingResponse
	if err := json.Unmarshal(body, &billing); err != nil {
		return nil, err
	}

	return &billing, nil
}

// getRecentUsage gets recent usage from OpenAI
func (m *OpenAIMonitor) getRecentUsage() (int, error) {
	// Get usage for the last 30 days
	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -30)

	url := fmt.Sprintf("https://api.openai.com/v1/usage?start_date=%s&end_date=%s",
		startDate.Format("2006-01-02"),
		endDate.Format("2006-01-02"))

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return 0, err
	}

	req.Header.Set("Authorization", "Bearer "+m.config.APIKey)

	resp, err := m.client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, err
	}

	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("OpenAI usage API error: %s", string(body))
	}

	var usage OpenAIUsageResponse
	if err := json.Unmarshal(body, &usage); err != nil {
		return 0, err
	}

	return usage.TotalUsage.TotalTokens, nil
}

// sendLowBalanceAlert sends a low balance alert to admins
func (m *OpenAIMonitor) sendLowBalanceAlert(usage float64) error {
	message := fmt.Sprintf(`🚨 **هشدار شارژ OpenAI**

💰 **شارژ فعلی**: $%.4f
⚠️ **وضعیت**: نزدیک به $3.00
🕐 **زمان**: %s

📝 **توصیه**: لطفاً حساب OpenAI را شارژ کنید تا سرویس هوش مصنوعی قطع نشود.

🔗 **لینک مدیریت**: https://platform.openai.com/account/billing`,
		usage,
		time.Now().Format("2006-01-02 15:04:05"))

	// Send to all admins
	for _, adminID := range ADMIN_IDS {
		msg := tgbotapi.NewMessage(adminID, message)
		msg.ParseMode = "Markdown"

		if _, err := m.telegram.bot.Send(msg); err != nil {
			log.Printf("Error sending alert to admin %d: %v", adminID, err)
		}
	}

	log.Printf("Low balance alert sent to %d admins", len(ADMIN_IDS))
	return nil
}

// StartMonitoring starts the monitoring routine
func (m *OpenAIMonitor) StartMonitoring() {
	log.Println("🔍 Starting OpenAI usage monitoring...")

	// Check immediately
	if err := m.CheckUsage(); err != nil {
		log.Printf("Error in initial usage check: %v", err)
	}

	// Check every 6 hours
	ticker := time.NewTicker(6 * time.Hour)
	go func() {
		for range ticker.C {
			if err := m.CheckUsage(); err != nil {
				log.Printf("Error in scheduled usage check: %v", err)
			}
		}
	}()
}

// GetUsageStats returns current usage statistics
func (m *OpenAIMonitor) GetUsageStats() (map[string]interface{}, error) {
	usage, err := m.getCurrentUsage()
	if err != nil {
		return nil, err
	}

	stats := map[string]interface{}{
		"current_usage":   usage,
		"alert_threshold": 2.5,
		"critical_level":  3.0,
		"last_check":      time.Now().Format("2006-01-02 15:04:05"),
		"alert_sent":      m.alertSent,
		"last_alert":      m.lastAlert.Format("2006-01-02 15:04:05"),
	}

	return stats, nil
}

// SendTestAlert sends a test alert to admins
func (m *OpenAIMonitor) SendTestAlert() error {
	message := `🧪 **تست هشدار OpenAI**

این یک پیام تست برای بررسی عملکرد سیستم هشدار است.

✅ **وضعیت**: سیستم هشدار فعال است
🕐 **زمان**: ` + time.Now().Format("2006-01-02 15:04:05")

	// Send to all admins
	for _, adminID := range ADMIN_IDS {
		msg := tgbotapi.NewMessage(adminID, message)
		msg.ParseMode = "Markdown"

		if _, err := m.telegram.bot.Send(msg); err != nil {
			log.Printf("Error sending test alert to admin %d: %v", adminID, err)
		}
	}

	log.Println("Test alert sent to all admins")
	return nil
}
