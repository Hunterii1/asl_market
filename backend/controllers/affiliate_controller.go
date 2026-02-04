package controllers

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"asl-market-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AffiliateController handles affiliate panel APIs
type AffiliateController struct {
	DB *gorm.DB
}

// NewAffiliateController creates affiliate controller
func NewAffiliateController(db *gorm.DB) *AffiliateController {
	return &AffiliateController{DB: db}
}

// getAffiliateID from context (set by AffiliateAuthMiddleware)
func getAffiliateID(c *gin.Context) uint {
	id, _ := c.Get("affiliate_id")
	return id.(uint)
}

// GetDashboard returns stats, referral link, chart data, and users who purchased
func (ac *AffiliateController) GetDashboard(c *gin.Context) {
	affID := getAffiliateID(c)
	db := ac.DB

	var aff models.Affiliate
	if err := db.First(&aff, affID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Affiliate not found"})
		return
	}

	// Total registrations (referred users)
	var totalSignups int64
	db.Model(&models.User{}).Where("affiliate_id = ?", affID).Count(&totalSignups)

	// Registrations chart (last 30 days, grouped by date)
	type dateCount struct {
		Date  string
		Count int64
	}
	var regChart []dateCount
	db.Raw(`
		SELECT DATE(created_at) as date, COUNT(*) as count
		FROM users
		WHERE affiliate_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
		GROUP BY DATE(created_at)
		ORDER BY date ASC
	`, affID).Scan(&regChart)

	chartData := make([]map[string]interface{}, 0, len(regChart))
	for _, r := range regChart {
		chartData = append(chartData, map[string]interface{}{
			"name":  r.Date,
			"count": r.Count,
			"sales": r.Count, // for compatibility
		})
	}

	// Sales chart: licenses used by referred users (count per day, last 30 days)
	var salesChart []struct {
		Date  string
		Count int64
	}
	db.Raw(`
		SELECT DATE(l.used_at) as date, COUNT(*) as count
		FROM licenses l
		INNER JOIN users u ON u.id = l.used_by AND u.affiliate_id = ?
		WHERE l.used_at IS NOT NULL AND l.used_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
		GROUP BY DATE(l.used_at)
		ORDER BY date ASC
	`, affID).Scan(&salesChart)
	salesChartData := make([]map[string]interface{}, 0, len(salesChart))
	for _, r := range salesChart {
		salesChartData = append(salesChartData, map[string]interface{}{
			"name":  r.Date,
			"count": r.Count,
			"sales": r.Count,
		})
	}

	// Users who purchased (referred users that have used a license)
	var usersWhoPurchased []models.User
	db.Where("affiliate_id = ? AND id IN (SELECT used_by FROM licenses WHERE used_by IS NOT NULL)", affID).
		Order("created_at DESC").Limit(50).Find(&usersWhoPurchased)
	usersList := make([]map[string]interface{}, 0, len(usersWhoPurchased))
	for _, u := range usersWhoPurchased {
		usersList = append(usersList, map[string]interface{}{
			"id":         u.ID,
			"first_name": u.FirstName,
			"last_name":  u.LastName,
			"email":      u.Email,
			"phone":      u.Phone,
			"created_at": u.CreatedAt,
		})
	}

	// لیست ثبت‌نامی (همان لیستی که ادمین از CSV آپلود کرده) — در داشبورد برمی‌گردانیم تا صفحه کاربران و داشبورد هر دو از همین منبع استفاده کنند
	registeredList, totalRegistered, _ := models.GetAffiliateRegisteredUsers(db, affID, 5000, 0)
	log.Printf("[Affiliate] Dashboard affiliate_id=%d username=%s total_registered_users=%d", affID, aff.Username, totalRegistered)
	registeredUsersPayload := make([]map[string]interface{}, 0, len(registeredList))
	for _, r := range registeredList {
		regAt := ""
		if r.RegisteredAt != nil {
			regAt = r.RegisteredAt.Format("2006-01-02")
		}
		registeredUsersPayload = append(registeredUsersPayload, map[string]interface{}{
			"id":            r.ID,
			"name":          r.Name,
			"phone":         r.Phone,
			"registered_at": regAt,
			"created_at":    r.CreatedAt.Format(time.RFC3339),
		})
	}

	// نمودار تعداد ثبت‌نامی‌ها در روزهای مختلف (لیست ثبت‌نامی توسط پشتیبانی) — برای نمایش در داشبورد و صفحه کاربران
	var registeredChart []struct {
		Date  string
		Count int64
	}
	db.Raw(`
		SELECT DATE(COALESCE(registered_at, created_at)) AS date, COUNT(*) AS count
		FROM affiliate_registered_users
		WHERE affiliate_id = ? AND deleted_at IS NULL
		  AND COALESCE(registered_at, created_at) >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
		GROUP BY DATE(COALESCE(registered_at, created_at))
		ORDER BY date ASC
	`, affID).Scan(&registeredChart)
	registeredUsersChartData := make([]map[string]interface{}, 0, len(registeredChart))
	for _, r := range registeredChart {
		registeredUsersChartData = append(registeredUsersChartData, map[string]interface{}{
			"name":  r.Date,
			"count": r.Count,
		})
	}

	// Base URL for referral link: main site (not admin/api subdomain)
	baseURL := "https://asllmarket.com"
	if c.Request.Host != "" {
		scheme := "https"
		if c.GetHeader("X-Forwarded-Proto") == "http" {
			scheme = "http"
		}
		host := c.Request.Host
		// Use main domain for referral (e.g. admin.asllmarket.com -> asllmarket.com)
		if strings.HasPrefix(host, "admin.") || strings.HasPrefix(host, "api.") {
			if idx := strings.Index(host, "."); idx >= 0 && idx+1 < len(host) {
				host = host[idx+1:]
			}
		}
		baseURL = scheme + "://" + host
	}
	// Use custom referral link if set, otherwise generate from referral_code, otherwise empty
	var referralLink string
	if aff.ReferralLink != "" {
		referralLink = aff.ReferralLink
	} else if aff.ReferralCode != "" {
		referralLink = baseURL + "/signup?ref=" + aff.ReferralCode
	} else {
		referralLink = "" // Will show "درحال آماده سازی لینک شما..." in frontend
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"referral_link":          referralLink,
			"referral_code":          aff.ReferralCode,
			"total_signups":          totalSignups,
			"total_income":           aff.TotalEarnings,
			"balance":                aff.Balance,
			"registrations_chart":    chartData,
			"sales_chart":            salesChartData,
			"users_who_purchased":    usersList,
			"registered_users":       registeredUsersPayload,
			"total_registered_users": totalRegistered,
			"registered_users_chart": registeredUsersChartData,
		},
	})
}

