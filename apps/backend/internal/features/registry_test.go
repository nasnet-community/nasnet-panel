package features

import (
	"testing"
)

func TestNewFeatureRegistry(t *testing.T) {
	registry, err := NewFeatureRegistry()
	if err != nil {
		t.Fatalf("Failed to create registry: %v", err)
	}

	if registry == nil {
		t.Fatal("Registry is nil")
	}

	// Should have loaded all 6 manifests
	count := registry.Count()
	expectedCount := 6
	if count != expectedCount {
		t.Errorf("Expected %d manifests, got %d", expectedCount, count)
	}
}

func TestRegistryGetManifest(t *testing.T) {
	registry, err := NewFeatureRegistry()
	if err != nil {
		t.Fatalf("Failed to create registry: %v", err)
	}

	tests := []struct {
		id          string
		shouldExist bool
		name        string
	}{
		{"tor", true, "Tor Relay"},
		{"singbox", true, "sing-box"},
		{"xray", true, "Xray-core"},
		{"mtproxy", true, "MTProxy"},
		{"psiphon", true, "Psiphon"},
		{"adguard", true, "AdGuard Home"},
		{"nonexistent", false, ""},
	}

	for _, tt := range tests {
		t.Run(tt.id, func(t *testing.T) {
			manifest, err := registry.GetManifest(tt.id)

			if tt.shouldExist {
				if err != nil {
					t.Errorf("Expected manifest %s to exist, got error: %v", tt.id, err)
				}
				if manifest == nil {
					t.Errorf("Expected manifest %s to be non-nil", tt.id)
				}
				if manifest != nil && manifest.Name != tt.name {
					t.Errorf("Expected manifest name %s, got %s", tt.name, manifest.Name)
				}
			} else {
				if err == nil {
					t.Errorf("Expected error for non-existent manifest %s", tt.id)
				}
				if manifest != nil {
					t.Errorf("Expected nil manifest for %s", tt.id)
				}
			}
		})
	}
}

func TestRegistryListManifests(t *testing.T) {
	registry, err := NewFeatureRegistry()
	if err != nil {
		t.Fatalf("Failed to create registry: %v", err)
	}

	// Test listing all manifests
	all := registry.ListManifests("", "")
	if len(all) != 6 {
		t.Errorf("Expected 6 manifests, got %d", len(all))
	}

	// Test filtering by category
	vpnManifests := registry.ListManifests("VPN", "")
	expectedVPN := 3 // singbox, xray, psiphon
	if len(vpnManifests) != expectedVPN {
		t.Errorf("Expected %d VPN manifests, got %d", expectedVPN, len(vpnManifests))
	}

	privacyManifests := registry.ListManifests("Privacy", "")
	if len(privacyManifests) != 1 {
		t.Errorf("Expected 1 Privacy manifest, got %d", len(privacyManifests))
	}

	// Test filtering by architecture
	amd64Manifests := registry.ListManifests("", "amd64")
	if len(amd64Manifests) != 6 {
		t.Errorf("Expected 6 amd64 manifests, got %d", len(amd64Manifests))
	}

	arm64Manifests := registry.ListManifests("", "arm64")
	if len(arm64Manifests) != 6 {
		t.Errorf("Expected 6 arm64 manifests, got %d", len(arm64Manifests))
	}

	armManifests := registry.ListManifests("", "arm")
	expectedArm := 4 // tor, singbox, xray, adguard (not mtproxy, psiphon)
	if len(armManifests) != expectedArm {
		t.Errorf("Expected %d arm manifests, got %d", expectedArm, len(armManifests))
	}

	// Test combined filtering
	vpnAmd64 := registry.ListManifests("VPN", "amd64")
	if len(vpnAmd64) != 3 {
		t.Errorf("Expected 3 VPN amd64 manifests, got %d", len(vpnAmd64))
	}
}

func TestRegistryGetManifestsByCategory(t *testing.T) {
	registry, err := NewFeatureRegistry()
	if err != nil {
		t.Fatalf("Failed to create registry: %v", err)
	}

	byCategory := registry.GetManifestsByCategory()

	// Check expected categories
	expectedCategories := map[string]int{
		"VPN":       3, // singbox, xray, psiphon
		"Privacy":   1, // tor
		"Messaging": 1, // mtproxy
		"DNS":       1, // adguard
	}

	for category, expectedCount := range expectedCategories {
		manifests, exists := byCategory[category]
		if !exists {
			t.Errorf("Expected category %s to exist", category)
			continue
		}
		if len(manifests) != expectedCount {
			t.Errorf("Expected %d manifests in category %s, got %d", expectedCount, category, len(manifests))
		}
	}
}

func TestRegistryGetCategories(t *testing.T) {
	registry, err := NewFeatureRegistry()
	if err != nil {
		t.Fatalf("Failed to create registry: %v", err)
	}

	categories := registry.GetCategories()

	expectedCategories := []string{"DNS", "Messaging", "Privacy", "VPN"}
	if len(categories) != len(expectedCategories) {
		t.Errorf("Expected %d categories, got %d", len(expectedCategories), len(categories))
	}

	// Check if categories are sorted
	for i, expected := range expectedCategories {
		if i >= len(categories) {
			break
		}
		if categories[i] != expected {
			t.Errorf("Expected category %s at index %d, got %s", expected, i, categories[i])
		}
	}
}

