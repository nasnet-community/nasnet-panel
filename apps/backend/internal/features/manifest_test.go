package features

import (
	"testing"
)

func TestManifestValidation(t *testing.T) {
	tests := []struct {
		name      string
		manifest  Manifest
		wantError bool
		errorMsg  string
	}{
		{
			name: "valid manifest with resource fields",
			manifest: Manifest{
				ID:             "test-feature",
				Name:           "Test Feature",
				Version:        "1.0.0",
				DockerImage:    "test/image",
				DockerTag:      "latest",
				Architectures:  []string{"amd64"},
				MinRAM:         10485760,  // 10MB
				RecommendedRAM: 20971520,  // 20MB
				CPUWeight:      50,
			},
			wantError: false,
		},
		{
			name: "valid manifest with zero resources",
			manifest: Manifest{
				ID:             "test-feature",
				Name:           "Test Feature",
				Version:        "1.0.0",
				DockerImage:    "test/image",
				DockerTag:      "latest",
				Architectures:  []string{"amd64"},
				MinRAM:         0,
				RecommendedRAM: 0,
				CPUWeight:      0,
			},
			wantError: false,
		},
		{
			name: "negative min_ram",
			manifest: Manifest{
				ID:             "test-feature",
				Name:           "Test Feature",
				Version:        "1.0.0",
				DockerImage:    "test/image",
				DockerTag:      "latest",
				Architectures:  []string{"amd64"},
				MinRAM:         -1,
				RecommendedRAM: 20971520,
				CPUWeight:      50,
			},
			wantError: true,
			errorMsg:  "min_ram must be non-negative",
		},
		{
			name: "negative recommended_ram",
			manifest: Manifest{
				ID:             "test-feature",
				Name:           "Test Feature",
				Version:        "1.0.0",
				DockerImage:    "test/image",
				DockerTag:      "latest",
				Architectures:  []string{"amd64"},
				MinRAM:         10485760,
				RecommendedRAM: -1,
				CPUWeight:      50,
			},
			wantError: true,
			errorMsg:  "recommended_ram must be non-negative",
		},
		{
			name: "recommended_ram less than min_ram",
			manifest: Manifest{
				ID:             "test-feature",
				Name:           "Test Feature",
				Version:        "1.0.0",
				DockerImage:    "test/image",
				DockerTag:      "latest",
				Architectures:  []string{"amd64"},
				MinRAM:         20971520,  // 20MB
				RecommendedRAM: 10485760,  // 10MB
				CPUWeight:      50,
			},
			wantError: true,
			errorMsg:  "recommended_ram (10485760) must be greater than or equal to min_ram (20971520)",
		},
		{
			name: "cpu_weight negative",
			manifest: Manifest{
				ID:             "test-feature",
				Name:           "Test Feature",
				Version:        "1.0.0",
				DockerImage:    "test/image",
				DockerTag:      "latest",
				Architectures:  []string{"amd64"},
				MinRAM:         10485760,
				RecommendedRAM: 20971520,
				CPUWeight:      -1,
			},
			wantError: true,
			errorMsg:  "cpu_weight must be between 0 and 100",
		},
		{
			name: "cpu_weight exceeds 100",
			manifest: Manifest{
				ID:             "test-feature",
				Name:           "Test Feature",
				Version:        "1.0.0",
				DockerImage:    "test/image",
				DockerTag:      "latest",
				Architectures:  []string{"amd64"},
				MinRAM:         10485760,
				RecommendedRAM: 20971520,
				CPUWeight:      101,
			},
			wantError: true,
			errorMsg:  "cpu_weight must be between 0 and 100",
		},
		{
			name: "missing ID",
			manifest: Manifest{
				Name:           "Test Feature",
				Version:        "1.0.0",
				DockerImage:    "test/image",
				DockerTag:      "latest",
				Architectures:  []string{"amd64"},
			},
			wantError: true,
			errorMsg:  "manifest ID is required",
		},
		{
			name: "invalid ID format",
			manifest: Manifest{
				ID:             "Test Feature!", // Invalid: uppercase and special char
				Name:           "Test Feature",
				Version:        "1.0.0",
				DockerImage:    "test/image",
				DockerTag:      "latest",
				Architectures:  []string{"amd64"},
			},
			wantError: true,
			errorMsg:  "manifest ID must contain only lowercase letters, numbers, hyphens, and underscores",
		},
		{
			name: "missing name",
			manifest: Manifest{
				ID:             "test-feature",
				Version:        "1.0.0",
				DockerImage:    "test/image",
				DockerTag:      "latest",
				Architectures:  []string{"amd64"},
			},
			wantError: true,
			errorMsg:  "manifest name is required",
		},
		{
			name: "invalid version format",
			manifest: Manifest{
				ID:             "test-feature",
				Name:           "Test Feature",
				Version:        "1.0", // Invalid: not semantic version
				DockerImage:    "test/image",
				DockerTag:      "latest",
				Architectures:  []string{"amd64"},
			},
			wantError: true,
			errorMsg:  "manifest version must be in semantic version format",
		},
		{
			name: "valid semantic version with prerelease",
			manifest: Manifest{
				ID:             "test-feature",
				Name:           "Test Feature",
				Version:        "1.0.0-beta",
				DockerImage:    "test/image",
				DockerTag:      "latest",
				Architectures:  []string{"amd64"},
			},
			wantError: false,
		},
		{
			name: "missing architectures",
			manifest: Manifest{
				ID:          "test-feature",
				Name:        "Test Feature",
				Version:     "1.0.0",
				DockerImage: "test/image",
				DockerTag:   "latest",
			},
			wantError: true,
			errorMsg:  "at least one architecture must be specified",
		},
		{
			name: "invalid architecture",
			manifest: Manifest{
				ID:             "test-feature",
				Name:           "Test Feature",
				Version:        "1.0.0",
				DockerImage:    "test/image",
				DockerTag:      "latest",
				Architectures:  []string{"invalid-arch"},
			},
			wantError: true,
			errorMsg:  "invalid architecture: invalid-arch",
		},
		{
			name: "invalid docker pull policy",
			manifest: Manifest{
				ID:               "test-feature",
				Name:             "Test Feature",
				Version:          "1.0.0",
				DockerImage:      "test/image",
				DockerTag:        "latest",
				Architectures:    []string{"amd64"},
				DockerPullPolicy: "invalid-policy",
			},
			wantError: true,
			errorMsg:  "invalid docker_pull_policy",
		},
		{
			name: "invalid network mode",
			manifest: Manifest{
				ID:            "test-feature",
				Name:          "Test Feature",
				Version:       "1.0.0",
				DockerImage:   "test/image",
				DockerTag:     "latest",
				Architectures: []string{"amd64"},
				NetworkMode:   "invalid-mode",
			},
			wantError: true,
			errorMsg:  "invalid network_mode",
		},
		{
			name: "invalid port mapping - container port",
			manifest: Manifest{
				ID:            "test-feature",
				Name:          "Test Feature",
				Version:       "1.0.0",
				DockerImage:   "test/image",
				DockerTag:     "latest",
				Architectures: []string{"amd64"},
				Ports: []PortMapping{
					{ContainerPort: 0, HostPort: 8080, Protocol: "tcp"},
				},
			},
			wantError: true,
			errorMsg:  "invalid container_port at index 0",
		},
		{
			name: "invalid port mapping - host port",
			manifest: Manifest{
				ID:            "test-feature",
				Name:          "Test Feature",
				Version:       "1.0.0",
				DockerImage:   "test/image",
				DockerTag:     "latest",
				Architectures: []string{"amd64"},
				Ports: []PortMapping{
					{ContainerPort: 8080, HostPort: 70000, Protocol: "tcp"},
				},
			},
			wantError: true,
			errorMsg:  "invalid host_port at index 0",
		},
		{
			name: "invalid port mapping - protocol",
			manifest: Manifest{
				ID:            "test-feature",
				Name:          "Test Feature",
				Version:       "1.0.0",
				DockerImage:   "test/image",
				DockerTag:     "latest",
				Architectures: []string{"amd64"},
				Ports: []PortMapping{
					{ContainerPort: 8080, HostPort: 8080, Protocol: "invalid"},
				},
			},
			wantError: true,
			errorMsg:  "invalid protocol at index 0",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.manifest.Validate()
			if tt.wantError {
				if err == nil {
					t.Errorf("expected error containing '%s', got nil", tt.errorMsg)
				} else if tt.errorMsg != "" && !contains(err.Error(), tt.errorMsg) {
					t.Errorf("expected error containing '%s', got '%s'", tt.errorMsg, err.Error())
				}
			} else {
				if err != nil {
					t.Errorf("expected no error, got: %v", err)
				}
			}
		})
	}
}