// GetUsers returns paginated referred users
func (ac *AffiliateController) GetUsers(c *gin.Context) {
	affID := getAffiliateID(c)
	page := 1
	perPage := 20
	if p := c.Query("page"); p != "" {
		if v, _ := parseInt(p); v > 0 {
			page = v
		}
	}
	if pp := c.Query("per_page"); pp != "" {
		if v, _ := parseInt(pp); v > 0 && v <= 100 {
			perPage = v
		}
	}
	var users []models.User
	var total int64
	db := ac.DB
	db.Model(&models.User{}).Where("affiliate_id = ?", affID).Count(&total)
	offset := (page - 1) * perPage
	db.Where("affiliate_id = ?", affID).Order("created_at DESC").Offset(offset).Limit(perPage).Find(&users)
	list := make([]map[string]interface{}, 0, len(users))
	for _, u := range users {
		list = append(list, map[string]interface{}{
			"id":         u.ID,
			"first_name": u.FirstName,
			"last_name":  u.LastName,
			"email":      u.Email,
			"phone":      u.Phone,
			"created_at": u.CreatedAt,
		})
	}
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"users":    list,
			"total":    total,
			"page":     page,
			"per_page": perPage,
		},
	})
}

// GetPayments returns same chart + list as dashboard (sales chart + users who purchased)
func (ac *AffiliateController) GetPayments(c *gin.Context) {
	affID := getAffiliateID(c)
	db := ac.DB
	var salesChart []struct {
		Date  string
		Count int64
	}
	db.Raw(`
		SELECT DATE(l.used_at) as date, COUNT(*) as count
		FROM licenses l
		INNER JOIN users u ON u.id = l.used_by AND u.affiliate_id = ?
		WHERE l.used_at IS NOT NULL AND l.used_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
		GROUP BY DATE(l.used_at)
		ORDER BY date ASC
	`, affID).Scan(&salesChart)
	salesChartData := make([]map[string]interface{}, 0, len(salesChart))
	for _, r := range salesChart {
		salesChartData = append(salesChartData, map[string]interface{}{
			"name": r.Date, "count": r.Count, "sales": r.Count,
		})
	}
	var usersWhoPurchased []models.User
	db.Where("affiliate_id = ? AND id IN (SELECT used_by FROM licenses WHERE used_by IS NOT NULL)", affID).
		Order("created_at DESC").Limit(100).Find(&usersWhoPurchased)
	usersList := make([]map[string]interface{}, 0, len(usersWhoPurchased))
	for _, u := range usersWhoPurchased {
		usersList = append(usersList, map[string]interface{}{
			"id": u.ID, "first_name": u.FirstName, "last_name": u.LastName,
			"email": u.Email, "phone": u.Phone, "created_at": u.CreatedAt,
		})
	}
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"sales_chart":         salesChartData,
			"users_who_purchased": usersList,
		},
	})
}

