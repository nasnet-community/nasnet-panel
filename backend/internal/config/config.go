package config

import (
	"os"
)

type Config struct {
	Port        string
	Host        string
	Environment string
}

func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8080"),
		Host:        getEnv("HOST", "0.0.0.0"),
		Environment: getEnv("ENVIRONMENT", "development"),
	}
}

// IsProduction reports whether the ENVIRONMENT env var is set to "production".
func IsProduction() bool {
	return os.Getenv("ENVIRONMENT") == "production"
}

func getEnv(key, defaultVal string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultVal
}
