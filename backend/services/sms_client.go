package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path"
	"runtime"
	"strings"
	"time"
)

const (
	// ClientVersion is used in User-Agent request header to provide server with API level.
	ClientVersion = "2.0.0"
	// Endpoint: طبق داک IPPanel — آدرس پایه edge.ippanel.com/v1
	Endpoint = "https://edge.ippanel.com/v1"
	// httpClientTimeout is used to limit http.Client waiting time.
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

// IPPanelClient - Ippanel client based on official SDK
type IPPanelClient struct {
	Apikey  string
	Client  *http.Client
	BaseURL *url.URL
}

// ارسال با پترن — طبق داک edge.ippanel.com: POST /api/send
type edgeSendPatternReq struct {
	SendingType string            `json:"sending_type"` // "pattern"
	FromNumber  string            `json:"from_number"`
	Code        string            `json:"code"`
	Recipients  []string          `json:"recipients"`
	Params      map[string]string `json:"params"`
}

// پاسخ موفق ارسال — طبق داک
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

// getCreditResType get credit response type
type getCreditResType struct {
	Credit float64 `json:"credit"`
}

// fieldErrsRes field errors response type
type fieldErrsRes struct {
	Errors FieldErrs `json:"error"`
}

// defaultErrsRes default template for errors body
type defaultErrsRes struct {
	Errors string `json:"error"`
}

// NewIPPanelClient create new ippanel sms instance
func NewIPPanelClient(apikey string) *IPPanelClient {
	u, _ := url.Parse(Endpoint)
	client := &http.Client{
		Transport: http.DefaultTransport,
		Timeout:   httpClientTimeout,
	}
	return &IPPanelClient{
		Apikey:  apikey,
		Client:  client,
		BaseURL: u,
	}
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

// SendPattern ارسال پیامک با الگو — طبق داک: POST {base_url}/api/send
func (sms *IPPanelClient) SendPattern(patternCode string, originator string, recipient string, values map[string]string) (int64, error) {
	if values == nil {
		values = make(map[string]string)
	}

	recipientE164 := normalizeE164(recipient)
	body := edgeSendPatternReq{
		SendingType: "pattern",
		FromNumber:  originator,
		Code:        patternCode,
		Recipients:  []string{recipientE164},
		Params:      values,
	}

	u := *sms.BaseURL
	u.Path = path.Join(sms.BaseURL.Path, "api", "send")
	marshaled, err := json.Marshal(body)
	if err != nil {
		return 0, err
	}

	req, err := http.NewRequest("POST", u.String(), bytes.NewReader(marshaled))
	if err != nil {
		return 0, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", sms.Apikey)

	res, err := sms.Client.Do(req)
	if err != nil {
		return 0, fmt.Errorf("SMS API request failed: %v", err)
	}
	defer res.Body.Close()

	responseBody, err := io.ReadAll(res.Body)
	if err != nil {
		return 0, err
	}

	// اگر سرور به جای JSON صفحه HTML برگرداند (۵۰۲، ۴۰۴، و غیره)
	if len(responseBody) > 0 && (responseBody[0] == '<' || bytes.Contains(responseBody, []byte("<!DOCTYPE"))) {
		return 0, fmt.Errorf("SMS API returned HTML instead of JSON (HTTP %d). URL: %s — اگر ۵۰۲/۵۰۳ است چند دقیقه بعد دوباره تلاش کنید؛ اگر ۴۰۴ است آدرس API را در پنل IPPanel بررسی کنید", res.StatusCode, req.URL.String())
	}

	var out edgeSendRes
	if err := json.Unmarshal(responseBody, &out); err != nil {
		return 0, fmt.Errorf("SMS API response invalid JSON (HTTP %d): %v", res.StatusCode, err)
	}

	if out.Meta != nil && !out.Meta.Status {
		msg := out.Meta.Message
		if msg == "" {
			msg = string(responseBody)
		}
		return 0, fmt.Errorf("SMS API error: %s", msg)
	}

	if out.Data == nil || len(out.Data.MessageOutboxIDs) == 0 {
		return 0, fmt.Errorf("SMS API returned no message_outbox_ids")
	}

	return out.Data.MessageOutboxIDs[0], nil
}

// GetCredit get credit for user
func (sms *IPPanelClient) GetCredit() (float64, error) {
	_res, err := sms.get("/sms/accounting/credit/show", nil)
	if err != nil {
		return 0, err
	}

	res := &getCreditResType{}
	if err = json.Unmarshal(_res.Data, res); err != nil {
		return 0, err
	}

	return res.Credit, nil
}