func TestRegistrySearchManifests(t *testing.T) {
	registry, err := NewFeatureRegistry()
	if err != nil {
		t.Fatalf("Failed to create registry: %v", err)
	}

	tests := []struct {
		query         string
		expectedCount int
		description   string
	}{
		{"tor", 1, "Search by name (tor)"},
		{"proxy", 5, "Search by tag (proxy)"},
		{"vpn", 3, "Search by category tag"},
		{"telegram", 1, "Search by description (telegram)"},
		{"privacy", 3, "Search by tag (privacy in tor, psiphon, adguard)"},
		{"dns", 1, "Search by category (dns)"},
		{"nonexistent", 0, "Search for non-existent term"},
	}

	for _, tt := range tests {
		t.Run(tt.description, func(t *testing.T) {
			results := registry.SearchManifests(tt.query)
			if len(results) != tt.expectedCount {
				t.Errorf("Search for '%s': expected %d results, got %d", tt.query, tt.expectedCount, len(results))
			}
		})
	}
}

func TestRegistryGetAllIDs(t *testing.T) {
	registry, err := NewFeatureRegistry()
	if err != nil {
		t.Fatalf("Failed to create registry: %v", err)
	}

	ids := registry.GetAllIDs()

	expectedIDs := []string{"adguard", "mtproxy", "psiphon", "singbox", "tor", "xray"}
	if len(ids) != len(expectedIDs) {
		t.Errorf("Expected %d IDs, got %d", len(expectedIDs), len(ids))
	}

	// Check if IDs are sorted
	for i, expected := range expectedIDs {
		if i >= len(ids) {
			break
		}
		if ids[i] != expected {
			t.Errorf("Expected ID %s at index %d, got %s", expected, i, ids[i])
		}
	}
}

func TestManifestArchitectureSupport(t *testing.T) {
	registry, err := NewFeatureRegistry()
	if err != nil {
		t.Fatalf("Failed to create registry: %v", err)
	}

	tests := []struct {
		manifestID    string
		architecture  string
		shouldSupport bool
	}{
		// All manifests support amd64
		{"tor", "amd64", true},
		{"singbox", "amd64", true},
		{"xray", "amd64", true},
		{"mtproxy", "amd64", true},
		{"psiphon", "amd64", true},
		{"adguard", "amd64", true},

		// All manifests support arm64
		{"tor", "arm64", true},
		{"singbox", "arm64", true},
		{"xray", "arm64", true},
		{"mtproxy", "arm64", true},
		{"psiphon", "arm64", true},
		{"adguard", "arm64", true},

		// Only some support arm
		{"tor", "arm", true},
		{"singbox", "arm", true},
		{"xray", "arm", true},
		{"mtproxy", "arm", false},
		{"psiphon", "arm", false},
		{"adguard", "arm", true},

		// Test architecture normalization
		{"tor", "x86_64", true},  // should normalize to amd64
		{"tor", "aarch64", true}, // should normalize to arm64
		{"tor", "armv7", true},   // should normalize to arm
	}

	for _, tt := range tests {
		t.Run(tt.manifestID+"_"+tt.architecture, func(t *testing.T) {
			manifest, err := registry.GetManifest(tt.manifestID)
			if err != nil {
				t.Fatalf("Failed to get manifest: %v", err)
			}

			supports := manifest.SupportsArchitecture(tt.architecture)
			if supports != tt.shouldSupport {
				t.Errorf("Manifest %s architecture %s: expected support=%v, got %v",
					tt.manifestID, tt.architecture, tt.shouldSupport, supports)
			}
		})
	}
}

func TestManifestGetFullImageName(t *testing.T) {
	registry, err := NewFeatureRegistry()
	if err != nil {
		t.Fatalf("Failed to create registry: %v", err)
	}

	tor, _ := registry.GetManifest("tor")
	expected := "nasnetconnect/tor-relay:latest"
	if tor.GetFullImageName() != expected {
		t.Errorf("Expected full image name %s, got %s", expected, tor.GetFullImageName())
	}
}

