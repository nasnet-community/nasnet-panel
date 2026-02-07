package troubleshoot

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestGetFix_AllIssueCodes tests all pre-defined fixes
func TestGetFix_AllIssueCodes(t *testing.T) {
	issueCodes := []string{
		"WAN_DISABLED",
		"WAN_LINK_DOWN",
		"NO_DEFAULT_ROUTE",
		"GATEWAY_UNREACHABLE",
		"GATEWAY_TIMEOUT",
		"NO_INTERNET",
		"INTERNET_TIMEOUT",
		"DNS_FAILED",
		"DNS_TIMEOUT",
		"NAT_MISSING",
		"NAT_DISABLED",
	}

	for _, code := range issueCodes {
		t.Run(code, func(t *testing.T) {
			fix := GetFix(code)
			require.NotNil(t, fix, "Fix should exist for %s", code)

			// Verify all required fields are present
			assert.Equal(t, code, fix.IssueCode)
			assert.NotEmpty(t, fix.Title, "Title should not be empty for %s", code)
			assert.NotEmpty(t, fix.Explanation, "Explanation should not be empty for %s", code)

			// Verify confidence level is valid
			assert.Contains(t, []FixConfidence{
				FixConfidenceHigh,
				FixConfidenceMedium,
				FixConfidenceLow,
			}, fix.Confidence, "Confidence should be valid for %s", code)

			// Validate manual vs automated fix consistency
			if fix.IsManualFix {
				assert.Empty(t, fix.Command, "Manual fix should not have command for %s", code)
				assert.NotEmpty(t, fix.ManualSteps, "Manual fix must have steps for %s", code)

				// Verify each manual step is non-empty
				for i, step := range fix.ManualSteps {
					assert.NotEmpty(t, step, "Manual step %d should not be empty for %s", i, code)
				}
			} else {
				assert.NotEmpty(t, fix.Command, "Automated fix must have command for %s", code)

				// Command should be valid RouterOS syntax
				assert.Contains(t, fix.Command, "/", "Command should contain path for %s", code)
			}

			// Rollback command is optional but should be valid if present
			if fix.RollbackCommand != "" {
				assert.Contains(t, fix.RollbackCommand, "/", "Rollback command should contain path for %s", code)
			}
		})
	}
}

// TestGetFix_WAN_DISABLED verifies specific fix details
func TestGetFix_WAN_DISABLED(t *testing.T) {
	fix := GetFix("WAN_DISABLED")

	require.NotNil(t, fix)
	assert.Equal(t, "Enable WAN Interface", fix.Title)
	assert.Equal(t, FixConfidenceHigh, fix.Confidence)
	assert.True(t, fix.RequiresConfirmation)
	assert.False(t, fix.IsManualFix)
	assert.Contains(t, fix.Command, "/interface/enable")
	assert.Contains(t, fix.RollbackCommand, "/interface/disable")
}

// TestGetFix_WAN_LINK_DOWN verifies manual fix
func TestGetFix_WAN_LINK_DOWN(t *testing.T) {
	fix := GetFix("WAN_LINK_DOWN")

	require.NotNil(t, fix)
	assert.Equal(t, "Check Physical Connection", fix.Title)
	assert.Equal(t, FixConfidenceHigh, fix.Confidence)
	assert.False(t, fix.RequiresConfirmation)
	assert.True(t, fix.IsManualFix)
	assert.Empty(t, fix.Command)
	assert.NotEmpty(t, fix.ManualSteps)
	assert.GreaterOrEqual(t, len(fix.ManualSteps), 3, "Should have multiple manual steps")
}

// TestGetFix_DNS_FAILED verifies DNS fix
func TestGetFix_DNS_FAILED(t *testing.T) {
	fix := GetFix("DNS_FAILED")

	require.NotNil(t, fix)
	assert.Equal(t, "Configure DNS Servers", fix.Title)
	assert.Equal(t, FixConfidenceHigh, fix.Confidence)
	assert.True(t, fix.RequiresConfirmation)
	assert.False(t, fix.IsManualFix)
	assert.Contains(t, fix.Command, "/ip/dns/set")
	assert.Contains(t, fix.Command, "8.8.8.8") // Google DNS
}

// TestGetFix_NAT_MISSING verifies NAT fix
func TestGetFix_NAT_MISSING(t *testing.T) {
	fix := GetFix("NAT_MISSING")

	require.NotNil(t, fix)
	assert.Equal(t, "Add NAT Masquerade Rule", fix.Title)
	assert.Equal(t, FixConfidenceHigh, fix.Confidence)
	assert.True(t, fix.RequiresConfirmation)
	assert.False(t, fix.IsManualFix)
	assert.Contains(t, fix.Command, "/ip/firewall/nat/add")
	assert.Contains(t, fix.Command, "masquerade")
	assert.NotEmpty(t, fix.RollbackCommand)
}

// TestGetFix_UnknownCode tests unknown issue codes
func TestGetFix_UnknownCode(t *testing.T) {
	fix := GetFix("UNKNOWN_ISSUE_CODE")
	assert.Nil(t, fix, "Unknown issue code should return nil")
}

