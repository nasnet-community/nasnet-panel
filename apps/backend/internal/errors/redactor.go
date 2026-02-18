package errors

import (
	"regexp"
	"strings"
)

const redactedValue = "[REDACTED]"

// sensitivePatterns contains regex patterns for sensitive data detection.
var sensitivePatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)password`),
	regexp.MustCompile(`(?i)passwd`),
	regexp.MustCompile(`(?i)secret`),
	regexp.MustCompile(`(?i)token`),
	regexp.MustCompile(`(?i)api[_-]?key`),
	regexp.MustCompile(`(?i)apikey`),
	regexp.MustCompile(`(?i)credential`),
	regexp.MustCompile(`(?i)authorization`),
	regexp.MustCompile(`(?i)bearer`),
	regexp.MustCompile(`(?i)private[_-]?key`),
	regexp.MustCompile(`(?i)ssh[_-]?key`),
	regexp.MustCompile(`(?i)access[_-]?token`),
	regexp.MustCompile(`(?i)refresh[_-]?token`),
	regexp.MustCompile(`(?i)session[_-]?id`),
	regexp.MustCompile(`(?i)cookie`),
	regexp.MustCompile(`(?i)auth[_-]?code`),
	regexp.MustCompile(`(?i)auth[_-]?header`),
	regexp.MustCompile(`(?i)client[_-]?secret`),
}

// sensitiveValuePatterns detect sensitive values by their format.
var sensitiveValuePatterns = []*regexp.Regexp{
	// JWT tokens (header.payload.signature)
	regexp.MustCompile(`^eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*$`),
	// Bearer tokens
	regexp.MustCompile(`^Bearer\s+.+`),
	// API keys (common formats)
	regexp.MustCompile(`^sk-[A-Za-z0-9]{32,}$`),      // OpenAI style
	regexp.MustCompile(`^[A-Za-z0-9]{32,64}$`),       // Generic long alphanumeric
	regexp.MustCompile(`^[A-Fa-f0-9]{64}$`),          // SHA256 hash
	regexp.MustCompile(`^[A-Za-z0-9+/]{40,}={0,2}$`), // Base64 encoded
}

// IsSensitiveKey checks if a key name indicates sensitive data.
func IsSensitiveKey(key string) bool {
	lowerKey := strings.ToLower(key)
	for _, pattern := range sensitivePatterns {
		if pattern.MatchString(lowerKey) {
			return true
		}
	}
	return false
}

// IsSensitiveValue checks if a value looks like sensitive data.
func IsSensitiveValue(value string) bool {
	for _, pattern := range sensitiveValuePatterns {
		if pattern.MatchString(value) {
			return true
		}
	}
	return false
}

// RedactString redacts a string value if it appears sensitive.
func RedactString(key, value string) string {
	if IsSensitiveKey(key) || IsSensitiveValue(value) {
		return redactedValue
	}
	return value
}

// RedactMap recursively redacts sensitive values in a map.
func RedactMap(data map[string]interface{}) map[string]interface{} {
	if data == nil {
		return nil
	}

	result := make(map[string]interface{}, len(data))
	for key, value := range data {
		result[key] = redactValue(key, value)
	}
	return result
}

// redactValue redacts a value based on its key and type.
func redactValue(key string, value interface{}) interface{} {
	if IsSensitiveKey(key) {
		return redactedValue
	}

	switch v := value.(type) {
	case string:
		if IsSensitiveValue(v) {
			return redactedValue
		}
		return v
	case map[string]interface{}:
		return RedactMap(v)
	case []interface{}:
		result := make([]interface{}, len(v))
		for i, item := range v {
			result[i] = redactValue("", item)
		}
		return result
	default:
		return v
	}
}

// Redactor provides configurable sensitive data redaction.
type Redactor struct {
	additionalPatterns []*regexp.Regexp
	allowedKeys        map[string]bool
}

// NewRedactor creates a new Redactor with optional configuration.
func NewRedactor() *Redactor {
	return &Redactor{
		additionalPatterns: make([]*regexp.Regexp, 0),
		allowedKeys:        make(map[string]bool),
	}
}

// AddPattern adds a custom sensitive pattern.
func (r *Redactor) AddPattern(pattern string) error {
	compiled, err := regexp.Compile(pattern)
	if err != nil {
		return err
	}
	r.additionalPatterns = append(r.additionalPatterns, compiled)
	return nil
}

// AllowKey marks a key as safe (won't be redacted even if it matches patterns).
func (r *Redactor) AllowKey(key string) {
	r.allowedKeys[strings.ToLower(key)] = true
}

// IsSensitive checks if a key is sensitive with custom patterns.
func (r *Redactor) IsSensitive(key string) bool {
	lowerKey := strings.ToLower(key)

	// Check allowed keys first
	if r.allowedKeys[lowerKey] {
		return false
	}

	// Check default patterns
	if IsSensitiveKey(key) {
		return true
	}

	// Check additional patterns
	for _, pattern := range r.additionalPatterns {
		if pattern.MatchString(lowerKey) {
			return true
		}
	}

	return false
}

// Redact redacts sensitive values in a map using custom rules.
func (r *Redactor) Redact(data map[string]interface{}) map[string]interface{} {
	if data == nil {
		return nil
	}

	result := make(map[string]interface{}, len(data))
	for key, value := range data {
		result[key] = r.redactValue(key, value)
	}
	return result
}

func (r *Redactor) redactValue(key string, value interface{}) interface{} {
	if r.IsSensitive(key) {
		return redactedValue
	}

	switch v := value.(type) {
	case string:
		if IsSensitiveValue(v) {
			return redactedValue
		}
		return v
	case map[string]interface{}:
		return r.Redact(v)
	case []interface{}:
		result := make([]interface{}, len(v))
		for i, item := range v {
			result[i] = r.redactValue("", item)
		}
		return result
	default:
		return v
	}
}

// RedactError returns a copy of a RouterError with sensitive context redacted.
func RedactError(err *RouterError) *RouterError {
	if err == nil {
		return nil
	}

	newErr := *err
	newErr.Context = RedactMap(err.Context)
	return &newErr
}

// RedactErrorForProduction strips internal details for production responses.
// Internal errors get generic messages; other errors have context redacted.
func RedactErrorForProduction(err *RouterError, requestID string) *RouterError {
	if err == nil {
		return nil
	}

	// For internal errors, return a generic message
	if err.Category == CategoryInternal {
		return &RouterError{
			Code:        err.Code,
			Category:    err.Category,
			Message:     "An internal error occurred. Please try again later.",
			Recoverable: false,
			Context: map[string]interface{}{
				"requestId": requestID,
			},
		}
	}

	// For other errors, redact sensitive data but keep useful info
	newErr := *err
	newErr.Context = RedactMap(err.Context)

	// Ensure requestId is always present
	if newErr.Context == nil {
		newErr.Context = make(map[string]interface{})
	}
	newErr.Context["requestId"] = requestID

	// Don't expose the underlying cause in production
	newErr.Cause = nil

	return &newErr
}
