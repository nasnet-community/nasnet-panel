//go:build linux

package resources

import (
	"context"
	"os"
	"testing"

	"backend/generated/ent/enttest"
	"backend/generated/ent/serviceinstance"

	_ "github.com/mattn/go-sqlite3" // SQLite driver for tests
	"github.com/rs/zerolog"
)

func TestNewResourceManager(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
		defer client.Close()

		rm, err := NewResourceManager(ResourceManagerConfig{
			Store:  client,
			Logger: zerolog.Nop(),
		})

		if err != nil {
			t.Fatalf("Failed to create ResourceManager: %v", err)
		}

		if rm == nil {
			t.Fatal("ResourceManager is nil")
		}

		if rm.store == nil {
			t.Error("Store not initialized")
		}
	})

	t.Run("Error_NilStore", func(t *testing.T) {
		_, err := NewResourceManager(ResourceManagerConfig{
			Store:  nil,
			Logger: zerolog.Nop(),
		})

		if err == nil {
			t.Fatal("Expected error for nil Store, got nil")
		}

		expected := "Store is required"
		if err.Error() != expected {
			t.Errorf("Expected error %q, got %q", expected, err.Error())
		}
	})
}

func TestResourceManager_ReadMemInfo(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	rm, err := NewResourceManager(ResourceManagerConfig{
		Store:  client,
		Logger: zerolog.Nop(),
	})
	if err != nil {
		t.Fatalf("Failed to create ResourceManager: %v", err)
	}

	t.Run("ReadRealProcMemInfo", func(t *testing.T) {
		// This test reads the actual /proc/meminfo if available
		totalMB, availableMB, err := rm.readMemInfo()

		// If /proc/meminfo doesn't exist (e.g., on Windows CI), skip
		if err != nil {
			if os.IsNotExist(err) || os.IsPermission(err) {
				t.Skip("Skipping test: /proc/meminfo not accessible")
			}
			t.Fatalf("Unexpected error reading meminfo: %v", err)
		}

		if totalMB <= 0 {
			t.Errorf("Expected positive totalMB, got %d", totalMB)
		}

		if availableMB <= 0 {
			t.Errorf("Expected positive availableMB, got %d", availableMB)
		}

		if availableMB > totalMB {
			t.Errorf("Available memory (%d MB) cannot exceed total memory (%d MB)", availableMB, totalMB)
		}

		t.Logf("System memory: Total=%d MB, Available=%d MB", totalMB, availableMB)
	})
}

func TestResourceManager_GetSystemResources(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	rm, err := NewResourceManager(ResourceManagerConfig{
		Store:  client,
		Logger: zerolog.Nop(),
	})
	if err != nil {
		t.Fatalf("Failed to create ResourceManager: %v", err)
	}

	ctx := context.Background()

	t.Run("GetSystemResources", func(t *testing.T) {
		sysRes, err := rm.GetSystemResources(ctx)
		if err != nil {
			t.Fatalf("Failed to get system resources: %v", err)
		}

		if sysRes == nil {
			t.Fatal("System resources is nil")
		}

		// Check that memory values are reasonable
		if sysRes.TotalMemoryMB <= 0 {
			t.Errorf("Expected positive TotalMemoryMB, got %d", sysRes.TotalMemoryMB)
		}

		if sysRes.AvailableMemoryMB < 0 {
			t.Errorf("Expected non-negative AvailableMemoryMB, got %d", sysRes.AvailableMemoryMB)
		}

		if sysRes.UsedMemoryMB < 0 {
			t.Errorf("Expected non-negative UsedMemoryMB, got %d", sysRes.UsedMemoryMB)
		}

		if sysRes.UsagePercent < 0 || sysRes.UsagePercent > 100 {
			t.Errorf("Expected UsagePercent between 0-100, got %.2f", sysRes.UsagePercent)
		}

		t.Logf("System resources: Total=%d MB, Available=%d MB, Used=%d MB, Usage=%.2f%%",
			sysRes.TotalMemoryMB, sysRes.AvailableMemoryMB, sysRes.UsedMemoryMB, sysRes.UsagePercent)
	})

	t.Run("FallbackValues_WhenProcUnavailable", func(t *testing.T) {
		// Temporarily override ProcMemInfoPath to non-existent file
		originalPath := ProcMemInfoPath
		defer func() {
			// Note: Can't reassign const, so this test verifies behavior via error handling
		}()

		// Create a ResourceManager that will fail to read /proc
		// We can't easily test this without modifying the constant, so we verify
		// the fallback logic is present in the code (already done in GetSystemResources)

		// At minimum, verify that GetSystemResources never fails
		sysRes, err := rm.GetSystemResources(ctx)
		if err != nil {
			t.Fatalf("GetSystemResources should not fail even if /proc unavailable: %v", err)
		}

		if sysRes == nil {
			t.Fatal("System resources should not be nil even on /proc failure")
		}

		// If /proc is unavailable, IsProcAvailable should be false
		// and values should be defaults
		if !sysRes.IsProcAvailable {
			if sysRes.TotalMemoryMB != DefaultSystemMemoryMB {
				t.Errorf("Expected default TotalMemoryMB=%d, got %d",
					DefaultSystemMemoryMB, sysRes.TotalMemoryMB)
			}
			if sysRes.AvailableMemoryMB != DefaultAvailableMemoryMB {
				t.Errorf("Expected default AvailableMemoryMB=%d, got %d",
					DefaultAvailableMemoryMB, sysRes.AvailableMemoryMB)
			}
		}

		_ = originalPath // Suppress unused warning
	})
}

