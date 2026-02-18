package resources

import (
	"os"
	"path/filepath"
	"strconv"
	"testing"

	"github.com/rs/zerolog"
)

func TestCgroupManager_DetectCgroupV2(t *testing.T) {
	logger := zerolog.New(os.Stderr)
	mgr := NewCgroupManager(logger)

	// Test should work on systems with or without cgroups v2
	// We just verify that detection doesn't crash
	t.Logf("cgroups v2 available: %v", mgr.IsAvailable())

	// If not available, subsequent operations should be no-ops
	if !mgr.IsAvailable() {
		t.Log("cgroups v2 not available on this system, skipping further tests")
		t.Skip("cgroups v2 not available")
	}
}

func TestCgroupManager_CreateCgroup(t *testing.T) {
	logger := zerolog.New(os.Stderr)
	mgr := NewCgroupManager(logger)

	if !mgr.IsAvailable() {
		t.Skip("cgroups v2 not available")
	}

	instanceID := "test-instance-create"

	// Clean up any existing cgroup
	defer mgr.RemoveCgroup(instanceID)

	err := mgr.CreateCgroup(instanceID)
	if err != nil {
		t.Fatalf("failed to create cgroup: %v", err)
	}

	// Verify the directory was created
	cgroupPath := mgr.getCgroupPath(instanceID)
	if _, err := os.Stat(cgroupPath); os.IsNotExist(err) {
		t.Errorf("cgroup directory was not created: %s", cgroupPath)
	}
}

func TestCgroupManager_SetMemoryLimits(t *testing.T) {
	logger := zerolog.New(os.Stderr)
	mgr := NewCgroupManager(logger)

	if !mgr.IsAvailable() {
		t.Skip("cgroups v2 not available")
	}

	instanceID := "test-instance-memory"

	// Create cgroup
	if err := mgr.CreateCgroup(instanceID); err != nil {
		t.Fatalf("failed to create cgroup: %v", err)
	}
	defer mgr.RemoveCgroup(instanceID)

	// Set memory limits: 80MB soft, 100MB hard
	softLimitMB := 80
	hardLimitMB := 100
	err := mgr.SetMemoryLimits(instanceID, softLimitMB, hardLimitMB)
	if err != nil {
		t.Fatalf("failed to set memory limits: %v", err)
	}

	// Verify memory.high was set correctly
	cgroupPath := mgr.getCgroupPath(instanceID)
	highPath := filepath.Join(cgroupPath, cgroupMemoryHighFile)
	highData, err := os.ReadFile(highPath)
	if err != nil {
		t.Fatalf("failed to read memory.high: %v", err)
	}
	expectedSoftBytes := softLimitMB * 1024 * 1024
	actualSoft, _ := strconv.Atoi(string(highData))
	if actualSoft != expectedSoftBytes {
		t.Errorf("memory.high mismatch: expected %d, got %d", expectedSoftBytes, actualSoft)
	}

	// Verify memory.max was set correctly
	maxPath := filepath.Join(cgroupPath, cgroupMemoryMaxFile)
	maxData, err := os.ReadFile(maxPath)
	if err != nil {
		t.Fatalf("failed to read memory.max: %v", err)
	}
	expectedHardBytes := hardLimitMB * 1024 * 1024
	actualHard, _ := strconv.Atoi(string(maxData))
	if actualHard != expectedHardBytes {
		t.Errorf("memory.max mismatch: expected %d, got %d", expectedHardBytes, actualHard)
	}

	t.Logf("memory limits set correctly: soft=%dMB, hard=%dMB", softLimitMB, hardLimitMB)
}

func TestCgroupManager_SetCPUWeight(t *testing.T) {
	logger := zerolog.New(os.Stderr)
	mgr := NewCgroupManager(logger)

	if !mgr.IsAvailable() {
		t.Skip("cgroups v2 not available")
	}

	instanceID := "test-instance-cpu"

	// Create cgroup
	if err := mgr.CreateCgroup(instanceID); err != nil {
		t.Fatalf("failed to create cgroup: %v", err)
	}
	defer mgr.RemoveCgroup(instanceID)

	tests := []struct {
		priority       int
		expectedWeight int
	}{
		{1, 1},       // Minimum priority maps to minimum weight
		{50, 5000},   // Mid priority maps to mid weight
		{100, 10000}, // Maximum priority maps to maximum weight
		{25, 2500},   // Quarter priority
		{75, 7500},   // Three-quarter priority
	}

	for _, tt := range tests {
		t.Run(strconv.Itoa(tt.priority), func(t *testing.T) {
			err := mgr.SetCPUWeight(instanceID, tt.priority)
			if err != nil {
				t.Fatalf("failed to set CPU weight: %v", err)
			}

			// Verify cpu.weight was set correctly
			cgroupPath := mgr.getCgroupPath(instanceID)
			weightPath := filepath.Join(cgroupPath, cgroupCPUWeightFile)
			weightData, err := os.ReadFile(weightPath)
			if err != nil {
				t.Fatalf("failed to read cpu.weight: %v", err)
			}

			actualWeight, _ := strconv.Atoi(string(weightData))
			if actualWeight != tt.expectedWeight {
				t.Errorf("cpu.weight mismatch for priority %d: expected %d, got %d",
					tt.priority, tt.expectedWeight, actualWeight)
			}

			t.Logf("priority %d correctly mapped to weight %d", tt.priority, actualWeight)
		})
	}
}