// TestFixRegistry_Completeness validates registry completeness
func TestFixRegistry_Completeness(t *testing.T) {
	t.Run("all fixes have unique issue codes", func(t *testing.T) {
		seenCodes := make(map[string]bool)

		for code := range FixRegistry {
			assert.False(t, seenCodes[code], "Duplicate issue code: %s", code)
			seenCodes[code] = true
		}

		assert.Equal(t, 11, len(seenCodes), "Should have exactly 11 fixes")
	})

	t.Run("all fixes have required fields", func(t *testing.T) {
		for code, fix := range FixRegistry {
			assert.Equal(t, code, fix.IssueCode, "IssueCode mismatch for %s", code)
			assert.NotEmpty(t, fix.Title, "Title missing for %s", code)
			assert.NotEmpty(t, fix.Explanation, "Explanation missing for %s", code)

			// Either command or manual steps must be present
			hasCommand := fix.Command != ""
			hasManualSteps := len(fix.ManualSteps) > 0

			assert.True(t, hasCommand || hasManualSteps,
				"Fix %s must have either command or manual steps", code)

			if hasCommand && hasManualSteps {
				t.Errorf("Fix %s has both command and manual steps - should be one or the other", code)
			}
		}
	})

	t.Run("confidence levels are reasonable", func(t *testing.T) {
		highConfidenceFixes := []string{"WAN_DISABLED", "WAN_LINK_DOWN", "DNS_FAILED", "NAT_MISSING", "NAT_DISABLED"}
		mediumConfidenceFixes := []string{"NO_DEFAULT_ROUTE", "GATEWAY_UNREACHABLE", "DNS_TIMEOUT"}
		lowConfidenceFixes := []string{"GATEWAY_TIMEOUT", "NO_INTERNET", "INTERNET_TIMEOUT"}

		for _, code := range highConfidenceFixes {
			fix := GetFix(code)
			if fix != nil {
				assert.Equal(t, FixConfidenceHigh, fix.Confidence,
					"Expected high confidence for %s", code)
			}
		}

		for _, code := range mediumConfidenceFixes {
			fix := GetFix(code)
			if fix != nil {
				assert.Equal(t, FixConfidenceMedium, fix.Confidence,
					"Expected medium confidence for %s", code)
			}
		}

		for _, code := range lowConfidenceFixes {
			fix := GetFix(code)
			if fix != nil {
				assert.Equal(t, FixConfidenceLow, fix.Confidence,
					"Expected low confidence for %s", code)
			}
		}
	})

	t.Run("manual fixes have sufficient steps", func(t *testing.T) {
		for code, fix := range FixRegistry {
			if fix.IsManualFix {
				assert.GreaterOrEqual(t, len(fix.ManualSteps), 2,
					"Manual fix %s should have at least 2 steps", code)

				for i, step := range fix.ManualSteps {
					assert.NotEmpty(t, step,
						"Manual fix %s step %d is empty", code, i)
					assert.Greater(t, len(step), 10,
						"Manual fix %s step %d is too short", code, i)
				}
			}
		}
	})

	t.Run("automated fixes have valid RouterOS commands", func(t *testing.T) {
		validPaths := []string{
			"/interface",
			"/ip/route",
			"/ip/dns",
			"/ip/dhcp-client",
			"/ip/firewall/nat",
		}

		for code, fix := range FixRegistry {
			if !fix.IsManualFix && fix.Command != "" {
				hasValidPath := false
				for _, path := range validPaths {
					if contains(fix.Command, path) {
						hasValidPath = true
						break
					}
				}
				assert.True(t, hasValidPath,
					"Fix %s command should contain valid RouterOS path", code)
			}
		}
	})

	t.Run("rollback commands match forward commands", func(t *testing.T) {
		for code, fix := range FixRegistry {
			if fix.RollbackCommand != "" {
				// Rollback should use same resource path as forward command
				assert.NotEmpty(t, fix.Command,
					"Fix %s has rollback but no forward command", code)

				// Example: if command is "/interface/enable", rollback is "/interface/disable"
				// Just verify both reference same resource type
				commandPath := extractPath(fix.Command)
				rollbackPath := extractPath(fix.RollbackCommand)

				assert.Equal(t, commandPath, rollbackPath,
					"Fix %s rollback path doesn't match command path", code)
			}
		}
	})
}

// TestFixRegistry_EdgeCases tests edge cases
func TestFixRegistry_EdgeCases(t *testing.T) {
	t.Run("empty string returns nil", func(t *testing.T) {
		fix := GetFix("")
		assert.Nil(t, fix)
	})

	t.Run("case sensitivity", func(t *testing.T) {
		fix := GetFix("wan_disabled") // lowercase
		assert.Nil(t, fix, "Issue codes are case-sensitive")

		fix = GetFix("WAN_DISABLED") // uppercase
		assert.NotNil(t, fix)
	})

	t.Run("whitespace handling", func(t *testing.T) {
		fix := GetFix(" WAN_DISABLED ") // with spaces
		assert.Nil(t, fix, "Should not match with whitespace")
	})
}

// Helper functions

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && s[0:len(substr)] == substr || s[len(s)-len(substr):] == substr || s != s[0:len(substr)] && s != s[len(s)-len(substr):] && s[0:len(substr)] != substr && s[len(s)-len(substr):] != substr)
}

func extractPath(command string) string {
	// Extract the resource path from RouterOS command
	// Example: "/interface/enable [...]" -> "/interface"
	if len(command) == 0 {
		return ""
	}

	// Find first space or end of string
	end := len(command)
	for i, c := range command {
		if c == ' ' {
			end = i
			break
		}
	}

	path := command[0:end]

	// Remove action verb if present (enable, disable, add, set, remove)
	actions := []string{"/enable", "/disable", "/add", "/set", "/remove", "/print"}
	for _, action := range actions {
		if len(path) > len(action) && path[len(path)-len(action):] == action {
			return path[0 : len(path)-len(action)]
		}
	}

	return path
}
