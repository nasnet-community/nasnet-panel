//go:build integration
// +build integration

package orchestrator

import (
	"context"
	"fmt"
	"io"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/rs/zerolog"
)

// TestLogCaptureFromMockChildProcess tests capturing logs from a real child process
func TestLogCaptureFromMockChildProcess(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test in short mode")
	}

	tmpDir := t.TempDir()
	logger := zerolog.New(os.Stdout)

	// Create log capture
	lc, err := NewLogCapture(LogCaptureConfig{
		InstanceID:  "integration-test",
		ServiceName: "mock-process",
		LogDir:      tmpDir,
		Logger:      logger,
	})
	if err != nil {
		t.Fatalf("failed to create log capture: %v", err)
	}
	defer lc.Close()

	// Create a mock child process that writes logs
	// Use a simple command that outputs to stdout/stderr
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Create a script that outputs logs
	scriptPath := filepath.Join(tmpDir, "mock_logger.bat")
	script := `@echo off
echo {"level":"info","msg":"Process started"}
echo {"level":"debug","msg":"Initializing connections"}
echo {"level":"warn","msg":"High memory usage"}
>&2 echo [stderr] Connection timeout
echo {"level":"info","msg":"Process completed"}
`
	if err := os.WriteFile(scriptPath, []byte(script), 0755); err != nil {
		t.Fatalf("failed to create mock script: %v", err)
	}

	// Run the mock process
	cmd := exec.CommandContext(ctx, scriptPath)

	// Create pipes for stdout/stderr
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		t.Fatalf("failed to create stdout pipe: %v", err)
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		t.Fatalf("failed to create stderr pipe: %v", err)
	}

	// Start the process
	if err := cmd.Start(); err != nil {
		t.Fatalf("failed to start mock process: %v", err)
	}

	// Copy logs in goroutines
	errChan := make(chan error, 2)
	go func() {
		errChan <- CopyLogs(lc, stdout, "")
	}()
	go func() {
		errChan <- CopyLogs(lc, stderr, "[stderr] ")
	}()

	// Wait for process to complete
	if err := cmd.Wait(); err != nil {
		t.Logf("process exited with error (expected): %v", err)
	}

	// Wait for log copying to complete
	for i := 0; i < 2; i++ {
		if err := <-errChan; err != nil && err != io.EOF {
			t.Logf("log copy finished with: %v", err)
		}
	}

	// Give time for all writes to complete
	time.Sleep(500 * time.Millisecond)

	// Verify logs were captured
	logs, err := lc.TailLogs(100)
	if err != nil {
		t.Fatalf("failed to tail logs: %v", err)
	}

	if len(logs) < 4 {
		t.Fatalf("expected at least 4 log entries, got %d", len(logs))
	}

	// Verify different log levels were captured
	hasInfo := false
	hasWarn := false
	hasError := false
	hasStderr := false

	for _, log := range logs {
		switch log.Level {
		case LogLevelInfo:
			hasInfo = true
		case LogLevelWarn:
			hasWarn = true
		case LogLevelError:
			hasError = true
		}
		if strings.Contains(log.RawLine, "[stderr]") {
			hasStderr = true
		}
	}

	if !hasInfo {
		t.Error("no info level logs captured")
	}
	if !hasWarn {
		t.Error("no warn level logs captured")
	}
	if !hasError {
		t.Error("no error level logs captured from stderr")
	}
	if !hasStderr {
		t.Error("no stderr prefix found in logs")
	}

	t.Logf("Successfully captured %d logs from child process", len(logs))
	for i, log := range logs {
		t.Logf("  [%d] %s: %s", i+1, log.Level, log.Message)
	}
}

