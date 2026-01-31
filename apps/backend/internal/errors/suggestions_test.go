package errors

import (
	"errors"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

// =============================================================================
// SuggestedFix Tests
// =============================================================================

func TestSuggestedFix_ValidationError(t *testing.T) {
	tests := []struct {
		name       string
		field      string
		value      interface{}
		constraint string
		wantSubstr string
	}{
		{
			name:       "required field",
			field:      "username",
			constraint: "field is required",
			wantSubstr: "required",
		},
		{
			name:       "min/max range",
			field:      "port",
			value:      70000,
			constraint: "min 1, max 65535",
			wantSubstr: "range",
		},
		{
			name:       "format error",
			field:      "email",
			value:      "invalid",
			constraint: "invalid format",
			wantSubstr: "format",
		},
		{
			name:       "pattern error",
			field:      "hostname",
			value:      "invalid!host",
			constraint: "does not match pattern",
			wantSubstr: "pattern",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := NewValidationError(tt.field, tt.value, tt.constraint)
			fix := SuggestedFix(err)
			assert.Contains(t, fix, tt.wantSubstr)
			assert.Contains(t, fix, tt.field)
		})
	}
}

func TestSuggestedFix_ProtocolError(t *testing.T) {
	tests := []struct {
		name     string
		code     string
		protocol string
		wantStr  string
	}{
		{
			name:     "connection failed",
			code:     CodeConnectionFailed,
			protocol: "SSH",
			wantStr:  "SSH",
		},
		{
			name:     "connection timeout",
			code:     CodeConnectionTimeout,
			protocol: "API",
			wantStr:  "timed out",
		},
		{
			name:     "authentication failed",
			code:     CodeAuthenticationFailed,
			protocol: "REST",
			wantStr:  "password",
		},
		{
			name:     "all protocols failed",
			code:     CodeAllProtocolsFailed,
			protocol: "all",
			wantStr:  "All connection protocols failed",
		},
		{
			name:     "command failed",
			code:     CodeCommandFailed,
			protocol: "SSH",
			wantStr:  "permission",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := NewProtocolError(tt.code, "test message", tt.protocol)
			fix := SuggestedFix(err)
			assert.Contains(t, fix, tt.wantStr)
		})
	}
}

func TestSuggestedFix_AuthError(t *testing.T) {
	tests := []struct {
		name       string
		code       string
		required   string
		current    string
		wantSubstr string
	}{
		{
			name:       "auth failed",
			code:       CodeAuthFailed,
			wantSubstr: "credentials",
		},
		{
			name:       "insufficient permissions with levels",
			code:       CodeInsufficientPermissions,
			required:   "admin",
			current:    "operator",
			wantSubstr: "admin",
		},
		{
			name:       "session expired",
			code:       CodeSessionExpired,
			wantSubstr: "log in",
		},
		{
			name:       "invalid credentials",
			code:       CodeInvalidCredentials,
			wantSubstr: "username or password",
		},
		{
			name:       "access denied",
			code:       CodeAccessDenied,
			wantSubstr: "denied",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := NewAuthError(tt.code, "test")
			if tt.required != "" && tt.current != "" {
				err = err.WithPermissions(tt.required, tt.current)
			}
			fix := SuggestedFix(err)
			assert.Contains(t, fix, tt.wantSubstr)
		})
	}
}

func TestSuggestedFix_NetworkError(t *testing.T) {
	tests := []struct {
		name     string
		code     string
		host     string
		port     int
		wantStr  string
	}{
		{
			name:    "host unreachable",
			code:    CodeHostUnreachable,
			host:    "192.168.1.1",
			wantStr: "192.168.1.1",
		},
		{
			name:    "DNS resolution failed",
			code:    CodeDNSResolutionFailed,
			host:    "router.local",
			wantStr: "hostname",
		},
		{
			name:    "network timeout",
			code:    CodeNetworkTimeout,
			host:    "192.168.1.1",
			wantStr: "timeout",
		},
		{
			name:    "port closed with port number",
			code:    CodePortClosed,
			host:    "192.168.1.1",
			port:    8728,
			wantStr: "8728",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := NewNetworkError(tt.code, "test", tt.host)
			if tt.port > 0 {
				err = err.WithPort(tt.port)
			}
			fix := SuggestedFix(err)
			assert.Contains(t, fix, tt.wantStr)
		})
	}
}

