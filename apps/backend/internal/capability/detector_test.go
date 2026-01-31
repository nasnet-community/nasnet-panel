package capability

import (
	"context"
	"testing"
)

// mockRouterPort implements RouterPort for testing.
type mockRouterPort struct {
	responses map[string]*StateResult
	errors    map[string]error
}

func newMockRouterPort() *mockRouterPort {
	return &mockRouterPort{
		responses: make(map[string]*StateResult),
		errors:    make(map[string]error),
	}
}

func (m *mockRouterPort) setResponse(path string, resources []map[string]string) {
	m.responses[path] = &StateResult{
		Resources: resources,
		Count:     len(resources),
	}
}

func (m *mockRouterPort) setError(path string, err error) {
	m.errors[path] = err
}

func (m *mockRouterPort) QueryState(ctx context.Context, query StateQuery) (*StateResult, error) {
	if err, ok := m.errors[query.Path]; ok {
		return nil, err
	}
	if result, ok := m.responses[query.Path]; ok {
		return result, nil
	}
	return &StateResult{}, nil
}

// TestDetector_DetectSystemResource tests system resource detection.
func TestDetector_DetectSystemResource(t *testing.T) {
	tests := []struct {
		name           string
		systemResource map[string]string
		wantVersion    RouterOSVersion
		wantArch       string
		wantMemory     int64
	}{
		{
			name: "RouterOS 7.12 arm64",
			systemResource: map[string]string{
				"version":           "7.12 (stable)",
				"architecture-name": "arm64",
				"cpu-count":         "4",
				"total-memory":      "536870912",
				"free-hdd-space":    "1073741824",
				"board-name":        "RB5009UG+S+IN",
			},
			wantVersion: RouterOSVersion{Major: 7, Minor: 12, Channel: "stable"},
			wantArch:    "arm64",
			wantMemory:  536870912,
		},
		{
			name: "RouterOS 6.49.8 x86_64",
			systemResource: map[string]string{
				"version":           "6.49.8 (stable)",
				"architecture-name": "x86_64",
				"cpu-count":         "2",
				"total-memory":      "268435456",
				"free-hdd-space":    "2147483648",
			},
			wantVersion: RouterOSVersion{Major: 6, Minor: 49, Patch: 8, Channel: "stable"},
			wantArch:    "x86_64",
			wantMemory:  268435456,
		},
		{
			name: "RouterOS 7.15.1 testing",
			systemResource: map[string]string{
				"version":           "7.15.1 (testing)",
				"architecture-name": "arm",
				"cpu-count":         "1",
				"total-memory":      "134217728",
				"free-hdd-space":    "67108864",
			},
			wantVersion: RouterOSVersion{Major: 7, Minor: 15, Patch: 1, Channel: "testing"},
			wantArch:    "arm",
			wantMemory:  134217728,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			port := newMockRouterPort()
			port.setResponse("/system/resource", []map[string]string{tt.systemResource})
			port.setResponse("/system/package", []map[string]string{})
			port.setResponse("/system/routerboard", []map[string]string{})

			detector := NewDetector()
			caps, err := detector.Detect(context.Background(), port)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if caps.Software.Version.Major != tt.wantVersion.Major {
				t.Errorf("version.Major = %d, want %d", caps.Software.Version.Major, tt.wantVersion.Major)
			}
			if caps.Software.Version.Minor != tt.wantVersion.Minor {
				t.Errorf("version.Minor = %d, want %d", caps.Software.Version.Minor, tt.wantVersion.Minor)
			}
			if caps.Software.Version.Channel != tt.wantVersion.Channel {
				t.Errorf("version.Channel = %s, want %s", caps.Software.Version.Channel, tt.wantVersion.Channel)
			}
			if caps.Hardware.Architecture != tt.wantArch {
				t.Errorf("architecture = %s, want %s", caps.Hardware.Architecture, tt.wantArch)
			}
			if caps.Hardware.TotalMemory != tt.wantMemory {
				t.Errorf("totalMemory = %d, want %d", caps.Hardware.TotalMemory, tt.wantMemory)
			}
		})
	}
}