func TestSupportsArchitecture(t *testing.T) {
	manifest := Manifest{
		Architectures: []string{"amd64", "arm64"},
	}

	tests := []struct {
		arch     string
		expected bool
	}{
		{"amd64", true},
		{"x86_64", true}, // Should normalize to amd64
		{"arm64", true},
		{"aarch64", true}, // Should normalize to arm64
		{"arm", false},
		{"invalid", false},
	}

	for _, tt := range tests {
		t.Run(tt.arch, func(t *testing.T) {
			result := manifest.SupportsArchitecture(tt.arch)
			if result != tt.expected {
				t.Errorf("SupportsArchitecture(%s) = %v, want %v", tt.arch, result, tt.expected)
			}
		})
	}
}

func TestGetFullImageName(t *testing.T) {
	manifest := Manifest{
		DockerImage: "nasnetconnect/tor-relay",
		DockerTag:   "latest",
	}

	expected := "nasnetconnect/tor-relay:latest"
	result := manifest.GetFullImageName()

	if result != expected {
		t.Errorf("GetFullImageName() = %s, want %s", result, expected)
	}
}

func TestIsCompatibleWith(t *testing.T) {
	manifest := Manifest{
		Architectures:    []string{"amd64", "arm64"},
		RequiredMemoryMB: 128,
		RequiredDiskMB:   256,
	}

	tests := []struct {
		name             string
		routerOSVersion  string
		arch             string
		availableMemory  int
		availableDisk    int
		expectCompatible bool
		expectIssues     int
	}{
		{
			name:             "fully compatible",
			routerOSVersion:  "7.0",
			arch:             "amd64",
			availableMemory:  256,
			availableDisk:    512,
			expectCompatible: true,
			expectIssues:     0,
		},
		{
			name:             "unsupported architecture",
			routerOSVersion:  "7.0",
			arch:             "arm",
			availableMemory:  256,
			availableDisk:    512,
			expectCompatible: false,
			expectIssues:     1,
		},
		{
			name:             "insufficient memory",
			routerOSVersion:  "7.0",
			arch:             "amd64",
			availableMemory:  64,
			availableDisk:    512,
			expectCompatible: false,
			expectIssues:     1,
		},
		{
			name:             "insufficient disk",
			routerOSVersion:  "7.0",
			arch:             "amd64",
			availableMemory:  256,
			availableDisk:    128,
			expectCompatible: false,
			expectIssues:     1,
		},
		{
			name:             "multiple issues",
			routerOSVersion:  "7.0",
			arch:             "arm",
			availableMemory:  64,
			availableDisk:    128,
			expectCompatible: false,
			expectIssues:     3,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			compatible, issues := manifest.IsCompatibleWith(
				tt.routerOSVersion,
				tt.arch,
				tt.availableMemory,
				tt.availableDisk,
			)

			if compatible != tt.expectCompatible {
				t.Errorf("IsCompatibleWith() compatible = %v, want %v", compatible, tt.expectCompatible)
			}

			if len(issues) != tt.expectIssues {
				t.Errorf("IsCompatibleWith() issues count = %d, want %d. Issues: %v", len(issues), tt.expectIssues, issues)
			}
		})
	}
}

// Helper function to check if a string contains a substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(substr) == 0 || (len(s) > 0 && len(substr) > 0 && s[:len(substr)] == substr) || (len(s) > len(substr) && containsHelper(s, substr)))
}

func containsHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