// TestLogRotationWithActualFileIO tests log rotation with real file I/O at >10MB
func TestLogRotationWithActualFileIO(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test in short mode")
	}

	tmpDir := t.TempDir()
	logger := zerolog.New(os.Stdout)

	// Create log capture with 2MB threshold for faster testing
	lc, err := NewLogCapture(LogCaptureConfig{
		InstanceID:  "rotation-test",
		ServiceName: "rotation-service",
		LogDir:      tmpDir,
		MaxFileSize: 2 * 1024 * 1024, // 2MB
		Logger:      logger,
	})
	if err != nil {
		t.Fatalf("failed to create log capture: %v", err)
	}
	defer lc.Close()

	// Write data to exceed rotation threshold
	// Generate 100KB chunks
	chunk := strings.Repeat("x", 100*1024)
	totalWritten := int64(0)
	rotationDetected := false

	logPath := lc.getLogPath()
	backupPath := lc.getBackupLogPath()

	// Write until rotation occurs
	for i := 0; i < 30; i++ { // Max 3MB
		msg := fmt.Sprintf(`{"level":"info","msg":"chunk %d","data":"%s"}`, i, chunk)
		if _, err := lc.Write([]byte(msg + "\n")); err != nil {
			t.Fatalf("write failed: %v", err)
		}
		totalWritten += int64(len(msg) + 1)

		// Check if backup file exists (rotation occurred)
		if _, err := os.Stat(backupPath); err == nil {
			rotationDetected = true
			t.Logf("Rotation detected after writing %d bytes (chunk %d)", totalWritten, i)
			break
		}

		// Small delay to allow file system operations
		time.Sleep(10 * time.Millisecond)
	}

	if !rotationDetected {
		t.Fatal("log rotation did not occur after writing >2MB")
	}

	// Verify backup file exists and has content
	backupInfo, err := os.Stat(backupPath)
	if err != nil {
		t.Fatalf("backup file not found: %v", err)
	}

	if backupInfo.Size() == 0 {
		t.Error("backup file is empty")
	}

	// Verify current file exists and is smaller than max size
	currentInfo, err := os.Stat(logPath)
	if err != nil {
		t.Fatalf("current log file not found: %v", err)
	}

	if currentInfo.Size() > lc.maxFileSize {
		t.Errorf("current file size (%d) exceeds max size (%d)", currentInfo.Size(), lc.maxFileSize)
	}

	// Verify we can read from both files
	backupContent, err := os.ReadFile(backupPath)
	if err != nil {
		t.Fatalf("failed to read backup file: %v", err)
	}

	currentContent, err := os.ReadFile(logPath)
	if err != nil {
		t.Fatalf("failed to read current file: %v", err)
	}

	totalContent := len(backupContent) + len(currentContent)
	t.Logf("Rotation test passed:")
	t.Logf("  Total written: %d bytes", totalWritten)
	t.Logf("  Backup file: %d bytes", len(backupContent))
	t.Logf("  Current file: %d bytes", len(currentContent))
	t.Logf("  Total preserved: %d bytes", totalContent)
}

// TestRunDiagnosticsWithMockSOCKS5Server tests running diagnostics against a mock server
func TestRunDiagnosticsWithMockSOCKS5Server(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test in short mode")
	}

	logger := zerolog.New(os.Stdout)

	// Start a mock SOCKS5 server
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("failed to start mock SOCKS5 server: %v", err)
	}
	defer listener.Close()

	addr := listener.Addr().(*net.TCPAddr)
	port := addr.Port

	// Handle SOCKS5 connections
	connReceived := make(chan bool, 1)
	go func() {
		for {
			conn, err := listener.Accept()
			if err != nil {
				return
			}

			connReceived <- true

			go func(c net.Conn) {
				defer c.Close()

				// Read SOCKS5 handshake
				buf := make([]byte, 3)
				n, err := c.Read(buf)
				if err != nil || n != 3 {
					return
				}

				// Verify valid SOCKS5 handshake
				if buf[0] == 0x05 && buf[1] == 0x01 && buf[2] == 0x00 {
					// Send success response
					c.Write([]byte{0x05, 0x00})
				} else {
					// Send error response
					c.Write([]byte{0x05, 0xFF})
				}
			}(conn)
		}
	}()

	// Create a diagnostic runner
	runner := NewDiagnosticRunner(logger)

	// Create mock managed process
	mp := &ManagedProcess{
		ID:     "test-tor",
		Name:   "tor",
		state:  ProcessStateRunning,
		pid:    99999,
		logger: logger,
	}

	// Register Tor diagnostic suite with our mock server port
	suite := NewTorDiagnosticSuite(mp, port, port+1)
	runner.RegisterSuite("tor", suite)

	// Run diagnostics
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	results := runner.RunDiagnostics(ctx, "tor", "test-tor")

	if len(results) == 0 {
		t.Fatal("no diagnostic results returned")
	}

	// Verify we received at least one connection
	select {
	case <-connReceived:
		t.Log("Mock SOCKS5 server received connection")
	case <-time.After(2 * time.Second):
		t.Log("Warning: no connection received by mock server (test may have failed early)")
	}

	// Verify results
	t.Logf("Diagnostic results (%d tests):", len(results))
	passCount := 0
	failCount := 0
	for _, result := range results {
		t.Logf("  [%s] %s: %s", result.Status, result.TestName, result.Message)
		if result.Details != "" {
			t.Logf("    Details: %s", result.Details)
		}

		switch result.Status {
		case DiagnosticStatusPass:
			passCount++
		case DiagnosticStatusFail:
			failCount++
		}
	}

	t.Logf("Summary: %d passed, %d failed", passCount, failCount)

	// At minimum, we should have a health check pass
	if passCount == 0 {
		t.Error("expected at least one passing diagnostic")
	}
}

