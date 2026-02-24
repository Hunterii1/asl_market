package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"path"
	"runtime"
	"strings"
	"sync"
	"time"
)

const (
	ClientVersion     = "2.0.0"
	Endpoint          = "https://edge.ippanel.com/v1"
	httpClientTimeout = 30 * time.Second
)

var (
	ErrUnexpectedResponse = errors.New("The Ippanel API is currently unavailable")
	ErrStatusUnauthorized = errors.New("You api key is not valid")
)

// ResponseCode api response code error type
type ResponseCode int

const (
	ErrForbidden           ResponseCode = 403
	ErrNotFound            ResponseCode = 404
	ErrUnprocessableEntity ResponseCode = 422
	ErrInternalServer      ResponseCode = 500
)

// Error general service error type
type Error struct {
	Code    ResponseCode
	Message interface{}
}

// FieldErrs input field level errors
type FieldErrs map[string][]string

// Error implement error interface
func (e Error) Error() string {
	switch e.Message.(type) {
	case string:
		return e.Message.(string)
	case FieldErrs:
		m, _ := json.Marshal(e.Message)
		return string(m)
	}
	return fmt.Sprint(e.Code)
}

// ListParams ...
type ListParams struct {
	Limit int64 `json:"limit"`
	Page  int64 `json:"page"`
}

// PaginationInfo ...
type PaginationInfo struct {
	Total int64   `json:"total"`
	Limit int64   `json:"limit"`
	Page  int64   `json:"page"`
	Pages int64   `json:"pages"`
	Prev  *string `json:"prev"`
	Next  *string `json:"next"`
}

// BaseResponse base response model
type BaseResponse struct {
	Status       string          `json:"status"`
	Code         ResponseCode    `json:"code"`
	Data         json.RawMessage `json:"data"`
	Meta         *PaginationInfo `json:"meta"`
	ErrorMessage string          `json:"error_message"`
}

// IPPanelClient - Ippanel client
type IPPanelClient struct {
	Apikey   string
	Username string
	Password string
	Client   *http.Client
	BaseURL  *url.URL
	token    string
	tokenMu  sync.Mutex
}

// پاسخ لاگین Edge: POST /api/acl/auth/login
type edgeLoginRes struct {
	Data *struct {
		Token string `json:"token"`
	} `json:"data"`
	Meta *struct {
		Status bool `json:"status"`
	} `json:"meta"`
}

// --- Edge API (edge.ippanel.com) ---
type edgeSendPatternReq struct {
	SendingType string            `json:"sending_type"`
	FromNumber  string            `json:"from_number"`
	Code        string            `json:"code"`
	Recipients  []string          `json:"recipients"`
	Params      map[string]string `json:"params"`
}
type edgeSendResData struct {
	MessageOutboxIDs []int64 `json:"message_outbox_ids"`
}
type edgeSendRes struct {
	Data *edgeSendResData `json:"data"`
	Meta *struct {
		Status  bool   `json:"status"`
		Message string `json:"message"`
	} `json:"meta"`
}


// getCreditResType get credit response type (قدیمی)
type getCreditResType struct {
	Credit float64 `json:"credit"`
}

// Edge API: GET /api/payment/credit/mine — پاسخ اعتبار
type edgeCreditRes struct {
	Data *struct {
		Credit float64 `json:"credit"`
	} `json:"data"`
}

// fieldErrsRes field errors response type
type fieldErrsRes struct {
	Errors FieldErrs `json:"error"`
}

// defaultErrsRes default template for errors body
type defaultErrsRes struct {
	Errors string `json:"error"`
}

// NewIPPanelClient create new ippanel sms instance. اگر username/password داده شود، برای Edge از توکن لاگین استفاده می‌شود.
func NewIPPanelClient(apikey, username, password string) *IPPanelClient {
	u, _ := url.Parse(Endpoint)
	client := &http.Client{
		Transport: http.DefaultTransport,
		Timeout:   httpClientTimeout,
	}
	return &IPPanelClient{
		Apikey:   apikey,
		Username: strings.TrimSpace(username),
		Password: password,
		Client:   client,
		BaseURL:  u,
	}
}

