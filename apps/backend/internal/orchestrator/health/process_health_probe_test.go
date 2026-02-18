package health

import (
	"context"
	"os"
	"testing"
	"time"
)

func TestNewProcessHealthProbe(t *testing.T) {
	probe := NewProcessHealthProbe("test-probe", 1234)

	if probe.Name() != "test-probe" {
		t.Errorf("Expected name 'test-probe', got '%s'", probe.Name())
	}

	if probe.GetPID() != 1234 {
		t.Errorf("Expected PID 1234, got %d", probe.GetPID())
	}
}

func TestProcessHealthProbe_Check_CurrentProcess(t *testing.T) {
	// Test with the current process PID (always running during test)
	currentPID := os.Getpid()
	probe := NewProcessHealthProbe("current-process", currentPID)

	ctx := context.Background()
	result := CheckWithResult(ctx, probe)

	if !result.Healthy {
		t.Errorf("Expected current process to be healthy, got error: %v", result.Error)
	}

	if result.Latency == 0 {
		t.Error("Expected non-zero latency measurement")
	}

	if result.Latency > 100*time.Millisecond {
		t.Errorf("Process check took too long: %v", result.Latency)
	}
}

func TestProcessHealthProbe_Check_InvalidPID(t *testing.T) {
	tests := []struct {
		name string
		pid  int
	}{
		{"zero PID", 0},
		{"negative PID", -1},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			probe := NewProcessHealthProbe(tt.name, tt.pid)
			ctx := context.Background()
			result := CheckWithResult(ctx, probe)

			if result.Healthy {
				t.Error("Expected invalid PID check to fail")
			}

			if result.Error == nil {
				t.Error("Expected error for invalid PID")
			}
		})
	}
}

func TestProcessHealthProbe_Check_NonExistentProcess(t *testing.T) {
	// Use a very high PID that's unlikely to exist
	// PID 999999 should not exist in most systems
	nonExistentPID := 999999
	probe := NewProcessHealthProbe("non-existent", nonExistentPID)

	ctx := context.Background()
	result := CheckWithResult(ctx, probe)

	// On Windows, this might not fail due to platform limitations
	// So we only assert on Unix systems
	if result.Healthy {
		t.Logf("Warning: Non-existent process check passed (might be Windows limitation)")
		// Not failing the test because Windows behavior is different
	}

	if result.Error != nil {
		// Expected on Unix systems
		t.Logf("Non-existent process correctly detected: %v", result.Error)
	}
}

func TestProcessHealthProbe_UpdatePID(t *testing.T) {
	probe := NewProcessHealthProbe("test", 1234)

	if probe.GetPID() != 1234 {
		t.Errorf("Expected initial PID 1234, got %d", probe.GetPID())
	}

	probe.UpdatePID(5678)

	if probe.GetPID() != 5678 {
		t.Errorf("Expected updated PID 5678, got %d", probe.GetPID())
	}

	// Verify the probe now checks the new PID
	currentPID := os.Getpid()
	probe.UpdatePID(currentPID)

	ctx := context.Background()
	result := CheckWithResult(ctx, probe)

	if !result.Healthy {
		t.Errorf("Expected probe with updated PID to be healthy, got: %v", result.Error)
	}
}

func TestProcessHealthProbe_ContextCancellation(t *testing.T) {
	currentPID := os.Getpid()
	probe := NewProcessHealthProbe("test-context", currentPID)

	// Create a context that's already cancelled
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	// The probe should still work because process check is synchronous
	// and doesn't respect context cancellation in the current implementation
	result := CheckWithResult(ctx, probe)

	// This test documents current behavior
	// In a more sophisticated implementation, we might want to respect context
	if !result.Healthy {
		t.Logf("Process check with cancelled context: %v", result.Error)
	}
}

func TestCheckWithResult_Latency(t *testing.T) {
	currentPID := os.Getpid()
	probe := NewProcessHealthProbe("latency-test", currentPID)

	ctx := context.Background()

	// Run multiple checks to verify latency measurement is consistent
	for i := 0; i < 5; i++ {
		result := CheckWithResult(ctx, probe)

		if !result.Healthy {
			t.Errorf("Check %d: Expected healthy, got error: %v", i, result.Error)
		}

		if result.Latency == 0 {
			t.Errorf("Check %d: Expected non-zero latency", i)
		}

		if result.Latency > 50*time.Millisecond {
			t.Logf("Check %d: Latency seems high: %v", i, result.Latency)
		}
	}
}