// TestDetector_DetectPackages tests package detection.
func TestDetector_DetectPackages(t *testing.T) {
	tests := []struct {
		name           string
		packages       []map[string]string
		wantContainer  bool
		wantWireless   bool
		wantPackageLen int
	}{
		{
			name: "full package list",
			packages: []map[string]string{
				{"name": "routeros"},
				{"name": "container"},
				{"name": "wireless"},
				{"name": "routing"},
				{"name": "ipv6"},
			},
			wantContainer:  true,
			wantWireless:   true,
			wantPackageLen: 5,
		},
		{
			name: "minimal packages",
			packages: []map[string]string{
				{"name": "routeros"},
			},
			wantContainer:  false,
			wantWireless:   false,
			wantPackageLen: 1,
		},
		{
			name: "wireless wave2 package",
			packages: []map[string]string{
				{"name": "routeros"},
				{"name": "wifiwave2"},
			},
			wantContainer:  false,
			wantWireless:   false, // wifiwave2 isn't detected as HasWirelessChip by package name
			wantPackageLen: 2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			port := newMockRouterPort()
			port.setResponse("/system/resource", []map[string]string{
				{"version": "7.12", "architecture-name": "x86_64", "total-memory": "268435456"},
			})
			port.setResponse("/system/package", tt.packages)
			port.setResponse("/system/routerboard", []map[string]string{})

			detector := NewDetector()
			caps, err := detector.Detect(context.Background(), port)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if caps.Container.PackageInstalled != tt.wantContainer {
				t.Errorf("container.PackageInstalled = %v, want %v", caps.Container.PackageInstalled, tt.wantContainer)
			}
			if caps.Hardware.HasWirelessChip != tt.wantWireless {
				t.Errorf("hardware.HasWirelessChip = %v, want %v", caps.Hardware.HasWirelessChip, tt.wantWireless)
			}
			if len(caps.Software.InstalledPackages) != tt.wantPackageLen {
				t.Errorf("len(installedPackages) = %d, want %d", len(caps.Software.InstalledPackages), tt.wantPackageLen)
			}
		})
	}
}

// TestDetector_ContainerCapabilities tests container capability detection.
func TestDetector_ContainerCapabilities(t *testing.T) {
	tests := []struct {
		name             string
		version          string
		arch             string
		packages         []map[string]string
		containerConfig  []map[string]string
		wantLevel        Level
		wantNetNamespace bool
	}{
		{
			name:    "full container support",
			version: "7.13",
			arch:    "arm64",
			packages: []map[string]string{
				{"name": "container"},
			},
			containerConfig: []map[string]string{
				{"enable": "true", "registry-url": "https://ghcr.io"},
			},
			wantLevel:        LevelFull,
			wantNetNamespace: true,
		},
		{
			name:    "container enabled but no namespace",
			version: "7.13",
			arch:    "arm",
			packages: []map[string]string{
				{"name": "container"},
			},
			containerConfig: []map[string]string{
				{"enable": "true"},
			},
			wantLevel:        LevelAdvanced,
			wantNetNamespace: false,
		},
		{
			name:    "container package installed but not enabled",
			version: "7.13",
			arch:    "x86_64",
			packages: []map[string]string{
				{"name": "container"},
			},
			containerConfig: []map[string]string{
				{"enable": "false"},
			},
			wantLevel:        LevelBasic,
			wantNetNamespace: true,
		},
		{
			name:     "no container package",
			version:  "7.13",
			arch:     "arm64",
			packages: []map[string]string{},
			wantLevel: LevelNone,
		},
		{
			name:     "old RouterOS version",
			version:  "6.49",
			arch:     "arm64",
			packages: []map[string]string{},
			wantLevel: LevelNone,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			port := newMockRouterPort()
			port.setResponse("/system/resource", []map[string]string{
				{
					"version":           tt.version,
					"architecture-name": tt.arch,
					"total-memory":      "536870912",
					"free-hdd-space":    "1073741824",
				},
			})
			port.setResponse("/system/package", tt.packages)
			port.setResponse("/system/routerboard", []map[string]string{})
			if tt.containerConfig != nil {
				port.setResponse("/container/config", tt.containerConfig)
			}

			detector := NewDetector()
			caps, err := detector.Detect(context.Background(), port)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			containerEntry := caps.Entries[CapabilityContainer]
			if containerEntry.Level != tt.wantLevel {
				t.Errorf("container level = %v, want %v", containerEntry.Level, tt.wantLevel)
			}
			if tt.wantNetNamespace && !caps.Container.SupportsNetworkNamespace {
				t.Error("expected network namespace support")
			}
		})
	}
}

