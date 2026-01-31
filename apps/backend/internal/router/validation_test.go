package router

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAddRouterInputValidator_ValidateHost(t *testing.T) {
	validator := NewAddRouterInputValidator()

	tests := []struct {
		name      string
		host      string
		wantError bool
		errorCode string
	}{
		// Valid cases
		{"valid IPv4", "192.168.88.1", false, ""},
		{"valid IPv4 all zeros", "0.0.0.0", false, ""},
		{"valid IPv4 broadcast", "255.255.255.255", false, ""},
		{"valid IPv6 localhost", "::1", false, ""},
		{"valid IPv6", "fe80::1", false, ""},
		{"valid hostname simple", "router", false, ""},
		{"valid hostname with dot", "router.local", false, ""},
		{"valid hostname with subdomain", "mikrotik.router.local", false, ""},
		{"valid hostname with hyphen", "my-router", false, ""},
		{"valid hostname with number", "router1", false, ""},

		// Invalid cases
		{"empty", "", true, "REQUIRED"},
		{"invalid IP", "192.168.1.256", true, "INVALID_FORMAT"},
		{"invalid hostname starts with hyphen", "-router", true, "INVALID_FORMAT"},
		{"invalid hostname ends with hyphen", "router-", true, "INVALID_FORMAT"},
		{"invalid hostname with underscore", "my_router", true, "INVALID_FORMAT"},
		{"invalid hostname with space", "my router", true, "INVALID_FORMAT"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validator.validateHost(tt.host)
			if tt.wantError {
				require.NotNil(t, err, "expected error for host %q", tt.host)
				assert.Equal(t, tt.errorCode, err.Code)
			} else {
				assert.Nil(t, err, "unexpected error for host %q: %v", tt.host, err)
			}
		})
	}
}

func TestAddRouterInputValidator_ValidatePort(t *testing.T) {
	validator := NewAddRouterInputValidator()

	tests := []struct {
		name      string
		port      int
		wantError bool
	}{
		{"valid port 1", 1, false},
		{"valid port 22 (SSH)", 22, false},
		{"valid port 80 (HTTP)", 80, false},
		{"valid port 443 (HTTPS)", 443, false},
		{"valid port 8728 (API)", 8728, false},
		{"valid port 8729 (API-SSL)", 8729, false},
		{"valid port 65535", 65535, false},

		{"invalid port 0", 0, true},
		{"invalid port negative", -1, true},
		{"invalid port too high", 65536, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validator.validatePort(tt.port)
			if tt.wantError {
				require.NotNil(t, err)
				assert.Equal(t, "OUT_OF_RANGE", err.Code)
			} else {
				assert.Nil(t, err)
			}
		})
	}
}

func TestAddRouterInputValidator_ValidateUsername(t *testing.T) {
	validator := NewAddRouterInputValidator()

	tests := []struct {
		name      string
		username  string
		wantError bool
		errorCode string
	}{
		// Valid cases
		{"valid admin", "admin", false, ""},
		{"valid with underscore", "admin_user", false, ""},
		{"valid with hyphen", "admin-user", false, ""},
		{"valid with dot", "admin.user", false, ""},
		{"valid with at", "admin@domain", false, ""},
		{"valid numbers", "admin123", false, ""},
		{"valid single char", "a", false, ""},

		// Invalid cases
		{"empty", "", true, "REQUIRED"},
		{"too long", string(make([]byte, 65)), true, "MAX_LENGTH"},
		{"invalid char space", "admin user", true, "INVALID_CHARS"},
		{"invalid char special", "admin$user", true, "INVALID_CHARS"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validator.validateUsername(tt.username)
			if tt.wantError {
				require.NotNil(t, err)
				assert.Equal(t, tt.errorCode, err.Code)
			} else {
				assert.Nil(t, err)
			}
		})
	}
}

func TestAddRouterInputValidator_ValidatePassword(t *testing.T) {
	validator := NewAddRouterInputValidator()

	tests := []struct {
		name      string
		password  string
		wantError bool
	}{
		{"valid simple", "password123", false},
		{"valid with special chars", "p@ssw0rd!", false},
		{"valid long", string(make([]byte, 1000)), false},
		{"valid single char", "a", false},

		{"invalid empty", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validator.validatePassword(tt.password)
			if tt.wantError {
				require.NotNil(t, err)
				assert.Equal(t, "REQUIRED", err.Code)
			} else {
				assert.Nil(t, err)
			}
		})
	}
}

