package mikrotik

// TruncateForLog truncates a string for safe logging output.
func TruncateForLog(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}
