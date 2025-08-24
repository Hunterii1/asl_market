package config

import (
	"log"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	JWT      JWTConfig      `mapstructure:"jwt"`
	CORS     CORSConfig     `mapstructure:"cors"`
	OpenAI   OpenAIConfig   `mapstructure:"openai"`
	SMS      SMSConfig      `mapstructure:"sms"`
}

type ServerConfig struct {
	Port string `mapstructure:"port"`
	Host string `mapstructure:"host"`
}

type DatabaseConfig struct {
	Host     string `mapstructure:"host"`
	Port     string `mapstructure:"port"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
	Name     string `mapstructure:"name"`
}

type JWTConfig struct {
	Secret      string `mapstructure:"secret"`
	ExpiryHours int    `mapstructure:"expiry_hours"`
}

type CORSConfig struct {
	AllowedOrigins []string `mapstructure:"allowed_origins"`
	AllowedMethods []string `mapstructure:"allowed_methods"`
	AllowedHeaders []string `mapstructure:"allowed_headers"`
}

type OpenAIConfig struct {
	APIKey      string  `mapstructure:"api_key"`
	APIURL      string  `mapstructure:"api_url"`
	Model       string  `mapstructure:"model"`
	MaxTokens   int     `mapstructure:"max_tokens"`
	Temperature float64 `mapstructure:"temperature"`
}

type SMSConfig struct {
	APIKey                  string `mapstructure:"api_key"`
	Originator              string `mapstructure:"originator"`
	PatternCode             string `mapstructure:"pattern_code"`
	PasswordRecoveryPattern string `mapstructure:"password_recovery_pattern"`
}

var AppConfig *Config

func LoadConfig() {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("./config")
	viper.AddConfigPath(".")

	// Set default values
	viper.SetDefault("server.port", "8080")
	viper.SetDefault("server.host", "localhost")
	viper.SetDefault("jwt.secret", "default_secret_change_in_production")
	viper.SetDefault("jwt.expiry_hours", 24)
	viper.SetDefault("openai.api_url", "https://api.openai.com/v1/chat/completions")
	viper.SetDefault("openai.model", "gpt-3.5-turbo")
	viper.SetDefault("openai.max_tokens", 1000)
	viper.SetDefault("openai.temperature", 0.7)
	viper.SetDefault("sms.pattern_code", "9i276pvpwvuj40w")

	if err := viper.ReadInConfig(); err != nil {
		log.Printf("Error reading config file: %v", err)
	}

	AppConfig = &Config{}
	if err := viper.Unmarshal(AppConfig); err != nil {
		log.Fatalf("Unable to decode config: %v", err)
	}

	log.Println("Configuration loaded successfully")
}
