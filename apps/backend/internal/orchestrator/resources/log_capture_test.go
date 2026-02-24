package resources

import (
	"fmt"
	"os"
	"strings"
	"testing"
	"time"

	"go.uber.org/zap"
)

// TestLogRotationAt10MB tests that log files rotate when reaching 10MB
func TestLogRotationAt10MB(t *testing.T) {
	// Create temporary directory for test logs
	tmpDir := t.TempDir()

	logger := zap.NewNop()

	// Create log capture with small max size for testing (1MB instead of 10MB)
	lc, err := NewLogCapture(LogCaptureConfig{
		InstanceID:  "test-instance",
		ServiceName: "test-service",
		LogDir:      tmpDir,
		MaxFileSize: 1 * 1024 * 1024, // 1MB for faster test
		Logger:      logger,
	})
	if err != nil {
		t.Fatalf("failed to create log capture: %v", err)
	}
	defer lc.Close()

	// Write data until rotation occurs
	data := strings.Repeat("x", 10000) // 10KB per write
	writes := 0
	maxWrites := 150 // 1.5MB total

	for writes < maxWrites {
		if _, err := lc.Write([]byte(data + "\n")); err != nil {
			t.Fatalf("failed to write: %v", err)
		}
		writes++
	}

	// Check that backup file was created
	backupPath := lc.getBackupLogPath()
	if _, err := os.Stat(backupPath); os.IsNotExist(err) {
		t.Errorf("backup log file was not created at %s", backupPath)
	}

	// Check that current log file exists and is smaller than max size
	logPath := lc.getLogPath()
	info, err := os.Stat(logPath)
	if err != nil {
		t.Fatalf("failed to stat log file: %v", err)
	}

	if info.Size() > lc.maxFileSize {
		t.Errorf("current log file size (%d) exceeds max size (%d)", info.Size(), lc.maxFileSize)
	}

	t.Logf("Rotation test passed: backup created, current file size: %d bytes", info.Size())
}

// TestJSONLogParsing tests parsing of JSON-formatted logs (sing-box, AdGuard)
func TestJSONLogParsing(t *testing.T) {
	tests := []struct {
		name        string
		jsonLine    string
		wantLevel   LogLevel
		wantMessage string
		wantFields  map[string]string
	}{
		{
			name:        "sing-box log with time field",
			jsonLine:    `{"time":"2024-01-15T10:30:00Z","level":"info","msg":"connection established","remote":"1.2.3.4"}`,
			wantLevel:   LogLevelInfo,
			wantMessage: "connection established",
			wantFields:  map[string]string{"remote": "1.2.3.4"},
		},
		{
			name:        "AdGuard Home log with timestamp field",
			jsonLine:    `{"timestamp":"2024-01-15T10:30:00Z","level":"error","message":"DNS query failed","domain":"example.com"}`,
			wantLevel:   LogLevelError,
			wantMessage: "DNS query failed",
			wantFields:  map[string]string{"domain": "example.com"},
		},
		{
			name:        "log with warning level",
			jsonLine:    `{"time":"2024-01-15T10:30:00Z","level":"warn","msg":"high memory usage"}`,
			wantLevel:   LogLevelWarn,
			wantMessage: "high memory usage",
			wantFields:  map[string]string{},
		},
		{
			name:        "log with debug level",
			jsonLine:    `{"time":"2024-01-15T10:30:00Z","level":"debug","msg":"processing request"}`,
			wantLevel:   LogLevelDebug,
			wantMessage: "processing request",
			wantFields:  map[string]string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			entry := DefaultLogParser(tt.jsonLine, "test-service")

			if entry.Level != tt.wantLevel {
				t.Errorf("got level %v, want %v", entry.Level, tt.wantLevel)
			}

			if entry.Message != tt.wantMessage {
				t.Errorf("got message %q, want %q", entry.Message, tt.wantMessage)
			}

			if entry.Source != "test-service" {
				t.Errorf("got source %q, want %q", entry.Source, "test-service")
			}

			// Check metadata fields
			for key, wantValue := range tt.wantFields {
				if gotValue, exists := entry.Metadata[key]; !exists {
					t.Errorf("metadata missing key %q", key)
				} else if gotValue != wantValue {
					t.Errorf("metadata[%q] = %q, want %q", key, gotValue, wantValue)
				}
			}

			t.Logf("Parsed: level=%s, message=%s, metadata=%v", entry.Level, entry.Message, entry.Metadata)
		})
	}
}

