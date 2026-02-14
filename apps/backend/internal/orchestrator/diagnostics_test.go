package orchestrator

import (
	"context"
	"net"
	"os"
	"testing"
	"time"

	"github.com/rs/zerolog"
)

// TestSOCKS5HandshakeValidation tests SOCKS5 proxy handshake validation
func TestSOCKS5HandshakeValidation(t *testing.T) {
	// Start a mock SOCKS5 server
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("failed to start mock server: %v", err)
	}
	defer listener.Close()

	addr := listener.Addr().(*net.TCPAddr)
	port := addr.Port

	// Handle SOCKS5 handshake in goroutine
	go func() {
		conn, err := listener.Accept()
		if err != nil {
			return
		}
		defer conn.Close()

		// Read handshake (version 5, 1 auth method, no auth)
		buf := make([]byte, 3)
		n, err := conn.Read(buf)
		if err != nil || n != 3 {
			return
		}

		// Verify handshake format
		if buf[0] != 0x05 || buf[1] != 0x01 || buf[2] != 0x00 {
			// Invalid handshake, send error
			conn.Write([]byte{0x05, 0xFF})
			return
		}

		// Send success response (version 5, method 0)
		conn.Write([]byte{0x05, 0x00})
	}()

	// Run SOCKS5 test
	test := NewTorSOCKS5Test("127.0.0.1", port)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result := test.Run(ctx)

	if result.Status != DiagnosticStatusPass {
		t.Errorf("SOCKS5 test failed: %s - %s", result.Message, result.Details)
	}

	if result.Duration <= 0 {
		t.Error("test duration should be > 0")
	}

	t.Logf("SOCKS5 handshake validation passed: %s (took %dms)", result.Message, result.Duration.Milliseconds())
}

// TestSOCKS5InvalidHandshake tests handling of invalid SOCKS5 responses
func TestSOCKS5InvalidHandshake(t *testing.T) {
	// Start a mock server that sends invalid SOCKS5 response
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("failed to start mock server: %v", err)
	}
	defer listener.Close()

	addr := listener.Addr().(*net.TCPAddr)
	port := addr.Port

	go func() {
		conn, err := listener.Accept()
		if err != nil {
			return
		}
		defer conn.Close()

		// Read handshake
		buf := make([]byte, 3)
		conn.Read(buf)

		// Send invalid SOCKS version
		conn.Write([]byte{0x04, 0x00}) // SOCKS4 instead of SOCKS5
	}()

	// Run SOCKS5 test
	test := NewTorSOCKS5Test("127.0.0.1", port)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result := test.Run(ctx)

	if result.Status != DiagnosticStatusFail {
		t.Errorf("expected test to fail with invalid SOCKS version, got status: %s", result.Status)
	}

	if !contains(result.Message, "Invalid") && !contains(result.Details, "0x04") {
		t.Errorf("error message should mention invalid version, got: %s - %s", result.Message, result.Details)
	}

	t.Logf("Invalid handshake correctly detected: %s", result.Message)
}

// TestSOCKS5ConnectionRefused tests handling of connection refused
func TestSOCKS5ConnectionRefused(t *testing.T) {
	// Use a port that's definitely not listening
	test := NewTorSOCKS5Test("127.0.0.1", 9999)
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	result := test.Run(ctx)

	if result.Status != DiagnosticStatusFail {
		t.Errorf("expected test to fail on connection refused, got status: %s", result.Status)
	}

	if !contains(result.Message, "Failed to connect") && !contains(result.Details, "refused") {
		t.Errorf("error should mention connection failure, got: %s - %s", result.Message, result.Details)
	}

	t.Logf("Connection refused correctly handled: %s", result.Message)
}

// TestHealthTest tests the process health check
func TestHealthTest(t *testing.T) {
	logger := zerolog.New(os.Stdout)

	// Create a mock ManagedProcess
	mp := &ManagedProcess{
		ID:     "test-instance",
		Name:   "test-service",
		state:  ProcessStateRunning,
		pid:    12345,
		logger: logger,
	}

	test := NewHealthTest(mp)
	ctx := context.Background()

	result := test.Run(ctx)

	if result.Status != DiagnosticStatusPass {
		t.Errorf("health test failed for running process: %s", result.Message)
	}

	if !contains(result.Details, "12345") {
		t.Errorf("details should include PID, got: %s", result.Details)
	}

	// Test stopped process
	mp.state = ProcessStateStopped
	mp.pid = 0

	result = test.Run(ctx)

	if result.Status != DiagnosticStatusFail {
		t.Errorf("health test should fail for stopped process, got: %s", result.Status)
	}

	if !contains(result.Message, "not running") {
		t.Errorf("message should indicate process is not running, got: %s", result.Message)
	}

	t.Log("Health test passed for both running and stopped states")
}

