package router

import (
	"backend/internal/network"
)

// ValidationError represents a field-level validation error.
type ValidationError struct {
	// Field is the field path that failed validation (e.g., "input.host").
	Field string

	// Code is the validation error code.
	Code string

	// Message is a human-readable error message.
	Message string

	// Suggestion provides guidance for fixing the error.
	Suggestion string

	// ProvidedValue is the invalid value (redacted for sensitive fields).
	ProvidedValue string
}

// Error implements the error interface.
func (e *ValidationError) Error() string {
	return e.Field + ": " + e.Message
}

// ValidationErrors is a collection of validation errors.
type ValidationErrors []*ValidationError

// Error implements the error interface.
func (e ValidationErrors) Error() string {
	if len(e) == 0 {
		return "no validation errors"
	}
	return e[0].Error()
}

// HasErrors returns true if there are any validation errors.
func (e ValidationErrors) HasErrors() bool {
	return len(e) > 0
}

// AddRouterInputValidator validates AddRouterInput fields.
type AddRouterInputValidator struct{}

// NewAddRouterInputValidator creates a new validator.
func NewAddRouterInputValidator() *AddRouterInputValidator {
	return &AddRouterInputValidator{}
}

// AddRouterInputData represents the input data to validate.
type AddRouterInputData struct {
	Host               string
	Port               *int
	Username           string
	Password           string
	ProtocolPreference *string
	Name               *string
}

// Validate validates all fields in the AddRouterInput.
func (v *AddRouterInputValidator) Validate(input AddRouterInputData) ValidationErrors {
	var errors ValidationErrors

	// Validate host
	if hostErr := v.validateHost(input.Host); hostErr != nil {
		errors = append(errors, hostErr)
	}

	// Validate port (if provided)
	if input.Port != nil {
		if portErr := v.validatePort(*input.Port); portErr != nil {
			errors = append(errors, portErr)
		}
	}

	// Validate username
	if usernameErr := v.validateUsername(input.Username); usernameErr != nil {
		errors = append(errors, usernameErr)
	}

	// Validate password
	if passwordErr := v.validatePassword(input.Password); passwordErr != nil {
		errors = append(errors, passwordErr)
	}

	// Validate protocol preference (if provided)
	if input.ProtocolPreference != nil {
		if protoErr := v.validateProtocolPreference(*input.ProtocolPreference); protoErr != nil {
			errors = append(errors, protoErr)
		}
	}

	// Validate name (if provided)
	if input.Name != nil {
		if nameErr := v.validateName(*input.Name); nameErr != nil {
			errors = append(errors, nameErr)
		}
	}

	return errors
}

// validateHost validates the host field (IP address or hostname).
func (v *AddRouterInputValidator) validateHost(host string) *ValidationError {
	if host == "" {
		return &ValidationError{
			Field:      "input.host",
			Code:       "REQUIRED",
			Message:    "Host is required",
			Suggestion: "Enter the router's IP address (e.g., 192.168.88.1) or hostname (e.g., router.local)",
		}
	}

	if len(host) > 253 {
		return &ValidationError{
			Field:      "input.host",
			Code:       "MAX_LENGTH",
			Message:    "Host must be 253 characters or less",
			Suggestion: "Shorten the hostname or use an IP address",
		}
	}

	// Check if it's a valid IP address
	if network.IsValidIP(host) {
		return nil // Valid IP
	}

	// Check if it's a valid hostname
	if !network.IsValidHostname(host) {
		return &ValidationError{
			Field:         "input.host",
			Code:          "INVALID_FORMAT",
			Message:       "Host must be a valid IP address or hostname",
			Suggestion:    "Use format: 192.168.88.1 (IP) or router.local (hostname)",
			ProvidedValue: truncateValue(host, 50),
		}
	}

	return nil
}

// validatePort validates the port field.
func (v *AddRouterInputValidator) validatePort(port int) *ValidationError {
	if port < 1 || port > 65535 {
		return &ValidationError{
			Field:         "input.port",
			Code:          "OUT_OF_RANGE",
			Message:       "Port must be between 1 and 65535",
			Suggestion:    "Common ports: 8728 (API), 8729 (API-SSL), 22 (SSH), 80/443 (REST)",
			ProvidedValue: intToString(port),
		}
	}
	return nil
}