func TestCgroupManager_AssignProcess(t *testing.T) {
	logger := zerolog.New(os.Stderr)
	mgr := NewCgroupManager(logger)

	if !mgr.IsAvailable() {
		t.Skip("cgroups v2 not available")
	}

	instanceID := "test-instance-assign"

	// Create cgroup
	if err := mgr.CreateCgroup(instanceID); err != nil {
		t.Fatalf("failed to create cgroup: %v", err)
	}
	defer mgr.RemoveCgroup(instanceID)

	// Use current process PID for testing
	pid := os.Getpid()

	err := mgr.AssignProcess(instanceID, pid)
	if err != nil {
		t.Fatalf("failed to assign process: %v", err)
	}

	// Verify the PID was written to cgroup.procs
	cgroupPath := mgr.getCgroupPath(instanceID)
	procsPath := filepath.Join(cgroupPath, cgroupProcsFile)
	procsData, err := os.ReadFile(procsPath)
	if err != nil {
		t.Fatalf("failed to read cgroup.procs: %v", err)
	}

	// cgroup.procs may contain multiple PIDs (one per line)
	// We just check that our PID is in there
	found := false
	pidStr := strconv.Itoa(pid)
	for _, line := range splitLines(string(procsData)) {
		if line == pidStr {
			found = true
			break
		}
	}

	if !found {
		t.Errorf("PID %d not found in cgroup.procs", pid)
	}

	t.Logf("successfully assigned PID %d to cgroup", pid)
}

func TestCgroupManager_RemoveCgroup(t *testing.T) {
	logger := zerolog.New(os.Stderr)
	mgr := NewCgroupManager(logger)

	if !mgr.IsAvailable() {
		t.Skip("cgroups v2 not available")
	}

	instanceID := "test-instance-remove"

	// Create cgroup
	if err := mgr.CreateCgroup(instanceID); err != nil {
		t.Fatalf("failed to create cgroup: %v", err)
	}

	// Remove cgroup
	err := mgr.RemoveCgroup(instanceID)
	if err != nil {
		t.Fatalf("failed to remove cgroup: %v", err)
	}

	// Verify the directory was removed
	cgroupPath := mgr.getCgroupPath(instanceID)
	if _, err := os.Stat(cgroupPath); !os.IsNotExist(err) {
		t.Errorf("cgroup directory still exists: %s", cgroupPath)
	}
}

func TestCgroupManager_GracefulDegradation(t *testing.T) {
	logger := zerolog.New(os.Stderr)

	// Create a manager with a non-existent base path to simulate unavailable cgroups
	mgr := &CgroupManager{
		logger:    logger,
		basePath:  "/nonexistent/cgroup/path",
		available: false,
	}

	instanceID := "test-graceful"

	// All operations should succeed (no-op) when cgroups not available
	if err := mgr.CreateCgroup(instanceID); err != nil {
		t.Errorf("CreateCgroup should be no-op when unavailable: %v", err)
	}

	if err := mgr.SetMemoryLimits(instanceID, 100, 200); err != nil {
		t.Errorf("SetMemoryLimits should be no-op when unavailable: %v", err)
	}

	if err := mgr.SetCPUWeight(instanceID, 50); err != nil {
		t.Errorf("SetCPUWeight should be no-op when unavailable: %v", err)
	}

	if err := mgr.AssignProcess(instanceID, 12345); err != nil {
		t.Errorf("AssignProcess should be no-op when unavailable: %v", err)
	}

	if err := mgr.RemoveCgroup(instanceID); err != nil {
		t.Errorf("RemoveCgroup should be no-op when unavailable: %v", err)
	}

	t.Log("all operations gracefully degraded when cgroups unavailable")
}

func TestCgroupManager_CPUWeightMapping(t *testing.T) {
	tests := []struct {
		priority int
		expected int
	}{
		{-1, 100},    // Below minimum, clamped to 1, weight = ((1 * 9999) / 100) + 1 = 100
		{0, 100},     // Zero, clamped to 1, weight = ((1 * 9999) / 100) + 1 = 100
		{1, 100},     // Minimum, weight = ((1 * 9999) / 100) + 1 = 100
		{50, 5000},   // Middle, weight = ((50 * 9999) / 100) + 1 = 5000
		{100, 10000}, // Maximum, weight = ((100 * 9999) / 100) + 1 = 10000
		{101, 10000}, // Above maximum, clamped to 100
		{200, 10000}, // Way above maximum, clamped to 100
	}

	for _, tt := range tests {
		t.Run(strconv.Itoa(tt.priority), func(t *testing.T) {
			// Normalize priority (same as SetCPUWeight)
			priority := tt.priority
			if priority < 1 {
				priority = 1
			}
			if priority > 100 {
				priority = 100
			}

			// Calculate weight using the same formula as SetCPUWeight
			weight := ((priority * (maxCPUWeight - minCPUWeight)) / 100) + minCPUWeight

			if weight != tt.expected {
				t.Errorf("priority %d: expected weight %d, got %d", tt.priority, tt.expected, weight)
			}
		})
	}
}

// Helper function to split lines (handles different line endings)
func splitLines(s string) []string {
	lines := []string{}
	current := ""
	for _, c := range s {
		if c == '\n' {
			if current != "" {
				lines = append(lines, current)
				current = ""
			}
		} else if c != '\r' {
			current += string(c)
		}
	}
	if current != "" {
		lines = append(lines, current)
	}
	return lines
}