// TestLogTest tests the log output diagnostic
func TestLogTest(t *testing.T) {
	tmpDir := t.TempDir()
	logger := zerolog.New(os.Stdout)

	// Create log capture
	lc, err := NewLogCapture(LogCaptureConfig{
		InstanceID:  "test-instance",
		ServiceName: "test-service",
		LogDir:      tmpDir,
		Logger:      logger,
	})
	if err != nil {
		t.Fatalf("failed to create log capture: %v", err)
	}
	defer lc.Close()

	// Create mock process with log capture
	mp := &ManagedProcess{
		ID:         "test-instance",
		Name:       "test-service",
		logCapture: lc,
		logger:     logger,
	}

	// Write some logs
	for i := 0; i < 10; i++ {
		lc.WriteLine(`{"level":"info","msg":"test message"}`)
	}

	// Run log test
	test := NewLogTest(mp, 5)
	ctx := context.Background()

	result := test.Run(ctx)

	if result.Status != DiagnosticStatusPass {
		t.Errorf("log test failed: %s - %s", result.Message, result.Details)
	}

	if !contains(result.Details, "10") {
		t.Errorf("details should mention log count, got: %s", result.Details)
	}

	// Test insufficient logs
	mp2 := &ManagedProcess{
		ID:         "test-instance-2",
		Name:       "test-service-2",
		logCapture: lc,
		logger:     logger,
	}

	lc2, _ := NewLogCapture(LogCaptureConfig{
		InstanceID:  "test-instance-2",
		ServiceName: "test-service-2",
		LogDir:      tmpDir,
		Logger:      logger,
	})
	defer lc2.Close()
	mp2.logCapture = lc2

	// Write only 2 logs
	lc2.WriteLine("log 1")
	lc2.WriteLine("log 2")

	test2 := NewLogTest(mp2, 5)
	result2 := test2.Run(ctx)

	if result2.Status != DiagnosticStatusWarning {
		t.Errorf("expected warning for insufficient logs, got: %s", result2.Status)
	}

	t.Log("Log test passed for both sufficient and insufficient log scenarios")
}

// TestDiagnosticRunner tests the diagnostic runner
func TestDiagnosticRunner(t *testing.T) {
	logger := zerolog.New(os.Stdout)
	runner := NewDiagnosticRunner(logger)

	// Create a mock process
	mp := &ManagedProcess{
		ID:     "test-instance",
		Name:   "test-service",
		state:  ProcessStateRunning,
		pid:    12345,
		logger: logger,
	}

	// Register a test suite
	suite := &DiagnosticSuite{
		ServiceName: "test",
		Tests: []DiagnosticTest{
			NewHealthTest(mp),
		},
	}

	runner.RegisterSuite("test", suite)

	// Get available tests
	tests := runner.GetAvailableTests("test")
	if len(tests) != 1 {
		t.Errorf("expected 1 test, got %d", len(tests))
	}

	if tests[0] != "process_health" {
		t.Errorf("expected test name 'process_health', got %s", tests[0])
	}

	// Run diagnostics
	ctx := context.Background()
	results := runner.RunDiagnostics(ctx, "test", "test-instance")

	if len(results) != 1 {
		t.Fatalf("expected 1 result, got %d", len(results))
	}

	result := results[0]
	if result.TestName != "process_health" {
		t.Errorf("expected test name 'process_health', got %s", result.TestName)
	}

	if result.Status != DiagnosticStatusPass {
		t.Errorf("expected pass, got %s: %s", result.Status, result.Message)
	}

	// Test non-existent service
	results = runner.RunDiagnostics(ctx, "nonexistent", "test-instance")
	if len(results) != 1 || results[0].Status != DiagnosticStatusSkipped {
		t.Error("should return skipped result for non-existent service")
	}

	t.Log("DiagnosticRunner test passed")
}

// Helper function to check if string contains substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && indexOf(s, substr) >= 0)
}

func indexOf(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}
