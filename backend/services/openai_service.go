package services

import (
	"asl-market-backend/config"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// OpenAIMessage represents a message in OpenAI format
type OpenAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// OpenAIRequest represents the request payload to OpenAI
type OpenAIRequest struct {
	Model       string          `json:"model"`
	Messages    []OpenAIMessage `json:"messages"`
	MaxTokens   int             `json:"max_tokens"`
	Temperature float64         `json:"temperature"`
}

// OpenAIResponse represents the response from OpenAI
type OpenAIResponse struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	Created int64  `json:"created"`
	Model   string `json:"model"`
	Choices []struct {
		Index   int `json:"index"`
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
}

// OpenAIService handles communication with OpenAI API
type OpenAIService struct {
	config *config.OpenAIConfig
	client *http.Client
}

// NewOpenAIService creates a new OpenAI service instance
func NewOpenAIService() *OpenAIService {
	return &OpenAIService{
		config: &config.AppConfig.OpenAI,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// GetSystemPrompt returns the system prompt for ASL AI assistant
func (s *OpenAIService) GetSystemPrompt() string {
	return `شما "هوش مصنوعی ASL" هستید، دستیار هوشمند پلتفرم اصل مارکت. وظایف شما:

🎯 هدف: کمک به تجار ایرانی برای فروش محصولات به کشورهای عربی

📝 وظایف اصلی:
- راهنمایی در انتخاب محصولات مناسب برای صادرات
- مشاوره بازاریابی و فروش بین‌المللی
- کمک در تحقیقات بازار کشورهای عربی
- راهنمایی فرآیندهای صادرات و واردات
- پاسخ به سوالات مالی و حقوقی تجارت
- مشاوره برندسازی و بسته‌بندی
- کمک در ارتباط با تأمین‌کنندگان
- راهنمایی نحوه استفاده از ابزارهای پلتفرم

⚡ ویژگی‌ها:
- همیشه به فارسی پاسخ دهید
- پاسخ‌های کاربردی و قابل اجرا ارائه دهید
- از اطلاعات معتبر و به‌روز استفاده کنید
- به صورت دوستانه و حرفه‌ای صحبت کنید
- در صورت عدم اطمینان، راهنمایی برای کسب اطلاعات بیشتر ارائه دهید

🚀 شروع هر مکالمه با: "سلام! من هوش مصنوعی ASL هستم، دستیار شما در مسیر موفقیت تجاری."`
}

// SendMessage sends a message to OpenAI and returns the response
func (s *OpenAIService) SendMessage(messages []OpenAIMessage) (string, error) {
	// Add system prompt as first message if not present
	if len(messages) == 0 || messages[0].Role != "system" {
		systemMessage := OpenAIMessage{
			Role:    "system",
			Content: s.GetSystemPrompt(),
		}
		messages = append([]OpenAIMessage{systemMessage}, messages...)
	}

	request := OpenAIRequest{
		Model:       s.config.Model,
		Messages:    messages,
		MaxTokens:   s.config.MaxTokens,
		Temperature: s.config.Temperature,
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %v", err)
	}

	req, err := http.NewRequest("POST", s.config.APIURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.config.APIKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("OpenAI API error: %s", string(body))
	}

	var response OpenAIResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return "", fmt.Errorf("failed to unmarshal response: %v", err)
	}

	if len(response.Choices) == 0 {
		return "", fmt.Errorf("no response from OpenAI")
	}

	return strings.TrimSpace(response.Choices[0].Message.Content), nil
}

// ConvertMessagesToOpenAI converts our message format to OpenAI format
func (s *OpenAIService) ConvertMessagesToOpenAI(messages []interface{}) []OpenAIMessage {
	var openAIMessages []OpenAIMessage

	for _, msg := range messages {
		if m, ok := msg.(map[string]interface{}); ok {
			role, roleOk := m["role"].(string)
			content, contentOk := m["content"].(string)

			if roleOk && contentOk {
				openAIMessages = append(openAIMessages, OpenAIMessage{
					Role:    role,
					Content: content,
				})
			}
		}
	}

	return openAIMessages
}