// TestPlainTextLogParsing tests parsing of plain text logs (Tor, MTProxy)
func TestPlainTextLogParsing(t *testing.T) {
	tests := []struct {
		name      string
		line      string
		wantLevel LogLevel
	}{
		{
			name:      "tor info log",
			line:      "[notice] Bootstrapped 100%: Done",
			wantLevel: LogLevelInfo,
		},
		{
			name:      "tor warning log",
			line:      "[warn] Unable to connect to entry guard",
			wantLevel: LogLevelWarn,
		},
		{
			name:      "generic error log",
			line:      "Error: connection refused",
			wantLevel: LogLevelError,
		},
		{
			name:      "generic debug log",
			line:      "DEBUG: processing request",
			wantLevel: LogLevelDebug,
		},
		{
			name:      "unknown log format defaults to info",
			line:      "Some random log message",
			wantLevel: LogLevelInfo,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			entry := DefaultLogParser(tt.line, "test-service")

			if entry.Level != tt.wantLevel {
				t.Errorf("got level %v, want %v", entry.Level, tt.wantLevel)
			}

			if entry.Message != strings.TrimSpace(tt.line) {
				t.Errorf("got message %q, want %q", entry.Message, strings.TrimSpace(tt.line))
			}

			if entry.RawLine != tt.line {
				t.Errorf("got rawLine %q, want %q", entry.RawLine, tt.line)
			}

			t.Logf("Parsed plain text: level=%s, message=%s", entry.Level, entry.Message)
		})
	}
}

// TestStderrErrorLevel tests that stderr logs are marked with error level prefix
func TestStderrErrorLevel(t *testing.T) {
	tmpDir := t.TempDir()
	logger := zap.NewNop()

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

	// Write stderr message with prefix
	stderrMsg := "[stderr] Connection failed: timeout"
	if err := lc.WriteLine(stderrMsg); err != nil {
		t.Fatalf("failed to write stderr line: %v", err)
	}

	// Read back logs
	logs, err := lc.TailLogs(10)
	if err != nil {
		t.Fatalf("failed to tail logs: %v", err)
	}

	if len(logs) == 0 {
		t.Fatal("no logs found")
	}

	lastLog := logs[len(logs)-1]

	// Verify stderr prefix is in the message
	if !strings.Contains(lastLog.RawLine, "[stderr]") {
		t.Errorf("log does not contain [stderr] prefix: %s", lastLog.RawLine)
	}

	// Verify it's detected as error level
	if lastLog.Level != LogLevelError {
		t.Errorf("stderr log level = %v, want %v", lastLog.Level, LogLevelError)
	}

	t.Logf("Stderr log correctly parsed: level=%s, message=%s", lastLog.Level, lastLog.Message)
}

