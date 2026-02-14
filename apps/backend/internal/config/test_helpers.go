package config

import "strings"

// stringContains checks if a string contains a substring - test helper
func stringContains(s, substr string) bool {
	return strings.Contains(s, substr)
}