// CreateWithdrawalRequest creates affiliate withdrawal request
func (ac *AffiliateController) CreateWithdrawalRequest(c *gin.Context) {
	affID := getAffiliateID(c)
	db := ac.DB
	var aff models.Affiliate
	if err := db.First(&aff, affID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Affiliate not found"})
		return
	}
	var req struct {
		Amount         float64 `json:"amount" binding:"required,gt=0"`
		BankCardNumber string  `json:"bank_card_number"`
		CardHolderName string  `json:"card_holder_name"`
		ShebaNumber    string  `json:"sheba_number"`
		BankName       string  `json:"bank_name"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
		return
	}
	if req.Amount > aff.Balance {
		c.JSON(http.StatusBadRequest, gin.H{"error": "مبلغ درخواستی بیشتر از موجودی است"})
		return
	}
	wr := &models.AffiliateWithdrawalRequest{
		AffiliateID:    affID,
		Amount:         req.Amount,
		Currency:       "IRR",
		BankCardNumber: req.BankCardNumber,
		CardHolderName: req.CardHolderName,
		ShebaNumber:    req.ShebaNumber,
		BankName:       req.BankName,
	}
	if err := models.CreateAffiliateWithdrawalRequest(db, wr); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ثبت درخواست"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"message": "درخواست برداشت با موفقیت ثبت شد",
		"data": gin.H{
			"id":           wr.ID,
			"amount":       wr.Amount,
			"status":       wr.Status,
			"requested_at": wr.RequestedAt.Format(time.RFC3339),
		},
	})
}

// GetWithdrawalRequests returns affiliate's withdrawal requests
func (ac *AffiliateController) GetWithdrawalRequests(c *gin.Context) {
	affID := getAffiliateID(c)
	page := 1
	perPage := 20
	if p := c.Query("page"); p != "" {
		if v, _ := parseInt(p); v > 0 {
			page = v
		}
	}
	if pp := c.Query("per_page"); pp != "" {
		if v, _ := parseInt(pp); v > 0 && v <= 100 {
			perPage = v
		}
	}
	offset := (page - 1) * perPage
	list, total, err := models.GetAffiliateWithdrawalRequests(ac.DB, affID, perPage, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت لیست"})
		return
	}
	out := make([]map[string]interface{}, 0, len(list))
	for _, r := range list {
		out = append(out, map[string]interface{}{
			"id":           r.ID,
			"amount":       r.Amount,
			"currency":     r.Currency,
			"status":       r.Status,
			"requested_at": r.RequestedAt.Format(time.RFC3339),
			"created_at":   r.CreatedAt.Format(time.RFC3339),
		})
	}
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"requests": out,
			"total":    total,
			"page":     page,
			"per_page": perPage,
		},
	})
}

func parseInt(s string) (int, bool) {
	var n int
	_, err := fmt.Sscanf(s, "%d", &n)
	return n, err == nil
}

// GetRegisteredUsers returns paginated registered users for affiliate panel (لیست ثبت‌نامی آپلودشده توسط ادمین)
func (ac *AffiliateController) GetRegisteredUsers(c *gin.Context) {
	affID := getAffiliateID(c)
	page := 1
	perPage := 20
	if p := c.Query("page"); p != "" {
		if v, _ := parseInt(p); v > 0 {
			page = v
		}
	}
	if pp := c.Query("per_page"); pp != "" {
		if v, _ := parseInt(pp); v > 0 && v <= 500 {
			perPage = v
		}
	}
	offset := (page - 1) * perPage
	list, total, err := models.GetAffiliateRegisteredUsers(ac.DB, affID, perPage, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت لیست"})
		return
	}
	log.Printf("[Affiliate] GetRegisteredUsers affiliate_id=%d page=%d per_page=%d total=%d", affID, page, perPage, total)
	out := make([]map[string]interface{}, 0, len(list))
	for _, r := range list {
		regAt := ""
		if r.RegisteredAt != nil {
			regAt = r.RegisteredAt.Format("2006-01-02")
		}
		out = append(out, map[string]interface{}{
			"id":            r.ID,
			"name":          r.Name,
			"phone":         r.Phone,
			"registered_at": regAt,
			"created_at":    r.CreatedAt.Format(time.RFC3339),
		})
	}
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"users":    out,
			"total":    total,
			"page":     page,
			"per_page": perPage,
		},
	})
}

// GetBuyers returns paginated buyers for affiliate panel
func (ac *AffiliateController) GetBuyers(c *gin.Context) {
	affID := getAffiliateID(c)
	page := 1
	perPage := 20
	if p := c.Query("page"); p != "" {
		if v, _ := parseInt(p); v > 0 {
			page = v
		}
	}
	if pp := c.Query("per_page"); pp != "" {
		if v, _ := parseInt(pp); v > 0 && v <= 100 {
			perPage = v
		}
	}
	offset := (page - 1) * perPage
	list, total, err := models.GetAffiliateBuyers(ac.DB, affID, perPage, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت لیست"})
		return
	}
	out := make([]map[string]interface{}, 0, len(list))
	for _, r := range list {
		pa := ""
		if r.PurchasedAt != nil {
			pa = r.PurchasedAt.Format("2006-01-02")
		}
		out = append(out, map[string]interface{}{
			"id":           r.ID,
			"name":         r.Name,
			"phone":        r.Phone,
			"purchased_at": pa,
			"created_at":   r.CreatedAt.Format(time.RFC3339),
		})
	}
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"buyers":   out,
			"total":    total,
			"page":     page,
			"per_page": perPage,
		},
	})
}