// TestSubscriberBroadcast tests non-blocking broadcast to multiple subscribers
func TestSubscriberBroadcast(t *testing.T) {
	tmpDir := t.TempDir()
	logger := zap.NewNop()

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

	// Create multiple subscribers
	sub1, err := lc.Subscribe("sub1", 10, nil)
	if err != nil {
		t.Fatalf("failed to subscribe sub1: %v", err)
	}

	sub2, err := lc.Subscribe("sub2", 10, nil)
	if err != nil {
		t.Fatalf("failed to subscribe sub2: %v", err)
	}

	// Subscribe with level filter (only errors)
	errorFilter := func(entry LogEntry) bool {
		return entry.Level == LogLevelError
	}
	sub3, err := lc.Subscribe("sub3", 10, errorFilter)
	if err != nil {
		t.Fatalf("failed to subscribe sub3: %v", err)
	}

	// Write info log
	infoMsg := `{"time":"2024-01-15T10:30:00Z","level":"info","msg":"test info"}`
	if err := lc.WriteLine(infoMsg); err != nil {
		t.Fatalf("failed to write info log: %v", err)
	}

	// Write error log
	errorMsg := `{"time":"2024-01-15T10:30:01Z","level":"error","msg":"test error"}`
	if err := lc.WriteLine(errorMsg); err != nil {
		t.Fatalf("failed to write error log: %v", err)
	}

	// Give time for broadcast
	time.Sleep(100 * time.Millisecond)

	// Check sub1 received both messages
	select {
	case entry := <-sub1.Channel:
		if entry.Level != LogLevelInfo {
			t.Errorf("sub1: expected info log first, got %v", entry.Level)
		}
	case <-time.After(1 * time.Second):
		t.Error("sub1: timeout waiting for info log")
	}

	select {
	case entry := <-sub1.Channel:
		if entry.Level != LogLevelError {
			t.Errorf("sub1: expected error log second, got %v", entry.Level)
		}
	case <-time.After(1 * time.Second):
		t.Error("sub1: timeout waiting for error log")
	}

	// Check sub2 received both messages
	select {
	case <-sub2.Channel:
	case <-time.After(1 * time.Second):
		t.Error("sub2: timeout waiting for first log")
	}

	select {
	case <-sub2.Channel:
	case <-time.After(1 * time.Second):
		t.Error("sub2: timeout waiting for second log")
	}

	// Check sub3 only received error message (due to filter)
	select {
	case entry := <-sub3.Channel:
		if entry.Level != LogLevelError {
			t.Errorf("sub3: expected only error log, got %v", entry.Level)
		}
	case <-time.After(1 * time.Second):
		t.Error("sub3: timeout waiting for error log")
	}

	// Verify sub3 doesn't receive any more messages (info was filtered)
	select {
	case entry := <-sub3.Channel:
		t.Errorf("sub3: received unexpected message: %v", entry)
	case <-time.After(200 * time.Millisecond):
		// Expected - no more messages
	}

	// Cleanup
	lc.Unsubscribe("sub1")
	lc.Unsubscribe("sub2")
	lc.Unsubscribe("sub3")

	// Verify subscriber count
	if count := lc.GetSubscriberCount(); count != 0 {
		t.Errorf("subscriber count after unsubscribe = %d, want 0", count)
	}

	t.Log("Subscriber broadcast test passed: all subscribers received correct messages")
}

// TestConcurrentWrites tests thread-safety of concurrent log writes
func TestConcurrentWrites(t *testing.T) {
	tmpDir := t.TempDir()
	logger := zap.NewNop()

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

	// Spawn multiple goroutines writing concurrently
	numWriters := 10
	writesPerWriter := 100
	done := make(chan bool, numWriters)

	for i := 0; i < numWriters; i++ {
		go func(writerID int) {
			defer func() { done <- true }()

			for j := 0; j < writesPerWriter; j++ {
				msg := fmt.Sprintf(`{"level":"info","msg":"writer %d message %d"}`, writerID, j)
				if err := lc.WriteLine(msg); err != nil {
					t.Errorf("writer %d failed to write: %v", writerID, err)
					return
				}
			}
		}(i)
	}

	// Wait for all writers to complete
	for i := 0; i < numWriters; i++ {
		<-done
	}

	// Verify logs were written
	logs, err := lc.TailLogs(1000)
	if err != nil {
		t.Fatalf("failed to tail logs: %v", err)
	}

	totalExpected := numWriters * writesPerWriter
	if len(logs) < totalExpected {
		t.Errorf("got %d log entries, want at least %d", len(logs), totalExpected)
	}

	t.Logf("Concurrent write test passed: %d entries written by %d writers", len(logs), numWriters)
}