func TestManifestIsCompatibleWith(t *testing.T) {
	registry, err := NewFeatureRegistry()
	if err != nil {
		t.Fatalf("Failed to create registry: %v", err)
	}

	tor, _ := registry.GetManifest("tor")

	tests := []struct {
		name               string
		routerOSVersion    string
		arch               string
		availableMemoryMB  int
		availableDiskMB    int
		shouldBeCompatible bool
		expectedIssueCount int
	}{
		{
			name:               "Fully compatible",
			routerOSVersion:    "7.0",
			arch:               "amd64",
			availableMemoryMB:  256,
			availableDiskMB:    512,
			shouldBeCompatible: true,
			expectedIssueCount: 0,
		},
		{
			name:               "Insufficient memory",
			routerOSVersion:    "7.0",
			arch:               "amd64",
			availableMemoryMB:  64,
			availableDiskMB:    512,
			shouldBeCompatible: false,
			expectedIssueCount: 1,
		},
		{
			name:               "Insufficient disk",
			routerOSVersion:    "7.0",
			arch:               "amd64",
			availableMemoryMB:  256,
			availableDiskMB:    100,
			shouldBeCompatible: false,
			expectedIssueCount: 1,
		},
		{
			name:               "Unsupported architecture",
			routerOSVersion:    "7.0",
			arch:               "mips",
			availableMemoryMB:  256,
			availableDiskMB:    512,
			shouldBeCompatible: false,
			expectedIssueCount: 1,
		},
		{
			name:               "Multiple issues",
			routerOSVersion:    "7.0",
			arch:               "mips",
			availableMemoryMB:  64,
			availableDiskMB:    100,
			shouldBeCompatible: false,
			expectedIssueCount: 3,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			compatible, issues := tor.IsCompatibleWith(
				tt.routerOSVersion,
				tt.arch,
				tt.availableMemoryMB,
				tt.availableDiskMB,
			)

			if compatible != tt.shouldBeCompatible {
				t.Errorf("Expected compatible=%v, got %v", tt.shouldBeCompatible, compatible)
			}

			if len(issues) != tt.expectedIssueCount {
				t.Errorf("Expected %d issues, got %d: %v", tt.expectedIssueCount, len(issues), issues)
			}
		})
	}
}

func TestManifestRequiredPorts(t *testing.T) {
	registry, err := NewFeatureRegistry()
	if err != nil {
		t.Fatalf("Failed to create registry: %v", err)
	}

	tests := []struct {
		manifestID    string
		expectedPorts []int
	}{
		{"tor", []int{9001, 9030}},
		{"singbox", []int{1080, 8080}},
		{"xray", []int{10086, 10087}},
		{"mtproxy", []int{443, 8888}},
		{"psiphon", []int{4000, 4001, 4443}},
		{"adguard", []int{53, 3000, 80}},
	}

	for _, tt := range tests {
		t.Run(tt.manifestID, func(t *testing.T) {
			manifest, err := registry.GetManifest(tt.manifestID)
			if err != nil {
				t.Fatalf("Failed to get manifest: %v", err)
			}

			if len(manifest.RequiredPorts) != len(tt.expectedPorts) {
				t.Errorf("Expected %d ports, got %d", len(tt.expectedPorts), len(manifest.RequiredPorts))
				return
			}

			for i, expectedPort := range tt.expectedPorts {
				if manifest.RequiredPorts[i] != expectedPort {
					t.Errorf("Expected port %d at index %d, got %d", expectedPort, i, manifest.RequiredPorts[i])
				}
			}
		})
	}
}

func TestManifestEnvironmentVars(t *testing.T) {
	registry, err := NewFeatureRegistry()
	if err != nil {
		t.Fatalf("Failed to create registry: %v", err)
	}

	// Test that all manifests have environment variables defined
	for _, id := range registry.GetAllIDs() {
		manifest, err := registry.GetManifest(id)
		if err != nil {
			t.Fatalf("Failed to get manifest %s: %v", id, err)
		}

		if manifest.EnvironmentVars == nil {
			t.Errorf("Manifest %s has nil environment vars", id)
		}

		// At least check that the map exists (even if empty)
		if manifest.EnvironmentVars == nil {
			manifest.EnvironmentVars = make(map[string]string)
		}
	}
}

func TestConcurrentRegistryAccess(t *testing.T) {
	registry, err := NewFeatureRegistry()
	if err != nil {
		t.Fatalf("Failed to create registry: %v", err)
	}

	// Test concurrent reads
	done := make(chan bool)
	for i := 0; i < 10; i++ {
		go func() {
			// Perform various read operations
			_ = registry.ListManifests("", "")
			_ = registry.GetCategories()
			_ = registry.SearchManifests("proxy")
			_, _ = registry.GetManifest("tor")
			done <- true
		}()
	}

	// Wait for all goroutines to complete
	for i := 0; i < 10; i++ {
		<-done
	}
}

func TestRegistryNoDuplicateIDs(t *testing.T) {
	// The embedded manifests should not have duplicate IDs
	// This test verifies that registry properly prevents duplicate loading
	registry, err := NewFeatureRegistry()
	if err != nil {
		t.Fatalf("Failed to create registry: %v", err)
	}

	// Collect all IDs and check for duplicates
	ids := make(map[string]bool)
	allManifests := registry.ListManifests("", "")

	for _, manifest := range allManifests {
		if ids[manifest.ID] {
			t.Errorf("Duplicate manifest ID found: %s", manifest.ID)
		}
		ids[manifest.ID] = true
	}

	// Verify no ID maps to multiple manifests
	if len(ids) != len(allManifests) {
		t.Errorf("ID count mismatch: expected %d unique IDs, got %d", len(allManifests), len(ids))
	}
}