// login توکن از Edge می‌گیرد (POST /api/acl/auth/login)
func (sms *IPPanelClient) login() (string, error) {
	u := *sms.BaseURL
	u.Path = path.Join(sms.BaseURL.Path, "api", "acl", "auth", "login")
	body := map[string]string{"username": sms.Username, "password": sms.Password}
	marshaled, _ := json.Marshal(body)
	req, err := http.NewRequest("POST", u.String(), bytes.NewReader(marshaled))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	res, err := sms.Client.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	responseBody, err := io.ReadAll(res.Body)
	if err != nil {
		return "", err
	}
	if isHTMLResponse(responseBody) {
		return "", fmt.Errorf("login returned HTML (HTTP %d)", res.StatusCode)
	}
	var out edgeLoginRes
	if err := json.Unmarshal(responseBody, &out); err != nil {
		return "", err
	}
	if out.Data == nil || out.Data.Token == "" {
		return "", fmt.Errorf("login: no token in response")
	}
	return out.Data.Token, nil
}

// getEdgeAuthToken برای Edge یا توکن لاگین برمی‌گرداند یا همان API key
func (sms *IPPanelClient) getEdgeAuthToken() string {
	if sms.Username == "" {
		return sms.Apikey
	}
	sms.tokenMu.Lock()
	defer sms.tokenMu.Unlock()
	if sms.token != "" {
		return sms.token
	}
	token, err := sms.login()
	if err != nil {
		log.Printf("SMS Edge login failed (will use API key for fallback): %v", err)
		return sms.Apikey
	}
	sms.token = token
	log.Printf("SMS Edge: logged in, token obtained")
	return sms.token
}

// clearToken بعد از خطای 401 می‌توان صدا زد تا بار بعد دوباره لاگین شود
func (sms *IPPanelClient) clearToken() {
	sms.tokenMu.Lock()
	sms.token = ""
	sms.tokenMu.Unlock()
}

// request preform http request
func (sms IPPanelClient) request(method string, uri string, params map[string]string, data interface{}) (*BaseResponse, error) {
	u := *sms.BaseURL
	// join base url with extra path
	u.Path = path.Join(sms.BaseURL.Path, uri)

	// set query params
	p := url.Values{}
	for key, param := range params {
		p.Add(key, param)
	}
	u.RawQuery = p.Encode()

	marshaledBody, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	requestBody := bytes.NewBuffer(marshaledBody)
	req, err := http.NewRequest(method, u.String(), requestBody)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	// طبق داک: احراز هویت با هدر Authorization (توکن یا کلید API)
	req.Header.Set("Authorization", sms.Apikey)
	req.Header.Set("User-Agent", "Ippanel/ApiClient/"+ClientVersion+" Go/"+runtime.Version())

	res, err := sms.Client.Do(req)
	if err != nil || res == nil {
		return nil, err
	}
	defer res.Body.Close()

	responseBody, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	switch res.StatusCode {
	case http.StatusOK, http.StatusCreated:
		_res := &BaseResponse{}
		if err := json.Unmarshal(responseBody, _res); err != nil {
			return nil, fmt.Errorf("could not decode response JSON, %s: %v", string(responseBody), err)
		}
		return _res, nil
	case http.StatusInternalServerError:
		return nil, ErrUnexpectedResponse
	case http.StatusUnauthorized:
		return nil, ErrUnexpectedResponse
	default:
		_res := &BaseResponse{}
		if err := json.Unmarshal(responseBody, _res); err != nil {
			return nil, fmt.Errorf("could not decode response JSON, %s: %v", string(responseBody), err)
		}
		return _res, sms.parseErrors(_res)
	}
}

// get do get request
func (sms IPPanelClient) get(uri string, params map[string]string) (*BaseResponse, error) {
	return sms.request("GET", uri, params, nil)
}

// post do post request
func (sms IPPanelClient) post(uri string, contentType string, data interface{}) (*BaseResponse, error) {
	return sms.request("POST", uri, nil, data)
}

// parseErrors ...
func (sms IPPanelClient) parseErrors(res *BaseResponse) error {
	var err error
	e := Error{Code: res.Code}

	messageFieldErrs := fieldErrsRes{}
	if err = json.Unmarshal(res.Data, &messageFieldErrs); err == nil {
		e.Message = messageFieldErrs.Errors
	} else {
		messageDefaultErrs := defaultErrsRes{}
		if err = json.Unmarshal(res.Data, &messageDefaultErrs); err == nil {
			e.Message = messageDefaultErrs.Errors
		}
	}

	if err != nil {
		return errors.New("cant marshal errors into standard template")
	}
	return e
}