// TestDetector_VIFCapabilities tests VIF capability detection.
func TestDetector_VIFCapabilities(t *testing.T) {
	tests := []struct {
		name            string
		version         string
		arch            string
		packages        []map[string]string
		containerConfig []map[string]string
		storage         string
		wantVIFLevel    Level
		wantVIFMet      bool
	}{
		{
			name:    "VIF fully supported",
			version: "7.13",
			arch:    "arm64",
			packages: []map[string]string{
				{"name": "container"},
			},
			containerConfig: []map[string]string{
				{"enable": "true"},
			},
			storage:      "536870912", // 512MB
			wantVIFLevel: LevelFull,
			wantVIFMet:   true,
		},
		{
			name:    "VIF not supported - old version",
			version: "7.12",
			arch:    "arm64",
			packages: []map[string]string{
				{"name": "container"},
			},
			containerConfig: []map[string]string{
				{"enable": "true"},
			},
			storage:      "536870912",
			wantVIFLevel: LevelNone,
			wantVIFMet:   false,
		},
		{
			name:         "VIF not supported - no container",
			version:      "7.13",
			arch:         "arm64",
			packages:     []map[string]string{},
			storage:      "536870912",
			wantVIFLevel: LevelNone,
			wantVIFMet:   false,
		},
		{
			name:    "VIF not supported - container not enabled",
			version: "7.13",
			arch:    "arm64",
			packages: []map[string]string{
				{"name": "container"},
			},
			containerConfig: []map[string]string{
				{"enable": "false"},
			},
			storage:      "536870912",
			wantVIFLevel: LevelNone,
			wantVIFMet:   false,
		},
		{
			name:    "VIF not supported - insufficient storage",
			version: "7.13",
			arch:    "arm64",
			packages: []map[string]string{
				{"name": "container"},
			},
			containerConfig: []map[string]string{
				{"enable": "true"},
			},
			storage:      "52428800", // 50MB
			wantVIFLevel: LevelBasic,
			wantVIFMet:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			port := newMockRouterPort()
			port.setResponse("/system/resource", []map[string]string{
				{
					"version":           tt.version,
					"architecture-name": tt.arch,
					"total-memory":      "536870912",
					"free-hdd-space":    tt.storage,
				},
			})
			port.setResponse("/system/package", tt.packages)
			port.setResponse("/system/routerboard", []map[string]string{})
			if tt.containerConfig != nil {
				port.setResponse("/container/config", tt.containerConfig)
			}

			detector := NewDetector()
			caps, err := detector.Detect(context.Background(), port)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			vifEntry := caps.Entries[CapabilityVIF]
			if vifEntry.Level != tt.wantVIFLevel {
				t.Errorf("VIF level = %v, want %v", vifEntry.Level, tt.wantVIFLevel)
			}

			vifReq := caps.CheckVIFRequirements()
			if vifReq.Met != tt.wantVIFMet {
				t.Errorf("VIF met = %v, want %v", vifReq.Met, tt.wantVIFMet)
			}
		})
	}
}

// TestParseVersion tests version string parsing.
func TestParseVersion(t *testing.T) {
	tests := []struct {
		input   string
		want    RouterOSVersion
	}{
		{
			input: "7.12",
			want:  RouterOSVersion{Major: 7, Minor: 12, Raw: "7.12"},
		},
		{
			input: "7.12.1",
			want:  RouterOSVersion{Major: 7, Minor: 12, Patch: 1, Raw: "7.12.1"},
		},
		{
			input: "7.12 (stable)",
			want:  RouterOSVersion{Major: 7, Minor: 12, Channel: "stable", Raw: "7.12 (stable)"},
		},
		{
			input: "6.49.8 (stable)",
			want:  RouterOSVersion{Major: 6, Minor: 49, Patch: 8, Channel: "stable", Raw: "6.49.8 (stable)"},
		},
		{
			input: "7.15rc1 (testing)",
			want:  RouterOSVersion{Major: 7, Minor: 15, Channel: "testing", Raw: "7.15rc1 (testing)"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := parseVersion(tt.input)
			if got.Major != tt.want.Major {
				t.Errorf("Major = %d, want %d", got.Major, tt.want.Major)
			}
			if got.Minor != tt.want.Minor {
				t.Errorf("Minor = %d, want %d", got.Minor, tt.want.Minor)
			}
			if got.Patch != tt.want.Patch {
				t.Errorf("Patch = %d, want %d", got.Patch, tt.want.Patch)
			}
			if got.Channel != tt.want.Channel {
				t.Errorf("Channel = %s, want %s", got.Channel, tt.want.Channel)
			}
		})
	}
}