func TestSuggestedFix_PlatformError(t *testing.T) {
	tests := []struct {
		name     string
		code     string
		platform string
		version  string
		wantStr  string
	}{
		{
			name:     "platform not supported",
			code:     CodePlatformNotSupported,
			platform: "openwrt",
			wantStr:  "openwrt",
		},
		{
			name:     "capability not available with version",
			code:     CodeCapabilityNotAvailable,
			platform: "mikrotik",
			version:  "6.39",
			wantStr:  "6.39",
		},
		{
			name:     "version too old",
			code:     CodeVersionTooOld,
			platform: "mikrotik",
			wantStr:  "upgrade",
		},
		{
			name:     "package missing",
			code:     CodePackageMissing,
			platform: "mikrotik",
			wantStr:  "package",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := NewPlatformError(tt.code, "test", tt.platform)
			if tt.version != "" {
				err = err.WithVersion(tt.version)
			}
			fix := SuggestedFix(err)
			assert.Contains(t, fix, tt.wantStr)
		})
	}
}

func TestSuggestedFix_ResourceError(t *testing.T) {
	tests := []struct {
		name         string
		code         string
		resourceType string
		resourceID   string
		state        string
		wantStr      string
	}{
		{
			name:         "resource not found",
			code:         CodeResourceNotFound,
			resourceType: "interface",
			resourceID:   "eth0",
			wantStr:      "eth0",
		},
		{
			name:         "resource locked",
			code:         CodeResourceLocked,
			resourceType: "vpn",
			resourceID:   "vpn-1",
			wantStr:      "locked",
		},
		{
			name:         "invalid state transition with state",
			code:         CodeInvalidStateTransition,
			resourceType: "connection",
			resourceID:   "conn-1",
			state:        "connecting",
			wantStr:      "connecting",
		},
		{
			name:         "dependency not ready",
			code:         CodeDependencyNotReady,
			resourceType: "feature",
			resourceID:   "tor",
			wantStr:      "prerequisite",
		},
		{
			name:         "resource busy",
			code:         CodeResourceBusy,
			resourceType: "router",
			resourceID:   "router-1",
			wantStr:      "busy",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := NewResourceError(tt.code, "test", tt.resourceType, tt.resourceID)
			if tt.state != "" {
				err = err.WithState(tt.state)
			}
			fix := SuggestedFix(err)
			assert.Contains(t, fix, tt.wantStr)
		})
	}
}

func TestSuggestedFix_InternalError(t *testing.T) {
	err := NewInternalError("database error", nil)
	fix := SuggestedFix(err)

	assert.Contains(t, fix, "internal error")
	assert.Contains(t, fix, "contact support")
}

func TestSuggestedFix_UnknownError(t *testing.T) {
	err := errors.New("random error")
	fix := SuggestedFix(err)

	assert.Contains(t, fix, "unexpected error")
}

// =============================================================================
// DocsURL Tests
// =============================================================================

func TestDocsURL_AllCategories(t *testing.T) {
	tests := []struct {
		code     string
		expected string
	}{
		{"P100", "https://docs.nasnet.io/errors/platform#p100"},
		{"P101", "https://docs.nasnet.io/errors/platform#p101"},
		{"R200", "https://docs.nasnet.io/errors/protocol#r200"},
		{"R201", "https://docs.nasnet.io/errors/protocol#r201"},
		{"N300", "https://docs.nasnet.io/errors/network#n300"},
		{"N301", "https://docs.nasnet.io/errors/network#n301"},
		{"V400", "https://docs.nasnet.io/errors/validation#v400"},
		{"V401", "https://docs.nasnet.io/errors/validation#v401"},
		{"A500", "https://docs.nasnet.io/errors/auth#a500"},
		{"A501", "https://docs.nasnet.io/errors/auth#a501"},
		{"S600", "https://docs.nasnet.io/errors/resource#s600"},
		{"S601", "https://docs.nasnet.io/errors/resource#s601"},
		{"I500", "https://docs.nasnet.io/errors/internal#i500"},
	}

	for _, tt := range tests {
		t.Run(tt.code, func(t *testing.T) {
			url := DocsURL(tt.code)
			assert.Equal(t, tt.expected, url)
		})
	}
}