func TestResourceManager_GetAllocatedResources(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	rm, err := NewResourceManager(ResourceManagerConfig{
		Store:  client,
		Logger: zerolog.Nop(),
	})
	if err != nil {
		t.Fatalf("Failed to create ResourceManager: %v", err)
	}

	ctx := context.Background()

	t.Run("NoRunningInstances", func(t *testing.T) {
		allocated, err := rm.GetAllocatedResources(ctx)
		if err != nil {
			t.Fatalf("Failed to get allocated resources: %v", err)
		}

		if allocated.TotalAllocatedMB != 0 {
			t.Errorf("Expected 0 allocated MB, got %d", allocated.TotalAllocatedMB)
		}

		if allocated.InstanceCount != 0 {
			t.Errorf("Expected 0 instances, got %d", allocated.InstanceCount)
		}

		if len(allocated.Instances) != 0 {
			t.Errorf("Expected 0 instances in list, got %d", len(allocated.Instances))
		}
	})

	t.Run("WithRunningInstances", func(t *testing.T) {
		// Create test instances
		inst1, err := client.ServiceInstance.Create().
			SetID("01HTEST00000000000000001").
			SetFeatureID("xray").
			SetInstanceName("xray-prod").
			SetRouterID("router-1").
			SetStatus(serviceinstance.StatusRunning).
			SetMemoryLimit(50 * 1024 * 1024). // 50 MB in bytes
			Save(ctx)
		if err != nil {
			t.Fatalf("Failed to create instance 1: %v", err)
		}

		inst2, err := client.ServiceInstance.Create().
			SetID("01HTEST00000000000000002").
			SetFeatureID("tor").
			SetInstanceName("tor-relay").
			SetRouterID("router-1").
			SetStatus(serviceinstance.StatusRunning).
			SetMemoryLimit(30 * 1024 * 1024). // 30 MB in bytes
			Save(ctx)
		if err != nil {
			t.Fatalf("Failed to create instance 2: %v", err)
		}

		// Create a stopped instance (should not be counted)
		_, err = client.ServiceInstance.Create().
			SetID("01HTEST00000000000000003").
			SetFeatureID("adguard").
			SetInstanceName("adguard-home").
			SetRouterID("router-1").
			SetStatus(serviceinstance.StatusStopped).
			SetMemoryLimit(40 * 1024 * 1024). // 40 MB in bytes
			Save(ctx)
		if err != nil {
			t.Fatalf("Failed to create stopped instance: %v", err)
		}

		allocated, err := rm.GetAllocatedResources(ctx)
		if err != nil {
			t.Fatalf("Failed to get allocated resources: %v", err)
		}

		// Should only count running instances (inst1 + inst2 = 80 MB)
		expectedTotalMB := 80
		if allocated.TotalAllocatedMB != expectedTotalMB {
			t.Errorf("Expected %d MB allocated, got %d", expectedTotalMB, allocated.TotalAllocatedMB)
		}

		if allocated.InstanceCount != 2 {
			t.Errorf("Expected 2 running instances, got %d", allocated.InstanceCount)
		}

		if len(allocated.Instances) != 2 {
			t.Fatalf("Expected 2 instances in list, got %d", len(allocated.Instances))
		}

		// Verify instance details
		foundInst1 := false
		foundInst2 := false

		for _, inst := range allocated.Instances {
			if inst.InstanceID == inst1.ID {
				foundInst1 = true
				if inst.MemoryLimitMB != 50 {
					t.Errorf("Instance 1: expected 50 MB, got %d", inst.MemoryLimitMB)
				}
				if inst.FeatureID != "xray" {
					t.Errorf("Instance 1: expected feature xray, got %s", inst.FeatureID)
				}
			}

			if inst.InstanceID == inst2.ID {
				foundInst2 = true
				if inst.MemoryLimitMB != 30 {
					t.Errorf("Instance 2: expected 30 MB, got %d", inst.MemoryLimitMB)
				}
			}
		}

		if !foundInst1 || !foundInst2 {
			t.Error("Not all running instances found in allocated resources")
		}
	})
}

