package config

import (
	"testing"
)

// AssertError checks if an error matches an expected message substring.
func AssertError(t *testing.T, err error, expectedMsg string) {
	t.Helper()
	if err == nil {
		t.Errorf("expected error containing %q, got nil", expectedMsg)
		return
	}
	if !stringContains(err.Error(), expectedMsg) {
		t.Errorf("expected error containing %q, got %v", expectedMsg, err)
	}
}

// AssertNoError checks if an error is nil.
func AssertNoError(t *testing.T, err error) {
	t.Helper()
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
}

// AssertEqual checks if two values are equal.
func AssertEqual[T comparable](t *testing.T, got, want T, msg string) {
	t.Helper()
	if got != want {
		t.Errorf("%s: got %v, want %v", msg, got, want)
	}
}

// AssertNotEqual checks if two values are not equal.
func AssertNotEqual[T comparable](t *testing.T, got, want T, msg string) {
	t.Helper()
	if got == want {
		t.Errorf("%s: got %v (unexpected), want something else", msg, got)
	}
}

// AssertStringContains checks if a string contains a substring.
func AssertStringContains(t *testing.T, str, substr string) {
	t.Helper()
	if !stringContains(str, substr) {
		t.Errorf("expected string to contain %q, got: %s", substr, str)
	}
}

// stringContains is a helper function for substring matching in tests.
func stringContains(s, substr string) bool {
	return len(s) >= len(substr) && (substr == s || findSubstring(s, substr))
}

// findSubstring finds a substring in a string using a simple linear search.
func findSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
