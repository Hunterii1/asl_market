package controllers

import (
	"strings"
)

// List of Arabic countries and cities (only these are allowed) - expanded and flexible
var arabicCountries = []string{
	"عمان", "امارات", "امارات متحده عربی", "امارات متحده", "دبی", "ابوظبی", "شارجه", "عجمان", "راس الخیمه", "راس الخيمه",
	"عربستان", "عربستان سعودی", "سعودی", "ریاض", "جده", "دمام", "مکه", "مدینه", "طائف", "خبر", "ابها",
	"کویت", "کویت سیتی", "الاحمدی", "حولی", "الفروانیه", "الجهراء",
	"قطر", "دوحه", "الریان", "الوکره", "الخور", "دخان",
	"بحرین", "منامه", "المحرق", "مدینه حمد", "ستره", "رفاع",
	"یمن", "صنعا", "عدن", "تعز", "حدیده",
	"اردن", "عمان", "زرقا", "اربد", "عقبه",
	"لبنان", "بیروت", "طرابلس", "صیدا", "صور",
	"عراق", "بغداد", "بصره", "موصل", "کربلا", "نجف",
	"فلسطین", "مصر", "قاهره", "اسکندریه", "جیزه", "شرم الشیخ",
	"لیبی", "تونس", "الجزایر", "مراکش", "سودان",
}

// List of Iranian cities and terms to validate against (not allowed)
var iranianTerms = []string{
	"تهران", "مشهد", "اصفهان", "شیراز", "تبریز", "کرج", "اهواز", "قم",
	"کرمانشاه", "ارومیه", "یزد", "زاهدان", "رشت", "کرمان", "همدان",
	"اردبیل", "بندرعباس", "اسلامشهر", "زنجان", "سنندج", "یاسوج",
	"بوشهر", "بیرجند", "شهرکرد", "گرگان", "ساری", "اراک", "بابل",
	"قزوین", "خرمآباد", "سمنان", "کاشان", "گلستان", "سیستان",
	"بلوچستان", "کهگیلویه", "بویراحمد", "ایران", "جمهوری اسلامی",
	"ایرانی", "تهرانی", "مشهدی", "اصفهانی",
}

// isIranianLocation checks if location contains Iranian terms (not allowed)
func isIranianLocation(location string) bool {
	locationLower := strings.ToLower(location)
	for _, term := range iranianTerms {
		if strings.Contains(locationLower, strings.ToLower(term)) {
			return true
		}
	}
	return false
}

// isArabicCountry checks if location contains only Arabic countries (allowed)
func isArabicCountry(location string) bool {
	locationLower := strings.ToLower(location)
	for _, country := range arabicCountries {
		if strings.Contains(locationLower, strings.ToLower(country)) {
			return true
		}
	}
	return false
}

// validateArabicLocation validates that location is Arabic and not Iranian
func validateArabicLocation(location, fieldName string) bool {
	locationLower := strings.ToLower(strings.TrimSpace(location))

	// Check if Iranian (strict - reject immediately)
	if isIranianLocation(locationLower) {
		return false
	}

	// Check if contains Arabic country
	if !isArabicCountry(locationLower) {
		return false
	}

	return true
}