func TestDocsURL_EmptyCode(t *testing.T) {
	url := DocsURL("")
	assert.Equal(t, "https://docs.nasnet.io/errors", url)
}

func TestDocsURL_UnknownCategory(t *testing.T) {
	url := DocsURL("X999")
	assert.Equal(t, "https://docs.nasnet.io/errors", url)
}

// =============================================================================
// TroubleshootingSteps Tests
// =============================================================================

func TestTroubleshootingSteps_ProtocolError(t *testing.T) {
	err := NewProtocolError(CodeConnectionFailed, "connection failed", "SSH")
	steps := TroubleshootingSteps(err.RouterError)

	assert.NotEmpty(t, steps)
	// Should include common troubleshooting steps
	hasRelevantStep := false
	for _, step := range steps {
		if containsAny(step, "router", "firewall", "API", "SSH") {
			hasRelevantStep = true
			break
		}
	}
	assert.True(t, hasRelevantStep, "Steps should mention router-related guidance")
}

func TestTroubleshootingSteps_NetworkError(t *testing.T) {
	err := NewNetworkError(CodeHostUnreachable, "host unreachable", "192.168.1.1")
	steps := TroubleshootingSteps(err.RouterError)

	assert.NotEmpty(t, steps)
	// Should mention network/connectivity
	hasNetworkStep := false
	for _, step := range steps {
		if containsAny(step, "network", "connectivity", "ping", "firewall") {
			hasNetworkStep = true
			break
		}
	}
	assert.True(t, hasNetworkStep, "Steps should mention network connectivity")
}

func TestTroubleshootingSteps_AuthError(t *testing.T) {
	err := NewAuthError(CodeSessionExpired, "session expired")
	steps := TroubleshootingSteps(err.RouterError)

	assert.NotEmpty(t, steps)
}

func TestTroubleshootingSteps_PlatformError(t *testing.T) {
	err := NewPlatformError(CodeVersionTooOld, "version too old", "mikrotik")
	steps := TroubleshootingSteps(err.RouterError)

	assert.NotEmpty(t, steps)
}

func TestTroubleshootingSteps_ValidationError(t *testing.T) {
	err := NewValidationError("field", "value", "constraint")
	steps := TroubleshootingSteps(err.RouterError)

	assert.NotEmpty(t, steps)
}

func TestTroubleshootingSteps_ResourceError(t *testing.T) {
	err := NewResourceError(CodeResourceLocked, "locked", "interface", "eth0")
	steps := TroubleshootingSteps(err.RouterError)

	assert.NotEmpty(t, steps)
}

func TestTroubleshootingSteps_InternalError(t *testing.T) {
	err := NewInternalError("internal error", nil)
	steps := TroubleshootingSteps(err.RouterError)

	assert.NotEmpty(t, steps)
	// Should mention contact support or request ID
	hasContactSupport := false
	for _, step := range steps {
		if containsAny(step, "support", "request ID", "try again") {
			hasContactSupport = true
			break
		}
	}
	assert.True(t, hasContactSupport)
}

func TestTroubleshootingSteps_UnknownError(t *testing.T) {
	err := errors.New("unknown error")
	steps := TroubleshootingSteps(err)

	assert.NotEmpty(t, steps)
}

// Helper function
func containsAny(s string, substrs ...string) bool {
	for _, substr := range substrs {
		if strings.Contains(s, substr) {
			return true
		}
	}
	return false
}