// normalizeE164 ensures number is in E.164 for IPPanel (e.g. +989123456789)
func normalizeE164(phone string) string {
	phone = strings.TrimSpace(phone)
	if phone == "" {
		return phone
	}
	if len(phone) > 0 && phone[0] == '+' {
		return phone
	}
	var b strings.Builder
	for _, r := range phone {
		if r >= '0' && r <= '9' {
			b.WriteRune(r)
		}
	}
	s := b.String()
	if len(s) >= 2 && s[:2] == "98" {
		return "+" + s
	}
	if len(s) == 10 && s[0] == '9' {
		return "+98" + s
	}
	return "+98" + s
}

func isHTMLResponse(body []byte) bool {
	if len(body) == 0 {
		return false
	}
	return body[0] == '<' || bytes.Contains(body, []byte("<!DOCTYPE"))
}

// sendPatternEdge — Edge API (با توکن لاگین اگر username تنظیم شده باشد)
func (sms *IPPanelClient) sendPatternEdge(patternCode, originator, recipientE164 string, values map[string]string) (int64, error) {
	body := edgeSendPatternReq{
		SendingType: "pattern",
		FromNumber:  originator,
		Code:        patternCode,
		Recipients:  []string{recipientE164},
		Params:      values,
	}
	marshaled, _ := json.Marshal(body)
	u := *sms.BaseURL
	u.Path = path.Join(sms.BaseURL.Path, "api", "send")
	req, _ := http.NewRequest("POST", u.String(), bytes.NewReader(marshaled))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", sms.getEdgeAuthToken())
	res, err := sms.Client.Do(req)
	if err != nil {
		return 0, err
	}
	defer res.Body.Close()
	responseBody, err := io.ReadAll(res.Body)
	if err != nil {
		return 0, err
	}
	if res.StatusCode == http.StatusUnauthorized {
		sms.clearToken()
		return 0, fmt.Errorf("unauthorized")
	}
	if isHTMLResponse(responseBody) {
		return 0, fmt.Errorf("html")
	}
	var out edgeSendRes
	if err := json.Unmarshal(responseBody, &out); err != nil {
		return 0, err
	}
	if out.Meta != nil && !out.Meta.Status {
		return 0, fmt.Errorf("%s", out.Meta.Message)
	}
	if out.Data == nil || len(out.Data.MessageOutboxIDs) == 0 {
		return 0, fmt.Errorf("no message_outbox_ids")
	}
	return out.Data.MessageOutboxIDs[0], nil
}

// SendPattern ارسال پیامک با الگو — فقط Edge (لاگین خودکار + توکن)
func (sms *IPPanelClient) SendPattern(patternCode string, originator string, recipient string, values map[string]string) (int64, error) {
	if values == nil {
		values = make(map[string]string)
	}
	recipientE164 := normalizeE164(recipient)
	return sms.sendPatternEdge(patternCode, originator, recipientE164, values)
}

// GetCredit اعتبار حساب — طبق apidoc.ippanel.com: GET {base_url}/api/payment/credit/mine
func (sms *IPPanelClient) GetCredit() (float64, error) {
	u := *sms.BaseURL
	u.Path = path.Join(sms.BaseURL.Path, "api", "payment", "credit", "mine")

	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		return 0, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", sms.getEdgeAuthToken())

	res, err := sms.Client.Do(req)
	if err != nil {
		return 0, err
	}
	defer res.Body.Close()

	responseBody, err := io.ReadAll(res.Body)
	if err != nil {
		return 0, err
	}

	if len(responseBody) > 0 && (responseBody[0] == '<' || bytes.Contains(responseBody, []byte("<!DOCTYPE"))) {
		return 0, fmt.Errorf("SMS API credit: got HTML (HTTP %d)", res.StatusCode)
	}

	var out edgeCreditRes
	if err := json.Unmarshal(responseBody, &out); err != nil {
		// شاید پاسخ به صورت ساده { "credit": 123 } باشد
		var simple struct {
			Credit float64 `json:"credit"`
		}
		if err2 := json.Unmarshal(responseBody, &simple); err2 == nil {
			return simple.Credit, nil
		}
		return 0, fmt.Errorf("SMS API credit response invalid: %v", err)
	}

	if out.Data != nil {
		return out.Data.Credit, nil
	}
	return 0, fmt.Errorf("SMS API credit: no data in response")
}
