package middleware

import (
	"log"
	"net/http"
	"strings"

	"asl-market-backend/models"
	"asl-market-backend/utils"

	"github.com/gin-gonic/gin"
)

// DatabaseMiddleware adds database instance to gin context
func DatabaseMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set("db", models.GetDB())
		c.Next()
	}
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header is required",
			})
			c.Abort()
			return
		}

		// Check if it starts with "Bearer "
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid authorization header format",
			})
			c.Abort()
			return
		}

		// Extract token
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Token is required",
			})
			c.Abort()
			return
		}

		// Validate token
		claims, err := utils.ValidateToken(token)
		if err != nil {
			log.Printf("Token validation failed: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
			})
			c.Abort()
			return
		}

		// Get user from database
		db := models.GetDB()
		var user models.User
		if err := db.First(&user, claims.UserID).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "User not found",
			})
			c.Abort()
			return
		}

		// Set user information in context
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user", user)

		// Set user_role based on IsAdmin flag
		if user.IsAdmin {
			c.Set("user_role", "admin")
		} else {
			c.Set("user_role", "user")
		}

		c.Next()
	}
}

// OptionalAuthMiddleware - allows both authenticated and unauthenticated access
func OptionalAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		if strings.HasPrefix(authHeader, "Bearer ") {
			token := strings.TrimPrefix(authHeader, "Bearer ")
			if token != "" {
				claims, err := utils.ValidateToken(token)
				if err == nil {
					// Get user from database
					db := models.GetDB()
					var user models.User
					if err := db.First(&user, claims.UserID).Error; err == nil {
						c.Set("user_id", claims.UserID)
						c.Set("user_email", claims.Email)
						c.Set("user", user)

						// Set user_role based on IsAdmin flag
						if user.IsAdmin {
							c.Set("user_role", "admin")
						} else {
							c.Set("user_role", "user")
						}
					}
				}
			}
		}

		c.Next()
	}
}
