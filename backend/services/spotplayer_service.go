package services

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"
)

// SpotPlayerService handles SpotPlayer license generation
type SpotPlayerService struct {
	API string
}

// NewSpotPlayerService creates a new SpotPlayer service
func NewSpotPlayerService() *SpotPlayerService {
	return &SpotPlayerService{
		API: "ZNtN6Uh5mk+C7zeqn9ePuVvy+wIyhkE=",
	}
}

// filter removes nil values from a map[string]interface{}
func (s *SpotPlayerService) filter(m map[string]interface{}) map[string]interface{} {
	result := make(map[string]interface{})
	for k, v := range m {
		if v != nil {
			result[k] = v
		}
	}
	return result
}

// request performs an HTTP request to SpotPlayer API
func (s *SpotPlayerService) request(url string, payload map[string]interface{}) (map[string]interface{}, error) {
	method := "GET"
	var body io.Reader

	if payload != nil {
		method = "POST"
		filtered := s.filter(payload)
		jsonData, err := json.Marshal(filtered)
		if err != nil {
			return nil, err
		}
		body = bytes.NewBuffer(jsonData)
	}

	// Custom transport to disable SSL verification
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Transport: tr}

	req, err := http.NewRequest(method, url, body)
	if err != nil {
		return nil, err
	}

	req.Header.Set("$API", s.API)
	req.Header.Set("$LEVEL", "-1")
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var jsonResp map[string]interface{}
	if err := json.Unmarshal(respBytes, &jsonResp); err != nil {
		return nil, err
	}

	// If response has "ex" field, throw error
	if ex, ok := jsonResp["ex"].(map[string]interface{}); ok {
		if msg, ok := ex["msg"].(string); ok {
			return nil, errors.New(msg)
		}
	}

	return jsonResp, nil
}

// GenerateLicense creates a SpotPlayer license
func (s *SpotPlayerService) GenerateLicense(name string, courses []string, watermarks []string, test bool) (map[string]interface{}, error) {
	watermarkObjs := make([]map[string]string, len(watermarks))
	for i, w := range watermarks {
		watermarkObjs[i] = map[string]string{"text": w}
	}

	payload := map[string]interface{}{
		"test":   test,
		"name":   name,
		"course": courses,
		"watermark": map[string]interface{}{
			"texts": watermarkObjs,
		},
	}

	return s.request("https://panel.spotplayer.ir/license/edit/", payload)
}

// FormatPhoneNumber formats user ID to phone number if phone is not available
func (s *SpotPlayerService) FormatPhoneNumber(phone string, userID uint) string {
	// If phone exists and starts with 09, return as is
	if phone != "" && strings.HasPrefix(phone, "09") {
		return phone
	}

	// Convert user ID to phone number format
	userIDStr := strconv.FormatUint(uint64(userID), 10)

	// Ensure ID is 9 digits (like phone number without 09)
	if len(userIDStr) < 9 {
		// Pad with zeros to make it 9 digits
		userIDStr = strings.Repeat("0", 9-len(userIDStr)) + userIDStr
	} else if len(userIDStr) > 9 {
		// Take last 9 digits
		userIDStr = userIDStr[len(userIDStr)-9:]
	}

	return "09" + userIDStr
}