// TestStartupDiagnosticsOnFailedProcess tests diagnostics on a failed process
func TestStartupDiagnosticsOnFailedProcess(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test in short mode")
	}

	tmpDir := t.TempDir()
	logger := zerolog.New(os.Stdout)

	// Create log capture for the failed process
	lc, err := NewLogCapture(LogCaptureConfig{
		InstanceID:  "failed-process",
		ServiceName: "failed-service",
		LogDir:      tmpDir,
		Logger:      logger,
	})
	if err != nil {
		t.Fatalf("failed to create log capture: %v", err)
	}
	defer lc.Close()

	// Write some error logs
	lc.WriteLine(`{"level":"error","msg":"Failed to bind to port 9050"}`)
	lc.WriteLine(`{"level":"error","msg":"Another service is using the port"}`)
	lc.WriteLine(`[stderr] Connection refused`)

	// Create a failed/stopped process
	mp := &ManagedProcess{
		ID:         "failed-process",
		Name:       "failed-service",
		state:      ProcessStateStopped,
		pid:        0,
		logCapture: lc,
		logger:     logger,
	}

	// Create diagnostic runner
	runner := NewDiagnosticRunner(logger)

	// Register diagnostic suite for the failed process
	suite := &DiagnosticSuite{
		ServiceName: "failed-service",
		Tests: []DiagnosticTest{
			NewHealthTest(mp),
			NewLogTest(mp, 1),
		},
	}
	runner.RegisterSuite("failed-service", suite)

	// Run diagnostics
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	results := runner.RunDiagnostics(ctx, "failed-service", "failed-process")

	if len(results) == 0 {
		t.Fatal("no diagnostic results returned")
	}

	t.Logf("Startup diagnostics on failed process (%d tests):", len(results))

	// Verify we have both health and log tests
	hasHealthTest := false
	hasLogTest := false
	healthTestFailed := false

	for _, result := range results {
		t.Logf("  [%s] %s: %s", result.Status, result.TestName, result.Message)
		if result.Details != "" {
			t.Logf("    Details: %s", result.Details)
		}

		if result.TestName == "process_health" {
			hasHealthTest = true
			if result.Status == DiagnosticStatusFail {
				healthTestFailed = true
			}
		}

		if result.TestName == "log_output" {
			hasLogTest = true
		}
	}

	if !hasHealthTest {
		t.Error("missing health test result")
	}

	if !hasLogTest {
		t.Error("missing log test result")
	}

	if !healthTestFailed {
		t.Error("health test should have failed for stopped process")
	}

	// Verify error logs were captured
	logs, err := lc.TailLogs(10)
	if err != nil {
		t.Fatalf("failed to retrieve logs: %v", err)
	}

	if len(logs) < 3 {
		t.Errorf("expected at least 3 error logs, got %d", len(logs))
	}

	errorCount := 0
	for _, log := range logs {
		if log.Level == LogLevelError {
			errorCount++
		}
	}

	if errorCount == 0 {
		t.Error("no error level logs found for failed process")
	}

	t.Logf("Successfully ran startup diagnostics on failed process with %d error logs", errorCount)
}