// TestParseSize tests size string parsing.
func TestParseSize(t *testing.T) {
	tests := []struct {
		input string
		want  int64
	}{
		{"1024", 1024},
		{"1K", 1024},
		{"1KB", 1024},
		{"1KiB", 1024},
		{"1M", 1024 * 1024},
		{"1MB", 1024 * 1024},
		{"1MiB", 1024 * 1024},
		{"1G", 1024 * 1024 * 1024},
		{"512M", 512 * 1024 * 1024},
		{"", 0},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := parseSize(tt.input)
			if got != tt.want {
				t.Errorf("parseSize(%q) = %d, want %d", tt.input, got, tt.want)
			}
		})
	}
}

// TestRouterOSVersion_VersionChecks tests version check methods.
func TestRouterOSVersion_VersionChecks(t *testing.T) {
	tests := []struct {
		version           RouterOSVersion
		wantSupportsREST  bool
		wantSupportsVIF   bool
		wantSupportsContainers bool
		wantSupportsWireGuard bool
	}{
		{
			version:                RouterOSVersion{Major: 7, Minor: 1},
			wantSupportsREST:       true,
			wantSupportsVIF:        false,
			wantSupportsContainers: false,
			wantSupportsWireGuard:  true,
		},
		{
			version:                RouterOSVersion{Major: 7, Minor: 4},
			wantSupportsREST:       true,
			wantSupportsVIF:        false,
			wantSupportsContainers: true,
			wantSupportsWireGuard:  true,
		},
		{
			version:                RouterOSVersion{Major: 7, Minor: 13},
			wantSupportsREST:       true,
			wantSupportsVIF:        true,
			wantSupportsContainers: true,
			wantSupportsWireGuard:  true,
		},
		{
			version:                RouterOSVersion{Major: 6, Minor: 49},
			wantSupportsREST:       false,
			wantSupportsVIF:        false,
			wantSupportsContainers: false,
			wantSupportsWireGuard:  false,
		},
	}

	for _, tt := range tests {
		name := tt.version.String()
		t.Run(name, func(t *testing.T) {
			if got := tt.version.SupportsREST(); got != tt.wantSupportsREST {
				t.Errorf("SupportsREST() = %v, want %v", got, tt.wantSupportsREST)
			}
			if got := tt.version.SupportsVIF(); got != tt.wantSupportsVIF {
				t.Errorf("SupportsVIF() = %v, want %v", got, tt.wantSupportsVIF)
			}
			if got := tt.version.SupportsContainers(); got != tt.wantSupportsContainers {
				t.Errorf("SupportsContainers() = %v, want %v", got, tt.wantSupportsContainers)
			}
			if got := tt.version.SupportsWireGuard(); got != tt.wantSupportsWireGuard {
				t.Errorf("SupportsWireGuard() = %v, want %v", got, tt.wantSupportsWireGuard)
			}
		})
	}
}

// TestVIFGuidance tests the VIF guidance step generation.
func TestVIFGuidance(t *testing.T) {
	caps := &Capabilities{
		Hardware: HardwareInfo{
			Architecture:     "arm64",
			TotalMemory:      536870912,
			AvailableStorage: 200 * 1024 * 1024,
		},
		Software: SoftwareInfo{
			Version: RouterOSVersion{Major: 7, Minor: 13},
		},
		Container: ContainerInfo{
			PackageInstalled:         true,
			Enabled:                  true,
			StorageAvailable:         200 * 1024 * 1024,
			SupportsNetworkNamespace: true,
		},
		Entries: make(map[Capability]Entry),
	}

	guidance := caps.VIFGuidance()

	if len(guidance) != 5 {
		t.Errorf("expected 5 guidance steps, got %d", len(guidance))
	}

	// All requirements are met, so all steps should be completed
	for i, step := range guidance {
		if !step.Completed {
			t.Errorf("step %d (%s) should be completed", i+1, step.Title)
		}
	}

	// Test with missing requirements
	capsMissing := &Capabilities{
		Hardware: HardwareInfo{
			Architecture:     "arm",
			TotalMemory:      128 * 1024 * 1024,
			AvailableStorage: 50 * 1024 * 1024,
		},
		Software: SoftwareInfo{
			Version: RouterOSVersion{Major: 7, Minor: 10},
		},
		Container: ContainerInfo{
			PackageInstalled:         false,
			Enabled:                  false,
			StorageAvailable:         50 * 1024 * 1024,
			SupportsNetworkNamespace: false,
		},
		Entries: make(map[Capability]Entry),
	}

	guidanceMissing := capsMissing.VIFGuidance()

	// Check that incomplete steps are marked
	completedCount := 0
	for _, step := range guidanceMissing {
		if step.Completed {
			completedCount++
		}
	}

	if completedCount == 5 {
		t.Error("expected some incomplete steps when requirements are not met")
	}
}
