package utils

import (
	"errors"
	"time"

	"asl-market-backend/config"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// AffiliateClaims for affiliate panel JWT
type AffiliateClaims struct {
	AffiliateID uint   `json:"affiliate_id"`
	Username    string `json:"username"`
	jwt.RegisteredClaims
}

func GenerateToken(userID uint, email string) (string, error) {
	expirationTime := time.Now().Add(time.Hour * time.Duration(config.AppConfig.JWT.ExpiryHours))

	claims := &Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.AppConfig.JWT.Secret))
}

func ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.AppConfig.JWT.Secret), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

// GenerateAffiliateToken creates JWT for affiliate panel
func GenerateAffiliateToken(affiliateID uint, username string) (string, error) {
	expirationTime := time.Now().Add(time.Hour * time.Duration(config.AppConfig.JWT.ExpiryHours))
	claims := &AffiliateClaims{
		AffiliateID: affiliateID,
		Username:    username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.AppConfig.JWT.Secret))
}

// ValidateAffiliateToken parses and validates affiliate JWT
func ValidateAffiliateToken(tokenString string) (*AffiliateClaims, error) {
	claims := &AffiliateClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.AppConfig.JWT.Secret), nil
	})
	if err != nil {
		return nil, err
	}
	if !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