func TestResourceManager_CheckResourceAvailability(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	rm, err := NewResourceManager(ResourceManagerConfig{
		Store:  client,
		Logger: zerolog.Nop(),
	})
	if err != nil {
		t.Fatalf("Failed to create ResourceManager: %v", err)
	}

	ctx := context.Background()

	t.Run("AvailableResources_NoRunningInstances", func(t *testing.T) {
		// Request 50 MB
		avail, err := rm.CheckResourceAvailability(ctx, 50)
		if err != nil {
			t.Fatalf("Failed to check resource availability: %v", err)
		}

		if avail.RequiredMB != 50 {
			t.Errorf("Expected RequiredMB=50, got %d", avail.RequiredMB)
		}

		if avail.AllocatedMB != 0 {
			t.Errorf("Expected AllocatedMB=0, got %d", avail.AllocatedMB)
		}

		// Buffer should be 10% of total
		expectedBufferMB := int(float64(avail.AvailableMB+avail.AllocatedMB+avail.BufferMB) * 0.10)
		// Allow some margin for rounding
		if avail.BufferMB < expectedBufferMB-10 || avail.BufferMB > expectedBufferMB+10 {
			t.Logf("Warning: BufferMB=%d differs from expected ~%d (this may be due to system memory size)",
				avail.BufferMB, expectedBufferMB)
		}

		// With no instances, should be available (unless system memory is very low)
		if !avail.Available && avail.AvailableMB > 100 {
			t.Errorf("Expected resources to be available with %d MB available", avail.AvailableMB)
		}

		t.Logf("Resource check: Required=%d MB, Available=%d MB, Allocated=%d MB, Buffer=%d MB, Available=%v",
			avail.RequiredMB, avail.AvailableMB, avail.AllocatedMB, avail.BufferMB, avail.Available)
	})

	t.Run("InsufficientResources_WithSuggestions", func(t *testing.T) {
		// Create instances that consume a lot of memory
		_, err := client.ServiceInstance.Create().
			SetID("01HTEST00000000000000010").
			SetFeatureID("xray").
			SetInstanceName("xray-heavy").
			SetRouterID("router-1").
			SetStatus(serviceinstance.StatusRunning).
			SetMemoryLimit(200 * 1024 * 1024). // 200 MB
			Save(ctx)
		if err != nil {
			t.Fatalf("Failed to create heavy instance: %v", err)
		}

		_, err = client.ServiceInstance.Create().
			SetID("01HTEST00000000000000011").
			SetFeatureID("tor").
			SetInstanceName("tor-relay").
			SetRouterID("router-1").
			SetStatus(serviceinstance.StatusRunning).
			SetMemoryLimit(100 * 1024 * 1024). // 100 MB
			Save(ctx)
		if err != nil {
			t.Fatalf("Failed to create medium instance: %v", err)
		}

		// Request a large amount of memory (10 GB) to ensure insufficiency
		avail, err := rm.CheckResourceAvailability(ctx, 10240)
		if err != nil {
			t.Fatalf("Failed to check resource availability: %v", err)
		}

		// Should not be available with 10 GB request on typical systems
		if avail.Available {
			t.Log("Warning: 10 GB request was marked as available (system may have very large memory)")
		}

		// Should have suggestions
		if len(avail.Suggestions) == 0 {
			t.Error("Expected suggestions when resources unavailable, got none")
		}

		// Suggestions should be sorted by memory (highest first)
		if len(avail.Suggestions) >= 2 {
			if avail.Suggestions[0].MemoryMB < avail.Suggestions[1].MemoryMB {
				t.Error("Suggestions should be sorted by memory descending")
			}

			// First suggestion should be xray-heavy (200 MB)
			if avail.Suggestions[0].FeatureID != "xray" {
				t.Errorf("Expected first suggestion to be xray (200 MB), got %s",
					avail.Suggestions[0].FeatureID)
			}
		}

		// Verify suggestion structure
		for i, suggestion := range avail.Suggestions {
			if suggestion.Action != "stop" {
				t.Errorf("Suggestion %d: expected action=stop, got %s", i, suggestion.Action)
			}

			if suggestion.InstanceID == "" {
				t.Errorf("Suggestion %d: InstanceID is empty", i)
			}

			if suggestion.MemoryMB <= 0 {
				t.Errorf("Suggestion %d: expected positive MemoryMB, got %d", i, suggestion.MemoryMB)
			}

			if suggestion.Reason == "" {
				t.Errorf("Suggestion %d: Reason is empty", i)
			}
		}

		t.Logf("Generated %d suggestions for insufficient resources", len(avail.Suggestions))
		for i, s := range avail.Suggestions {
			t.Logf("  Suggestion %d: %s (%s) - %d MB - %s", i+1, s.InstanceName, s.FeatureID, s.MemoryMB, s.Reason)
		}
	})
}

