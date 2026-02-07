package oui

import (
	"testing"
)

func TestExtractOUI(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"Colon format", "AA:BB:CC:DD:EE:FF", "AABBCC"},
		{"Dash format", "AA-BB-CC-DD-EE-FF", "AABBCC"},
		{"No separator", "AABBCCDDEEFF", "AABBCC"},
		{"Lowercase", "aa:bb:cc:dd:ee:ff", "AABBCC"},
		{"Mixed case", "Aa:Bb:Cc:Dd:Ee:Ff", "AABBCC"},
		{"Short MAC", "AA:BB", ""},
		{"Invalid format", "ZZZZ", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := extractOUI(tt.input)
			if result != tt.expected {
				t.Errorf("extractOUI(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestOUIDatabase_Lookup(t *testing.T) {
	db := GetDatabase()

	tests := []struct {
		name          string
		mac           string
		expectFound   bool
		expectVendor  string
		vendorContains string
	}{
		{
			name:           "Apple MAC (colons)",
			mac:            "A4:83:E7:12:34:56",
			expectFound:    true,
			vendorContains: "Apple",
		},
		{
			name:           "Apple MAC (dashes)",
			mac:            "A4-83-E7-12-34-56",
			expectFound:    true,
			vendorContains: "Apple",
		},
		{
			name:           "Apple MAC (no separator)",
			mac:            "A483E7123456",
			expectFound:    true,
			vendorContains: "Apple",
		},
		{
			name:           "Samsung MAC",
			mac:            "00:00:F0:12:34:56",
			expectFound:    true,
			vendorContains: "Samsung",
		},
		{
			name:           "Google MAC",
			mac:            "3C:5A:B4:12:34:56",
			expectFound:    true,
			vendorContains: "Google",
		},
		{
			name:           "Raspberry Pi MAC",
			mac:            "B8:27:EB:12:34:56",
			expectFound:    true,
			vendorContains: "Raspberry Pi",
		},
		{
			name:           "Espressif MAC",
			mac:            "24:0A:C4:12:34:56",
			expectFound:    true,
			vendorContains: "Espressif",
		},
		{
			name:        "Unknown MAC",
			mac:         "FF:FF:FF:12:34:56",
			expectFound: false,
		},
		{
			name:        "Invalid MAC (too short)",
			mac:         "AA:BB",
			expectFound: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			vendor, found := db.Lookup(tt.mac)

			if found != tt.expectFound {
				t.Errorf("Lookup(%q) found = %v, want %v", tt.mac, found, tt.expectFound)
			}

			if tt.expectFound && tt.vendorContains != "" {
				if !contains(vendor, tt.vendorContains) {
					t.Errorf("Lookup(%q) vendor = %q, should contain %q", tt.mac, vendor, tt.vendorContains)
				}
			}
		})
	}
}

func TestOUIDatabase_LookupBatch(t *testing.T) {
	db := GetDatabase()

	macs := []string{
		"A4:83:E7:12:34:56", // Apple
		"00:00:F0:12:34:56", // Samsung
		"FF:FF:FF:12:34:56", // Unknown
		"3C:5A:B4:12:34:56", // Google
	}

	results := db.LookupBatch(macs)

	// Should find 3 out of 4
	if len(results) != 3 {
		t.Errorf("LookupBatch() returned %d results, want 3", len(results))
	}

	// Check Apple found
	if vendor, ok := results["A4:83:E7:12:34:56"]; !ok || !contains(vendor, "Apple") {
		t.Errorf("Apple MAC not found in batch results")
	}

	// Check Samsung found
	if vendor, ok := results["00:00:F0:12:34:56"]; !ok || !contains(vendor, "Samsung") {
		t.Errorf("Samsung MAC not found in batch results")
	}

	// Check unknown NOT found
	if _, ok := results["FF:FF:FF:12:34:56"]; ok {
		t.Errorf("Unknown MAC should not be in batch results")
	}
}

func TestOUIDatabase_Size(t *testing.T) {
	db := GetDatabase()
	size := db.Size()

	// We should have loaded entries from the embedded database
	if size == 0 {
		t.Error("Database size is 0, expected entries to be loaded")
	}

	// Should have at least 100 entries (we know we have more)
	if size < 100 {
		t.Errorf("Database size = %d, expected at least 100 entries", size)
	}

	t.Logf("Database loaded %d OUI entries", size)
}

func TestNormalizeMAC(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"Already normalized", "AA:BB:CC:DD:EE:FF", "AA:BB:CC:DD:EE:FF"},
		{"Dash format", "AA-BB-CC-DD-EE-FF", "AA:BB:CC:DD:EE:FF"},
		{"No separator", "AABBCCDDEEFF", "AA:BB:CC:DD:EE:FF"},
		{"Lowercase", "aabbccddeeff", "AA:BB:CC:DD:EE:FF"},
		{"Invalid length", "AABBCC", "AABBCC"}, // Returns original
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := normalizeMAC(tt.input)
			if result != tt.expected {
				t.Errorf("normalizeMAC(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

// Helper function
func contains(s, substr string) bool {
	return len(s) > 0 && len(substr) > 0 && (s == substr || len(s) >= len(substr) && s[:len(substr)] == substr || stringContains(s, substr))
}

func stringContains(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