// validateUsername validates the username field.
func (v *AddRouterInputValidator) validateUsername(username string) *ValidationError {
	if username == "" {
		return &ValidationError{
			Field:      "input.username",
			Code:       "REQUIRED",
			Message:    "Username is required",
			Suggestion: "Enter the RouterOS username (default is 'admin')",
		}
	}

	if len(username) > 64 {
		return &ValidationError{
			Field:         "input.username",
			Code:          "MAX_LENGTH",
			Message:       "Username must be 64 characters or less",
			Suggestion:    "Use a shorter username",
			ProvidedValue: truncateValue(username, 10) + "...",
		}
	}

	// Check for invalid characters
	for _, c := range username {
		if !isValidUsernameChar(c) {
			return &ValidationError{
				Field:         "input.username",
				Code:          "INVALID_CHARS",
				Message:       "Username contains invalid characters",
				Suggestion:    "Use only letters, numbers, underscores, and hyphens",
				ProvidedValue: truncateValue(username, 20),
			}
		}
	}

	return nil
}

// validatePassword validates the password field.
func (v *AddRouterInputValidator) validatePassword(password string) *ValidationError {
	if password == "" {
		return &ValidationError{
			Field:      "input.password",
			Code:       "REQUIRED",
			Message:    "Password is required",
			Suggestion: "Enter the RouterOS password for the specified user",
		}
	}

	// Note: RouterOS allows empty passwords, but we require one for security
	// No max length check as RouterOS can have long passwords

	return nil
}

// validateProtocolPreference validates the protocol preference field.
func (v *AddRouterInputValidator) validateProtocolPreference(pref string) *ValidationError {
	validPrefs := map[string]bool{
		"AUTO":    true,
		"REST":    true,
		"API":     true,
		"API_SSL": true,
		"SSH":     true,
		"TELNET":  true,
	}

	if !validPrefs[pref] {
		return &ValidationError{
			Field:         "input.protocolPreference",
			Code:          "INVALID_VALUE",
			Message:       "Invalid protocol preference",
			Suggestion:    "Use one of: AUTO, REST, API, API_SSL, SSH, TELNET",
			ProvidedValue: pref,
		}
	}

	return nil
}

// validateName validates the optional name field.
func (v *AddRouterInputValidator) validateName(name string) *ValidationError {
	if len(name) > 128 {
		return &ValidationError{
			Field:         "input.name",
			Code:          "MAX_LENGTH",
			Message:       "Name must be 128 characters or less",
			Suggestion:    "Use a shorter display name",
			ProvidedValue: truncateValue(name, 30) + "...",
		}
	}

	return nil
}

// isValidUsernameChar checks if a character is valid for usernames.
func isValidUsernameChar(c rune) bool {
	return (c >= 'a' && c <= 'z') ||
		(c >= 'A' && c <= 'Z') ||
		(c >= '0' && c <= '9') ||
		c == '_' ||
		c == '-' ||
		c == '.' ||
		c == '@' // For email-style usernames
}

// truncateValue truncates a value for display in errors.
func truncateValue(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen]
}

// intToString converts an int to string without importing strconv.
func intToString(i int) string {
	if i == 0 {
		return "0"
	}

	negative := false
	if i < 0 {
		negative = true
		i = -i
	}

	digits := ""
	for i > 0 {
		digit := byte('0' + i%10)
		digits = string(digit) + digits
		i /= 10
	}

	if negative {
		return "-" + digits
	}
	return digits
}

// ValidateHostFormat performs a quick host format validation without DNS lookup.
func ValidateHostFormat(host string) *ValidationError {
	validator := NewAddRouterInputValidator()
	return validator.validateHost(host)
}

// ValidatePortRange validates a port number.
func ValidatePortRange(port int) *ValidationError {
	validator := NewAddRouterInputValidator()
	return validator.validatePort(port)
}