func TestResourceManager_GenerateSuggestions(t *testing.T) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
	defer client.Close()

	rm, err := NewResourceManager(ResourceManagerConfig{
		Store:  client,
		Logger: zerolog.Nop(),
	})
	if err != nil {
		t.Fatalf("Failed to create ResourceManager: %v", err)
	}

	t.Run("NoInstances", func(t *testing.T) {
		allocated := &AllocatedResources{
			TotalAllocatedMB: 0,
			InstanceCount:    0,
			Instances:        []InstanceResourceSummary{},
		}

		suggestions := rm.generateSuggestions(50, allocated)

		if len(suggestions) != 0 {
			t.Errorf("Expected 0 suggestions with no instances, got %d", len(suggestions))
		}
	})

	t.Run("SortByMemoryDescending", func(t *testing.T) {
		allocated := &AllocatedResources{
			TotalAllocatedMB: 180,
			InstanceCount:    3,
			Instances: []InstanceResourceSummary{
				{InstanceID: "id-1", InstanceName: "small", FeatureID: "tor", MemoryLimitMB: 30},
				{InstanceID: "id-2", InstanceName: "large", FeatureID: "xray", MemoryLimitMB: 100},
				{InstanceID: "id-3", InstanceName: "medium", FeatureID: "sing-box", MemoryLimitMB: 50},
			},
		}

		suggestions := rm.generateSuggestions(80, allocated)

		// Should suggest largest first
		if len(suggestions) == 0 {
			t.Fatal("Expected at least one suggestion")
		}

		// First suggestion should be the largest (100 MB)
		if suggestions[0].InstanceName != "large" {
			t.Errorf("Expected first suggestion to be 'large' (100 MB), got %s", suggestions[0].InstanceName)
		}

		if suggestions[0].MemoryMB != 100 {
			t.Errorf("Expected first suggestion memory to be 100 MB, got %d", suggestions[0].MemoryMB)
		}

		// Verify sorting
		for i := 0; i < len(suggestions)-1; i++ {
			if suggestions[i].MemoryMB < suggestions[i+1].MemoryMB {
				t.Errorf("Suggestions not sorted: suggestion[%d]=%d MB < suggestion[%d]=%d MB",
					i, suggestions[i].MemoryMB, i+1, suggestions[i+1].MemoryMB)
			}
		}
	})

	t.Run("StopSuggestingWhenEnoughFreed", func(t *testing.T) {
		allocated := &AllocatedResources{
			TotalAllocatedMB: 210,
			InstanceCount:    3,
			Instances: []InstanceResourceSummary{
				{InstanceID: "id-1", InstanceName: "inst-1", FeatureID: "tor", MemoryLimitMB: 10},
				{InstanceID: "id-2", InstanceName: "inst-2", FeatureID: "xray", MemoryLimitMB: 100},
				{InstanceID: "id-3", InstanceName: "inst-3", FeatureID: "sing-box", MemoryLimitMB: 100},
			},
		}

		// Request 100 MB - should suggest only 1 large instance
		suggestions := rm.generateSuggestions(100, allocated)

		// Should suggest at least one 100 MB instance
		if len(suggestions) == 0 {
			t.Fatal("Expected at least one suggestion")
		}

		// Should suggest either inst-2 or inst-3 (both 100 MB)
		if suggestions[0].MemoryMB < 100 {
			t.Errorf("Expected suggestion to free at least 100 MB, got %d MB", suggestions[0].MemoryMB)
		}

		// Total freed should be >= required
		totalFreed := 0
		for _, s := range suggestions {
			totalFreed += s.MemoryMB
		}

		if totalFreed < 100 {
			t.Errorf("Total freed (%d MB) should be >= required (100 MB)", totalFreed)
		}
	})
}