func TestAddRouterInputValidator_ValidateProtocolPreference(t *testing.T) {
	validator := NewAddRouterInputValidator()

	tests := []struct {
		pref      string
		wantError bool
	}{
		{"AUTO", false},
		{"REST", false},
		{"API", false},
		{"API_SSL", false},
		{"SSH", false},
		{"TELNET", false},

		{"", true},
		{"INVALID", true},
		{"auto", true}, // Case sensitive
		{"rest", true},
	}

	for _, tt := range tests {
		t.Run(tt.pref, func(t *testing.T) {
			err := validator.validateProtocolPreference(tt.pref)
			if tt.wantError {
				require.NotNil(t, err)
			} else {
				assert.Nil(t, err)
			}
		})
	}
}

func TestAddRouterInputValidator_ValidateName(t *testing.T) {
	validator := NewAddRouterInputValidator()

	tests := []struct {
		name      string
		input     string
		wantError bool
	}{
		{"valid simple", "My Router", false},
		{"valid with special chars", "Router @home #1", false},
		{"valid max length", string(make([]byte, 128)), false},

		{"too long", string(make([]byte, 129)), true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validator.validateName(tt.input)
			if tt.wantError {
				require.NotNil(t, err)
			} else {
				assert.Nil(t, err)
			}
		})
	}
}

func TestAddRouterInputValidator_Validate(t *testing.T) {
	validator := NewAddRouterInputValidator()

	t.Run("valid complete input", func(t *testing.T) {
		port := 8728
		pref := "AUTO"
		name := "Home Router"

		errs := validator.Validate(AddRouterInputData{
			Host:               "192.168.88.1",
			Port:               &port,
			Username:           "admin",
			Password:           "secret",
			ProtocolPreference: &pref,
			Name:               &name,
		})

		assert.False(t, errs.HasErrors())
	})

	t.Run("valid minimal input", func(t *testing.T) {
		errs := validator.Validate(AddRouterInputData{
			Host:     "192.168.88.1",
			Username: "admin",
			Password: "secret",
		})

		assert.False(t, errs.HasErrors())
	})

	t.Run("multiple validation errors", func(t *testing.T) {
		invalidPort := -1

		errs := validator.Validate(AddRouterInputData{
			Host:     "",         // Invalid
			Port:     &invalidPort, // Invalid
			Username: "",         // Invalid
			Password: "",         // Invalid
		})

		assert.True(t, errs.HasErrors())
		assert.GreaterOrEqual(t, len(errs), 4)
	})
}

func TestValidationError_Error(t *testing.T) {
	err := &ValidationError{
		Field:   "input.host",
		Message: "Host is required",
	}

	assert.Contains(t, err.Error(), "input.host")
	assert.Contains(t, err.Error(), "Host is required")
}

func TestValidationErrors_Error(t *testing.T) {
	t.Run("empty errors", func(t *testing.T) {
		errs := ValidationErrors{}
		assert.Equal(t, "no validation errors", errs.Error())
	})

	t.Run("with errors", func(t *testing.T) {
		errs := ValidationErrors{
			{Field: "input.host", Message: "Host is required"},
			{Field: "input.username", Message: "Username is required"},
		}
		assert.Contains(t, errs.Error(), "Host is required")
	})
}

func TestIntToString(t *testing.T) {
	tests := []struct {
		input    int
		expected string
	}{
		{0, "0"},
		{1, "1"},
		{42, "42"},
		{8728, "8728"},
		{65535, "65535"},
		{-1, "-1"},
		{-42, "-42"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			result := intToString(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestTruncateValue(t *testing.T) {
	tests := []struct {
		input    string
		maxLen   int
		expected string
	}{
		{"hello", 10, "hello"},
		{"hello", 5, "hello"},
		{"hello world", 5, "hello"},
		{"", 5, ""},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := truncateValue(tt.input, tt.maxLen)
			assert.Equal(t, tt.expected, result)
		})
	}
}
