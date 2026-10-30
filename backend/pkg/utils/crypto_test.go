package utils

import (
	"regexp"
	"testing"
)

// The expected ID is what api.joinnasnet.com accepts for this system ID and secret.
func TestGenerateUserIDFromSystemID(t *testing.T) {
	got, err := GenerateUserID("ABCD-1234", "test-secret")
	if err != nil {
		t.Fatal(err)
	}
	if want := "6e6e7001-7631-6d6b-11f4-01ce39a48e5f"; got != want {
		t.Fatalf("GenerateUserID = %q, want %q", got, want)
	}
}

func TestGenerateUserIDWithoutSystemID(t *testing.T) {
	a, err := GenerateUserID("", "test-secret")
	if err != nil {
		t.Fatal(err)
	}
	b, err := GenerateUserID("", "test-secret")
	if err != nil {
		t.Fatal(err)
	}
	if !regexp.MustCompile(`^6e6e7001-7631-6d6b-[0-9a-f]{4}-[0-9a-f]{12}$`).MatchString(a) {
		t.Fatalf("GenerateUserID = %q, not in the user ID format", a)
	}
	if a == b {
		t.Fatalf("two IDs without a system ID are both %q, want random", a)
	}
}
